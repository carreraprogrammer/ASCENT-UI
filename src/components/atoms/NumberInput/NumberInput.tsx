import { useState } from 'react'; import styles from './NumberInput.module.css';
import { getFieldA11yState } from '../fieldA11y';
import { formatThousands, parseThousands } from '../../../utils/formatInput';
import { useDesktopLayout } from '../../../hooks/useDesktopLayout';
export interface NumberInputProps { name:string; label?:string; value:number|''; onChange:(value:number|'')=>void; error?:string; hint?:string; min?:number; max?:number; step?:number; disabled?:boolean; required?:boolean; prefix?:string; suffix?:string; format?:'decimal'|'integer'|'currency'; }
// TCW-27: el monto con punto de miles y fuente mono solo aplica en escritorio (web >= 1024 px). Móvil y Capacitor conservan Intl y el parseo de siempre.
export const NumberInput=({name,label,value,onChange,error,hint,min,max,step,disabled,required,prefix,suffix,format='decimal'}:NumberInputProps)=>{
  const desktop=useDesktopLayout();
  const [internalError,setInternalError]=useState('');
  const isCurrency=format==='currency';
  const display=value === '' ? '' : isCurrency ? (desktop ? formatThousands(value) : new Intl.NumberFormat().format(value)) : String(value);
  const merged=error || internalError;
  const fieldA11y=getFieldA11yState({ name, error: merged, hint });
  const unit=desktop ? styles.unit : undefined;
  const handleChange=(raw:string)=>{
    if(!isCurrency || !desktop){ onChange(raw==='' ? '' : Number(raw.replace(/,/g,''))); return; }
    if(value!=='' && !Number.isInteger(value)){ const n=Number(raw.replace(/[^\d.]/g,'')); onChange(raw==='' || Number.isNaN(n) ? '' : n); return; }
    onChange(parseThousands(raw));
  };
  return <div className={styles.wrapper}>{label ? <label htmlFor={name} className={`${styles.label} ${required ? styles.required : ''}`.trim()}>{label}</label> : null}<div className={styles.row}>{prefix ? <span className={unit}>{prefix}</span> : null}<input id={name} name={name} type={isCurrency ? 'text' : 'number'} className={`${styles.input} ${isCurrency && desktop ? styles.mono : ''} ${merged ? styles.errorInput : ''}`.trim()} value={display} onChange={(e)=>handleChange(e.target.value)} onBlur={()=>{ if(value!=='' && min!==undefined && value<min) setInternalError(`El valor mínimo es ${min}`); else if(value!=='' && max!==undefined && value>max) setInternalError(`El valor máximo es ${max}`); else setInternalError(''); }} min={isCurrency ? undefined : min} max={isCurrency ? undefined : max} step={isCurrency ? undefined : (step ?? (format==='integer'?1:undefined))} disabled={disabled} required={required} aria-invalid={fieldA11y.invalid} aria-describedby={fieldA11y.describedBy} />{suffix ? <span className={unit}>{suffix}</span> : null}</div>{merged ? <p id={fieldA11y.errorId} className={styles.error}>{merged}</p> : hint ? <p id={fieldA11y.hintId} className={styles.hint}>{hint}</p> : null}</div>;
};
