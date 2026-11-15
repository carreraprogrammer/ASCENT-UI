import type { ButtonHTMLAttributes } from 'react';
import { BrandMark } from '../BrandMark';
import styles from './CyborgWayButton.module.css';

// The one primary action of the sign-in: violet fill, sentence case, the brand's mark (design system: Button).
export const CyborgWayButton = ({ className, ...props }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>) => (
  <button type="button" className={[styles.button, className].filter(Boolean).join(' ')} {...props}>
    <BrandMark size="sm" className={styles.mark} />
    <span>Continuar con The Cyborg Way</span>
  </button>
);
