import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      .select('username, password_hash')
      .eq('username', username.toLowerCase())
      .maybeSingle();

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

    const authorizedEmail = 'stanleyvic13@gmail.com';
    if (adminData.username.toLowerCase() !== authorizedEmail) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized email access.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let roleAssigned = false;
    let roleAssignmentMessage = 'Admin credentials verified. Please sign in with your Supabase account.';

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', authorizedEmail)
      .maybeSingle();

    if (profileError) {
      console.error('PROFILE LOOKUP ERROR:', profileError);
    }

    if (profile?.user_id) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert(
          {
            user_id: profile.user_id,
            role: 'admin'
          },
          {
            onConflict: 'user_id'
          }
        );

      if (roleError) {
        console.error('ROLE ASSIGNMENT ERROR:', roleError);
        roleAssignmentMessage = 'Credentials verified, but failed to assign admin role. Please try again.';
      } else {
        roleAssigned = true;
        roleAssignmentMessage = 'Admin access confirmed. Your Supabase account now has admin role.';
      }
    } else {
      roleAssignmentMessage = 'Credentials verified, but no Supabase profile found for this email. Please sign up via /auth first.';
    }

    return new Response(
      JSON.stringify({
        success: true,
        username: adminData.username,
        roleAssigned,
        message: roleAssignmentMessage
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
