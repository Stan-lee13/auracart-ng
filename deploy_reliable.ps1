$token = 'sbp_3e36aebbe88b0da4d9a094de34eeef88771ac75a'
$projectRef = 'mnuppunshelyjezumqtr'
$Env:SUPABASE_ACCESS_TOKEN = $token

Write-Host "=== RELIABLE DEPLOYMENT OF 22 FUNCTIONS ===" -ForegroundColor Cyan

$functions = @(
    'admin-login', 'admin-setup', 'admin-verify', 'aliexpress-oauth-callback',
    'auto-fulfill-order', 'check-availability', 'crypto-convert', 'get-recommendations',
    'import-products', 'nowpayments-initialize', 'nowpayments-webhook', 'paystack-initialize',
    'paystack-verify', 'search-products', 'search-suggest', 'shopify-sync',
    'supplier-operations', 'sync-inventory', 'sync-prices', 'sync-tracking',
    'track-order', 'update-profile'
)

$success = 0
$fail = 0

foreach ($func in $functions) {
    Write-Host "Deploying [$($success + $fail + 1)/22]: $func..." -ForegroundColor Yellow
    
    # Using cmd /c npx for reliability on Windows
    cmd /c "npx -y supabase functions deploy $func --project-ref $projectRef --no-verify-jwt"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  SUCCESS: $func is live!" -ForegroundColor Green
        $success++
    }
    else {
        Write-Host "  FAILED: $func" -ForegroundColor Red
        $fail++
    }
    
    Start-Sleep -Seconds 1
}

Write-Host "`n=== DEPLOYMENT SUMMARY ===" -ForegroundColor Cyan
Write-Host "Successfully Deployed: $success/22" -ForegroundColor Green
Write-Host "Failed: $fail/22" -ForegroundColor Red

Write-Host "`nRestarting dev server..." -ForegroundColor Cyan
# Start dev server in a new window so it doesn't block
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
Write-Host "Dev server started." -ForegroundColor Green
