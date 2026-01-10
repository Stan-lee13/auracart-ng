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

  // In production, we log to console which Supabase captures.
  // For advanced monitoring, you would integrate Sentry here.
  // Since we are making this production ready without external deps for now,
  // we ensure structured logging that can be parsed by Supabase Log Explorer.
  console.error(JSON.stringify(errorData));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Environment validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');

    if (!supabaseUrl || !supabaseKey) {
      logError(new Error('Missing Supabase environment variables'), 'env_validation');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!paystackSecretKey) {
      logError(new Error('Missing Paystack secret key'), 'env_validation');
      return new Response(JSON.stringify({ error: 'Payment service unavailable' }), {
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

    const { email, items, shippingAddress } = requestData;

    // Input validation
    if (!email || !items || !shippingAddress) {
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

    // Initialize Paystack payment
    let paystackResponse;
    try {
      paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: Math.round(calculatedTotal * 100), // Convert to kobo/cents
          currency: 'NGN',
          metadata: {
            order_number: orderNumber,
            user_id: user.id,
            items: JSON.stringify(validatedItems),
            shipping_address: JSON.stringify(shippingAddress),
          },
        }),
      });
    } catch (paystackError) {
      logError(paystackError, 'paystack_api_call', user.id);
      return new Response(JSON.stringify({ error: 'Payment service unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let paystackData;
    try {
      paystackData = await paystackResponse.json();
    } catch (parseError) {
      logError(parseError, 'paystack_response_parsing', user.id);
      return new Response(JSON.stringify({ error: 'Payment service error' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!paystackData.status) {
      logError(new Error(paystackData.message || 'Paystack initialization failed'), 'paystack_initialization', user.id);
      return new Response(JSON.stringify({ error: paystackData.message || 'Payment initialization failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create pending order in database
    try {
      const { error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        order_number: orderNumber,
        items: validatedItems,
        total_amount: calculatedTotal,
        currency: 'NGN',
        shipping_address: shippingAddress,
        status: 'pending',
        payment_status: 'pending',
        fulfillment_status: 'pending',
      });

      if (orderError) {
        logError(orderError, 'database_order_creation', user.id);
        throw orderError;
      }
    } catch (orderError) {
      logError(orderError, 'order_creation', user.id);
      return new Response(JSON.stringify({ error: 'Failed to create order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
      order_number: orderNumber,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    logError(error, 'general_error');
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});