# Construit public/data.js à partir des 30 questions (questions2.py) + liens musée + banque du Sphinx.
import json, re, sys, pathlib
src = pathlib.Path(sys.argv[1]).read_text()
qsrc = src[src.index("Q=["):src.index("\nout=[]")]
ns = {}; exec(qsrc, ns); Q = ns["Q"]
B = "https://www.mahmah.ch/collection/oeuvres/"
LINKS = {
 "008938": ("statue-monumentale/008938", "Triomphateur, père de Trajan ?"),
 "008936": ("statue-fragment/008936", "Aphrodite au bain"),
 "026102": ("groupe-sculpte-fragment/026102", "Tête d'Achille du groupe d'Achille et Penthésilée"),
 "024692": ("cratere-volutes/024692", "Deux jeunes suppliantes sur un autel"),
 "MF 1351": ("relief-funeraire/mf-1351", "Repas funèbre"),
 "023471": ("kylix/023471", "Léda et le cygne"),
 "EPI 0728": ("socle-de-statue-avec-inscription/epi-0728", "Inscription des nautes du Léman en l'honneur de Quintus Decius Alpinus"),
 "016908": ("coupe/016908", "Satyre plongeant dans un pithos"),
 "M 0099": ("figurine/m-0099", "Sucellus"),
 "008944": ("groupe-sculpte/008944", "L'enfant à l'oie"),
 "EPI 0002": ("autel-avec-inscription/epi-0002", "Autel dédié à Mithra"),
 "EPI 0279": ("autel-avec-inscription/epi-0279", "Autel dédié à Neptune"),
 "MF 0154": ("amphore/mf-0154", "La naissance d'Athéna"),
 "EPI 0328": ("bloc-avec-inscription/epi-0328", "Dédicace à Genava"),
 "021132": ("lecythe/021132", "La mort de Memnon dans les bras d'Eos"),
 "008188": ("fermeture-de-niche-sepulcrale/008188", "Fermeture de niche sépulcrale au nom de Taïmé"),
 "EPI 0530": ("borne-milliaire/epi-0530", "Milliaire au nom d'Elagabal"),
 "026003": ("sarcophage-monumental/026003", "Sarcophage monumental"),
 "014989": ("amphore-tableaux/014989", "Héraclès combattant le lion de Némée entre Athéna et Iolaos"),
 "007195": ("bague-remploi-dun-scarabee/007195", "Athéna Promachos"),
 "MF 1361": ("cuve-de-sarcophage-denfant/mf-1361", "Neuf Amours forgeant les armes d'Achille"),
 "020251": ("scarabee/020251", "Hercule remplissant une amphore à la source"),
 "023472": ("lekane/023472", "Le monstre Scylla"),
 "MF 1279": ("figurine/mf-1279", "Jupiter, maître du ciel et père de tous les dieux"),
 "MF 2910": ("pate-de-verre-imitant-une-intaille/mf-2910", "La louve allaitant Romulus et Remus, avec le berger Faustulus"),
 "MF 0152": ("amphore/mf-0152", "Thésée luttant contre le Minotaure"),
 "023436": ("sarcophage/023436", "Sarcophage-baignoire aux poulpes et poissons"),
 "C 1241": ("plat-de-largition/c-1241", "Missorium de Valentinien II (?)"),
 "1983-0017": ("homere-chantant-son-odyssee-lentree-dune-bourgade-de-grece/1983-0017", "Homère chantant son Odyssée"),
 "1986-0128": ("leda-et-le-cygne/1986-0128", "Léda et le cygne (Pradier)"),
}
# Vidéos-énigmes : numéro du prompt -> inventaire
VIDEOS = {"MF 0154": 1, "MF 0152": 2, "014989": 3, "016908": 4, "MF 2910": 5, "023472": 6, "MF 1361": 7, "008944": 8, "026003": 9, "1983-0017": 10}
QUIZ = []
for i, (inv, zone, salle, en, ind, q, fmt, acc, ok, bad, ex) in enumerate(Q):
    path, titre = LINKS[inv]
    d = dict(id=i + 1, inv=inv, zone=zone, salle=salle, enigme=en, indice=ind, question=q, format=fmt, acc=acc,
             bonne=ok, fausses=bad, expl=ex, url=B + path, titre=titre)
    if inv in VIDEOS: d["video"] = f"videos/enigme-{VIDEOS[inv]:02d}.mp4"
    QUIZ.append(d)
