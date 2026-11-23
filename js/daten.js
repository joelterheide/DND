/* ==========================================================
   Die Würfelrunde – Spieldaten
   vereinfacht nach den Grundregeln der 5. Edition (2024)
   ========================================================== */

var DATEN = {};

DATEN.attribute = [
  { id: "sta", name: "Stärke", kurz: "STÄ", wofuer: "Kraft, Heben, Klettern, Nahkampf" },
  { id: "ges", name: "Geschicklichkeit", kurz: "GES", wofuer: "Reflexe, Schleichen, Fernkampf, Ausweichen" },
  { id: "kon", name: "Konstitution", kurz: "KON", wofuer: "Ausdauer, Trefferpunkte, Gift aushalten" },
  { id: "int", name: "Intelligenz", kurz: "INT", wofuer: "Wissen, Logik, Erinnern" },
  { id: "wei", name: "Weisheit", kurz: "WEI", wofuer: "Wahrnehmung, Bauchgefühl, Menschenkenntnis" },
  { id: "cha", name: "Charisma", kurz: "CHA", wofuer: "Ausstrahlung, Reden, Willenskraft" }
];

DATEN.fertigkeiten = [
  { id: "akrobatik", name: "Akrobatik", att: "ges", bsp: "balancieren, Salto, sich aus einem Griff winden" },
  { id: "arkane", name: "Arkane Kunde", att: "int", bsp: "Zauber, magische Gegenstände und Runen erkennen" },
  { id: "athletik", name: "Athletik", att: "sta", bsp: "klettern, springen, schwimmen, jemanden festhalten" },
  { id: "auftreten", name: "Auftreten", att: "cha", bsp: "singen, tanzen, schauspielern, Geschichten erzählen" },
  { id: "einschuechtern", name: "Einschüchtern", att: "cha", bsp: "drohen, Angst machen" },
  { id: "fingerfertigkeit", name: "Fingerfertigkeit", att: "ges", bsp: "Taschendiebstahl, Taschenspielertricks, etwas unbemerkt verstecken" },
  { id: "geschichte", name: "Geschichte", att: "int", bsp: "alte Reiche, Kriege, Legenden kennen" },
  { id: "heilkunde", name: "Heilkunde", att: "wei", bsp: "Sterbende stabilisieren, Krankheiten erkennen" },
  { id: "heimlichkeit", name: "Heimlichkeit", att: "ges", bsp: "schleichen, sich verstecken" },
  { id: "tiere", name: "Mit Tieren umgehen", att: "wei", bsp: "Pferd beruhigen, Hund verstehen" },
  { id: "motiv", name: "Motiv erkennen", att: "wei", bsp: "merken, ob jemand lügt oder etwas verheimlicht" },
  { id: "nachforschungen", name: "Nachforschungen", att: "int", bsp: "Hinweise kombinieren, Fallen-Mechanik durchschauen" },
  { id: "naturkunde", name: "Naturkunde", att: "int", bsp: "Pflanzen, Tiere, Wetter, Gelände kennen" },
  { id: "religion", name: "Religion", att: "int", bsp: "Götter, Rituale, heilige Zeichen kennen" },
  { id: "taeuschen", name: "Täuschen", att: "cha", bsp: "lügen, verkleiden, bluffen" },
  { id: "ueberleben", name: "Überlebenskunst", att: "wei", bsp: "Spuren lesen, jagen, sich nicht verirren" },
  { id: "ueberzeugen", name: "Überzeugen", att: "cha", bsp: "verhandeln, freundlich überreden" },
  { id: "wahrnehmung", name: "Wahrnehmung", att: "wei", bsp: "etwas sehen, hören, riechen – die häufigste Probe!" }
];

DATEN.uebung = function (stufe) { return Math.ceil(stufe / 4) + 1; };

/* Klassen: tw = Trefferwürfel, rw = geübte Rettungswürfe,
   prio = Reihenfolge für die Standardreihe 15/14/13/12/10/8 */
