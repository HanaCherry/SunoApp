$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================"
Write-Host "   SunoApp - Build Windows v1.0.2"
Write-Host "========================================"
Write-Host ""

if (-not (Test-Path ".\main.js")) {
    throw "main.js introuvable. Lance ce script dans le dossier SunoApp."
}

if (-not (Test-Path ".\package.json")) {
    throw "package.json introuvable. Lance ce script dans le dossier SunoApp."
}

node -v
npm -v

Write-Host ""
Write-Host "Installation / mise à jour des dépendances..."
npm install

Write-Host ""
Write-Host "Compilation de l'installateur Windows..."
npm run dist

Write-Host ""
Write-Host "Build terminé. Regarde dans le dossier dist."
Write-Host "Le fichier devrait ressembler à : SunoApp Setup 1.0.2.exe"
Write-Host ""
