import styles from './BrandMark.module.css';

// TCW-1: Ascent is a cromo of The Cyborg Way, so its mark is the brand's: two circles, the solid one is the human
// and the dashed one the machine; the lens where they overlap is the only part in colour (violet). Inline SVG
// with the tokens, so it follows the theme. From 48 px up it blinks with a pupil every 30 s; below, it only blinks.
// Nothing moves with reduced motion. `variant` is kept for the callers: both draw the same mark.
export interface BrandMarkProps {
  variant?: 'principal' | 'monoline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const BrandMark = ({ size = 'md', className, label }: BrandMarkProps) => (
  <span className={[styles.brandMark, styles[size], className ?? ''].filter(Boolean).join(' ')}>
    <svg viewBox="0 0 100 100" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path className={styles.lens} d="M50 24.7 A28 28 0 0 1 50 75.3 A28 28 0 0 1 50 24.7 Z" />
      {size === 'lg' && <circle className={styles.pupil} cx="50" cy="50" r="6.5" />}
      <circle className={styles.ring} cx="38" cy="50" r="28" />
      <circle className={`${styles.ring} ${styles.machine}`} cx="62" cy="50" r="28" />
    </svg>
  </span>
);
