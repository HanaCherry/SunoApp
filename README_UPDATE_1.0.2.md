# SunoApp Update 1.0.2

Ce pack met à jour SunoApp avec :

- Menu clic droit corrigé
- Menu plus complet
- Correction orthographique native Electron
- Suggestions de correction
- Ajout au dictionnaire
- Traduction de la sélection
- Recherche Google / YouTube / Suno
- Gestion liens et médias
- Version 1.0.2
- Script de compilation Windows

## Installation

Copie ces fichiers dans ton dossier `SunoApp` :

- `main.js`
- `package.json`
- `build-win.ps1`
- `build-win-no-start.ps1`

Puis lance PowerShell dans le dossier SunoApp :

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\build-win.ps1
```

Si tu ne veux pas lancer l'application avant le build :

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\build-win-no-start.ps1
```

Le fichier `.exe` sera créé dans le dossier :

```text
dist
```

Normalement il devrait s'appeler :

```text
SunoApp Setup 1.0.2.exe
```

## Commandes Git

Après test :

```powershell
git add main.js package.json package-lock.json
git commit -m "release: update SunoApp to 1.0.2"
git push
```
