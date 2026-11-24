# Thesaurus Genavensis

Chasse au trésor et guerre des malédictions au Musée d'art et d'histoire de Genève, pour des groupes de 2 à 3 élèves (4 à 8 groupes par partie).

- `/` : le jeu des élèves (code de partie, 8 énigmes, Temple des malédictions)
- `/prof.html` : le tableau de bord enseignant (créer une partie, suivi en direct, réglages, repérage, solutions)

## Mise en ligne sur Netlify

1. Netlify → **Add new project → Import an existing project → GitHub**, choisir ce dépôt.
2. Laisser les réglages proposés (le fichier `netlify.toml` s'en charge) et lancer le déploiement.
3. (Conseillé) **Project configuration → Environment variables** : ajouter `PROF_PASSWORD` avec votre mot de passe enseignant. Sans cette variable, le mot de passe est `SPQR`.

Les données de partie (noms de groupes, scores, malédictions) sont stockées dans Netlify Blobs et effacées chaque jour au-delà de 48 heures, ou immédiatement via « Terminer et effacer la partie ». Les photos des élèves restent sur leur téléphone.

## Vidéos

Déposer les clips (format 2:3, MP4, quelques Mo chacun) dans `public/videos/` :

| Fichier | Contenu |
|---|---|
| `enigme-01.mp4` … `enigme-10.mp4` | Énigmes vidéo (numéros des prompts) |
| `meduse.mp4` | Malédiction : Regard de Méduse |
| `sphinx.mp4` | Malédiction : Énigme du Sphinx |
| `pandore.mp4` | Malédiction : Boîte de Pandore |

Une vidéo absente est remplacée automatiquement par le texte de l'énigme (ou un effet visuel pour les malédictions).

## Modifier les questions

Les énigmes, la banque du Sphinx et les prix sont dans `public/data.js`, généré par `tools/build_data.py` à partir de `tools/questions_source.py`.

## Test en local

`npm install` puis `node tools/devserver.mjs` (stockage en mémoire), et ouvrir http://localhost:8899.
