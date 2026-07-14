import { useEffect } from 'react';
import Button from './Button.jsx';

export default function BottomSheet({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="svs-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="svs-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="svs-sheet__handle" aria-hidden="true" />
        <div className="svs-sheet__header">
          <h2 className="svs-sheet__title">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Schließen">
            ✕
          </Button>
        </div>
        <div className="svs-sheet__body">{children}</div>
      </div>
    </>
  );
}
