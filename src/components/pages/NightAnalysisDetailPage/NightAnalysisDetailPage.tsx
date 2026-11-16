import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import {
  chevronBackOutline,
  optionsOutline,
  checkmarkOutline,
  checkmarkDoneOutline,
  copyOutline,
  cardOutline,
  helpCircleOutline,
  cartOutline,
  createOutline,
  trashOutline,
} from 'ionicons/icons';
import { financeService } from '../../../services/financeService';
import { formatCurrencyCompact } from '../../../utils/formatCurrency';
import type { AgentInsight, NightAnalysis, NightAnalysisTransactionContext, Transaction, CategoryResource, TransactionUpdatePayload } from '../../../types/finance.types';
import { CoachNote } from '../../molecules/CoachNote/CoachNote';
import { StatusStrip } from '../../molecules/StatusStrip/StatusStrip';
import { CategoryPressureCard } from '../../molecules/CategoryPressureCard/CategoryPressureCard';
import { ReasoningAccordion } from '../../molecules/ReasoningAccordion/ReasoningAccordion';
import { InsightTabBar } from '../../molecules/InsightTabBar/InsightTabBar';
import { Spinner } from '../../atoms/Spinner';
import type { CategoryType } from '../../molecules/CategoryPressureCard/CategoryPressureCard';
import { CrudModal } from '../../molecules/CrudModal';
import { TransactionComposer } from '../../organisms/TransactionComposer/TransactionComposer';
import styles from './NightAnalysisDetailPage.module.css';
import { AppLayout } from '../../templates/AppLayout';
import { useDesktopLayout } from '../../../hooks/useDesktopLayout';
import { BarPct, InstButton, Num, StateTag } from '../../atoms/Inst';
import { InstBand, InstNote, InstPageHeader, InstSection, InstStats, InstTable, InstTableSkeleton } from '../../molecules/Inst';
import { fmtAmount } from '../../../utils/instrumento';
import { CoachLine, InsightTabs, Reasoning } from '../MonthlyInsightDetailPage/InsightDesk';
import desk from '../MonthlyInsightDetailPage/InsightDesk.module.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

const CAT_NAMES: Record<string, string> = {
  committed:     'Comprometido',
  necessary:     'Necesario',
  discretionary: 'Flexible',
  investment:    'Inversión',
  social:        'Social',
  income:        'Ingreso',
};

const HEALTH_LABELS: Record<string, { label: string; tone: 'warn' | 'bad' | undefined }> = {
  comfortable: { label: 'Tranquilo',  tone: undefined },
  warning:     { label: 'Justo',      tone: 'warn' },
  critical:    { label: 'En rojo',    tone: 'bad' },
};

const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', weekday: 'long' }).format(date);
};

const formatTime = (iso: string): string => {
  return new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso));
};

type ReviewItem = NonNullable<NightAnalysisTransactionContext['needs_review']>[number];

const REVIEW_LABEL: Record<ReviewItem['reason'], string> = {
  unconfirmed:        'El agente no estaba seguro si este movimiento era real.',
  no_classification:  'No supe en qué gaveta ponerlo.',
  deduplication_risk: 'Esto se parece a un movimiento que ya tenías registrado.',
  possible_debt:      'Esto parece un pago de deuda no registrado.',
};

const PRIMARY_LABEL: Record<ReviewItem['reason'], { label: string; icon: string }> = {
  unconfirmed:        { label: 'Confirmar',      icon: checkmarkDoneOutline },
  no_classification:  { label: 'Editar',         icon: createOutline },
  deduplication_risk: { label: 'Eliminar este',  icon: trashOutline },
  possible_debt:      { label: 'Editar',         icon: createOutline },
};

const SECONDARY_LABEL: Record<ReviewItem['reason'], string> = {
  unconfirmed:        'Editar',
  no_classification:  'Descartar',
  deduplication_risk: 'Son distintos',
  possible_debt:      'Descartar',
};

const REVIEW_ICON: Record<ReviewItem['reason'], string> = {
  unconfirmed:        checkmarkDoneOutline,
  no_classification:  helpCircleOutline,
  deduplication_risk: copyOutline,
  possible_debt:      cardOutline,
};

const ICON_CLASS: Record<ReviewItem['reason'], string> = {
  unconfirmed:        '',
  no_classification:  '',
  deduplication_risk: styles.reviewIconDedup,
  possible_debt:      styles.reviewIconDebt,
};

