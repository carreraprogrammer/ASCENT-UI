import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { useEffect, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import {
  chevronBackOutline,
  chevronForwardOutline,
  flagOutline,
  flameOutline,
} from 'ionicons/icons';
import { financeService } from '../../../services/financeService';
import { formatCurrencyCompact } from '../../../utils/formatCurrency';
import type { SummaryResponse, UserMilestone } from '../../../types/finance.types';
import { CoachNote } from '../../molecules/CoachNote/CoachNote';
import { StatusStrip } from '../../molecules/StatusStrip/StatusStrip';
import { CategoryPressureCard } from '../../molecules/CategoryPressureCard/CategoryPressureCard';
import { ReasoningAccordion } from '../../molecules/ReasoningAccordion/ReasoningAccordion';
import { InsightTabBar } from '../../molecules/InsightTabBar/InsightTabBar';
import { Spinner } from '../../atoms/Spinner';
import type { CategoryType } from '../../molecules/CategoryPressureCard/CategoryPressureCard';
import { AppLayout } from '../../templates/AppLayout';
import { useDesktopLayout } from '../../../hooks/useDesktopLayout';
import { BarPct, DateCell, InstButton, Num, StateTag } from '../../atoms/Inst';
import { InstBand, InstNote, InstPageHeader, InstSection, InstStats, InstTable, InstTableSkeleton, type Align } from '../../molecules/Inst';
import { fmtAmount, fmtDay } from '../../../utils/instrumento';
import { CoachLine, GavetaCells, InsightTabs, NextStep, Reasoning, RouterLink } from './InsightDesk';
import desk from './InsightDesk.module.css';
import styles from './MonthlyInsightDetailPage.module.css';

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MILESTONE_LABELS: Record<string, string> = {
  first_transaction:           'Primera transacción registrada',
  streak_7:                    '7 días de racha',
  streak_30:                   '30 días de racha',
  debt_paid_off:               'Deuda liquidada',
  budget_under:                'Mes bajo presupuesto',
  savings_goal_completed:      'Meta de ahorro completada',
  discretionary_under_budget:  'Flexible bajo presupuesto',
  overflow_received:           'Excedente recibido',
  plan_confirmed:              'Plan mensual confirmado',
};

// ── Score ring ─────────────────────────────────────────────────────────────

const ScoreRing = ({ value, size = 86 }: { value: number; size?: number }) => {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.ring}>
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="6" fill="none" className={styles.ringTrack} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        strokeWidth="6" fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className={styles.ringFill}
      />
    </svg>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────

type BurnCategory = NonNullable<SummaryResponse['burn_rate']>['categories'][number];

function computeScore(categories: BurnCategory[], netBalance: number): number {
  if (!categories || categories.length === 0) return 0;
  const over = categories.filter((c) => c.pct > 100).length;
  const warn = categories.filter((c) => c.pct > 80 && c.pct <= 100).length;
  let score = 100 - over * 12 - warn * 4;
  if (netBalance > 0) score += 5;
  return Math.min(100, Math.max(0, Math.round(score)));
}

// ── Page ──────────────────────────────────────────────────────────────────

export const MonthlyInsightDetailPage = () => {
  const { month, year } = useParams<{ month: string; year: string }>();
  const history = useHistory();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [milestones, setMilestones] = useState<UserMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  // TCW-5: en escritorio se distingue "falló la carga" (con Reintentar) de "sin datos". El móvil no cambia.
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Escritorio (ASC-4, fase 5): la pestaña "Planes" del menú Finanzas abre esta vista
  // dentro del layout de Ascent (cabecera + menú lateral). Móvil sigue a pantalla completa.
  const isDesktop = useDesktopLayout();

  const m = Number(month);
  const y = Number(year);
  const now = new Date();
  const isCurrent = m === now.getMonth() + 1 && y === now.getFullYear();

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    Promise.all([
      financeService.fetchSummary(m, y),
      financeService.fetchMilestones(),
    ])
      .then(([s, ms]) => { setSummary(s); setMilestones(ms); })
      .catch(() => { setSummary(null); setMilestones([]); setFailed(true); })
      .finally(() => setLoading(false));
  }, [m, y, attempt]);

  const categories = summary?.burn_rate?.categories ?? [];
  const overCategories = categories.filter((c) => c.pct > 100);
  const underCategories = categories.filter((c) => c.pct <= 100);
  const savings = summary?.savings_goals ?? [];
  const netBalance = summary?.balance.net_balance ?? 0;

  const score = summary ? computeScore(categories, netBalance) : null;

  const coachBody = isCurrent
    ? overCategories.length > 0
      ? `Llevas ${overCategories.length} gaveta${overCategories.length > 1 ? 's' : ''} sobre presupuesto en ${MONTH_NAMES[m]}. El balance va ${netBalance >= 0 ? 'en positivo' : 'en rojo'}.`
      : `Vas bien en ${MONTH_NAMES[m]} — todas las gavetas dentro del plan. Balance acumulado: ${formatCurrencyCompact(netBalance)}.`
    : overCategories.length > 0
      ? `Cerraste ${MONTH_NAMES[m]} con ${overCategories.length} gaveta${overCategories.length > 1 ? 's' : ''} sobre presupuesto. La balanza ${netBalance >= 0 ? 'dio positiva' : 'quedó en rojo'}.`
      : `Cerraste ${MONTH_NAMES[m]} dentro del plan. El balance neto fue ${formatCurrencyCompact(netBalance)}.`;

  const debtPayments = summary?.balance.debt_payments_confirmed ?? 0;
  const sfContributions = summary?.balance.sinking_fund_contributions ?? 0;

  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const ctaTitle = overCategories.length > 0
    ? `Ajusta ${overCategories.map((c) => c.category).join(' y ')} para ${MONTH_NAMES[nextMonth]}`
    : `Sigue el plan de ${MONTH_NAMES[nextMonth]}`;

  const topbar = (
    <div className={styles.topbar}>
      <button type="button" className={styles.iconBtn} onClick={() => history.goBack()}>
        <IonIcon icon={chevronBackOutline} />
      </button>
      <div className={styles.crumb}>
        <span className={styles.crumbKind}>{isCurrent ? 'Mes en curso' : 'Cierre de mes'}</span>
        <span className={styles.crumbDate}>{MONTH_NAMES[m]} {y}</span>
      </div>
      {isDesktop ? (
        // TCW-2: Planeados vive dentro de Planes (el menú lateral sigue con 8 pestañas). Solo escritorio.
        <Link className={styles.plannedLink} to="/planned-expenses">
          Gastos planeados <IonIcon icon={chevronForwardOutline} aria-hidden="true" />
        </Link>
      ) : (
        <div className={styles.iconBtn} style={{ visibility: 'hidden' }} />
      )}
    </div>
  );

  const body = (
    <div className={styles.scroll}>
      {loading ? (
        <div className={styles.loader}><Spinner size="lg" /></div>
      ) : !summary ? (
        <div className={styles.empty}>Sin datos para {MONTH_NAMES[m]} {y}.</div>
      ) : (
        <>
          <CoachNote
            body={coachBody}
            meta={[`Generado el 1 de ${MONTH_NAMES[nextMonth]}`]}
          />

          {/* Score card */}
          {score != null && (
            <div className={styles.scoreCard}>
              <ScoreRing value={score} />
              <div className={styles.scoreBody}>
                <div className={styles.scoreNum}>
                  {score}<span className={styles.scoreMax}>/100</span>
                </div>
                <div className={styles.scoreDelta}>
                  {underCategories.length} de {categories.length} gavetas en verde
                </div>
                <div className={styles.scoreFoot}>
                  {isCurrent
                    ? netBalance >= 0
                      ? `Llevas ${formatCurrencyCompact(netBalance)} de margen acumulado.`
                      : `Vas ${formatCurrencyCompact(Math.abs(netBalance))} en rojo por ahora.`
                    : netBalance >= 0
                      ? `Terminaste con ${formatCurrencyCompact(netBalance)} de margen.`
                      : `Cerraste ${formatCurrencyCompact(Math.abs(netBalance))} en rojo.`}
                </div>
              </div>
            </div>
          )}

          <StatusStrip cells={[
            {
              label: 'Gavetas ok',
              value: `${underCategories.length}`,
              delta: categories.length > 0 ? `de ${categories.length}` : undefined,
            },
            {
              label: 'Se pasaron',
              value: `${overCategories.length}`,
              tone: overCategories.length > 0 ? 'bad' : undefined,
            },
            ...(debtPayments > 0 ? [{
              label: 'Abonos deuda',
              value: formatCurrencyCompact(debtPayments),
            }] : []),
            ...(sfContributions > 0 ? [{
              label: 'A bolsillos',
              value: formatCurrencyCompact(sfContributions),
            }] : []),
            {
              label: 'Balance',
              value: formatCurrencyCompact(netBalance),
              tone: netBalance < 0 ? 'bad' : undefined,
            },
          ]} />

          {/* Category breakdown */}
          {categories.length > 0 && (
            <>
              <div className={styles.secHead}>
                <h3 className={styles.secTitle}>Tus gavetas</h3>
                {overCategories.length > 0 && (
                  <span className={styles.secMeta}>{overCategories.length} se pasaron</span>
                )}
              </div>
              <div className={styles.pressureList}>
                {categories.map((cat) => (
                  <CategoryPressureCard
                    key={cat.category_type}
                    name={cat.category}
                    pct={cat.pct}
                    spent={cat.spent}
                    limit={cat.budget}
                    category={cat.category_type as CategoryType}
                  />
                ))}
              </div>
            </>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <>
              <div className={styles.secHead}>
                <h3 className={styles.secTitle}>Logros del mes</h3>
                <span className={styles.secMeta}>{milestones.length} desbloqueados</span>
              </div>
              <div className={styles.medalList}>
                {milestones.map((ms) => (
                  <div key={ms.id} className={styles.medal}>
                    <div className={styles.medalIcon}>
                      <IonIcon icon={flameOutline} />
                    </div>
                    <div className={styles.medalBody}>
                      <p className={styles.medalName}>
                        {MILESTONE_LABELS[ms.code] ?? ms.code}
                      </p>
                      <p className={styles.medalWhen}>
                        {new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' }).format(new Date(ms.achieved_at))}
                      </p>
                    </div>
                    <IonIcon icon={chevronForwardOutline} className={styles.medalArrow} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Savings goals */}
          {savings.length > 0 && (
            <>
              <div className={styles.secHead}>
                <h3 className={styles.secTitle}>Metas de ahorro</h3>
              </div>
              <div className={styles.list}>
                {savings.map((g, i) => {
                  const pct = g.target_amount > 0
                    ? Math.round((g.current_amount / g.target_amount) * 100) : 0;
                  return (
                    <div key={i} className={styles.row}>
                      <div className={styles.rowBody}>
                        <span className={styles.rowName}>{g.name}</span>
                        <span className={styles.rowMeta}>{pct}% completado</span>
                      </div>
                      <span className={styles.rowAmt}>{formatCurrencyCompact(g.current_amount)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* CTA next month */}
          <div className={styles.cta}>
            <div className={styles.ctaEyebrow}>
              <IonIcon icon={flagOutline} className={styles.ctaIcon} />
              <span>Propuesta para {MONTH_NAMES[nextMonth]}</span>
            </div>
            <p className={styles.ctaTitle}>{ctaTitle}</p>
            <p className={styles.ctaBody}>
              {overCategories.length > 0
                ? isCurrent
                  ? `Todavía puedes corregir el rumbo en lo que queda de ${MONTH_NAMES[m]}.`
                  : `${MONTH_NAMES[m]} dejó patrones claros. Ajusta el plan para el próximo mes.`
                : `Llevas una racha sólida. Revisa si hay algo que optimizar.`}
            </p>
            <button
              type="button"
              className={styles.ctaBtn}
              onClick={() => history.push(`/budgets/${nextYear}/${nextMonth}`)}
            >
              Revisar plan de {MONTH_NAMES[nextMonth]} <IonIcon icon={chevronForwardOutline} />
            </button>
          </div>

          {/* Reasoning */}
          {(summary as any)?.agent_reasoning ? (
            <ReasoningAccordion text={(summary as any).agent_reasoning} />
          ) : null}
        </>
      )}

    </div>
  );

  if (isDesktop) {
    // TCW-5 "Instrumento" (mockup U_AscentPlanes). El contenido real de /planes manda (plan TCW-5, "Datos por
    // confirmar"): el resumen del mes, la nota del coach, las gavetas, logros, metas y la propuesta, con el
    // lenguaje del mockup. Mismos datos y cálculos que el árbol móvil.
    const prevMonth = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? y - 1 : y;
    const planStatus = summary?.monthly_plan?.status;
    const GAV_HEADS = ['Gaveta', 'Presupuesto', 'Gastado'];
    const GAV_ALIGNS: Align[] = ['left', 'right', 'right'];
    const days = summary?.burn_rate;
    return (
      <AppLayout title="Planes" ownHeader>
        <div className={desk.page} data-testid="planes-desktop">
          <InstPageHeader
            title="Planes"
            sub="El plan del mes y lo que ya tienes previsto gastar"
            actions={(
              <>
                <span className={desk.headLink}><RouterLink to="/planned-expenses">Gastos planeados</RouterLink></span>
                <InstButton onClick={() => history.push(`/budgets/${y}/${String(m).padStart(2, '0')}`)}>Editar plan</InstButton>
              </>
            )}
          />
          <InstBand>
            <button type="button" className={desk.nav} onClick={() => history.push(`/planes/${prevYear}/${prevMonth}`)}>
              ‹ {MONTH_NAMES[prevMonth].toLowerCase()}
            </button>
            <span className={desk.month}>{MONTH_NAMES[m]} {y}</span>
            <button type="button" className={desk.nav} onClick={() => history.push(`/planes/${nextYear}/${nextMonth}`)}>
              {MONTH_NAMES[nextMonth].toLowerCase()} ›
            </button>
            <span className={desk.flex} />
            <InsightTabs active="mensual" month={m} year={y} />
            {planStatus ? <StateTag state={planStatus === 'confirmed' ? 'confirmado' : 'borrador'} /> : null}
          </InstBand>

          {loading ? (
            <InstSection title="Plan por gaveta"><InstTableSkeleton heads={GAV_HEADS} aligns={GAV_ALIGNS} rows={4} /></InstSection>
          ) : failed ? (
            <InstNote error onRetry={() => setAttempt((a) => a + 1)}>No pudimos cargar el resumen de {MONTH_NAMES[m]} {y}.</InstNote>
          ) : !summary ? (
            <InstNote>Sin datos para {MONTH_NAMES[m]} {y}.</InstNote>
          ) : (
            <>
              <InstStats items={[
                { label: 'Puntaje del mes', value: (
                    <span className={desk.scoreFig}>
                      {/* TCW-5 comment-90: el anillo real de siempre (ScoreRing), dentro del marco nuevo. */}
                      <ScoreRing value={score ?? 0} size={44} />
                      <span>{score ?? 0}<span className={desk.of}> / 100</span></span>
                    </span>
                  ),
                  sub: `${underCategories.length} de ${categories.length} gavetas en verde` },
                { label: 'Se pasaron', value: <span className={overCategories.length > 0 ? desk.rose : undefined}>{overCategories.length}</span>,
                  sub: overCategories.length === 1 ? 'gaveta sobre presupuesto' : 'gavetas sobre presupuesto' },
                ...(debtPayments > 0 ? [{ label: 'Abonos deuda', value: fmtAmount(debtPayments), sub: 'confirmados en el mes' }] : []),
                ...(sfContributions > 0 ? [{ label: 'A bolsillos', value: fmtAmount(sfContributions), sub: 'aportes del mes' }] : []),
                { label: 'Balance', value: <span className={netBalance < 0 ? desk.rose : undefined}>{fmtAmount(netBalance)}</span>,
                  sub: isCurrent
                    ? netBalance >= 0 ? 'margen acumulado' : 'en rojo por ahora'
                    : netBalance >= 0 ? 'margen con el que cerraste' : 'cerraste en rojo' },
              ]} />

              {categories.length > 0 ? (
                <InstSection title="Plan por gaveta"
                  right={days ? <span className={desk.right}>día {days.days_elapsed} de {days.days_in_month}{overCategories.length ? ` · ${overCategories.length} se pasaron` : ''}</span> : null}>
                  {/* TCW-5 comment-90: las barras reales de siempre (CategoryPressureCard), dentro del marco nuevo. */}
                  <div className={desk.pressureGrid}>
                    {categories.map((cat) => (
                      <CategoryPressureCard
                        key={cat.category_type}
                        name={cat.category}
                        pct={cat.pct}
                        spent={cat.spent}
                        limit={cat.budget}
                        category={cat.category_type as CategoryType}
                      />
                    ))}
                  </div>
                </InstSection>
              ) : null}

              <CoachLine body={coachBody} meta={[`Generado el 1 de ${MONTH_NAMES[nextMonth].toLowerCase()}`]} />

              {overCategories.length > 0 ? (
                <InstSection title="Gavetas sobre presupuesto">
                  <GavetaCells items={overCategories.map((c) => ({ code: c.category_type, name: c.category }))} />
                </InstSection>
              ) : null}

              {milestones.length > 0 ? (
                <InstSection title={`Logros del mes · ${milestones.length}`}>
                  <InstTable caption="Logros del mes" heads={['Logro', 'Fecha']} aligns={['left', 'right']}
                    rowKeys={milestones.map((ms) => ms.id)}
                    rows={milestones.map((ms) => [
                      <span className={desk.name}>{MILESTONE_LABELS[ms.code] ?? ms.code}</span>,
                      <DateCell>{fmtDay(ms.achieved_at)}</DateCell>,
                    ])} />
                </InstSection>
              ) : null}

              {savings.length > 0 ? (
                <InstSection title="Metas de ahorro">
                  <InstTable caption="Metas de ahorro" heads={['Meta', 'Avance', 'Acumulado (COP)']} aligns={['left', 'left', 'right']}
                    rows={savings.map((g) => {
                      const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0;
                      return [
                        <span className={desk.name}>{g.name}</span>,
                        <BarPct pct={pct} label={`Avance de ${g.name}`} />,
                        <Num strong>{fmtAmount(g.current_amount)}</Num>,
                      ];
                    })} />
                </InstSection>
              ) : null}

              <NextStep
                title={`Propuesta para ${MONTH_NAMES[nextMonth].toLowerCase()}`}
                heading={ctaTitle}
                body={overCategories.length > 0
                  ? isCurrent
                    ? `Todavía puedes corregir el rumbo en lo que queda de ${MONTH_NAMES[m]}.`
                    : `${MONTH_NAMES[m]} dejó patrones claros. Ajusta el plan para el próximo mes.`
                  : 'Llevas una racha sólida. Revisa si hay algo que optimizar.'}
                action={`Revisar plan de ${MONTH_NAMES[nextMonth]}`}
                onAction={() => history.push(`/budgets/${nextYear}/${nextMonth}`)}
              />

              {(summary as any)?.agent_reasoning ? <Reasoning text={(summary as any).agent_reasoning} /> : null}
            </>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <IonPage className={styles.page}>
      {topbar}

      <IonContent className={styles.content}>
        {body}
      </IonContent>
      <InsightTabBar active="mensual" month={m} year={y} />
    </IonPage>
  );
};
