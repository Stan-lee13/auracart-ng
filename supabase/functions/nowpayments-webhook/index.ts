import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const webhookData = await req.json();
    console.log('NowPayments webhook received:', webhookData);

    const { payment_id, payment_status, actually_paid, pay_address, order_id } = webhookData;

    // Update crypto payment record
    const { data: cryptoPayment, error: cryptoError } = await supabase
      .from('crypto_payments')
      .update({
        payment_status: payment_status,
        pay_amount: actually_paid,
      })
      .eq('payment_id', payment_id)
      .select()
      .single();

    if (cryptoError) {
      throw cryptoError;
    }

    // If payment is confirmed, update the order
    if (payment_status === 'confirmed' || payment_status === 'finished') {
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing',
        })
        .eq('id', cryptoPayment.order_id);

      if (orderError) {
        throw orderError;
      }

      // Trigger order fulfillment automation
      await supabase.functions.invoke('auto-fulfill-order', {
        body: { orderId: cryptoPayment.order_id },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error processing NowPayments webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});