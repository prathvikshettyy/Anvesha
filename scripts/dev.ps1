# scripts/dev.ps1
# Run both the API server and Vite frontend concurrently.
# Usage: .\scripts\dev.ps1  (from d:\TEAMAPPEX)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot

# Ensure .env exists
if (-not (Test-Path "$Root\.env")) {
    Write-Host "[Setup] .env not found — copying .env.example → .env" -ForegroundColor Yellow
    Copy-Item "$Root\.env.example" "$Root\.env"
    Write-Host "[Setup] Please edit .env and set JWT_SECRET before production use." -ForegroundColor Yellow
}

# Ensure server deps installed
if (-not (Test-Path "$Root\server\node_modules")) {
    Write-Host "[Setup] Installing server dependencies..." -ForegroundColor Cyan
    Push-Location "$Root\server"
    npm install
    Pop-Location
}

# Ensure client deps installed
if (-not (Test-Path "$Root\client\node_modules")) {
    Write-Host "[Setup] Installing client dependencies..." -ForegroundColor Cyan
    Push-Location "$Root\client"
    npm install
    Pop-Location
}

# Seed database if it doesn't exist
$DbPath = "$Root\server\data\sharespot.db"
if (-not (Test-Path $DbPath)) {
    Write-Host "[Setup] Database not found — running seed..." -ForegroundColor Cyan
    Push-Location "$Root\server"
    npm run db:seed
    Pop-Location
    Write-Host "[Setup] Database seeded! Demo accounts: rohan/demo1234 · priya/demo1234" -ForegroundColor Green
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  ShareSpot Dev Server Starting..." -ForegroundColor Magenta
Write-Host "  API  → http://localhost:3001/api/health" -ForegroundColor Cyan
Write-Host "  App  → http://localhost:5173" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""

# Install concurrently at root if needed
if (-not (Test-Path "$Root\node_modules")) {
    Push-Location $Root
    npm install
    Pop-Location
}

# Start both servers
Push-Location $Root
npm run dev
