/* ==========================================================
   Die Würfelrunde – Spielen
   Die Seite ist der Spielleiter: Szenen, Proben, Kampf.
   Erkunden geht reihum, Kämpfe nach Initiative.
   ========================================================== */
(function () {
  "use strict";
  var el = DND.el;
  function $(id) { return document.getElementById(id); }
  function kopie(o) { return JSON.parse(JSON.stringify(o)); }
  function ohneHtml(s) { return String(s || "").replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, ""); }

  /* ======================================================
     Klassen im Kampf (vereinfacht)
     ====================================================== */
  var KK = {
    barbar: { waffe: { name: "Zweihandaxt", att: "sta", w: "1W12" }, rausch: true },
    barde: { waffe: { name: "Rapier", att: "ges", w: "1W8" }, zauber: "cha", trick: { name: "Gehässiger Spott", typ: "rw", rw: "wei", w: "1W6", effekt: "nachteil" }, heilwort: true },
    druide: { waffe: { name: "Kampfstab", att: "sta", w: "1W6" }, zauber: "wei", trick: { name: "Flammen erzeugen", typ: "angriff", w: "1W8" }, heilwort: true },
    hexenmeister: { waffe: { name: "Dolch", att: "ges", w: "1W4" }, zauber: "cha", trick: { name: "Schauerlicher Strahl", typ: "angriff", w: "1W10" } },
    kaempfer: { waffe: "auto", atem: true },
    kleriker: { waffe: { name: "Streitkolben", att: "sta", w: "1W6" }, zauber: "wei", trick: { name: "Heilige Flamme", typ: "rw", rw: "ges", w: "1W8" }, heilwort: true, segen: true },
    magier: { waffe: { name: "Dolch", att: "ges", w: "1W4" }, zauber: "int", trick: { name: "Feuerpfeil", typ: "angriff", w: "1W10" }, geschoss: true, schild: true },
    moench: { waffe: { name: "Kurzschwert", att: "ges", w: "1W6" }, kampfkunst: true },
    paladin: { waffe: { name: "Langschwert", att: "sta", w: "1W8" }, zauber: "cha", hand: true },
    schurke: { waffe: { name: "Kurzschwert", att: "ges", w: "1W6" }, hinterhalt: true },
    waldlaeufer: { waffe: { name: "Langbogen", att: "ges", w: "1W8", fern: true }, zauber: "wei", mal: true },
    zauberer: { waffe: { name: "Dolch", att: "ges", w: "1W4" }, zauber: "cha", trick: { name: "Feuerpfeil", typ: "angriff", w: "1W10" }, geschoss: true, schild: true }
  };

  /* Gegner */
  var MON = {
    goblin: { name: "Goblin", rk: 15, tp: 7, ges: 2, rw: { sta: -1, ges: 2, kon: 0, int: 0, wei: -1, cha: -1 },
      angriff: { name: "Krummsäbel", bonus: 4, schaden: "1W6+2" } },
    wolf: { name: "Wolf", rk: 13, tp: 11, ges: 2, rw: { sta: 1, ges: 2, kon: 1, int: -4, wei: 1, cha: -2 }, rudel: true,
      angriff: { name: "Biss", bonus: 4, schaden: "2W4+2", umwerfen: 11 } },
    krosk: { name: "Krosk", rk: 16, tp: 27, ges: 2, rw: { sta: 2, ges: 2, kon: 1, int: -1, wei: 0, cha: -1 }, flieht: 6,
      angriff: { name: "Morgenstern", bonus: 4, schaden: "2W8+2" } },
    gnatz: { name: "Gnatz", rk: 15, tp: 7, ges: 2, rw: { sta: -1, ges: 2, kon: 0, int: 0, wei: -1, cha: -1 },
      angriff: { name: "Krummsäbel", bonus: 4, schaden: "1W6+2" } }
  };

  var KAEMPFE = {
    goblins_strasse: { gegner: ["goblin", "goblin"], sieg: "s2_muetze", niederlage: "gefangen", aufgabe: { rest: 1, name: "Snikk", ziel: "s2_snikk" } },
    goblins_lager: { gegner: ["goblin", "goblin"], namen: ["Pib", "Grunz"], sieg: "s3_tunnel", niederlage: "gefangen", warnRunde: 3 },
    woelfe: { gegner: ["wolf", "wolf"], sieg: "s2_muetze", niederlage: "gefangen" },
    krosk: { gegner: function (g) { return g.flags.gnatzWeg ? ["krosk"] : ["krosk", "gnatz"]; }, sieg: "ende_sieg", niederlage: "gefangen", tor: true },
    krosk_wach: { gegner: ["krosk"], sieg: "ende_sieg", niederlage: "ende_niederlage", tor: true },
    krosk_schlaf: { gegner: ["krosk"], sieg: "ende_sieg", niederlage: "ende_niederlage", tor: true, schlaf: true }
  };

  var ATT_NAME = { sta: "STÄ", ges: "GES", kon: "KON", int: "INT", wei: "WEI", cha: "CHA" };

  /* ======================================================
     Spielstand
     ====================================================== */
  var G = null;
  var UI = { frage: null, zielwahl: null, wer: null, sperre: false };

  function sichern() { if (G) DND.speichern("spiel", G); }

  function log(text, art) {
    G.log.push([art || "", ohneHtml(text)]);
    if (G.log.length > 400) G.log.shift();
    var p = $("protokoll");
    if (p && !$("spiel").classList.contains("versteckt")) {
      p.appendChild(el("p", { "class": art || "", text: ohneHtml(text) }));
      p.scrollTop = p.scrollHeight;
    }
  }

  /* ---------- Helden ---------- */
  function heldAus(c, spieler) {
    var kk = KK[c.klasse] || KK.kaempfer;
    var slots = (kk.geschoss || kk.heilwort || kk.segen || kk.mal) ? 2 : 0;
    var st = Math.max(1, parseInt(c.stufe, 10) || 1);
    var tp = parseInt(c.tpMax, 10) || 10;
    return {
      spieler: spieler || "", name: c.name || "Held", klasse: DATEN.klassen[c.klasse] ? c.klasse : "kaempfer",
      volk: c.volk || "mensch", stufe: st, att: kopie(c.att), fert: kopie(c.fert || {}),
      rk: parseInt(c.rk, 10) || 10, tpMax: tp, tp: tp,
      slots: slots, slotsMax: slots, atem: kk.atem ? 2 : 0, rausch: kk.rausch ? 2 : 0, hand: kk.hand ? 5 * st : 0,
      tw: st, ork: false, ds: { e: 0, m: 0 }, stabil: false, tot: false, liegend: false,
      st: { wuerfe: 0, krit: 0, schaden: 0, eingesteckt: 0, geheilt: 0 }
    };
  }
  function attMod(h, a) { return DND.mod(h.att[a]); }
  function ueb(h) { return DATEN.uebung(h.stufe); }
  function steht(h) { return !h.tot && h.tp > 0; }
  function klasseName(h) { return DATEN.klassen[h.klasse].name; }
  function waffe(h) {
    var w = KK[h.klasse].waffe;
    if (w === "auto") return h.att.sta >= h.att.ges ? { name: "Langschwert", att: "sta", w: "1W8" } : { name: "Rapier", att: "ges", w: "1W8" };
    return w;
  }
  function zauberSG(h) { return 8 + ueb(h) + attMod(h, KK[h.klasse].zauber); }
  function wd(s) { var m = s.match(/(\d+)W(\d+)/); return { n: parseInt(m[1], 10), s: parseInt(m[2], 10) }; }

  function bonusFuer(h, spec) {
    if (spec.fert) {
      var f = DATEN.fertigkeiten.filter(function (x) { return x.id === spec.fert; })[0];
      return { bonus: attMod(h, f.att) + (h.fert[f.id] || 0) * ueb(h), titel: f.name };
    }
    if (spec.rw) {
      var geuebt = DATEN.klassen[h.klasse].rw.indexOf(spec.rw) !== -1;
      return { bonus: attMod(h, spec.rw) + (geuebt ? ueb(h) : 0), titel: ATT_NAME[spec.rw] + "-Rettungswurf" };
    }
    return { bonus: attMod(h, spec.att), titel: ATT_NAME[spec.att] + "-Probe" };
  }

  function segenFuer(hi) {
    var K = G.kampf;
    return !!(K && K.segen && K.segen.ziele.indexOf(hi) !== -1);
  }

  /* ======================================================
     Würfeln für Helden (automatisch oder echte Würfel)
     ====================================================== */
  function frage(text, min, max, roller, cb) {
    UI.frage = { text: text, min: min, max: max, roller: roller, cb: cb };
    render();
    var f = document.querySelector(".wurf-frage input");
    if (f) f.focus();
  }

  function w20Held(h, titel, bonus, modus, cb, opt) {
    opt = opt || {};
    function fertig(natur, wtext) {
      h.st.wuerfe++;
      if (natur === 1 && h.volk === "halbling" && !opt.glueck) {
        log(h.name + " würfelt eine 1 – Halblingsglück! Nochmal würfeln.", "info");
        opt.glueck = true;
        w20Held(h, titel, bonus, modus, cb, opt);
        return;
      }
      if (natur === 20) h.st.krit++;
      var extra = 0, etxt = "";
      if (opt.segen) { extra = DND.zufall(4); etxt = " + Segen [" + extra + "]"; }
      cb({ natur: natur, summe: natur + bonus + extra, text: wtext + (bonus ? (bonus > 0 ? " + " : " − ") + Math.abs(bonus) : "") + etxt });
    }
    if (!G.manuell) {
      var r = DND.w20(0, modus);
      fertig(r.natur, r.text);
    } else {
      var wie = modus ? "2W20 und tippe den " + (modus === "v" ? "höheren (Vorteil)" : "niedrigeren (Nachteil)") + " ein" : "einen W20";
      frage("<b>" + h.name + "</b>: " + titel + ". Würfle " + wie + ". Den Bonus (" + DND.vz(bonus) + ") rechnet die Seite dazu.",
        1, 20, function () { return DND.w20(0, modus).natur; },
        function (n) { fertig(n, "[" + n + "]" + (modus === "v" ? " (Vorteil)" : modus === "n" ? " (Nachteil)" : "")); });
    }
  }

  // teile: [{n, s, name}], mod: Zahl. Für Schaden UND Heilung.
  function wuerfelSumme(h, titel, teile, mod, krit, cb) {
    var summe = mod, texte = [], i = 0;
    function weiter() {
      if (i >= teile.length) {
        cb({ summe: Math.max(0, summe), text: texte.join(" + ") + (mod ? (mod > 0 ? " + " : " − ") + Math.abs(mod) : "") });
        return;
      }
      var t = teile[i++];
      var n = krit ? t.n * 2 : t.n;
      if (!G.manuell || !h) {
        var w = [];
        for (var k = 0; k < n; k++) w.push(DND.zufall(t.s));
        summe += w.reduce(function (a, b) { return a + b; }, 0);
        texte.push(n + "W" + t.s + " [" + w.join(", ") + "]");
        weiter();
      } else {
        frage("<b>" + h.name + "</b>: " + titel + (t.name ? " (" + t.name + ")" : "") + ". Würfle <b>" + n + "W" + t.s + "</b> und tippe die Summe ein.",
          n, n * t.s, function () { var s = 0; for (var k = 0; k < n; k++) s += DND.zufall(t.s); return s; },
          function (v) { summe += v; texte.push(n + "W" + t.s + " [" + v + "]"); weiter(); });
      }
    }
    weiter();
  }

  function probe(spec, h, cb) {
    var b = bonusFuer(h, spec);
    var hi = G.helden.indexOf(h);
    w20Held(h, b.titel, b.bonus, spec.modus || "", function (r) {
      var ok = r.summe >= spec.sg;
      log(h.name + " – " + b.titel + (spec.modus === "v" ? " mit Vorteil" : "") + ": " + r.text + " = " + r.summe +
        " gegen SG " + spec.sg + " → " + (ok ? "geschafft!" : "nicht geschafft."), ok ? "gut" : "schlecht");
      cb(ok);
    }, { segen: spec.rw && segenFuer(hi) });
  }

  function gruppenprobe(spec, cb) {
    var leute = G.helden.filter(steht);
    var erfolge = 0, i = 0;
    log("Gruppenprobe: Alle würfeln. Wenn mindestens die Hälfte es schafft, klappt es.", "info");
    (function naechster() {
      if (i >= leute.length) {
        var ok = erfolge * 2 >= leute.length;
        log(erfolge + " von " + leute.length + " geschafft → " + (ok ? "Die Gruppe schafft es!" : "Das reicht nicht."), ok ? "gut" : "schlecht");
        cb(ok);
        return;
      }
      probe(spec, leute[i++], function (ok) { if (ok) erfolge++; naechster(); });
    })();
  }

  function rettungswurf(h, att, sg, titel, cb) {
    probe({ rw: att, sg: sg }, h, cb);
  }

  /* ======================================================
     Szenen von "Lichter am Steinbruch"
     ====================================================== */
  var KNOTEN = {
    s1: {
      titel: "Szene 1 – Der Schiefe Kessel",
      text: "Herbst im Dorf Erlenbach. Ihr sitzt im „Schiefen Kessel“, der einzigen Taverne weit und breit. Draußen peitscht der Regen gegen die Fensterläden, drinnen knistert das Feuer, und der Eintopf schmeckt nach zu viel Kümmel.<br><br>" +
        "Plötzlich fliegt die Tür auf. Ein Junge stolpert herein, etwa zwölf Jahre alt, schlammverschmiert, mit einer blutenden Schramme an der Stirn. „Bitte! Sie haben meinen Vater mitgenommen! Kleine Gestalten mit Fackeln … am alten Steinbruch!“<br><br>" +
        "Der Wirt, ein bulliger Mann namens Grumm, stellt langsam seinen Krug ab. „Goblins. Seit Wochen klauen die Hühner. Aber Menschen haben sie noch nie geholt …“<br><br>" +
        "Die anderen Gäste starren in ihre Becher. Niemand steht auf. Der Junge sieht sich verzweifelt um – und sein Blick bleibt an euch hängen.",
      kurz: "Ihr seid noch im Schiefen Kessel. Tobi, der Junge, schaut euch mit großen Augen an. In der Ecke am Feuer sitzt eine alte Frau und raucht Pfeife.",
      optionen: [
        { text: "Den Jungen beruhigen und ausfragen", einmal: "tobi", probe: { fert: "motiv", sg: 10 },
          erfolg: { text: "Der Junge heißt <b>Tobi</b>. Sein Vater Hannes, der Müller, hat abends am Mühlrad gearbeitet. Dann kamen etwa sechs kleine Gestalten mit Fackeln – und <b>ein riesiger Schatten mit Bärenfell</b>, der seinen Vater wie einen Mehlsack über die Schulter geworfen hat. Tobi flüstert: „Der Große hat gebrüllt: <i>Zahnrad-Mann! Du machst Tür auf!</i>“", effekt: function (g) { g.flags.zahnrad = true; } },
          misserfolg: { text: "Der Junge schluchzt so sehr, dass ihr nur die Hälfte versteht: Sein Vater Hannes, der Müller … kleine Gestalten … und etwas sehr Großes. Sie sind nach Norden, zum alten Steinbruch." } },
        { text: "Den Wirt Grumm nach dem Steinbruch fragen", einmal: "grumm",
          ergebnis: true,
          erfolg: { text: "Grumm brummt: „Der Steinbruch liegt eine Stunde nördlich, die Waldstraße führt direkt hin. Früher haben da Zwerge Stein gebrochen – ist hundert Jahre her.“ Dann leiser: „Die Vorsteherin zahlt euch sicher <b>50 Goldmünzen</b>, wenn ihr Hannes zurückbringt. Und bei mir trinkt ihr umsonst.“" } },
        { text: "Die alte Frau am Feuer ansprechen", einmal: "wenna", probe: { fert: "ueberzeugen", sg: 12 },
          erfolg: { text: "Die alte <b>Wenna</b> mustert euch lange, dann nickt sie. „Nehmt den <b>alten Karrenweg</b> im Westen. Er führt zum oberen Rand des Steinbruchs – da sieht euch keiner kommen.“ Sie drückt euch <b>2 Heiltränke</b> in die Hand. „Die Zwerge haben damals etwas hinter einer Tür eingeschlossen, die nur mit Zahnrädern aufgeht. Manches sollte zu bleiben.“",
            effekt: function (g) { g.flags.karrenweg = true; g.traenke += 2; } },
          misserfolg: { text: "Die alte Frau pafft ihre Pfeife und sieht euch nicht einmal an. „Nehmt den alten Karrenweg, wenn ihr klug seid“, murmelt sie. Dann schweigt sie.",
            effekt: function (g) { g.flags.karrenweg = true; } } },
        { text: "Aufbrechen – Hannes hat keine Zeit zu verlieren!", ziel: "s2" }
      ]
    },

    s2: {
      titel: "Szene 2 – Am Waldrand",
      text: function (g) {
        return "Ihr verlasst das Dorf nach Norden. Der Regen lässt nach, aus den Wiesen steigt Nebel. Am Waldrand teilt sich der Weg: Die breite <b>Waldstraße</b> führt direkt in den dunklen Erlenwald." +
          (g.flags.karrenweg ? " Links, kaum zu erkennen, zweigt der <b>alte Karrenweg</b> ab, von dem die alte Frau erzählt hat. Er ist zugewachsen – das dauert länger." : "");
      },
      optionen: [
        { text: "Die Waldstraße nehmen (schnell)", ziel: "s2a" },
        { text: "Den alten Karrenweg nehmen (langsam, aber unauffällig)", wenn: function (g) { return g.flags.karrenweg; }, ziel: "s2b" }
      ]
    },

    s2a: {
      titel: "Szene 2 – Die Waldstraße",
      text: "Die Straße ist ein schlammiger Pfad zwischen alten Erlen. Von den Ästen tropft es ununterbrochen. Irgendwo ruft ein Käuzchen. Dann wird es plötzlich still. Zu still.",
      optionen: [
        { text: "Einfach weitergehen – wir haben's eilig",
          ergebnis: true, erfolg: { text: "KLIRR! Jemand läuft in eine Schnur voller Blechdosen. Aus dem Gebüsch springen zwei Goblins mit Krummsäbeln! Ihr seid <b>überrascht</b> – Nachteil auf eure Initiative.", kampf: "goblins_strasse", ueberrascht: "helden" } },
        { text: "Vorsichtig gehen und die Augen offen halten", probe: { fert: "wahrnehmung", sg: 12 },
          erfolg: { text: "Knapp über dem Boden entdeckst du eine dünne Schnur mit rostigen Blechdosen. Ein Hinterhalt!", ziel: "s2a_falle" },
          misserfolg: { text: "KLIRR! Du läufst direkt in eine Schnur voller Blechdosen. Zwei Goblins springen aus dem Gebüsch! Ihr seid <b>überrascht</b> – Nachteil auf eure Initiative.", kampf: "goblins_strasse", ueberrascht: "helden" } }
      ]
    },

    s2a_falle: {
      titel: "Szene 2 – Der Hinterhalt",
      text: "Hinter der Schnur raschelt es im Gebüsch. Zwei Paar spitze Ohren, zwei Paar gelbe Augen: <b>Goblins</b>. Sie starren auf die Straße, aber in die falsche Richtung. Sie haben euch noch nicht bemerkt.",
      optionen: [
        { text: "Angreifen, solange sie nichts ahnen!", ergebnis: true,
          erfolg: { text: "Ihr stürmt los. Die Goblins sind <b>überrascht</b> – sie würfeln ihre Initiative mit Nachteil.", kampf: "goblins_strasse", ueberrascht: "gegner" } },
        { text: "Die Goblins anbrüllen und einschüchtern", probe: { fert: "einschuechtern", sg: 12 },
          erfolg: { text: "„Raus da, oder es setzt was!“ Die beiden Goblins purzeln aus dem Gebüsch. Einer rennt kreischend davon, der andere wirft sich flach auf den Boden.", ziel: "s2_snikk" },
          misserfolg: { text: "Die Goblins lachen nur meckernd und ziehen ihre Säbel.", kampf: "goblins_strasse" } },
        { text: "Leise im Bogen um sie herumschleichen", probe: { fert: "heimlichkeit", sg: 11, gruppe: true },
          erfolg: { text: "Wie Schatten schleicht ihr durchs Unterholz. Die Goblins merken nichts.", ziel: "s2_muetze" },
          misserfolg: { text: "Ein Ast knackt. „Da!“ Die Goblins springen auf.", kampf: "goblins_strasse" } }
      ]
    },

    s2_snikk: {
      titel: "Szene 2 – Snikk",
      text: "„Nicht töten! Nicht töten!“ Der kleine Goblin zittert am ganzen Körper. „Snikk ist klein, Snikk schmeckt nicht! Snikk hilft! Snikk weiß Dinge!“",
      optionen: [
        { text: "Snikk verschonen und ausfragen", ergebnis: true,
          erfolg: { text: "Snikk sprudelt los: Vor drei Wochen kam <b>Krosk</b>, ein riesiger <b>Grottenschrat</b>. Er hat den Häuptling verprügelt und befiehlt jetzt allen. Tief im Steinbruch hat er eine alte <b>Zwergentür mit Zahnrädern</b> gefunden. „Krosk will Schatz! Zahnrad-Mann soll Tür reparieren! Goblins wollen nicht – Krosk ist böse!“ Snikk will euch helfen.",
            effekt: function (g) { g.flags.snikk = true; }, ziel: "s2_muetze" } },
        { text: "Snikk laufen lassen", ergebnis: true,
          erfolg: { text: "Snikk sieht euch ungläubig an – dann rennt er davon, so schnell ihn seine kurzen Beine tragen.", ziel: "s2_muetze" } }
      ]
    },

    s2b: {
      titel: "Szene 2 – Der alte Karrenweg",
      text: "Der Weg ist kaum noch zu erkennen. Brombeeren haben ihn fast verschluckt, umgestürzte Bäume liegen kreuz und quer. Ab und zu seht ihr alte Wagenspuren, tief in den Stein gefahren.",
      optionen: [
        { text: "Den Spuren folgen und den Weg finden", probe: { fert: "ueberleben", sg: 12 },
          erfolg: { text: "Du findest immer wieder die alten Spuren. Nach zwei Stunden steht ihr am <b>oberen Rand des Steinbruchs</b> – ungesehen. (Beim Schleichen im Steinbruch habt ihr Vorteil.)",
            effekt: function (g) { g.flags.oben = true; }, ziel: "s2_muetze" },
          misserfolg: { text: "Irgendwann ist der Weg einfach weg. Ihr irrt durch das Unterholz … und plötzlich knurrt es.", ziel: "s2b_woelfe" } }
      ]
    },

    s2b_woelfe: {
      titel: "Szene 2 – Wölfe",
      text: "Zwischen den Bäumen leuchten zwei Augenpaare. Zwei magere, graue <b>Wölfe</b> kommen knurrend näher, die Köpfe gesenkt. Sie sind hungrig. Sehr hungrig.",
      optionen: [
        { text: "Kämpfen!", ergebnis: true, erfolg: { kampf: "woelfe" } },
        { text: "Den Wölfen den Proviant hinwerfen", ergebnis: true,
          erfolg: { text: "Ihr werft euren Proviant ins Gebüsch. Die Wölfe stürzen sich darauf – und ihr seid vergessen. (Heute Abend gibt's halt nichts zu essen.)", ziel: "s2_muetze" } },
        { text: "Die Wölfe ruhig ansprechen und beruhigen", probe: { fert: "tiere", sg: 13 },
          erfolg: { text: "Du gehst in die Hocke, sprichst leise und hältst ihrem Blick stand. Nach einer Ewigkeit drehen die Wölfe ab.", ziel: "s2_muetze" },
          misserfolg: { text: "Der größere Wolf fletscht die Zähne – und springt!", kampf: "woelfe" } }
      ]
    },

    s2_muetze: {
      titel: "Szene 2 – Kurz vor dem Ziel",
      text: "Kurz vor dem Steinbruch liegt etwas im Schlamm: eine mehlbestäubte Mütze. Die von Hannes! Ihr seid auf der richtigen Spur.",
      kurz: "Ihr steht kurz vor dem Steinbruch. Die Mütze von Hannes liegt noch im Schlamm.",
      optionen: [
        { text: "Die Spuren im Schlamm untersuchen", einmal: "spuren", probe: { fert: "ueberleben", sg: 10 },
          erfolg: { text: "Viele kleine Füße – Goblins. Und dazwischen ein paar <b>riesige Abdrücke mit Krallen</b>. Was auch immer das ist: Es ist groß und schwer." },
          misserfolg: { text: "Nur Matsch. Sehr viel Matsch." } },
        { text: "Eine kurze Rast machen (1 Stunde)", einmal: "rast", ergebnis: true, erfolg: { rast: true, text: "Ihr setzt euch unter eine große Erle und verschnauft eine Stunde." } },
        { text: "Weiter zum Steinbruch", ziel: "s3" }
      ]
    },

    s3: {
      titel: "Szene 3 – Der Steinbruch",
      text: function (g) {
        return "Vor euch öffnet sich ein riesiges Loch im Berg, in Stufen gehauen wie eine Treppe für Riesen. Unten flackert ein Lagerfeuer unter einer zerrissenen Plane. Zwei Goblins hocken davor und streiten sich um einen Hühnerknochen. Daneben steht ein wackeliger Holzkäfig voller gackernder Hühner. In der Nordwand gähnt ein dunkler <b>Tunnel</b>, umrahmt von uralten Zwergenrunen. Aus der Tiefe hört ihr ein rhythmisches <i>Klonk … klonk … klonk</i>." +
          (g.flags.oben ? "<br><br>Von eurem Platz am oberen Rand seht ihr alles – und niemand sieht euch." : "");
      },
      optionen: [
        { text: "Zum Tunnel hinunterschleichen", probe: { fert: "heimlichkeit", sg: 12, gruppe: true, vorteil: function (g) { return g.flags.oben; } },
          erfolg: { text: "Wie Schatten huscht ihr die Stufen hinunter und in den Tunnel. Die Goblins streiten weiter um ihren Knochen.", ziel: "s3_tunnel" },
          misserfolg: { text: "Ein Stein rollt polternd die Stufen hinunter. Die Goblins springen auf: „Eindringlinge!“", kampf: "goblins_lager" } },
        { text: "Den Hühnerkäfig öffnen, um die Goblins abzulenken", probe: { fert: "fingerfertigkeit", sg: 10 },
          erfolg: { text: "Gackernd flattern die Hühner in alle Richtungen. Die Goblins rennen fluchend hinterher – und ihr schlüpft in den Tunnel.", ziel: "s3_tunnel" },
          misserfolg: { text: "Der Riegel quietscht laut. „He! Finger weg von unserem Abendessen!“", kampf: "goblins_lager" } },
        { text: "Snikk mit den Goblins reden lassen", wenn: function (g) { return g.flags.snikk; }, ergebnis: true,
          erfolg: { text: "Snikk quiekt und fuchtelt wild mit den Armen. Die beiden Goblins sehen sich an, dann nicken sie. „Krosk ist unten bei der großen Tür. Macht ihn kaputt!“ Sie lassen euch durch.", ziel: "s3_tunnel" } },
        { text: "Freundlich mit den Goblins reden", wenn: function (g) { return !g.flags.snikk; }, probe: { fert: "ueberzeugen", sg: 13 },
          erfolg: { text: "Erst sind die Goblins misstrauisch, dann erleichtert. „Krosk hat uns aus unseren Höhlen gejagt. Er ist unten bei der großen Tür, mit dem Mehl-Mann.“ Sie lassen euch durch.", ziel: "s3_tunnel" },
          misserfolg: { text: "„Lügner!“ Die Goblins greifen nach ihren Säbeln.", kampf: "goblins_lager" } },
        { text: "Angreifen!", ergebnis: true,
          erfolg: function (g) {
            return g.flags.oben
              ? { text: "Ihr springt von oben herab. Die Goblins sind <b>überrascht</b>.", kampf: "goblins_lager", ueberrascht: "gegner" }
              : { kampf: "goblins_lager" };
          } }
      ]
    },

    s3_tunnel: {
      titel: "Szene 3 – Der Tunnel",
      text: "Der Tunnel ist eng und feucht und führt schräg nach unten. An den Wänden sind zwergische Runen eingemeißelt. Das <i>Klonk … klonk</i> wird lauter.",
      optionen: [
        { text: "Vorsichtig weitergehen und den Boden absuchen", probe: { fert: "wahrnehmung", sg: 13 },
          erfolg: { text: "Eine Bodenplatte sitzt locker – eine alte Zwergenfalle! Ihr steigt vorsichtig darüber.", ziel: "s4" },
          misserfolg: { text: "KNIRSCH. Eine Bodenplatte gibt nach – Steine prasseln von der Decke!", falle: true, ziel: "s4" } },
        { text: "Schnell weiter – keine Zeit!", ergebnis: true,
          erfolg: { text: "KNIRSCH. Eine Bodenplatte gibt nach – Steine prasseln von der Decke!", falle: true, ziel: "s4" } }
      ]
    },

    s4: {
      titel: "Szene 4 – Die Zwergentür",
      text: function (g) {
        return "Der Gang endet in einer großen Höhle. Die ganze Rückwand ist ein gewaltiges <b>Tor aus dunklem Metall</b>, übersät mit Zahnrädern – manche so groß wie ein Wagenrad. Links daneben ragt ein rostiger <b>Hebel</b> aus der Wand.<br><br>" +
          "Davor kniet <b>Hannes</b>, der Müller, eine Kette am Fuß, und hämmert verzweifelt an einem Zahnrad herum." +
          (g.flags.gnatzWeg ? "" : " Daneben steht ein Goblin mit einer Fackel.") + "<br><br>" +
          "Und dann seht ihr <i>ihn</i>: fast zwei Meter groß, zottiges Fell, lange Arme, ein Morgenstern über der Schulter. <b>Krosk</b>." +
          (g.flags.gewarnt ? " Er steht schon mit dem Gesicht zum Tunnel. „Kleine Leute. Krosk hat euch gehört.“" : " Er hat euch noch nicht bemerkt.");
      },
      beimBetreten: function (g) {
        if (g.flags.snikk && !g.flags.gnatzWeg) {
          g.flags.gnatzWeg = true;
          return "Snikk huscht vor und quiekt dem Fackel-Goblin etwas zu. Der lässt die Fackel fallen und rennt davon! Snikk grinst stolz.";
        }
        return "";
      },
      optionen: [
        { text: "Aus dem Schatten heraus angreifen", wenn: function (g) { return !g.flags.gewarnt; }, probe: { fert: "heimlichkeit", sg: 12, gruppe: true },
          erfolg: { text: "Krosk merkt nichts, bis es zu spät ist. Er ist <b>überrascht</b>!", kampf: "krosk", ueberrascht: "gegner" },
          misserfolg: { text: "Krosk dreht sich langsam um und grinst. „Abendessen.“", kampf: "krosk" } },
        { text: "Angreifen!", ergebnis: true, erfolg: { text: "„Kleine Leute wollen kämpfen? Gut!“ brüllt Krosk.", kampf: "krosk" } },
        { text: "Mit Krosk verhandeln: einen viel größeren Schatz versprechen", probe: { fert: "taeuschen", sg: 14 },
          erfolg: { text: "„Ein Drachenhort? Zwei Tage nach Osten?“ Krosks Augen leuchten gierig. Er schnappt sich einen Sack, stößt Hannes zur Seite und stapft durch einen Seitengang davon.", ziel: "ende_verhandelt" },
          misserfolg: { text: "„Krosk nicht dumm!“ brüllt er und hebt den Morgenstern.", kampf: "krosk" } }
      ]
    },

    gefangen: {
      titel: "Gefangen!",
      text: function (g) {
        return "Dunkelheit. Dann ein dumpfer Schmerz im Kopf. Als ihr die Augen öffnet, sitzt ihr <b>angekettet</b> an der Wand einer großen Höhle vor einem riesigen Zahnrad-Tor. Neben euch hämmert Hannes, der Müller, an einem Zahnrad. Krosk schnarcht laut auf einem Haufen Felle.<br><br>„Ihr seid wach!“, flüstert Hannes. „Schnell, bevor er aufwacht!“" +
          (g.flags.snikk ? "<br><br>Aus dem Schatten huscht eine kleine Gestalt heran – <b>Snikk</b>, mit einem Schlüsselbund in der Hand!" : "");
      },
      kurz: "Ihr hängt immer noch in den Ketten. Krosk schnarcht.",
      immer: true,
      beimBetreten: function (g) {
        g.helden.forEach(function (h) { if (!h.tot && h.tp < 1) { h.tp = 1; h.ds = { e: 0, m: 0 }; h.stabil = false; } });
        g.flags.versuche = 0;
        return "Jeder Held, der noch lebt, hat wieder 1 TP.";
      },
      optionen: [
        { text: "Snikk die Ketten aufschließen lassen", wenn: function (g) { return g.flags.snikk; }, ergebnis: true,
          erfolg: { text: "Klick, klick, klick. Snikk grinst über das ganze Gesicht.", ziel: "gefangen_frei" } },
        { text: "Das Schloss mit einem Draht knacken", probe: { fert: "fingerfertigkeit", sg: 12 },
          erfolg: { text: "Klick! Das Schloss springt auf, dann die anderen.", ziel: "gefangen_frei" },
          misserfolg: gefangenFehlschlag },
        { text: "Die Kette mit roher Kraft aus der Wand reißen", probe: { fert: "athletik", sg: 14 },
          erfolg: { text: "Mit einem Ruck reißt der Ring aus dem Fels. Die anderen Ketten hängen alle daran.", ziel: "gefangen_frei" },
          misserfolg: gefangenFehlschlag }
      ]
    },

    gefangen_frei: {
      titel: "Frei!",
      text: "Die Ketten fallen klirrend zu Boden. Ihr erstarrt – aber Krosk schnarcht weiter. Eure Waffen liegen auf einem Haufen in der Ecke. Hannes zeigt zum Tunnel: „Raus hier!“",
      optionen: [
        { text: "Krosk im Schlaf angreifen", ergebnis: true,
          erfolg: { text: "Ihr schnappt euch eure Waffen und schleicht zu dem schlafenden Riesen. Der erste Angriff hat Vorteil!", kampf: "krosk_schlaf", ueberrascht: "gegner" } },
        { text: "Leise mit Hannes fliehen", ergebnis: true, erfolg: { ziel: "ende_flucht" } }
      ]
    },

    ende_sieg: {
      titel: "Geschafft!",
      ende: true,
      text: function (g) {
        return (g.flags.kroskGeflohen ? "Krosk ist geflohen – mit eingezogenem Kopf und ohne Beute. " : "Krosk liegt besiegt am Boden. ") +
          "Ihr befreit Hannes, und gemeinsam bringt ihr das große Zahnrad in Gang. Mit einem letzten Kreischen schwingt das Tor auf. Dahinter liegt eine kleine, runde Kammer: <b>60 Goldmünzen</b> in alten Zwergenprägungen, ein summender <b>Zwergen-Kriegshammer +1</b>, <b>2 Heiltränke</b> – und eine Steintafel mit einer Karte, die einen zweiten Eingang tief im Gebirge zeigt.<br><br>" +
          "Zurück im Dorf fällt Tobi seinem Vater um den Hals. Die Vorsteherin zahlt die versprochenen <b>50 Goldmünzen</b>, und Grumm schenkt den ganzen Abend aus. Alle Helden steigen auf <b>Stufe 2</b>!";
      }
    },
    ende_verhandelt: {
      titel: "Geschafft – mit Köpfchen!",
      ende: true,
      text: "Kaum ist Krosk verschwunden, befreit ihr Hannes. „Der Riese war so mit der Tür beschäftigt, dass er nicht gemerkt hat: Ich hab sie fast fertig!“ Mit vereinten Kräften dreht ihr das große Rad – das Tor schwingt auf. Dahinter: <b>60 Goldmünzen</b>, ein <b>Zwergen-Kriegshammer +1</b>, <b>2 Heiltränke</b> und eine Steintafel mit einer geheimnisvollen Karte.<br><br>Ohne einen einzigen Schwerthieb habt ihr Hannes gerettet. Im Dorf feiert man euch als die schlauesten Helden seit Langem – und irgendwo im Osten sucht ein sehr wütender Grottenschrat nach einem Drachenhort, den es nicht gibt. Alle Helden steigen auf <b>Stufe 2</b>!"
    },
    ende_flucht: {
      titel: "Entkommen!",
      ende: true,
      text: "Auf Zehenspitzen schleicht ihr mit Hannes durch den Tunnel, vorbei an den schlafenden Goblins, hinaus in die kühle Nachtluft. Im Morgengrauen erreicht ihr Erlenbach. Tobi fällt seinem Vater weinend um den Hals, und die Vorsteherin zahlt euch die <b>50 Goldmünzen</b>.<br><br>Was hinter der Zwergentür liegt, wisst ihr nicht. Aber Krosk schläft dort immer noch – und vielleicht kommt ihr eines Tages zurück. Alle Helden steigen auf <b>Stufe 2</b>!"
    },
    ende_niederlage: {
      titel: "Niederlage",
      ende: true,
      niederlage: true,
      text: "Diesmal geht Krosk kein Risiko ein. Er lässt euch von den Goblins tief in den Erlenwald schleppen und dort liegen. Als ihr zu euch kommt, ist es Tag – und Hannes ist immer noch in seiner Gewalt.<br><br>Das Abenteuer ist nicht geschafft. Aber Helden geben nicht auf: Startet es neu und versucht einen anderen Weg!"
    },
    ende_tot: {
      titel: "Das Ende",
      ende: true,
      niederlage: true,
      text: "Keiner der Helden hat überlebt. Die Lieder in der Taverne werden von ihrem Mut erzählen – und davon, dass man vor einem Grottenschrat besser nicht leichtsinnig wird.<br><br>Startet das Abenteuer neu und versucht es mit mehr Vorsicht (oder mehr Heiltränken)."
    }
  };

  function gefangenFehlschlag(g) {
    g.flags.versuche = (g.flags.versuche || 0) + 1;
    if (g.flags.versuche >= 3) {
      return { text: "Die Kette rasselt laut. Krosk schlägt die Augen auf. „WER LÄRMT DA?!“ Ihr müsst kämpfen – mit nur 1 TP!", kampf: "krosk_wach" };
    }
    return { text: "Es klappt nicht. Krosk grunzt im Schlaf und dreht sich um. (Noch " + (3 - g.flags.versuche) + " Versuch" + (g.flags.versuche === 2 ? "" : "e") + ", bevor er aufwacht.)" };
  }

  function kroskTP() {
    var tp = G.leicht ? 20 : 27;
    var n = G.helden.length;
    if (n <= 2) tp = Math.round(tp * 0.6);
    else if (n === 3) tp = Math.round(tp * 0.8);
    return tp;
  }

  /* ======================================================
     Szenen-Ablauf
     ====================================================== */
  function knoten() { return KNOTEN[G.knoten]; }
  function textVon(x) { return typeof x === "function" ? x(G) : x; }

  function sichtbareOptionen() {
    return (knoten().optionen || []).filter(function (o) {
      return (!o.wenn || o.wenn(G)) && (!o.einmal || !G.benutzt[o.einmal]);
    });
  }

  function rotieren() {
    var n = G.helden.length;
    for (var k = 1; k <= n; k++) {
      var i = (G.aktiv + k) % n;
      if (steht(G.helden[i])) { G.aktiv = i; return; }
    }
  }

  function handelnder() {
    if (UI.wer !== null && G.helden[UI.wer] && steht(G.helden[UI.wer])) return G.helden[UI.wer];
    if (!steht(G.helden[G.aktiv])) rotieren();
    return G.helden[G.aktiv];
  }

  function waehle(o) {
    if (UI.sperre) return;
    var h = handelnder();
    UI.wer = null;
    if (o.einmal) G.benutzt[o.einmal] = true;
    G.ersterBlick = false;
    G.ergebnis = "";
    log("» " + (o.probe && o.probe.gruppe ? "Die Gruppe" : h.name) + ": " + o.text, "info");
    if (o.probe) {
      var spec = kopie(o.probe);
      if (o.probe.vorteil && o.probe.vorteil(G)) spec.modus = "v";
      var danach = function (ok) { ergebnis(ok ? o.erfolg : o.misserfolg); };
      if (o.probe.gruppe) gruppenprobe(spec, danach); else probe(spec, h, danach);
    } else if (o.ergebnis) {
      ergebnis(o.erfolg);
    } else {
      ergebnis({ ziel: o.ziel });
    }
  }

  function ergebnis(r) {
    if (typeof r === "function") r = r(G);
    r = r || {};
    rotieren();
    var text = textVon(r.text);
    if (text) { G.ergebnis = text; log(text, "story"); }
    if (r.effekt) r.effekt(G);
    function weiter() {
      if (r.kampf) starteKampf(r.kampf, r.ueberrascht || null);
      else if (r.ziel) geheZu(r.ziel);
      else { sichern(); render(); }
    }
    if (r.rast) { kurzeRast(); weiter(); }
    else if (r.falle) falle(weiter);
    else weiter();
  }

  function geheZu(id) {
    G.knoten = id;
    G.ersterBlick = true;
    var k = KNOTEN[id];
    if (!G.besucht[id] || k.immer) {
      G.besucht[id] = true;
      if (k.beimBetreten) {
        var t = k.beimBetreten(G);
        if (t) { G.ergebnis = (G.ergebnis ? G.ergebnis + "<br><br>" : "") + t; log(t, "story"); }
      }
    }
    if (k.ende) log("=== " + k.titel + " ===", "info");
    sichern();
    render();
    var e = $("kapitel");
    if (e && e.scrollIntoView) $("spiel").scrollIntoView();
  }

  function kurzeRast() {
    log("Kurze Rast: Jeder darf einen Trefferwürfel ausgeben, um sich zu heilen.", "info");
    G.helden.forEach(function (h) {
      if (!steht(h)) return;
      var tw = DATEN.klassen[h.klasse].tw;
      if (h.tp < h.tpMax && h.tw > 0) {
        h.tw--;
        var w = DND.zufall(tw), heil = Math.max(1, w + attMod(h, "kon"));
        var vor = h.tp;
        h.tp = Math.min(h.tpMax, h.tp + heil);
        log(h.name + ": Trefferwürfel W" + tw + " [" + w + "] " + DND.vz(attMod(h, "kon")) + " → +" + (h.tp - vor) + " TP (" + h.tp + "/" + h.tpMax + ")", "gut");
      }
      if (KK[h.klasse].atem && h.atem < 2) { h.atem++; log(h.name + " hat wieder einen Zweiten Atem mehr."); }
    });
  }

  function falle(weiter) {
    var leute = G.helden.filter(steht), i = 0;
    log("Alle machen einen GES-Rettungswurf (SG 12). Misserfolg: 2W4 Schaden, Erfolg: die Hälfte.", "info");
    (function naechster() {
      if (i >= leute.length) { weiter(); return; }
      var h = leute[i++];
      rettungswurf(h, "ges", 12, "", function (ok) {
        var d = DND.wuerfle("2W4");
        var s = ok ? Math.floor(d.summe / 2) : d.summe;
        h.tp -= s;
        h.st.eingesteckt += s;
        log(h.name + " nimmt " + s + " Schaden" + (ok ? " (halbiert)" : "") + ". TP: " + Math.max(0, h.tp) + "/" + h.tpMax, ok ? "" : "schlecht");
        if (h.tp <= 0) {
          h.tp = 1;
          log(h.name + " bricht zusammen, aber die anderen versorgen die Wunden. Nach einer Weile kommt " + h.name + " mit 1 TP wieder zu sich.", "info");
        }
        naechster();
      });
    })();
  }

  /* ======================================================
     Kampf
     ====================================================== */
  function starteKampf(id, ueberrascht) {
    var cfg = KAEMPFE[id];
    var liste = typeof cfg.gegner === "function" ? cfg.gegner(G) : cfg.gegner;
    var zaehler = {};
    liste.forEach(function (k) { zaehler[k] = (zaehler[k] || 0) + 1; });
    var nr = {};
    var gegner = liste.map(function (k, i) {
      var g = kopie(MON[k]);
      g.key = k;
      if (k === "krosk") { g.tpMax = kroskTP(); g.tp = G.flags.kroskTP > 0 ? Math.min(G.flags.kroskTP, g.tpMax) : g.tpMax; }
      else { g.tpMax = g.tp; }
      if (cfg.namen && cfg.namen[i]) g.name = cfg.namen[i];
      else if (zaehler[k] > 1) { nr[k] = (nr[k] || 0) + 1; g.name = g.name + " " + nr[k]; }
      g.weg = false; g.liegend = false; g.nachteil = false; g.mal = null;
      return g;
    });
    var K = { id: id, gegner: gegner, ordnung: [], pos: -1, runde: 1, ueberrascht: ueberrascht, zug: null,
      segen: null, rausch: {}, ausweichen: {}, hebel: false, schlaf: !!cfg.schlaf, logStart: G.log.length };
    log("⚔ KAMPF! Alle würfeln Initiative (W20 + GES)." +
      (ueberrascht === "helden" ? " Ihr seid überrascht: Nachteil auf eure Initiative." : ueberrascht === "gegner" ? " Die Gegner sind überrascht: Nachteil auf ihre Initiative." : ""), "info");
    var ini = [];
    gegner.forEach(function (g, i) {
      var r = DND.w20(g.ges, ueberrascht === "gegner" || cfg.schlaf ? "n" : "");
      ini.push({ t: "g", i: i, wert: r.summe });
      log(g.name + ": " + r.text + " = " + r.summe);
    });
    var helden = [];
    G.helden.forEach(function (h, i) { if (steht(h)) helden.push(i); });
    var j = 0;
    UI.sperre = true;
    render();
    (function naechster() {
      if (j >= helden.length) {
        ini.sort(function (a, b) { return (b.wert - a.wert) || (a.t === "h" ? -1 : 1); });
        K.ordnung = ini.map(function (x) { return { t: x.t, i: x.i }; });
        G.kampf = K;
        UI.sperre = false;
        log("Reihenfolge: " + K.ordnung.map(function (e) { return name(e); }).join(" → "), "info");
        log("— Runde 1 —", "info");
        naechsterZug();
        return;
      }
      var hi = helden[j++], h = G.helden[hi];
      w20Held(h, "Initiative", attMod(h, "ges"), ueberrascht === "helden" ? "n" : "", function (r) {
        ini.push({ t: "h", i: hi, wert: r.summe });
        log(h.name + ": Initiative " + r.text + " = " + r.summe);
        naechster();
      });
    })();
  }

  function name(e) { return e.t === "h" ? G.helden[e.i].name : G.kampf.gegner[e.i].name; }

  function lebendeGegner() { return G.kampf.gegner.filter(function (g) { return g.tp > 0 && !g.weg; }); }

  function pruefeEnde() {
    var K = G.kampf, cfg = KAEMPFE[K.id];
    var lebend = lebendeGegner();
    if (cfg.aufgabe && lebend.length === cfg.aufgabe.rest && K.gegner.some(function (g) { return g.tp <= 0; })) {
      var s = lebend[0];
      log("Der letzte Goblin wirft seinen Säbel weg und quiekt: „Nicht töten! Snikk ergibt sich!“", "info");
      s.name = cfg.aufgabe.name;
      kampfEnde(cfg.aufgabe.ziel, true);
      return true;
    }
    if (!lebend.length) { kampfEnde(cfg.sieg, true); return true; }
    if (!G.helden.some(steht)) { kampfEnde(cfg.niederlage, false); return true; }
    return false;
  }

  function kampfEnde(ziel, sieg) {
    var K = G.kampf;
    K.gegner.forEach(function (g) {
      if (g.key === "krosk") {
        G.flags.kroskTP = g.tp > 0 ? g.tp : 0;
        if (g.weg) G.flags.kroskGeflohen = true;
      }
    });
    G.kampf = null;
    UI.zielwahl = null;
    log(sieg ? "Der Kampf ist vorbei – gewonnen!" : "Alle Helden sind gefallen …", sieg ? "gut" : "schlecht");
    G.helden.forEach(function (h) {
      h.liegend = false;
      if (!h.tot && h.tp <= 0) {
        if (sieg) { h.tp = 1; log(h.name + " wird von den anderen versorgt und kommt mit 1 TP wieder zu sich.", "info"); }
        h.ds = { e: 0, m: 0 };
        h.stabil = false;
      }
    });
    if (G.helden.every(function (h) { return h.tot; })) ziel = "ende_tot";
    G.ergebnis = "";
    if (!G.helden[G.aktiv] || !steht(G.helden[G.aktiv])) rotieren();
    geheZu(ziel);
  }

  function naechsterZug() {
    var K = G.kampf;
    if (!K) return;
    if (pruefeEnde()) return;
    for (var sicher = 0; sicher < 50; sicher++) {
      K.pos++;
      if (K.pos >= K.ordnung.length) {
        K.pos = 0;
        K.runde++;
        log("— Runde " + K.runde + " —", "info");
        var cfg = KAEMPFE[K.id];
        if (cfg.warnRunde && K.runde === cfg.warnRunde && !G.flags.gewarnt && lebendeGegner().length) {
          G.flags.gewarnt = true;
          log("Ein Goblin brüllt in den Tunnel: „KROSK! EINDRINGLINGE!“ (Krosk ist jetzt gewarnt.)", "schlecht");
        }
      }
      var e = K.ordnung[K.pos];
      if (e.t === "g") {
        var g = K.gegner[e.i];
        if (g.tp <= 0 || g.weg) continue;
        K.zug = null;
        sichern();
        render();
        setTimeout(function () {
          if (!G || !G.kampf) return;
          gegnerZug(G.kampf.ordnung[G.kampf.pos].i, function () { sichern(); naechsterZug(); });
        }, window.__schnell ? 5 : 750);
        return;
      }
      var h = G.helden[e.i];
      if (h.tot || (h.tp <= 0 && h.stabil)) continue;
      K.ausweichen[e.i] = false;
      K.zug = { held: e.i, aktion: false, bonus: false, hinterhalt: false };
      if (h.liegend && h.tp > 0) { h.liegend = false; log(h.name + " steht auf (das kostet die halbe Bewegung)."); }
      sichern();
      render();
      return;
    }
  }

  function endeZug() {
    if (!G.kampf) return;
    UI.zielwahl = null;
    G.kampf.zug = null;
    naechsterZug();
  }

  /* ---------- Gegner ---------- */
  function gegnerZug(gi, fertig) {
    var K = G.kampf, g = K.gegner[gi];
    if (g.key === "krosk" && K.schlaf) { log("Krosk schnarcht weiter …"); render(); fertig(); return; }
    if (g.liegend) { g.liegend = false; log(g.name + " rappelt sich wieder auf."); }
    if (g.flieht && g.tp <= g.flieht) {
      g.weg = true;
      log("Krosk blutet aus vielen Wunden. Er schnappt sich einen Sack voller Beute und flieht brüllend durch einen Seitengang!", "gut");
      render();
      fertig();
      return;
    }
    var ziele = [];
    G.helden.forEach(function (h, i) { if (steht(h)) ziele.push(i); });
    if (!ziele.length) { fertig(); return; }
    var ti = DND.zufallAus(ziele), h = G.helden[ti], a = g.angriff;
    var vorteil = h.liegend || (g.rudel && K.gegner.some(function (x, j) { return j !== gi && x.key === g.key && x.tp > 0 && !x.weg; }));
    var nachteil = !!K.ausweichen[ti] || g.nachteil;
    g.nachteil = false;
    var modus = vorteil && !nachteil ? "v" : (!vorteil && nachteil ? "n" : "");
    var r = DND.w20(a.bonus, modus);
    log(g.name + " greift " + h.name + " an (" + a.name + (modus === "v" ? ", mit Vorteil" : modus === "n" ? ", mit Nachteil" : "") + "): " + r.text + " = " + r.summe + " gegen RK " + h.rk);
    var trifft = r.natur === 20 || (r.natur !== 1 && r.summe >= h.rk);
    if (trifft && KK[h.klasse].schild && h.slots > 0 && r.natur !== 20 && r.summe < h.rk + 5 && h.tp <= 12) {
      h.slots--;
      log("Reaktion: " + h.name + " wirkt Schild (1 Zauberplatz)! RK " + (h.rk + 5) + " – der Angriff prallt an einer unsichtbaren Wand ab.", "gut");
      render();
      fertig();
      return;
    }
    if (!trifft) {
      log(r.natur === 1 ? "Natürliche 1 – voll daneben!" : "Daneben!", "gut");
      render();
      fertig();
      return;
    }
    var krit = r.natur === 20;
    var d = DND.wuerfle(krit ? kritFormel(a.schaden) : a.schaden);
    var summe = d.summe, txt = d.text;
    if (g.key === "krosk" && K.ueberrascht === "helden" && K.runde === 1) {
      var e2 = DND.wuerfle(krit ? "4W6" : "2W6");
      summe += e2.summe;
      txt += " + Überraschungsangriff " + e2.text;
    }
    log((krit ? "KRITISCHER TREFFER! " : "Treffer! ") + "Schaden: " + txt + " = " + summe, "schlecht");
    schadenAnHeld(ti, summe, function () {
      if (a.umwerfen && steht(h)) {
        rettungswurf(h, "sta", a.umwerfen, "", function (ok) {
          if (!ok) { h.liegend = true; log(h.name + " wird umgerissen und liegt am Boden.", "schlecht"); }
          render();
          fertig();
        });
      } else {
        render();
        fertig();
      }
    });
  }

  function kritFormel(formel) {
    return DND.zerlege(formel).map(function (t, i) {
      var z = (t.vz === -1 || t.wert < 0) ? "-" : (i ? "+" : "");
      return t.typ === "w" ? z + (t.n * 2) + "W" + t.seiten : z + Math.abs(t.wert);
    }).join("");
  }

  function schadenAnHeld(ti, dmg, cb) {
    var h = G.helden[ti], K = G.kampf;
    if (K && K.rausch[ti]) { dmg = Math.floor(dmg / 2); log("Kampfrausch: " + h.name + " nimmt nur halben Schaden (" + dmg + ")."); }
    h.tp -= dmg;
    h.st.eingesteckt += dmg;
    if (h.tp <= 0) {
      if (h.volk === "ork" && !h.ork) {
        h.ork = true;
        h.tp = 1;
        log("Unerbittlich: " + h.name + " bleibt mit 1 TP stehen!", "gut");
      } else {
        h.tp = 0;
        h.ds = { e: 0, m: 0 };
        h.stabil = false;
        h.liegend = true;
        log(h.name + " fällt auf 0 TP und wird bewusstlos!", "schlecht");
        if (K) {
          if (K.segen && K.segen.caster === ti) { K.segen = null; log("Der Segen endet."); }
          delete K.rausch[ti];
        }
        cb();
        return;
      }
    }
    if (K && K.segen && K.segen.caster === ti) {
      var sg = Math.max(10, Math.floor(dmg / 2));
      log(h.name + " muss die Konzentration halten: KON-Rettungswurf gegen SG " + sg + ".", "info");
      rettungswurf(h, "kon", sg, "", function (ok) {
        if (!ok) { K.segen = null; log("Konzentration verloren – der Segen endet.", "schlecht"); }
        cb();
      });
      return;
    }
    cb();
  }

  function heilen(zi, betrag, quelle) {
    var h = G.helden[zi];
    var vor = Math.max(0, h.tp);
    h.tp = Math.min(h.tpMax, vor + betrag);
    G.helden[quelle].st.geheilt += h.tp - vor;
    if (vor === 0 && h.tp > 0) {
      h.ds = { e: 0, m: 0 };
      h.stabil = false;
      log(h.name + " kommt wieder zu sich!", "gut");
    }
    log(h.name + " heilt " + (h.tp - vor) + " TP und hat jetzt " + h.tp + "/" + h.tpMax + ".", "gut");
  }

  function trefferAnGegner(hi, gi, dmg) {
    var g = G.kampf.gegner[gi], h = G.helden[hi];
    g.tp -= dmg;
    h.st.schaden += dmg;
    if (g.tp <= 0) {
      g.tp = 0;
      log(g.key === "krosk" ? "Krosk taumelt, lässt den Morgenstern fallen und kracht zu Boden!" : g.name + " geht zu Boden!", "gut");
    } else {
      log(g.name + " hat noch " + g.tp + " von " + g.tpMax + " TP.");
    }
  }

  /* ---------- Angriffe der Helden ---------- */
  function andereStehen(hi) {
    return G.helden.some(function (x, i) { return i !== hi && steht(x); });
  }

  function angriff(hi, gi, art, fertig) {
    var h = G.helden[hi], K = G.kampf, g = K.gegner[gi], kk = KK[h.klasse], def;
    if (art === "waffe") {
      var wf = waffe(h), m = attMod(h, wf.att);
      def = { name: wf.name, bonus: m + ueb(h), teile: [wd(wf.w)], mod: m + (K.rausch[hi] && wf.att === "sta" ? 2 : 0), fern: !!wf.fern, waffe: true };
    } else if (art === "faust") {
      var mg = attMod(h, "ges");
      def = { name: "Waffenloser Schlag", bonus: mg + ueb(h), teile: [{ n: 1, s: 6 }], mod: mg, waffe: true };
    } else {
      var t = kk.trick, zm = attMod(h, kk.zauber);
      if (t.typ === "rw") def = { name: t.name, rw: t.rw, sg: zauberSG(h), teile: [wd(t.w)], mod: 0, effekt: t.effekt };
      else def = { name: t.name, bonus: zm + ueb(h), teile: [wd(t.w)], mod: 0, fern: true };
    }

    if (def.rw) {
      var mr = DND.w20(g.rw[def.rw] || 0);
      log(h.name + " wirkt " + def.name + " auf " + g.name + ". " + g.name + " macht einen " + ATT_NAME[def.rw] + "-Rettungswurf gegen SG " + def.sg + ": " + mr.text + " = " + mr.summe);
      if (mr.summe >= def.sg) { log(g.name + " widersteht – kein Schaden.", "schlecht"); fertig(); return; }
      wuerfelSumme(h, "Schaden", def.teile, def.mod, false, function (d) {
        log("Wirkt! Schaden: " + d.text + " = " + d.summe, "gut");
        if (def.effekt === "nachteil") { g.nachteil = true; log(g.name + " hat beim nächsten Angriff Nachteil."); }
        trefferAnGegner(hi, gi, d.summe);
        fertig();
      });
      return;
    }

    var vorteil = (g.liegend && !def.fern) || K.schlaf;
    var nachteil = g.liegend && def.fern;
    var modus = vorteil && !nachteil ? "v" : (!vorteil && nachteil ? "n" : "");
    w20Held(h, def.name + " gegen " + g.name, def.bonus, modus, function (r) {
      if (K.schlaf) { K.schlaf = false; log("Krosk schreckt aus dem Schlaf hoch!", "info"); }
      var trifft = r.natur === 20 || (r.natur !== 1 && r.summe >= g.rk);
      log(h.name + " greift " + g.name + " an (" + def.name + (modus === "v" ? ", Vorteil" : modus === "n" ? ", Nachteil" : "") + "): " + r.text + " = " + r.summe + " gegen RK " + g.rk + " → " +
        (r.natur === 20 ? "KRITISCHER TREFFER!" : trifft ? "Treffer!" : r.natur === 1 ? "natürliche 1, daneben." : "daneben."), trifft ? "gut" : "schlecht");
      if (!trifft) { fertig(); return; }
      var teile = def.teile.slice();
      if (kk.hinterhalt && def.waffe && !K.zug.hinterhalt && (modus === "v" || andereStehen(hi))) {
        K.zug.hinterhalt = true;
        teile.push({ n: 1, s: 6, name: "Hinterhältiger Angriff" });
      }
      if (g.mal === hi) teile.push({ n: 1, s: 6, name: "Mal des Jägers" });
      wuerfelSumme(h, "Schaden", teile, def.mod, r.natur === 20, function (d) {
        log("Schaden: " + d.text + " = " + d.summe, "gut");
        trefferAnGegner(hi, gi, d.summe);
        fertig();
      });
    }, { segen: segenFuer(hi) });
  }

  /* ---------- Liste der Aktionen für den Helden am Zug ---------- */
  function aktionen(hi) {
    var h = G.helden[hi], K = G.kampf, kk = KK[h.klasse], z = K.zug, liste = [];
    var verletzt = function () { var r = []; G.helden.forEach(function (x, i) { if (!x.tot && x.tp < x.tpMax) r.push(i); }); return r; };
    var gefallen = function () { var r = []; G.helden.forEach(function (x, i) { if (!x.tot && x.tp <= 0) r.push(i); }); return r; };

    // --- Aktionen ---
    var wf = waffe(h);
    liste.push({ art: "a", name: wf.name + " (+" + (attMod(h, wf.att) + ueb(h)) + ", " + wf.w + DND.vz(attMod(h, wf.att) + (K.rausch[hi] && wf.att === "sta" ? 2 : 0)) + ")", ziel: "gegner",
      los: function (gi, f) { angriff(hi, gi, "waffe", f); } });
    if (kk.trick) {
      var t = kk.trick;
      liste.push({ art: "a", name: t.name + (t.typ === "rw" ? " (Zaubertrick, SG " + zauberSG(h) + ", " + t.w + ")" : " (Zaubertrick, +" + (attMod(h, kk.zauber) + ueb(h)) + ", " + t.w + ")"), ziel: "gegner",
        los: function (gi, f) { angriff(hi, gi, "trick", f); } });
    }
    if (kk.geschoss && h.slots > 0) {
      liste.push({ art: "a", name: "Magisches Geschoss (Zauberplatz, trifft immer, 3 × 1W4+1)", ziel: "gegner",
        los: function (gi, f) {
          h.slots--;
          var summe = 0, teile = [];
          for (var i = 0; i < 3; i++) { var r = DND.wuerfle("1W4+1"); summe += r.summe; teile.push(r.summe); }
          log(h.name + " wirkt Magisches Geschoss: Drei leuchtende Pfeile treffen " + K.gegner[gi].name + " automatisch: " + teile.join(" + ") + " = " + summe, "gut");
          trefferAnGegner(hi, gi, summe);
          f();
        } });
    }
    if (kk.segen && h.slots > 0 && !K.segen) {
      liste.push({ art: "a", name: "Segen (Zauberplatz, Konzentration: bis zu 3 Helden +1W4 auf Angriffe und Rettungswürfe)", ziel: null,
        los: function (x, f) {
          h.slots--;
          var ziele = [hi];
          G.helden.forEach(function (o, i) { if (i !== hi && steht(o) && ziele.length < 3) ziele.push(i); });
          K.segen = { caster: hi, ziele: ziele };
          log(h.name + " wirkt Segen auf " + ziele.map(function (i) { return G.helden[i].name; }).join(", ") + ".", "gut");
          f();
        } });
    }
    if (G.traenke > 0 && gefallen().length) {
      liste.push({ art: "a", name: "Heiltrank einem Bewusstlosen einflößen", ziel: "gefallen",
        los: function (zi, f) {
          G.traenke--;
          var r = DND.wuerfle("2W4+2");
          log(h.name + " flößt " + G.helden[zi].name + " einen Heiltrank ein: " + r.text + " = " + r.summe, "gut");
          heilen(zi, r.summe, hi);
          f();
        } });
    }
    if (gefallen().some(function (i) { return !G.helden[i].stabil; })) {
      liste.push({ art: "a", name: "Bewusstlosen stabilisieren (Heilkunde, SG 10)", ziel: "gefallen-instabil",
        los: function (zi, f) {
          probe({ fert: "heilkunde", sg: 10 }, h, function (ok) {
            if (ok) { G.helden[zi].stabil = true; log(G.helden[zi].name + " ist stabil und muss keine Todesrettungswürfe mehr machen.", "gut"); }
            f();
          });
        } });
    }
    var cfg = KAEMPFE[K.id];
    if (cfg.tor) {
      if (!G.flags.hannesFrei) {
        liste.push({ art: "a", name: "Hannes von der Kette befreien (Athletik, SG 12)", ziel: null,
          los: function (x, f) {
            probe({ fert: "athletik", sg: 12 }, h, function (ok) {
              if (ok) { G.flags.hannesFrei = true; log("Der Ring reißt aus dem Fels! Hannes ruft: „Der Hebel! Links neben dem Tor! Ich hab das große Rad fast geschafft!“", "gut"); }
              else log("Die Kette hält. Hannes: „Fester!“", "schlecht");
              f();
            });
          } });
      }
      if (!K.hebel) {
        liste.push({ art: "a", name: G.flags.hannesFrei ? "Den Hebel am Tor ziehen (Hannes' Tipp!)" : "Den rostigen Hebel am Tor ziehen (???)", ziel: null,
          los: function (x, f) {
            K.hebel = true;
            log(h.name + " zieht mit aller Kraft am Hebel. Das Tor kreischt – ein riesiges Zahnrad schwingt herum!", "info");
            var kr = K.gegner.filter(function (g) { return g.key === "krosk" && g.tp > 0 && !g.weg; })[0];
            if (!kr) { log("Aber niemand steht davor."); f(); return; }
            var gi = K.gegner.indexOf(kr);
            var r = DND.w20(kr.rw.ges);
            log("Krosk steht direkt davor: GES-Rettungswurf gegen SG 12: " + r.text + " = " + r.summe);
            if (r.summe >= 12) { log("Krosk duckt sich gerade noch weg!", "schlecht"); f(); return; }
            var d = DND.wuerfle("2W6");
            log("KRACH! Das Zahnrad erwischt Krosk: " + d.text + " = " + d.summe + " Wuchtschaden, und er liegt am Boden (Nahkampfangriffe gegen ihn haben Vorteil).", "gut");
            kr.liegend = true;
            trefferAnGegner(hi, gi, d.summe);
            f();
          } });
      }
      var gnatz = K.gegner.filter(function (g) { return g.key === "gnatz" && g.tp > 0 && !g.weg; })[0];
      if (gnatz) {
        liste.push({ art: "a", name: "Gnatz anbrüllen, damit er wegläuft (Einschüchtern, SG 12)", ziel: null,
          los: function (x, f) {
            probe({ fert: "einschuechtern", sg: 12 }, h, function (ok) {
              if (ok) { gnatz.weg = true; G.flags.gnatzWeg = true; log("Gnatz kreischt, wirft seine Fackel weg und rennt davon!", "gut"); }
              else log("Gnatz zittert, bleibt aber stehen – er hat mehr Angst vor Krosk.", "schlecht");
              f();
            });
          } });
      }
    }
    liste.push({ art: "a", name: "Ausweichen (Angriffe gegen dich haben Nachteil)", ziel: null,
      los: function (x, f) { K.ausweichen[hi] = true; log(h.name + " geht in Deckung und weicht aus."); f(); } });

    // --- Bonusaktionen ---
    if (kk.atem && h.atem > 0 && h.tp < h.tpMax) {
      liste.push({ art: "b", name: "Zweiter Atem (heilt 1W10+" + h.stufe + ", noch " + h.atem + "×)", ziel: null,
        los: function (x, f) {
          h.atem--;
          wuerfelSumme(h, "Zweiter Atem", [{ n: 1, s: 10 }], h.stufe, false, function (d) {
            log(h.name + " holt tief Luft – Zweiter Atem: " + d.text + " = " + d.summe, "gut");
            heilen(hi, d.summe, hi);
            f();
          });
        } });
    }
    if (kk.rausch && h.rausch > 0 && !K.rausch[hi]) {
      liste.push({ art: "b", name: "Kampfrausch (+2 Schaden mit STÄ-Waffen, halber Schaden, noch " + h.rausch + "×)", ziel: null,
        los: function (x, f) { h.rausch--; K.rausch[hi] = true; log(h.name + " brüllt und gerät in einen Kampfrausch!", "gut"); f(); } });
    }
    if (kk.heilwort && h.slots > 0 && verletzt().length) {
      liste.push({ art: "b", name: "Heilendes Wort (Zauberplatz, 2W4" + DND.vz(attMod(h, kk.zauber)) + ", auch auf Distanz)", ziel: "verletzt",
        los: function (zi, f) {
          h.slots--;
          wuerfelSumme(h, "Heilendes Wort", [{ n: 2, s: 4 }], attMod(h, kk.zauber), false, function (d) {
            log(h.name + " spricht ein Heilendes Wort für " + G.helden[zi].name + ": " + d.text + " = " + d.summe, "gut");
            heilen(zi, d.summe, hi);
            f();
          });
        } });
    }
    if (kk.hand && h.hand > 0 && verletzt().length) {
      liste.push({ art: "b", name: "Handauflegen (heilt bis zu 5, Vorrat " + h.hand + ")", ziel: "verletzt",
        los: function (zi, f) {
          var z2 = G.helden[zi];
          var menge = Math.min(5, h.hand, z2.tpMax - Math.max(0, z2.tp));
          h.hand -= menge;
          log(h.name + " legt " + z2.name + " die Hände auf.", "gut");
          heilen(zi, menge, hi);
          f();
        } });
    }
    if (kk.mal && h.slots > 0 && !K.gegner.some(function (g) { return g.mal === hi && g.tp > 0; })) {
      liste.push({ art: "b", name: "Mal des Jägers (Zauberplatz, +1W6 Schaden gegen dieses Ziel)", ziel: "gegner",
        los: function (gi, f) { h.slots--; K.gegner[gi].mal = hi; log(h.name + " markiert " + K.gegner[gi].name + " als Beute.", "gut"); f(); } });
    }
    if (kk.kampfkunst) {
      liste.push({ art: "b", name: "Waffenloser Schlag (+" + (attMod(h, "ges") + ueb(h)) + ", 1W6" + DND.vz(attMod(h, "ges")) + ")", ziel: "gegner",
        los: function (gi, f) { angriff(hi, gi, "faust", f); } });
    }
    if (G.traenke > 0 && h.tp < h.tpMax) {
      liste.push({ art: "b", name: "Heiltrank trinken (2W4+2, noch " + G.traenke + ")", ziel: null,
        los: function (x, f) {
          G.traenke--;
          var r = DND.wuerfle("2W4+2");
          log(h.name + " trinkt einen Heiltrank: " + r.text + " = " + r.summe, "gut");
          heilen(hi, r.summe, hi);
          f();
        } });
    }
    return liste.filter(function (a) { return a.art === "a" ? !z.aktion : !z.bonus; });
  }

  function zieleFuer(art) {
    var r = [];
    if (art === "gegner") G.kampf.gegner.forEach(function (g, i) { if (g.tp > 0 && !g.weg) r.push({ i: i, text: g.name + " (" + g.tp + "/" + g.tpMax + " TP)" }); });
    if (art === "verletzt") G.helden.forEach(function (h, i) { if (!h.tot && h.tp < h.tpMax) r.push({ i: i, text: h.name + " (" + Math.max(0, h.tp) + "/" + h.tpMax + " TP)" }); });
    if (art === "gefallen") G.helden.forEach(function (h, i) { if (!h.tot && h.tp <= 0) r.push({ i: i, text: h.name }); });
    if (art === "gefallen-instabil") G.helden.forEach(function (h, i) { if (!h.tot && h.tp <= 0 && !h.stabil) r.push({ i: i, text: h.name }); });
    return r;
  }

  function fuehreAus(a, zi) {
    var K = G.kampf, hi = K.zug.held;
    UI.zielwahl = null;
    UI.sperre = true;
    a.los(zi, function () {
      UI.sperre = false;
      if (!G.kampf) return;
      if (a.art === "a") K.zug.aktion = true; else K.zug.bonus = true;
      sichern();
      if (pruefeEnde()) return;
      var rest = aktionen(hi);
      if (!steht(G.helden[hi]) || !rest.length) { endeZug(); return; }
      render();
    });
  }

  function todesrettungswurf(hi) {
    var h = G.helden[hi];
    UI.sperre = true;
    w20Held(h, "Todesrettungswurf", 0, "", function (r) {
      UI.sperre = false;
      var n = r.natur;
      if (n === 20) { h.tp = 1; h.ds = { e: 0, m: 0 }; log(h.name + ": Todesrettungswurf [20] – NATÜRLICHE 20! " + h.name + " kommt mit 1 TP wieder zu sich!", "gut"); }
      else if (n === 1) { h.ds.m += 2; log(h.name + ": Todesrettungswurf [1] – zwei Misserfolge!", "schlecht"); }
      else if (n >= 10) { h.ds.e++; log(h.name + ": Todesrettungswurf [" + n + "] – Erfolg.", "gut"); }
      else { h.ds.m++; log(h.name + ": Todesrettungswurf [" + n + "] – Misserfolg.", "schlecht"); }
      if (h.tp <= 0 && h.ds.e >= 3) { h.stabil = true; log(h.name + " ist stabil.", "info"); }
      if (h.tp <= 0 && h.ds.m >= 3) { h.tot = true; log(h.name + " ist gestorben …", "schlecht"); }
      sichern();
      endeZug();
    });
  }

  /* ======================================================
     Anzeige
     ====================================================== */
  function balken(tp, max, gegner) {
    var p = Math.max(0, Math.round(Math.max(0, tp) / max * 100));
    return '<span class="balken' + (gegner ? " gegner" : "") + '"><i style="width:' + p + '%"></i></span>';
  }
  function kaestchen(n) { var s = ""; for (var i = 0; i < 3; i++) s += i < n ? "☒" : "☐"; return s; }

  function render() {
    if (!G) return;
    var K = G.kampf, k = knoten();
    $("kapitel").textContent = K ? "⚔ Kampf – Runde " + K.runde : k.titel;
    $("traenke").textContent = "Heiltränke: " + G.traenke;

    // Wer ist dran?
    var dranIndex = -1;
    if (K && K.zug) dranIndex = K.zug.held;
    else if (!K && !k.ende) dranIndex = G.aktiv;
    var amzug = $("amzug");
    if (K) {
      var e = K.ordnung[K.pos];
      if (!e) amzug.innerHTML = "Initiative wird gewürfelt …";
      else if (e.t === "h") { var hh = G.helden[e.i]; amzug.innerHTML = "Am Zug: <b>" + hh.name + "</b>" + (hh.spieler ? " (" + hh.spieler + ")" : "") + (hh.tp <= 0 ? " – bewusstlos!" : ""); }
      else amzug.innerHTML = "Am Zug: <b>" + K.gegner[e.i].name + "</b> (Gegner)";
    } else if (k.ende) {
      amzug.innerHTML = k.niederlage ? "Das Abenteuer ist vorbei." : "<b>Abenteuer geschafft!</b>";
    } else {
      var ha = G.helden[G.aktiv];
      amzug.innerHTML = "Am Zug: <b>" + ha.name + "</b>" + (ha.spieler ? " (" + ha.spieler + ")" : "") + " – du entscheidest, was als Nächstes passiert.";
    }

    // Helden
    var hb = $("helden");
    hb.innerHTML = "";
    G.helden.forEach(function (h, i) {
      var kk = KK[h.klasse];
      var res = [];
      if (h.slotsMax) res.push("Zauberplätze " + h.slots + "/" + h.slotsMax);
      if (kk.atem) res.push("Zweiter Atem " + h.atem + "×");
      if (kk.rausch) res.push("Kampfrausch " + h.rausch + "×");
      if (kk.hand) res.push("Handauflegen " + h.hand);
      var status = [];
      if (h.tot) status.push("tot");
      else if (h.tp <= 0) status.push(h.stabil ? "bewusstlos, stabil" : "bewusstlos – Todesrettung: ✓" + kaestchen(h.ds.e) + " ✗" + kaestchen(h.ds.m));
      if (h.liegend && h.tp > 0) status.push("liegt am Boden");
      if (K && K.ausweichen[i]) status.push("weicht aus");
      if (K && K.rausch[i]) status.push("Kampfrausch");
      if (K && K.segen && K.segen.ziele.indexOf(i) !== -1) status.push("gesegnet");
      var karte = el("div", { "class": "held-karte" + (i === dranIndex ? " dran" : "") + (h.tot ? " tot" : h.tp <= 0 ? " unten" : "") });
      karte.innerHTML = "<h4>" + h.name + "</h4><div class='wer'>" + klasseName(h) + ", Stufe " + h.stufe + (h.spieler ? " · " + h.spieler : "") + "</div>" +
        balken(h.tp, h.tpMax) + Math.max(0, h.tp) + "/" + h.tpMax + " TP · RK " + h.rk +
        (res.length ? "<br><span class='klein'>" + res.join(" · ") + "</span>" : "") +
        (status.length ? "<br><span class='status'>" + status.join(", ") + "</span>" : "");
      hb.appendChild(karte);
    });

    // Kampfanzeige
    var kb = $("kampf-box");
    kb.classList.toggle("versteckt", !K);
    if (K) {
      var rf = $("reihenfolge");
      rf.innerHTML = "<b>Reihenfolge:</b> ";
      K.ordnung.forEach(function (e, j) {
        var raus = e.t === "g" ? (K.gegner[e.i].tp <= 0 || K.gegner[e.i].weg) : G.helden[e.i].tot;
        rf.appendChild(el("span", { "class": (j === K.pos ? "jetzt" : "") + (raus ? " raus" : ""), text: name(e) }));
        rf.appendChild(document.createTextNode(" "));
      });
      var gb = $("gegner");
      gb.innerHTML = "";
      K.gegner.forEach(function (g) {
        var st = [];
        if (g.tp <= 0) st.push("besiegt");
        if (g.weg) st.push("geflohen");
        if (g.liegend) st.push("liegt am Boden");
        if (g.nachteil) st.push("nächster Angriff mit Nachteil");
        if (g.mal !== null && g.mal !== undefined && g.tp > 0) st.push("Mal des Jägers");
        if (g.key === "krosk" && K.schlaf) st.push("schläft");
        var c = el("div", { "class": "gegner-karte" + (g.tp <= 0 || g.weg ? " raus" : "") });
        c.innerHTML = "<h4>" + g.name + "</h4>" + balken(g.tp, g.tpMax, true) + g.tp + "/" + g.tpMax + " TP · RK " + g.rk +
          (st.length ? "<br><span class='status rot'>" + st.join(", ") + "</span>" : "");
        gb.appendChild(c);
      });
    }

    // Erzählung
    var er = $("erzaehlung");
    er.innerHTML = "";
    if (K) {
      if (G.ergebnis && K.runde === 1) er.appendChild(el("div", { "class": "vorlesen", html: G.ergebnis }));
      var neu = G.log.slice(K.logStart || 0).slice(-5);
      var kb2 = el("div", { "class": "ergebnis" });
      neu.forEach(function (l) { kb2.appendChild(el("div", { "class": "kampf-zeile " + l[0], text: l[1] })); });
      er.appendChild(kb2);
    } else if (G.ergebnis) er.appendChild(el("div", { "class": "ergebnis", html: G.ergebnis }));
    if (!K) {
      var txt = (!G.ersterBlick && k.kurz) ? k.kurz : textVon(k.text);
      er.appendChild(el("div", { "class": "vorlesen", html: txt }));
    }

    renderSteuerung();
  }

  function renderSteuerung() {
    var s = $("steuerung");
    s.innerHTML = "";
    var K = G.kampf, k = knoten();

    // Würfelfrage (echte Würfel)
    if (UI.frage) {
      var fq = UI.frage;
      var box = el("div", { "class": "wurf-frage" });
      box.appendChild(el("div", { html: "<b>Echte Würfel:</b> " + fq.text }));
      var zeile = el("div", { "class": "zeile" });
      var inp = el("input", { type: "number", min: String(fq.min), max: String(fq.max), placeholder: fq.min + "–" + fq.max });
      var fehler = el("span", { "class": "klein rot" });
      function uebernehmen(wert) {
        var v = parseInt(wert, 10);
        if (isNaN(v) || v < fq.min || v > fq.max) { fehler.textContent = "Bitte eine Zahl von " + fq.min + " bis " + fq.max + "."; return; }
        UI.frage = null;
        fq.cb(v);
      }
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") uebernehmen(inp.value); });
      zeile.appendChild(inp);
      zeile.appendChild(el("button", { type: "button", "class": "dunkel", text: "Übernehmen", onclick: function () { uebernehmen(inp.value); } }));
      zeile.appendChild(el("button", { type: "button", text: "Für mich würfeln", onclick: function () { uebernehmen(fq.roller()); } }));
      box.appendChild(zeile);
      box.appendChild(fehler);
      s.appendChild(box);
      return;
    }

    if (UI.sperre) { s.appendChild(el("p", { "class": "klein", text: "…" })); return; }

    // Ende
    if (!K && k.ende) {
      s.appendChild(endAuswertung());
      var z = el("div", { "class": "zeile" });
      z.appendChild(el("button", { type: "button", "class": "dunkel", text: "Nochmal spielen", onclick: function () { zumSetup(true); } }));
      z.appendChild(el("a", { href: "index.html", "class": "knopf", text: "Zur Startseite" }));
      s.appendChild(z);
      return;
    }

    // Erkunden: Optionen
    if (!K) {
      var opts = sichtbareOptionen();
      var wer = el("div", { "class": "zeile klein" });
      wer.appendChild(document.createTextNode("Wer probiert es? "));
      var sel = el("select", { "aria-label": "Wer handelt" });
      G.helden.forEach(function (h, i) {
        if (!steht(h)) return;
        var o = el("option", { value: String(i), text: h.name + (i === G.aktiv ? " (am Zug)" : "") });
        if ((UI.wer === null && i === G.aktiv) || UI.wer === i) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener("change", function () { UI.wer = parseInt(sel.value, 10); render(); });
      wer.appendChild(sel);
      wer.appendChild(el("span", { text: " – normalerweise der, der am Zug ist. Bei Gruppenproben würfeln alle." }));
      s.appendChild(wer);

      var h = handelnder();
      var box2 = el("div", { "class": "optionen" });
      opts.forEach(function (o) {
        var b = el("button", { type: "button" });
        b.appendChild(document.createTextNode(o.text));
        if (o.probe) {
          var info;
          var spec = o.probe;
          var bf = bonusFuer(h, spec);
          if (spec.gruppe) info = " – Gruppenprobe: " + bf.titel;
          else info = " – " + bf.titel + " " + DND.vz(bf.bonus) + " (" + h.name + ")";
          if (spec.vorteil && spec.vorteil(G)) info += ", mit Vorteil";
          b.appendChild(el("span", { "class": "probe-info", text: info }));
        }
        b.addEventListener("click", function () { waehle(o); });
        box2.appendChild(b);
      });
      s.appendChild(box2);
      return;
    }

    // Kampf
    var e = K.ordnung[K.pos];
    if (!e || e.t === "g" || !K.zug) {
      s.appendChild(el("p", { "class": "klein", text: e && e.t === "g" ? K.gegner[e.i].name + " ist am Zug …" : "…" }));
      return;
    }
    var hi = K.zug.held, hh = G.helden[hi];
    if (hh.tp <= 0) {
      s.appendChild(el("p", { html: "<b>" + hh.name + "</b> ist bewusstlos und muss einen <b>Todesrettungswurf</b> machen: W20, 10 oder mehr ist ein Erfolg." }));
      s.appendChild(el("button", { type: "button", "class": "dunkel", text: "Todesrettungswurf würfeln", onclick: function () { todesrettungswurf(hi); } }));
      return;
    }
    if (UI.zielwahl) {
      var zw = UI.zielwahl;
      s.appendChild(el("p", { html: "<b>" + zw.a.name.replace(/ \(.*$/, "") + "</b> – wen?" }));
      var zr = el("div", { "class": "zeile" });
      zieleFuer(zw.a.ziel).forEach(function (zz) {
        zr.appendChild(el("button", { type: "button", "class": "dunkel", text: zz.text, onclick: function () { fuehreAus(zw.a, zz.i); } }));
      });
      zr.appendChild(el("button", { type: "button", text: "Abbrechen", onclick: function () { UI.zielwahl = null; render(); } }));
      s.appendChild(zr);
      return;
    }
    var liste = aktionen(hi);
    [["a", "Aktion (eine pro Zug)"], ["b", "Bonusaktion (eine pro Zug)"]].forEach(function (gr) {
      var teil = liste.filter(function (a) { return a.art === gr[0]; });
      if (!teil.length) return;
      var g = el("div", { "class": "aktionsgruppe" });
      g.appendChild(el("div", { "class": "titel", text: gr[1] }));
      var kn = el("div", { "class": "knoepfe" });
      teil.forEach(function (a) {
        kn.appendChild(el("button", {
          type: "button", "class": gr[0] === "a" ? "dunkel" : "", text: a.name,
          onclick: function () {
            if (a.ziel) {
              var zl = zieleFuer(a.ziel);
              if (zl.length === 1) { fuehreAus(a, zl[0].i); return; }
              UI.zielwahl = { a: a };
              render();
            } else fuehreAus(a, null);
          }
        }));
      });
      g.appendChild(kn);
      s.appendChild(g);
    });
    var hinweis = K.zug.aktion ? "Deine Aktion ist verbraucht." : K.zug.bonus ? "Deine Bonusaktion ist verbraucht." : "Bewegen kannst du dich nebenbei – das musst du nicht eintragen.";
    var ez = el("div", { "class": "zeile" });
    ez.appendChild(el("button", { type: "button", text: "Zug beenden", onclick: endeZug }));
    ez.appendChild(el("span", { "class": "klein", text: hinweis }));
    s.appendChild(ez);
  }

  function endAuswertung() {
    var box = el("div");
    box.appendChild(el("h3", { text: "Auswertung" }));
    var t = "<div class='tabelle-wrap'><table class='endtabelle'><tr><th>Held</th><th>Würfe</th><th>Natürliche 20</th><th>Schaden ausgeteilt</th><th>Schaden eingesteckt</th><th>Geheilt</th></tr>";
    G.helden.forEach(function (h) {
      t += "<tr><td><b>" + h.name + "</b>" + (h.spieler ? " (" + h.spieler + ")" : "") + (h.tot ? " †" : "") + "</td><td>" + h.st.wuerfe + "</td><td>" + h.st.krit + "</td><td>" + h.st.schaden + "</td><td>" + h.st.eingesteckt + "</td><td>" + h.st.geheilt + "</td></tr>";
    });
    t += "</table></div>";
    box.appendChild(el("div", { html: t }));
    var best = G.helden.slice().sort(function (a, b) { return b.st.schaden - a.st.schaden; })[0];
    if (best && best.st.schaden > 0) box.appendChild(el("p", { html: "Am meisten Schaden: <b>" + best.name + "</b>. Glückspilz mit den meisten natürlichen 20ern: <b>" + G.helden.slice().sort(function (a, b) { return b.st.krit - a.st.krit; })[0].name + "</b>." }));
    return box;
  }

  /* ======================================================
     Setup
     ====================================================== */
  var VORAUSWAHL = [["Spieler 1", "v:brena"], ["Spieler 2", "v:fips"], ["Spieler 3", "v:aldric"], ["Spieler 4", "v:liora"]];

  function heldOptionen(select, wert) {
    var g1 = el("optgroup", { label: "Fertige Helden" });
    Object.keys(DATEN.vorlagen).forEach(function (k) {
      var v = DATEN.vorlagen[k];
      g1.appendChild(el("option", { value: "v:" + k, text: v.name + " (" + DATEN.klassen[v.klasse].name + ")" }));
    });
    select.appendChild(g1);
    var eigene = DND.laden("charaktere", {});
    var namen = Object.keys(eigene);
    if (namen.length) {
      var g2 = el("optgroup", { label: "Eigene Helden" });
      namen.sort().forEach(function (n) {
        var c = eigene[n];
        g2.appendChild(el("option", { value: "c:" + n, text: n + " (" + (DATEN.klassen[c.klasse] ? DATEN.klassen[c.klasse].name : "?") + ")" }));
      });
      select.appendChild(g2);
    }
    if (wert) select.value = wert;
  }

  function spielerZeile(name, held) {
    var liste = $("spieler-liste");
    var z = el("div", { "class": "spieler-zeile" });
    z.appendChild(el("span", { "class": "nr" }));
    z.appendChild(el("input", { type: "text", value: name || "", placeholder: "Name", "aria-label": "Spielername" }));
    z.appendChild(document.createTextNode(" spielt "));
    var sel = el("select", { "aria-label": "Held" });
    heldOptionen(sel, held);
    z.appendChild(sel);
    z.appendChild(el("button", { type: "button", "class": "klein-k", text: "×", title: "Entfernen", onclick: function () { z.remove(); nummern(); } }));
    liste.appendChild(z);
    nummern();
  }
  function nummern() {
    document.querySelectorAll("#spieler-liste .spieler-zeile").forEach(function (z, i) { z.querySelector(".nr").textContent = (i + 1) + "."; });
  }

  function zumSetup(neu) {
    if (neu) { G = null; DND.speichern("spiel", null); }
    UI = { frage: null, zielwahl: null, wer: null, sperre: false };
    $("spiel").classList.add("versteckt");
    $("setup").classList.remove("versteckt");
    $("fortsetzen").classList.toggle("versteckt", !DND.laden("spiel", null));
    window.scrollTo(0, 0);
  }

  function zeigeSpiel() {
    $("setup").classList.add("versteckt");
    $("spiel").classList.remove("versteckt");
    var p = $("protokoll");
    p.innerHTML = "";
    G.log.forEach(function (l) { p.appendChild(el("p", { "class": l[0], text: l[1] })); });
    p.scrollTop = p.scrollHeight;
    render();
    // Wenn beim Laden ein Gegner dran war, weitermachen
    if (G.kampf) {
      var e = G.kampf.ordnung[G.kampf.pos];
      if (e && e.t === "g") {
        setTimeout(function () { gegnerZug(e.i, function () { sichern(); naechsterZug(); }); }, window.__schnell ? 5 : 600);
      } else if (!G.kampf.zug) {
        naechsterZug();
      }
    }
  }

  $("spieler-dazu").addEventListener("click", function () {
    var n = document.querySelectorAll("#spieler-liste .spieler-zeile").length;
    if (n >= 6) { this.textContent = "Mehr als 6 Helden geht nicht"; return; }
    spielerZeile("Spieler " + (n + 1), "v:brena");
  });

  $("start").addEventListener("click", function () {
    var zeilen = document.querySelectorAll("#spieler-liste .spieler-zeile");
    if (!zeilen.length) { spielerZeile("Spieler 1", "v:brena"); return; }
    var eigene = DND.laden("charaktere", {});
    var helden = [];
    var namen = {};
    zeilen.forEach(function (z) {
      var wert = z.querySelector("select").value;
      var spieler = z.querySelector("input").value.trim();
      var c = wert.indexOf("v:") === 0 ? DATEN.vorlagen[wert.slice(2)] : eigene[wert.slice(2)];
      if (!c) return;
      var h = heldAus(c, spieler);
      if (namen[h.name]) { namen[h.name]++; h.name = h.name + " " + namen[h.name]; } else namen[h.name] = 1;
      helden.push(h);
    });
    G = {
      version: 1, helden: helden, aktiv: 0, knoten: "s1", flags: {}, benutzt: {}, besucht: {}, traenke: 0,
      manuell: document.querySelector("input[name=wuerfelart]:checked").value === "manuell",
      leicht: document.querySelector("input[name=schwierigkeit]:checked").value === "leicht",
      log: [], ergebnis: "", ersterBlick: true, kampf: null
    };
    UI = { frage: null, zielwahl: null, wer: null, sperre: false };
    zeigeSpiel();
    log("Das Abenteuer beginnt! Helden: " + helden.map(function (h) { return h.name + (h.spieler ? " (" + h.spieler + ")" : ""); }).join(", "), "info");
    geheZu("s1");
  });

  $("fortsetzen").addEventListener("click", function () {
    var s = DND.laden("spiel", null);
    if (!s || !s.helden) return;
    G = s;
    UI = { frage: null, zielwahl: null, wer: null, sperre: false };
    zeigeSpiel();
  });

  var beendenBereit = false;
  $("beenden").addEventListener("click", function () {
    var k = this;
    if (!beendenBereit) {
      beendenBereit = true;
      k.textContent = "Wirklich beenden? (Spielstand wird gelöscht)";
      setTimeout(function () { beendenBereit = false; k.textContent = "Spiel beenden"; }, 3000);
      return;
    }
    beendenBereit = false;
    k.textContent = "Spiel beenden";
    zumSetup(true);
  });

  VORAUSWAHL.forEach(function (v) { spielerZeile(v[0], v[1]); });
  $("fortsetzen").classList.toggle("versteckt", !DND.laden("spiel", null));

  // für automatische Tests
  window.__spiel = function () { return { G: G, UI: UI }; };
})();
