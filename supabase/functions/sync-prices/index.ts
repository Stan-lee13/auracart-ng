import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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
        automation_type: 'price_sync',
        status: 'running',
        details: { supplier: 'aliexpress' },
      })
      .select()
      .single();

    const syncResult = await syncAliExpressPrices(supabase);

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
      price_changes: syncResult.price_changes,
      errors: syncResult.errors,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in price sync:', error);
    
    // Update automation log with error
    await supabase
      .from('automation_logs')
      .insert({
        automation_type: 'price_sync',
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

// AliExpress price sync
// deno-lint-ignore no-explicit-any
async function syncAliExpressPrices(supabase: any) {
  // Get stored credentials
  const { data: credentials } = await supabase
    .from('supplier_credentials')
    .select('access_token')
    .eq('supplier_type', 'aliexpress')
    .maybeSingle();

  if (!credentials || !credentials.access_token) {
    throw new Error('AliExpress not authenticated. Please complete OAuth flow.');
  }

  const appKey = Deno.env.get('ALIEXPRESS_APP_KEY');
  const appSecret = Deno.env.get('ALIEXPRESS_APP_SECRET');

  if (!appKey || !appSecret) {
    throw new Error('AliExpress API credentials not configured');
  }

  // Get all AliExpress products from our database
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('supplier', 'aliexpress');

  let updated = 0;
  const priceChanges: { product_id: string; old_price: number; new_price: number; old_supplier_cost: number; new_supplier_cost: number }[] = [];
  const errors: { product_id: string; error: string }[] = [];

  for (const product of products || []) {
    try {
      // Fetch real price from AliExpress API
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
        const newSupplierCost = Number(aeProduct.price || product.supplier_cost);
        const oldSupplierCost = Number(product.supplier_cost);
        const markupMultiplier = Number(product.markup_multiplier) || 1.5;
        const newFinalPrice = newSupplierCost * markupMultiplier;
        const oldFinalPrice = Number(product.final_price);

        // Check if price changed
        if (newSupplierCost !== oldSupplierCost) {
          priceChanges.push({
            product_id: product.id,
            old_price: oldFinalPrice,
            new_price: newFinalPrice,
            old_supplier_cost: oldSupplierCost,
            new_supplier_cost: newSupplierCost,
          });

          // Update product with new price
          await supabase
            .from('products')
            .update({
              supplier_cost: newSupplierCost,
              final_price: newFinalPrice,
              updated_at: new Date().toISOString(),
              last_sync_at: new Date().toISOString(),
              sync_status: 'synced',
            })
            .eq('id', product.id);
        } else {
          // Just update sync timestamp
          await supabase
            .from('products')
            .update({
              updated_at: new Date().toISOString(),
              last_sync_at: new Date().toISOString(),
              sync_status: 'synced',
            })
            .eq('id', product.id);
        }
      } else {
        throw new Error('No product data from AliExpress');
      }

      updated++;
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error syncing AliExpress product price ${product.id}:`, error);
      errors.push({ product_id: product.id, error: errMessage });
    }
  }

  return { products_updated: updated, price_changes: priceChanges, errors };
}
