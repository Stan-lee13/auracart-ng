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
    const { accessToken, refreshToken, userId, userNick, locale } = await req.json();

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Missing access_token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: upsertError } = await supabase
      .from('supplier_credentials')
      .upsert({
        supplier_type: 'aliexpress',
        access_token: accessToken,
        refresh_token: refreshToken || null,
        token_expires_at: new Date(Date.now() + 3600 * 1000 * 24 * 365).toISOString(),
        refresh_token_expires_at: refreshToken ? new Date(Date.now() + 3600 * 1000 * 24 * 365).toISOString() : null,
        user_id: userId || null,
        user_nick: userNick || null,
        locale: locale || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'supplier_type'
      });

    if (upsertError) {
      console.error('Failed to seed tokens:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store tokens', details: upsertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'AliExpress tokens seeded successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Seed tokens error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
