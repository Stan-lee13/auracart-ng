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
    // Log automation start
    const { data: automationLog } = await supabase
      .from('automation_logs')
      .insert({
        automation_type: 'inventory_sync',
        status: 'running',
        details: { supplier: 'aliexpress' },
      })
      .select()
      .single();

    const syncResult = await syncAliExpressInventory(supabase);

    // Update automation log
    if (automationLog) {
      await supabase
        .from('automation_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          details: { ...syncResult, supplier: 'aliexpress' },
        })
        .eq('id', automationLog.id);
    }

    return new Response(JSON.stringify({
      success: true,
      products_updated: syncResult.products_updated,
      products_added: syncResult.products_added,
      errors: syncResult.errors,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in inventory sync:', error);

    // Update automation log with error
    await supabase
      .from('automation_logs')
      .insert({
        automation_type: 'inventory_sync',
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

// AliExpress inventory sync
// deno-lint-ignore no-explicit-any
async function syncAliExpressInventory(supabase: any) {
  // Get stored credentials
  const { data: credentials } = await supabase
    .from('supplier_credentials')
    .select('access_token')
    .eq('supplier_type', 'aliexpress')
    .maybeSingle();

  if (!credentials || !credentials.access_token) {
    throw new Error('AliExpress not authenticated. Please complete OAuth flow.');
  }

  // Get all AliExpress products from our database
  const { data: products } = await supabase
    .from('products')
    .select('id, aliexpress_product_id, supplier_cost, markup_multiplier')
    .eq('supplier', 'aliexpress');

  let updated = 0;
  let added = 0;
  const errors: { product_id: string; error: string }[] = [];

  for (const product of (products || [])) {
    try {
      // Fetch real inventory from AliExpress API
      const appKey = Deno.env.get('ALIEXPRESS_APP_KEY');
      const appSecret = Deno.env.get('ALIEXPRESS_APP_SECRET');

      if (!appKey || !appSecret) {
        throw new Error('AliExpress API credentials not configured');
      }

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

      let stockStatus = 'out_of_stock';
      let stockCount = 0;

      if (result?.product) {
        stockCount = result.product.stock || 0;
        stockStatus = stockCount > 0 ? 'in_stock' : 'out_of_stock';
      }

      // Update product with real inventory data
      await supabase
        .from('products')
        .update({
          stock_status: stockStatus,
          updated_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
          sync_status: 'synced',
        })
        .eq('id', product.id);

      updated++;
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error syncing AliExpress product ${product.id}:`, error);
      errors.push({ product_id: product.id, error: errMessage });
    }
  }

  return { products_updated: updated, products_added: added, errors };
}
