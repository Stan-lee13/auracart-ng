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
    const body = await req.json();
    const username = body?.username;
    const password = body?.password;
    const assignRole =
      body?.assignRole === undefined ? true : Boolean(body.assignRole);

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

    // Upsert admin credentials
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

    let authUserExists = false;
    let authStatusMessage = 'Supabase auth user not found. Please create an account via /auth first.';
    let profileExists = false;
    let profileCreated = false;
    let profileStatusMessage = 'No Supabase profile found for this email. Please sign up via /auth before assigning admin role.';
    let requiresProfile = true;
    let roleAssigned = false;
    let roleAssignmentMessage = 'Role assignment skipped.';
    let assignRoleAttempted = false;
    let targetUserId: string | null = null;

    // List users and find by email (getUserByEmail doesn't exist in this SDK version)
    const { data: usersData, error: authLookupError } = await supabase.auth.admin.listUsers();
    const foundUser = usersData?.users?.find((u: { email?: string }) => u.email?.toLowerCase() === authorizedEmail.toLowerCase()) || null;

    if (authLookupError) {
      console.error('AUTH LOOKUP ERROR:', authLookupError);
      authStatusMessage = 'Unable to verify Supabase auth user due to an authentication lookup error.';
    } else if (foundUser) {
      authUserExists = true;
      targetUserId = foundUser.id;
      authStatusMessage = 'Supabase auth user located.';
    }

    if (targetUserId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (profileError) {
        console.error('PROFILE LOOKUP ERROR:', profileError);
        profileStatusMessage = 'Unable to verify Supabase profile due to a database error.';
      } else if (profile?.user_id) {
        profileExists = true;
        requiresProfile = false;
        profileStatusMessage = 'Supabase profile located.';
      } else {
        const { data: ensuredProfile, error: profileUpsertError } = await supabase
          .from('profiles')
          .upsert(
            {
              user_id: targetUserId,
              email: authorizedEmail,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id' }
          )
          .select('user_id')
          .maybeSingle();

        if (profileUpsertError) {
          console.error('PROFILE UPSERT ERROR:', profileUpsertError);
          profileStatusMessage = 'Supabase auth user found, but failed to create profile automatically.';
        } else if (ensuredProfile?.user_id) {
          profileExists = true;
          profileCreated = true;
          requiresProfile = false;
          profileStatusMessage = 'Supabase profile created for this account.';
        }
      }
    }

    if (!targetUserId) {
      profileStatusMessage = 'Supabase auth user not found. Please sign up/in via /auth before assigning admin role.';
    }

    if (assignRole && targetUserId && profileExists) {
      assignRoleAttempted = true;
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert(
          {
            user_id: targetUserId,
            role: 'admin'
          },
          { onConflict: 'user_id' }
        );

      if (roleError) {
        console.error('ROLE ASSIGNMENT ERROR:', roleError);
        roleAssignmentMessage = 'Admin credentials saved, but failed to assign admin role. Please retry once profile exists.';
      } else {
        roleAssigned = true;
        roleAssignmentMessage = 'Admin role assigned to your Supabase account.';
      }
    } else if (assignRole && !authUserExists) {
      roleAssignmentMessage = 'Admin role not assigned because the Supabase auth user does not exist yet.';
    } else if (assignRole && authUserExists && !profileExists) {
      roleAssignmentMessage = 'Admin role not assigned because a Supabase profile could not be ensured.';
    } else if (!assignRole) {
      roleAssignmentMessage = 'Role assignment skipped per request.';
    }

    const summaryMessage = [
      'Admin credentials saved.',
      authStatusMessage,
      profileStatusMessage,
      assignRole ? roleAssignmentMessage : ''
    ]
      .filter(Boolean)
      .join(' ');

    return new Response(
      JSON.stringify({
        success: true,
        message: summaryMessage,
        authUserExists,
        authStatusMessage,
        profileExists,
        profileCreated,
        requiresProfile,
        profileStatusMessage,
        roleAssigned,
        roleAssignmentMessage,
        assignRoleAttempted
      }),
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
