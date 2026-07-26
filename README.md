# Gehirnjogging

Acht kurze, mitwachsende Übungen für Kopf und Reaktion – als statische Webseite,
ohne Anmeldung, ohne Server, ohne Datensammelei. Alles bleibt im Browser des Geräts.

**Live:** https://mac-fa.github.io/gehirnjogging/

## Die Übungen

| | Übung | Trainiert | Angelehnt an |
|---|---|---|---|
| 👁️ | Weitblick | Verarbeitungsgeschwindigkeit, Sehfeld | ACTIVE-Studie (Speed-of-Processing) |
| 🚗 | Doppelspur | geteilte Aufmerksamkeit | Doppelaufgaben-Training |
| 🔀 | Regelwechsel | kognitive Flexibilität | Set-Shifting / WCST |
| 🚦 | Bremse | Impulskontrolle | Stroop + Stopp-Signal-Aufgabe |
| 🗺️ | Stadtplan | räumliche Orientierung | Navigationsstudien (Hippocampus) |
| 📌 | Merkzettel | prospektives Gedächtnis | Alltagsgedächtnis-Forschung |
| 🎧 | Gehör | auditive Verarbeitung | Temporal-Order-Judgement |
| 🛒 | Marktstand | Überblick, Multitasking | Echtzeit-Strategie-Studien |

Jede Übung passt ihre Schwierigkeit laufend an: Nach mehreren richtigen Antworten
wird es schwerer, nach einem Fehler wieder leichter. So bleibt man dauerhaft am
eigenen Rand – der Bereich, in dem Training laut Forschung überhaupt etwas bewirkt.

## Ehrlichkeit vorweg

Gehirnjogging macht vor allem gut im Gehirnjogging. Die Übertragung auf andere
Fähigkeiten ist in der Forschung schwach belegt; hier wird nichts versprochen, was
nicht belegt ist. Die Begründung für jede einzelne Übung, mit Quellen, steht in
[RECHERCHE.md](RECHERCHE.md) und in Kurzform auf der Seite „Über dieses Programm“.

## Technik

Reines HTML/CSS/JavaScript, keine Abhängigkeiten, kein Bauschritt. Installierbar als
App (PWA) und offline nutzbar. Lokal starten: einen beliebigen Webserver auf den
Ordner richten, zum Beispiel

```bash
npx http-server . -p 8109 -c-1
```

- `index.html` – Startseite mit Tagesaufgabe, Sitzungen und Wochenprofil
- `uebungen/` – die acht Übungen, jede für sich lauffähig
- `js/common.js` – gemeinsame Logik, u. a. die adaptive „Treppe“
- `js/uebungen.js` – Verzeichnis der Übungen und Ergebnisrahmen
