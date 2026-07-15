import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../src/App.jsx';

// Tests laufen offline: fetch schlägt fehl → App nutzt Cache/Fallback.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
  localStorage.clear();
});

describe('App', () => {
  it('zeigt den App-Titel', async () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /SV Schöning Trainingsplaner/i })
    ).toBeInTheDocument();
    await screen.findByText(/eingebaute Beispielübungen/i); // Ladevorgang abschließen lassen
  });

  it('zeigt das Vereinslogo mit Alternativtext', async () => {
    render(<App />);
    expect(
      screen.getByAltText(/Vereinslogo SV Schöning 1926 e\.V\./i)
    ).toBeInTheDocument();
    await screen.findByText(/eingebaute Beispielübungen/i); // Ladevorgang abschließen lassen
  });

  it('zeigt offline ohne Cache den Fallback-Hinweis', async () => {
    render(<App />);
    expect(
      await screen.findByText(/eingebaute Beispielübungen/i)
    ).toBeInTheDocument();
  });
});
