import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialogBehavior } from '../../../hooks/useDialogBehavior';
import styles from './CenteredModal.module.css';

interface BaseProps {
  isOpen: boolean;
  title: string;
  /** Línea mono bajo el título. */
  origin?: string;
  onClose: () => void;
  children: ReactNode;
}

export interface WizardModalProps extends BaseProps {
  variant: 'wizard';
  steps: Array<{ id: string; label: string }>;
  /** Índice 0-based del paso actual. */
  currentStep: number;
  onBack?: () => void;
  backLabel?: string;
  /** Sin onPrimary ni onBack no hay pie (el asistente trae sus propios botones en el cuerpo). */
  onPrimary?: () => void;
  primaryLabel?: string;
  primaryDisabled?: boolean;
}

export interface ConfirmModalProps extends BaseProps {
  variant: 'confirm';
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  /** Una línea sobre la consecuencia. */
  consequence: string;
}

export type CenteredModalProps = WizardModalProps | ConfirmModalProps;

/** Modal centrado único de escritorio: asistentes de varios pasos (680 px) y confirmaciones destructivas (420 px). */
export const CenteredModal = (props: CenteredModalProps) => {
  const { isOpen, title, origin, onClose, children } = props;
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const wizard = props.variant === 'wizard';
  useDialogBehavior({ isOpen, containerRef: ref, onClose, initialFocus: wizard ? undefined : '[data-autofocus]' });

  if (!isOpen) return null;
  return createPortal(
    <div className={styles.root}>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className={`${styles.box} ${wizard ? styles.wizard : styles.confirm}`}
        role={wizard ? 'dialog' : 'alertdialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid="centered-modal"
      >
        <header className={styles.header}>
          <div className={styles.headCopy}>
            <h2 id={titleId} className={styles.title}>{title}</h2>
            {origin ? <p className={styles.origin}>{origin}</p> : null}
          </div>
          <kbd className={styles.kbd}>Esc</kbd>
        </header>

        {props.variant === 'wizard' ? (
          <>
            <ol className={styles.steps} aria-label="Pasos">
              {props.steps.map((s, i) => {
                const state = i < props.currentStep ? 'done' : i === props.currentStep ? 'current' : 'pending';
                return (
                  <li key={s.id} className={styles.step} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
                    <span data-segment className={styles.segment} />
                    <span className={styles.stepName}>{s.label}</span>
                  </li>
                );
              })}
            </ol>
            <div className={styles.body}>{children}</div>
            {props.onPrimary || props.onBack ? (
              <footer className={styles.footer}>
                {props.onBack ? <button type="button" className={styles.back} onClick={props.onBack}>{props.backLabel ?? '← paso anterior'}</button> : null}
                <span className={styles.spacer} />
                {props.onPrimary ? <button type="button" className={styles.primary} onClick={props.onPrimary} disabled={props.primaryDisabled}>{props.primaryLabel}</button> : null}
              </footer>
            ) : null}
          </>
        ) : (
          <>
            <div className={styles.target}>{children}</div>
            <p className={styles.consequence} data-consequence>{props.consequence}</p>
            <footer className={styles.footer}>
              <span className={styles.spacer} />
              <button type="button" className={styles.cancel} data-autofocus onClick={onClose}>{props.cancelLabel}</button>
              <button type="button" className={styles.danger} data-tone="danger" onClick={props.onConfirm}>{props.confirmLabel}</button>
            </footer>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};
