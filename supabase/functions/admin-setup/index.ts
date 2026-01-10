import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-setup-secret',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('SERVER ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Database credentials missing on server. Check Supabase secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Strictly enforce the specific admin email
    const authorizedEmail = 'stanleyvic13@gmail.com';
    if (!username || username.toLowerCase() !== authorizedEmail) {
      return new Response(
        JSON.stringify({ error: `Unauthorized. ${username} is not the authorized admin email.` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if an admin already exists
    const { count, error: countError } = await supabase
      .from('admin_keys')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('DATABASE ERROR (count):', countError);
      throw new Error(`Database error: ${countError.message}`);
    }

    const setupSecret = Deno.env.get('ADMIN_SETUP_SECRET');
    const requestSecret = req.headers.get('x-admin-setup-secret');

    // If an admin already exists, we require the secret to update it
    if (count && count > 0) {
      if (!setupSecret || setupSecret !== requestSecret) {
        return new Response(
          JSON.stringify({ error: 'Admin already exists. Secret required for updates.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!password || password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password);

    // Upsert admin
    const { error: upsertError } = await supabase
      .from('admin_keys')
      .upsert({
        username: username.toLowerCase(),
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'username'
      });

    if (upsertError) {
      console.error('DATABASE ERROR (upsert):', upsertError);
      throw new Error(`Failed to save admin keys: ${upsertError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Admin setup successful' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('EXCEPTION:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
