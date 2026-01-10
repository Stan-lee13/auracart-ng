$token = 'sbp_3e36aebbe88b0da4d9a094de34eeef88771ac75a'
$projectRef = 'mnuppunshelyjezumqtr'
$headers = @{
    Authorization  = "Bearer $token"
    "Content-Type" = "application/json"
}

$secrets = @(
    @{ name = 'SUPABASE_SERVICE_ROLE_KEY'; value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udXBwdW5zaGVseWplenVtcXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAwMjMxMywiZXhwIjoyMDgzNTc4MzEzfQ.KIz91EkSVqxl-3zfqNc3FVutczPUJ7A6-5dp0QRD0rk' },
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
    $_.Exception.Response
}

Write-Host "Listing functions via API..."
try {
    $functions = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/$projectRef/functions" -Headers $headers
    Write-Host "Functions found: $($functions.Count)"
    $functions | ForEach-Object { Write-Host "- $($_.name)" }
}
catch {
    Write-Host "Error listing functions: $_"
}
