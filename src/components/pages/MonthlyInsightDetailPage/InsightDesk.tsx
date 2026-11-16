import type { ReactNode } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { InstButton } from '../../atoms/Inst';
import { InstSection } from '../../molecules/Inst';
import styles from './InsightDesk.module.css';

// TCW-5 "Instrumento": piezas de escritorio que comparten Planes (mensual), el análisis nocturno y el anual.
// Solo presentación; la navegación es la misma de InsightTabBar (replace, para no apilar pestañas).

export type InsightTab = 'nocturno' | 'mensual' | 'anual';

const todayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/** Nocturno · Mensual · Anual: las mismas rutas que InsightTabBar. */
export const InsightTabs = ({ active, date, month, year }: { active: InsightTab; date?: string; month: number; year: number }) => {
  const history = useHistory();
  const to: Record<InsightTab, string> = {
    nocturno: `/analisis/${date ?? todayStr()}`,
    mensual: `/planes/${year}/${month}`,
    anual: `/años/${year}`,
  };
  return (
    <nav aria-label="Vista del análisis" className={styles.tabs}>
      {(['nocturno', 'mensual', 'anual'] as InsightTab[]).map((t, i) => (
        <span key={t}>
          {i > 0 ? <span aria-hidden="true" className={styles.sep}>·</span> : null}
          <button type="button" className={`${styles.tab} ${t === active ? styles.tabOn : ''}`}
            aria-current={t === active ? 'page' : undefined}
            onClick={() => { if (t !== active) history.replace(to[t]); }}>
            {t}
          </button>
        </span>
      ))}
    </nav>
  );
};

/** Enlace de texto con "›", con el router (sin recargar la página). */
export const RouterLink = ({ to, children }: { to: string; children: ReactNode }) =>
  <Link className={styles.link} to={to}>{children} ›</Link>;

/** La nota del coach: una cita y su procedencia, sin tarjeta. */
export const CoachLine = ({ body, meta }: { body: string; meta: string[] }) => (
  <InstSection title="Nota del coach">
    <div className={styles.quoteBox}>
      <p className={styles.quote}>{body}</p>
      {meta.length ? <p className={styles.meta}>{meta.join(' · ')}</p> : null}
    </div>
  </InstSection>
);

/** La propuesta / el siguiente paso: título, texto y la acción de siempre. */
export const NextStep = ({ title, heading, body, action, onAction }: {
  title: string; heading: string; body: string; action: string; onAction: () => void;
}) => (
  <InstSection title={title}>
    <div className={styles.next}>
      <div>
        <p className={styles.nextTitle}>{heading}</p>
        <p className={styles.nextBody}>{body}</p>
      </div>
      <InstButton onClick={onAction}>{action} ›</InstButton>
    </div>
  </InstSection>
);

/** "Por qué te dije esto": el razonamiento del agente, en línea. */
export const Reasoning = ({ text }: { text: string }) => (
  <InstSection title="Por qué te dije esto">
    <div className={styles.quoteBox}><p className={styles.reason}>{text}</p></div>
  </InstSection>
);
