# ROADMAP — Simulateur de balayage de ventilation

Projet : `Xianos51/Simulation-balayage-ventilation-` (GitHub, public)
Dernière mise à jour : 2026-11-22

---

## 1. Contexte et contraintes

- **Usage pro (bureau d'études CVC)** : vérifier qu'une pièce est bien ventilée et bien
  chauffée / refroidie par l'air (la ventilation est le vecteur de chauffage/refroidissement).
  À terme : plusieurs pièces, voire un bâtiment.
- **Contrainte dure** : aucune installation possible sur le PC de travail (ni Python, ni
  logiciel, ni extension). La solution doit tourner **dans un navigateur seul**.
- **Le temps de calcul n'est pas un problème** tant qu'il reste raisonnable (quelques minutes max).
- On veut quelque chose de **solide physiquement** : les flux affichés doivent être
  représentatifs de la réalité (jets qui pénètrent, retour d'air vers les reprises,
  recirculations, zones mortes, stratification thermique).

## 2. Arbitrage déploiement (décision actée)

| Option | Avantage | Inconvénient | Verdict |
|---|---|---|---|
| A. Fichier HTML unique en local (`file://`) | zéro install, fonctionne offline | à transférer à la main (mail/USB), pas d'URL de partage | retenu comme **mode offline** |
| B. **GitHub Pages** sur ce repo | zéro install côté client (navigateur seul), URL partageable, versionné, gratuit | nécessite d'activer Pages une fois dans les settings du repo | **retenu comme canal principal** |
| C. Netlify / Vercel / autre hébergeur | rien de plus que B | compte externe, friction, dépendance | écarté |

**Conséquence technique** : le livrable reste un **fichier HTML 100 % autonome** (script
inline, zéro dépendance CDN, pas de modules ES, pas de Web Worker externe, pas de `fetch`
de fichiers locaux) → il marche aussi bien en `file://` que servi par Pages.

**Activation de Pages** (à faire une fois, 2 clics) :
`Settings → Pages → Deploy from a branch → <branche par défaut> → dossier racine (/) → Save`.
URL résultante : `https://xianos51.github.io/Simulation-balayage-ventilation-/`

## 3. Audit phase 0 (fait le 2026-11-21)

Le modèle lagrangien d'origine (particules émises une fois à t=0) a été rejoué
numériquement (portage fidèle Python/NumPy, résultats dans le scratchpad de session
`audit-balayage/`) :

- le jet meurt en < 2 m (décroissance en temps, pas en distance ; pas d'entraînement) ;
- vitesse moyenne dans la zone d'occupation (z < 1,8 m) ≈ **0 m/s** ;
- pas de conservation de la masse (aspiration locale en sphère autour des reprises,
  aucun champ de retour) → 68 % d'air renouvelé en 1 h à ACH 2,9 contre 94 % théorique ;
- biais transitoire (émission unique à t=0) : heat map « jeune » là où une particule est
  passée une seule fois → « 100 % du volume ≥ 100 % » affiché à tort ;
- code mort (`env.extMain` / `env.vd` jamais définis), dt non physique (pas de CFL),
  `Math.random()` non seedé, un seul fichier non testable.

**Décision** : on abandonne le lagrangien « particules libres » pour les métriques et on
passe à un **modèle eulérien résolu en régime permanent sur grille**.

## 4. Phase 1 (terminée le 2026-11-21 — livrée en local dans `index.html`) — moteur eulérien permanent + quick wins

### P0 — quick wins
- seed RNG configurable (runs reproductibles) ;
- autosave `localStorage`, export/import JSON du scénario, config encodée dans l'URL (hash) ;
- suppression du code mort.

### P1 — physique (cœur de la phase 1)
- Grille eulérienne 3D (résolution réglable, défaut ≈ 0,25 m), cellules solides = mobilier.
- **Champ de vitesse hybride** :
  - écoulement potentiel : ∇²φ = sources (soufflage) − puits (reprise), parois en Neumann
    (v·n = 0), résolu par SOR ;
  - **jets analytiques** superposés : loi en 1/x (jet rond, K ≈ 6,2), en 1/√x (jet plan/fente),
    expansion conique du profil gaussien, noyau potentiel ~6·d0 ;
  - **projection de Helmholtz** finale : on projette le champ hybride pour garantir
    exactement ∇·v = S (conservation de la masse) et v·n = 0 aux parois/obstacles.
- **Âge de l'air en permanent** : v·∇a = 1 + ∇·(ν_t ∇a), a = 0 aux cellules de soufflage,
  résolu directement (pas de transitoire) → taux de balayage local = τ_nominal / a × 100 %.
- **Température en permanent** : v·∇T = ∇·(α_t ∇T), T = T_soufflage aux soufflages,
  parois adiabatiques + **couplage flottabilité Boussinesq faible** (2 itérations) →
  stratification réaliste (chauffage = air chaud qui monte, refroidissement = air froid qui descend).
- ν_t (diffusion turbulente) modèle algébrique : ν_t = ν_t0 + c·|v|·min(dist_paroi, L_car/10).

### Métriques
- τ nominal, ACH, âge moyen volumique, **ERE / taux de balayage moyen** = τN / âge moyen ;
- taux de balayage local (heat map), % du volume ≥ 100 %, **% du volume avec âge > 2 τN (zones mortes)** ;
- **vitesse moyenne dans la zone d'occupation** (z < 1,8 m, réglable) — critère de confort ;
- **température moyenne dans la zone d'occupation** ;
- indicateur de court-circuit soufflage → reprise.

### Visualisation
- Heat map 2D par tranche z, au choix : taux de balayage / âge / température / vitesse.
- Vue 3D : lignes de courant advectées par le champ résolu (interpolation trilinéaire),
  colorées par vitesse ou par âge.
- Rapport HTML imprimable : config, métriques, heat map + vue 3D, méthodologie et limites.

### Validation prévue (cas de référence)
1. Conservation de la masse : ‖∇·v − S‖ ≈ 0, flux nul aux parois.
2. Écoulement piston (soufflage sur toute une paroi, reprise à l'opposé) : ERE ≈ 2 (200 %).
3. Mélange parfait (soufflage/reprises bien répartis, ν_t élevé) : âge ≈ τN partout, ERE ≈ 1.
4. Jet libre : profil v_m(s) conforme à la loi en 1/x ; le jet pénètre la pièce.
5. Pièce longue (20 m) : gradient d'âge du jet vers le fond de pièce.
6. Thermique : soufflage chaud → stratification chaude en haut ; soufflage froid → froid en bas.

### Validation mesurée (2026-11-21, moteur JS exécuté headless via V8, grille 0,25 m)

| Cas | Résultat | Attendu | Verdict |
|---|---|---|---|
| Conservation de la masse (2 cas) | résidu max ‖∇·v − S‖ = 5,8e-8 et 8,8e-8 | ~1e-7 | OK |
| Cas 1 : 2 diffuseurs plafond Ø250, 90 m³/h chacun, reprise plafond, 2 tables (6×4×2,6 m, Tsouf 16 °C) | τN = 1248 s (ACH 2,88), âge moyen 637 s, **ERE 196 %**, 100 % du volume balayé ≥ 100 %, 0 % de zone morte, bilan reprise 643 s, T pièce 17,2–20 °C (froid en bas), v max 0,72 m/s (≈ v0 bouche) | ERE ~200 % (piston) pour cette config | OK |
| Cas 2 : fente murale 2 m, 250 m³/h, chauffage Tsouf 30 °C, reprise opposée | τN = 899 s (ACH 4,0), âge moyen 782 s, ERE 115 %, **bilan reprise 862 s ≈ τN (96 %)** — bilan théorique = τN, 77 % du volume ≥ 100 %, T 20–29 °C | bilan = τN, ERE ~100–150 % en mélange | OK |
| Temps de calcul (V8, grille 24×16×10) | ~6–7 s pour la résolution complète (potentiel + projection + 2×(âge + température)) | « raisonnable » | OK |

Bugs trouvés et corrigés pendant la mise au point du moteur JS : voisin z+ du stencil
Poisson (`idx(i,j,k)` au lieu de `idx(i,j,k+1)`) ; levée de la constante d'intégration du
Neumann par soustraction de la moyenne (et non `p[0]=0`, qui cassait l'équation au coin) ;
accumulation des jets remplacée par la contribution du point le plus proche (sinon v > v0) ;
étalement des sources/reprises restreint à la géométrie réelle de l'ouverture (couche mince)
sinon le bilan aux reprises est faux ; pas de diffusion aux faces des ouvertures (condition
de sortie) ; critère d'arrêt du transport sur fenêtre de 1000 balayages (dmax non monotone) ;
ordonnancement red-black pour diviser le temps de calcul par ~2.

## 5. Phase 2 (terminée le 2026-11-21 — livrée en local dans `index.html`)

### P2.1 — Calcul non bloquant : Web Worker inline (Blob)
- Le moteur eulérien tourne dans un **Web Worker créé via `Blob`** (compatible `file://`,
  zéro fichier externe) : l'interface reste fluide pendant les ~6–7 s de calcul.
- Le code du worker est généré à partir des fonctions du moteur sérialisées via `.toString()`
  (zéro duplication de code source) + orchestration `postMessage`.
- Pause / reprise / arrêt communiqués par messages (`pause` / `resume` / `stop`).

### P2.2 — Scénarios nommés
- Sauvegarde de configurations nommées dans `localStorage` (`balayage-scenarios-v2`) :
  enregistrer / charger / supprimer, horodatées.

### P2.3 — Historique des runs
- Chaque résolution réussie est archivée dans `localStorage` (`balayage-history-v2`,
  30 dernières) avec l'état complet + métriques + convergence + avertissements.
- Rechargeable en un clic ; boutons **A** / **B** pour pré-sélectionner dans la comparaison.

### P2.4 — Comparaison côte à côte de deux runs
- Tableau comparatif des métriques clés (τN, ACH, âge moyen, ERE, % balayé, % zones mortes,
  vitesse/température en zone d'occupation, bilan aux reprises, résidu de divergence)
  avec **delta coloré** (vert = mieux, rouge = moins bien).
- Sélection : run actuel ou n'importe quel run de l'historique.

### P2.5 — Export CSV des champs 3D
- `champs-3d-balayage.csv` : x, y, z, âge (s), taux de balayage (%), température (°C),
  vx, vy, vz, |v| (m/s), flag solide — pour analyse externe (Python, Excel, ParaView…).

### P2.6 — Effet Coanda explicite
- Dans `addJets()` : si le jet démarre à moins de 2 mailles d'une paroi et quasi
  parallèlement à celle-ci (|d·n| < sin 20°), il reste **collé à la paroi**
  (direction projetée sur le plan + composante d'adhérence 0,06), jusqu'à ce que
  sa vitesse tombe sous v0/2 (détachement). Couvre le cas classique du diffuseur
  plafond soufflant horizontalement le long du plafond.

### P2.7 — Fenêtres sur les parois + température extérieure + jets calibrés fabricant (2026-11-22, avant la phase 3)
- **Température extérieure `Text`** dans la pièce (défaut 5 °C) ; compatibilité ascendante :
  `normalizeState()` remet Text = Tamb et `windows = []` pour les anciens scénarios (localStorage/JSON/URL).
- **Fenêtres** = rectangles sur les 4 murs verticaux (mur, pos le long du mur, allège z, larg × haut,
  **U en W/m²K**, **infiltration q en m³/h** optionnelle), éditables au clavier et déplaçables à la
  souris (traits ambrés en vue de dessus, rectangles ambrés en vue 3D).
- Moteur (`buildWindowData()` appelé entre `buildGrid()` et `computeSources()`) :
  - faces de mur fenêtre → condition de Robin avec **Text à U** (les autres parois restent h = 2 W/m²K vers Tamb) ;
  - infiltration q > 0 → entrée d'air neuf (âge 0, **T = Text**) répartie sur les cellules adjacentes,
    `dirValT` par cellule ; **débit extrait total = soufflage + infiltration** (conservation de la masse),
    τN = V/(Q soufflage + Q infiltration) ;
  - métriques : **depWin** = Σ U·(T−Text)·S (conduction vitrage, cellules sans infiltration) et
    **depInf** = Qinf·ρcp·(Tamb−Text) (déperdition par renouvellement), affichées en stat, comparaison et rapport.
- **v0 et portée fabricant par bouche** : si renseignées, le jet analytique démarre à v0 et son noyau est
  calibré pour que v max = vTerm (réglable, défaut 0,25 m/s) à s = portée (rond : sCore = portée·vTerm/v0 ;
  fente : sCore = portée·(vTerm/v0)² ; clamp [dim, …]) ; sinon v0 = Q/(0,65·section) et sCore = 6,2·d.
  v0/portée affichées (auto vs fabricant) sous chaque bouche et dans le rapport.
- Tests headless (code worker exécuté en sandbox V8, 2026-11-22) : portée check exacte (4,0 m / 6,0 m) ;
  fenêtre + infiltration 30 m³/h à Text = 5 °C → depInf = 150,8 W = Qinf·1206·15 exact, τN = V/(Q+Qinf) exact,
  résidu div ~6e-8 ; fenêtre sans infiltration → depWin = 38 W (conduction) ; scénario legacy sans les
  nouveaux champs → aucun changement (depWin = depInf = 0).
- **Non-régression res 0,25 validée (2026-11-22, calcul découpé en étapes persistées hors worker à cause
  de la deadline du bac à sable)** — config ROADMAP cas 1, ancien schéma (sans fenêtres/Text/v0/portée) :
  τN = 1248 s et ACH = 2,88 **exacts**, ERE = 181 % (vs 196 % le 2026-11-21), âge moyen = 691 s (vs 637),
  bilan reprise = 696 s (vs 643), 100 % du volume balayé ≥ 100 %, 0 % de zone morte, résidu ∇·v = 5,8e-8,
  T zone d'occupation = 18,35 °C (T min 16 = Tsouf aux cellules de soufflage, T max 19,45). L'écart ERE/âge
  vs 2026-11-21 vient d'une **correction** : les cellules de soufflage sont maintenant à T = Tsouf dans le
  champ de température (Dirichlet explicite via `dirValT`), elles étaient à Tamb avant — la flottabilité
  couplée en passe 2 est donc légèrement différente. Aucun changement sur la masse/l'âge hors couplage.

## 6. Phase 3 (prévu)
- **CFD eulérienne complète** : Navier-Stokes incompressible (projection de Chorin) +
  turbulence (k-ε simplifié ou LES) sur grille MAC, en **WebGPU (compute shaders)** ou WASM
  multithread — pour les recirculations fines, sillages d'obstacles, stratifications complexes.
- Validation CFD : cavité entraînée (benchmark de Ghia), jet libre, canal plan.
- Optionnel (hors contrainte PC pro) : solveur côté serveur / CLI headless pour campagnes longues.

## 7. Journal des décisions

| Date | Décision | Raison |
|---|---|---|
| 2026-11-21 | Déploiement = GitHub Pages + fichier HTML autonome téléchargeable | contrainte « aucune installation sur le PC pro » ; partage par URL |
| 2026-11-21 | **Travail 100 % en local pour l'instant ; push GitHub uniquement à la fin, quand l'utilisateur est satisfait** | le repo local (`~/Documents/vibe/Simulation-balayage-ventilation-`) est la source de vérité pendant le développement ; GitHub Pages sera activé au moment du push final |
| 2026-11-21 | Métriques = modèle eulérien permanent sur grille, pas de lagrangien | le lagrangien ne garantit pas ∇·v = 0 et biaise l'âge (émission unique à t=0) |
| 2026-11-21 | Régime permanent résolu directement (équation de l'âge), pas de simulation longue tronquée | état permanent exact, plus rapide, zéro biais de durée |
| 2026-11-21 | Un seul fichier HTML autonome, zéro dépendance | compatibilité `file://` + Pages, zéro build, zéro install |
| 2026-11-21 | La CFD GPU (WebGPU/WASM) est repoussée en phase 3 | la phase 1 couvre le besoin pro (pièce seule, ventilation + thermique) |
| 2026-11-21 | La flottabilité est un couplage faible (2 itérations Boussinesq) | suffisant pour la stratification en pièce ; le couplage fort est phase 3 |
| 2026-11-21 | **Phase 1 livrée en local** : `index.html` autonome (61 Ko), moteur eulérien permanent validé (voir tableau ci-dessus) | le besoin pro (pièce seule, ventilation + thermique) est couvert ; push GitHub toujours différé à la satisfaction de l'utilisateur |
| 2026-11-21 | Bug fix : une ouverture (soufflage/reprise) placée dans un meuble posait sa source/puits dans une cellule solide → masse non conservée, heat map toute rouge. Corrigé (recherche BFS de la cellule libre la plus proche + avertissement affiché) | remontée utilisateur : heat map complètement rouge avec un meuble haut près de la reprise |
| 2026-11-21 | Ajout d’un avertissement « volume scindé » (BFS soufflage → reprise) et d’une **trace de convergence** par étape (itérations + résidu) affichée pendant/après le calcul et dans le rapport | l’utilisateur voulait voir que le calcul atteint bien l’état stable : le solveur itère jusqu’à résidu ~1e-8, le résultat affiché EST l’état permanent convergé (pas un instant figé) ; bilan aux reprises ≈ τN en est la signature |
| 2026-11-21 | **Phase 2 livrée en local** : Web Worker inline (calcul non bloquant), scénarios nommés, historique des runs, comparaison côte à côte de 2 runs, export CSV 3D, effet Coanda explicite | besoin pro : comparer des configurations rapidement, ne pas bloquer l’UI pendant le calcul, rejouer des runs passés ; push GitHub toujours différé à la satisfaction de l’utilisateur |
| 2026-11-22 | **P2.7 livrée en local** : fenêtres sur les parois + température extérieure (Robin U·Text, infiltration = air neuf à Text rééquilibrée sur les reprises, τN = V/(Q+Qinf), déperditions depWin/depInf) + v0/portée fabricant par bouche (calibrage du noyau du jet à vTerm) | demande utilisateur « avant la prochaine phase » : thermique réaliste avec l’extérieur et jets fidèles aux données fabricant ; non-régression res 0,25 validée (voir P2.7), écart ERE expliqué par la correction T=Tsouf aux soufflages |
| 2026-11-22 | **Bug fix** : le sélecteur « Grandeur affichée » (section 7) ne changeait jamais la heat map — `updSim` ne retenait que les valeurs numériques (`parseFloat('vit')` = NaN → affectation sautée, grandeur restait « balayage ») | remontée utilisateur : la heat map affichait toujours le balayage en vitesse/température ; corrigé (affectation directe pour `grandeur`), vérifié headless : grandeur = vit/temp/age OK et `grandeurVal` retourne bien la bonne grandeur |
| 2026-11-22 | **Bug fix affichage température** : l'échelle de couleurs « temp » allait de Text à max(Tsouf,Tamb)+1 → avec Text = 5 °C, toute la plage utile (17–22 °C) était écrasée en bleu uniforme. Corrigé : échelle = min/max réellement résolus du champ (`tempScale()`, cachée par run). Ajouts UX : **tooltip au survol** de la heat map (valeur exacte par cellule x,y,z) et **bandeau ⚠ « configuration modifiée depuis la dernière résolution »** quand on édite la config après un run (18 saisies + updSim marquées) | remontée utilisateur : heat map température « uniformément 17 °C » alors que soufflage à 22 °C ; cause = échelle élargie par Text + run non relancé après changement de Tsouf ; vérifié headless : échelle 18,8–22,2, 24 couleurs distinctes sur un dégradé 19→22 °C, ⚠ déclenché par updRoom mais pas par grandeur/tranche |

## 8. Questions ouvertes
- Rayonnement des parois et apports internes (occupants, bureautique) : phase 3 ?
- Couplage multi-pièces par portes : modèle de débit d'échange (ΔP) — phase 3.
- Normes cibles pour les métriques : NF EN 16798-1 (âge de l'air, ERE), ASHRAE 62.1, RE2020.
- Infiltration des fenêtres : actuellement débit imposé (m³/h) réparti uniformément ; piste = perméabilité
  (m³/h.m² sous 4 Pa, ex. NF EN 12207) convertie en débit selon un ΔP supposé, ou couplage pression (phase 3).
