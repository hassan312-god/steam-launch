# G.A Launcher

Launcher de jeux Steam, construit avec Vue 3, Tailwind CSS et GSAP. Il est disponible en site web et en application de bureau (Electron).

- **Site web** : <https://ga-launcher-hassan.netlify.app> : catalogue et vitrines Steam en direct, bibliothèque synchronisée avec le compte Steam (connexion officielle Steam, clé API côté serveur).
- **Application de bureau** (Electron, dossier `desktop/`) : en plus du site, elle lit l'état **réel** de Steam sur l'ordinateur : jeux installés, téléchargements en cours avec leur progression, installation, lancement et désinstallation sans quitter le launcher.

## Fonctionnalités

- Catalogue et vitrines Steam, alimentés par l'API publique du magasin Steam.
- Bibliothèque synchronisée avec le compte Steam via la connexion officielle Steam.
- Application de bureau : état réel des jeux installés et des téléchargements en cours, avec leur progression.
- Installer, lancer et désinstaller un jeu depuis le launcher.
- Mise à jour automatique de l'application de bureau.

## Technologies

- **Interface** : Vue 3, vue-router, Tailwind CSS, GSAP
- **Build** : Vite, `@vitejs/plugin-vue`, `@tailwindcss/vite`
- **Application de bureau** : Electron, electron-builder, electron-updater
- **Lecture vidéo** : hls.js
- **Hébergement et CI** : Netlify, GitHub Actions

## Installation

```bash
git clone https://github.com/hassan312-god/steam-launch.git
cd steam-launch
npm install
```

### Développement

```bash
npm run dev            # site sur http://localhost:5173
npm run desktop:dev    # application de bureau pointée sur le site local
```

Variable utile en local : `STEAM_API_KEY` (connexion Steam et bibliothèque). Elle n'est jamais écrite dans le dépôt ; en production, elle est définie dans les variables d'environnement Netlify.

## Utilisation

### Application de bureau

```bash
npm run desktop        # lance l'application (site en ligne)
npm run desktop:build  # construit l'installateur de ton système dans release/
```

Cibles de construction : installateur NSIS pour Windows (x64), DMG et ZIP pour macOS, AppImage pour Linux.

Les installateurs Windows, macOS et Linux sont construits par GitHub Actions (*Actions → Application de bureau → Run workflow*, ou en poussant un tag `v1.0.0`) et publiés dans une Release publique (`vX.Y.Z`, numéro croissant à chaque build) avec les fichiers de mise à jour automatique. La page « Télécharger » du site lit cette Release.

Les installateurs ne sont pas signés : Windows SmartScreen et macOS Gatekeeper demanderont une confirmation au premier lancement.

### Fonctionnement

- Le téléchargement et l'installation sont effectués par le **client Steam** (protocole `steam://install/<id>`). Le launcher suit leur avancement en lisant les fichiers `appmanifest_*.acf` de Steam (`desktop/steam-local.cjs`).
- Le pont entre la page web et l'application est volontairement minimal (`desktop/preload.cjs`) : seules quelques actions Steam sont exposées, avec un identifiant numérique validé.
- Prérequis : le client Steam installé et connecté sur l'ordinateur.

### Données

`npm run` ne recharge pas le catalogue. Pour régénérer `src/data/catalog.json` depuis l'API publique du magasin Steam :

```bash
node scripts/fetch-steam.mjs
```

## Structure

```
steam-launch/
├── desktop/          # application Electron (main.cjs, preload.cjs, steam-local.cjs, icon.png)
├── scripts/          # scripts utilitaires (fetch-steam.mjs)
├── src/              # code source de l'interface Vue (src/data/catalog.json)
├── public/           # fichiers statiques
├── index.html
├── vite.config.js
└── netlify.toml