DATEN.klassen = {
  barbar: {
    name: "Barbar", tw: 12, rw: ["sta", "kon"], n: 2,
    fert: ["tiere", "athletik", "einschuechtern", "naturkunde", "wahrnehmung", "ueberleben"],
    prio: ["sta", "kon", "ges", "wei", "cha", "int"], leicht: 3,
    text: "Wütender Kämpfer, hält unglaublich viel aus. Kampfrausch: mehr Schaden und halber Schaden durch Waffen.",
    ruestung: "Leichte und mittlere Rüstung, Schilde. Ohne Rüstung: RK = 10 + GES + KON.",
    start: "Kampfrausch (Bonusaktion), Ungerüstete Verteidigung, Waffenmeisterschaft"
  },
  barde: {
    name: "Barde", tw: 8, rw: ["ges", "cha"], n: 3, fert: "alle",
    prio: ["cha", "ges", "kon", "wei", "int", "sta"], leicht: 2,
    text: "Musiker und Redner mit Magie. Unterstützt die Gruppe und kann fast alles ein bisschen.",
    ruestung: "Leichte Rüstung.",
    start: "Bardische Inspiration (Verbündeter bekommt einen W6 dazu), Zauber (CHA)"
  },
  druide: {
    name: "Druide", tw: 8, rw: ["int", "wei"], n: 2,
    fert: ["arkane", "tiere", "motiv", "heilkunde", "naturkunde", "wahrnehmung", "religion", "ueberleben"],
    prio: ["wei", "kon", "ges", "int", "cha", "sta"], leicht: 2,
    text: "Naturmagier. Heilt, kontrolliert das Schlachtfeld und kann sich (ab Stufe 2) in Tiere verwandeln.",
    ruestung: "Leichte Rüstung, Schilde.",
    start: "Druidisch (Geheimsprache), Zauber (WEI)"
  },
  hexenmeister: {
    name: "Hexenmeister", tw: 8, rw: ["wei", "cha"], n: 2,
    fert: ["arkane", "taeuschen", "geschichte", "einschuechtern", "nachforschungen", "naturkunde", "religion"],
    prio: ["cha", "kon", "ges", "wei", "int", "sta"], leicht: 2,
    text: "Hat einen Pakt mit einem mächtigen Wesen geschlossen. Wenige, aber starke Zauber, die nach einer kurzen Rast zurückkommen.",
    ruestung: "Leichte Rüstung.",
    start: "Paktmagie (CHA), Schauerliche Anrufungen"
  },
  kaempfer: {
    name: "Kämpfer", tw: 10, rw: ["sta", "kon"], n: 2,
    fert: ["akrobatik", "tiere", "athletik", "geschichte", "motiv", "einschuechtern", "ueberzeugen", "wahrnehmung", "ueberleben"],
    prio: ["sta", "kon", "ges", "wei", "cha", "int"], leicht: 3,
    text: "Meister aller Waffen und Rüstungen. Einfach zu spielen, sehr robust. Perfekt für den Einstieg.",
    ruestung: "Alle Rüstungen und Schilde.",
    start: "Kampfstil, Zweiter Atem (Bonusaktion: heilt 1W10 + Stufe), Waffenmeisterschaft"
  },
  kleriker: {
    name: "Kleriker", tw: 8, rw: ["wei", "cha"], n: 2,
    fert: ["geschichte", "motiv", "heilkunde", "ueberzeugen", "religion"],
    prio: ["wei", "kon", "sta", "cha", "ges", "int"], leicht: 2,
    text: "Diener einer Gottheit. Heilt, schützt und kann trotzdem gut zuschlagen.",
    ruestung: "Leichte und mittlere Rüstung, Schilde.",
    start: "Zauber (WEI), Göttliche Ordnung"
  },
  magier: {
    name: "Magier", tw: 6, rw: ["int", "wei"], n: 2,
    fert: ["arkane", "geschichte", "motiv", "nachforschungen", "heilkunde", "naturkunde", "religion"],
    prio: ["int", "kon", "ges", "wei", "cha", "sta"], leicht: 1,
    text: "Gelehrter Zauberer mit Zauberbuch. Die meisten Zauber im Spiel, aber wenig Trefferpunkte. Eher etwas für Fortgeschrittene.",
    ruestung: "Keine Rüstung. RK = 10 + GES (oder Zauber wie Magierrüstung).",
    start: "Zauberbuch, Zauber (INT), Arkane Erholung"
  },
  moench: {
    name: "Mönch", tw: 8, rw: ["sta", "ges"], n: 2,
    fert: ["akrobatik", "athletik", "geschichte", "motiv", "religion", "heimlichkeit"],
    prio: ["ges", "wei", "kon", "sta", "int", "cha"], leicht: 2,
    text: "Kampfkünstler ohne Rüstung. Schnell, viele Schläge pro Zug.",
    ruestung: "Keine Rüstung. RK = 10 + GES + WEI.",
    start: "Kampfkunst, Ungerüstete Verteidigung"
  },
  paladin: {
    name: "Paladin", tw: 10, rw: ["wei", "cha"], n: 2,
    fert: ["athletik", "motiv", "einschuechtern", "heilkunde", "ueberzeugen", "religion"],
    prio: ["sta", "cha", "kon", "wei", "ges", "int"], leicht: 3,
    text: "Heiliger Ritter mit Schwur. Schwere Rüstung, starker Nahkampf, etwas Heilmagie.",
    ruestung: "Alle Rüstungen und Schilde.",
    start: "Handauflegen (Heilung), Zauber (CHA), Waffenmeisterschaft"
  },
  schurke: {
    name: "Schurke", tw: 8, rw: ["ges", "int"], n: 4,
    fert: ["akrobatik", "athletik", "taeuschen", "motiv", "einschuechtern", "nachforschungen", "wahrnehmung", "auftreten", "ueberzeugen", "fingerfertigkeit", "heimlichkeit"],
    prio: ["ges", "kon", "int", "wei", "cha", "sta"], leicht: 3,
    text: "Dieb, Späher, Trickser. Viele Fertigkeiten, großer Schaden mit dem Hinterhältigen Angriff.",
    ruestung: "Leichte Rüstung.",
    start: "Expertise (2 Fertigkeiten doppelter Übungsbonus), Hinterhältiger Angriff (+1W6), Diebessprache"
  },
  waldlaeufer: {
    name: "Waldläufer", tw: 10, rw: ["sta", "ges"], n: 3,
    fert: ["tiere", "athletik", "motiv", "nachforschungen", "naturkunde", "wahrnehmung", "heimlichkeit", "ueberleben"],
    prio: ["ges", "wei", "kon", "sta", "int", "cha"], leicht: 2,
    text: "Jäger und Spurenleser. Guter Fernkämpfer mit etwas Naturmagie.",
    ruestung: "Leichte und mittlere Rüstung, Schilde.",
    start: "Zauber (WEI), Erzfeind (Mal des Jägers), Waffenmeisterschaft"
  },
  zauberer: {
    name: "Zauberer", tw: 6, rw: ["kon", "cha"], n: 2,
    fert: ["arkane", "taeuschen", "motiv", "einschuechtern", "ueberzeugen", "religion"],
    prio: ["cha", "kon", "ges", "wei", "int", "sta"], leicht: 2,
    text: "Die Magie liegt dir im Blut. Weniger Zauber als der Magier, dafür kannst du sie verändern.",
    ruestung: "Keine Rüstung. RK = 10 + GES.",
    start: "Zauber (CHA), Angeborene Zauberei"
  }
};

