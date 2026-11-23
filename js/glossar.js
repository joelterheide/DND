/* Die Würfelrunde – Suche im Glossar */
(function () {
  "use strict";
  var suche = document.getElementById("suche");
  var begriffe = Array.prototype.slice.call(document.querySelectorAll("#glossar dt"));
  var treffer = document.getElementById("treffer");
  var nichts = document.getElementById("nichts");

  function filtern() {
    var q = suche.value.trim().toLowerCase();
    var n = 0;
    begriffe.forEach(function (dt) {
      var dd = dt.nextElementSibling;
      var passt = !q || (dt.textContent + " " + dd.textContent).toLowerCase().indexOf(q) !== -1;
      dt.classList.toggle("versteckt", !passt);
      dd.classList.toggle("versteckt", !passt);
      if (passt) n++;
    });
    treffer.textContent = q ? n + " Treffer" : begriffe.length + " Begriffe";
    nichts.classList.toggle("versteckt", n > 0);
  }
  suche.addEventListener("input", filtern);
  filtern();
})();
