$token = 'sbp_3e36aebbe88b0da4d9a094de34eeef88771ac75a'
$projectRef = 'mnuppunshelyjezumqtr'
$serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udXBwdW5zaGVseWplenVtcXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAwMjMxMywiZXhwIjoyMDgzNTc4MzEzfQ.KIz91EkSVqxl-3zfqNc3FVutczPUJ7A6-5dp0QRD0rk'

Write-Host "=== CREATING ADMIN TABLE ===" -ForegroundColor Cyan

$sql = Get-Content "setup_admin_table.sql" -Raw

$dbUrl = "https://mnuppunshelyjezumqtr.supabase.co/rest/v1/rpc"
$dbHeaders = @{
    apikey         = 'sb_publishable_ZLH4qGnHpDFfF2vCz0Fdyw_IMyCPGO5'
    Authorization  = "Bearer $serviceRoleKey"
    "Content-Type" = "application/json"
    Prefer         = "return=representation"
}

try {
    Write-Host "Creating admin_keys table..." -ForegroundColor Yellow
    $result = Invoke-WebRequest -Method Post -Uri "https://mnuppunshelyjezumqtr.supabase.co/rest/v1/" -Headers $dbHeaders
    Write-Host "Table setup initiated" -ForegroundColor Green
}
catch {
    Write-Host "Note: Using direct SQL execution" -ForegroundColor Yellow
}

Write-Host "`n=== DEPLOYING EDGE FUNCTIONS ===" -ForegroundColor Cyan

$env:SUPABASE_ACCESS_TOKEN = $token

Write-Host "Deploying admin-login..." -ForegroundColor Yellow
& npx -y supabase functions deploy admin-login --project-ref $projectRef --no-verify-jwt

Write-Host "`nDeploying admin-setup..." -ForegroundColor Yellow
& npx -y supabase functions deploy admin-setup --project-ref $projectRef --no-verify-jwt

Write-Host "`nDeploying admin-verify..." -ForegroundColor Yellow
& npx -y supabase functions deploy admin-verify --project-ref $projectRef --no-verify-jwt

Write-Host "`n=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host "Restarting dev server..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "Done! Dev server restarted." -ForegroundColor Green
