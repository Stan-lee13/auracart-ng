import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'temporary-secret-key-replace-me';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('SERVER ERROR: Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error. Missing database keys.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: adminData, error: dbError } = await supabase
      .from('admin_keys')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (dbError || !adminData) {
      console.error('LOGIN ERROR: Admin not found', username);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials or user not setup.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validPassword = await bcrypt.compare(password, adminData.password_hash);

    if (!validPassword) {
      console.error('LOGIN ERROR: Password mismatch', username);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Double check authorized email
    if (adminData.username.toLowerCase() !== 'stanleyvic13@gmail.com') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized email access.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create JWT token
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const token = await create(
      { alg: "HS256", typ: "JWT" },
      {
        username: adminData.username,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
      },
      key
    );

    return new Response(
      JSON.stringify({
        success: true,
        token,
        username: adminData.username
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (err: any) {
    console.error('EXCEPTION:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Login failed due to a server error.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
