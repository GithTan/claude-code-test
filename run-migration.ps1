param([string]$sql)

$headers = @{
    'Authorization' = 'Bearer sbp_2712849b6624490dbbef209d532e789fcded3c19'
    'Content-Type'  = 'application/json'
}

$body = @{ query = $sql } | ConvertTo-Json -Compress

try {
    $response = Invoke-RestMethod `
        -Uri 'https://api.supabase.com/v1/projects/zkrrqzrrsdovzhvjgzpc/database/query' `
        -Method POST `
        -Headers $headers `
        -Body $body
    Write-Host "SUCCESS" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}
