import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { formatThousands, parseThousands } from '../../../utils/formatInput';
import styles from './SidePanel.module.css';

// TCW-27: la cifra grande del panel ES el campo editable. SidePanel (con `figure`) ofrece dos ranuras y el formulario
// de dentro (Transacción, Deuda) monta ahí su monto y su Concepto, en vez de repetirlos en su rejilla.

export interface PanelFigureContextValue {
  /** Etiqueta de la cifra (nombre accesible del campo). */
  label: string;
  /** Ranura de la cifra (input mono 34 px). Nula hasta que el panel se monta. */
  amountSlot: HTMLElement | null;
  /** Ranura bajo la cifra, a todo ancho (Concepto). */
  belowSlot: HTMLElement | null;
  /** El formulario avisa que se encarga de la cifra: el panel deja de pintar su valor estático. Devuelve la función que lo suelta. */
  claim: () => () => void;
}

export const PanelFigureContext = createContext<PanelFigureContextValue | null>(null);
export const usePanelFigure = () => useContext(PanelFigureContext);

export interface PanelFigureAmountProps {
  id: string;
  value: number | '';
  onChange: (value: number | '') => void;
  /** Signo como texto aparte ("−" Gasto, "+" Ingreso); sin signo para saldos. */
  sign?: string;
}

/** Cifra editable: mono 34 px, signo aparte, punto de miles al escribir. Solo dentro de un SidePanel con `figure`. */
export const PanelFigureAmount = ({ id, value, onChange, sign }: PanelFigureAmountProps) => {
  const fig = usePanelFigure();
  const claim = fig?.claim;
  useEffect(() => claim?.(), [claim]);
  if (!fig?.amountSlot) return null;
  const handle = (raw: string) => {
    // Un valor con decimales se conserva como número, igual que NumberInput.
    if (value !== '' && !Number.isInteger(value)) {
      const n = Number(raw.replace(/[^\d.]/g, ''));
      onChange(raw === '' || Number.isNaN(n) ? '' : n);
      return;
    }
    onChange(parseThousands(raw));
  };
  return createPortal(
    <div className={styles.figureField}>
      {sign ? <span className={styles.figureSign} aria-hidden="true">{sign}</span> : null}
      <input
        id={id}
        name={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={styles.figureInput}
        aria-label={fig.label}
        value={value === '' ? '' : formatThousands(value)}
        placeholder="0"
        onChange={(e) => handle(e.target.value)}
      />
    </div>,
    fig.amountSlot,
  );
};

export interface PanelFigureConceptProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Concepto sin etiqueta, a todo ancho, bajo la cifra. */
export const PanelFigureConcept = ({ id, value, onChange, placeholder }: PanelFigureConceptProps): ReactNode => {
  const fig = usePanelFigure();
  if (!fig?.belowSlot) return null;
  return createPortal(
    <input
      id={id}
      name={id}
      type="text"
      className={styles.figureConcept}
      aria-label="Concepto"
      value={value}
      placeholder={placeholder}
      required
      onChange={(e) => onChange(e.target.value)}
    />,
    fig.belowSlot,
  );
};
