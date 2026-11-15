import { BrandMark } from '../BrandMark';
import styles from './CromoSeal.module.css';

// "a cromo by The Cyborg Way": Ascent's seal in the sign-in and the footer (TCW-1).
export const CromoSeal = ({ className }: { className?: string }) => (
  <a className={[styles.seal, className].filter(Boolean).join(' ')} href="https://thecyborgway.dev" target="_blank" rel="noreferrer">
    <BrandMark size="sm" className={styles.mark} />
    <span>a cromo by <strong>The Cyborg Way</strong></span>
  </a>
);