assert len(QUIZ) == 30

SPHINX = [
 ("Qui a volé le feu aux dieux pour le donner aux hommes ?", "Prométhée", ["Hermès", "Héphaïstos", "Dédale"]),
 ("Quel héros a tranché la tête de Méduse ?", "Persée", ["Thésée", "Héraclès", "Jason"]),
 ("Comment s'appelle le chien à trois têtes qui garde les Enfers ?", "Cerbère", ["Argos", "Orthros", "Ladon"]),
 ("Quel dieu romain correspond à Hermès ?", "Mercure", ["Mars", "Vulcain", "Neptune"]),
 ("Qui a construit le labyrinthe de Crète ?", "Dédale", ["Icare", "Minos", "Thésée"]),
 ("Quelle déesse est sortie tout armée de la tête de Zeus ?", "Athéna", ["Artémis", "Héra", "Aphrodite"]),
 ("Combien de travaux Héraclès a-t-il accomplis ?", "Douze", ["Sept", "Dix", "Neuf"]),
 ("Qui a aidé Thésée à sortir du labyrinthe grâce à un fil ?", "Ariane", ["Phèdre", "Médée", "Hélène"]),
 ("Quel monstre posait une énigme aux voyageurs devant Thèbes ?", "Le Sphinx", ["La Chimère", "Le Minotaure", "L'Hydre"]),
 ("Comment s'appelle le cheval ailé né du sang de Méduse ?", "Pégase", ["Bucéphale", "Arion", "Chiron"]),
 ("Quel est le nom grec de Vénus ?", "Aphrodite", ["Héra", "Déméter", "Hestia"]),
 ("Qui fut, selon la légende, le premier roi de Rome ?", "Romulus", ["Rémus", "Numa", "Énée"]),
 ("Quel Troyen fuit sa ville en portant son père sur ses épaules ?", "Énée", ["Hector", "Pâris", "Priam"]),
 ("Quel dieu règne sur le monde des morts ?", "Hadès", ["Hermès", "Arès", "Cronos"]),
 ("Sous quelle forme Zeus enlève-t-il Europe ?", "Un taureau", ["Un cygne", "Un aigle", "Un bélier"]),
 ("Qui ouvre la jarre d'où s'échappent tous les maux du monde ?", "Pandore", ["Psyché", "Io", "Danaé"]),
 ("Que signifie « aqua » ?", "l'eau", ["la terre", "le feu", "l'air"]),
 ("Que signifie « puella » ?", "la jeune fille", ["la reine", "la déesse", "la servante"]),
 ("Que signifie « bellum » ?", "la guerre", ["la beauté", "la ville", "le chemin"]),
 ("Que signifie « dominus » ?", "le maître", ["l'esclave", "l'ami", "le soldat"]),
 ("Quel est le génitif singulier de « rosa » ?", "rosae", ["rosam", "rosis", "rosā"]),
 ("Dans « Puella rosam amat », quelle est la fonction de « rosam » ?", "CVD", ["sujet", "CVI", "CP"]),
 ("Quelle est la désinence de l'accusatif singulier de « dominus » ?", "-um", ["-i", "-o", "-us"]),
 ("« Amo, amas, amat » : à quelle personne est « amat » ?", "3e pers. du singulier", ["1re pers. du singulier", "2e pers. du singulier", "3e pers. du pluriel"]),
 ("Quel nombre s'écrit XIV en chiffres romains ?", "14", ["16", "9", "11"]),
 ("Quel nombre s'écrit XXII en chiffres romains ?", "22", ["17", "12", "27"]),
 ("Que signifie l'abréviation SPQR ?", "Le Sénat et le peuple romain", ["Le sceau public de Rome", "Les soldats protègent la reine", "Le salut du peuple de Rome"]),
 ("À quelle conjugaison appartient « moneo, monere » ?", "2e conjugaison", ["1re conjugaison", "3e conjugaison", "4e conjugaison"]),
 ("Que signifie « via » ?", "la route", ["la vie", "la ville", "la voix"]),
 ("Dans « Veni, vidi, vici », que veut dire « vici » ?", "j'ai vaincu", ["j'ai vécu", "j'ai vu", "je suis venu"]),
]
SPHINX = [dict(q=q, ok=ok, bad=bad) for q, ok, bad in SPHINX]

