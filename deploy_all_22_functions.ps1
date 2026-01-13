$ErrorActionPreference = 'Stop'

$token = 'sbp_3e36aebbe88b0da4d9a094de34eeef88771ac75a'
$projectRef = 'mnuppunshelyjezumqtr'
$supabaseCli = 'C:\Users\Administrator\OneDrive\Documents\tools\supabase.exe'
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
    'supplier-operations',
    'sync-inventory',
    'sync-prices',
    'sync-tracking',
    'track-order',
    'update-profile'
)

$total = $functions.Count
$deployed = 0
$failed = 0

for ($index = 0; $index -lt $total; $index++) {
    $func = $functions[$index]
    Write-Host ("[{0}/{1}] Deploying {2}..." -f ($index + 1), $total, $func) -ForegroundColor Yellow

    try {
        & $supabaseCli functions deploy $func --project-ref $projectRef --no-verify-jwt | Out-Host

        if ($LASTEXITCODE -eq 0) {
            $deployed++
            Write-Host ("  OK: {0}" -f $func) -ForegroundColor Green
        }
        else {
            $failed++
            Write-Host ("  FAILED: {0}" -f $func) -ForegroundColor Red
        }
    }
    catch {
        $failed++
        Write-Host ("  ✗ {0} error: {1}" -f $func, $_) -ForegroundColor Red
    }
}

Write-Host "`n=== DEPLOYMENT SUMMARY ===" -ForegroundColor Cyan
Write-Host ("Successfully deployed: {0}/{1}" -f $deployed, $total) -ForegroundColor Green
Write-Host ("Failed: {0}/{1}" -f $failed, $total) -ForegroundColor ($(if ($failed -eq 0) { 'Green' } else { 'Red' }))

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


Write-Host "`nOTHER:" -ForegroundColor Yellow
Write-Host "  - crypto-convert"
Write-Host "  - supplier-operations"
Write-Host "  - update-profile"

Write-Host "`n=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