DATEN.voelker = {
  mensch: { name: "Mensch", bew: 9, text: "Einfallsreich (Heldeninspiration nach jeder langen Rast), eine zusätzliche Fertigkeit und ein zusätzliches Herkunftstalent." },
  elf: { name: "Elf", bew: 9, text: "Dunkelsicht 18 m, Feenblut (Vorteil gegen Bezauberung), Trance statt Schlaf, scharfe Sinne." },
  zwerg: { name: "Zwerg", bew: 9, text: "Dunkelsicht 36 m, Resistenz gegen Gift, Zwergische Zähigkeit (+1 TP pro Stufe), Steingespür." },
  halbling: { name: "Halbling", bew: 9, text: "Glück (eine gewürfelte 1 neu würfeln), Mutig (Vorteil gegen Verängstigung), flink und von Natur aus verstohlen." },
  gnom: { name: "Gnom", bew: 9, text: "Dunkelsicht 18 m, Gnomische Schläue (Vorteil auf INT-, WEI- und CHA-Rettungswürfe)." },
  drache: { name: "Drachenblütiger", bew: 9, text: "Odemwaffe, Schadensresistenz passend zu deiner Drachenart, Dunkelsicht 18 m." },
  tiefling: { name: "Tiefling", bew: 9, text: "Dunkelsicht 18 m, teuflisches Erbe: eine Resistenz und ein paar kleine Zauber." },
  ork: { name: "Ork", bew: 9, text: "Dunkelsicht 36 m, Adrenalinschub (Spurt als Bonusaktion), Unerbittlich (einmal pro langer Rast bei 0 TP auf 1 TP bleiben)." },
  goliath: { name: "Goliath", bew: 10.5, text: "Groß und stark, Erbe der Riesen (eine besondere Riesenfähigkeit), Bewegung 10,5 m." },
  aasimar: { name: "Aasimar", bew: 9, text: "Dunkelsicht 18 m, Resistenz gegen nekrotischen und gleißenden Schaden, Heilende Hände." }
};

