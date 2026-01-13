import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types
type SupplierType = 'aliexpress';

interface SupplierProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  stock?: number;
  supplierUrl?: string;
}

interface SupplierSearchParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
  sort?: string;
}

interface SupplierSearchResponse {
  products: SupplierProduct[];
  total: number;
  hasMore: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, payload } = await req.json();

    let result;

    switch (action) {
      case 'checkHealth':
        result = await checkHealth();
        break;
      case 'searchProducts':
        result = await searchProducts(payload.params, payload.suppliers);
        break;
      case 'compareProducts':
        result = await compareProducts(payload.productIds);
        break;
      case 'getProduct':
        result = await getProduct(payload.productId);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in supplier-operations', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkHealth(): Promise<{ aliexpress: { status: string; healthy: boolean } }> {
  const appKey = Deno.env.get('ALIEXPRESS_APP_KEY');
  return {
    aliexpress: {
      status: appKey ? 'configured' : 'not_configured',
      healthy: !!appKey
    }
  };
}

async function searchProducts(
  params: SupplierSearchParams, 
  suppliers?: SupplierType[]
): Promise<Record<SupplierType, SupplierSearchResponse>> {
  const results: Record<string, SupplierSearchResponse> = {};
  
  const targetSuppliers = suppliers || ['aliexpress'];
  
  for (const supplier of targetSuppliers) {
    if (supplier === 'aliexpress') {
      results.aliexpress = await searchAliExpressProducts(params);
    }
  }
  
  return results as Record<SupplierType, SupplierSearchResponse>;
}

