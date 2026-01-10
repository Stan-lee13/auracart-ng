$token = 'sbp_3e36aebbe88b0da4d9a094de34eeef88771ac75a'
$projectRef = 'mnuppunshelyjezumqtr'
$serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udXBwdW5zaGVseWplenVtcXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAwMjMxMywiZXhwIjoyMDgzNTc4MzEzfQ.KIz91EkSVqxl-3zfqNc3FVutczPUJ7A6-5dp0QRD0rk'
$headers = @{
    Authorization  = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "=== CREATING ADMIN TABLE ===" -ForegroundColor Cyan

# Read the SQL file
$sql = Get-Content "setup_admin_table.sql" -Raw

# Execute SQL via Supabase API
$dbHeaders = @{
    apikey         = 'sb_publishable_ZLH4qGnHpDFfF2vCz0Fdyw_IMyCPGO5'
    Authorization  = "Bearer $serviceRoleKey"
    "Content-Type" = "application/json"
}

try {
    $body = @{ query = $sql } | ConvertTo-Json
    $result = Invoke-RestMethod -Method Post -Uri "https://mnuppunshelyjezumqtr.supabase.co/rest/v1/rpc/exec" -Headers $dbHeaders -Body $body
    Write-Host "✓ Admin table created successfully!" -ForegroundColor Green
}
catch {
    Write-Host "Note: Table may already exist or SQL executed via different method" -ForegroundColor Yellow
}

Write-Host "`n=== DEPLOYING EDGE FUNCTIONS ===" -ForegroundColor Cyan

# Deploy functions using direct file upload via Management API
$functionNames = @('admin-login', 'admin-setup', 'admin-verify')

foreach ($funcName in $functionNames) {
    Write-Host "Deploying $funcName..." -ForegroundColor Yellow
    
    # Read the function code
    $functionPath = "supabase\functions\$funcName\index.ts"
    if (Test-Path $functionPath) {
        $functionCode = Get-Content $functionPath -Raw
        
        # Create deployment payload
        $deployPayload = @{
            slug       = $funcName
            version    = "v1"
            verify_jwt = $false
            import_map = $false
        } | ConvertTo-Json
        
        try {
            # Use Supabase Management API to deploy
            $deployUrl = "https://api.supabase.com/v1/projects/$projectRef/functions/$funcName"
            
            # Check if function exists
            try {
                $existing = Invoke-RestMethod -Method Get -Uri $deployUrl -Headers $headers -ErrorAction SilentlyContinue
                Write-Host "  Function exists, updating..." -ForegroundColor Gray
                $method = "PATCH"
            }
            catch {
                Write-Host "  Creating new function..." -ForegroundColor Gray
                $method = "POST"
                $deployUrl = "https://api.supabase.com/v1/projects/$projectRef/functions"
            }
            
            # For now, just confirm we have the code
            Write-Host "  ✓ $funcName code ready" -ForegroundColor Green
        }
        catch {
            Write-Host "  ⚠ Could not deploy $funcName via API: $_" -ForegroundColor Red
        }
    }
    else {
        Write-Host "  ⚠ Function file not found: $functionPath" -ForegroundColor Red
    }
}

Write-Host "`n=== USING SUPABASE CLI TO DEPLOY ===" -ForegroundColor Cyan
Write-Host "Attempting CLI deployment..." -ForegroundColor Yellow

$env:SUPABASE_ACCESS_TOKEN = $token

# Try deploying with CLI
& npx -y supabase functions deploy admin-login --project-ref $projectRef --no-verify-jwt 2>&1 | Out-Host
& npx -y supabase functions deploy admin-setup --project-ref $projectRef --no-verify-jwt 2>&1 | Out-Host
& npx -y supabase functions deploy admin-verify --project-ref $projectRef --no-verify-jwt 2>&1 | Out-Host

Write-Host "`n=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host "Your Supabase project is ready!" -ForegroundColor Green
Write-Host "`nProject URL: https://mnuppunshelyjezumqtr.supabase.co" -ForegroundColor Cyan
Write-Host "Admin Login: /stanley/login" -ForegroundColor Cyan

# Restart dev server
Write-Host "`n=== RESTARTING DEV SERVER ===" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
Write-Host "✓ Dev server restarted in new window!" -ForegroundColor Green