/* Hintergründe: zwei Fertigkeiten + drei Attribute für die Erhöhung (+2/+1 oder +1/+1/+1) */
DATEN.hintergruende = {
  akolyth: { name: "Akolyth", fert: ["motiv", "religion"], att: ["int", "wei", "cha"] },
  handwerker: { name: "Handwerker", fert: ["nachforschungen", "ueberzeugen"], att: ["sta", "ges", "int"] },
  scharlatan: { name: "Scharlatan", fert: ["fingerfertigkeit", "taeuschen"], att: ["ges", "kon", "cha"] },
  krimineller: { name: "Krimineller", fert: ["fingerfertigkeit", "heimlichkeit"], att: ["ges", "kon", "int"] },
  kuenstler: { name: "Unterhaltungskünstler", fert: ["akrobatik", "auftreten"], att: ["sta", "ges", "cha"] },
  bauer: { name: "Bauer", fert: ["tiere", "naturkunde"], att: ["sta", "kon", "wei"] },
  wache: { name: "Wache", fert: ["athletik", "wahrnehmung"], att: ["sta", "int", "wei"] },
  fuehrer: { name: "Führer", fert: ["heimlichkeit", "ueberleben"], att: ["ges", "kon", "wei"] },
  einsiedler: { name: "Einsiedler", fert: ["heilkunde", "religion"], att: ["kon", "wei", "cha"] },
  haendler: { name: "Händler", fert: ["tiere", "ueberzeugen"], att: ["kon", "int", "cha"] },
  adeliger: { name: "Adeliger", fert: ["geschichte", "ueberzeugen"], att: ["sta", "int", "cha"] },
  weiser: { name: "Weiser", fert: ["arkane", "geschichte"], att: ["kon", "int", "wei"] },
  seefahrer: { name: "Seefahrer", fert: ["akrobatik", "wahrnehmung"], att: ["sta", "ges", "wei"] },
  schreiber: { name: "Schreiber", fert: ["nachforschungen", "wahrnehmung"], att: ["ges", "int", "wei"] },
  soldat: { name: "Soldat", fert: ["athletik", "einschuechtern"], att: ["sta", "ges", "kon"] },
  wanderer: { name: "Wanderer", fert: ["motiv", "heimlichkeit"], att: ["ges", "wei", "cha"] }
};

/* Die vier fertigen Charaktere aus "Lichter am Steinbruch"
   fert: 1 = geübt, 2 = Expertise (doppelter Übungsbonus) */
