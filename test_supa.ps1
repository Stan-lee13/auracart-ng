$token = 'sbp_3e36aebbe88b0da4d9a094de34eeef88771ac75a'
[System.Environment]::SetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', $token, 'Process')
npx -y supabase secrets list --project-ref mnuppunshelyjezumqtr
