# Installation de SunoApp

Télécharger les fichiers depuis les versions officielles de ce dépôt :
https://github.com/HanaCherry/SunoApp/releases/latest

## Windows x64

Ouvrir le fichier `SunoApp-…-win-x64.exe` et suivre l'assistant d'installation.
Le dossier et les raccourcis peuvent être choisis pendant l'installation.

## Linux x64

- Ubuntu, Debian, Linux Mint : installer le fichier `.deb` avec le gestionnaire de logiciels.
- Autres distributions : rendre le fichier `.AppImage` exécutable, puis l'ouvrir. Une installation de FUSE peut être nécessaire selon la distribution.

Les raccourcis globaux et le placement du mini-lecteur dépendent du bureau et de ses règles, notamment sous Wayland. Les commandes restent disponibles dans le menu de l'application.

## macOS

Choisir `arm64` pour Apple Silicon (M1 et suivants), ou `x64` pour les Mac Intel.
Ouvrir le `.dmg`, puis déplacer SunoApp vers Applications.

Les distributions actuelles ne sont pas signées avec un certificat développeur et la version macOS n'est pas notarisée par Apple. macOS peut donc en bloquer l'ouverture. Une distribution reconnue automatiquement par Gatekeeper nécessite la signature et la notarisation par le mainteneur.

## Vérifications

La chaîne de publication construit les paquets sur Windows, Linux et macOS et exécute les tests de sécurité, de langues et d'interface. Ces contrôles ne remplacent pas les essais de connexion Suno, de lecture réelle et d'intégration avec chaque bureau. Aucun profil utilisateur, cookie ou jeton n'est inclus dans les paquets.