DATEN.vorlagen = {
  brena: {
    name: "Brena", spieler: "", volk: "mensch", klasse: "kaempfer", hintergrund: "soldat", stufe: 1,
    att: { sta: 16, ges: 12, kon: 14, int: 10, wei: 12, cha: 8 },
    fert: { athletik: 1, wahrnehmung: 1, einschuechtern: 1, ueberleben: 1, motiv: 1 },
    rk: 18, tpMax: 12, tpAkt: 12, bew: 9,
    angriffe: "Langschwert: +5 auf Treffer, 1W8+3 Hieb\nWurfspeer: +5, 1W6+3 Stich (9/36 m)",
    faehigkeiten: "Zweiter Atem: Bonusaktion, heilt 1W10+1 TP (2× pro langer Rast, 1 kommt nach kurzer Rast zurück)\nKampfstil Schutz: Reaktion – ein Angriff gegen einen Verbündeten neben dir bekommt Nachteil (nur mit Schild)",
    ausruestung: "Kettenhemd, Schild, Langschwert, 2 Wurfspeere, Rucksack, Seil (15 m), Fackeln, 15 GM",
    notizen: "Ehemalige Stadtwache. Hasst Ungerechtigkeit, redet nicht gern über ihre Vergangenheit."
  },
  fips: {
    name: "Fips", spieler: "", volk: "halbling", klasse: "schurke", hintergrund: "krimineller", stufe: 1,
    att: { sta: 8, ges: 16, kon: 12, int: 12, wei: 10, cha: 14 },
    fert: { heimlichkeit: 2, fingerfertigkeit: 2, taeuschen: 1, wahrnehmung: 1, akrobatik: 1, motiv: 1 },
    rk: 14, tpMax: 9, tpAkt: 9, bew: 9,
    angriffe: "Kurzschwert: +5, 1W6+3 Stich\nKurzbogen: +5, 1W6+3 Stich (24/96 m)\nDolch: +5, 1W4+3 (auch werfbar)",
    faehigkeiten: "Hinterhältiger Angriff: 1× pro Zug +1W6, wenn du Vorteil hast oder ein Verbündeter neben dem Ziel steht\nGlück (Halbling): eine gewürfelte 1 neu würfeln\nExpertise: Heimlichkeit, Fingerfertigkeit",
    ausruestung: "Lederrüstung, Kurzschwert, Kurzbogen + 20 Pfeile, 2 Dolche, Diebeswerkzeug, dunkler Umhang, 12 GM",
    notizen: "Neugierig, redet viel, steckt Dinge ein, die glänzen. Schuldet in der Hauptstadt jemandem Geld."
  },
  aldric: {
    name: "Aldric", spieler: "", volk: "zwerg", klasse: "kleriker", hintergrund: "akolyth", stufe: 1,
    att: { sta: 13, ges: 10, kon: 14, int: 10, wei: 16, cha: 12 },
    fert: { heilkunde: 1, motiv: 1, religion: 1, ueberzeugen: 1 },
    rk: 16, tpMax: 11, tpAkt: 11, bew: 9,
    angriffe: "Streitkolben: +3, 1W6+1 Wucht\nHeilige Flamme (Zaubertrick): Ziel macht GES-Rettungswurf SG 13, sonst 1W8 gleißend",
    faehigkeiten: "Zauber-SG 13, Zauberangriff +5, 2 Zauberplätze (1. Grad)\nHeilendes Wort: Bonusaktion, 18 m, heilt 2W4+3\nSegen: bis zu 3 Verbündete +1W4 auf Angriffe und Rettungswürfe (Konzentration)\nDunkelsicht 36 m, Resistenz gegen Gift",
    ausruestung: "Schuppenpanzer, Schild, Streitkolben, heiliges Symbol (Hammer), Gebetsbuch, Heilerset, 10 GM",
    notizen: "Ruhig, trocken humorvoll. Sucht ein verlorenes Relikt seines Klans."
  },
  liora: {
    name: "Liora", spieler: "", volk: "elf", klasse: "magier", hintergrund: "weiser", stufe: 1,
    att: { sta: 8, ges: 14, kon: 12, int: 16, wei: 12, cha: 10 },
    fert: { arkane: 1, nachforschungen: 1, geschichte: 1, wahrnehmung: 1, naturkunde: 1 },
    rk: 12, tpMax: 7, tpAkt: 7, bew: 9,
    angriffe: "Feuerpfeil (Zaubertrick): +5, 1W10 Feuer, 36 m\nDolch: +4, 1W4+2",
    faehigkeiten: "Zauber-SG 13, Zauberangriff +5, 2 Zauberplätze (1. Grad)\nMagisches Geschoss: 3 Geschosse à 1W4+1, treffen immer\nSchild: Reaktion, +5 RK bis zu deinem nächsten Zug\nDunkelsicht 18 m, Trance statt Schlaf",
    ausruestung: "Zauberbuch, Arkaner Fokus (Kristall), Dolch, Gelehrtenrobe, Tinte und Feder, 14 GM",
    notizen: "Wissbegierig, etwas überheblich. Wurde aus ihrer Akademie geworfen, weil sie ein verbotenes Buch gelesen hat."
  }
};

