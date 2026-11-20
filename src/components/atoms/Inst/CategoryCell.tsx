import type { CSSProperties } from 'react';
import { IonIcon } from '@ionic/react';
import { helpCircleOutline } from 'ionicons/icons';
import { resolveNamedIcon } from '../../organisms/BudgetWizard/iconRegistry';
import styles from './Inst.module.css';

// TCW-5: pieza compartida de escritorio para gaveta + categoría. Mismo criterio que TransactionSlidingCard (móvil):
// color var(--color-<code>), icono resolveNamedIcon(subcategoryIcon ?? categoryIcon). El llamador pasa `icon` ya
// resuelto con ese ??. El nombre de la gaveta siempre se escribe: el color no es la única señal.
export interface CategoryCellProps {
  code?: string | null;
  gavetaName?: string | null;
  subcategoryName?: string | null;
  icon?: string | null;
  income?: boolean;
}

export const CategoryCell = ({ code, gavetaName, subcategoryName, icon, income }: CategoryCellProps) => {
  const unclassified = !income && !code;
  const color = income ? 'var(--color-income)' : `var(--color-${code ?? 'unknown'})`;
  const first = subcategoryName || gavetaName;
  return (
    <span className={styles.catCell} style={{ '--cat-color': color } as CSSProperties}>
      <span className={styles.catBox}>
        <IonIcon aria-hidden="true" icon={unclassified ? helpCircleOutline : resolveNamedIcon(icon)} className={styles.catIcon} />
      </span>
      <span className={styles.catText}>
        <span className={styles.catSub}>{first || 'por clasificar'}</span>
        {subcategoryName && gavetaName ? <span className={styles.catGaveta}>{gavetaName}</span> : null}
      </span>
    </span>
  );
};
