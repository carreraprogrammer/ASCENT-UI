import { useState, type ReactNode } from 'react';
import { useHistory } from 'react-router-dom';
import { Climber } from '../../atoms/Climber';
import { Bar, DateCell, Eyebrow, InstButton, InstLink, Num, OriginTag, StateTag, Sub } from '../../atoms/Inst';
import { InstBand, InstNote, InstPageHeader, InstSection, InstTable, InstTableSkeleton, type Align } from '../../molecules/Inst';
import { financeService } from '../../../services/financeService';
import { resolveTransactionCategory, type CategoryLookupItem } from '../../../utils/financeBehavior';
import { fmtAmount, fmtDay, fmtSigned, originOf } from '../../../utils/instrumento';
import type { SummaryResponse, Transaction } from '../../../types/finance.types';
import styles from './DashboardDesktop.module.css';

// TCW-5 "Instrumento": el Dashboard de escritorio (mockup U_AscentDashboard). Mismos datos, cálculos y acciones
// que el árbol móvil (DashboardContent); cambia la presentación. La montaña, el escalador y las cuatro etapas se
// conservan (regla 8 del lenguaje).

export interface DeskStage {
  id: string; label: string; hint: string; target: number | null; current: number | null;
  locked?: boolean; skipped?: boolean; progressKnown?: boolean; unknownValue?: number; unknownLabel?: string;
}
export interface DeskOblItem { id: number | string; covered_amount: number; expected_amount: number }

const GAVETA: Record<string, string> = {
  committed: 'Comprometido', necessary: 'Necesario', discretionary: 'Flexible', investment: 'Inversión', social: 'Social', income: 'Ingreso',
};

const compact = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
};

const longToday = (): string => {
  const s = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/,/gu, '');
};

// La montaña del mockup: viewBox 620×236, pico en (310,28), base en (37,217) y (595,217).
const W = 620, H = 236, BASE = { x: 37, y: 217 }, PEAK = { x: 310, y: 28 };

const Mountain = ({ progress, top, pct, onOpen }: { progress: number; top: string; pct: number | null; onOpen: () => void }) => {
  const p = Math.max(0, Math.min(1, progress));
  const at = { x: BASE.x + (PEAK.x - BASE.x) * p, y: BASE.y - (BASE.y - PEAK.y) * p };
  return (
    <button type="button" className={styles.mtnBox} onClick={onOpen} aria-label="Ver tu ascenso">
      <span className={styles.mtnStage}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.mtnSvg} aria-hidden="true">
          <defs>
            <linearGradient id="inst-peak" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className={styles.peakTop} />
              <stop offset="1" className={styles.peakBottom} />
            </linearGradient>
          </defs>
          {[170, 123, 76, 28].map((y) => <line key={y} x1="12" x2="608" y1={y} y2={y} className={styles.tick} />)}
          <path d={`M${BASE.x},${BASE.y} L${PEAK.x},${PEAK.y} L595,${BASE.y} Z`} fill="url(#inst-peak)" />
          <line x1={BASE.x} y1={BASE.y} x2={PEAK.x} y2={PEAK.y} className={styles.slope} />
          {p > 0 ? <line x1={BASE.x} y1={BASE.y} x2={at.x} y2={at.y} className={styles.slopeDone} /> : null}
          <line x1={PEAK.x} y1={PEAK.y} x2={PEAK.x} y2="4" className={styles.pole} />
          <path d={`M${PEAK.x},5 L325,9 L${PEAK.x},14 Z`} className={styles.flag} />
          <text x="608" y="22" textAnchor="end" className={styles.lbl}>{top}</text>
          <text x="608" y="211" textAnchor="end" className={styles.lbl}>$0</text>
        </svg>
        <span className={styles.climber} style={{ left: `${(at.x / W) * 100}%`, top: `${(at.y / H) * 100}%` }}>
          <Climber size={40} />
        </span>
        {pct != null ? (
          <span className={styles.youPill} style={{ left: `${((at.x + 22) / W) * 100}%`, top: `${((at.y - 38) / H) * 100}%` }}>
            Tú · {pct}%
          </span>
        ) : null}
      </span>
    </button>
  );
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
  health, statusLabel, stages, active, oblItems, burn, onOpenFlow, onOpenAscent, onOpenObligations,
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
  stages: DeskStage[] | null;
  active: number;
  oblItems: DeskOblItem[];
  burn: { daily: number; sufficient: boolean } | null;
  onOpenFlow: () => void;
  onOpenAscent: () => void;
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

  const stage = stages?.[active] ?? null;
  const known = !!stage && stage.progressKnown !== false && stage.target != null && stage.current != null;
  const progress = known && stage!.target ? Math.min(1, (stage!.current ?? 0) / stage!.target) : 0;
  const pct = known ? Math.round(progress * 100) : null;
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
        <div className={styles.left}>
          {stage ? (
            <>
              <div className={styles.headRow}>
                <Eyebrow>Tu ascenso</Eyebrow>
                <span className={styles.stageName}>{stage.label}</span>
              </div>
              <Mountain progress={progress} pct={pct} top={compact(stage.target ?? stage.unknownValue ?? 0)} onOpen={onOpenAscent} />
              <div className={styles.figRow}>
                <div>
                  {known ? (
                    <><span className={styles.fig}>{fmtAmount(stage.current)}</span> <span className={styles.figOf}>/ {fmtAmount(stage.target)} COP</span></>
                  ) : (
                    <><span className={styles.fig}>{fmtAmount(stage.unknownValue ?? 0)}</span> <span className={styles.figOf}>COP</span></>
                  )}
                  <p className={styles.hint}>{known ? stage.hint : (stage.unknownLabel ?? stage.hint)}</p>
                </div>
                {pct != null ? <span className={styles.pct}>{pct} %</span> : null}
              </div>
              <div className={styles.pills}>
                {stages!.map((s, i) => {
                  const done = i < active || s.skipped;
                  return (
                    <span key={s.id} className={`${styles.pill} ${i === active ? styles.pillOn : ''}`}>
                      {done && i !== active ? '✓ ' : ''}{s.label}
                    </span>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

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
