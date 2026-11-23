# Die Würfelrunde

Eine selbstgebaute Website, mit der man **Dungeons & Dragons** von null an lernen und direkt am Tisch benutzen kann.
Reines HTML, CSS und JavaScript – keine Frameworks, keine Installation, funktioniert auch offline.

## Was drin ist

| Seite | Was sie kann |
|---|---|
| `index.html` | Startseite mit den verschiedenen Einstiegen |
| `anleitung.html` | 13 Lektionen mit Übungen: Modifikator-Trainer, Proben-Simulator, Vorteil/Nachteil, Probekampf gegen einen Goblin, Todesrettungswürfe |
| `wuerfel.html` | Alle Würfel, Formeln wie `2W6+3`, W20 mit Vorteil/Nachteil und SG, Verlauf |
| `charakter.html` | Charakterbogen mit automatischer Berechnung, 4 fertigen Helden, Speichern, Drucken/PDF, Datei-Export |
| `spielleiter.html` | Initiative-Liste mit TP, 10 Monster, Generatoren (Namen, NSC, Taverne, Abenteuer, Beute), Spickzettel, Zustände |
| `abenteuer.html` | Einstiegsabenteuer „Lichter am Steinbruch“ für 4 Helden der Stufe 1 |
| `glossar.html` | Alle Begriffe mit Suche |

Auf jeder Seite gibt es unten rechts einen **Würfeln**-Knopf. Würfelangaben im Text (z. B. `1W6+2`) kann man anklicken.

## Online stellen mit GitHub Pages

1. Im Repo auf **Settings → Pages** gehen.
2. Bei *Source* „Deploy from a branch“ wählen, Branch `main`, Ordner `/ (root)`, speichern.
3. Nach ein, zwei Minuten ist die Seite unter `https://joelterheide.github.io/DND/` erreichbar.

Lokal reicht es, `index.html` im Browser zu öffnen.

## Aufbau

```
index.html, anleitung.html, …   die Seiten
css/stil.css                     das komplette Design
js/gemeinsam.js                  Würfel-Engine, Speichern, Schnellwürfel (auf allen Seiten)
js/daten.js                      Klassen, Völker, Hintergründe, Fertigkeiten, Vorlage-Helden, Monster, Zustände
js/anleitung.js, wuerfel.js, …   Logik der einzelnen Seiten
```

Gespeichert wird nur im Browser (localStorage) – Charaktere, Initiative-Liste, Lernfortschritt, Würfelverlauf.

## Hinweis

Die Regeln sind vereinfacht nach der 5. Edition (Stand 2024) bzw. dem freien SRD. Dungeons & Dragons ist eine Marke von
Wizards of the Coast. Das hier ist eine private Fanseite.
