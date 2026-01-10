$token = 'sbp_3e36aebbe88b0da4d9a094de34eeef88771ac75a'
$projectRef = 'mnuppunshelyjezumqtr'
$headers = @{
    Authorization  = "Bearer $token"
    "Content-Type" = "application/json"
}

$secrets = @(
    @{ name = 'JWT_SECRET'; value = 'stanley-jwt-secret-999' },
    @{ name = 'ADMIN_SETUP_SECRET'; value = 'stanley-setup-secret-777' }
)

Write-Host "Setting secrets via API..."
try {
    $response = Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$projectRef/secrets" -Headers $headers -Body ($secrets | ConvertTo-Json)
    Write-Host "Success: Secrets set."
}
catch {
    Write-Host "Error setting secrets: $_"
}
