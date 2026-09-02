# SunoApp

SunoApp est une application Windows basée sur Electron qui intègre Suno dans une interface de bureau personnalisée.

## Version actuelle

**SunoApp 1.0.11** — GalaxyBunny Studio (non officiel, non affilié à Suno)

## Fonctionnalités

- Interface Windows intégrée sans barre de titre classique
- Lecteur personnalisé avec pochette, progression et forme d’onde
- Thèmes : Nuit, Clair, Cherry, Aurore, Glass Apple, Aero, Musique
- Interface en 31 langues
- Égaliseur 10 bandes, spectre, réverbe, écho, mini-lecteur
- Couleurs dynamiques adaptées à la pochette du morceau
- Mini-lecteur externe, toujours visible et placé en bas à droite
- Contrôles lecture, pause, précédent, suivant et volume
- Menu natif Suno accessible depuis le bouton à trois points
- Égaliseur et plusieurs profils sonores
- Réglage de l’intensité de l’effet verre
- Contrôles multimédias dans la barre des tâches Windows
- Menu contextuel complet avec correction orthographique, traduction et recherche
- Session Suno conservée entre les lancements

## Installation Windows

1. Ouvrez la page **Releases** du dépôt.
2. Téléchargez `SunoApp Setup 1.0.7.exe`.
3. Lancez l’installateur.

Windows peut afficher un avertissement SmartScreen puisque l’application n’utilise pas encore de certificat commercial.

## Développement

Prérequis : Node.js 22 ou version ultérieure.

```bash
npm install
npm start
```

Pour créer l’installateur Windows :

```bash
npm run dist
```

L’installateur est généré dans le dossier `dist`.

## Avertissement

SunoApp est un projet indépendant et non officiel. Il n’est ni affilié à Suno, ni approuvé par Suno.

## Autrice

Développé par **Flora Cherry**.
