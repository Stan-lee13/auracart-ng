# This script will create a bundle of all functions and deploy via API
$token = 'sbp_3e36aebbe88b0da4d9a094de34eeef88771ac75a'
$projectRef = 'mnuppunshelyjezumqtr'

Write-Host "=== CHECKING CURRENT DEPLOYED FUNCTIONS ===" -ForegroundColor Cyan

$headers = @{
    Authorization  = "Bearer $token"
    'Content-Type' = 'application/json'
}

try {
    $functionsUrl = "https://api.supabase.com/v1/projects/$projectRef/functions"
    $currentFunctions = Invoke-RestMethod -Uri $functionsUrl -Headers $headers -Method Get
    
    Write-Host "Currently deployed functions:" -ForegroundColor Yellow
    if ($currentFunctions) {
        $currentFunctions | ForEach-Object { Write-Host "  - $($_.name)" -ForegroundColor Green }
        Write-Host "Total: $($currentFunctions.Count)" -ForegroundColor Cyan
    }
    else {
        Write-Host "  None found (or API returned empty)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Could not fetch functions: $_" -ForegroundColor Red
}

Write-Host "`nNote: Functions may be deployed but not showing in API." -ForegroundColor Yellow
Write-Host "Testing a function directly..." -ForegroundColor Cyan

try {
    $testHeaders = @{
        apikey = 'sb_publishable_ZLH4qGnHpDFfF2vCz0Fdyw_IMyCPGO5'
    }
    
    $testUrl = "https://mnuppunshelyjezumqtr.supabase.co/functions/v1/admin-setup"
    Invoke-WebRequest -Uri $testUrl -Method Options -Headers $testHeaders -TimeoutSec 3 | Out-Null
    Write-Host "admin-setup is LIVE!" -ForegroundColor Green
}
catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 200 -or $_.Exception.Response.StatusCode.value__ -eq 204) {
        Write-Host "admin-setup is LIVE!" -ForegroundColor Green
    }
    else {
        Write-Host "admin-setup may not be accessible: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
