# État des lieux — Simulation de balayage de ventilation

Date : 2026-11-26 · Auteur : audit Vibe (relecture du code + tests headless Node 22)

## 1. État du projet

- **Dépôt** : `Xianos51/Simulation-balayage-ventilation-` (public). **Branche par défaut : `vibe/sim-balayage-html-d11000`** (commit `d633d37`, phase 4 livrée le 2026-11-26). La branche `main` est en retard et porte un fichier cassé (voir bug n°1).
- **Livrable** : `index.html`, fichier unique 100 % autonome (134 372 octets, 2097 lignes, un seul script inline, zéro dépendance externe, zéro appel réseau) → fonctionne en `file://` comme servi en HTTP.
- **Moteur** : eulérien en régime permanent sur grille 3D — écoulement potentiel (sources/puits) + jets analytiques (1/x rond, 1/√x fente, effet Coanda) + projection de Helmholtz (∇·v = S exact, v·n = 0 aux parois) ; âge de l'air et température résolus en permanent (advection upwind + diffusion turbulente νt, couplage Boussinesq faible 2 passes) ; calcul dans un Web Worker inline (Blob, compatible `file://`) ; heat map WebGL avec repli CPU ; vue 3D lignes de courant ; multi-pièces, pièces en polygone éditable, bouches sur bords/cloisons, fenêtres sur les parois avec U et infiltration (air neuf à Text), v0/portée fabricant par bouche, scénarios nommés, historique 30 runs, comparaison 2 runs, exports JSON/CSV/PNG/rapport HTML/URL de partage.
- **Validation rejouée pendant cet audit** (script extrait, `node --check` OK, worker rejoué tel quel sous Node avec DOM stubbé) :
  - cas par défaut res 0,25 m : τN = 1248 s, ACH = 2,88, résidu max ∇·v−S = 6,3e-8, ERE = 179 %, âge moyen = 696 s, bilan aux reprises = 699 s — conforme à la validation documentée dans ROADMAP ;
  - res 0,5 m : résidu 4,9e-8 ; pièce en L (polygone) : résidu 1,6e-8 ; infiltration 30 m³/h à Text = 5 °C : déperdition = 150,75 W (ROADMAP : 150,8 W attendu) ;
  - volume scindé par une cloison pleine hauteur : `connected=false` + avertissement affiché — OK ;
  - chargement de la page rejoué sans erreur runtime.

## 2. Bugs et points de vigilance trouvés

1. **CRITIQUE — branche `main` : `index.html` tronqué.** Le fichier de `main` (commit `e4095e4`, message « index.html 101 Ko ») fait 62 199 octets et **ne contient aucune balise `</script>`** : il s'arrête au milieu de `solveTransport()`. Depuis `main`, le script n'est jamais exécuté → page morte (panneau statique, boutons inactifs). La branche par défaut porte le fichier complet (134 372 octets, `</script>` présent). **Action** : pousser le `index.html` complet sur `main` (ou supprimer `main`), et remettre `main` comme branche par défaut du dépôt.
2. **GitHub Pages non activé** (API `/pages` → 404). L'URL « en ligne » du README (`https://xianos51.github.io/Simulation-balayage-ventilation-/`) ne répond donc pas — le canal principal annoncé n'existe pas. **Action** : `Settings → Pages → Deploy from a branch → branche par défaut → /`.
3. **Hygiène de dépôt** : la branche par défaut est un nom de branche de session (`vibe/sim-balayage-html-d11000`) ; la PR #4 (« Push du code local… ») a été fermée sans merge après un push direct sur la branche par défaut. À nettoyer (branche par défaut nommée, PRs mergées).
4. **`copierURL()` cassé en `file://`** : l'URL est bâtie avec `location.origin + location.pathname`, et `location.origin` vaut `"null"` sous Firefox (voire `"file://"`) → URL de partage invalide hors ligne. Piste : `location.href.split('#')[0] + '#' + …`.
5. **Historique des runs : risque de quota `localStorage`.** `serializeRun()` convertit tous les champs 3D en JSON (à res 0,25 m : ~30 000 nombres + lignes de courant, jusqu'à ~2 Mo par run, × 30 runs archécés). Au-delà du quota (5–10 Mo), `saveHistoryList()` échoue **silencieusement** (try/catch vide) : l'historique disparaît sans message. Piste : ne stocker que les métriques + champs sous-échantillonnés, ou compresser (les tableaux typés → base64 gzip).
6. **Vérifiés OK (pas des bugs)** : détection « volume scindé », avertissement « ouverture dans un obstacle déplacée à la cellule libre la plus proche », garde « au moins une reprise / débit de soufflage non nul » dans `resoudre()`, non-régression res 0,25 m, pièce en polygone, déperditions fenêtre/infiltration.

## 3. Publication en Mistral App

Le dépôt contient désormais une app Mistral (voir `mistral.json` à la racine, module `web`) :

- `/` redirige vers `/simulateur` : le simulateur (`index.html` du dépôt, copié en `apps/web/public/simulateur.html`) en iframe plein écran ;
- `/simulateur.html` : le simulateur en plein écran (URL de partage directe) ;
- `/etat-des-lieux.html` : ce rapport en page HTML autonome.

Déploiement : `mistral deploy` depuis la racine du dépôt (org « Perso », workspace par défaut), puis publication au catalogue via `publish_app` (environnement `production`).
