/**
 * Koordinaten-Skalierung: Daten bleiben 0–100 auf beiden Achsen,
 * gerendert wird im 16:10-Format (viewBox 100 × 62,5).
 */
export const VB_W = 100;
export const VB_H = 62.5;
export const sy = (y) => y * (VB_H / 100);
