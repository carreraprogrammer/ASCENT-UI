import { useCallback, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialogBehavior } from '../../../hooks/useDialogBehavior';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import { PanelFigureContext } from './PanelFigure';
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

  const [amountSlot, setAmountSlot] = useState<HTMLElement | null>(null);
  const [belowSlot, setBelowSlot] = useState<HTMLElement | null>(null);
  const [claims, setClaims] = useState(0);
  const claim = useCallback(() => {
    setClaims((n) => n + 1);
    return () => setClaims((n) => n - 1);
  }, []);
  const hasFigure = Boolean(figure);
  const figureLabel = figure?.label ?? '';
  const figureCtx = useMemo(
    () => (hasFigure ? { label: figureLabel, amountSlot, belowSlot, claim } : null),
    [hasFigure, figureLabel, amountSlot, belowSlot, claim],
  );

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
            <div className={styles.figureBlock}>
              <div className={styles.figure} data-testid="panel-figure">
                {claims > 0 ? null : <span className={styles.figureValue}>{figure.value}</span>}
                <div ref={setAmountSlot} />
                <span className={styles.figureLabel}>{figure.label}</span>
              </div>
              <div ref={setBelowSlot} />
            </div>
          ) : null}
          <PanelFigureContext.Provider value={figureCtx}>{children}</PanelFigureContext.Provider>
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
