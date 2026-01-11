$token = 'sbp_3e36aebbe88b0da4d9a094de34eeef88771ac75a'
$projectRef = 'mnuppunshelyjezumqtr'
$env:SUPABASE_ACCESS_TOKEN = $token

Write-Host "=== DEPLOYING ALL EDGE FUNCTIONS ===" -ForegroundColor Cyan
Write-Host "Project: $projectRef`n" -ForegroundColor Yellow

$functions = @(
    'admin-login',
    'admin-setup', 
    'admin-verify',
    'aliexpress-oauth-callback'
)

foreach ($func in $functions) {
    Write-Host "Deploying $func..." -ForegroundColor Yellow
    $output = & npx -y supabase functions deploy $func --project-ref $projectRef --no-verify-jwt 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ $func deployed successfully!" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ $func deployment failed" -ForegroundColor Red
        Write-Host "  Output: $output" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "`n=== EDGE FUNCTION URLs ===" -ForegroundColor Cyan
Write-Host "Admin Login:    https://mnuppunshelyjezumqtr.supabase.co/functions/v1/admin-login" -ForegroundColor Green
Write-Host "Admin Setup:    https://mnuppunshelyjezumqtr.supabase.co/functions/v1/admin-setup" -ForegroundColor Green
Write-Host "Admin Verify:   https://mnuppunshelyjezumqtr.supabase.co/functions/v1/admin-verify" -ForegroundColor Green
Write-Host "AliExpress CB:  https://mnuppunshelyjezumqtr.supabase.co/functions/v1/aliexpress-oauth-callback" -ForegroundColor Green

Write-Host "`n=== ALIEXPRESS OAUTH CALLBACK URL ===" -ForegroundColor Cyan
Write-Host "Use this URL in AliExpress API settings:" -ForegroundColor Yellow
Write-Host "https://mnuppunshelyjezumqtr.supabase.co/functions/v1/aliexpress-oauth-callback" -ForegroundColor White -BackgroundColor DarkGreen

Write-Host "`n=== TESTING ADMIN-SETUP FUNCTION ===" -ForegroundColor Cyan
try {
    $testUrl = "https://mnuppunshelyjezumqtr.supabase.co/functions/v1/admin-setup"
    $testHeaders = @{
        'Content-Type' = 'application/json'
        'apikey'       = 'sb_publishable_ZLH4qGnHpDFfF2vCz0Fdyw_IMyCPGO5'
    }
    
    Write-Host "Testing OPTIONS request..." -ForegroundColor Yellow
    $optionsResponse = Invoke-WebRequest -Method Options -Uri $testUrl -Headers $testHeaders -ErrorAction SilentlyContinue
    Write-Host "  ✓ CORS working!" -ForegroundColor Green
}
catch {
    Write-Host "  ⚠ Could not test function: $_" -ForegroundColor Yellow
}

Write-Host "`nDeployment complete!" -ForegroundColor Green