/* Monster (vereinfacht, nach dem freien SRD) */
DATEN.monster = [
  { name: "Goblin", art: "Kleiner Humanoide, HG 1/4", rk: 15, tp: 7, tpw: "2W6", bew: "9 m", ges: 2,
    att: "STÄ −1 · GES +2 · KON +0 · INT +0 · WEI −1 · CHA −1",
    aktionen: ["Krummsäbel: +4, <span class=\"w\">1W6+2</span> Hieb", "Kurzbogen: +4, <span class=\"w\">1W6+2</span> Stich (24/96 m)"],
    besonders: "Flinke Flucht: Rückzug oder Verstecken als Bonusaktion. Dunkelsicht 18 m." },
  { name: "Kobold", art: "Kleiner Drache, HG 1/8", rk: 12, tp: 5, tpw: "2W6−2", bew: "9 m", ges: 2,
    att: "STÄ −2 · GES +2 · KON −1 · INT −1 · WEI −2 · CHA −1",
    aktionen: ["Dolch: +4, <span class=\"w\">1W4+2</span> Stich", "Schleuder: +4, <span class=\"w\">1W4+2</span> Wucht"],
    besonders: "Rudeltaktik: Vorteil, wenn ein Verbündeter neben dem Ziel steht. Empfindlich gegen Sonnenlicht." },
  { name: "Wolf", art: "Mittelgroßes Tier, HG 1/4", rk: 13, tp: 11, tpw: "2W8+2", bew: "12 m", ges: 2,
    att: "STÄ +1 · GES +2 · KON +1 · INT −4 · WEI +1 · CHA −2",
    aktionen: ["Biss: +4, <span class=\"w\">2W4+2</span> Stich. Ziel muss STÄ-Rettungswurf SG 11 schaffen, sonst liegt es am Boden."],
    besonders: "Rudeltaktik. Scharfes Gehör und Geruchssinn." },
  { name: "Skelett", art: "Mittelgroßer Untoter, HG 1/4", rk: 13, tp: 13, tpw: "2W8+4", bew: "9 m", ges: 2,
    att: "STÄ +0 · GES +2 · KON +2 · INT −2 · WEI −1 · CHA −3",
    aktionen: ["Kurzschwert: +4, <span class=\"w\">1W6+2</span> Stich", "Kurzbogen: +4, <span class=\"w\">1W6+2</span> Stich (24/96 m)"],
    besonders: "Anfällig für Wuchtschaden (doppelter Schaden). Immun gegen Gift." },
  { name: "Zombie", art: "Mittelgroßer Untoter, HG 1/4", rk: 8, tp: 22, tpw: "3W8+9", bew: "6 m", ges: -2,
    att: "STÄ +1 · GES −2 · KON +3 · INT −4 · WEI −2 · CHA −3",
    aktionen: ["Hieb: +3, <span class=\"w\">1W6+1</span> Wucht"],
    besonders: "Untote Zähigkeit: Fällt er auf 0 TP, KON-Rettungswurf (SG 5 + Schaden). Bei Erfolg bleibt er mit 1 TP stehen (nicht bei gleißendem Schaden oder Krit)." },
  { name: "Bandit", art: "Mittelgroßer Humanoide, HG 1/8", rk: 12, tp: 11, tpw: "2W8+2", bew: "9 m", ges: 1,
    att: "STÄ +0 · GES +1 · KON +1 · INT +0 · WEI +0 · CHA +0",
    aktionen: ["Krummsäbel: +3, <span class=\"w\">1W6+1</span> Hieb", "Leichte Armbrust: +3, <span class=\"w\">1W8+1</span> Stich (24/96 m)"],
    besonders: "Kämpft meist in Gruppen und flieht, wenn der Anführer fällt." },
  { name: "Ork", art: "Mittelgroßer Humanoide, HG 1/2", rk: 13, tp: 15, tpw: "2W8+6", bew: "9 m", ges: 1,
    att: "STÄ +3 · GES +1 · KON +3 · INT −2 · WEI +0 · CHA +0",
    aktionen: ["Zweihandaxt: +5, <span class=\"w\">1W12+3</span> Hieb", "Wurfspeer: +5, <span class=\"w\">1W6+3</span> Stich"],
    besonders: "Aggressiv: Bonusaktion, um sich bis zu seiner Bewegung auf einen Gegner zuzubewegen." },
  { name: "Grottenschrat", art: "Mittelgroßer Humanoide, HG 1", rk: 16, tp: 27, tpw: "5W8+5", bew: "9 m", ges: 2,
    att: "STÄ +2 · GES +2 · KON +1 · INT −1 · WEI +0 · CHA −1",
    aktionen: ["Morgenstern: +4, <span class=\"w\">2W8+2</span> Stich", "Wurfspeer: +4, <span class=\"w\">1W6+2</span> Stich"],
    besonders: "Überraschungsangriff: Trifft er ein überraschtes Ziel, +<span class=\"w\">2W6</span> Schaden. Brutal: Seine Nahkampfwaffen machen einen Würfel extra Schaden (schon eingerechnet)." },
  { name: "Riesenspinne", art: "Großes Tier, HG 1", rk: 14, tp: 26, tpw: "4W10+4", bew: "9 m, klettern 9 m", ges: 3,
    att: "STÄ +2 · GES +3 · KON +1 · INT −4 · WEI +0 · CHA −3",
    aktionen: ["Biss: +5, <span class=\"w\">1W8+3</span> Stich plus <span class=\"w\">2W8</span> Gift (KON-Rettungswurf SG 11 halbiert)", "Netz (Aufladung 5–6): +5, Ziel ist festgesetzt (STÄ SG 12 zum Befreien)"],
    besonders: "Spinnenklettern, Netzsinn. Blindsicht 3 m." },
  { name: "Oger", art: "Großer Riese, HG 2", rk: 11, tp: 59, tpw: "7W10+21", bew: "12 m", ges: -1,
    att: "STÄ +4 · GES −1 · KON +3 · INT −3 · WEI −2 · CHA −2",
    aktionen: ["Zweihandknüppel: +6, <span class=\"w\">2W8+4</span> Wucht", "Wurfspeer: +6, <span class=\"w\">2W6+4</span> Stich"],
    besonders: "Dumm, hungrig und leicht zu täuschen. Für Stufe 1 sehr gefährlich!" }
];

