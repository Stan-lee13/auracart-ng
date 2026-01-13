import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { orderId } = await req.json();

    // 1. Idempotency Check
    const { data: existingLogs } = await supabase
      .from('automation_logs')
      .select('status')
      .eq('details->>orderId', orderId)
      .eq('automation_type', 'order_fulfillment')
      .in('status', ['running', 'completed']);

    if (existingLogs && existingLogs.length > 0) {
      console.log(`Order ${orderId} is already being processed or completed.`);
      return new Response(JSON.stringify({ message: 'Order fulfillment already in progress or completed' }), {
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
      throw new Error('Order not found');
    }

    if (order.payment_status !== 'paid') {
      throw new Error('Order not paid');
    }

    // Log automation start
    const { data: automationLog } = await supabase
      .from('automation_logs')
      .insert({
        automation_type: 'order_fulfillment',
        status: 'running',
        details: { orderId, supplier: 'aliexpress' },
      })
      .select()
      .single();

    try {
      // Fulfill with AliExpress
      const appKey = Deno.env.get('ALIEXPRESS_APP_KEY');
      const appSecret = Deno.env.get('ALIEXPRESS_APP_SECRET');

      if (!appKey || !appSecret) {
        throw new Error('AliExpress API credentials not configured');
      }

      // Get stored access token
      const { data: credentials } = await supabase
        .from('supplier_credentials')
        .select('access_token')
        .eq('supplier_type', 'aliexpress')
        .maybeSingle();

      const credentialsData = credentials as { access_token?: string } | null;

      if (!credentialsData || !credentialsData.access_token) {
        throw new Error('AliExpress not authenticated. Please complete OAuth flow.');
      }

      console.log('Creating AliExpress order for:', order.order_number);

      // Create AliExpress order using official API
      const timestamp = Date.now().toString();
      const orderPayload: Record<string, string> = {
        app_key: appKey,
        method: 'aliexpress.trade.order.create',
        sign_method: 'sha256',
        timestamp,
        v: '2.0',
        access_token: credentialsData.access_token,
        param_place_order_request: JSON.stringify({
          order_items: order.items.map((item: any) => ({
            product_id: item.aliexpress_product_id,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
          })),
          shipping_address: order.shipping_address,
          currency: order.currency || 'USD',
          payment_method: 'CREDIT_CARD',
        }),
      };

      // Generate signature
      const signStr = appSecret +
        Object.keys(orderPayload)
          .sort()
          .map(key => `${key}${orderPayload[key as keyof typeof orderPayload]}`)
          .join('') +
        appSecret;

      const encoder = new TextEncoder();
      const data = encoder.encode(signStr);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sign = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

      orderPayload.sign = sign;

      const response = await fetch('https://api-sg.aliexpress.com/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(orderPayload).toString(),
      });

      const responseData = await response.json();
      if (responseData.error_response) {
        throw new Error(`AliExpress order creation failed: ${responseData.error_response.msg}`);
      }

      const orderResult = responseData.aliexpress_trade_order_create_response;
      if (!orderResult?.order_id) {
        throw new Error('No order ID returned from AliExpress');
      }

      const supplierOrderId = orderResult.order_id;

      // Update order status
      await supabase
        .from('orders')
        .update({
          status: 'processing',
          fulfillment_status: 'processing',
        } as Record<string, unknown>)
        .eq('id', order.id);

      const fulfillmentResult = {
        supplier_order_id: supplierOrderId,
        tracking_number: null as string | null,
      };

      // Update automation log success
      if (automationLog) {
        await supabase
          .from('automation_logs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            details: { ...fulfillmentResult, supplier: 'aliexpress' },
          } as Record<string, unknown>)
          .eq('id', automationLog.id);
      }

      return new Response(JSON.stringify({
        success: true,
        supplier_order_id: fulfillmentResult.supplier_order_id,
        tracking_number: fulfillmentResult.tracking_number,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (processError: unknown) {
      const errorMessage = processError instanceof Error ? processError.message : 'Unknown error';
      
      // Update automation log failure
      if (automationLog) {
        await supabase
          .from('automation_logs')
          .update({
            status: 'failed',
            error_message: errorMessage,
            completed_at: new Date().toISOString(),
          } as Record<string, unknown>)
          .eq('id', automationLog.id);
      }

      throw processError;
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in auto fulfillment:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
