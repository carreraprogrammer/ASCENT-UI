import type { ButtonHTMLAttributes } from 'react';
import styles from './GoogleButton.module.css';

export interface GoogleButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  label?: string;
}

// Google's "G" keeps Google's own colours (its brand guidelines): it is a file in public/, not app colours.
const GoogleIcon = () => <img aria-hidden="true" alt="" className={styles.icon} src="/icons/google-g.svg" />;

export const GoogleButton = ({ label = 'Continuar con Google', className, disabled, ...props }: GoogleButtonProps) => (
  <button type="button" className={[styles.button, className].filter(Boolean).join(' ')} disabled={disabled} {...props}>
    <span className={styles.content}>
      <GoogleIcon />
      <span>{label}</span>
    </span>
  </button>
);