/* Zustände (kurz) */
DATEN.zustaende = [
  ["Bezaubert", "Kann den Bezauberer nicht angreifen. Der Bezauberer hat Vorteil bei sozialen Proben gegen dich."],
  ["Blind", "Du siehst nichts. Deine Angriffe haben Nachteil, Angriffe gegen dich Vorteil."],
  ["Taub", "Du hörst nichts."],
  ["Verängstigt", "Nachteil auf Proben und Angriffe, solange du die Quelle der Angst siehst. Du kannst nicht freiwillig näher heran."],
  ["Gepackt", "Bewegung 0. Befreien: Athletik- oder Akrobatik-Probe (bzw. Rettungswurf) gegen den Packenden."],
  ["Kampfunfähig", "Keine Aktionen, Bonusaktionen oder Reaktionen."],
  ["Unsichtbar", "Man sieht dich nicht. Deine Angriffe haben Vorteil, Angriffe gegen dich Nachteil."],
  ["Gelähmt", "Kampfunfähig, kann sich nicht bewegen. Nahkampftreffer gegen dich sind automatisch kritisch."],
  ["Versteinert", "Zu Stein geworden. Kampfunfähig, Resistenz gegen allen Schaden."],
  ["Vergiftet", "Nachteil auf Angriffe und Attributsproben."],
  ["Liegend", "Am Boden. Nahkampfangriffe gegen dich haben Vorteil, Fernkampf Nachteil. Aufstehen kostet die halbe Bewegung."],
  ["Festgesetzt", "Bewegung 0. Deine Angriffe haben Nachteil, Angriffe gegen dich Vorteil, Nachteil auf GES-Rettungswürfe."],
  ["Betäubt", "Kampfunfähig, du scheiterst automatisch an STÄ- und GES-Rettungswürfen. Angriffe gegen dich haben Vorteil."],
  ["Bewusstlos", "Kampfunfähig, liegend, du lässt alles fallen. Nahkampftreffer sind automatisch kritisch."],
  ["Erschöpfung", "Stapelt sich (Stufe 1–6): pro Stufe −2 auf alle W20-Würfe und −1,5 m Bewegung. Stufe 6 = Tod. Eine lange Rast senkt sie um 1."]
];
