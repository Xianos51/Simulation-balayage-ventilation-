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

1. **Pièce & conditions** : dimensions L × l × H, températures ambiante, de soufflage et
   **extérieure** (Text, utilisée par les fenêtres des parois).
2. **Fenêtres sur les parois** : chaque fenêtre est un rectangle sur un mur vertical
   (mur x=0, x=L, y=0, y=l) : position le long du mur, allège (z), largeur × hauteur,
   **U (W/m²K)** du vitrage et **infiltration (m³/h)** optionnelle. Les faces concernées
   échangent thermiquement avec l'extérieur à Text ; l'infiltration est traitée comme de
   l'air neuf (âge 0) à Text, et le débit total extrait = soufflage + infiltration.
   Les fenêtres se déplacent aussi à la souris (traits ambrés « F1… » sur la vue de dessus).
2bis. **Fenêtres** : en plus du débit d'infiltration imposé (m³/h), chaque menuiserie peut
   être décrite par sa **perméabilité Q4Pa** (m³/h·m² sous 4 Pa, ex. NF EN 12207) — le débit
   est alors Q = Q4Pa·S·(ΔP/4)^(2/3) avec le ΔP supposé de la section 6.
3. **Bouches de soufflage** : montage (plafond / mur), forme (ronde, carrée, fente, grille),
   position, débit (m³/h), direction/azimut/rotation, et éventuellement **v0 (m/s)** et
   **portée (m)** données par le fabricant : si renseignées, le jet analytique est calibré
   dessus (vitesse = v0, vitesse max = vTerm à la distance = portée) ; sinon v0 est calculée
   depuis Q et la section et la portée découle de la loi standard. Les bouches, reprises,
   fenêtres et le mobilier se déplacent aussi à la souris sur la vue de dessus.
4. **Reprises d'air** : position, taille, débit (auto-rééquilibré sur soufflage + infiltration si non renseigné).
5. **Mobilier & obstacles** : presets ou dimensions libres, avec une **charge thermique (W)**
   par élément (occupant, bureautique, éclairage…) injectée dans le champ de température
   (négatif = source de froid) ; stat « apports internes » et bilan thermique au rapport.
6. **Résolution** : choisir la résolution de grille, la diffusion turbulente, vTerm (seuil de portée des jets) et, **en phase 3** : le nombre de passes de couplage flottabilité (2 = standard, 4-6 = stratification renforcée), le **sillage des obstacles** (opt-in), l'**échange de parois h** (avec option rayonnement +5,5 W/m²K) et le **ΔP supposé** pour la perméabilité des menuiseries, puis
   « Résoudre le champ ». Le calcul tourne dans un **Web Worker** (l'interface reste fluide) ;
   il itère **jusqu’à convergence de l’état permanent** (la ligne de progression affiche les
   itérations et le résidu de chaque étape, repris dans le rapport) : le résultat affiché est
   l’état stable, pas un instant figé. Pause / reprise / arrêt disponibles pendant le calcul.
   Un avertissement s’affiche si une ouverture tombe dans un obstacle (elle est déplacée
   à la cellule libre la plus proche) ou si aucun chemin d’air ne relie soufflages et
   reprises (volume scindé).
7. **Lecture** : heat map 2D par tranche z (balayage / âge / température / vitesse),
   vue 3D de présentation en volume (sol coloré par le champ, cônes de jets, lignes de
   courant et **particules animées** à la vitesse locale), **▶ Mode démo** (rotation
   automatique de la caméra + balayage de la tranche z — pour les présentations clients),
   **⚡ aperçu instantané** (calculé dans le Web Worker, sans blocage) : la heat map se met
   à jour en < 1 s pendant qu'on déplace bouches/reprises/meubles à la souris, et la
   résolution complète se lance au relâchement, indicateurs chiffrés en haut. Les
   **jets rebondissent** : au contact d'une paroi ou d'un obstacle, l'air s'étale en
   jet de paroi (éventail radial, rebond atténué pour l'air froid) et se disperse.
8. **Scénarios enregistrés** : sauvegardez la configuration courante sous un nom
   (localStorage), rechargez-la plus tard, supprimez-la.
9. **Historique des runs** : chaque résolution est archivée automatiquement (30 derniers runs)
   avec ses métriques ; rechargez un run en un clic.
10. **Comparer deux runs** : sélectionnez deux runs (actuel ou archivés) et obtenez un
    tableau comparatif des métriques avec les deltas colorés.
11. **Export** : rapport HTML imprimable (PDF, heat maps compactes 2 par rangée), heat map PNG, **champs 3D CSV** (x,y,z,âge,
    balayage, température, vitesse), scénario JSON (import/export), URL de partage (config dans le hash).

## Lecture des indicateurs

- **τ nominal = V/Q** et **ACH** : renouvellement d'air nominal.
- **Taux de balayage local = τ nominal / âge local de l'air × 100 %** : 100 % = mélange
  parfait local ; > 100 % = air renouvelé plus vite que la moyenne (ex. piston) ;
  < 100 % = air âgé. Bleu = bon balayage, rouge = mauvais, gris = non résolu.
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
- **Phase 3 (optionnelle, défauts neutres)** : couplage flottabilité Boussinesq multi-passes
  (2 à 8), sillage analytique des obstacles (déficit de vitesse en cône en aval des meubles,
  re-projection pour conserver la masse), apports internes du mobilier (W), échange de parois
  h réglable avec rayonnement linéarisé optionnel (+5,5 W/m²K), infiltration par perméabilité
  Q4Pa (NF EN 12207) convertie en débit selon un ΔP supposé, et échelle de couleur adaptative
  (P95 du champ) pour le balayage et la vitesse (plus de saturation « tout rouge »).

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
- `ROADMAP.md` : contexte, arbitrages, phases 1-3, journal des décisions, validation.
- Branches : la branche par défaut sert le site Pages ; les évolutions passent par des
  branches `vibe/...` + pull requests.
