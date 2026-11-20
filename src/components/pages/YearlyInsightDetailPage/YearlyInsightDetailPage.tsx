import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
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
import { ReasoningAccordion } from '../../molecules/ReasoningAccordion/ReasoningAccordion';
import { InsightTabBar } from '../../molecules/InsightTabBar/InsightTabBar';
import { Spinner } from '../../atoms/Spinner';
import styles from './YearlyInsightDetailPage.module.css';
import { AppLayout } from '../../templates/AppLayout';
import { useDesktopLayout } from '../../../hooks/useDesktopLayout';
import { CategoryCell, DateCell, InstButton } from '../../atoms/Inst';
import { InstBand, InstNote, InstPageHeader, InstSection, InstStats, InstTable, InstTableSkeleton } from '../../molecules/Inst';
import { fmtAmount, fmtDay } from '../../../utils/instrumento';
import { CoachLine, GAVETA_ICON, InsightTabs, NextStep, Reasoning } from '../MonthlyInsightDetailPage/InsightDesk';
import desk from '../MonthlyInsightDetailPage/InsightDesk.module.css';

const MONTH_ABBR = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// ── Year bar chart ─────────────────────────────────────────────────────────

const YearChart = ({ monthly }: { monthly: number[] }) => {
  const max = Math.max(...monthly, 1);
  return (
    <div className={styles.yearChart}>
      <div className={styles.yearBars}>
        {monthly.map((v, i) => (
          <div
            key={i}
            className={styles.yearBar}
            style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
            title={`${MONTH_ABBR[i]}: ${formatCurrencyCompact(v)}`}
          />
        ))}
      </div>
      <div className={styles.yearMonths}>
        {MONTH_ABBR.map((m) => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
};

// ── Derived lessons from yearly data ──────────────────────────────────────

type Lesson = { title: string; text: string; gaveta?: { code: string; name: string } };

function deriveLessons(monthly: number[], summaries: (SummaryResponse | null)[], isCurrent: boolean): Lesson[] {
  const lessons: Lesson[] = [];
  const nonZero = monthly.map((v, i) => ({ v, i })).filter((x) => x.v > 0);
  if (nonZero.length === 0) return lessons;

  const peak = nonZero.reduce((a, b) => (b.v > a.v ? b : a));
  lessons.push({
    title: isCurrent
      ? `Tu mes más caro hasta ahora es ${MONTH_NAMES[peak.i + 1]}.`
      : `Tu mes más caro fue ${MONTH_NAMES[peak.i + 1]}.`,
    text: `Gastaste ${formatCurrencyCompact(peak.v)} — un pico respecto al resto del año. Vale la pena planearlo de antemano.`,
  });

  const allCategories: Record<string, number[]> = {};
  const codeByName: Record<string, string> = {};
  summaries.forEach((s) => {
    if (!s) return;
    (s.burn_rate?.categories ?? []).forEach((c) => {
      codeByName[c.category] = c.category_type;
      if (!allCategories[c.category]) allCategories[c.category] = [];
      allCategories[c.category].push(c.pct);
    });
  });

  const mostVolatile = Object.entries(allCategories)
    .map(([name, pcts]) => ({ name, over: pcts.filter((p) => p > 100).length }))
    .filter((x) => x.over > 0)
    .sort((a, b) => b.over - a.over)[0];

  if (mostVolatile) {
    lessons.push({
      title: isCurrent
        ? `${mostVolatile.name} es tu categoría más difícil.`
        : `${mostVolatile.name} fue tu categoría más difícil.`,
      text: `Se pasó del presupuesto ${mostVolatile.over} ${mostVolatile.over === 1 ? 'mes' : 'meses'} del año. Es la zona donde más hay que defender.`,
      gaveta: codeByName[mostVolatile.name] ? { code: codeByName[mostVolatile.name], name: mostVolatile.name } : undefined,
    });
  }

  const totalIncome = summaries.reduce((a, s) => a + (s?.balance.income_confirmed ?? 0), 0);
  const totalExpense = summaries.reduce((a, s) => a + (s?.balance.expense_confirmed ?? 0), 0);
  const netYearly = totalIncome - totalExpense;
  lessons.push({
    title: isCurrent
      ? netYearly >= 0 ? 'El año va en positivo.' : 'El año va en negativo por ahora.'
      : netYearly >= 0 ? 'Terminaste el año en positivo.' : 'El año cerró en negativo.',
    text: netYearly >= 0
      ? `Tu balance neto fue ${formatCurrencyCompact(netYearly)}. Cada mes que terminas en verde construye margen.`
      : `Tu balance neto fue ${formatCurrencyCompact(netYearly)}. Identifica qué meses pesaron más para ajustar el plan.`,
  });

  return lessons.slice(0, 3);
}

// ── Page ──────────────────────────────────────────────────────────────────

export const YearlyInsightDetailPage = () => {
  const { year } = useParams<{ year: string }>();
  const history = useHistory();
  const y = Number(year);
  const isCurrent = y === new Date().getFullYear();
  const isDesktop = useDesktopLayout();

  const [summaries, setSummaries] = useState<(SummaryResponse | null)[]>([]);
  const [milestones, setMilestones] = useState<UserMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const monthFetches = Array.from({ length: 12 }, (_, i) =>
      financeService.fetchSummary(i + 1, y).catch(() => null)
    );
    Promise.all([Promise.all(monthFetches), financeService.fetchMilestones()])
      .then(([ss, ms]) => { setSummaries(ss); setMilestones(ms); })
      .finally(() => setLoading(false));
  }, [y]);

  const monthly = summaries.map((s) => s?.balance.expense_confirmed ?? 0);
  const totalIncome = summaries.reduce((a, s) => a + (s?.balance.income_confirmed ?? 0), 0);
  const totalExpense = summaries.reduce((a, s) => a + (s?.balance.expense_confirmed ?? 0), 0);
  const totalDebtPayments = summaries.reduce((a, s) => a + (s?.balance.debt_payments_confirmed ?? 0), 0);
  const totalSfContributions = summaries.reduce((a, s) => a + (s?.balance.sinking_fund_contributions ?? 0), 0);
  const totalConsumption = totalExpense - totalDebtPayments - totalSfContributions;
  const netYearly = totalIncome - totalExpense;
  const hasData = monthly.some((v) => v > 0);

  const peakMonthIdx = hasData
    ? monthly.indexOf(Math.max(...monthly))
    : -1;

  const lessons = deriveLessons(monthly, summaries, isCurrent);

  const coachBody = hasData
    ? isCurrent
      ? netYearly >= 0
        ? `Llevas un año positivo — ${formatCurrencyCompact(netYearly)} acumulados hasta hoy.`
        : `El año va en rojo por ${formatCurrencyCompact(Math.abs(netYearly))}. Todavía hay tiempo para ajustar.`
      : netYearly >= 0
        ? `Fue un año con balance positivo. Guardaste ${formatCurrencyCompact(netYearly)} en el acumulado.`
        : `El año cerró en rojo por ${formatCurrencyCompact(Math.abs(netYearly))}. Los datos te muestran dónde ajustar.`
    : `Aún no hay suficientes datos para analizar ${y}.`;

  // ── Escritorio (TCW-5 "Instrumento"): hereda el armazón, sin islas. Mismos datos y cálculos. ──
  if (isDesktop) {
    return (
      <AppLayout title="Planes" ownHeader>
        <div className={desk.page} data-testid="year-desktop">
          <InstPageHeader title={String(y)} sub={isCurrent ? 'Año en curso: lo que entró, lo que salió y lo que aprendimos' : 'Año cerrado: lo que entró, lo que salió y lo que aprendimos'}
            actions={<InstButton onClick={() => history.goBack()}>‹ Volver</InstButton>} />
          <InstBand>
            <span className={desk.month}>{isCurrent ? 'Año en curso' : 'Año cerrado'} · {y}</span>
            <span className={desk.flex} />
            <InsightTabs active="anual" month={isCurrent ? new Date().getMonth() + 1 : 12} year={y} />
          </InstBand>
          {loading ? (
            <InstSection title="Tu año en cifras"><InstTableSkeleton heads={['Mes', 'Gasto confirmado']} aligns={['left', 'right']} rows={4} /></InstSection>
          ) : (
            <>
              <InstStats items={[
                { label: 'Ingresado', value: fmtAmount(totalIncome), sub: 'ingresos confirmados' },
                { label: 'Consumo', value: fmtAmount(totalConsumption), sub: 'gasto sin abonos ni bolsillos' },
                ...(totalDebtPayments > 0 ? [{ label: 'Abonos deuda', value: fmtAmount(totalDebtPayments), sub: 'en el año' }] : []),
                ...(totalSfContributions > 0 ? [{ label: 'A bolsillos', value: fmtAmount(totalSfContributions), sub: 'en el año' }] : []),
                { label: 'Balance', value: <span className={netYearly < 0 ? desk.rose : undefined}>{fmtAmount(netYearly)}</span>, sub: 'ingresado − gastado' },
              ]} />
              <CoachLine body={coachBody} meta={[isCurrent ? `Al día de hoy · ${y}` : `31 de diciembre · ${y}`, `${summaries.filter(Boolean).length} meses con datos`]} />
              {hasData ? (
                <InstSection title="Tu año en cifras" right={peakMonthIdx >= 0 ? <span className={desk.right}>{MONTH_ABBR[peakMonthIdx].toLowerCase()} fue el pico</span> : null}>
                  {/* TCW-5 comment-90: la gráfica real de siempre (YearChart), dentro del marco nuevo. */}
                  <div className={desk.chartFrame}><YearChart monthly={monthly} /></div>
                  <p className={desk.caption}>Gasto mensual confirmado · {y}</p>
                </InstSection>
              ) : <InstNote>Aún no hay suficientes datos para analizar {y}.</InstNote>}
              {milestones.length > 0 ? (
                <InstSection title={`Logros del año · ${milestones.length}`}>
                  <InstTable caption="Logros del año" heads={['Logro', 'Fecha']} aligns={['left', 'right']}
                    rowKeys={milestones.slice(0, 5).map((ms) => ms.id)}
                    rows={milestones.slice(0, 5).map((ms) => [
                      <span className={desk.name}>{ms.code.replace(/_/g, ' ')}</span>,
                      <DateCell>{fmtDay(ms.achieved_at)}</DateCell>,
                    ])} />
                </InstSection>
              ) : null}
              {lessons.length > 0 ? (
                <InstSection title={`${lessons.length} cosas que aprendimos`} right={<span className={desk.right}>tu coach</span>}>
                  <InstTable caption="Lo que aprendimos" heads={['', 'Lección', 'Por qué']} aligns={['left', 'left', 'left']}
                    rows={lessons.map((l, i) => [
                      <span className={desk.right} style={{ color: 'var(--violet)' }}>0{i + 1}</span>,
                      <>
                        <span className={desk.name}>{l.title}</span>
                        {l.gaveta ? (
                          <div style={{ marginTop: 6 }}>
                            <CategoryCell code={l.gaveta.code} gavetaName={l.gaveta.name} icon={GAVETA_ICON[l.gaveta.code]} />
                          </div>
                        ) : null}
                      </>,
                      <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{l.text}</span>,
                    ])} />
                </InstSection>
              ) : null}
              <NextStep
                title={isCurrent ? `Cierra bien ${y}` : `Tu plan para ${y + 1}`}
                heading={isCurrent
                  ? netYearly >= 0 ? 'Sigue construyendo sobre lo que funciona' : 'Todavía puedes ajustar el rumbo este año'
                  : netYearly >= 0 ? 'Construye sobre lo que funcionó' : 'Ajusta lo que más pesó este año'}
                body={peakMonthIdx >= 0
                  ? isCurrent
                    ? `${MONTH_NAMES[peakMonthIdx + 1]} es tu mes más caro hasta ahora. Planifica los meses que quedan con eso en mente.`
                    : `${MONTH_NAMES[peakMonthIdx + 1]} fue tu mes más caro. Si lo planeas con antelación, llegas tranquilo.`
                  : 'Empieza el año con un plan claro y un presupuesto ajustado a tu realidad.'}
                action={isCurrent ? `Ver plan de ${y}` : `Diseñar plan ${y + 1}`}
                onAction={() => history.push('/budgets')}
              />
              {(summaries[0] as any)?.agent_reasoning ? <Reasoning text={(summaries[0] as any).agent_reasoning} /> : null}
            </>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <IonPage className={styles.page}>
      <div className={styles.topbar}>
        <button type="button" className={styles.iconBtn} onClick={() => history.goBack()}>
          <IonIcon icon={chevronBackOutline} />
        </button>
        <div className={styles.crumb}>
          <span className={styles.crumbKind}>{isCurrent ? 'Año en curso' : 'Año cerrado'}</span>
          <span className={styles.crumbDate}>{y}</span>
        </div>
        <div className={styles.iconBtn} style={{ visibility: 'hidden' }} />
      </div>

      <IonContent className={styles.content}>
        <div className={styles.scroll}>
          {loading ? (
            <div className={styles.loader}><Spinner size="lg" /></div>
          ) : (
            <>
              <CoachNote
                body={coachBody}
                meta={[
                  isCurrent
                    ? `Al día de hoy · ${y}`
                    : `31 de diciembre · ${y}`,
                  `${summaries.filter(Boolean).length} meses con datos`,
                ]}
              />

              <StatusStrip cells={[
                { label: 'Ingresado', value: formatCurrencyCompact(totalIncome) },
                { label: 'Consumo', value: formatCurrencyCompact(totalConsumption) },
                ...(totalDebtPayments > 0 ? [{ label: 'Abonos deuda', value: formatCurrencyCompact(totalDebtPayments) }] : []),
                ...(totalSfContributions > 0 ? [{ label: 'A bolsillos', value: formatCurrencyCompact(totalSfContributions) }] : []),
                { label: 'Balance', value: formatCurrencyCompact(netYearly), tone: netYearly < 0 ? 'bad' : undefined },
              ]} />

              {/* Year chart */}
              {hasData && (
                <>
                  <div className={styles.secHead}>
                    <h3 className={styles.secTitle}>Tu año en cifras</h3>
                    {peakMonthIdx >= 0 && (
                      <span className={styles.secMeta}>{MONTH_ABBR[peakMonthIdx]} fue el pico</span>
                    )}
                  </div>
                  <div className={styles.chartWrap}>
                    <YearChart monthly={monthly} />
                    <p className={styles.chartCaption}>
                      Gasto mensual confirmado · {y}
                    </p>
                  </div>
                </>
              )}

              {/* Milestones */}
              {milestones.length > 0 && (
                <>
                  <div className={styles.secHead}>
                    <h3 className={styles.secTitle}>Logros del año</h3>
                    <span className={styles.secMeta}>{milestones.length} desbloqueados</span>
                  </div>
                  <div className={styles.medalList}>
                    {milestones.slice(0, 5).map((ms) => (
                      <div key={ms.id} className={styles.medal}>
                        <div className={styles.medalIcon}>
                          <IonIcon icon={flameOutline} />
                        </div>
                        <div className={styles.medalBody}>
                          <p className={styles.medalName}>{ms.code.replace(/_/g, ' ')}</p>
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

              {/* Lessons */}
              {lessons.length > 0 && (
                <>
                  <div className={styles.secHead}>
                    <h3 className={styles.secTitle}>{lessons.length} cosas que aprendimos</h3>
                    <span className={styles.secMeta}>tu coach</span>
                  </div>
                  <div className={styles.lessonList}>
                    {lessons.map((l, i) => (
                      <div key={i} className={styles.lesson}>
                        <div className={styles.lessonNum}>{i + 1}</div>
                        <div className={styles.lessonBody}>
                          <p className={styles.lessonTitle}>{l.title}</p>
                          <p className={styles.lessonText}>{l.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* CTA */}
              <div className={styles.cta}>
                <div className={styles.ctaEyebrow}>
                  <IonIcon icon={flagOutline} className={styles.ctaIcon} />
                  <span>{isCurrent ? `Cierra bien ${y}` : `Tu plan para ${y + 1}`}</span>
                </div>
                <p className={styles.ctaTitle}>
                  {isCurrent
                    ? netYearly >= 0
                      ? 'Sigue construyendo sobre lo que funciona'
                      : 'Todavía puedes ajustar el rumbo este año'
                    : netYearly >= 0
                      ? 'Construye sobre lo que funcionó'
                      : 'Ajusta lo que más pesó este año'}
                </p>
                <p className={styles.ctaBody}>
                  {peakMonthIdx >= 0
                    ? isCurrent
                      ? `${MONTH_NAMES[peakMonthIdx + 1]} es tu mes más caro hasta ahora. Planifica los meses que quedan con eso en mente.`
                      : `${MONTH_NAMES[peakMonthIdx + 1]} fue tu mes más caro. Si lo planeas con antelación, llegas tranquilo.`
                    : 'Empieza el año con un plan claro y un presupuesto ajustado a tu realidad.'}
                </p>
                <button
                  type="button"
                  className={styles.ctaBtn}
                  onClick={() => history.push('/budgets')}
                >
                  {isCurrent ? `Ver plan de ${y}` : `Diseñar plan ${y + 1}`} <IonIcon icon={chevronForwardOutline} />
                </button>
              </div>

              {/* Reasoning placeholder — will show once LLM job exists */}
              {(summaries[0] as any)?.agent_reasoning ? (
                <ReasoningAccordion text={(summaries[0] as any).agent_reasoning} />
              ) : null}
            </>
          )}

        </div>
      </IonContent>
      <InsightTabBar active="anual" year={y} />
    </IonPage>
  );
};
