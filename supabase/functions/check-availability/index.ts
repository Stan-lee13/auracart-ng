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

    const { productId, clientIp } = await req.json();

    // Get user's country from IP
    const userCountry = await getCountryFromIp(clientIp);

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    // Check availability
    const availability = checkProductAvailability(product, userCountry);

    return new Response(JSON.stringify({
      success: true,
      product_id: productId,
      user_country: userCountry,
      supplier: 'aliexpress',
      is_available: availability.is_available,
      restriction_reason: availability.reason,
      alternative_message: availability.alternative_message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in availability check:', error);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Get country from IP address
async function getCountryFromIp(ip: string): Promise<string> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success' && data.countryCode) {
        return data.countryCode;
      }
    }
    
    return 'US'; // Default to US
  } catch (error) {
    console.error('Error getting country from IP:', error);
    return 'US';
  }
}

// Check product availability
function checkProductAvailability(product: Record<string, unknown>, userCountry: string) {
  // AliExpress ships globally, so check stock status
  if (product.stock_status === 'out_of_stock') {
    return {
      is_available: false,
      reason: 'out_of_stock',
      alternative_message: "This product is currently out of stock.",
    };
  }

  // Product is available - AliExpress ships worldwide
  return {
    is_available: true,
    reason: null,
    alternative_message: null,
  };
}
