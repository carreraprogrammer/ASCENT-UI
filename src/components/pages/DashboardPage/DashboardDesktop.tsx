import { useState, type ReactNode } from 'react';
import { useHistory } from 'react-router-dom';
import { Bar, DateCell, Eyebrow, InstButton, InstLink, Num, OriginTag, StateTag, Sub } from '../../atoms/Inst';
import { InstBand, InstNote, InstPageHeader, InstSection, InstTable, InstTableSkeleton, type Align } from '../../molecules/Inst';
import { financeService } from '../../../services/financeService';
import { resolveTransactionCategory, type CategoryLookupItem } from '../../../utils/financeBehavior';
import { fmtAmount, fmtDay, fmtSigned, originOf } from '../../../utils/instrumento';
import type { SummaryResponse, Transaction } from '../../../types/finance.types';
import styles from './DashboardDesktop.module.css';

// TCW-5 "Instrumento": el Dashboard de escritorio (mockup U_AscentDashboard). Mismos datos, cálculos y acciones
// que el árbol móvil (DashboardContent); cambia la presentación. "Tu ascenso" es el componente real de siempre
// (AscentWidget: montaña, escalador, etapas y animaciones), sin redibujar (comment-90).

export interface DeskOblItem { id: number | string; covered_amount: number; expected_amount: number }

const GAVETA: Record<string, string> = {
  committed: 'Comprometido', necessary: 'Necesario', discretionary: 'Flexible', investment: 'Inversión', social: 'Social', income: 'Ingreso',
};

const longToday = (): string => {
  const s = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/,/gu, '');
};

const MOV_HEADS = ['Fecha', 'Movimiento', 'Gaveta · categoría', 'Origen', 'Estado', 'Monto (COP)'];
const MOV_ALIGN: Align[] = ['left', 'left', 'left', 'left', 'left', 'right'];

const movRow = (tx: Transaction, lookup: Record<string, CategoryLookupItem>): ReactNode[] => {
  const a = tx.attributes;
  const income = a.transaction_type === 'income';
  const cat = resolveTransactionCategory(tx, lookup);
  const gaveta = income ? 'Ingreso' : (GAVETA[a.category_type ?? ''] ?? (cat.categoryType !== 'unknown' ? cat.categoryName : null));
  const where = gaveta ? [gaveta, cat.subcategoryName].filter(Boolean).join(' · ') : 'Sin clasificar';
  return [
    <DateCell>{fmtDay(a.date)}</DateCell>,
    <span className={styles.mov}>{a.concept || a.product || '—'}</span>,
    <Sub>{where}</Sub>,
    <OriginTag origin={originOf(a)} />,
    <StateTag state={a.status === 'pending' ? 'pendiente' : 'confirmado'} />,
    <Num strong tone={income ? 'ok' : undefined}>{fmtSigned(a.amount, income)}</Num>,
  ];
};

