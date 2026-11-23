/* ==========================================================
   Die Würfelrunde – gemeinsame Funktionen für alle Seiten
   - Würfel-Engine (echter Zufall über crypto, wenn vorhanden)
   - Speichern im Browser (localStorage)
   - klickbare Würfelangaben im Text (<span class="w">1W6+2</span>)
   - Schnellwürfel unten rechts
   ========================================================== */

var DND = (function () {
  "use strict";

  /* ---------- Zufall ---------- */
  function zufall(max) {
    // Zahl von 1 bis max, ohne Verzerrung
    if (window.crypto && window.crypto.getRandomValues) {
      var arr = new Uint32Array(1);
      var grenze = Math.floor(4294967296 / max) * max;
      var x;
      do {
        window.crypto.getRandomValues(arr);
        x = arr[0];
      } while (x >= grenze);
      return (x % max) + 1;
    }
    return Math.floor(Math.random() * max) + 1;
  }

  /* ---------- Formeln wie "2W6+3", "W20-1", "1d8 + 1d6 + 2" ---------- */
  function zerlege(formel) {
    var s = String(formel || "").toLowerCase().replace(/\s+/g, "").replace(/d/g, "w");
    if (!s) return null;
    var teile = s.match(/[+\-]?[^+\-]+/g);
    if (!teile) return null;
    var aus = [];
    for (var i = 0; i < teile.length; i++) {
      var t = teile[i];
      var vz = 1;
      if (t.charAt(0) === "+") t = t.slice(1);
      else if (t.charAt(0) === "-") { vz = -1; t = t.slice(1); }
      var m = t.match(/^(\d*)w(\d+|%)$/);
      if (m) {
        var n = m[1] === "" ? 1 : parseInt(m[1], 10);
        var seiten = m[2] === "%" ? 100 : parseInt(m[2], 10);
        if (n < 1 || n > 100 || seiten < 2 || seiten > 1000) return null;
        aus.push({ typ: "w", n: n, seiten: seiten, vz: vz });
        continue;
      }
      if (/^\d+$/.test(t)) {
        aus.push({ typ: "z", wert: parseInt(t, 10) * vz });
        continue;
      }
      return null;
    }
    return aus;
  }

  function wuerfle(formel) {
    var teile = zerlege(formel);
    if (!teile) return null;
    var summe = 0;
    var texte = [];
    var nurEinW20 = teile.filter(function (t) { return t.typ === "w"; }).length === 1 &&
      teile.some(function (t) { return t.typ === "w" && t.n === 1 && t.seiten === 20; });
    var natur = null;
    teile.forEach(function (t, idx) {
      var zeichen = idx === 0 ? (t.vz === -1 || t.wert < 0 ? "−" : "") : ((t.vz === -1 || t.wert < 0) ? " − " : " + ");
      if (t.typ === "w") {
        var w = [];
        for (var i = 0; i < t.n; i++) w.push(zufall(t.seiten));
        var s = w.reduce(function (a, b) { return a + b; }, 0);
        summe += s * t.vz;
        if (t.n === 1 && t.seiten === 20) natur = w[0];
        texte.push(zeichen + "[" + w.join(", ") + "]");
      } else {
        summe += t.wert;
        texte.push(zeichen + Math.abs(t.wert));
      }
    });
    return {
      formel: normal(formel),
      summe: summe,
      text: texte.join(""),
      natur: nurEinW20 ? natur : null
    };
  }

  // W20 mit Vorteil / Nachteil ("v" / "n"), mod = Zahl
  function w20(mod, modus) {
    mod = mod || 0;
    var a = zufall(20), b = null, genommen = a;
    if (modus === "v" || modus === "n") {
      b = zufall(20);
      genommen = modus === "v" ? Math.max(a, b) : Math.min(a, b);
    }
    var txt = b === null ? "[" + a + "]" : "[" + a + ", " + b + "] → " + genommen;
    if (mod) txt += (mod > 0 ? " + " : " − ") + Math.abs(mod);
    return { a: a, b: b, natur: genommen, summe: genommen + mod, text: txt };
  }

  function normal(formel) {
    return String(formel).toUpperCase().replace(/D/g, "W").replace(/\s+/g, "").replace(/([+\-])/g, " $1 ").trim();
  }

  /* ---------- kleine Helfer ---------- */
  function mod(wert) { return Math.floor((wert - 10) / 2); }
  function vz(n) { return (n >= 0 ? "+" : "−") + Math.abs(n); }
  function el(tag, attrs, kinder) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    (kinder || []).forEach(function (c) { e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function laden(schluessel, ersatz) {
    try {
      var v = localStorage.getItem("wr_" + schluessel);
      return v ? JSON.parse(v) : ersatz;
    } catch (e) { return ersatz; }
  }
  function speichern(schluessel, wert) {
    try { localStorage.setItem("wr_" + schluessel, JSON.stringify(wert)); } catch (e) { /* egal */ }
  }
  function zufallAus(liste) { return liste[zufall(liste.length) - 1]; }
  function wackeln(e) {
    if (!e) return;
    e.classList.remove("wackelt");
    void e.offsetWidth;
    e.classList.add("wackelt");
  }

  /* ---------- Würfelformen als SVG ---------- */
  var FORMEN = {
    4: '<polygon points="20,3 37,35 3,35"/>',
    6: '<rect x="5" y="5" width="30" height="30"/>',
    8: '<polygon points="20,2 37,20 20,38 3,20"/><polyline points="3,20 20,14 37,20" class="duenn"/>',
    10: '<polygon points="20,2 37,17 20,38 3,17"/><polyline points="3,17 20,24 37,17" class="duenn"/>',
    12: '<polygon points="20,2 38,15 31,37 9,37 2,15"/>',
    20: '<polygon points="20,2 36,11 36,29 20,38 4,29 4,11"/><polygon points="20,8 31,27 9,27" class="duenn"/>',
    100: '<polygon points="20,2 37,17 20,38 3,17"/><polyline points="3,17 20,24 37,17" class="duenn"/>'
  };
  function wuerfelSVG(seiten, groesse, beschriftung, farbe, rand) {
    groesse = groesse || 40;
    farbe = farbe || "#000";
    var form = FORMEN[seiten] || FORMEN[6];
    var txt = beschriftung === undefined ? String(seiten === 100 ? "%" : seiten) : beschriftung;
    var y = seiten === 4 ? 31 : seiten === 8 ? 28 : 25;
    return '<svg width="' + groesse + '" height="' + groesse + '" viewBox="0 0 40 40" aria-hidden="true">' +
      '<g fill="none" stroke="' + farbe + '" stroke-width="2" stroke-linejoin="miter">' +
      form.replace(/class="duenn"/g, 'stroke-width="1"') + "</g>" +
      '<text x="20" y="' + y + '" text-anchor="middle" font-family="Verdana, sans-serif" font-size="' +
      (txt.length > 2 ? 9 : 12) + '" font-weight="bold" fill="' + farbe + '" stroke="' + (rand || "#fff") +
      '" stroke-width="3" paint-order="stroke">' + txt + "</text></svg>";
  }

  /* ---------- klickbare Würfelangaben im Text ---------- */
  function inlineWuerfel(wurzel) {
    (wurzel || document).querySelectorAll("span.w").forEach(function (sp) {
      var formel = sp.getAttribute("data-wurf") || sp.textContent;
      if (!zerlege(formel)) return;
      var b = el("button", { type: "button", "class": "wurf-inline", title: "Klicken zum Würfeln: " + formel, text: sp.textContent });
      var erg = el("span", { "class": "wurf-erg versteckt" });
      b.addEventListener("click", function () {
        var r = wuerfle(formel);
        erg.textContent = "= " + r.summe;
        erg.title = r.text;
        erg.classList.remove("versteckt");
        wackeln(erg);
      });
      sp.replaceWith(b);
      b.after(erg);
    });
  }

  /* ---------- Schnellwürfel unten rechts ---------- */
  function schnellwuerfel() {
    if (document.getElementById("schnellwuerfel")) return;
    var box = el("div", { id: "schnellwuerfel", "class": "nicht-drucken" });
    var knopf = el("button", { type: "button", "class": "sw-knopf", "aria-expanded": "false", title: "Schnell würfeln" });
    knopf.innerHTML = wuerfelSVG(20, 22, "", "#fff") + "Würfeln";
    var panel = el("div", { "class": "sw-panel versteckt" });
    var mini = el("div", { "class": "wuerfel-mini" });
    var erg = el("div", { "class": "sw-erg", html: "Würfel antippen" });
    [4, 6, 8, 10, 12, 20, 100].forEach(function (s) {
      mini.appendChild(el("button", {
        type: "button", text: s === 100 ? "W%" : "W" + s,
        onclick: function () {
          var r = wuerfle("1W" + s);
          var zusatz = "";
          if (s === 20 && r.natur === 20) zusatz = " – NATÜRLICHE 20!";
          if (s === 20 && r.natur === 1) zusatz = " – Patzer…";
          erg.innerHTML = "<b>" + r.summe + "</b>W" + (s === 100 ? "%" : s) + zusatz;
          wackeln(erg);
        }
      }));
    });
    mini.appendChild(el("button", {
      type: "button", text: "2W20↑", title: "Vorteil: 2W20, höheren nehmen",
      onclick: function () {
        var r = w20(0, "v");
        erg.innerHTML = "<b>" + r.summe + "</b>Vorteil " + r.text;
        wackeln(erg);
      }
    }));
    panel.appendChild(mini);
    panel.appendChild(erg);
    panel.appendChild(el("div", { "class": "klein", html: 'Mehr auf der <a href="wuerfel.html">Würfelseite</a>.' }));
    knopf.addEventListener("click", function () {
      var zu = panel.classList.toggle("versteckt");
      knopf.setAttribute("aria-expanded", zu ? "false" : "true");
    });
    box.appendChild(panel);
    box.appendChild(knopf);
    document.body.appendChild(box);
  }

  /* ---------- Quizfragen (überall gleich aufgebaut) ---------- */
  function quizfragen(wurzel) {
    (wurzel || document).querySelectorAll(".frage[data-auto]").forEach(function (f) {
      var knoepfe = f.querySelectorAll(".antworten button");
      knoepfe.forEach(function (b) {
        b.addEventListener("click", function () {
          if (f.classList.contains("beantwortet")) return;
          f.classList.add("beantwortet");
          if (b.hasAttribute("data-ok")) b.classList.add("richtig");
          else {
            b.classList.add("falsch");
            knoepfe.forEach(function (x) { if (x.hasAttribute("data-ok")) x.classList.add("richtig"); });
          }
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    inlineWuerfel();
    quizfragen();
    schnellwuerfel();
  });

  return {
    zufall: zufall, zerlege: zerlege, wuerfle: wuerfle, w20: w20, mod: mod, vz: vz, el: el,
    laden: laden, speichern: speichern, zufallAus: zufallAus, wackeln: wackeln,
    wuerfelSVG: wuerfelSVG, inlineWuerfel: inlineWuerfel
  };
})();
