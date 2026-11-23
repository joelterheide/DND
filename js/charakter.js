/* ==========================================================
   Die Würfelrunde – Charakterbogen
   ========================================================== */
(function () {
  "use strict";
  var el = DND.el;
  function $(id) { return document.getElementById(id); }
  var ATT = DATEN.attribute;
  var STANDARD = [15, 14, 13, 12, 10, 8];
  var C = null;

  /* ---------- Grundgerüst eines Charakters ---------- */
  function leer() {
    return {
      name: "", spieler: "", volk: "mensch", klasse: "kaempfer", hintergrund: "soldat", stufe: 1,
      att: { sta: 10, ges: 10, kon: 10, int: 10, wei: 10, cha: 10 },
      fert: {}, rk: 10, tpMax: 10, tpAkt: 10, tpAuto: true, bew: 9,
      angriffe: "", faehigkeiten: "", ausruestung: "", notizen: ""
    };
  }
  function vervollstaendige(obj) {
    var c = leer();
    for (var k in obj) if (obj.hasOwnProperty(k)) c[k] = obj[k];
    c.att = Object.assign(leer().att, obj.att || {});
    c.fert = Object.assign({}, obj.fert || {});
    if (!DATEN.klassen[c.klasse]) c.klasse = "kaempfer";
    if (!DATEN.voelker[c.volk]) c.volk = "mensch";
    if (!DATEN.hintergruende[c.hintergrund]) c.hintergrund = "soldat";
    c.stufe = Math.max(1, Math.min(20, parseInt(c.stufe, 10) || 1));
    return c;
  }
  function kopie(o) { return JSON.parse(JSON.stringify(o)); }
  function neuerCharakter() {
    var c = leer();
    standardreihe(c);
    DATEN.hintergruende[c.hintergrund].fert.forEach(function (f) { c.fert[f] = 1; });
    return c;
  }
  function standardreihe(c) {
    DATEN.klassen[c.klasse].prio.forEach(function (a, i) { c.att[a] = STANDARD[i]; });
  }

  /* ---------- Auswahllisten füllen ---------- */
  function fuelle(select, daten) {
    Object.keys(daten)
      .sort(function (a, b) { return daten[a].name.localeCompare(daten[b].name, "de"); })
      .forEach(function (k) { select.appendChild(el("option", { value: k, text: daten[k].name })); });
  }
  fuelle($("c-klasse"), DATEN.klassen);
  fuelle($("c-volk"), DATEN.voelker);
  fuelle($("c-hintergrund"), DATEN.hintergruende);

  /* ---------- Attribute, Rettungswürfe, Fertigkeiten aufbauen ---------- */
  var attBox = $("attribute");
  ATT.forEach(function (a) {
    var box = el("div", { "class": "attr" });
    box.appendChild(el("div", { "class": "name", text: a.kurz }));
    box.appendChild(el("div", { "class": "klein", text: a.name }));
    var inp = el("input", { type: "number", id: "a-" + a.id, min: "1", max: "30", "aria-label": a.name });
    box.appendChild(inp);
    box.appendChild(el("br"));
    var m = el("button", { type: "button", "class": "mod", id: "m-" + a.id, title: a.name + "-Probe würfeln", text: "+0" });
    m.addEventListener("click", function () { wurf(a.name + "-Probe", DND.mod(C.att[a.id])); });
    box.appendChild(m);
    attBox.appendChild(box);
    inp.addEventListener("input", function () {
      var v = parseInt(inp.value, 10);
      if (!isNaN(v)) { C.att[a.id] = Math.max(1, Math.min(30, v)); aenderung(); }
    });
  });

  var rwListe = $("rettungswuerfe");
  ATT.forEach(function (a) {
    var li = el("li");
    li.appendChild(el("span", { "class": "rw-mark", id: "rwm-" + a.id, text: "○", style: "width:20px;text-align:center;" }));
    var b = el("button", { type: "button", "class": "bonus", id: "rw-" + a.id, text: "+0", title: "Rettungswurf würfeln" });
    b.addEventListener("click", function () { wurf(a.name + "-Rettungswurf", rwBonus(a.id)); });
    li.appendChild(b);
    li.appendChild(el("span", { text: a.name }));
    rwListe.appendChild(li);
  });

  var fListe = $("fertigkeiten");
  DATEN.fertigkeiten.forEach(function (f) {
    var att = ATT.filter(function (a) { return a.id === f.att; })[0];
    var li = el("li", { id: "fli-" + f.id, title: f.bsp });
    var t = el("button", { type: "button", "class": "klein-k", id: "ft-" + f.id, style: "width:34px;padding:1px 0;", title: "geübt / Expertise umschalten" });
    t.addEventListener("click", function () {
      var s = ((C.fert[f.id] || 0) + 1) % 3;
      if (s) C.fert[f.id] = s; else delete C.fert[f.id];
      aenderung();
    });
    li.appendChild(t);
    var b = el("button", { type: "button", "class": "bonus", id: "fb-" + f.id, text: "+0", title: f.name + " würfeln" });
    b.addEventListener("click", function () { wurf(f.name, fertBonus(f)); });
    li.appendChild(b);
    li.appendChild(el("span", { "class": "fname", text: f.name }));
    li.appendChild(el("span", { "class": "att", text: "(" + att.kurz + ")" }));
    fListe.appendChild(li);
  });

  $("w-ini").addEventListener("click", function () { wurf("Initiative", DND.mod(C.att.ges)); });

  /* ---------- Rechnen ---------- */
  function ueb() { return DATEN.uebung(C.stufe); }
  function rwBonus(a) {
    return DND.mod(C.att[a]) + (DATEN.klassen[C.klasse].rw.indexOf(a) !== -1 ? ueb() : 0);
  }
  function fertBonus(f) { return DND.mod(C.att[f.att]) + (C.fert[f.id] || 0) * ueb(); }
  function tpVorschlag() {
    var k = DATEN.klassen[C.klasse];
    var kon = DND.mod(C.att.kon);
    var tp = k.tw + kon;
    for (var s = 2; s <= C.stufe; s++) tp += Math.max(1, k.tw / 2 + 1 + kon);
    if (C.volk === "zwerg") tp += C.stufe;
    return Math.max(1, tp);
  }

  function sterne(n) { return "★★★".slice(0, n) + "☆☆☆".slice(0, 3 - n); }
  function fertName(id) { return DATEN.fertigkeiten.filter(function (f) { return f.id === id; })[0].name; }
  function attName(id) { return ATT.filter(function (a) { return a.id === id; })[0].name; }

  function berechne() {
    var k = DATEN.klassen[C.klasse];
    var v = DATEN.voelker[C.volk];
    var h = DATEN.hintergruende[C.hintergrund];
    var p = ueb();

    if (C.tpAuto) {
      C.tpMax = tpVorschlag();
      C.tpAkt = C.tpMax;
      $("c-tpmax").value = C.tpMax;
      $("c-tpakt").value = C.tpAkt;
    }

    ATT.forEach(function (a) {
      $("m-" + a.id).textContent = DND.vz(DND.mod(C.att[a.id]));
      var geuebt = k.rw.indexOf(a.id) !== -1;
      $("rwm-" + a.id).textContent = geuebt ? "●" : "○";
      $("rwm-" + a.id).title = geuebt ? "geübt (durch deine Klasse)" : "nicht geübt";
      $("rw-" + a.id).textContent = DND.vz(rwBonus(a.id));
    });

    var anzahl = 0;
    DATEN.fertigkeiten.forEach(function (f) {
      var s = C.fert[f.id] || 0;
      if (s) anzahl++;
      $("ft-" + f.id).textContent = ["–", "✓", "✓✓"][s];
      $("fb-" + f.id).textContent = DND.vz(fertBonus(f));
      $("fli-" + f.id).classList.toggle("klasse-fert", k.fert === "alle" || k.fert.indexOf(f.id) !== -1);
    });

    $("w-ini").textContent = DND.vz(DND.mod(C.att.ges));
    $("w-ueb").textContent = "+" + p;
    $("w-pw").textContent = 10 + fertBonus(DATEN.fertigkeiten.filter(function (f) { return f.id === "wahrnehmung"; })[0]);
    $("w-tw").textContent = C.stufe + "W" + k.tw;

    var vor = tpVorschlag();
    var tpv = $("tp-vorschlag");
    tpv.innerHTML = "";
    tpv.appendChild(document.createTextNode(
      "TP-Vorschlag: " + vor + " (Stufe 1: Trefferwürfel " + k.tw + " + KON " + DND.vz(DND.mod(C.att.kon)) +
      (C.stufe > 1 ? ", danach pro Stufe " + (k.tw / 2 + 1) + " + KON" : "") +
      (C.volk === "zwerg" ? ", +1 pro Stufe als Zwerg" : "") + ") "));
    if (C.tpMax !== vor) {
      tpv.appendChild(el("button", {
        type: "button", "class": "klein-k", text: "übernehmen",
        onclick: function () { C.tpAuto = true; aenderung(); }
      }));
    }
    $("rk-hinweis").textContent = "Rüstung deiner Klasse: " + k.ruestung + " Ohne Rüstung wäre deine RK " + (10 + DND.mod(C.att.ges)) + ".";

    var fertText = k.fert === "alle" ? "3 beliebige" : k.n + " aus: " + k.fert.map(fertName).join(", ");
    $("klassen-info").innerHTML =
      "<b>" + k.name + "</b> – " + k.text + " <span title='Einsteigerfreundlich'>[" + sterne(k.leicht) + "]</span><br>" +
      "<b>Trefferwürfel:</b> W" + k.tw + " · <b>Rettungswürfe:</b> " + k.rw.map(attName).join(", ") +
      " · <b>Startfähigkeiten:</b> " + k.start + "<br>" +
      "<b>Fertigkeiten wählen:</b> " + fertText + "<br>" +
      "<b>" + v.name + ":</b> " + v.text + "<br>" +
      "<b>Hintergrund " + h.name + ":</b> geübt in " + h.fert.map(fertName).join(" und ") +
      " (schon angekreuzt). Außerdem darfst du +2 auf ein und +1 auf ein anderes dieser Attribute verteilen (oder +1 auf alle drei): " +
      h.att.map(attName).join(", ") + ".";

    var soll = (k.fert === "alle" ? 3 : k.n) + 2 + (C.volk === "mensch" ? 1 : 0);
    $("fert-zaehler").textContent = "Angekreuzt: " + anzahl + ". Üblich auf Stufe 1: " + soll +
      " (" + (k.fert === "alle" ? 3 : k.n) + " Klasse + 2 Hintergrund" + (C.volk === "mensch" ? " + 1 Mensch" : "") + ").";
  }

  /* ---------- Formular <-> Daten ---------- */
  var TEXTFELDER = { "c-name": "name", "c-spieler": "spieler", "c-angriffe": "angriffe", "c-faehigkeiten": "faehigkeiten", "c-ausruestung": "ausruestung", "c-notizen": "notizen" };
  function insFormular() {
    for (var id in TEXTFELDER) $(id).value = C[TEXTFELDER[id]] || "";
    $("c-klasse").value = C.klasse;
    $("c-volk").value = C.volk;
    $("c-hintergrund").value = C.hintergrund;
    $("c-stufe").value = C.stufe;
    $("c-rk").value = C.rk;
    $("c-bew").value = C.bew;
    $("c-tpmax").value = C.tpMax;
    $("c-tpakt").value = C.tpAkt;
    ATT.forEach(function (a) { $("a-" + a.id).value = C.att[a.id]; });
  }

  function aenderung() {
    berechne();
    DND.speichern("aktuell", C);
  }

  Object.keys(TEXTFELDER).forEach(function (id) {
    $(id).addEventListener("input", function () { C[TEXTFELDER[id]] = $(id).value; DND.speichern("aktuell", C); });
  });
  $("c-klasse").addEventListener("change", function () { C.klasse = this.value; aenderung(); });
  $("c-volk").addEventListener("change", function () {
    C.volk = this.value;
    C.bew = DATEN.voelker[C.volk].bew;
    $("c-bew").value = C.bew;
    aenderung();
  });
  $("c-hintergrund").addEventListener("change", function () {
    var alt = DATEN.hintergruende[C.hintergrund];
    alt.fert.forEach(function (f) { if (C.fert[f] === 1) delete C.fert[f]; });
    C.hintergrund = this.value;
    DATEN.hintergruende[C.hintergrund].fert.forEach(function (f) { if (!C.fert[f]) C.fert[f] = 1; });
    aenderung();
  });
  $("c-stufe").addEventListener("input", function () {
    var s = parseInt(this.value, 10);
    if (!isNaN(s)) { C.stufe = Math.max(1, Math.min(20, s)); aenderung(); }
  });
  $("c-rk").addEventListener("input", function () { C.rk = parseInt(this.value, 10) || 0; DND.speichern("aktuell", C); });
  $("c-bew").addEventListener("input", function () { C.bew = parseFloat(this.value) || 0; DND.speichern("aktuell", C); });
  $("c-tpmax").addEventListener("input", function () {
    var v = parseInt(this.value, 10);
    if (!isNaN(v)) { C.tpMax = v; C.tpAuto = false; aenderung(); }
  });
  $("c-tpakt").addEventListener("input", function () {
    var v = parseInt(this.value, 10);
    if (!isNaN(v)) { C.tpAkt = v; C.tpAuto = false; aenderung(); }
  });

  /* ---------- Würfeln vom Bogen ---------- */
  function wurf(titel, bonus) {
    var modus = document.querySelector("input[name=wmodus]:checked").value;
    var r = DND.w20(bonus, modus);
    var zusatz = r.natur === 20 ? "  ★ natürliche 20!" : r.natur === 1 ? "  – natürliche 1" : "";
    var wer = C.name ? C.name + " – " : "";
    $("wurf-text").textContent = wer + titel + (modus === "v" ? " (Vorteil)" : modus === "n" ? " (Nachteil)" : "") + ": " + r.text + " = " + r.summe + zusatz;
    DND.wackeln($("wurf-text"));
  }

  /* ---------- Knöpfe ---------- */
  function meldung(t) {
    $("meldung").textContent = t;
    setTimeout(function () { if ($("meldung").textContent === t) $("meldung").textContent = ""; }, 4000);
  }

  var vorlagenBox = $("vorlagen");
  Object.keys(DATEN.vorlagen).forEach(function (k) {
    var v = DATEN.vorlagen[k];
    vorlagenBox.appendChild(el("button", {
      type: "button", "class": "klein-k", text: v.name + " (" + DATEN.klassen[v.klasse].name + ")",
      onclick: function () {
        C = vervollstaendige(kopie(v));
        C.tpAuto = false;
        insFormular();
        aenderung();
        meldung(v.name + " geladen.");
      }
    }));
  });

  $("standardreihe").addEventListener("click", function () {
    standardreihe(C);
    insFormular();
    aenderung();
    $("attr-hinweis").textContent = "Standardreihe nach Wichtigkeit für " + DATEN.klassen[C.klasse].name + " verteilt.";
  });

  $("auswuerfeln").addEventListener("click", function () {
    var werte = [];
    for (var i = 0; i < 6; i++) {
      var w = [DND.zufall(6), DND.zufall(6), DND.zufall(6), DND.zufall(6)].sort(function (a, b) { return b - a; });
      werte.push({ s: w[0] + w[1] + w[2], t: w[0] + " " + w[1] + " " + w[2] + " (" + w[3] + ")" });
    }
    werte.sort(function (a, b) { return b.s - a.s; });
    DATEN.klassen[C.klasse].prio.forEach(function (a, i) { C.att[a] = werte[i].s; });
    insFormular();
    aenderung();
    $("attr-hinweis").textContent = "Gewürfelt: " + werte.map(function (x) { return x.s + " [" + x.t + "]"; }).join(" · ") +
      " – der niedrigste Würfel in Klammern zählt nicht. Verteilt nach Wichtigkeit für " + DATEN.klassen[C.klasse].name + ".";
  });

  $("neu").addEventListener("click", function () {
    C = neuerCharakter();
    insFormular();
    aenderung();
    meldung("Neuer Charakter angelegt.");
  });

  function gespeicherteListe() {
    var alle = DND.laden("charaktere", {});
    var sel = $("gespeicherte");
    sel.innerHTML = '<option value="">– gespeicherte Charaktere –</option>';
    Object.keys(alle).sort().forEach(function (n) { sel.appendChild(el("option", { value: n, text: n })); });
    return alle;
  }

  $("speichern").addEventListener("click", function () {
    if (!C.name.trim()) { meldung("Bitte zuerst einen Namen eingeben."); $("c-name").focus(); return; }
    var alle = DND.laden("charaktere", {});
    alle[C.name.trim()] = kopie(C);
    DND.speichern("charaktere", alle);
    gespeicherteListe();
    $("gespeicherte").value = C.name.trim();
    meldung("„" + C.name.trim() + "“ gespeichert.");
  });

  $("laden").addEventListener("click", function () {
    var n = $("gespeicherte").value;
    var alle = DND.laden("charaktere", {});
    if (!n || !alle[n]) { meldung("Erst einen gespeicherten Charakter auswählen."); return; }
    C = vervollstaendige(alle[n]);
    insFormular();
    aenderung();
    meldung("„" + n + "“ geladen.");
  });

  var loeschBereit = false;
  $("loeschen").addEventListener("click", function () {
    var n = $("gespeicherte").value;
    if (!n) { meldung("Erst einen gespeicherten Charakter auswählen."); return; }
    if (!loeschBereit) {
      loeschBereit = true;
      this.textContent = "Wirklich löschen?";
      var knopf = this;
      setTimeout(function () { loeschBereit = false; knopf.textContent = "Löschen"; }, 3000);
      return;
    }
    var alle = DND.laden("charaktere", {});
    delete alle[n];
    DND.speichern("charaktere", alle);
    gespeicherteListe();
    loeschBereit = false;
    this.textContent = "Löschen";
    meldung("„" + n + "“ gelöscht.");
  });

  $("drucken").addEventListener("click", function () { window.print(); });

  $("export").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(C, null, 2)], { type: "application/json" });
    var a = el("a", { href: URL.createObjectURL(blob), download: (C.name.trim() || "charakter").replace(/[^\wäöüÄÖÜß\- ]/g, "") + ".json" });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });

  $("import").addEventListener("change", function () {
    var datei = this.files && this.files[0];
    if (!datei) return;
    var leser = new FileReader();
    leser.onload = function () {
      try {
        var obj = JSON.parse(leser.result);
        if (!obj || typeof obj !== "object" || !obj.att) throw new Error("kein Charakter");
        C = vervollstaendige(obj);
        insFormular();
        aenderung();
        meldung("Datei geladen.");
      } catch (e) {
        meldung("Das ist leider keine gültige Charakter-Datei.");
      }
    };
    leser.readAsText(datei);
    this.value = "";
  });

  /* ---------- Start ---------- */
  var gespeichert = DND.laden("aktuell", null);
  C = gespeichert ? vervollstaendige(gespeichert) : neuerCharakter();
  gespeicherteListe();
  insFormular();
  aenderung();
})();
