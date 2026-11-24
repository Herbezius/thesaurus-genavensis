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
 "meduse": dict(nom="Regard de Méduse", prix=10, court="Pétrifié 20 s", desc="Le groupe visé est pétrifié : une vidéo impassable de 20 secondes, pendant que son chrono continue.", video="videos/meduse.mp4"),
 "sphinx": dict(nom="Énigme du Sphinx", prix=15, court="Bloqué par le Sphinx", desc="Le Sphinx barre la route : le groupe visé doit répondre juste à une question de mythologie ou de latin. Chaque erreur le bloque 10 secondes.", video="videos/sphinx.mp4"),
 "dedale": dict(nom="Labyrinthe de Dédale", prix=12, court="Énigme brouillée", desc="Les mots de l'énigme du groupe visé sont mélangés pendant 60 secondes."),
 "brouillard": dict(nom="Brouillard des Enfers", prix=15, court="Pas d'indice de salle", desc="Le groupe visé ne reçoit pas l'indice « salle » de son énigme."),
 "tantale": dict(nom="Supplice de Tantale", prix=10, court="Pas de joker", desc="Le joker à choix multiples n'apparaît pas pour le groupe visé : réponse tapée obligatoire."),
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
out = "/* Données du jeu (générées par tools/build_data.py) */\nwindow.TG=" + json.dumps(dict(QUIZ=QUIZ, SPHINX=SPHINX, CURSES=CURSES, PROTECTIONS=PROTECTIONS, BOONS=BOONS), ensure_ascii=False) + ";\n"
pathlib.Path(sys.argv[2]).write_text(out)
print("ok", len(QUIZ), len(SPHINX))
