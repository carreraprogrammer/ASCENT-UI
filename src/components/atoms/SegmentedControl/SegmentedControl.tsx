import { useRef } from 'react';
import styles from './SegmentedControl.module.css';

export interface SegmentedOption { value: string; label: string }
export interface SegmentedControlProps {
  name: string;
  label: string;
  value: string | null;
  options: SegmentedOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

/** Control segmentado con texto para 2-3 valores (patrón radiogroup). */
export const SegmentedControl = ({ name, label, value, options, onChange, disabled, required }: SegmentedControlProps) => {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const checkedIdx = options.findIndex((o) => o.value === value);
  const move = (from: number, dir: 1 | -1) => {
    const next = (from + dir + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div className={styles.wrapper}>
      <span id={`${name}-label`} className={`${styles.label} ${required ? styles.required : ''}`.trim()}>{label}</span>
      <div role="radiogroup" aria-labelledby={`${name}-label`} aria-required={required || undefined} className={styles.group}>
        {options.map((o, i) => {
          const checked = o.value === value;
          return (
            <button
              key={o.value}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="radio"
              name={name}
              aria-checked={checked}
              disabled={disabled}
              tabIndex={checked || (checkedIdx < 0 && i === 0) ? 0 : -1}
              className={`${styles.option} ${checked ? styles.checked : ''}`.trim()}
              onClick={() => { if (!disabled) onChange(o.value); }}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(i, 1); }
                else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(i, -1); }
              }}
            >{o.label}</button>
          );
        })}
      </div>
    </div>
  );
};
