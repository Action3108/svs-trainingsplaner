import { useEffect, useRef } from 'react';
import Button from './Button.jsx';

export default function Dialog({ open, title, onClose, actions, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog className="svs-dialog" ref={ref} onClose={onClose} aria-labelledby="svs-dialog-title">
      <h2 className="svs-dialog__title" id="svs-dialog-title">
        {title}
      </h2>
      {children}
      <div className="svs-dialog__actions">
        {actions ?? (
          <Button variant="secondary" onClick={onClose}>
            Schließen
          </Button>
        )}
      </div>
    </dialog>
  );
}
