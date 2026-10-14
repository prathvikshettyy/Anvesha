# scripts/dev.ps1
# Run both the API server and Vite frontend concurrently.
# Usage: .\scripts\dev.ps1  (from d:\TEAMAPPEX)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot

# Ensure .env exists
if (-not (Test-Path "$Root\.env")) {
    Write-Host "[Setup] .env not found - copying .env.example -> .env" -ForegroundColor Yellow
    Copy-Item "$Root\.env.example" "$Root\.env"
    Write-Host "[Setup] Please edit .env and set JWT_SECRET before production use." -ForegroundColor Yellow
}

# Install dependencies if root node_modules is missing
if (-not (Test-Path "$Root\node_modules")) {
    Write-Host "[Setup] Installing dependencies..." -ForegroundColor Cyan
    Push-Location $Root
    npm install
    Pop-Location
}

# Ensure server deps installed
if (-not (Test-Path "$Root\server\node_modules") -and -not (Test-Path "$Root\node_modules\express")) {
    Write-Host "[Setup] Installing server dependencies..." -ForegroundColor Cyan
    Push-Location $Root
    npm install --workspace=server
    Pop-Location
}

# Ensure client deps installed
if (-not (Test-Path "$Root\client\node_modules") -and -not (Test-Path "$Root\node_modules\react")) {
    Write-Host "[Setup] Installing client dependencies..." -ForegroundColor Cyan
    Push-Location $Root
    npm install --workspace=client
    Pop-Location
}

# Seed database if it doesn't exist
$DbPath = "$Root\server\data\sharespot.db"
if (-not (Test-Path $DbPath)) {
    Write-Host "[Setup] Database not found - running seed..." -ForegroundColor Cyan
    Push-Location "$Root\server"
    npm run db:seed
    Pop-Location
    Write-Host "[Setup] Database seeded! Demo accounts: rohan/demo1234 | priya/demo1234" -ForegroundColor Green
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Magenta
Write-Host "  ShareSpot Dev Server Starting..." -ForegroundColor Magenta
Write-Host "  API  -> http://localhost:3001/api/health" -ForegroundColor Cyan
Write-Host "  App  -> http://localhost:5173" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Magenta
Write-Host ""

# Free ports 3001 and 5173 if any orphaned processes are holding them
foreach ($port in @(3001, 5173)) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $conns) {
        if ($conn.OwningProcess -gt 0) {
            Write-Host "[Setup] Releasing port $port held by PID $($conn.OwningProcess)..." -ForegroundColor Yellow
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}

# Start both servers
Push-Location $Root
npm run dev