// ── ReviewCard ────────────────────────────────────────────────────────────────

interface ReviewCardProps {
  item: ReviewItem;
  onPrimary: (item: ReviewItem) => Promise<void>;
  onSecondary: (item: ReviewItem) => Promise<void>;
}

const ReviewCard = ({ item, onPrimary, onSecondary }: ReviewCardProps) => {
  const [loading, setLoading] = useState(false);

  const handlePrimary = async () => {
    setLoading(true);
    try { await onPrimary(item); } finally { setLoading(false); }
  };

  const primary = PRIMARY_LABEL[item.reason];

  return (
    <div className={styles.reviewCard}>
      <div className={styles.reviewHead}>
        <div className={`${styles.reviewIcon} ${ICON_CLASS[item.reason]}`}>
          <IonIcon icon={REVIEW_ICON[item.reason]} />
        </div>
        <div className={styles.reviewInfo}>
          <span className={styles.reviewConcept}>{item.concept}</span>
          <span className={styles.reviewMeta}>
            {formatCurrencyCompact(item.amount)} · {item.date}
          </span>
        </div>
      </div>

      <div className={styles.reviewAsk}>
        {item.notes ?? REVIEW_LABEL[item.reason]}
      </div>

      <div className={styles.reviewActions}>
        <button
          type="button"
          className={`${styles.btnPrimary} ${item.reason === 'deduplication_risk' ? styles.btnDanger : ''}`}
          onClick={handlePrimary}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : <IonIcon icon={primary.icon} />}
          {primary.label}
        </button>
        <button type="button" className={styles.btnGhost} onClick={() => void onSecondary(item)}>
          {SECONDARY_LABEL[item.reason]}
        </button>
      </div>
    </div>
  );
};