export const DashboardDesktop = ({
  greeting, summary, loading, error, onRetry, pending, recent, lookup, onReload,
  health, statusLabel, ascent, oblItems, burn, onOpenFlow, onOpenObligations,
}: {
  greeting: string;
  summary: SummaryResponse | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  pending: Transaction[];
  recent: Transaction[];
  lookup: Record<string, CategoryLookupItem>;
  onReload: () => void;
  health: string | null;
  statusLabel: string;
  /** TCW-5 comment-90: the real 'Tu ascenso' (mountain, climber, stages, animations), unchanged. */
  ascent: ReactNode;
  oblItems: DeskOblItem[];
  burn: { daily: number; sufficient: boolean } | null;
  onOpenFlow: () => void;
  onOpenObligations: () => void;
}) => {
  const history = useHistory();
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // "Confirmar todo": la confirmación existente, una por fila.
  const confirmAll = async () => {
    setConfirming(true);
    setConfirmError(null);
    try {
      for (const tx of pending) await financeService.confirmTransaction(tx.id);
    } catch {
      setConfirmError('No se pudieron confirmar todos los movimientos.');
    } finally {
      setConfirming(false);
      onReload();
    }
  };

  const header = <InstPageHeader title={greeting} sub={longToday()} />;
  if (loading && !summary) {
    return (
      <div className={styles.page}>
        {header}
        <InstSection title="Lo último"><InstTableSkeleton heads={MOV_HEADS} aligns={MOV_ALIGN} rows={3} /></InstSection>
      </div>
    );
  }
  if (error || !summary) {
    return (
      <div className={styles.page}>
        {header}
        <InstNote error onRetry={onRetry}>{error ?? 'No hay datos del mes todavía.'}</InstNote>
      </div>
    );
  }

  const paid = oblItems.filter((i) => i.covered_amount > 0).length;
  const falta = oblItems.filter((i) => i.covered_amount === 0).reduce((s, i) => s + i.expected_amount, 0);
  const latest = recent.filter((t) => t.attributes.status !== 'pending').slice(0, 3);
  const dot = health === 'comfortable' ? styles.dotOk : health === 'warning' ? styles.dotWarn : health === 'critical' ? styles.dotBad : styles.dotOff;

  return (
    <div className={styles.page}>
      {header}

      <InstBand>
        <span className={`${styles.dot} ${dot}`} aria-hidden="true" />
        <span>{statusLabel}</span>
        <span className={styles.flex} />
        <InstLink onClick={onOpenFlow}>Ver análisis</InstLink>
      </InstBand>

      <div className={styles.grid}>
        <div className={styles.left}>{ascent}</div>

        <div className={styles.right}>
          <Eyebrow>Ritmo diario</Eyebrow>
          {burn ? (
            <>
              <div className={styles.rate}><span className={styles.rateVal}>{fmtAmount(burn.daily)}</span><span className={styles.rateUnit}> COP / día</span></div>
              {/* "¿De dónde sale?" en línea, con los mismos valores que la explicación de siempre. */}
              <div className={styles.calc}><span>Gastos necesarios</span><span className={styles.calcV}>últimos 30 días</span></div>
              <div className={styles.calc}><span>÷ Días</span><span className={styles.calcV}>30</span></div>
              <div className={styles.calc}><span>Pagos fijos</span><span className={styles.calcV}>no entran</span></div>
              <div className={`${styles.calc} ${styles.calcTotal}`}><span>= Ritmo diario</span><span className={styles.calcV}>{fmtAmount(burn.daily)}</span></div>
              {!burn.sufficient ? <p className={styles.calcNote}>Menos de 14 días de historial: por ahora es un estimado de 30.000 / día.</p> : null}
            </>
          ) : <p className={styles.calcNote}>Sin datos de flujo todavía.</p>}

          {oblItems.length ? (
            <>
              <div className={styles.oblHead}><Eyebrow>Obligaciones</Eyebrow><InstLink onClick={onOpenObligations}>Ver todo</InstLink></div>
              <div className={styles.oblRow}>
                <span className={styles.oblPaid}>{paid} de {oblItems.length} pagadas</span>
                <span className={styles.oblLeft}>faltan {fmtAmount(falta)}</span>
              </div>
              <Bar pct={(paid / oblItems.length) * 100} label="Obligaciones pagadas" />
            </>
          ) : null}
        </div>
      </div>

      {pending.length ? (
        <InstSection id="dash-pending" title={`Por revisar · ${pending.length}`}
          right={<><InstButton onClick={() => void confirmAll()} disabled={confirming}>{confirming ? 'Confirmando…' : 'Confirmar todo'}</InstButton>
            <InstLink onClick={() => history.push('/transactions?status=pending')}>Abrir bandeja</InstLink></>}>
          {confirmError ? <InstNote error>{confirmError}</InstNote> : null}
          <InstTable heads={MOV_HEADS} aligns={MOV_ALIGN} rows={pending.map((t) => movRow(t, lookup))} rowKeys={pending.map((t) => t.id)} />
        </InstSection>
      ) : null}

      <InstSection id="dash-latest" title="Lo último" right={<InstLink onClick={() => history.push('/transactions')}>Ver todo</InstLink>}>
        {latest.length
          ? <InstTable heads={MOV_HEADS} aligns={MOV_ALIGN} rows={latest.map((t) => movRow(t, lookup))} rowKeys={latest.map((t) => t.id)} />
          : <InstNote>Todavía no hay movimientos este mes.</InstNote>}
      </InstSection>
    </div>
  );
};
