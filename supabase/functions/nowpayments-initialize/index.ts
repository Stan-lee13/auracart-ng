import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Error logging function
function logError(error: any, context: string, userId?: string) {
  const errorData = {
    timestamp: new Date().toISOString(),
    context,
    error: error.message || error,
    userId,
    environment: Deno.env.get('ENVIRONMENT') || 'development',
  };

  // In production, send to logging service
  if (Deno.env.get('ENVIRONMENT') === 'production') {
    console.error('Production Error:', JSON.stringify(errorData));
  } else {
    console.error('Development Error:', errorData);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Environment validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const nowPaymentsApiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    const frontendUrl = Deno.env.get('FRONTEND_URL');

    if (!supabaseUrl || !supabaseKey || !nowPaymentsApiKey) {
      logError(new Error('Missing environment variables'), 'env_validation');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authentication validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    let user;

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      user = authUser;
    } catch (authError) {
      logError(authError, 'auth_validation');
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Request validation
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      logError(parseError, 'request_parsing', user.id);
      return new Response(JSON.stringify({ error: 'Invalid request format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { items, shippingAddress, payCurrency = 'USDT' } = requestData;

    // Input validation
    if (!items || !shippingAddress) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid items' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Server-side price calculation
    const productIds = items.map((item: any) => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, final_price, title')
      .in('id', productIds);

    if (productsError || !products) {
      logError(productsError || new Error('Failed to fetch products'), 'price_calculation', user.id);
      return new Response(JSON.stringify({ error: 'Failed to validate products' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const productMap = new Map(products.map((p: any) => [p.id, p]));
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return new Response(JSON.stringify({ error: `Product not found: ${item.product_id}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const itemTotal = (product.final_price || 0) * item.quantity;
      calculatedTotal += itemTotal;

      validatedItems.push({
        ...item,
        price: product.final_price, // Enforce server price
        title: product.title
      });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create pending order in database
    let orderId;
    try {
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        order_number: orderNumber,
        items: validatedItems,
        total_amount: calculatedTotal,
        currency: 'NGN', // Assuming base currency is NGN
        shipping_address: shippingAddress,
        status: 'pending',
        payment_status: 'pending',
        fulfillment_status: 'pending',
      }).select('id').single();

      if (orderError) {
        logError(orderError, 'database_order_creation', user.id);
        throw orderError;
      }
      orderId = order.id;
    } catch (orderError) {
      logError(orderError, 'order_creation', user.id);
      return new Response(JSON.stringify({ error: 'Failed to create order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize NowPayments payment
    try {
      const response = await fetch('https://api.nowpayments.io/v1/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': nowPaymentsApiKey,
        },
        body: JSON.stringify({
          price_amount: calculatedTotal,
          price_currency: 'NGN', // Base currency
          pay_currency: payCurrency,
          ipn_callback_url: `${supabaseUrl}/functions/v1/nowpayments-webhook`,
          order_id: orderId,
          order_description: `Order ${orderNumber}`,
          success_url: `${frontendUrl}/payment-success?order=${orderId}`,
          cancel_url: `${frontendUrl}/checkout?cancelled=true`,
        }),
      });

      const paymentData = await response.json();

      if (!response.ok) {
        throw new Error(paymentData.message || 'NowPayments API error');
      }

      // Store crypto payment record
      const { error: cryptoError } = await supabase
        .from('crypto_payments')
        .insert({
          order_id: orderId,
          payment_id: paymentData.payment_id,
          payment_status: paymentData.payment_status,
          pay_address: paymentData.pay_address,
          price_amount: calculatedTotal,
          price_currency: 'NGN',
          pay_amount: paymentData.pay_amount,
          pay_currency: payCurrency,
          payin_extra_id: paymentData.payin_extra_id,
        });

      if (cryptoError) {
        logError(cryptoError, 'crypto_payment_storage', user.id);
        // Don't fail the request if just storage fails, but log it
      }

      return new Response(JSON.stringify({
        success: true,
        payment_id: paymentData.payment_id,
        pay_address: paymentData.pay_address,
        pay_amount: paymentData.pay_amount,
        payment_url: paymentData.payment_url || paymentData.invoice_url, // Some APIs return invoice_url
        order_number: orderNumber,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (paymentError: any) {
      logError(paymentError, 'nowpayments_initialization', user.id);
      return new Response(JSON.stringify({ error: paymentError.message || 'Payment service unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    logError(error, 'general_error');
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});