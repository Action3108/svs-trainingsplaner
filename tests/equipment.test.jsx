import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EquipmentList, { mergeEquipment } from '../src/components/ui/EquipmentList.jsx';

describe('mergeEquipment (Materialzusammenfassung, 2026-07-18)', () => {
  it('behält je Materialart nur die höchste Anforderung', () => {
    expect(mergeEquipment(['4 Bälle', '1 Ball pro Kind'])).toEqual(['1 Ball pro Kind']);
    expect(mergeEquipment(['4 Hütchen', '10 Hütchen', '3 Starthütchen'])).toEqual(['10 Hütchen']);
    expect(mergeEquipment(['1 Ball', 'viele Bälle'])).toEqual(['viele Bälle']);
  });

  it('trennt Minitore von Jugend-/Großtoren', () => {
    expect(mergeEquipment(['4 Minitore', '2 Jugendtore'])).toEqual([
      '4 Minitore',
      '2 Jugendtore',
    ]);
  });

  it('lässt unbekanntes Material unverändert und entfernt exakte Doppler', () => {
    expect(mergeEquipment(['Koordinationsleiter', 'Koordinationsleiter', 'Leibchen'])).toEqual([
      'Koordinationsleiter',
      'Leibchen',
    ]);
  });

  it('rendert zusammengefasste Chips mit Volltext im title-Attribut', () => {
    render(<EquipmentList items={['4 Bälle', '1 Ball pro Kind', '10 Hütchen']} merge />);
    expect(screen.getByTitle('1 Ball pro Kind')).toBeInTheDocument();
    expect(screen.getByTitle('10 Hütchen')).toBeInTheDocument();
    expect(screen.queryByTitle('4 Bälle')).not.toBeInTheDocument();
  });

  it('rendert ohne merge alle Einträge einzeln', () => {
    render(<EquipmentList items={['4 Bälle', '1 Ball pro Kind']} />);
    expect(screen.getByTitle('4 Bälle')).toBeInTheDocument();
    expect(screen.getByTitle('1 Ball pro Kind')).toBeInTheDocument();
  });
});
