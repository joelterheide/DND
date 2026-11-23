/* ==========================================================
   Die Würfelrunde – Anleitung (Lektionen + Übungen)
   ========================================================== */
(function () {
  "use strict";
  var el = DND.el;

  /* ======================================================
     Lektionen anzeigen, Inhaltsverzeichnis, Fortschritt
     ====================================================== */
  var sektionen = Array.prototype.slice.call(document.querySelectorAll(".lektion"));
  var liste = document.querySelector("#inhalt-liste ol");
  var inhaltBox = document.getElementById("inhalt-liste");
  var balken = document.getElementById("fortschritt");
  var gelesen = DND.laden("gelesen", []);
  var aktuell = 0;
  var links = [];

  sektionen.forEach(function (s, i) {
    var a = el("a", { href: "#" + s.id, text: s.getAttribute("data-titel") });
    a.addEventListener("click", function () { inhaltBox.classList.remove("offen"); });
    links.push(a);
    liste.appendChild(el("li", null, [a]));
    balken.appendChild(el("span"));

    var nav = el("div", { "class": "lektion-nav" });
    if (i > 0) {
      nav.appendChild(el("button", { type: "button", text: "« Zurück", onclick: function () { geheZu(i - 1); } }));
    } else {
      nav.appendChild(el("span"));
    }
    if (i < sektionen.length - 1) {
      nav.appendChild(el("button", {
        type: "button", "class": "dunkel",
        text: "Weiter: " + sektionen[i + 1].getAttribute("data-titel") + " »",
        onclick: function () { markiere(i); geheZu(i + 1); }
      }));
    } else {
      nav.appendChild(el("button", {
        type: "button", "class": "dunkel", text: "Fertig ✓",
        onclick: function () { markiere(i); zeichneFortschritt(); }
      }));
    }
    s.appendChild(nav);
  });

  inhaltBox.querySelector("h4").addEventListener("click", function () {
    inhaltBox.classList.toggle("offen");
  });

  function markiere(i) {
    var id = sektionen[i].id;
    if (gelesen.indexOf(id) === -1) {
      gelesen.push(id);
      DND.speichern("gelesen", gelesen);
    }
  }

  function zeichneFortschritt() {
    var teile = balken.children;
    sektionen.forEach(function (s, i) {
      var g = gelesen.indexOf(s.id) !== -1;
      links[i].classList.toggle("gelesen", g);
      links[i].classList.toggle("jetzt", i === aktuell);
      teile[i].className = i === aktuell ? "jetzt" : (g ? "voll" : "");
    });
  }

  function zeige(i) {
    aktuell = Math.max(0, Math.min(sektionen.length - 1, i));
    sektionen.forEach(function (s, j) { s.classList.toggle("sichtbar", j === aktuell); });
    zeichneFortschritt();
  }

  function geheZu(i) {
    if (location.hash !== "#" + sektionen[i].id) {
      location.hash = sektionen[i].id; // löst hashchange aus
    } else {
      zeige(i);
    }
    document.querySelector(".anleitung-layout").scrollIntoView();
  }

  function ausHash() {
    var id = location.hash.replace("#", "");
    for (var i = 0; i < sektionen.length; i++) {
      if (sektionen[i].id === id) return i;
    }
    return -1;
  }

  window.addEventListener("hashchange", function () {
    var i = ausHash();
    if (i >= 0) zeige(i);
  });

  (function start() {
    var i = ausHash();
    if (i < 0) {
      // erste ungelesene Lektion
      i = 0;
      for (var j = 0; j < sektionen.length; j++) {
        if (gelesen.indexOf(sektionen[j].id) === -1) { i = j; break; }
      }
    }
    zeige(i);
  })();

  var reset = document.getElementById("fortschritt-reset");
  if (reset) reset.addEventListener("click", function () {
    gelesen = [];
    DND.speichern("gelesen", gelesen);
    geheZu(0);
  });

  /* ======================================================
     Lektion 2: Würfel-Galerie
     ====================================================== */
  var galerie = document.getElementById("wuerfel-galerie");
  if (galerie) {
    [4, 6, 8, 10, 12, 20, 100].forEach(function (s) {
      var name = s === 100 ? "W%" : "W" + s;
      var b = el("button", { type: "button", "class": "wuerfelknopf", title: name + " würfeln" });
      b.innerHTML = DND.wuerfelSVG(s, 40);
      var lbl = el("span", { text: name });
      b.appendChild(lbl);
      b.addEventListener("click", function () {
        var w = DND.zufall(s);
        b.querySelector("svg").outerHTML = DND.wuerfelSVG(s, 40, String(w), "#8a1c1c");
        lbl.textContent = name + ": " + w;
        DND.wackeln(b.querySelector("svg"));
      });
      galerie.appendChild(b);
    });
  }

  /* ======================================================
     Kleine Trainer (Lektion 3 und 4)
     ====================================================== */
  function mischen(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = DND.zufall(i + 1) - 1;
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function trainer(wurzel, neueAufgabe) {
    if (!wurzel) return;
    var aufgabe = wurzel.querySelector(".aufgabe");
    var antworten = wurzel.querySelector(".antworten");
    var rueck = wurzel.querySelector(".rueckmeldung");
    var punkte = wurzel.querySelector(".punkte");
    var richtig = 0, gesamt = 0;

    function runde() {
      var a = neueAufgabe();
      aufgabe.innerHTML = a.frage;
      rueck.textContent = "";
      antworten.innerHTML = "";
      var fertig = false;
      a.optionen.forEach(function (o) {
        var b = el("button", { type: "button", text: o.text });
        b.addEventListener("click", function () {
          if (fertig) return;
          fertig = true;
          gesamt++;
          if (o.ok) {
            richtig++;
            b.style.background = "#0b6b1f"; b.style.color = "#fff";
            rueck.innerHTML = "Richtig! " + a.erklaerung;
            rueck.style.color = "#0b6b1f";
          } else {
            b.style.background = "#8a1c1c"; b.style.color = "#fff";
            rueck.innerHTML = "Leider nicht. " + a.erklaerung;
            rueck.style.color = "#8a1c1c";
          }
          punkte.textContent = richtig + " von " + gesamt + " richtig";
        });
        antworten.appendChild(b);
      });
    }
    wurzel.querySelector(".weiter-knopf").addEventListener("click", runde);
    runde();
  }

  // Lektion 3: Modifikator
  trainer(document.getElementById("mod-trainer"), function () {
    var wert = DND.zufall(16) + 2; // 3–18
    var m = DND.mod(wert);
    var kandidaten = [m - 2, m - 1, m + 1, m + 2].filter(function (x) { return x >= -5 && x <= 5; });
    mischen(kandidaten);
    var opts = [{ text: DND.vz(m), ok: true }];
    kandidaten.slice(0, 3).forEach(function (x) { opts.push({ text: DND.vz(x), ok: false }); });
    return {
      frage: "Dein Charakter hat einen Wert von <b>" + wert + "</b>. Welcher Modifikator gehört dazu?",
      optionen: mischen(opts),
      erklaerung: "(" + wert + " − 10) ÷ 2 = " + String((wert - 10) / 2).replace(".", ",") +
        ((wert - 10) % 2 !== 0 ? ", abgerundet " : " → ") + DND.vz(m)
    };
  });

  // Lektion 4: Fertigkeit → Attribut
  trainer(document.getElementById("fert-trainer"), function () {
    var f = DND.zufallAus(DATEN.fertigkeiten);
    var att = DATEN.attribute.filter(function (a) { return a.id === f.att; })[0];
    return {
      frage: "Zu welchem Attribut gehört <b>" + f.name + "</b>?",
      optionen: DATEN.attribute.map(function (a) { return { text: a.name, ok: a.id === f.att }; }),
      erklaerung: f.name + " gehört zu " + att.name + " – z.&nbsp;B. " + f.bsp + "."
    };
  });

  /* ======================================================
     Lektion 5: Proben-Simulator
     ====================================================== */
  var SITUATIONEN = [
    { name: "Nasse Mauer hochklettern", fert: "athletik", sg: 15,
      gut: "Du ziehst dich über die Kante – oben!", schlecht: "Auf halber Höhe rutschst du ab und landest im Matsch." },
    { name: "Am Wachposten vorbeischleichen", fert: "heimlichkeit", sg: 13,
      gut: "Du huschst im Schatten vorbei. Die Wache gähnt nur.", schlecht: "KNACK – ein Ast. „Wer da?!“" },
    { name: "Den Wirt anlügen: „Wir sind Stammgäste!“", fert: "taeuschen", sg: 12,
      gut: "„Ach ja, jetzt erinnere ich mich!“ Das Bier geht aufs Haus.", schlecht: "Der Wirt verschränkt die Arme: „Euch hab ich hier noch nie gesehen.“" },
    { name: "Eine Falle im Gang entdecken", fert: "wahrnehmung", sg: 14,
      gut: "Du siehst den feinen Draht knapp über dem Boden.", schlecht: "Nichts Besonderes zu sehen … bis es klick macht." },
    { name: "Eine alte Zauberrune deuten", fert: "arkane", sg: 16,
      gut: "Die Rune bedeutet „Schutz“ – und sie ist noch aktiv!", schlecht: "Für dich sieht das aus wie verschnörkeltes Gekritzel." },
    { name: "Einen Verletzten verarzten", fert: "heilkunde", sg: 10,
      gut: "Die Blutung hört auf. Er wird es schaffen.", schlecht: "Er stöhnt laut. Das war eher nicht so gut." },
    { name: "Herausfinden, ob der Händler lügt", fert: "motiv", sg: 13,
      gut: "Seine Augen zucken immer wieder zur Tür – er verheimlicht etwas.", schlecht: "Er wirkt völlig ehrlich. Oder doch nicht?" }
  ];

  function fertBonus(held, fertId) {
    var f = DATEN.fertigkeiten.filter(function (x) { return x.id === fertId; })[0];
    var att = DATEN.attribute.filter(function (a) { return a.id === f.att; })[0];
    var m = DND.mod(held.att[f.att]);
    var stufe = held.fert[fertId] || 0;
    var ueb = stufe * DATEN.uebung(held.stufe || 1);
    var erkl = att.kurz + " " + DND.vz(m) +
      (stufe === 2 ? ", Expertise +" + ueb : stufe === 1 ? ", geübt +" + ueb : ", nicht geübt");
    return { bonus: m + ueb, erkl: erkl, name: f.name };
  }

  var sim = document.getElementById("proben-sim");
  if (sim) {
    var heldWahl = sim.querySelector(".held");
    var sitWahl = sim.querySelector(".situation");
    var simAus = sim.querySelector(".ausgabe");
    Object.keys(DATEN.vorlagen).forEach(function (k) {
      var v = DATEN.vorlagen[k];
      heldWahl.appendChild(el("option", { value: k, text: v.name + " (" + DATEN.klassen[v.klasse].name + ")" }));
    });
    SITUATIONEN.forEach(function (s, i) {
      sitWahl.appendChild(el("option", { value: String(i), text: s.name }));
    });
    sim.querySelector(".wurf-knopf").addEventListener("click", function () {
      var held = DATEN.vorlagen[heldWahl.value];
      var sit = SITUATIONEN[parseInt(sitWahl.value, 10)];
      var fb = fertBonus(held, sit.fert);
      var r = DND.w20(fb.bonus);
      var ok = r.summe >= sit.sg;
      simAus.innerHTML = "";
      var zeilen = [
        ["info", held.name + " versucht: " + sit.name],
        ["", "Der SL sagt: „Mach eine Probe auf " + fb.name + ".“"],
        ["", "Bonus: " + fb.erkl + " → " + DND.vz(fb.bonus)],
        ["", "W20: " + r.text + " = " + r.summe + (r.natur === 20 ? "  (natürliche 20!)" : r.natur === 1 ? "  (natürliche 1 …)" : "")],
        ["", "Der SL hatte heimlich SG " + sit.sg + " festgelegt."],
        [ok ? "gut" : "schlecht", r.summe + (ok ? " ≥ " : " < ") + sit.sg + " → " + (ok ? "Geschafft! " + sit.gut : "Nicht geschafft. " + sit.schlecht)]
      ];
      zeilen.forEach(function (z) { simAus.appendChild(el("p", { "class": z[0], text: z[1] })); });
    });
  }

  /* ======================================================
     Lektion 6: Vorteil / Nachteil
     ====================================================== */
  var vd = document.getElementById("vorteil-demo");
  if (vd) {
    var anzeige = vd.querySelector(".wuerfel-anzeige");
    var vdAus = vd.querySelector(".ausgabe");
    vd.querySelectorAll("button[data-modus]").forEach(function (b) {
      b.addEventListener("click", function () {
        var modus = b.getAttribute("data-modus");
        var r = DND.w20(0, modus);
        anzeige.innerHTML = "";
        if (r.b === null) {
          anzeige.innerHTML = DND.wuerfelSVG(20, 64, String(r.a), "#8a1c1c");
          vdAus.textContent = "Ergebnis: " + r.a;
        } else {
          var erster = (modus === "v" ? r.a >= r.b : r.a <= r.b);
          anzeige.innerHTML = DND.wuerfelSVG(20, 64, String(r.a), erster ? "#8a1c1c" : "#aaa") +
            DND.wuerfelSVG(20, 64, String(r.b), erster ? "#aaa" : "#8a1c1c");
          vdAus.textContent = (modus === "v" ? "Vorteil: der höhere zählt → " : "Nachteil: der niedrigere zählt → ") + r.natur;
        }
        anzeige.querySelectorAll("svg").forEach(DND.wackeln);
      });
    });
    vd.querySelector(".statistik-knopf").addEventListener("click", function () {
      var modi = [["", "Normal"], ["v", "Vorteil"], ["n", "Nachteil"]];
      var html = "<div class='tabelle-wrap'><table><tr><th>Art</th><th>Durchschnitt</th><th>Wie oft 15 oder mehr?</th></tr>";
      modi.forEach(function (m) {
        var summe = 0, hoch = 0;
        for (var i = 0; i < 1000; i++) {
          var r = DND.w20(0, m[0]);
          summe += r.natur;
          if (r.natur >= 15) hoch++;
        }
        html += "<tr><td>" + m[1] + "</td><td>" + (summe / 1000).toFixed(1).replace(".", ",") +
          "</td><td>" + Math.round(hoch / 10) + " %</td></tr>";
      });
      html += "</table></div><p class='klein'>Vorteil ist also ungefähr so viel wert wie +3 bis +5 auf den Wurf.</p>";
      vd.querySelector(".statistik").innerHTML = html;
    });
  }

  /* ======================================================
     Lektion 9: Mini-Kampf gegen einen Goblin
     ====================================================== */
  function kritFormel(formel) {
    return DND.zerlege(formel).map(function (t, i) {
      var zeichen = (t.vz === -1 || t.wert < 0) ? "-" : (i ? "+" : "");
      return t.typ === "w" ? zeichen + (t.n * 2) + "W" + t.seiten : zeichen + Math.abs(t.wert);
    }).join("");
  }

  var mk = document.getElementById("mini-kampf");
  if (mk) {
    var HELDEN = {
      brena: { name: "Brena", tpMax: 12, rk: 18, ini: 1, waffe: "Langschwert", bonus: 5, schaden: "1W8+3" },
      liora: { name: "Liora", tpMax: 7, rk: 12, ini: 2, waffe: "Feuerpfeil", bonus: 5, schaden: "1W10" }
    };
    var log = mk.querySelector(".kampflog");
    var felder = mk.querySelector(".kampf-felder");
    var heldBox = mk.querySelector(".held-box");
    var gegnerBox = mk.querySelector(".gegner-box");
    var aktionen = mk.querySelector(".aktionen");
    var S = null; // Zustand

    function schreib(text, art) {
      log.appendChild(el("p", { "class": art || "", text: text }));
      log.scrollTop = log.scrollHeight;
    }

    function balkenHTML(tp, max, gegner) {
      var p = Math.max(0, Math.round(tp / max * 100));
      return '<span class="balken' + (gegner ? " gegner" : "") + '"><i style="width:' + p + '%"></i></span> ' + Math.max(0, tp) + " / " + max + " TP";
    }

    function zeichne() {
      var h = S.held;
      var extra = S.typ === "brena"
        ? "Zweiter Atem: " + S.atem + "× übrig"
        : "Zauberplätze: " + S.plaetze + " von 2";
      heldBox.innerHTML = "<h4>" + h.name + "</h4>" + balkenHTML(S.tp, h.tpMax) +
        "<br>RK " + h.rk + " · " + h.waffe + " +" + h.bonus + " (" + h.schaden + ")<br><span class='klein'>" + extra +
        (S.ausweichen ? " · weicht aus" : "") + "</span>";
      gegnerBox.innerHTML = "<h4>Goblin</h4>" + balkenHTML(S.gtp, 7, true) +
        "<br>RK 15 · Krummsäbel +4 (1W6+2)";
      aktionen.querySelectorAll("button").forEach(function (b) {
        var aus = S.vorbei || S.dran !== "held";
        if (b.getAttribute("data-a") === "atem") aus = aus || S.bonusWeg || S.atem < 1 || S.tp >= h.tpMax;
        if (b.getAttribute("data-a") === "geschoss") aus = aus || S.plaetze < 1;
        b.disabled = aus;
      });
    }

    function knopf(text, a, fn, dunkel) {
      var b = el("button", { type: "button", text: text, "data-a": a });
      if (dunkel) b.className = "dunkel";
      b.addEventListener("click", fn);
      aktionen.appendChild(b);
    }

    function starte() {
      var typ = mk.querySelector(".held-wahl").value;
      var h = HELDEN[typ];
      S = { typ: typ, held: h, tp: h.tpMax, gtp: 7, atem: 2, plaetze: 2, ausweichen: false,
        bonusWeg: false, vorbei: false, dran: null, runde: 1, reihenfolge: [], idx: 0 };
      log.innerHTML = "";
      felder.classList.remove("versteckt");
      aktionen.classList.remove("versteckt");
      aktionen.innerHTML = "";
      knopf("Angreifen (" + h.waffe + ")", "angriff", heldAngriff, true);
      if (typ === "liora") knopf("Magisches Geschoss", "geschoss", geschoss);
      knopf("Ausweichen", "ausweichen", ausweichen);
      if (typ === "brena") knopf("Zweiter Atem (Bonusaktion)", "atem", zweiterAtem);

      var ih = DND.w20(h.ini), ig = DND.w20(2);
      schreib("Initiative! Alle würfeln W20 + GES-Modifikator.", "info");
      schreib(h.name + ": " + ih.text + " = " + ih.summe + "   |   Goblin: " + ig.text + " = " + ig.summe);
      if (ih.summe >= ig.summe) {
        S.reihenfolge = ["held", "gob"];
        schreib(h.name + " ist zuerst dran" + (ih.summe === ig.summe ? " (bei Gleichstand gewinnt hier der Held)." : "."));
      } else {
        S.reihenfolge = ["gob", "held"];
        schreib("Der Goblin ist schneller!");
      }
      schreib("— Runde 1 —", "info");
      S.idx = -1;
      naechster();
    }

    function naechster() {
      if (S.vorbei) return;
      S.idx++;
      if (S.idx > 1) {
        S.idx = 0;
        S.runde++;
        schreib("— Runde " + S.runde + " —", "info");
      }
      if (S.reihenfolge[S.idx] === "held") {
        S.dran = "held";
        S.ausweichen = false;
        S.bonusWeg = false;
        schreib("Du bist dran. Was tust du?");
        zeichne();
      } else {
        S.dran = "gob";
        zeichne();
        setTimeout(goblinZug, 700);
      }
    }

    function schaden(formel, krit) {
      var f = krit ? kritFormel(formel) : formel;
      var r = DND.wuerfle(f);
      return { f: f, r: r };
    }

    function heldAngriff() {
      var h = S.held;
      var r = DND.w20(h.bonus);
      var art = S.typ === "liora" ? "Du schleuderst einen Feuerpfeil" : "Du schlägst mit dem Langschwert zu";
      schreib(art + ": W20 " + r.text + " = " + r.summe + " gegen RK 15");
      if (r.natur === 1) {
        schreib("Natürliche 1 – daneben, egal wie hoch der Bonus ist.", "schlecht");
      } else if (r.natur === 20 || r.summe >= 15) {
        var krit = r.natur === 20;
        var s = schaden(h.schaden, krit);
        schreib((krit ? "KRITISCHER TREFFER! Schadenswürfel doppelt: " : "Treffer! Schaden: ") + s.f + " = " + s.r.text + " = " + s.r.summe, "gut");
        S.gtp -= s.r.summe;
        if (pruefeSieg()) return;
      } else {
        schreib(r.summe + " ist kleiner als 15 – der Goblin weicht aus.", "schlecht");
      }
      zugEnde();
    }

    function geschoss() {
      if (S.plaetze < 1) return;
      S.plaetze--;
      var gesamt = 0, teile = [];
      for (var i = 0; i < 3; i++) {
        var r = DND.wuerfle("1W4+1");
        gesamt += r.summe;
        teile.push(r.summe);
      }
      schreib("Du wirkst Magisches Geschoss (1 Zauberplatz). Drei leuchtende Pfeile treffen automatisch: " + teile.join(" + ") + " = " + gesamt + " Schaden.", "gut");
      S.gtp -= gesamt;
      if (pruefeSieg()) return;
      zugEnde();
    }

    function ausweichen() {
      S.ausweichen = true;
      schreib("Du gehst in Deckung (Ausweichen). Bis zu deinem nächsten Zug hat der Goblin Nachteil.");
      zugEnde();
    }

    function zweiterAtem() {
      if (S.atem < 1 || S.bonusWeg) return;
      S.atem--;
      S.bonusWeg = true;
      var r = DND.wuerfle("1W10+1");
      var vorher = S.tp;
      S.tp = Math.min(S.held.tpMax, S.tp + r.summe);
      schreib("Bonusaktion – Zweiter Atem: 1W10+1 = " + r.text + " = " + r.summe + ". Du heilst " + (S.tp - vorher) + " TP. Deine Aktion hast du noch!", "gut");
      zeichne();
    }

    function pruefeSieg() {
      if (S.gtp <= 0) {
        S.gtp = 0;
        S.vorbei = true;
        schreib("Der Goblin geht zu Boden! Du hast deinen ersten Kampf gewonnen!", "gut");
        schreib(S.typ === "brena" ? "Tipp: Probier es auch mal mit Liora – sie hat viel weniger TP." : "Stark! Mit nur 7 TP ist Liora echt zerbrechlich – gut gemacht.", "info");
        zeichne();
        return true;
      }
      zeichne();
      return false;
    }

    function zugEnde() {
      S.dran = null;
      zeichne();
      naechster();
    }

    function goblinZug() {
      if (S.vorbei) return;
      var h = S.held;
      var r = DND.w20(4, S.ausweichen ? "n" : "");
      schreib("Der Goblin greift mit dem Krummsäbel an" + (S.ausweichen ? " (mit Nachteil)" : "") + ": W20 " + r.text + " = " + r.summe + " gegen deine RK " + h.rk);
      var trifft = r.natur !== 1 && (r.natur === 20 || r.summe >= h.rk);
      if (trifft && S.typ === "liora" && r.natur !== 20 && S.plaetze > 0 && r.summe < h.rk + 5) {
        S.plaetze--;
        schreib("Reaktion: Liora wirkt Schild (1 Zauberplatz)! Ihre RK ist jetzt " + (h.rk + 5) + " – der Säbel prallt an einer unsichtbaren Wand ab.", "gut");
        trifft = false;
      } else if (r.natur === 1) {
        schreib("Natürliche 1 – der Goblin stolpert über seine eigenen Füße.", "gut");
      } else if (!trifft) {
        schreib("Daneben!", "gut");
      }
      if (trifft) {
        var krit = r.natur === 20;
        var s = schaden("1W6+2", krit);
        S.tp -= s.r.summe;
        schreib((krit ? "Kritischer Treffer! " : "Getroffen! ") + "Schaden: " + s.f + " = " + s.r.text + " = " + s.r.summe, "schlecht");
        if (S.tp <= 0) {
          S.tp = 0;
          S.vorbei = true;
          schreib("Du fällst auf 0 TP und wirst bewusstlos. In einem echten Spiel würdest du jetzt Todesrettungswürfe machen (nächste Lektion) – und hoffen, dass dich jemand heilt.", "schlecht");
          zeichne();
          return;
        }
      }
      zeichne();
      naechster();
    }

    mk.querySelector(".start-knopf").addEventListener("click", function () {
      this.textContent = "Neuer Kampf";
      starte();
    });
  }

  /* ======================================================
     Lektion 10: Todesrettungswürfe
     ====================================================== */
  var ts = document.getElementById("todes-sim");
  if (ts) {
    var T = { e: 0, m: 0, vorbei: false };
    var tsAus = ts.querySelector(".ausgabe");
    var tsKnopf = ts.querySelector(".wurf-knopf");
    function kaestchen(n) {
      var s = "";
      for (var i = 0; i < 3; i++) s += i < n ? "☒" : "☐";
      return s;
    }
    function zeichneT() {
      ts.querySelector(".erfolge").textContent = kaestchen(T.e);
      ts.querySelector(".misserfolge").textContent = kaestchen(T.m);
      tsKnopf.disabled = T.vorbei;
    }
    function zeile(t, art) {
      tsAus.appendChild(el("p", { "class": art || "", text: t }));
      tsAus.scrollTop = tsAus.scrollHeight;
    }
    tsKnopf.addEventListener("click", function () {
      if (T.vorbei) return;
      var w = DND.zufall(20);
      if (w === 20) {
        zeile("[20] – NATÜRLICHE 20! Du schlägst die Augen auf und stehst mit 1 TP wieder auf!", "gut");
        T.vorbei = true;
      } else if (w === 1) {
        T.m = Math.min(3, T.m + 2);
        zeile("[1] – Natürliche 1. Das zählt als zwei Misserfolge!", "schlecht");
      } else if (w >= 10) {
        T.e++;
        zeile("[" + w + "] – 10 oder mehr: ein Erfolg.", "gut");
      } else {
        T.m++;
        zeile("[" + w + "] – unter 10: ein Misserfolg.", "schlecht");
      }
      if (!T.vorbei && T.e >= 3) {
        zeile("Drei Erfolge – du bist stabil. Du bleibst bewusstlos, aber du stirbst nicht.", "info");
        T.vorbei = true;
      }
      if (!T.vorbei && T.m >= 3) {
        zeile("Drei Misserfolge … dein Charakter ist gestorben. Zum Glück war das nur eine Übung.", "schlecht");
        T.vorbei = true;
      }
      zeichneT();
    });
    ts.querySelector(".neu-knopf").addEventListener("click", function () {
      T = { e: 0, m: 0, vorbei: false };
      tsAus.innerHTML = '<p class="info">Dein Zug beginnt …</p>';
      zeichneT();
    });
    zeichneT();
  }
})();
