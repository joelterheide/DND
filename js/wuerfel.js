/* ==========================================================
   Die Würfelrunde – Würfelseite
   ========================================================== */
(function () {
  "use strict";
  var el = DND.el;
  var gross = document.getElementById("gross");
  var ergText = document.getElementById("erg-text");
  var hinweis = document.getElementById("erg-hinweis");
  var verlaufListe = document.getElementById("verlauf");
  var verlauf = DND.laden("verlauf", []);
  var laeuft = null;

  function uhrzeit() {
    var d = new Date();
    return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }

  // kurzes "Rollen" mit zufälligen Zahlen, dann das echte Ergebnis
  function zeige(summe, text, titel, natur, extra) {
    if (laeuft) clearInterval(laeuft);
    gross.className = "grossergebnis";
    hinweis.textContent = "";
    var schritte = 0;
    laeuft = setInterval(function () {
      gross.textContent = DND.zufall(20);
      schritte++;
      if (schritte >= 7) {
        clearInterval(laeuft);
        laeuft = null;
        gross.textContent = summe;
        ergText.textContent = titel + ":  " + text + " = " + summe;
        if (natur === 20) { gross.classList.add("krit"); hinweis.textContent = "Natürliche 20!"; hinweis.style.color = "#0b6b1f"; }
        else if (natur === 1) { gross.classList.add("patzer"); hinweis.textContent = "Natürliche 1 – autsch."; hinweis.style.color = "#8a1c1c"; }
        if (extra) { hinweis.textContent = (hinweis.textContent ? hinweis.textContent + " " : "") + extra.text; hinweis.style.color = extra.farbe; }
        DND.wackeln(gross);
      }
    }, 40);
    verlauf.unshift({ z: uhrzeit(), t: titel, w: text, s: summe });
    verlauf = verlauf.slice(0, 40);
    DND.speichern("verlauf", verlauf);
    zeichneVerlauf();
  }

  function zeichneVerlauf() {
    verlaufListe.innerHTML = "";
    if (!verlauf.length) {
      verlaufListe.appendChild(el("li", { "class": "klein", text: "Noch keine Würfe." }));
      return;
    }
    verlauf.forEach(function (v) {
      var li = el("li");
      li.appendChild(el("span", { "class": "zeit", text: v.z + "  " }));
      li.appendChild(el("b", { text: v.t }));
      li.appendChild(document.createTextNode("  " + v.w + " = "));
      li.appendChild(el("b", { text: String(v.s) }));
      verlaufListe.appendChild(li);
    });
  }

  /* ---------- Würfelknöpfe ---------- */
  var knoepfe = document.getElementById("wuerfel-knoepfe");
  [4, 6, 8, 10, 12, 20, 100].forEach(function (s) {
    var name = s === 100 ? "W%" : "W" + s;
    var b = el("button", { type: "button", "class": "wuerfelknopf", title: name + " würfeln" });
    b.innerHTML = DND.wuerfelSVG(s, 44) + "<span>" + name + "</span>";
    b.addEventListener("click", function () {
      var n = Math.max(1, Math.min(20, parseInt(document.getElementById("anzahl").value, 10) || 1));
      var m = parseInt(document.getElementById("modifikator").value, 10) || 0;
      var formel = n + "W" + s + (m ? (m > 0 ? "+" : "-") + Math.abs(m) : "");
      var r = DND.wuerfle(formel);
      zeige(r.summe, r.text, r.formel, r.natur);
      DND.wackeln(b.querySelector("svg"));
    });
    knoepfe.appendChild(b);
  });

  /* ---------- W20-Probe ---------- */
  document.querySelectorAll("button[data-modus]").forEach(function (b) {
    b.addEventListener("click", function () {
      var modus = b.getAttribute("data-modus");
      var m = parseInt(document.getElementById("probe-mod").value, 10) || 0;
      var sgFeld = document.getElementById("probe-sg").value;
      var r = DND.w20(m, modus);
      var titel = "W20" + (m ? " " + DND.vz(m) : "") + (modus === "v" ? " (Vorteil)" : modus === "n" ? " (Nachteil)" : "");
      var extra = null;
      if (sgFeld !== "") {
        var sg = parseInt(sgFeld, 10);
        extra = r.summe >= sg
          ? { text: "Geschafft (SG " + sg + ")", farbe: "#0b6b1f" }
          : { text: "Nicht geschafft (SG " + sg + ")", farbe: "#8a1c1c" };
      }
      zeige(r.summe, r.text, titel, r.natur, extra);
    });
  });

  /* ---------- Formel ---------- */
  var formelFeld = document.getElementById("formel");
  function formelWurf(f) {
    var r = DND.wuerfle(f);
    if (!r) {
      ergText.textContent = "Die Formel verstehe ich nicht. Beispiele: 1W20+5, 2W6, 1W8+1W6+2";
      gross.textContent = "?";
      return;
    }
    zeige(r.summe, r.text, r.formel, r.natur);
  }
  document.getElementById("formel-knopf").addEventListener("click", function () { formelWurf(formelFeld.value); });
  formelFeld.addEventListener("keydown", function (e) { if (e.key === "Enter") formelWurf(formelFeld.value); });
  document.querySelectorAll("#schnell-formeln button").forEach(function (b) {
    b.addEventListener("click", function () {
      formelFeld.value = b.getAttribute("data-f");
      formelWurf(formelFeld.value);
    });
  });

  document.getElementById("verlauf-leeren").addEventListener("click", function () {
    verlauf = [];
    DND.speichern("verlauf", verlauf);
    zeichneVerlauf();
  });

  zeichneVerlauf();
})();
