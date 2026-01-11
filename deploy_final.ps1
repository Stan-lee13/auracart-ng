$token = 'sbp_3e36aebbe88b0da4d9a094de34eeef88771ac75a'
$projectRef = 'mnuppunshelyjezumqtr'
$Env:SUPABASE_ACCESS_TOKEN = $token

Write-Host "=== STARTING SEQUENTIAL DEPLOYMENT OF 22 FUNCTIONS ===" -ForegroundColor Cyan
Write-Host "This avoids file locking issues on Windows.`n" -ForegroundColor Yellow

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
    
    # Run deployment and capture output
    $deployProcess = Start-Process npx -ArgumentList "-y", "supabase", "functions", "deploy", $func, "--project-ref", $projectRef, "--no-verify-jwt" -Wait -NoNewWindow -PassThru -ErrorAction SilentlyContinue
    
    if ($deployProcess.ExitCode -eq 0) {
        Write-Host "  SUCCESS: $func is live!" -ForegroundColor Green
        $success++
    }
    else {
        Write-Host "  FAILED: $func (Exit Code: $($deployProcess.ExitCode))" -ForegroundColor Red
        $fail++
    }
    
    # Small pause to let Windows release file handles
    Start-Sleep -Seconds 2
}

Write-Host "`n=== DEPLOYMENT SUMMARY ===" -ForegroundColor Cyan
Write-Host "Successfully Deployed: $success" -ForegroundColor Green
Write-Host "Failed: $fail" -ForegroundColor Red

if ($fail -eq 0) {
    Write-Host "`nAll functions are now live on your new Supabase project!" -ForegroundColor Green
}
else {
    Write-Host "`n$fail functions failed. We can try those manually if needed." -ForegroundColor Yellow
}

Write-Host "`nRestarting your dev server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
Write-Host "Dev server started in a new background window." -ForegroundColor Green
