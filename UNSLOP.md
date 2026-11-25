# UNSLOP : G.A Launcher (site + application de bureau)

Le site et l'application de bureau partagent le même code (l'application affiche le site). Une correction vaut pour les deux.
État d'origine conservé : tag git `avant-unslop`. Mesure : `python3 scripts/slopscan.py` (heuristique de signes dans le code ; relançable).

## Score avant : 160

| Signe | Nb |
|---|---|
| Plusieurs accents (rose, ambre, cyan en plus du citron) | 32 |
| Verre dépoli (glass / backdrop-blur) | 28 |
| Rayons de coins différents (14 / 20 / 22 / 28 px) | 24 |
| Sur-titres en capitales espacées (eyebrow) | 17 |
| Animations « tic » (Magnet, SplitText, BlurText partout) | 15 |
| Cartes (.card / SpotlightCard) | 13 |
| Dégradés décoratifs | 11 |
| Halos / flous décoratifs | 8 |
| Brillance sur le texte des boutons (ShinyText) | 8 |
| Slogans génériques (« Envie de quoi ce soir ? », « Tous tes jeux. Un seul endroit. », humeurs Chill / Adrénaline / Avec des potes) | 4 |

## Ce qui fait IA (du plus visible au plus discret)

1. **Accueil** : un bloc de salutation avec une question de vibe et quatre humeurs, deux cartes de verre « Ma bibliothèque 0 jeu » / « Promotions 10 en solde », un halo vert pulsant derrière le bouton principal, un bouton secondaire « ··· » sans fonction claire, une astuce de clavier en bas.
2. **Sur-titres** en capitales vertes très espacées au-dessus de presque chaque titre (« TON CLIENT STEAM », « APPLICATION DE BUREAU », « 175 JEUX DU CATALOGUE STEAM »).
3. **Quatre couleurs d'accent** en plus du citron : rose (réductions, favoris), ambre (pause), cyan (« MIEUX NOTÉ ») et orange/or.
4. **Magasin** : tuiles à étiquettes colorées différentes (rose « PLUS GROSSE PROMOTION », cyan « MIEUX NOTÉ », pastille « MEILLEURE VENTE »).
5. **Textes** : slogans sans information (« Le launcher, en vrai logiciel », « Tous tes jeux. Un seul endroit. »).
6. **Page Télécharger** : halo vert radial en haut de page.
7. **Boutons** avec brillance animée sur le texte, effet magnétique, titres éclatés lettre par lettre sur chaque page.
8. **Quatre polices chargées** (Inter, Unbounded, Bricolage, Anton) dont une jamais utilisée dans l'interface.
9. **Rayons de coins** : 14, 20, 22, 24 et 28 px mélangés pour des objets de même rôle.
10. **Page sans description** : pas de description, pas de balises de partage.

## Ce qu'on garde (et pourquoi)

- Le thème sombre, l'accent citron `#B6FF3D` et le logo (manette + G.A) : ils viennent du design fourni et de la marque.
- Les vraies données Steam (jaquettes, prix, tailles, vitesses) : c'est le contenu du produit.
- Les dégradés qui servent de voile sous un texte posé sur une image (lisibilité) et le verre de l'en-tête fixe : fonction, pas décor.
- Les animations d'entrée GSAP du héros et de la liste de jeux (demandées au départ), réduites au strict nécessaire.

## Direction (proposée, pas validée : l'utilisateur n'a pas répondu aux questions de cadrage)

