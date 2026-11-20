import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialogBehavior } from '../../../hooks/useDialogBehavior';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import styles from './SidePanel.module.css';

export interface SidePanelProps {
  isOpen: boolean;
  title: string;
  /** Línea mono de 11 px con el origen del dato; se omite si no existe. */
  origin?: string;
  /** Cifra principal en mono de 34 px con su etiqueta. */
  figure?: { label: string; value: string };
  children: ReactNode;
  onClose: () => void;
  /** Sin onSubmit no hay pie con acciones. */
  onSubmit?: () => void;
  /** El botón de eliminar solo existe si se pasa. */
  onDelete?: () => void;
  /** Acción del botón Cancelar (por defecto onClose); p. ej. para que el formulario se limpie antes de cerrar. */
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  deleteLabel?: string;
}

/** Panel lateral único de escritorio (>= 1024 px): reemplaza a CrudModal. */
export const SidePanel = ({
  isOpen, title, origin, figure, children, onClose, onSubmit, onDelete, onCancel,
  submitLabel = 'Guardar', cancelLabel = 'Cancelar', deleteLabel = 'Eliminar',
}: SidePanelProps) => {
  const ref = useRef<HTMLElement>(null);
  const titleId = useId();
  const reduced = usePrefersReducedMotion();
  useDialogBehavior({ isOpen, containerRef: ref, onClose, onSubmit });

  if (!isOpen) return null;
  return createPortal(
    <div className={styles.root}>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <aside
        ref={ref}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid="side-panel"
        data-reduced-motion={reduced ? 'true' : 'false'}
      >
        <header className={styles.header}>
          <div className={styles.headCopy}>
            <h2 id={titleId} className={styles.title}>{title}</h2>
            {origin ? <p className={styles.origin}>{origin}</p> : null}
          </div>
          <kbd className={styles.kbd}>Esc</kbd>
        </header>
        <div className={styles.body}>
          {figure ? (
            <div className={styles.figure}>
              <span className={styles.figureValue}>{figure.value}</span>
              <span className={styles.figureLabel}>{figure.label}</span>
            </div>
          ) : null}
          {children}
        </div>
        {onSubmit ? (
          <footer className={styles.footer}>
            {onDelete ? <button type="button" className={styles.delete} data-tone="danger" onClick={onDelete}>{deleteLabel}</button> : null}
            <span className={styles.spacer} />
            <button type="button" className={styles.cancel} onClick={onCancel ?? onClose}>{cancelLabel}</button>
            <button type="button" className={styles.primary} onClick={onSubmit}>
              {submitLabel}<kbd className={styles.hint}>⌘↵</kbd>
            </button>
          </footer>
        ) : null}
      </aside>
    </div>,
    document.body,
  );
};
