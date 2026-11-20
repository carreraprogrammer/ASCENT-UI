import styles from './BrandMark.module.css';

// TCW-5: Ascent's mark, "la esquina violeta": two ink triangles and a violet square. INK and VIOLET come from the
// theme tokens (--ink, --violet), so the mark follows light and dark. `variant` is kept for the callers.
export interface BrandMarkProps {
  variant?: 'principal' | 'monoline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const BrandMark = ({ size = 'md', className, label }: BrandMarkProps) => (
  <span className={[styles.brandMark, styles[size], className ?? ''].filter(Boolean).join(' ')}>
    <svg viewBox="0 0 100 100" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path className={styles.ink} d="M52 48 L90 10 L90 48 Z" />
      <path className={styles.ink} d="M10 90 L48 52 L48 90 Z" />
      <rect className={styles.violet} x="52" y="52" width="38" height="38" />
    </svg>
  </span>
);
