import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Missing orderId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!order.tracking_number) {
      return new Response(JSON.stringify({ error: 'No tracking number available for this order' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log automation start
    const { data: automationLog } = await supabase
      .from('automation_logs')
      .insert({
        automation_type: 'tracking_sync',
        status: 'running',
        details: { order_id: orderId, tracking_number: order.tracking_number },
      })
      .select()
      .single();

    // Fetch real-time tracking from AliExpress if available
    const appKey = Deno.env.get('ALIEXPRESS_APP_KEY');
    const appSecret = Deno.env.get('ALIEXPRESS_APP_SECRET');
    let trackingEvents = 0;
    let currentStatus = order.tracking_status || 'processing';

    if (appKey && appSecret && order.tracking_number) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: credentials } = await supabase
          .from('supplier_credentials')
          .select('access_token')
          .eq('supplier_type', 'aliexpress')
          .maybeSingle();

        if (credentials?.access_token) {
          const timestamp = Date.now().toString();
          const params: Record<string, string> = {
            app_key: appKey,
            method: 'aliexpress.trade.logistics.query',
            sign_method: 'sha256',
            timestamp,
            v: '2.0',
            access_token: credentials.access_token,
            tracking_number: order.tracking_number,
          };

          const signStr = appSecret +
            Object.keys(params)
              .sort()
              .map(key => `${key}${params[key]}`)
              .join('') +
            appSecret;

          const encoder = new TextEncoder();
          const data = encoder.encode(signStr);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const sign = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

          params.sign = sign;

          const response = await fetch(`https://api-sg.aliexpress.com/sync?${new URLSearchParams(params).toString()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });

          const responseData = await response.json();
          const result = responseData.aliexpress_trade_logistics_query_response;
          if (result?.tracking_status) {
            currentStatus = result.tracking_status;
            trackingEvents = result.events?.length || 0;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch live tracking:', e);
      }
    }

    // Update order tracking status
    const trackingResult = {
      tracking_updated: true,
      current_status: currentStatus,
      tracking_events: trackingEvents,
    };

    // Update order with sync time
    await supabase
      .from('orders')
      .update({
        last_tracking_sync_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // Update automation log
    if (automationLog) {
      await supabase
        .from('automation_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          details: trackingResult,
        })
        .eq('id', automationLog.id);
    }

    return new Response(JSON.stringify({
      success: true,
      ...trackingResult,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in tracking sync:', error);
    
    // Update automation log with error
    await supabase
      .from('automation_logs')
      .insert({
        automation_type: 'tracking_sync',
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      });

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
