import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  IonContent,
  IonModal,
} from '@ionic/react';
import { useDesktopLayout } from '../../../hooks/useDesktopLayout';
import { SidePanel } from '../../organisms/SidePanel';
import './CrudModal.css';

export interface CrudModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  /** Solo escritorio (panel lateral): línea mono con el origen del dato, cifra principal y pie de acciones. */
  origin?: string;
  figure?: { label: string; value: string };
  onSubmit?: () => void;
  onDelete?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  deleteLabel?: string;
}

/** Los composers traen su propio pie (Cancelar / guardar). En el panel el pie es el del panel: este helper acciona el botón principal del composer. */
export const triggerComposerSubmit = (): void => {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-composer-actions] button');
  buttons[buttons.length - 1]?.click();
};

/** Cancelar del panel: acciona el "Cancelar" del composer (que limpia el formulario y cierra); sin composer, cierra. */
const triggerComposerCancel = (fallback: () => void) => (): void => {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-composer-actions] button');
  if (buttons.length > 1) buttons[0].click();
  else fallback();
};

/** Escritorio (>= 1024 px, no Capacitor): panel lateral. Móvil y Capacitor: la hoja IonModal de siempre. */
export const CrudModal = ({
  isOpen, title, subtitle, children, onClose, origin, figure, onSubmit, onDelete, submitLabel, cancelLabel, deleteLabel,
}: CrudModalProps) => {
  const desktop = useDesktopLayout();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [composerLabel, setComposerLabel] = useState<string | null>(null);
  // Si el contenido es un composer (trae su propio pie), el pie del panel acciona su botón principal.
  useEffect(() => {
    if (!desktop || !isOpen) return;
    const buttons = bodyRef.current?.querySelectorAll<HTMLButtonElement>('[data-composer-actions] button');
    const label = buttons && buttons.length ? buttons[buttons.length - 1].textContent?.trim() ?? null : null;
    setComposerLabel((current) => (current === label ? current : label));
  });
  if (desktop) {
    const wired = onSubmit ?? (composerLabel ? triggerComposerSubmit : undefined);
    return (
      <SidePanel
        isOpen={isOpen}
        title={title}
        origin={origin}
        figure={figure}
        onClose={onClose}
        onSubmit={wired}
        onDelete={onDelete}
        onCancel={composerLabel ? triggerComposerCancel(onClose) : undefined}
        submitLabel={submitLabel ?? composerLabel ?? undefined}
        cancelLabel={cancelLabel}
        deleteLabel={deleteLabel}
      >
        <div ref={bodyRef}>{children}</div>
      </SidePanel>
    );
  }
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="crud-modal">
      <IonContent className="crud-modal__content">
        <div className="crud-modal__shell">
          <div className="crud-modal__topbar">
            <div className="crud-modal__copy">
              <span className="crud-modal__eyebrow">Ascent</span>
              <h2 className="crud-modal__title">{title}</h2>
              {subtitle ? <p className="crud-modal__subtitle">{subtitle}</p> : null}
            </div>
            <button type="button" className="crud-modal__close" onClick={onClose}>
              Cerrar
            </button>
          </div>
          <div className="crud-modal__body">{children}</div>
        </div>
      </IonContent>
    </IonModal>
  );
};
