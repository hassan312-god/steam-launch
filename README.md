# G.A Launcher

Launcher de jeux Steam : Vue 3 + Tailwind + GSAP.

- **Site web** : <https://ga-launcher-hassan.netlify.app> — catalogue et vitrines Steam en direct, bibliothèque synchronisée avec le compte Steam (connexion officielle Steam, clé API côté serveur).
- **Application de bureau** (Electron, dossier `desktop/`) — en plus du site, elle lit l'état **réel** de Steam sur l'ordinateur :
  jeux installés, téléchargements en cours avec leur progression, installer / lancer / désinstaller sans quitter le launcher.

## Développement

```bash
npm install
npm run dev            # site sur http://localhost:5173
npm run desktop:dev    # application de bureau pointée sur le site local
```

Variable utile en local : `STEAM_API_KEY` (connexion Steam et bibliothèque). Elle n'est jamais écrite dans le dépôt ; en production elle vit dans les variables d'environnement Netlify.

## Application de bureau

```bash
npm run desktop        # lance l'application (site en ligne)
npm run desktop:build  # construit l'installateur de ton système dans release/
```

Les installateurs Windows / macOS / Linux sont construits par GitHub Actions
(*Actions → Application de bureau → Run workflow*, ou en poussant un tag `v1.0.0`) et publiés dans une Release publique
(`vX.Y.Z`, numéro croissant à chaque build) avec les fichiers de mise à jour automatique ; la page « Télécharger » du site lit cette Release.
Les installateurs ne sont pas signés : Windows SmartScreen et macOS Gatekeeper demanderont une confirmation au premier lancement.

### Comment ça marche

- Le téléchargement et l'installation sont faits par le **client Steam** (protocole `steam://install/<id>`) ; le launcher en suit l'avancement en lisant les fichiers `appmanifest_*.acf` de Steam (`desktop/steam-local.cjs`).
- Le pont entre la page web et l'application est volontairement minimal (`desktop/preload.cjs`) : seules quelques actions Steam avec un identifiant numérique validé.
- Prérequis : le client Steam installé et connecté sur l'ordinateur.

## Données

`npm run` ne recharge pas le catalogue : `node scripts/fetch-steam.mjs` régénère `src/data/catalog.json` depuis l'API publique du magasin Steam.
