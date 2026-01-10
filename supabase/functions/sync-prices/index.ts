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
  // Get all AliExpress products from our database
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('supplier', 'aliexpress');

  let updated = 0;
  const priceChanges: { product_id: string; old_price: number; new_price: number }[] = [];
  const errors: { product_id: string; error: string }[] = [];

  for (const product of products || []) {
    try {
      // Update product sync status
      await supabase
        .from('products')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      updated++;
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error syncing AliExpress product price ${product.id}:`, error);
      errors.push({ product_id: product.id, error: errMessage });
    }
  }

  return { products_updated: updated, price_changes: priceChanges, errors };
}
