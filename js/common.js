/* Gehirnjogging – gemeinsame Logik: Design, Speicher, Zufall, Niveau-Steuerung, Sitzungen */
(function () {
  "use strict";

  var THEME_KEY = "gj-theme";
  var GROSS_KEY = "gj-grossschrift";

  function applyTheme(t) { document.documentElement.dataset.theme = t; }
  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  applyTheme(saved || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  var GJ = window.GJ = {

    /* ---------- kleine Helfer ---------- */
    $: function (s, r) { return (r || document).querySelector(s); },
    $$: function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); },
    el: function (id) { return document.getElementById(id); },
    clamp: function (v, a, b) { return v < a ? a : (v > b ? b : v); },

    /* ---------- Speicher ---------- */
    save: function (key, val) {
      try { localStorage.setItem("gj-" + key, JSON.stringify(val)); } catch (e) {}
    },
    load: function (key, def) {
      try {
        var v = localStorage.getItem("gj-" + key);
        return v === null ? def : JSON.parse(v);
      } catch (e) { return def; }
    },

    /* ---------- Darstellung ---------- */
    toggleTheme: function () {
      var t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(t);
      try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
      GJ.updateThemeIcon();
    },
    updateThemeIcon: function () {
      var b = GJ.el("btn-theme");
      if (b) b.textContent = document.documentElement.dataset.theme === "dark" ? "☀️" : "🌙";
    },
    toggleFullscreen: function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(function () {});
    },
    setGross: function (on) {
      document.body.classList.toggle("gross", !!on);
      try { localStorage.setItem(GROSS_KEY, on ? "1" : "0"); } catch (e) {}
    },
    istGross: function () {
      try { return localStorage.getItem(GROSS_KEY) === "1"; } catch (e) { return false; }
    },

    /* ---------- Bedienelemente ---------- */
    seg: function (el, onChange) {
      if (!el) return;
      el.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b || !el.contains(b)) return;
        Array.prototype.forEach.call(el.children, function (c) { c.classList.remove("active"); });
        b.classList.add("active");
        if (onChange) onChange(b.dataset.value);
      });
    },
    segVal: function (el) { var a = el.querySelector(".active"); return a ? a.dataset.value : null; },
    segSet: function (el, v) {
      Array.prototype.forEach.call(el.children, function (c) {
        c.classList.toggle("active", c.dataset.value == v);
      });
    },
    open: function (id) { var e = GJ.el(id); if (e) e.classList.add("open"); },
    close: function (id) { var e = GJ.el(id); if (e) e.classList.remove("open"); },

    /* ---------- Zufall (mit optionalem Startwert für die Tagesaufgabe) ---------- */
    rng: function (seed) {
      var s = seed >>> 0;
      if (!s) s = (Math.random() * 4294967295) >>> 0;
      return function () {
        s |= 0; s = (s + 0x6D2B79F5) | 0;
        var t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    pick: function (arr, rnd) { return arr[Math.floor((rnd || Math.random)() * arr.length)]; },
    shuffle: function (arr, rnd) {
      var r = rnd || Math.random;
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(r() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    },

    /* ---------- Datum ---------- */
    heute: function (d) {
      d = d || new Date();
      return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    },
    fmtDatum: function (ts) {
      var d = new Date(ts);
      return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) + ", " +
             d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    },
    fmtTime: function (s) {
      s = Math.max(0, Math.floor(s));
      return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    },

    /* ---------- Treppe: hält die Schwierigkeit am persönlichen Rand ----------
       Nach `nDown` richtigen Antworten wird es schwerer, nach einem Fehler leichter.
       Das pendelt sich bei rund 70–80 % Trefferquote ein – dem Bereich, in dem
       Training laut Forschung am besten wirkt.
       Zwei Betriebsarten:
       – additiv:        {start, min, max, runter, rauf, richtungSchwer}
       – multiplikativ:  {start, min, max, faktor}  (faktor<1: kleiner = schwerer)   */
    Treppe: function (opts) {
      var o = opts || {};
      this.wert = o.start;
      this.min = o.min;
      this.max = o.max;
      this.faktor = o.faktor || 0;
      this.faktorRauf = o.faktorRauf || (o.faktor ? Math.pow(o.faktor, -1.6) : 0);
      this.runter = o.runter;             /* Schritt Richtung "schwerer" */
      this.rauf = o.rauf || o.runter * 2; /* Schritt Richtung "leichter" */
      this.nDown = o.nDown || 2;
      this.richtungSchwer = o.richtungSchwer || -1; /* -1: kleinerer Wert = schwerer */
      this.serie = 0;
      this.wenden = [];
      this.dran = 0;
      this.gut = 0;
    },

    /* ---------- kurze Rückmeldungstöne ---------- */
    pieps: function (gut) {
      if (!GJ.load("ton", true)) return;
      try {
        var C = window.AudioContext || window.webkitAudioContext;
        if (!C) return;
        GJ._ac = GJ._ac || new C();
        var ac = GJ._ac;
        if (ac.state === "suspended") ac.resume();
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine";
        o.frequency.value = gut ? 880 : 220;
        g.gain.setValueAtTime(0.0001, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.12, ac.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + (gut ? 0.14 : 0.24));
        o.connect(g); g.connect(ac.destination);
        o.start(); o.stop(ac.currentTime + 0.3);
      } catch (e) {}
    },

    /* ---------- Übungsverlauf ---------- */
    /* Ein Eintrag: {id, t:Zeitstempel, punkte:0..100, roh:Zahl, text:"…"} */
    merkeErgebnis: function (id, punkte, roh, text) {
      var log = GJ.load("log", []);
      log.push({ id: id, t: Date.now(), punkte: Math.round(GJ.clamp(punkte, 0, 100)), roh: roh, text: text || "" });
      if (log.length > 400) log = log.slice(log.length - 400);
      GJ.save("log", log);
      var best = GJ.load("best-" + id, 0);
      if (punkte > best) GJ.save("best-" + id, Math.round(punkte));
      return { best: Math.round(Math.max(best, punkte)), neuerBest: punkte > best };
    },
    bestwert: function (id) { return GJ.load("best-" + id, 0); },
    verlauf: function (id, n) {
      var log = GJ.load("log", []).filter(function (e) { return !id || e.id === id; });
      return n ? log.slice(-n) : log;
    },
    /* Durchschnitt der letzten Durchgänge je Übung (für das Wochenprofil) */
    niveauJeUebung: function (tage) {
      var grenze = Date.now() - (tage || 21) * 864e5;
      var raus = {};
      GJ.load("log", []).forEach(function (e) {
        if (e.t < grenze) return;
        (raus[e.id] = raus[e.id] || []).push(e.punkte);
      });
      Object.keys(raus).forEach(function (k) {
        var a = raus[k].slice(-3);
        raus[k] = Math.round(a.reduce(function (x, y) { return x + y; }, 0) / a.length);
      });
      return raus;
    },
    /* Einheiten = Tage mit mindestens einer Übung, innerhalb der letzten 7 Tage */
    einheitenDieseWoche: function () {
      var grenze = Date.now() - 7 * 864e5, tage = {};
      GJ.load("log", []).forEach(function (e) { if (e.t >= grenze) tage[new Date(e.t).toDateString()] = 1; });
      return Object.keys(tage).length;
    },

    /* ---------- Sitzung (mehrere Übungen hintereinander) ---------- */
    sitzungStart: function (ids, istTagesaufgabe) {
      GJ.save("sitzung", { ids: ids, i: 0, punkte: [], begonnen: Date.now(), tag: !!istTagesaufgabe });
      location.href = "uebungen/" + ids[0] + ".html?s=1";
    },
    sitzung: function () { return GJ.load("sitzung", null); },
    sitzungWeiter: function (punkte) {
      var s = GJ.sitzung();
      if (!s) return null;
      s.punkte.push(Math.round(punkte));
      s.i++;
      GJ.save("sitzung", s);
      return s;
    },
    sitzungEnde: function () { GJ.save("sitzung", null); },

    /* ---------- Tagesaufgabe ---------- */
    tagesSeed: function () { return GJ.heute(); },
    tagesaufgabeErledigt: function () { return GJ.load("tag-erledigt", 0) === GJ.heute(); },
    tagesaufgabeAbhaken: function () { GJ.save("tag-erledigt", GJ.heute()); }
  };

  /* Methoden der Treppe */
  GJ.Treppe.prototype = {
    _setze: function (v) { this.wert = GJ.clamp(v, this.min, this.max); },
    richtig: function () {
      this.dran++; this.gut++; this.serie++;
      if (this.serie >= this.nDown) {
        this.serie = 0;
        this._setze(this.faktor ? this.wert * this.faktor
                                : this.wert + this.richtungSchwer * this.runter);
        this.wenden.push(this.wert);
      }
    },
    falsch: function () {
      this.dran++; this.serie = 0;
      this._setze(this.faktor ? this.wert * this.faktorRauf
                              : this.wert - this.richtungSchwer * this.rauf);
      this.wenden.push(this.wert);
    },
    quote: function () { return this.dran ? this.gut / this.dran : 0; },
    /* Bestes stabiles Niveau: Mittel der letzten Wendepunkte */
    schwelle: function () {
      var w = this.wenden.slice(-6);
      if (!w.length) return this.wert;
      return w.reduce(function (a, b) { return a + b; }, 0) / w.length;
    }
  };

  /* ---------- Aufbau nach dem Laden ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    if (GJ.istGross()) document.body.classList.add("gross");
    var t = GJ.el("btn-theme"); if (t) t.addEventListener("click", GJ.toggleTheme);
    var f = GJ.el("btn-fs"); if (f) f.addEventListener("click", GJ.toggleFullscreen);
    GJ.updateThemeIcon();
    GJ.$$(".overlay[data-dismiss]").forEach(function (ov) {
      ov.addEventListener("click", function (e) { if (e.target === ov) ov.classList.remove("open"); });
    });
    /* Esc schließt offene Fenster */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        var o = document.querySelector(".overlay.open");
        if (o && o.hasAttribute("data-dismiss")) o.classList.remove("open");
      }
    });
  });
})();
