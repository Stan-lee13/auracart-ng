$token = 'sbp_3e36aebbe88b0da4d9a094de34eeef88771ac75a'
$projectRef = 'mnuppunshelyjezumqtr'
$env:SUPABASE_ACCESS_TOKEN = $token

Write-Host "=== DEPLOYING ALL EDGE FUNCTIONS ===" -ForegroundColor Cyan

$functions = @('admin-login', 'admin-setup', 'admin-verify', 'aliexpress-oauth-callback')

foreach ($func in $functions) {
    Write-Host "Deploying $func..." -ForegroundColor Yellow
    & npx -y supabase functions deploy $func --project-ref $projectRef --no-verify-jwt
    Write-Host ""
}

Write-Host "`n=== EDGE FUNCTION URLs ===" -ForegroundColor Cyan
Write-Host "Admin Login:    https://mnuppunshelyjezumqtr.supabase.co/functions/v1/admin-login"
Write-Host "Admin Setup:    https://mnuppunshelyjezumqtr.supabase.co/functions/v1/admin-setup"
Write-Host "Admin Verify:   https://mnuppunshelyjezumqtr.supabase.co/functions/v1/admin-verify"
Write-Host "`n=== ALIEXPRESS CALLBACK URL ===" -ForegroundColor Green
Write-Host "https://mnuppunshelyjezumqtr.supabase.co/functions/v1/aliexpress-oauth-callback" -BackgroundColor DarkGreen

Write-Host "`nDone!" -ForegroundColor Green