CURSES = {
 "meduse": dict(nom="Regard de Méduse", prix=10, court="Pétrifié 20 s", desc="Méduse fixe le groupe visé : il est pétrifié pendant une scène impassable de 20 secondes, pendant que son chrono continue."),
 "sphinx": dict(nom="Énigme du Sphinx", prix=15, court="Bloqué par le Sphinx", desc="Le Sphinx barre la route : le groupe visé doit répondre juste à une question de mythologie ou de latin. Chaque erreur le bloque 10 secondes.", video="videos/sphinx.mp4"),
 "dedale": dict(nom="Labyrinthe de Dédale", prix=12, court="Énigme brouillée", desc="Les mots de l'énigme du groupe visé sont mélangés pendant 60 secondes."),
 "brouillard": dict(nom="Brouillard des Enfers", prix=15, court="Pas d'indice de salle", desc="Le groupe visé ne reçoit pas l'indice « salle » de son énigme."),
 "tantale": dict(nom="Supplice de Tantale", prix=10, court="Pas de joker", desc="Le joker à choix multiples n'apparaît pas pour le groupe visé : réponse tapée obligatoire."),
 "colere": dict(nom="Colère des dieux", prix=10, court="Scène divine impassable", desc="Une scène des dieux, drôle et instructive, de 15 à 25 secondes, tirée au hasard. Impossible à passer : le chrono du groupe visé continue."),
 "pandore": dict(nom="Boîte de Pandore", prix=6, court="Surprise", desc="Une malédiction tirée au hasard… ou parfois un cadeau pour le groupe visé !", video="videos/pandore.mp4"),
}
PROTECTIONS = {
 "egide": dict(nom="Égide d'Athéna", prix=15, desc="Annule la prochaine malédiction reçue."),
 "miroir": dict(nom="Miroir de Persée", prix=25, desc="Renvoie automatiquement la prochaine malédiction à son expéditeur."),
}
BOONS = {
 "don5": dict(nom="Offrande d'Hermès", prix=5, desc="Offrez 5 de vos sesterces au groupe choisi."),
 "don10": dict(nom="Grande offrande d'Hermès", prix=10, desc="Offrez 10 de vos sesterces au groupe choisi."),
 "egide": dict(nom="Égide offerte", prix=15, desc="Le groupe choisi reçoit une Égide d'Athéna, qui annule sa prochaine malédiction."),
 "apollon": dict(nom="Faveur d'Apollon", prix=8, desc="Révèle tout de suite la salle de l'énigme du groupe choisi, même sous le Brouillard des Enfers."),
}
SCENES = [
 dict(id="meduse", nom="Regard de Méduse", dur=20, video="videos/scene-meduse.mp4",
  captions=[[0, "Regardez-moi bien dans les yeux…"], [7, "Trop tard."], [14, "Oh non, pas le bouclier !"], [17, "…"]],
  fact="Méduse était la seule mortelle des trois Gorgones. Persée l'a vaincue sans la regarder, en se guidant grâce au reflet de son bouclier. Athéna a ensuite fixé sa tête sur son égide.",
  voir="l'égide d'Athéna sur la bague étrusque, salle 114",
  flash=dict(q="Comment Persée a-t-il évité le regard de Méduse ?", ok="En regardant son reflet dans un bouclier", bad=["En se bandant les yeux", "En l'attaquant pendant la nuit", "En portant un casque à visière"])),
 dict(id="zeus", nom="Les métamorphoses de Zeus", dur=24, video="videos/scene-zeus.mp4",
  captions=[[0, "Venez voir mes photos de vacances !"], [6, "Ici, j'étais un cygne…"], [9, "Là, un taureau !"], [13, "Une pluie d'or…"], [16, "…et un aigle, magnifique !"], [19, "Ne partez pas, il m'en reste trois cents !"]],
  fact="Zeus change de forme pour approcher ceux qu'il convoite : un cygne pour Léda, un taureau pour enlever Europe, une pluie d'or pour Danaé, un aigle pour emporter Ganymède. Le continent européen porte le nom de la princesse Europe.",
  voir="Léda et le cygne, sur une coupe (salle 114) et en ivoire par Pradier (salle 408)",
  flash=dict(q="Quel continent porte le nom d'une princesse enlevée par Zeus ?", ok="L'Europe", bad=["L'Asie", "L'Afrique", "L'Océanie"])),
 dict(id="controle", nom="Contrôle à la porte de Genava", dur=20, video="videos/scene-controle.mp4",
  captions=[[0, "Ave ! Contrôle à la porte de Genava."], [4, "Praenomen ?"], [7, "Nomen ?"], [10, "Cognomen ?"], [13, "Pas de cognomen ? Hmm…"], [16, "Retournez au bout de la file !"]],
  fact="Un citoyen romain porte trois noms (tria nomina) : le prénom (praenomen), le nom de famille (nomen) et le surnom (cognomen). César décrit Genava comme « la dernière ville des Allobroges, la plus proche du territoire des Helvètes ».",
  voir="l'inscription de Quintus Decius Alpinus, dans la cour",
  flash=dict(q="Dans « Quintus Decius Alpinus », quel est le cognomen ?", ok="Alpinus", bad=["Quintus", "Decius", "Il n'en a pas"])),
 dict(id="appia", nom="Bouchons sur la Via Appia", dur=20, video="videos/scene-appia.mp4",
  captions=[[0, "Via Appia, heure de pointe…"], [5, "Ça n'avance plus."], [9, "La faute à qui ? À l'âne."], [13, "Il refuse de bouger."], [16, "Prochaine borne : encore un mille…"]],
  fact="La Via Appia, ouverte en 312 av. J.-C. par Appius Claudius, relie Rome au sud de l'Italie. Les routes romaines étaient jalonnées de bornes milliaires : un mille, soit mille doubles pas, mesure environ 1,5 km.",
  voir="la borne milliaire d'Élagabal, dans la cour",
  flash=dict(q="Combien mesure environ un mille romain ?", ok="1,5 km", bad=["1 km", "500 m", "5 km"])),
 dict(id="sisyphe", nom="Le supplice de Sisyphe", dur=20, video="videos/scene-sisyphe.mp4",
  captions=[[0, "Chargement de votre énigme…"], [6, "Encore un effort…"], [11, "Presque…"], [14, "99 %…"], [16, "Oh non. Pas encore."]],
  fact="Sisyphe, roi de Corinthe, a trompé les dieux et même la Mort. Aux Enfers, il est condamné à pousser un rocher en haut d'une colline, qui retombe toujours avant le sommet. D'où l'expression « un travail de Sisyphe ».",
  voir=None,
  flash=dict(q="Que veut dire « un travail de Sisyphe » ?", ok="Une tâche sans fin, toujours à recommencer", bad=["Un travail très bien payé", "Un travail fait en secret", "Un travail réservé aux rois"])),
 dict(id="cresus", nom="Le trésor de Crésus", dur=18, video="videos/scene-cresus.mp4",
  captions=[[0, "Le trésor de Crésus…"], [4, "Le roi le plus riche du monde antique…"], [8, "Et dans son coffre…"], [11, "…une mite."], [14, "Elle aussi trouve que vous perdez votre temps."]],
  fact="Crésus régnait sur la Lydie (actuelle Turquie) au VIe siècle av. J.-C. Sa richesse était légendaire, d'où « riche comme Crésus ». La Lydie a frappé parmi les toutes premières monnaies, en électrum, un mélange naturel d'or et d'argent.",
  voir="les monnaies antiques du musée",
  flash=dict(q="En quel métal la Lydie frappait-elle ses premières monnaies ?", ok="L'électrum, mélange d'or et d'argent", bad=["Le bronze", "Le fer", "Le plomb"])),
 dict(id="hermes", nom="La farce d'Hermès", dur=16, video="videos/scene-hermes.mp4",
  captions=[[0, "Félicitations !"], [3, "Vous avez gagné un cadeau des dieux !"], [7, "Et c'est…"], [9, "…du temps perdu !"], [12, "Et merci pour les sandales !"]],
  fact="Hermès est le messager des dieux et le protecteur des voyageurs, des marchands… et des voleurs. Le jour de sa naissance, il vole les vaches d'Apollon et invente la lyre avec une carapace de tortue.",
  voir=None,
  flash=dict(q="Avec quoi Hermès bébé fabrique-t-il la première lyre ?", ok="Une carapace de tortue", bad=["Une corne de bélier", "Une coquille d'escargot", "Un bouclier de bronze"])),
]
out = "/* Données du jeu (générées par tools/build_data.py) */\nwindow.TG=" + json.dumps(dict(QUIZ=QUIZ, SPHINX=SPHINX, CURSES=CURSES, PROTECTIONS=PROTECTIONS, BOONS=BOONS, SCENES=SCENES), ensure_ascii=False) + ";\n"
pathlib.Path(sys.argv[2]).write_text(out)
print("ok", len(QUIZ), len(SPHINX))