- **Marque** : lanceur de jeux PC pour joueurs francophones, sur les vraies données Steam. Trois mots : *dense, direct, sombre*.
- **Référence dominante** : le client Steam lui-même (listes, faits, chiffres, peu de décor). Emprunts : l'affiche plein écran du jeu en vedette (Apple TV / Netflix) pour l'accueil seulement.
- **Police** : deux voix. *Unbounded* pour les titres de page et le nom des jeux ; *Inter* pour tout le reste. Le logo garde sa police dessinée (Bricolage dans le SVG). Anton retirée.
- **Palette** : fond `#06060A`, panneau `#101017`, texte `#FFFFFF` / `#C8C9D2` / `#A7A9B6`, **un seul accent `#B6FF3D`** (tiré du logo). Rouge `#FF3D9A` réservé aux erreurs. Réductions et pause en citron / blanc, plus de rose, ambre ni cyan décoratifs.
- **Mise en page** : un axe à gauche par écran. Le premier écran de l'accueil est l'affiche du jeu en vedette : titre, prix, un seul bouton principal.
- **Élément signature** : les chiffres réels Steam affichés tels quels (EN DIRECT + « mis à jour il y a N min », vitesse et temps restant des téléchargements).
- **Rayons** : 20 px pour les objets (cartes, affiches, panneaux), 12 px pour les petits blocs, pilule pour les boutons.
- **Mouvement** : GSAP pour l'entrée de page et le héros ; plus de brillance sur le texte ni de halo pulsant ; tout coupé avec `prefers-reduced-motion`.

## À fournir

- Aucune coordonnée, avis ou chiffre inventé n'a été ajouté. Mentions légales et contact : **à fournir** par le propriétaire du site (rien n'existe aujourd'hui, donc rien n'est affiché).
- Une capture de l'installateur Windows sur un vrai PC (non vérifiable ici).

## Passes appliquées

1. **Désencombrer** : accueil sans question de vibe ni humeurs, sans les deux cartes de verre (remplacées par une ligne : « Ma bibliothèque · N jeux », « N promotions · jusqu'à -N % »), sans halo derrière le bouton, sans bouton « ··· », sans astuce clavier ; page Télécharger sans halo radial ni liste de quatre « fonctions » qui répétait la phrase d'intro ; Magasin : pastilles colorées remplacées par un texte simple.
2. **Texte** : plus de slogan creux. « Installe, lance et télécharge tes jeux Steam sans ouvrir Steam. Notifications Windows, mises à jour automatiques. » ; « On charge le catalogue Steam. »
3. **Police** : Anton retirée (jamais utilisée dans l'interface) ; deux voix : Unbounded (titres) et Inter (le reste). Titres de page en texte simple ; le défilement lettre par lettre ne reste que sur l'affiche de l'accueil et le nom du jeu.
4. **Couleur** : un seul accent (citron). Réductions et point « non lu » en citron, pause en gris clair, rouge uniquement pour les erreurs ; rose, ambre, cyan, orange et or supprimés des jetons.
5. **Composants** : rayons ramenés à 20 px (objets), 12 px (petits blocs), pilule (boutons).
6. **Boutons** : plus de brillance animée sur le texte, plus d'effet magnétique ; un bouton principal par écran.
7. **Sur-titres** : le style `.eyebrow` n'est plus en capitales vertes espacées mais un texte gris simple ; supprimés quand ils ne disaient rien (« Application de bureau », « Ton client Steam »).
8. **Finitions** : titre de page, description, balises de partage ; installateur Windows en un clic (plus d'écran d'options vide) ; logo et icône repris du design.

## Score après : 73 (avant : 160)

Signes restants et pourquoi on les garde :
- Dégradés (11) et flous (4) : voiles sous du texte posé sur une image (lisibilité) ; un halo sur l'affiche de l'accueil est dans le héros.
- Verre dépoli (22) : en-tête fixe et boutons flottants sur images/vidéos.
- Cartes (13) : Paramètres, Magasin et fiche jeu, réservées aux blocs qui regroupent vraiment des infos.
- Sur-titres (10) : texte gris simple (genres, nombre de jeux), pas de pastille.
- Autres accents (8) : le rouge des erreurs et les états « erreur » du téléchargement.
- Animations (4) : titre du jeu en vedette, nom de compte, logo de chargement.

## Non vérifié

- Le test « détective » (un lecteur sans contexte devine l'outil IA) n'a pas été fait.
- Les contrastes n'ont pas été mesurés au pixel sur les images claires.
- L'application de bureau n'a pas été relue sur un vrai Windows : elle affiche le même site, les captures sont celles du navigateur.

