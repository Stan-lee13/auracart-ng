$token = 'sbp_3e36aebbe88b0da4d9a094de34eeef88771ac75a'
$projectRef = 'mnuppunshelyjezumqtr'
$Env:SUPABASE_ACCESS_TOKEN = $token

Write-Host "Checking if project exists..."
npx -y supabase projects list

Write-Host "`nAttempting to push database schema..."
npx -y supabase db push --project-ref $projectRef