async function searchAliExpressProducts(params: SupplierSearchParams): Promise<SupplierSearchResponse> {
  const appKey = Deno.env.get('ALIEXPRESS_APP_KEY');
  const appSecret = Deno.env.get('ALIEXPRESS_APP_SECRET');
  
  if (!appKey || !appSecret) {
    console.warn('AliExpress API credentials not configured');
    return { products: [], total: 0, hasMore: false };
  }

  try {
    // Get stored access token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: credentials } = await supabase
      .from('supplier_credentials')
      .select('access_token')
      .eq('supplier_type', 'aliexpress')
      .maybeSingle();

    if (!credentials?.access_token) {
      console.warn('AliExpress not authenticated');
      return { products: [], total: 0, hasMore: false };
    }

    const timestamp = Date.now().toString();
    const apiParams: Record<string, string> = {
      app_key: appKey,
      method: 'aliexpress.affiliate.product.query',
      sign_method: 'sha256',
      timestamp,
      v: '2.0',
      access_token: credentials.access_token,
      keywords: params.query || 'popular',
      page_size: String(params.limit || 20),
    };

    // Generate signature
    const signStr = appSecret + 
      Object.keys(apiParams)
        .sort()
        .map(key => `${key}${apiParams[key]}`)
        .join('') + 
      appSecret;

    const encoder = new TextEncoder();
    const data = encoder.encode(signStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sign = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    apiParams.sign = sign;

    const response = await fetch(`https://api-sg.aliexpress.com/sync?${new URLSearchParams(apiParams).toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const responseData = await response.json();
    
    const productsResponse = responseData.aliexpress_affiliate_product_query_response;
    if (!productsResponse?.resp_result?.result?.products?.product) {
      return { products: [], total: 0, hasMore: false };
    }

    const rawProducts = productsResponse.resp_result.result.products.product;
    const products: SupplierProduct[] = rawProducts.map((p: Record<string, unknown>) => ({
      id: String(p.product_id),
      name: String(p.product_title || ''),
      description: String(p.product_title || ''),
      price: parseFloat(String(p.target_sale_price || p.target_original_price || '0')),
      currency: 'USD',
      images: [String(p.product_main_image_url || '')],
      category: String(p.first_level_category_name || 'General'),
      stock: 100,
      supplierUrl: String(p.product_detail_url || ''),
    }));

    return {
      products,
      total: parseInt(String(productsResponse.resp_result.result.total_record_count || '0')),
      hasMore: products.length >= (params.limit || 20)
    };

  } catch (error) {
    console.error('AliExpress search error:', error);
    return { products: [], total: 0, hasMore: false };
  }
}

async function getProduct(productId: string): Promise<SupplierProduct | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch from our database first
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (!product) return null;

  return {
    id: product.id,
    name: product.title,
    description: product.description || '',
    price: Number(product.final_price) || 0,
    currency: 'USD',
    images: Array.isArray(product.images) ? product.images.map((img: any) => img.url || img) : [],
    category: product.category || 'General',
    stock: product.stock_status === 'in_stock' ? 100 : 0,
    supplierUrl: product.supplier_url || '',
  };
}

async function compareProducts(productIds: string[]): Promise<{ comparisons: any[] }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get AliExpress credentials
  const { data: credentials } = await supabase
    .from('supplier_credentials')
    .select('access_token')
    .eq('supplier_type', 'aliexpress')
    .maybeSingle();

  const appKey = Deno.env.get('ALIEXPRESS_APP_KEY');
  const appSecret = Deno.env.get('ALIEXPRESS_APP_SECRET');

  const comparisons = [];

  for (const productId of productIds) {
    // Fetch product details from our database
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) continue;

    let metrics: Record<string, unknown>;
    let recommendation: Record<string, unknown>;

    if (credentials?.access_token && appKey && appSecret) {
      try {
        // Fetch real product details from AliExpress API
        const timestamp = Date.now().toString();
        const params: Record<string, string> = {
          app_key: appKey,
          method: 'aliexpress.trade.product.query',
          sign_method: 'sha256',
          timestamp,
          v: '2.0',
          access_token: credentials.access_token,
          product_id: product.aliexpress_product_id,
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
        const result = responseData.aliexpress_trade_product_query_response;

        if (result?.product) {
          const aeProduct = result.product;
          const supplierCost = Number(aeProduct.price || product.supplier_cost);
          const finalPrice = Number(product.final_price);
          const profitMargin = ((finalPrice - supplierCost) / finalPrice) * 100;

          metrics = {
            price: finalPrice,
            supplier_cost: supplierCost,
            shipping_time: aeProduct.shipping_time || '7-15 days',
            commission_rate: 0.08,
            processing_time: aeProduct.processing_time || '1-2 days',
            availability: aeProduct.stock > 0 ? 'in_stock' : 'out_of_stock',
            total_cost: supplierCost * 1.1,
            profit_margin: Math.round(profitMargin * 100) / 100,
            stock: aeProduct.stock || 0,
            rating: aeProduct.rating || 4.5,
            reviews: aeProduct.reviews || 0,
          };

          // Determine recommendation based on metrics
          recommendation = {
            best_price: profitMargin > 15,
            fastest_shipping: (aeProduct.shipping_time || '').includes('7') || (aeProduct.shipping_time || '').includes('5'),
            best_overall: profitMargin > 15 && aeProduct.stock > 10,
            reason: profitMargin > 20 
              ? 'Excellent profit margin with good availability'
              : profitMargin > 15
              ? 'Good profit margin with reasonable availability'
              : 'Competitive pricing, consider for volume sales',
          };
        } else {
          throw new Error('No product data from AliExpress');
        }
      } catch (error) {
        console.warn(`Failed to fetch AliExpress data for ${productId}, using fallback metrics:`, error);
        metrics = {
          price: product.final_price || 0,
          supplier_cost: product.supplier_cost || 0,
          shipping_time: '7-15 days',
          commission_rate: 0.08,
          processing_time: '1-2 days',
          availability: product.stock_status || 'in_stock',
          total_cost: (product.supplier_cost || 0) * 1.1,
          profit_margin: product.final_price && product.supplier_cost 
            ? Math.round(((product.final_price - product.supplier_cost) / product.final_price) * 10000) / 100
            : 15,
          stock: product.stock_status === 'in_stock' ? 100 : 0,
          rating: 4.5,
          reviews: 0,
        };
        recommendation = {
          best_price: true,
          fastest_shipping: false,
          best_overall: true,
          reason: 'Using cached product data (API unavailable)',
        };
      }
    } else {
      // No AliExpress credentials, use database data
      const supplierCost = Number(product.supplier_cost);
      const finalPrice = Number(product.final_price);
      const profitMargin = supplierCost && finalPrice ? ((finalPrice - supplierCost) / finalPrice) * 100 : 15;

      metrics = {
        price: finalPrice,
        supplier_cost: supplierCost,
        shipping_time: '7-15 days',
        commission_rate: 0.08,
        processing_time: '1-2 days',
        availability: product.stock_status || 'in_stock',
        total_cost: supplierCost * 1.1,
        profit_margin: Math.round(profitMargin * 100) / 100,
        stock: product.stock_status === 'in_stock' ? 100 : 0,
        rating: 4.5,
        reviews: 0,
      };
      recommendation = {
        best_price: profitMargin > 15,
        fastest_shipping: false,
        best_overall: profitMargin > 15,
        reason: 'Based on stored product data - connect AliExpress for live metrics',
      };
    }

    comparisons.push({
      product_id: productId,
      metrics,
      recommendation,
    });
  }

  return { comparisons };
}
