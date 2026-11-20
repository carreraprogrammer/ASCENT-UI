import { Button } from '../../atoms/Button';
import { useDesktopLayout } from '../../../hooks/useDesktopLayout';
import { CenteredModal } from '../../organisms/CenteredModal';
import styles from './ConfirmModal.module.css';

export interface ConfirmModalProps { isOpen:boolean; title:string; message:string; confirmLabel?:string; cancelLabel?:string; onConfirm:()=>void; onCancel:()=>void; danger?:boolean; }

/** Móvil / Capacitor: la caja de siempre. Escritorio con acción destructiva (TCW-27): CenteredModal de confirmación (420 px). */
export const ConfirmModal=({isOpen,title,message,confirmLabel='Confirmar',cancelLabel='Cancelar',onConfirm,onCancel,danger}:ConfirmModalProps)=> {
  const desktop = useDesktopLayout();
  if (desktop && danger) {
    return (
      <CenteredModal isOpen={isOpen} variant="confirm" title={title} confirmLabel={confirmLabel} cancelLabel={cancelLabel}
        consequence="Esta acción no se puede deshacer." onConfirm={onConfirm} onClose={onCancel}>
        <span>{message}</span>
      </CenteredModal>
    );
  }
  return isOpen ? <div className={styles.backdrop} role='presentation' onClick={onCancel}><div role='dialog' aria-modal='true' className={styles.modal} onClick={(event)=>event.stopPropagation()}><h2 className={styles.title}>{title}</h2><p className={styles.message}>{message}</p><div className={styles.actions}><Button label={cancelLabel} variant='ghost' onClick={onCancel} /><Button label={confirmLabel} variant={danger?'danger':'primary'} onClick={onConfirm} /></div></div></div> : null;
};
