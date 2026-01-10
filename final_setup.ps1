$Env:SUPABASE_ACCESS_TOKEN = 'sbp_3e36aebbe88b0da4d9a094de34eeef88771ac75a'
Write-Host "Setting Secrets..."
npx -y supabase secrets set --project-ref mnuppunshelyjezumqtr SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udXBwdW5zaGVseWplenVtcXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAwMjMxMywiZXhwIjoyMDgzNTc4MzEzfQ.KIz91EkSVqxl-3zfqNc3FVutczPUJ7A6-5dp0QRD0rk' JWT_SECRET='stanley-jwt-secret-999' ADMIN_SETUP_SECRET='stanley-setup-secret-777'
Write-Host "Deploying admin-setup..."
npx -y supabase functions deploy admin-setup --project-ref mnuppunshelyjezumqtr
Write-Host "Deploying admin-login..."
npx -y supabase functions deploy admin-login --project-ref mnuppunshelyjezumqtr
Write-Host "Deploying admin-verify..."
npx -y supabase functions deploy admin-verify --project-ref mnuppunshelyjezumqtr
Write-Host "DONE!"
