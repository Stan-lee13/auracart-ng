import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AliExpressTokenResponse {
  access_token: string;
  refresh_token: string;
  expire_time: number;
  refresh_token_valid_time: number;
  user_id: string;
  user_nick: string;
  locale: string;
  sp: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    // AliExpress OAuth callback comes with 'code' parameter
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    console.log('AliExpress OAuth callback received:', {
      hasCode: !!code,
      state,
      params: Object.fromEntries(url.searchParams.entries())
    });

    if (!code) {
      // Check if this is an error callback
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');

      if (error) {
        console.error('AliExpress OAuth error:', { error, errorDescription });
        return Response.redirect(
          `${Deno.env.get('SITE_URL') || 'https://ctjattuedycmgewumqeh.lovableproject.com'}/stanley?oauth_error=${encodeURIComponent(errorDescription || error)}`,
          302
        );
      }

      return new Response(
        JSON.stringify({ error: 'No authorization code received' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const appKey = Deno.env.get('ALIEXPRESS_APP_KEY');
    const appSecret = Deno.env.get('ALIEXPRESS_APP_SECRET');

    if (!appKey || !appSecret) {
      console.error('Missing AliExpress credentials');
      return new Response(
        JSON.stringify({ error: 'AliExpress credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exchange authorization code for access token
    const tokenEndpoint = 'https://api-sg.aliexpress.com/sync';
    const timestamp = Date.now().toString();

    // Build request parameters
    const params: Record<string, string> = {
      app_key: appKey,
      method: 'aliexpress.open.system.token.create',
      sign_method: 'sha256',
      timestamp,
      v: '2.0',
      code,
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

    console.log('Exchanging code for token...');

    // Make token request
    const tokenResponse = await fetch(`${tokenEndpoint}?${new URLSearchParams(params).toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokenData = await tokenResponse.json();
    console.log('Token response received:', {
      success: !tokenData.error_response,
      hasAccessToken: !!tokenData.aliexpress_open_system_token_create_response?.access_token
    });

    if (tokenData.error_response) {
      console.error('Token exchange error:', tokenData.error_response);
      return Response.redirect(
        `${Deno.env.get('SITE_URL') || 'https://ctjattuedycmgewumqeh.lovableproject.com'}/stanley?oauth_error=${encodeURIComponent(tokenData.error_response.msg || 'Token exchange failed')}`,
        302
      );
    }

    const tokenResult = tokenData.aliexpress_open_system_token_create_response;

    if (!tokenResult?.access_token) {
      console.error('No access token in response');
      return Response.redirect(
        `${Deno.env.get('SITE_URL') || 'https://ctjattuedycmgewumqeh.lovableproject.com'}/stanley?oauth_error=No access token received`,
        302
      );
    }

    // Store tokens in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: upsertError } = await supabase
      .from('supplier_credentials')
      .upsert({
        supplier_type: 'aliexpress',
        access_token: tokenResult.access_token,
        refresh_token: tokenResult.refresh_token,
        token_expires_at: new Date(Date.now() + (tokenResult.expire_time * 1000)).toISOString(),
        refresh_token_expires_at: new Date(Date.now() + (tokenResult.refresh_token_valid_time * 1000)).toISOString(),
        user_id: tokenResult.user_id,
        user_nick: tokenResult.user_nick,
        locale: tokenResult.locale,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'supplier_type'
      });

    if (upsertError) {
      console.error('Failed to store tokens:', upsertError);
      // Still redirect but with warning
      return Response.redirect(
        `${Deno.env.get('SITE_URL') || 'https://ctjattuedycmgewumqeh.lovableproject.com'}/stanley?oauth_success=true&oauth_warning=Token storage failed`,
        302
      );
    }

    console.log('AliExpress OAuth completed successfully');

    // Redirect to admin with success message
    return Response.redirect(
      `${Deno.env.get('SITE_URL') || 'https://ctjattuedycmgewumqeh.lovableproject.com'}/stanley?oauth_success=true&supplier=aliexpress`,
      302
    );

  } catch (error: unknown) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.redirect(
      `${Deno.env.get('SITE_URL') || 'https://ctjattuedycmgewumqeh.lovableproject.com'}/stanley?oauth_error=${encodeURIComponent(errorMessage)}`,
      302
    );
  }
});
