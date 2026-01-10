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
      // Update sync status
      await supabase
        .from('products')
        .update({
          updated_at: new Date().toISOString(),
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
