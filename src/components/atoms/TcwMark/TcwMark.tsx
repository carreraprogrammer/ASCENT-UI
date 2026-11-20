import styles from './TcwMark.module.css';

// TCW-5: The Cyborg Way's mark (cut circle + violet square), for "a cromo by The Cyborg Way".
// INK and VIOLET come from the theme tokens (--ink, --violet).
export interface TcwMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const TcwMark = ({ size = 'md', className, label }: TcwMarkProps) => (
  <span className={[styles.tcwMark, styles[size], className ?? ''].filter(Boolean).join(' ')}>
    <svg viewBox="0 0 100 100" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path className={styles.ink} d="M89.95 48 A40 40 0 1 0 48 89.95 L48 48 Z" />
      <rect className={styles.violet} x="52" y="52" width="38" height="38" />
    </svg>
  </span>
);
