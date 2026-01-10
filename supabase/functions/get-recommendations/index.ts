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

        const { productId } = await req.json();

        if (!productId) {
            throw new Error('Product ID is required');
        }

        // 1. Get the source product
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('title, category, description')
            .eq('id', productId)
            .single();

        if (productError || !product) {
            throw new Error('Product not found');
        }

        // 2. Extract keywords (simple implementation)
        // Remove special chars, split by space, filter short words
        const keywords = product.title
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter((w: string) => w.length > 3)
            .slice(0, 5); // Take top 5 keywords

        // 3. Search for similar products
        let query = supabase
            .from('products')
            .select('*')
            .neq('id', productId) // Exclude current product
            .eq('stock_status', 'in_stock')
            .limit(4);

        if (product.category) {
            // Prioritize same category
            query = query.eq('category', product.category);
        }

        // Add text search if keywords exist
        if (keywords.length > 0) {
            const searchString = keywords.join(' | '); // OR search
            // Note: This assumes 'title' or 'description' can be searched. 
            // If full text search isn't enabled, we might need .or() with ilike
            // But .textSearch is better if configured. 
            // Fallback to .or() for compatibility without FTS config
            const orClause = keywords.map((k: string) => `title.ilike.%${k}%`).join(',');
            query = query.or(orClause);
        }

        const { data: recommendations, error: searchError } = await query;

        if (searchError) {
            throw searchError;
        }

        return new Response(JSON.stringify({ recommendations: recommendations || [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Error getting recommendations:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
