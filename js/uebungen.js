/* Gehirnjogging – Verzeichnis der Übungen + gemeinsamer Rahmen für Übungsseiten */
(function () {
  "use strict";

  /* ---------------------------------------------------------------
     Jede Übung deckt einen kognitiven Bereich ab, der in unseren
     bisherigen Spielen fehlt. "quelle" nennt die Studienlinie,
     auf der die Aufgabe beruht (Details in RECHERCHE.md).
  --------------------------------------------------------------- */
  GJ.UEBUNGEN = [
    { id: "weitblick",   name: "Weitblick",    icon: "👁️", bereich: "Tempo",
      kurz: "Mitte erkennen und gleichzeitig am Rand etwas entdecken – immer kürzer eingeblendet.",
      dauer: "4 Min.", quelle: "ACTIVE-Studie (Sehfeld-Training)" },

    { id: "doppelspur",  name: "Doppelspur",   icon: "🚗", bereich: "Aufmerksamkeit",
      kurz: "Auf der Straße bleiben und nebenbei auf Schilder reagieren. Zwei Dinge auf einmal.",
      dauer: "3 Min.", quelle: "Doppelaufgaben-Training" },

    { id: "regelwechsel", name: "Regelwechsel", icon: "🔀", bereich: "Flexibilität",
      kurz: "Sortieren nach Farbe, Form oder Anzahl – die Regel wechselt ohne Vorwarnung.",
      dauer: "3 Min.", quelle: "Strategiespiel-Studien" },

    { id: "bremse",      name: "Bremse",       icon: "🚦", bereich: "Hemmung",
      kurz: "Schnell antworten – außer beim Stoppzeichen. Da heißt es: Hand ruhig halten.",
      dauer: "3 Min.", quelle: "Training der Exekutivfunktionen" },

    { id: "stadtplan",   name: "Stadtplan",    icon: "🗺️", bereich: "Raum",
      kurz: "Sich einen Ortsplan einprägen und sich darin zurechtfinden, auch gedreht.",
      dauer: "4 Min.", quelle: "Navigations-Studien (Hippocampus)" },

    { id: "merkzettel",  name: "Merkzettel",   icon: "📌", bereich: "Gedächtnis",
      kurz: "Sich etwas vornehmen – und im richtigen Moment daran denken. Wie im Alltag.",
      dauer: "4 Min.", quelle: "Prospektives Gedächtnis" },

    { id: "gehoer",      name: "Gehör",        icon: "🎧", bereich: "Hören",
      kurz: "Zwei Töne, immer schneller hintereinander: Welcher kam zuerst?",
      dauer: "3 Min.", quelle: "Auditive Verarbeitung" },

    { id: "marktstand",  name: "Marktstand",   icon: "🛒", bereich: "Überblick",
      kurz: "Mehrere Kundschaften gleichzeitig bedienen, ohne den Faden zu verlieren.",
      dauer: "4 Min.", quelle: "Echtzeit-Strategie-Studien" }
  ];

  GJ.uebung = function (id) {
    return GJ.UEBUNGEN.filter(function (u) { return u.id === id; })[0];
  };

  /* ---------------------------------------------------------------
     Rahmen für die Übungsseiten: Sitzungsleiste, Ergebnisfenster,
     Weiterleitung zur nächsten Übung.
  --------------------------------------------------------------- */
  var aktuelleId = null, imSitzung = false, aufNochmal = null;

  GJ.rahmen = {

    /* Am Anfang jeder Übungsseite aufrufen. nochmal = Funktion für "Nochmal". */
    start: function (id, nochmal) {
      aktuelleId = id;
      aufNochmal = nochmal;
      var s = GJ.sitzung();
      imSitzung = !!(s && s.ids[s.i] === id && new URLSearchParams(location.search).get("s"));
      baueErgebnisfenster();
      if (imSitzung) baueSitzungsleiste(s);
    },

    /* Am Ende eines Durchgangs. punkte 0..100, roh = Rohwert für den Verlauf. */
    fertig: function (opts) {
      var o = opts || {};
      var erg = GJ.merkeErgebnis(aktuelleId, o.punkte, o.roh, o.rohText || "");
      GJ.el("erg-titel").textContent = o.titel || "Geschafft!";
      GJ.el("erg-text").textContent = o.text || "";
      GJ.el("erg-roh").textContent = o.rohText || "";
      var p = Math.round(GJ.clamp(o.punkte, 0, 100));
      GJ.el("erg-balken").style.width = p + "%";
      GJ.el("erg-punkte").textContent = p;
      GJ.el("erg-best").textContent = erg.neuerBest ? "★ neuer Bestwert" : "Bestwert " + erg.best;

      var leiste = GJ.el("erg-knoepfe");
      leiste.innerHTML = "";
      if (imSitzung) {
        var s = GJ.sitzungWeiter(p);
        var naechste = s.ids[s.i];
        if (naechste) {
          var u = GJ.uebung(naechste);
          leiste.appendChild(knopf("Weiter: " + u.icon + " " + u.name, true, function () {
            location.href = naechste + ".html?s=1";
          }));
          leiste.appendChild(knopf("Sitzung beenden", false, function () {
            GJ.sitzungEnde(); location.href = "../index.html";
          }));
        } else {
          leiste.appendChild(knopf("Zur Auswertung", true, function () {
            location.href = "../index.html?fertig=1";
          }));
        }
      } else {
        leiste.appendChild(knopf("Nochmal", true, function () {
          GJ.close("ov-ergebnis");
          if (aufNochmal) aufNochmal();
        }));
        leiste.appendChild(knopf("Übersicht", false, function () { location.href = "../index.html"; }));
      }
      GJ.open("ov-ergebnis");
    },

    /* Aktuelles Niveau einer Übung (Bestwert), für die Kopfzeile */
    best: function (id) { return GJ.bestwert(id); }
  };

  function knopf(text, primaer, fn) {
    var b = document.createElement("button");
    b.className = "btn" + (primaer ? " primary" : "");
    b.textContent = text;
    b.addEventListener("click", fn);
    return b;
  }

  function baueErgebnisfenster() {
    if (GJ.el("ov-ergebnis")) return;
    var d = document.createElement("div");
    d.className = "overlay";
    d.id = "ov-ergebnis";
    d.innerHTML =
      '<div class="panel result">' +
        '<div class="big" id="erg-titel"></div>' +
        '<p id="erg-text"></p>' +
        '<p id="erg-roh" style="font-size:.9rem"></p>' +
        '<div class="niveau-zeile">' +
          '<span id="erg-punkte" style="font-weight:700;color:var(--text)">0</span>' +
          '<span class="niveau-balken"><i id="erg-balken" style="width:0"></i></span>' +
          '<span id="erg-best"></span>' +
        '</div>' +
        '<div class="panel-buttons" id="erg-knoepfe" style="justify-content:center"></div>' +
      '</div>';
    document.body.appendChild(d);
  }

  function baueSitzungsleiste(s) {
    var main = document.querySelector("main.page");
    if (!main) return;
    var div = document.createElement("div");
    div.className = "sitzungsleiste";
    var punkte = s.ids.map(function (_, i) {
      return '<i class="' + (i < s.i ? "fertig" : (i === s.i ? "jetzt" : "")) + '"></i>';
    }).join("");
    div.innerHTML = "Sitzung – Übung " + (s.i + 1) + " von " + s.ids.length +
      ' <span class="punkte">' + punkte + "</span>";
    main.insertBefore(div, main.firstChild);
  }
})();
