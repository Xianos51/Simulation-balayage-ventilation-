# Simulateur de balayage de ventilation

Outil d'aide au dimensionnement pour vérifier qu'une pièce est **bien ventilée** et
**bien chauffée / refroidie par l'air** : saisie de la pièce, des bouches de soufflage,
des reprises, du mobilier, résolution du champ d'air en régime permanent, et lecture
des flux (heat map de balayage, température, vitesse) + métriques (âge de l'air,
efficacité de renouvellement, vitesse en zone d'occupation).

## Utilisation (zéro installation)

Deux façons, sans rien installer (un navigateur suffit) :

1. **En ligne (recommandé)** : GitHub Pages du repo —
   `https://xianos51.github.io/Simulation-balayage-ventilation-/`
   (activation : `Settings → Pages → Deploy from a branch → <branche par défaut> → /`).
2. **Hors ligne** : télécharger `index.html` et l'ouvrir directement dans le navigateur
   (`file://`). Le fichier est 100 % autonome : aucune dépendance, aucun réseau requis.

## Mode d'emploi

0. **Étude multi-pièces** : une étude contient plusieurs pièces indépendantes (sélecteur en
   section 0 : ajouter / renommer / supprimer, pastille ✓ = pièce résolue). « Résoudre toutes
   les pièces » enchaîne les calculs ; le rapport récapitule toutes les pièces résolues.
1. **Pièce & conditions** : dimensions L × l × H (rectangle) **ou plan polygonal** via
   « ✏️ Éditer le plan » : sur la vue de dessus, glissez les sommets, glissez un milieu de
   bord pour insérer un sommet, double-clic sur un sommet (saisir x,y) ou sur une cote
   (saisir la longueur du bord) — le plan et les côtes se modifient donc directement sur la
   vue en plan. Températures ambiante, de soufflage et **extérieure** (Text, utilisée par
   les fenêtres des bords).
2. **Fenêtres sur les parois** : chaque fenêtre est un rectangle sur un **bord du plan**
   (pièce rectangulaire ou non) : position le long du bord, allège (z), largeur × hauteur,
   **U (W/m²K)** du vitrage et **infiltration (m³/h)** optionnelle. Les faces concernées
   échangent thermiquement avec l'extérieur à Text ; l'infiltration est traitée comme de
   l'air neuf (âge 0) à Text, et le débit total extrait = soufflage + infiltration.
   Les fenêtres se déplacent aussi à la souris (traits ambrés « F1… » sur la vue de dessus).
3. **Bouches de soufflage** : montage **plafond**, **bord du plan** (mur périphérique) ou
   **cloison / meuble** (choisir l'élément et sa face ±x/±y — ex. bouche sur une cloison) ;
   forme (ronde, carrée, fente, grille), position, débit (m³/h, affiché à côté de la bouche
   sur la vue en plan), direction/azimut/rotation, et éventuellement **v0 (m/s)** et
   **portée (m)** données par le fabricant : si renseignées, le jet analytique est calibré
   dessus (vitesse = v0, vitesse max = vTerm à la distance = portée) ; sinon v0 est calculée
   depuis Q et la section et la portée découle de la loi standard. Les bouches, reprises,
   fenêtres et le mobilier se déplacent aussi à la souris sur la vue de dessus.
4. **Reprises d'air** : position, taille, débit (auto-rééquilibré sur soufflage + infiltration si non renseigné).
5. **Mobilier & obstacles** : presets ou dimensions libres.
6. **Résolution** : choisir la résolution de grille, la diffusion turbulente et vTerm (seuil de portée des jets), puis
   « Résoudre le champ ». Le calcul tourne dans un **Web Worker** (l'interface reste fluide) ;
   il itère **jusqu’à convergence de l’état permanent** (la ligne de progression affiche les
   itérations et le résidu de chaque étape, repris dans le rapport) : le résultat affiché est
   l’état stable, pas un instant figé. Pause / reprise / arrêt disponibles pendant le calcul.
   Un avertissement s’affiche si une ouverture tombe dans un obstacle (elle est déplacée
   à la cellule libre la plus proche) ou si aucun chemin d’air ne relie soufflages et
   reprises (volume scindé).
7. **Lecture** : heat map 2D par tranche z (balayage / âge / température / vitesse), rendue
   en **GPU (WebGL)** quand disponible (repli CPU sinon), vue 3D avec lignes de courant,
   indicateurs chiffrés en haut. **Couleurs** : bleu = froid / petit / faible, **rouge = chaud
   / grand / élevé**, sur toutes les grandeurs.
8. **Scénarios enregistrés** : sauvegardez la configuration courante sous un nom
   (localStorage), rechargez-la plus tard, supprimez-la.
9. **Historique des runs** : chaque résolution est archivée automatiquement (30 derniers runs)
   avec ses métriques ; rechargez un run en un clic.
10. **Comparer deux runs** : sélectionnez deux runs (actuel ou archivés) et obtenez un
    tableau comparatif des métriques avec les deltas colorés.
11. **Export** : rapport HTML imprimable (PDF) avec **vue 3D isométrique** et **heat maps
    toutes les 0,5 m**, heat map PNG, **champs 3D CSV** (x,y,z,âge, balayage, température,
    vitesse), **étude JSON complète avec les calculs déjà faits** (toutes les pièces + champs
    3D + métriques : réimportée, elle restaure heat maps et vue 3D sans recalcul), URL de
    partage (config dans le hash).

## Lecture des indicateurs

- **τ nominal = V/Q** et **ACH** : renouvellement d'air nominal.
- **Taux de balayage local = τ nominal / âge local de l'air × 100 %** : 100 % = mélange
  parfait local ; > 100 % = air renouvelé plus vite que la moyenne (ex. piston) ;
  < 100 % = air âgé. Échelle de couleurs commune à toutes les grandeurs : **bleu = froid /
  petit / faible, rouge = chaud / grand / élevé** ; gris = non résolu.
- **ERE (efficacité de renouvellement)** = τN / âge moyen volumique : ~100 % en mélange
  parfait, ~200 % en piston, < 100 % s'il y a des zones mortes / court-circuits.
- **% du volume avec âge > 2 τN** : part de la pièce en zone morte.
- **Vitesse moyenne en zone d'occupation** (z < 1,8 m) : critère de confort
  (< 0,2 m/s en hiver, < 0,3 m/s en été selon NF EN 16798-1).
- **Température en zone d'occupation** : vérifie le chauffage/refroidissement par l'air.
- **Déperditions par les fenêtres (W)** : conduction à travers les vitrages (Σ U·ΔT·S, ΔT = T pièce − Text)
  + déperdition par infiltration (Qinf·ρcp·(Tamb − Text)).
- **Âge aux reprises (bilan)** : moyenne pondérée par le débit à l'extraction ; doit être
  proche de τ nominal (théorie : exactement τN) — un écart = recirculation parasite vers les
  soufflages ou non-convergence.
- **Court-circuit** : âge très faible au voisinage des reprises = une partie de l'air
  soufflé repart directement à la reprise sans balayer la pièce.
- **Résidu ∇·v max** : qualité de la conservation de la masse (doit être ~1e-8).

## Modèle physique (phase 1 + 2)

- Grille eulérienne 3D ; champ de vitesse = écoulement potentiel (sources aux soufflages,
  puits aux reprises, parois sans pénétration) + jets analytiques (loi en 1/x pour les
  jets ronds, 1/√x pour les fentes, expansion conique, **effet Coanda** : jet collé à une
  paroi proche quand il souffle quasi parallèlement à celle-ci), puis **projection de Helmholtz**
  : ∇·v = sources/puits exactement, v·n = 0 aux parois et obstacles. **v0 et portée fabricant** :
  si renseignées, le jet démarre à v0 et son noyau est calibré pour que la vitesse max tombe
  à vTerm (0,25 m/s par défaut) à la distance = portée ; sinon v0 = Q/(0,65·section) et noyau K·d (K = 6,2).
- **Âge de l'air** et **température** résolus en régime permanent sur la même grille
  (advection upwind + diffusion turbulente ν_t), avec couplage flottabilité de Boussinesq
  faible (l'air chaud monte, l'air froid descend).
- **Fenêtres** : les faces de mur concernées sont en condition de Robin avec l'extérieur à
  **Text** et le coefficient U du vitrage (les autres parois échangent avec Tamb, h = 2 W/m²K) ;
  l'infiltration déclarée est une entrée d'air neuf (âge 0) à Text, répartie sur les cellules
  adjacentes, et le débit d'extraction total vaut soufflage + infiltration (conservation de la masse).
- Le calcul tourne dans un **Web Worker inline** (créé via Blob, compatible `file://`) :
  l'interface ne bloque pas pendant la résolution.
- Les lignes de courant 3D sont advectées par ce champ résolu (visualisation).
- **Rendu GPU** : la heat map 2D est dessinée en **WebGL** (la tranche de la grandeur affichée
  est uploadée en texture, la colormap est calculée dans le fragment shader) ; repli
  automatique en canvas 2D (CPU) si WebGL est indisponible. Le plan, les bouches (avec leurs
  débits) et la légende restent en calque 2D vectoriel par-dessus.

## Limites (à lire avant usage pro)

Outil d'aide au dimensionnement et de **comparaison de configurations** — il ne remplace
pas une étude CFD réglementaire ni les exigences des normes applicables (RE2020,
NF EN 16798-1, ASHRAE 62.1, DTU). Le modèle de jets est analytique (pas de sillage fin
derrière les meubles ; l'effet Coanda est modélisé de façon simplifiée — jet collé à une
paroi proche, voir ROADMAP phase 2), et la turbulence est modélisée par une diffusion
turbulente algébrique.

## Dépôt

- Repo : `Xianos51/Simulation-balayage-ventilation-`
- Livrable : `index.html` (fichier unique autonome).
- `ROADMAP.md` : contexte, arbitrages, phases 1-4, journal des décisions, validation.
- Branche par défaut (sert le site Pages) : `vibe/sim-balayage-html-d11000` — le code y est
  poussé directement (source de vérité = le dossier local).
