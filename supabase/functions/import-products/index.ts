import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { category, maxProducts = 50 } = await req.json();

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!userRole) {
      throw new Error('Admin access required');
    }

    // Log automation start
    const { data: automationLog } = await supabase
      .from('automation_logs')
      .insert({
        automation_type: 'product_import',
        status: 'running',
        details: {
          supplier: 'aliexpress',
          category,
          max_products: maxProducts,
        },
      })
      .select()
      .single();

    const importResult = await importAliExpressProducts(category, maxProducts, supabase);

    // Update automation log
    if (automationLog) {
      await supabase
        .from('automation_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          details: {
            ...importResult,
            supplier: 'aliexpress',
            category,
            max_products: maxProducts,
          },
        })
        .eq('id', automationLog.id);
    }

    return new Response(JSON.stringify({
      success: true,
      products_imported: importResult.products_imported,
      products_skipped: importResult.products_skipped,
      errors: importResult.errors,
      import_summary: importResult.import_summary,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in product import:', error);

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// AliExpress product import
// deno-lint-ignore no-explicit-any
async function importAliExpressProducts(category: string, maxProducts: number, supabase: any) {
  console.log('Importing AliExpress products...', { category, maxProducts });

  const results = {
    products_imported: 0,
    products_skipped: 0,
    errors: [] as string[],
    import_summary: [] as string[],
  };

  try {
    // Get stored credentials
    const { data: credentials } = await supabase
      .from('supplier_credentials')
      .select('access_token')
      .eq('supplier_type', 'aliexpress')
      .maybeSingle();

    if (!credentials || !credentials.access_token) {
      results.errors.push('AliExpress not authenticated. Please complete OAuth flow.');
      return results;
    }

    const appKey = Deno.env.get('ALIEXPRESS_APP_KEY');
    const appSecret = Deno.env.get('ALIEXPRESS_APP_SECRET');

    if (!appKey || !appSecret) {
      results.errors.push('ALIEXPRESS_APP_KEY or ALIEXPRESS_APP_SECRET not configured');
      return results;
    }

    // Search for products using AliExpress Open API
    const timestamp = Date.now().toString();
    const params: Record<string, string> = {
      app_key: appKey,
      method: 'aliexpress.affiliate.product.query',
      sign_method: 'sha256',
      timestamp,
      v: '2.0',
      access_token: credentials.access_token,
      keywords: category || 'bestselling',
      page_size: String(Math.min(maxProducts, 50)),
      sort: 'SALE_PRICE_ASC',
    };

    // Generate signature
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

    const productsResponse = responseData.aliexpress_affiliate_product_query_response;
    if (!productsResponse?.resp_result?.result?.products?.product) {
      console.warn('No products found in response', responseData);
      return results;
    }

    const products = productsResponse.resp_result.result.products.product;
    console.log(`Found ${products.length} products to import.`);

    // Process and Insert Products
    for (const p of products) {
      try {
        // Check if product exists
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('aliexpress_product_id', String(p.product_id))
          .maybeSingle();

        if (existing) {
          results.products_skipped++;
          continue;
        }

        // Prepare product for DB
        const markupMultiplier = 2.0;
        const supplierCost = parseFloat(p.target_sale_price || p.target_original_price || '0');

        const dbProduct = {
          title: p.product_title,
          description: p.product_title,
          supplier_cost: supplierCost,
          markup_multiplier: markupMultiplier,
          final_price: supplierCost * markupMultiplier,
          images: [p.product_main_image_url, ...(p.product_small_image_urls?.string || [])],
          supplier_sku: String(p.product_id),
          supplier: 'aliexpress',
          category: category || 'general',
          stock_status: 'in_stock',
          aliexpress_product_id: String(p.product_id),
        };

        const { error: insertError } = await supabase
          .from('products')
          .insert(dbProduct);

        if (insertError) {
          throw insertError;
        }

        results.products_imported++;
        results.import_summary.push(`Imported: ${p.product_id} - ${p.product_title?.substring(0, 30)}...`);

      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Failed to import product ${p.product_id}:`, err);
        results.errors.push(`Product ${p.product_id}: ${errMessage}`);
      }
    }

  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Import process failed:', error);
    results.errors.push(`Global failure: ${errMessage}`);
  }

  return results;
}
