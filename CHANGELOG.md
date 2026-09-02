# Historique des versions

## 1.0.9 — 2 septembre 2026

### Corrections

- Interface Création / Studio : plus de hauteur forcée qui coupait la page, le bas redevient visible
- Thèmes appliqués à toute l’app (barre, fond, Création), pas seulement au chrome SunoApp

### Nouveautés

- Thèmes Nuit, Clair, Cherry et Aurore dans la barre de gauche, comme Home / Library
- Modes de l’égaliseur (Neutre, Basses, Voix…) dans cette même barre

## 1.0.8 — 2 septembre 2026

### Corrections

- Mode Studio / Création : le bas de page (timeline et commandes) n’est plus coupé par la barre de titre
- La zone de travail s’ajuste à la hauteur réelle sous Chrome SunoApp, sans scaleY

### Nouveautés

- 4 thèmes d’interface persistants : Nuit, Clair, Cherry et Aurore (menu Paramètres)

## 1.0.7 — 1er septembre 2026

### Corrections

- Lecteur personnalisé réactivé en overlay fixe, sans injection dans les lignes virtualisées de Suno
- Mode création plus propre et moderne (`/create` et `/studio`) : plus de scaleY, chrome sombre net, overlay masqué dans l’éditeur

## 1.0.6 — 28 août 2026

### Corrections

- Suppression du lecteur personnalisé incompatible avec la nouvelle liste virtuelle de Suno
- Fin des lignes de morceaux déformées, superposées ou anormalement agrandies
- Conservation du lecteur natif, du mini-lecteur et des commandes multimédias Windows

## 1.0.5 — 28 août 2026

### Corrections

- Affichage complet de la barre inférieure de Suno Studio
- Ajustement vertical de toutes les couches Studio autour de la barre SunoApp
- Conservation de la largeur et suppression de la bande vide sous l’éditeur
- Maximisation automatique de la fenêtre à l’entrée dans Studio

## 1.0.4 — 28 août 2026

### Corrections

- Mise en page dédiée à Suno Studio
- Hauteur de la zone de travail ajustée à la barre de titre SunoApp
- Fin de la timeline et commandes inférieures de Studio désormais entièrement visibles
- Titre de fenêtre adapté automatiquement entre le lecteur et Studio

## 1.0.3 — 28 août 2026

### Corrections

- Compatibilité avec le nouveau chargement et les navigations internes de Suno
- Réinjection fiable de l’interface personnalisée après un changement de page
- Sélecteurs plus tolérants pour lecture, pause, précédent, suivant et J’aime
- Diagnostic détaillé lorsqu’un changement du site empêche l’intégration

## 1.0.2 — 19 juillet 2026

### Nouveautés

- Nouveau lecteur personnalisé intégré aux pistes Suno
- Forme d’onde avec progression et couleurs issues de la pochette
- Mini-lecteur externe inspiré des lecteurs musicaux modernes
- Interface effet verre avec transparence réglable
- Égaliseur et profils audio configurables
- Menu de paramètres intégré à la barre supérieure
- Contrôles multimédias Windows et icônes actualisées

### Améliorations

- Barre de titre personnalisée intégrée à l’application
- Placement automatique du mini-lecteur en bas à droite
- Adaptation du mini-lecteur à la pochette du morceau
- Menu contextuel enrichi : annuler, rétablir, copier, coller, correction, traduction et recherche
- Meilleure gestion des liens externes et des médias
- Synchronisation améliorée lors du changement de piste

### Sécurité et stabilité

- Isolation du contexte Electron activée
- Bac à sable Electron activé
- Vérifications des fenêtres détruites
- Gestion plus sûre de la fermeture et des liens externes

## 1.0.1 — 26 juin 2026

- Ajout du menu contextuel copier, coller et couper
- Amélioration de l’accessibilité des commandes de presse-papiers

## 1.0.0 — 24 juin 2026

- Première version publique de SunoApp
- Intégration de Suno dans Electron
- Contrôles multimédias Windows
- Mini-lecteur initial
