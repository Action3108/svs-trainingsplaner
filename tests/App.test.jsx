import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../src/App.jsx';

describe('App', () => {
  it('zeigt den App-Titel', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /SV Schöning Trainingsplaner/i })
    ).toBeInTheDocument();
  });

  it('zeigt das Vereinslogo mit Alternativtext', () => {
    render(<App />);
    expect(
      screen.getByAltText(/Vereinslogo SV Schöning 1926 e\.V\./i)
    ).toBeInTheDocument();
  });
});
