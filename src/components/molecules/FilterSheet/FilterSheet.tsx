import type { ReactNode } from 'react';
import { Button } from '../../atoms/Button';
import { SheetModal } from '../SheetModal';
import { useDesktopLayout } from '../../../hooks/useDesktopLayout';
import styles from './FilterSheet.module.css';

export interface FilterSheetProps {
  isOpen: boolean;
  title: string;
  resultLabel: string;
  children: ReactNode;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
}

export const FilterSheet = ({
  isOpen,
  title,
  resultLabel,
  children,
  onClose,
  onReset,
  onApply,
}: FilterSheetProps) => {
  // TCW-27: en escritorio los filtros son chips con el Menu compartido; la hoja es solo de móvil y Capacitor.
  const desktop = useDesktopLayout();
  if (desktop) return null;
  return (
  <SheetModal isOpen={isOpen} title={title} onClose={onClose} height="tall">
    <div className={styles.content}>
      <div className={styles.body}>{children}</div>
      <div className={styles.footer}>
        <Button label="Reset" variant="ghost" onClick={onReset} />
        <Button label={resultLabel} onClick={onApply} />
      </div>
    </div>
  </SheetModal>
  );
};
