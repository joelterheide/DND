/* ==========================================================
   Die Würfelrunde – Spielleiter-Werkzeuge
   ========================================================== */
(function () {
  "use strict";
  var el = DND.el;
  function $(id) { return document.getElementById(id); }

  /* ======================================================
     Initiative-Liste
     ====================================================== */
  var I = DND.laden("initiative", { liste: [], dran: null, runde: 1, naechsteId: 1 });

  function sichern() { DND.speichern("initiative", I); }

  function sortiert() {
    return I.liste.slice().sort(function (a, b) {
      return (b.ini - a.ini) || (b.bonus - a.bonus) || (a.id - b.id);
    });
  }

  function hinzufuegen(e) {
    var ini = e.ini;
    if (ini === null || ini === undefined || isNaN(ini)) ini = DND.w20(e.bonus || 0).summe;
    I.liste.push({
      id: I.naechsteId++, name: e.name, ini: ini, bonus: e.bonus || 0,
      tp: e.tp, tpMax: e.tp, rk: e.rk, monster: !!e.monster
    });
    sichern();
    zeichne();
  }

  function nummerierterName(basis) {
    var n = I.liste.filter(function (x) { return x.name === basis || x.name.indexOf(basis + " ") === 0; }).length;
    return n ? basis + " " + (n + 1) : basis;
  }

  function zeichne() {
    var box = $("i-liste");
    box.innerHTML = "";
    $("i-runde").textContent = I.runde;
    var liste = sortiert();
    if (!liste.length) {
      box.appendChild(el("div", { "class": "ini-leer", text: "Noch niemand in der Liste. Füge oben Helden und Monster hinzu." }));
      return;
    }
    liste.forEach(function (e) {
      var ko = e.tp !== null && e.tp !== undefined && e.tp <= 0;
      var zeile = el("div", { "class": "ini-eintrag" + (e.monster ? " monster" : "") + (I.dran === e.id ? " dran" : "") + (ko && e.monster ? " ko" : "") });
      var iniFeld = el("div", { "class": "ini", text: String(e.ini), title: "Initiative (klicken zum Ändern)" });
      iniFeld.style.cursor = "pointer";
      iniFeld.addEventListener("click", function () {
        var feld = el("input", { type: "number", value: String(e.ini), style: "width:44px;font-size:16px;text-align:center;" });
        iniFeld.replaceWith(feld);
        feld.focus();
        feld.select();
        function fertig() {
          var v = parseInt(feld.value, 10);
          if (!isNaN(v)) e.ini = v;
          sichern();
          zeichne();
        }
        feld.addEventListener("blur", fertig);
        feld.addEventListener("keydown", function (ev) { if (ev.key === "Enter") feld.blur(); });
      });
      zeile.appendChild(iniFeld);

      var mitte = el("div");
      mitte.appendChild(el("div", { "class": "nm", text: e.name + (I.dran === e.id ? "  ◄ ist dran" : "") }));
      var tpz = el("div", { "class": "tp-zeile" });
      if (e.tp !== null && e.tp !== undefined && !isNaN(e.tp)) {
        tpz.appendChild(document.createTextNode("TP " + e.tp + (e.tpMax ? "/" + e.tpMax : "") + " "));
        var menge = el("input", { type: "number", min: "0", placeholder: "±", "aria-label": "Schaden oder Heilung" });
        tpz.appendChild(menge);
        tpz.appendChild(document.createTextNode(" "));
        tpz.appendChild(el("button", {
          type: "button", "class": "klein-k", text: "−", title: "Schaden",
          onclick: function () { var v = parseInt(menge.value, 10); if (v) { e.tp = Math.max(0, e.tp - v); sichern(); zeichne(); } }
        }));
        tpz.appendChild(document.createTextNode(" "));
        tpz.appendChild(el("button", {
          type: "button", "class": "klein-k", text: "+", title: "Heilung",
          onclick: function () {
            var v = parseInt(menge.value, 10);
            if (v) { e.tp = Math.max(0, e.tp) + v; if (e.tpMax) e.tp = Math.min(e.tp, e.tpMax); sichern(); zeichne(); }
          }
        }));
        if (ko) tpz.appendChild(el("b", { "class": "rot", text: e.monster ? "  besiegt" : "  bewusstlos – Todesrettungswürfe!" }));
      }
      if (e.rk) tpz.appendChild(document.createTextNode("   RK " + e.rk));
      mitte.appendChild(tpz);
      zeile.appendChild(mitte);

      zeile.appendChild(el("button", {
        type: "button", "class": "klein-k", text: "×", title: "Entfernen",
        onclick: function () {
          if (I.dran === e.id) weiter(true);
          I.liste = I.liste.filter(function (x) { return x.id !== e.id; });
          if (!I.liste.length) I.dran = null;
          sichern();
          zeichne();
        }
      }));
      box.appendChild(zeile);
    });
  }

  function weiter(stumm) {
    var liste = sortiert();
    if (!liste.length) return;
    var pos = -1;
    for (var i = 0; i < liste.length; i++) if (liste[i].id === I.dran) pos = i;
    var neu = pos + 1;
    if (pos === -1) neu = 0;
    else if (neu >= liste.length) { neu = 0; I.runde++; }
    I.dran = liste[neu].id;
    if (!stumm) { sichern(); zeichne(); }
  }

  $("i-dazu").addEventListener("click", function () {
    var name = $("i-name").value.trim();
    if (!name) { $("i-name").focus(); return; }
    var iniWert = $("i-ini").value === "" ? null : parseInt($("i-ini").value, 10);
    hinzufuegen({
      name: name, ini: iniWert, bonus: parseInt($("i-bonus").value, 10) || 0,
      tp: $("i-tp").value === "" ? null : parseInt($("i-tp").value, 10),
      rk: parseInt($("i-rk").value, 10) || null, monster: $("i-monster").checked
    });
    $("i-name").value = ""; $("i-ini").value = ""; $("i-tp").value = ""; $("i-rk").value = "";
    $("i-name").focus();
  });
  $("i-name").addEventListener("keydown", function (e) { if (e.key === "Enter") $("i-dazu").click(); });

  function heldDazu(c) {
    hinzufuegen({ name: c.name, bonus: DND.mod(c.att.ges), tp: c.tpMax, rk: c.rk, monster: false });
  }
  $("i-helden").addEventListener("click", function () {
    Object.keys(DATEN.vorlagen).forEach(function (k) { heldDazu(DATEN.vorlagen[k]); });
  });
  $("i-gespeicherte").addEventListener("click", function () {
    var alle = DND.laden("charaktere", {});
    var namen = Object.keys(alle);
    if (!namen.length) {
      this.textContent = "Keine gespeichert – erst im Charakterbogen speichern";
      return;
    }
    namen.forEach(function (n) { heldDazu(alle[n]); });
  });
  $("i-weiter").addEventListener("click", function () { weiter(false); });
  $("i-start").addEventListener("click", function () { I.dran = null; I.runde = 1; sichern(); zeichne(); });
  $("i-monster-weg").addEventListener("click", function () {
    I.liste = I.liste.filter(function (x) { return !(x.monster && x.tp !== null && x.tp <= 0); });
    if (!I.liste.some(function (x) { return x.id === I.dran; })) I.dran = null;
    sichern(); zeichne();
  });
  var leerBereit = false;
  $("i-leeren").addEventListener("click", function () {
    var k = this;
    if (!leerBereit) {
      leerBereit = true;
      k.textContent = "Wirklich alles löschen?";
      setTimeout(function () { leerBereit = false; k.textContent = "Liste leeren"; }, 3000);
      return;
    }
    leerBereit = false;
    k.textContent = "Liste leeren";
    I = { liste: [], dran: null, runde: 1, naechsteId: 1 };
    sichern(); zeichne();
  });

  zeichne();

  /* ======================================================
     Monster
     ====================================================== */
  var karten = $("monster-karten");
  DATEN.monster.forEach(function (m) {
    var k = el("div", { "class": "monster" });
    k.innerHTML =
      "<h4>" + m.name + "</h4>" +
      '<div class="art">' + m.art + "</div>" +
      "<p><b>RK</b> " + m.rk + " · <b>TP</b> " + m.tp + " (" + m.tpw + ") · <b>Bewegung</b> " + m.bew + "</p>" +
      '<p class="klein">' + m.att + "</p>" +
      "<p><b>Aktionen:</b></p><ul style='margin:2px 0;padding-left:18px;'>" +
      m.aktionen.map(function (a) { return "<li>" + a + "</li>"; }).join("") + "</ul>" +
      "<p>" + m.besonders + "</p>";
    var b = el("button", { type: "button", "class": "klein-k", text: "+ in die Initiative-Liste" });
    b.addEventListener("click", function () {
      var tp = m.tp;
      if ($("m-tpwurf").checked) {
        var r = DND.wuerfle(m.tpw.replace("−", "-"));
        if (r) tp = Math.max(1, r.summe);
      }
      hinzufuegen({ name: nummerierterName(m.name), bonus: m.ges, tp: tp, rk: m.rk, monster: true });
      b.textContent = "✓ hinzugefügt (" + tp + " TP)";
      setTimeout(function () { b.textContent = "+ in die Initiative-Liste"; }, 1500);
    });
    k.appendChild(b);
    karten.appendChild(k);
  });
  DND.inlineWuerfel(karten);

  /* ======================================================
     Generatoren
     ====================================================== */
  var z = DND.zufallAus;
  var NAMEN = {
    mensch: {
      vor: ["Anna", "Bernhard", "Clara", "Dietrich", "Elsa", "Friedrich", "Greta", "Hannes", "Ida", "Jorin", "Kasimir", "Lene", "Magnus", "Nele", "Otto", "Paula", "Rupert", "Selma", "Theo", "Ulla", "Veit", "Wilma"],
      nach: ["Ackermann", "Brenner", "Eichholz", "Falkner", "Graumann", "Holzer", "Kessler", "Lindner", "Mühlbach", "Rotbart", "Steinhauer", "Weber", "Ziegler", "Fuchs"]
    },
    elf: {
      vor: ["Aelar", "Caelynn", "Elandor", "Faelwen", "Galinndan", "Ilyra", "Laucian", "Mialee", "Naivara", "Quelenna", "Riardon", "Sariel", "Thamior", "Vaelis"],
      nach: ["Mondfluss", "Silberblatt", "Sternenlied", "Morgentau", "Nebelwald", "Eichenschatten", "Windflüstern"]
    },
    zwerg: {
      vor: ["Barin", "Dagna", "Eberk", "Gunnloda", "Harbek", "Ilde", "Kildrak", "Mardred", "Orsik", "Riswynn", "Tordek", "Vistra", "Brottor", "Hilga"],
      nach: ["Eisenfaust", "Felsbrecher", "Goldader", "Hammerschlag", "Steinbart", "Tiefgräber", "Kupferhelm"]
    },
    halbling: {
      vor: ["Alton", "Bree", "Cade", "Eldon", "Kithri", "Lavinia", "Merric", "Nedda", "Perrin", "Seraphina", "Wellby", "Pip", "Rosie", "Tobbe"],
      nach: ["Apfelhain", "Brombeer", "Honigtopf", "Kurzbein", "Teekessel", "Zuckerrübe", "Grasgrün"]
    },
    ork: {
      vor: ["Dench", "Feng", "Gell", "Holg", "Krusk", "Ront", "Baggi", "Emen", "Ovak", "Shautha", "Volen", "Yevelda"],
      nach: ["vom Stamm der Rostzähne", "vom Stamm des Roten Auges", "Knochenbrecher", "Schädelspalter", "vom Stamm der Eisberge", "Blutfaust"]
    }
  };

  var NSC = {
    wer: ["eine Bäckerin", "ein Schmied", "eine Stadtwache", "ein Fährmann", "eine Kräuterkundige", "ein Bettler", "eine Händlerin", "ein Priester", "eine Diebin", "ein Bauer", "eine Bardin", "ein Kopfgeldjäger", "eine Adelige", "ein Totengräber", "eine Wirtin", "ein alter Seefahrer", "eine Bibliothekarin", "ein Stallbursche"],
    eigen: ["redet von sich in der dritten Person", "kaut ständig auf irgendetwas herum", "flüstert, als würde jemand lauschen", "lacht über die eigenen Witze", "hat einen Papagei auf der Schulter", "riecht stark nach Knoblauch", "ist übertrieben höflich", "misstraut allen Elfen", "zählt ständig Münzen", "summt ununterbrochen", "trägt eine Augenklappe (braucht sie aber gar nicht)", "beantwortet jede Frage mit einer Gegenfrage", "nennt alle „Schätzchen“", "ist furchtbar abergläubisch", "erzählt ungefragt von seinen Krankheiten"],
    will: ["endlich aus diesem Kaff weg", "den verschwundenen Bruder wiederfinden", "reich werden – egal wie", "endlich respektiert werden", "Rache an einem alten Rivalen", "jemanden, der eine Botschaft überbringt", "ein Geheimnis um jeden Preis bewahren", "ein ruhiges Leben, aber das Abenteuer findet sie/ihn immer wieder"],
    geheim: ["schuldet der Diebesgilde Geld", "ist in Wahrheit ein Adeliger auf der Flucht", "hat letzte Woche jemanden bestohlen", "spioniert für den Fürsten", "kann ein bisschen zaubern und verheimlicht es", "weiß, wo ein Schatz vergraben ist", "hat panische Angst vor Hühnern", "ist eigentlich ein verwandelter Drache (vielleicht)", "war früher selbst Abenteurer"]
  };

  var TAV = {
    adj: ["schiefen", "goldenen", "tanzenden", "durstigen", "lahmen", "betrunkenen", "grünen", "letzten", "rostigen", "schlafenden", "verlorenen", "flammenden", "singenden", "dreibeinigen"],
    m: ["Keiler", "Drachen", "Kessel", "Mond", "Hammer", "Krug", "Bären", "Ochsen", "Greifen", "Zwerg"],
    f: ["Laterne", "Krone", "Gans", "Ziege", "Harfe", "Eule", "Axt"],
    n: ["Fass", "Horn", "Einhorn", "Schwert", "Huhn", "Ferkel"]
  };

  var ABENTEUER = {
    wer: ["eine verzweifelte Mutter", "der geizige Bürgermeister", "ein sterbender Ritter", "eine geheimnisvolle Frau mit Kapuze", "der Abt eines Klosters", "ein sprechender Rabe", "eine Gruppe Bauern mit Mistgabeln", "ein Händler, dessen Karawane überfallen wurde"],
    was: ["Kinder verschwinden nachts", "ein Monster frisst das Vieh", "ein wertvolles Relikt wurde gestohlen", "Untote steigen aus dem Friedhof", "eine Brücke ist eingestürzt, und auf der anderen Seite ruft jemand um Hilfe", "der Dorfbrunnen ist vergiftet", "Banditen verlangen Schutzgeld", "ein Zauberer hat sich in seinem Turm eingeschlossen, und es kommen seltsame Geräusche heraus"],
    wo: ["eine alte Zwergenmine", "ein versunkener Tempel im Moor", "eine verlassene Burgruine", "die Höhlen unter der Stadt", "ein Leuchtturm an der Küste", "ein Eisgipfel im Norden", "ein Wald, in dem es nie Tag wird", "die Kanalisation der Hauptstadt"],
    dreh: ["der Auftraggeber ist selbst der Schurke", "das „Monster“ beschützt nur seine Jungen", "die Gegner werden zu allem gezwungen", "eine andere Abenteurergruppe ist schon unterwegs", "der Schatz ist verflucht", "jemand aus dem Dorf arbeitet mit den Bösen zusammen", "dahinter steckt ein zweiter, viel gefährlicherer Feind", "die versprochene Belohnung gibt es gar nicht"]
  };

  var BEUTE = ["Heiltrank (heilt 2W4+2)", "silberner Dolch", "Schriftrolle mit einem Zauber des 1. Grades", "alte Karte mit einem roten X", "Edelstein (50 GM wert)", "Seil aus Elfenhaar (15 m, sehr leicht)", "Fläschchen Alchemistenfeuer", "Amulett, das in der Nähe von Untoten warm wird", "Laterne, die nie ausgeht", "Würfelset aus Knochen", "Brief mit einem gebrochenen Siegel", "Ring mit eingravierten Zwergenrunen", "Ein Glas mit einem leuchtenden Glühwürmchen, das nicht stirbt"];

  var GEN = {
    name: function () {
      var v = $("g-volk").value;
      if (v === "egal") v = z(Object.keys(NAMEN));
      var n = NAMEN[v];
      var volkName = { mensch: "Mensch", elf: "Elf", zwerg: "Zwerg", halbling: "Halbling", ork: "Ork" }[v];
      return "<b>" + z(n.vor) + " " + z(n.nach) + "</b> <span class='klein'>(" + volkName + ")</span>";
    },
    taverne: function () {
      var g = z(["m", "f", "n"]);
      return "<b>" + (g === "f" ? "Zur " : "Zum ") + z(TAV.adj) + " " + z(TAV[g]) + "</b>";
    },
    nsc: function () {
      var wer = z(NSC.wer);
      return "<b>" + wer.charAt(0).toUpperCase() + wer.slice(1) + "</b>.<br>" +
        "<i>Eigenart:</i> " + z(NSC.eigen) + ".<br>" +
        "<i>Will:</i> " + z(NSC.will) + ".<br>" +
        "<i>Geheimnis:</i> " + z(NSC.geheim) + ".";
    },
    abenteuer: function () {
      return "<i>Auftraggeber:</i> " + z(ABENTEUER.wer) + "<br>" +
        "<i>Problem:</i> " + z(ABENTEUER.was) + "<br>" +
        "<i>Ort:</i> " + z(ABENTEUER.wo) + "<br>" +
        "<i>Wendung:</i> " + z(ABENTEUER.dreh);
    },
    beute: function () {
      var gm = DND.wuerfle("3W6").summe;
      var sm = DND.wuerfle("2W10").summe;
      var dinge = [z(BEUTE)];
      if (DND.zufall(2) === 2) {
        var zweites = z(BEUTE);
        if (zweites !== dinge[0]) dinge.push(zweites);
      }
      return gm + " Goldmünzen, " + sm + " Silbermünzen und: <b>" + dinge.join("</b>, <b>") + "</b>";
    }
  };

  document.querySelectorAll("button[data-gen]").forEach(function (b) {
    b.addEventListener("click", function () {
      var art = b.getAttribute("data-gen");
      var aus = $("g-" + art);
      aus.innerHTML = GEN[art]();
      DND.wackeln(aus);
    });
  });

  /* ======================================================
     Zustände
     ====================================================== */
  var tab = $("zustand-tabelle");
  DATEN.zustaende.forEach(function (zz) {
    var tr = el("tr");
    tr.appendChild(el("td", null, [el("b", { text: zz[0] })]));
    tr.appendChild(el("td", { text: zz[1] }));
    tab.appendChild(tr);
  });
})();
