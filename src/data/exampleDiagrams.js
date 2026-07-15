/**
 * Sechs Beispieldiagramme für die Vorschau und Tests –
 * je eines für Aufwärmen, Passspiel, Dribbling, Torschuss, kleine Spielform, Abschlussspiel.
 */
export const exampleDiagrams = [
  {
    id: 'beispiel-aufwaermen',
    title: 'Dribbelgarten',
    type: 'Aufwärmen · Ballgewöhnung',
    meta: { players: '8–16 Spieler', field: '20 × 20 m', goals: 'keine Tore' },
    description: 'Alle Kinder dribbeln frei zwischen den Hütchen. Der Trainer ruft Aufgaben wie Tempo- und Richtungswechsel.',
    caption: 'Aufwärmen: Dribbelgarten – alle Kinder mit Ball',
    alt: 'Quadratisches Feld mit verteilten Hütchen, sechs Spieler dribbeln frei mit Ball.',
    data: {
      field: { w: 100, h: 100 },
      cones: [{ x: 20, y: 25 }, { x: 40, y: 60 }, { x: 55, y: 20 }, { x: 70, y: 70 }, { x: 30, y: 80 }, { x: 80, y: 40 }],
      players: [
        { team: 'black', n: 1, x: 10, y: 15 }, { team: 'black', n: 2, x: 30, y: 45 },
        { team: 'black', n: 3, x: 60, y: 35 }, { team: 'black', n: 4, x: 75, y: 60 },
        { team: 'black', n: 5, x: 45, y: 75 }, { team: 'black', n: 6, x: 85, y: 20 },
      ],
      balls: [{ x: 12, y: 17 }, { x: 32, y: 47 }, { x: 62, y: 37 }, { x: 77, y: 62 }, { x: 47, y: 77 }, { x: 87, y: 22 }],
      arrows: [
        { type: 'dribble', from: { x: 10, y: 15 }, to: { x: 25, y: 35 } },
        { type: 'dribble', from: { x: 60, y: 35 }, to: { x: 50, y: 55 } },
      ],
    },
  },
  {
    id: 'beispiel-passspiel',
    title: 'Passquadrat',
    type: 'Aufwärmen · Passspiel',
    meta: { players: '4–16 Spieler', field: '12 × 12 m', goals: 'keine Tore' },
    description: 'Pass zur nächsten Ecke, dem Ball folgen. Blau passt, läuft nach und übernimmt die neue Position.',
    caption: 'Passspiel: Passquadrat – Pass und dem Ball folgen',
    alt: 'Vier Spieler an den Ecken eines Quadrats, Pass zur nächsten Ecke mit Nachlaufen.',
    data: {
      field: { w: 100, h: 100 },
      cones: [{ x: 20, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 80 }, { x: 20, y: 80 }],
      players: [
        { team: 'black', n: 1, x: 20, y: 20 }, { team: 'black', n: 2, x: 80, y: 20 },
        { team: 'black', n: 3, x: 80, y: 80 }, { team: 'black', n: 4, x: 20, y: 80 },
      ],
      balls: [{ x: 23, y: 23 }],
      arrows: [
        { type: 'pass', from: { x: 20, y: 20 }, to: { x: 80, y: 20 } },
        { type: 'run', from: { x: 20, y: 24 }, to: { x: 76, y: 26 } },
      ],
    },
  },
  {
    id: 'beispiel-dribbling',
    title: '1 gegen 1',
    type: 'Übungsform · Dribbling',
    meta: { players: '2 pro Feld', field: '15 × 12 m', goals: '2 Hütchentore' },
    description: 'Blau dribbelt Koralle an und sucht den Durchbruch durch eines der beiden Hütchentore.',
    caption: 'Dribbling: 1 gegen 1 auf zwei Hütchentore',
    alt: 'Angreifer mit Ball gegen Verteidiger, zwei Hütchentore auf der rechten Grundlinie.',
    data: {
      field: { w: 100, h: 100 },
      cones: [{ x: 95, y: 20 }, { x: 95, y: 35 }, { x: 95, y: 65 }, { x: 95, y: 80 }],
      players: [{ team: 'black', n: 1, x: 15, y: 50 }, { team: 'white', n: 1, x: 80, y: 50 }],
      balls: [{ x: 18, y: 52 }],
      arrows: [
        { type: 'dribble', from: { x: 15, y: 50 }, to: { x: 70, y: 40 } },
        { type: 'run', from: { x: 80, y: 53 }, to: { x: 60, y: 48 } },
      ],
    },
  },
  {
    id: 'beispiel-torschuss',
    title: 'Torschuss',
    type: 'Übungsform · Torschuss',
    meta: { players: '8–16 Spieler', field: '25 × 20 m', goals: '1 Jugendtor' },
    description: 'Auf Trainerruf andribbeln und spätestens an der Schusslinie abschließen.',
    caption: 'Torschuss: Andribbeln und Abschluss mit Torwart',
    alt: 'Drei Starthütchen links, Schusslinie, Jugendtor mit Torwart rechts, Trainer am Rand.',
    data: {
      field: { w: 100, h: 100 },
      goals: [{ type: 'youth', x: 100, y: 50 }],
      cones: [{ x: 15, y: 25 }, { x: 15, y: 50 }, { x: 15, y: 75 }],
      lines: [{ from: { x: 60, y: 15 }, to: { x: 60, y: 85 }, style: 'dashed', label: 'Schusslinie' }],
      players: [
        { team: 'black', n: 1, x: 11, y: 25 }, { team: 'black', n: 2, x: 11, y: 50 },
        { team: 'black', n: 3, x: 11, y: 75 }, { team: 'gk', n: 0, x: 95, y: 50 },
        { team: 'coach', n: 0, x: 45, y: 6 },
      ],
      balls: [{ x: 14, y: 27 }],
      arrows: [
        { type: 'dribble', from: { x: 15, y: 25 }, to: { x: 55, y: 40 } },
        { type: 'shot', from: { x: 58, y: 42 }, to: { x: 96, y: 55 } },
      ],
    },
  },
  {
    id: 'beispiel-spielform',
    title: '3 gegen 3 mit Zielzone',
    type: 'Spielform · Umschalten',
    meta: { players: '6 Spieler', field: '25 × 20 m', goals: '4 Minitore' },
    description: 'Blau spielt in die Zielzone, Koralle verteidigt und versucht, den Ball zu erobern.',
    caption: 'Kleine Spielform: 3 gegen 3 auf vier Minitore mit Zielzone',
    alt: 'Zwei Dreierteams, vier Minitore, schraffierte Schusszonen an beiden Enden, neutraler Spieler.',
    data: {
      field: { w: 100, h: 100 },
      goals: [
        { type: 'mini', x: 0, y: 25 }, { type: 'mini', x: 0, y: 75 },
        { type: 'mini', x: 100, y: 25 }, { type: 'mini', x: 100, y: 75 },
      ],
      zones: [{ x: 80, y: 0, w: 20, h: 100, label: 'Zielzone' }],
      players: [
        { team: 'black', n: 1, x: 30, y: 30 }, { team: 'black', n: 2, x: 35, y: 60 }, { team: 'black', n: 3, x: 20, y: 50 },
        { team: 'white', n: 1, x: 60, y: 35 }, { team: 'white', n: 2, x: 68, y: 62 }, { team: 'white', n: 3, x: 75, y: 45 },
        { team: 'neutral', n: 0, x: 50, y: 8 },
      ],
      balls: [{ x: 37, y: 58 }],
      arrows: [
        { type: 'pass', from: { x: 35, y: 60 }, to: { x: 55, y: 70 } },
        { type: 'shot', from: { x: 60, y: 70 }, to: { x: 96, y: 74 } },
      ],
    },
  },
  {
    id: 'beispiel-abschlussspiel',
    title: 'Abschlussspiel',
    type: 'Abschlussspiel · Freies Spiel',
    meta: { players: '6–20 Spieler', field: '40 × 30 m', goals: '2 Jugendtore' },
    description: 'Freies Spiel auf zwei Tore mit Torhütern. Der Trainer coacht nur den Schwerpunkt.',
    caption: 'Abschlussspiel auf zwei Jugendtore mit Torhütern',
    alt: 'Halbfeld, zwei Teams, zwei Jugendtore mit Torhütern, Rotationspfeil an der Seitenlinie.',
    data: {
      field: { w: 100, h: 100 },
      goals: [{ type: 'youth', x: 0, y: 50 }, { type: 'youth', x: 100, y: 50 }],
      players: [
        { team: 'gk', n: 0, x: 5, y: 50 },
        { team: 'black', n: 1, x: 25, y: 30 }, { team: 'black', n: 2, x: 25, y: 70 }, { team: 'black', n: 3, x: 40, y: 50 },
        { team: 'white', n: 1, x: 60, y: 35 }, { team: 'white', n: 2, x: 60, y: 65 }, { team: 'white', n: 3, x: 75, y: 50 },
        { team: 'gk', n: 0, x: 95, y: 50 },
      ],
      balls: [{ x: 42, y: 52 }],
      arrows: [
        { type: 'pass', from: { x: 40, y: 50 }, to: { x: 25, y: 70 } },
        { type: 'rotation', from: { x: 30, y: 95 }, to: { x: 70, y: 95 } },
      ],
    },
  },
];
