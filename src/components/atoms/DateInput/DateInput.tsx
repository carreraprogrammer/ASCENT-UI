import styles from './DateInput.module.css';
import { getFieldA11yState } from '../fieldA11y';
import { formatDateShort } from '../../../utils/formatInput';
export interface DateInputProps { name:string; label?:string; value:string; onChange:(value:string)=>void; error?:string; hint?:string; disabled?:boolean; required?:boolean; min?:string; max?:string; format?:'date'|'datetime-local'; placeholder?:string; }
export const DateInput=({name,label,value,onChange,error,hint,disabled,required,min,max,format='date',placeholder}:DateInputProps)=> {
  const fieldA11y=getFieldA11yState({ name, error, hint });
  const isDate = format==='date';
  return (
    <div className={styles.wrapper}>
      {label ? <label htmlFor={name} className={`${styles.label} ${required ? styles.required : ''}`.trim()}>{label}</label> : null}
      <div className={styles.field}>
        {isDate ? <span data-testid="date-display" className={styles.display} aria-hidden="true">{formatDateShort(value) || placeholder || ''}</span> : null}
        <input id={name} name={name} type={format} className={`${styles.input} ${isDate ? styles.native : ''} ${error ? styles.errorInput : ''}`.trim()} value={value} onChange={(e)=>onChange(e.target.value)} disabled={disabled} required={required} min={min} max={max} aria-invalid={fieldA11y.invalid} aria-describedby={fieldA11y.describedBy} />
      </div>
      {error ? <p id={fieldA11y.errorId} className={styles.error}>{error}</p> : hint ? <p id={fieldA11y.hintId} className={styles.hint}>{hint}</p> : null}
    </div>
  );
};
