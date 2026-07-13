# So testest du die App auf deinem Computer – ganz einfach erklärt

Du machst drei Dinge: **1. Ein Programm installieren. 2. Ein schwarzes Fenster öffnen. 3. Drei Zauberwörter eintippen.** Fertig.

## Schritt 1: Node.js installieren (einmalig)

Node.js ist das Programm, das unsere App zum Leben erweckt.

1. Öffne im Browser: **https://nodejs.org**
2. Klicke auf den großen grünen Knopf (da steht „LTS" – das ist die stabile Version).
3. Öffne die heruntergeladene Datei und klicke immer auf **Weiter / Next**, bis „Fertig" kommt. Nichts ändern, einfach durchklicken.

## Schritt 2: Das schwarze Fenster im richtigen Ordner öffnen

1. Öffne den **Datei-Explorer** (das gelbe Ordner-Symbol).
2. Gehe zu deinem Ordner:
   `Dokumente → AndresCloud → AndresCloud → SV Schöning Trainingsplaner → svs-trainingsplaner`
3. Klicke oben in die **Adressleiste** (da wo der Pfad steht), tippe **cmd** und drücke **Enter**.
4. Es öffnet sich ein schwarzes Fenster. Keine Angst – das ist dein Kommando-Fenster, und es ist schon im richtigen Ordner.

## Schritt 3: Die drei Zauberwörter

Tippe jede Zeile einzeln ein und drücke danach Enter. **Warte immer, bis der Computer fertig ist** (es erscheint wieder eine Zeile, die mit deinem Ordnerpfad beginnt).

**Zauberwort 1 – Bausteine holen** (dauert 1–3 Minuten, lädt viel herunter):

```
npm install
```

**Zauberwort 2 – Prüfen, ob alles funktioniert:**

```
npm test
```

✅ Gut: Am Ende steht etwas Grünes mit **„2 passed"**.
❌ Schlecht: Etwas Rotes mit „failed" → mach ein Foto/Screenshot und zeig es Claude.

**Zauberwort 3 – Die fertige App bauen:**

```
npm run build
```

✅ Gut: Am Ende steht **„built in …"** ohne rote Fehlermeldung.

## Bonus: Die App anschauen

Tippe:

```
npm run dev
```

Dann steht dort eine Adresse wie `http://localhost:5173/svs-trainingsplaner/`. Halte **Strg** gedrückt und klicke darauf (oder tippe sie im Browser ein). Du siehst das Vereinslogo und den Titel. Zum Beenden im schwarzen Fenster **Strg + C** drücken.

## Schritt 4: Alles zu GitHub hochladen (mit GitHub Desktop – der einfache Weg)

1. Installiere **GitHub Desktop**: https://desktop.github.com (herunterladen, öffnen, mit deinem GitHub-Konto anmelden).
2. Klicke: **File → Clone repository** → wähle **svs-trainingsplaner** → merke dir, in welchen Ordner es gespeichert wird (steht im Fenster) → **Clone**.
3. Öffne im Datei-Explorer unseren Ordner `svs-trainingsplaner` (aus Schritt 2) und **kopiere alles außer dem Ordner `node_modules` und dem Ordner `dist`**.
4. Füge alles in den geklonten Ordner aus Punkt 2 ein. Wenn gefragt wird „Ersetzen?" → **Ja, ersetzen**.
5. Zurück in GitHub Desktop: Links siehst du jetzt viele Dateien. Schreibe unten links in das kleine Feld: `Grundgerüst` und klicke **Commit to main**.
6. Klicke oben auf **Push origin**.

Fertig! 🎉 Sag Claude Bescheid, was bei `npm test` und `npm run build` herauskam.