// ── Escritorio: acciones de una fila de revisión (las mismas de ReviewCard) ─────────
const ReviewActions = ({ item, onPrimary, onSecondary }: ReviewCardProps) => {
  const [loading, setLoading] = useState(false);
  const primary = PRIMARY_LABEL[item.reason];
  const handlePrimary = async () => {
    setLoading(true);
    try { await onPrimary(item); } finally { setLoading(false); }
  };
  return (
    <span className={desk.actionsGap}>
      <button type="button" className={desk.quiet} onClick={() => void onSecondary(item)}>{SECONDARY_LABEL[item.reason]}</button>
      <InstButton primary={item.reason === 'unconfirmed'} disabled={loading} onClick={() => void handlePrimary()}>
        {loading ? 'Un momento…' : primary.label}
      </InstButton>
    </span>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export const NightAnalysisDetailPage = () => {
  const { date } = useParams<{ date: string }>();
  const history = useHistory();
  const location = useLocation<{ insight?: AgentInsight }>();
  const isDesktop = useDesktopLayout();
  const [analysis, setAnalysis] = useState<NightAnalysis | null>(null);
  const [allReviews, setAllReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [categories, setCategories] = useState<CategoryResource[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const dismiss = (id: number) => setDismissed((prev) => new Set(prev).add(id));

  const refetchReviews = async () => {
    try {
      const r = await financeService.fetchNeedsReview();
      setAllReviews(r);
      setDismissed(new Set());
    } catch { /* keep stale data */ }
  };

  const openEditModal = async (transactionId: number) => {
    try {
      const txn = await financeService.fetchTransactionById(String(transactionId));
      setEditingTransaction(txn);
    } catch {
      history.push('/transactions');
    }
  };

  const handlePrimary = async (item: ReviewItem) => {
    const id = String(item.transaction_id);
    switch (item.reason) {
      case 'unconfirmed':
        await financeService.confirmTransaction(id);
        dismiss(item.transaction_id);
        void refetchReviews();
        break;
      case 'deduplication_risk':
        await financeService.deleteTransaction(id);
        dismiss(item.transaction_id);
        void refetchReviews();
        break;
      case 'no_classification':
      case 'possible_debt':
        await openEditModal(item.transaction_id);
        break;
    }
  };

  const handleSecondary = async (item: ReviewItem) => {
    if (item.reason === 'unconfirmed') {
      void openEditModal(item.transaction_id);
    } else {
      dismiss(item.transaction_id);
      await financeService.dismissTransactionFlag(String(item.transaction_id)).catch(() => null);
      void refetchReviews();
    }
  };

  const handleUpdate = async (id: string, payload: TransactionUpdatePayload) => {
    setSubmitting(true);
    try {
      await financeService.updateTransaction(id, payload);
      setEditingTransaction(null);
      await refetchReviews();
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      financeService.fetchNightAnalysisByDate(date),
      financeService.fetchNeedsReview(),
      financeService.fetchCategories(),
    ])
      .then(([a, r, cats]) => {
        setAnalysis(a);
        setAllReviews(r);
        setCategories(cats.data ?? []);
      })
      .catch(() => { setAnalysis(null); setAllReviews([]); })
      .finally(() => setLoading(false));
  }, [date]);

  const insight = analysis?.agent_insight ?? location.state?.insight ?? null;
  const health = analysis ? HEALTH_LABELS[analysis.health_status] : null;
  const reviews = allReviews.filter((r) => !dismissed.has(r.transaction_id));
  const matched = analysis?.transactions_context.matched ?? [];
  const unmatched = analysis?.transactions_context.unmatched ?? [];
  const pressureAlerts = (analysis?.category_alerts ?? []).filter((a) => a.pct_used > 50);

  // Derive month/year from date param for tab navigation (YYYY-MM-DD or DD/MM)
  const tabDate = date;
  const parsedDate = (() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Date(date);
    const [d2, m2] = date.split('/').map(Number);
    return new Date(new Date().getFullYear(), m2 - 1, d2);
  })();
  const tabMonth = parsedDate.getMonth() + 1;
  const tabYear = parsedDate.getFullYear();

  const editModal = (
    <CrudModal
      isOpen={Boolean(editingTransaction)}
      title="Editar transacción"
      subtitle="Ajusta contexto, clasificación y subcategoría."
      onClose={() => setEditingTransaction(null)}
    >
      <TransactionComposer
        transaction={editingTransaction}
        categories={categories}
        loading={submitting}
        onCreate={async () => undefined}
        onUpdate={handleUpdate}
        onCancel={() => setEditingTransaction(null)}
      />
    </CrudModal>
  );

  // ── Escritorio (TCW-5 "Instrumento"): hereda el armazón, sin islas. Mismos datos y acciones. ──
  if (isDesktop) {
    const dateLabel = date ? formatDate(date) : '';
    return (
      <AppLayout title="Planes" ownHeader>
        <div className={desk.page} data-testid="night-desktop">
          <InstPageHeader title="Análisis nocturno" sub={dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
            actions={<InstButton onClick={() => history.goBack()}>‹ Volver</InstButton>} />
          <InstBand>
            <span className={desk.month}>Revisión de la noche</span>
            {health ? <StateTag state={health.label.toLowerCase()} tone={health.tone === 'bad' ? 'rose' : health.tone === 'warn' ? 'amber' : 'ok'} /> : null}
            <span className={desk.flex} />
            <InsightTabs active="nocturno" date={tabDate} month={tabMonth} year={tabYear} />
          </InstBand>
          {loading ? (
            <InstSection title="Necesito tu ayuda"><InstTableSkeleton heads={['Movimiento', 'Fecha', 'Monto (COP)', '']} aligns={['left', 'left', 'right', 'right']} rows={3} /></InstSection>
          ) : (
            <>
              {analysis ? (
                <InstStats items={[
                  { label: 'Estado', value: <span className={health?.tone === 'bad' ? desk.rose : undefined}>{health?.label ?? '—'}</span>, sub: 'salud del mes' },
                  { label: 'Margen', value: fmtAmount(analysis.commitment_gap), sub: 'frente a lo comprometido' },
                  { label: 'Ritmo', value: fmtAmount(analysis.daily_burn), sub: 'COP por día' },
                ]} />
              ) : null}
              {insight ? (
                <CoachLine body={insight.body} meta={[
                  `Generado a las ${formatTime(insight.generated_at)}`,
                  ...(reviews.length > 0 ? [`${reviews.length} movimiento${reviews.length > 1 ? 's' : ''} esperan tu ayuda`] : []),
                ]} />
              ) : null}
              {!analysis ? (
                <InstNote>Sin datos de contexto para esta fecha.</InstNote>
              ) : (
                <>
                  {reviews.length > 0 ? (
                    <InstSection title={`Necesito tu ayuda · ${reviews.length}`}>
                      <InstTable caption="Movimientos que necesitan tu ayuda" heads={['Movimiento', 'Fecha', 'Monto (COP)', '']} aligns={['left', 'left', 'right', 'right']}
                        rowKeys={reviews.map((r) => r.transaction_id)}
                        rows={reviews.map((r) => [
                          <><div className={desk.name}>{r.concept}</div><div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{r.notes ?? REVIEW_LABEL[r.reason]}</div></>,
                          <span className={desk.right}>{r.date}</span>,
                          <Num strong>{fmtAmount(r.amount)}</Num>,
                          <ReviewActions item={r} onPrimary={handlePrimary} onSecondary={() => handleSecondary(r)} />,
                        ])} />
                    </InstSection>
                  ) : null}
                  {matched.length > 0 ? (
                    <InstSection title={`Lo que esperaba ver · ${matched.length} cumplidos`}>
                      <InstTable caption="Obligaciones cumplidas" heads={['Obligación', 'Diferencia', 'Monto (COP)']} aligns={['left', 'right', 'right']}
                        rowKeys={matched.map((m) => m.transaction_id)}
                        rows={matched.map((m) => [
                          <span className={desk.name}>{m.obligation_name}</span>,
                          Math.abs(m.delta) / m.expected_amount > 0.05
                            ? <Num tone="muted">{fmtAmount(m.delta, { sign: 'always' })} vs esperado</Num> : <Num tone="muted">—</Num>,
                          <Num strong>{fmtAmount(m.amount)}</Num>,
                        ])} />
                    </InstSection>
                  ) : null}
                  {unmatched.length > 0 ? (
                    <InstSection title="Otros movimientos del día">
                      <InstTable caption="Otros movimientos del día" heads={['Movimiento', 'Gaveta', 'Monto (COP)']} aligns={['left', 'left', 'right']}
                        rowKeys={unmatched.map((u) => u.transaction_id)}
                        rows={unmatched.map((u) => [
                          <span className={desk.name}>{u.concept}</span>,
                          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{CAT_NAMES[u.category_type] ?? u.category_type}</span>,
                          <Num strong>{fmtAmount(u.amount)}</Num>,
                        ])} />
                    </InstSection>
                  ) : null}
                  {pressureAlerts.length > 0 ? (
                    <InstSection title="Gavetas con presión">
                      {/* TCW-5 comment-90: las barras reales de siempre (CategoryPressureCard), dentro del marco nuevo. */}
                      <div className={desk.pressureGrid}>
                        {pressureAlerts.map((a) => (
                          <CategoryPressureCard
                            key={a.category_type}
                            name={CAT_NAMES[a.category_type] ?? a.category_type}
                            pct={a.pct_used}
                            spent={a.spent}
                            limit={a.budget}
                            category={a.category_type as CategoryType}
                          />
                        ))}
                      </div>
                    </InstSection>
                  ) : null}
                  {analysis.agent_reasoning ? <Reasoning text={analysis.agent_reasoning} /> : null}
                </>
              )}
            </>
          )}
        </div>
        {editModal}
      </AppLayout>
    );
  }

  return (
    <IonPage className={styles.page}>
      {/* Header */}
      <div className={styles.topbar}>
        <button type="button" className={styles.iconBtn} onClick={() => history.goBack()}>
          <IonIcon icon={chevronBackOutline} />
        </button>
        <div className={styles.crumb}>
          <span className={styles.crumbKind}>Análisis nocturno</span>
          {date ? <span className={styles.crumbDate}>{formatDate(date)}</span> : null}
        </div>
        <div className={styles.iconBtn} style={{ visibility: 'hidden' }}>
          <IonIcon icon={optionsOutline} />
        </div>
      </div>

      <IonContent className={styles.content}>
        <div className={styles.scroll}>

          {loading ? (
            <div className={styles.loader}><Spinner size="lg" /></div>
          ) : (
            <>
              {/* Coach note */}
              {insight ? (
                <CoachNote
                  body={insight.body}
                  meta={[
                    `Generado a las ${formatTime(insight.generated_at)}`,
                    ...(reviews.length > 0 ? [`${reviews.length} movimiento${reviews.length > 1 ? 's' : ''} esperan tu ayuda`] : []),
                  ]}
                />
              ) : null}

              {/* Status strip */}
              {analysis ? (
                <StatusStrip cells={[
                  { label: 'Estado', value: health?.label ?? '—', tone: health?.tone },
                  { label: 'Margen', value: formatCurrencyCompact(analysis.commitment_gap) },
                  { label: 'Ritmo', value: `${formatCurrencyCompact(analysis.daily_burn)}/día` },
                ]} />
              ) : null}

              {!analysis ? (
                <div className={styles.empty}>Sin datos de contexto para esta fecha.</div>
              ) : (
                <>
                  {/* Needs review — action-first */}
                  {reviews.length > 0 ? (
                    <>
                      <div className={styles.secHead}>
                        <h3 className={styles.secTitle}>Necesito tu ayuda</h3>
                        <span className={styles.secMeta}>{reviews.length} pendientes</span>
                      </div>
                      <div className={styles.helpBlock}>
                        <div className={styles.helpIntro}>
                          <div className={styles.helpIcon} aria-hidden="true" />
                          <div className={styles.helpText}>
                            <p className={styles.helpTitle}>
                              No entendí {reviews.length} movimiento{reviews.length > 1 ? 's' : ''}.
                            </p>
                            <p className={styles.helpSub}>
                              Si los aclarás ahora, mañana mi análisis va a ser más exacto. Te toma menos de un minuto.
                            </p>
                          </div>
                        </div>
                        {reviews.map((r) => (
                          <ReviewCard
                            key={r.transaction_id}
                            item={r}
                            onPrimary={handlePrimary}
                            onSecondary={() => handleSecondary(r)}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}

                  {/* Matched obligations */}
                  {matched.length > 0 ? (
                    <>
                      <div className={styles.secHead}>
                        <h3 className={styles.secTitle}>Lo que esperaba ver</h3>
                        <span className={styles.secMeta}>{matched.length} cumplidos</span>
                      </div>
                      <div className={styles.list}>
                        {matched.map((m) => (
                          <div key={m.transaction_id} className={styles.row}>
                            <div className={styles.rowIconCheck}>
                              <IonIcon icon={checkmarkOutline} />
                            </div>
                            <div className={styles.rowBody}>
                              <span className={styles.rowName}>{m.obligation_name}</span>
                              {Math.abs(m.delta) / m.expected_amount > 0.05 ? (
                                <span className={styles.rowMeta}>
                                  {m.delta > 0 ? '+' : ''}{formatCurrencyCompact(m.delta)} vs esperado
                                </span>
                              ) : null}
                            </div>
                            <span className={styles.rowAmt}>{formatCurrencyCompact(m.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {/* Unmatched transactions */}
                  {unmatched.length > 0 ? (
                    <>
                      <div className={styles.secHead}>
                        <h3 className={styles.secTitle}>Otros movimientos del día</h3>
                      </div>
                      <div className={styles.list}>
                        {unmatched.map((u) => (
                          <div key={u.transaction_id} className={styles.row}>
                            <div className={styles.rowIconWarn}>
                              <IonIcon icon={cartOutline} />
                            </div>
                            <div className={styles.rowBody}>
                              <span className={styles.rowName}>{u.concept}</span>
                              <span className={styles.rowMeta}>{CAT_NAMES[u.category_type] ?? u.category_type}</span>
                            </div>
                            <span className={styles.rowAmt}>{formatCurrencyCompact(u.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {/* Category pressure */}
                  {pressureAlerts.length > 0 ? (
                    <>
                      <div className={styles.secHead}>
                        <h3 className={styles.secTitle}>Gavetas con presión</h3>
                      </div>
                      <div className={styles.pressureList}>
                        {pressureAlerts.map((a) => (
                          <CategoryPressureCard
                            key={a.category_type}
                            name={CAT_NAMES[a.category_type] ?? a.category_type}
                            pct={a.pct_used}
                            spent={a.spent}
                            limit={a.budget}
                            category={a.category_type as CategoryType}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}

                  {/* Reasoning */}
                  {analysis.agent_reasoning ? (
                    <ReasoningAccordion text={analysis.agent_reasoning} />
                  ) : null}
                </>
              )}
            </>
          )}
        </div>
      </IonContent>
      <InsightTabBar active="nocturno" date={tabDate} month={tabMonth} year={tabYear} />

      <CrudModal
        isOpen={Boolean(editingTransaction)}
        title="Editar transacción"
        subtitle="Ajusta contexto, clasificación y subcategoría."
        onClose={() => setEditingTransaction(null)}
      >
        <TransactionComposer
          transaction={editingTransaction}
          categories={categories}
          loading={submitting}
          onCreate={async () => undefined}
          onUpdate={handleUpdate}
          onCancel={() => setEditingTransaction(null)}
        />
      </CrudModal>
    </IonPage>
  );
};
