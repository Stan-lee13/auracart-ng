$token = 'sbp_3e36aebbe88b0da4d9a094de34eeef88771ac75a'
$projectRef = 'mnuppunshelyjezumqtr'
$env:SUPABASE_ACCESS_TOKEN = $token

Write-Host "=== DEPLOYING ALL 22 EDGE FUNCTIONS ===" -ForegroundColor Cyan
Write-Host "Project: $projectRef`n" -ForegroundColor Yellow

$functions = @(
    'admin-login',
    'admin-setup',
    'admin-verify',
    'aliexpress-oauth-callback',
    'auto-fulfill-order',
    'check-availability',
    'crypto-convert',
    'get-recommendations',
    'import-products',
    'nowpayments-initialize',
    'nowpayments-webhook',
    'paystack-initialize',
    'paystack-verify',
    'search-products',
    'search-suggest',
    'shopify-sync',
    'supplier-operations',
    'sync-inventory',
    'sync-prices',
    'sync-tracking',
    'track-order',
    'update-profile'
)

$deployed = 0
$failed = 0

foreach ($func in $functions) {
    Write-Host "[$($deployed + $failed + 1)/22] Deploying $func..." -ForegroundColor Yellow
    
    try {
        $result = & npx -y supabase functions deploy $func --project-ref $projectRef --no-verify-jwt 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ $func" -ForegroundColor Green
            $deployed++
        }
        else {
            Write-Host "  ✗ $func failed" -ForegroundColor Red
            $failed++
        }
    }
    catch {
        Write-Host "  ✗ $func error: $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n=== DEPLOYMENT SUMMARY ===" -ForegroundColor Cyan
Write-Host "Successfully deployed: $deployed/22" -ForegroundColor Green
Write-Host "Failed: $failed/22" -ForegroundColor $(if ($failed -eq 0) { 'Green' } else { 'Red' })

Write-Host "`n=== KEY EDGE FUNCTION URLS ===" -ForegroundColor Cyan
Write-Host "Base URL: https://mnuppunshelyjezumqtr.supabase.co/functions/v1/`n"

Write-Host "ADMIN FUNCTIONS:" -ForegroundColor Yellow
Write-Host "  - admin-login"
Write-Host "  - admin-setup"
Write-Host "  - admin-verify"

Write-Host "`nINTEGRATIONS:" -ForegroundColor Yellow
Write-Host "  - aliexpress-oauth-callback"
Write-Host "  - nowpayments-initialize"
Write-Host "  - nowpayments-webhook"
Write-Host "  - paystack-initialize"
Write-Host "  - paystack-verify"

Write-Host "`nPRODUCT OPERATIONS:" -ForegroundColor Yellow
Write-Host "  - import-products"
Write-Host "  - search-products"
Write-Host "  - search-suggest"
Write-Host "  - check-availability"
Write-Host "  - get-recommendations"

Write-Host "`nORDER OPERATIONS:" -ForegroundColor Yellow
Write-Host "  - auto-fulfill-order"
Write-Host "  - track-order"

Write-Host "`nSYNC OPERATIONS:" -ForegroundColor Yellow
Write-Host "  - sync-inventory"
Write-Host "  - sync-prices"
Write-Host "  - sync-tracking"
Write-Host "  - shopify-sync"

Write-Host "`nOTHER:" -ForegroundColor Yellow
Write-Host "  - crypto-convert"
Write-Host "  - supplier-operations"
Write-Host "  - update-profile"

Write-Host "`n=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
