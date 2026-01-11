$token = 'sbp_3e36aebbe88b0da4d9a094de34eeef88771ac75a'
$projectRef = 'mnuppunshelyjezumqtr'
$env:SUPABASE_ACCESS_TOKEN = $token

Write-Host "=== DEPLOYING ALL 22 EDGE FUNCTIONS ===" -ForegroundColor Cyan
Write-Host "Project: $projectRef" -ForegroundColor Yellow
Write-Host ""

$functions = @(
    'admin-login', 'admin-setup', 'admin-verify', 'aliexpress-oauth-callback',
    'auto-fulfill-order', 'check-availability', 'crypto-convert', 'get-recommendations',
    'import-products', 'nowpayments-initialize', 'nowpayments-webhook', 'paystack-initialize',
    'paystack-verify', 'search-products', 'search-suggest', 'shopify-sync',
    'supplier-operations', 'sync-inventory', 'sync-prices', 'sync-tracking',
    'track-order', 'update-profile'
)

$deployed = 0
$failed = 0
$total = $functions.Count

foreach ($func in $functions) {
    $num = $deployed + $failed + 1
    Write-Host "[$num/$total] Deploying $func..." -ForegroundColor Yellow
    
    & npx -y supabase functions deploy $func --project-ref $projectRef --no-verify-jwt 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK $func" -ForegroundColor Green
        $deployed++
    }
    else {
        Write-Host "  FAIL $func" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Deployed: $deployed/$total" -ForegroundColor Green
Write-Host "Failed: $failed/$total" -ForegroundColor $(if ($failed -eq 0) { 'Green' } else { 'Red' })
Write-Host ""
Write-Host "Base URL: https://mnuppunshelyjezumqtr.supabase.co/functions/v1/" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
