import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface FullPageWorkspaceProps {
  open: boolean;
  onClose: () => void;
  title: string;
  details: string;
  children: ReactNode;
  className?: string;
}

export function FullPageWorkspace({ open, onClose, title, details, children, className = '' }: FullPageWorkspaceProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return createPortal(
    <dialog ref={dialogRef} className={`full-page-workspace legacy-tools ${className}`} aria-label={title} onClose={onClose}>
      <header className="full-page-workspace-header">
        <div className="full-page-workspace-heading">
          <h2>{title}</h2>
          <span>{details}</span>
        </div>
        <button type="button" className="icon-button" aria-label="關閉編輯視窗" onClick={onClose}><X size={22} /></button>
      </header>
      <div className="full-page-workspace-content">{children}</div>
    </dialog>, document.body,
  );
}
