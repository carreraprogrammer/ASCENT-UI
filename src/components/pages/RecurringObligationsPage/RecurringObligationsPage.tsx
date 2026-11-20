import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { IonContent, IonIcon } from '@ionic/react';
import { addOutline, funnelOutline, optionsOutline } from 'ionicons/icons';
import { AppLayout } from '../../templates/AppLayout';
import { useAppToolbar } from '../../templates/AppLayout/AppLayoutContext';
import { BreadcrumbTrail } from '../../organisms/BreadcrumbTrail';
import { Button } from '../../atoms/Button';
import { Spinner } from '../../atoms/Spinner';
import { SelectInput } from '../../atoms/SelectInput';
import { ErrorState } from '../../molecules/ErrorState';
import { EmptyState } from '../../molecules/EmptyState';
import { ConfirmModal } from '../../molecules/ConfirmModal';
import { CrudModal } from '../../molecules/CrudModal';
import { AppliedFiltersBar } from '../../molecules/AppliedFiltersBar';
import { SortSheet } from '../../molecules/SortSheet';
import { RecurringObligationComposer } from '../../organisms/RecurringObligationComposer';
import { RecurringObligationSlidingCard } from '../../organisms/RecurringObligationSlidingCard';
import { IncomeSourceComposer } from '../../organisms/IncomeSourceComposer';
import { IncomeSourceSlidingCard } from '../../organisms/IncomeSourceSlidingCard';
import { useToast } from '../../../hooks/useToast';
import { financeService } from '../../../services/financeService';
import { getCategoryDisplayName } from '../../../utils/categoryLabels';
import { formatCurrencyCompact } from '../../../utils/formatCurrency';
import type {
  CategoryResource,
  IncomeSource,
  IncomeSourcePayload,
  IncomeSourceQueryParams,
  Debt,
  RecurringObligation,
  RecurringObligationPayload,
  RecurringObligationQueryParams,
  SummaryResponse,
} from '../../../types/finance.types';
import styles from '../FinancePage.module.css';
import { Bar, CategoryCell, DateCell, InstButton, Num, StateTag, Sub, Two } from '../../atoms/Inst';
import { InstNote, InstPageHeader, InstSection, InstStats, InstTable, InstTableSkeleton, type Align } from '../../molecules/Inst';
import { useDesktopLayout } from '../../../hooks/useDesktopLayout';
import { fmtAmount } from '../../../utils/instrumento';
import { CellWithActions, SortHead, instDeskStyles as desk } from '../TransactionsPage/instDesk';
import { incomeDayLabel, nextSort, obligationState } from '../TransactionsPage/instDeskData';

const initialObligationFilters: RecurringObligationQueryParams = {
  q: '',
  active: 'all',
  category_id: '',
  sort_by: 'due_day',
  sort_dir: 'asc',
};

const initialIncomeFilters: IncomeSourceQueryParams = {
  q: '',
  active: true,
  is_variable: 'all',
  sort_by: 'expected_day_from',
  sort_dir: 'asc',
};

export const RecurringObligationsContent = () => {
  const [obligations, setObligations] = useState<RecurringObligation[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [categories, setCategories] = useState<CategoryResource[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [obligationFiltersVisible, setObligationFiltersVisible] = useState(false);
  const [incomeFiltersVisible, setIncomeFiltersVisible] = useState(false);
  const [editingObligation, setEditingObligation] = useState<RecurringObligation | null>(null);
  const [deletingObligation, setDeletingObligation] = useState<RecurringObligation | null>(null);
  const [unlinkingObligation, setUnlinkingObligation] = useState<RecurringObligation | null>(null);
  const [obligationFilters, setObligationFilters] = useState<RecurringObligationQueryParams>(initialObligationFilters);
  const [incomeFilters, setIncomeFilters] = useState<IncomeSourceQueryParams>(initialIncomeFilters);
  const [incomeSortOpen, setIncomeSortOpen] = useState(false);
  const [activeView, setActiveView] = useState<'income' | 'obligations'>('obligations');
  const [incomeComposerOpen, setIncomeComposerOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [deletingIncome, setDeletingIncome] = useState<IncomeSource | null>(null);
  const { showError, showSuccess, toast } = useToast();
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [obligationsResponse, incomeResponse, categoriesResponse, debtsResponse, summaryResponse] = await Promise.all([
        financeService.fetchRecurringObligations(obligationFilters),
        financeService.fetchIncomeSources(incomeFilters),
        financeService.fetchCategories(),
        financeService.fetchDebts({ status: 'active', sort_by: 'created_at', sort_dir: 'desc' }),
        financeService.fetchSummary().catch(() => null),
      ]);
      setObligations(obligationsResponse.data);
      setIncomeSources(incomeResponse.data);
      setCategories(categoriesResponse.data);
      setDebts(debtsResponse.data);
      setSummary(summaryResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar la operación recurrente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [incomeFilters, obligationFilters]);

  const metrics = useMemo(() => {
    const activeObligations = obligations.filter((obligation) => obligation.attributes.active !== false);
    return {
      obligationsTotal: activeObligations.reduce((sum, obligation) => sum + obligation.attributes.amount, 0),
      obligationsCount: activeObligations.length,
      incomeTotal: incomeSources.reduce((sum, source) => sum + source.attributes.expected_amount, 0),
      incomeCount: incomeSources.length,
    };
  }, [incomeSources, obligations]);
  const coveragePct = metrics.obligationsTotal > 0
    ? Math.round((metrics.incomeTotal / metrics.obligationsTotal) * 100)
    : 0;
  const monthExecution = summary?.month_execution;
  const incomeExecution = monthExecution?.income;
  const recurringExecution = monthExecution?.recurring_obligations;

  const handleCreate = async (payload: RecurringObligationPayload) => {
    setSubmitting(true);
    try {
      await financeService.createRecurringObligation(payload);
      setComposerOpen(false);
      await load();
      showSuccess('Recurrente guardado.');
    } catch (nextError) {
      showError(nextError instanceof Error ? nextError.message : 'No fue posible guardar el recurrente.');
      throw nextError;
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, payload: Partial<RecurringObligationPayload>) => {
    setSubmitting(true);
    try {
      await financeService.updateRecurringObligation(id, payload);
      setEditingObligation(null);
      setComposerOpen(false);
      await load();
      showSuccess('Recurrente actualizado.');
    } catch (nextError) {
      showError(nextError instanceof Error ? nextError.message : 'No fue posible actualizar el recurrente.');
      throw nextError;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingObligation) {
      return;
    }

    setSubmitting(true);
    try {
      await financeService.deleteRecurringObligation(deletingObligation.id);
      setDeletingObligation(null);
      if (editingObligation?.id === deletingObligation.id) {
        setEditingObligation(null);
      }
      await load();
      showSuccess('Recurrente borrado.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No fue posible borrar el recurrente.');
      showError(deleteError instanceof Error ? deleteError.message : 'No fue posible borrar el recurrente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateIncome = async (payload: IncomeSourcePayload) => {
    setSubmitting(true);
    try {
      await financeService.createIncomeSource(payload);
      setIncomeComposerOpen(false);
      await load();
      showSuccess('Ingreso guardado.');
    } catch (nextError) {
      showError(nextError instanceof Error ? nextError.message : 'No fue posible guardar el ingreso.');
      throw nextError;
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateIncome = async (id: string, payload: Partial<IncomeSourcePayload>) => {
    setSubmitting(true);
    try {
      await financeService.updateIncomeSource(id, payload);
      setEditingIncome(null);
      setIncomeComposerOpen(false);
      await load();
      showSuccess('Ingreso actualizado.');
    } catch (nextError) {
      showError(nextError instanceof Error ? nextError.message : 'No fue posible actualizar el ingreso.');
      throw nextError;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIncome = async () => {
    if (!deletingIncome) return;
    setSubmitting(true);
    try {
      await financeService.deleteIncomeSource(deletingIncome.id);
      setDeletingIncome(null);
      if (editingIncome?.id === deletingIncome.id) setEditingIncome(null);
      await load();
      showSuccess('Ingreso borrado.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No fue posible borrar el ingreso.');
      showError(deleteError instanceof Error ? deleteError.message : 'No fue posible borrar el ingreso.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedObligationCategoryId = obligationFilters.category_id ? String(obligationFilters.category_id) : '';
  const categoryFilters = useMemo(
    () =>
      categories.map((category) => ({
        id: String(category.id),
        name: getCategoryDisplayName({
          name: category.attributes.name,
          code: category.attributes.code,
          type: category.attributes.category_type,
        }),
        color: category.attributes.color ?? 'var(--color-brand)',
      })),
    [categories],
  );

  const obligationChips = useMemo(() => {
    const chips = [];
    if (obligationFilters.q) chips.push({ key: 'q', label: `Buscar: ${obligationFilters.q}` });
    if (obligationFilters.active !== 'all') {
      chips.push({ key: 'active', label: obligationFilters.active ? 'Solo activas' : 'Solo inactivas' });
    }
    if (obligationFilters.category_id) {
      const category = categoryFilters.find((item) => item.id === String(obligationFilters.category_id));
      chips.push({ key: 'category_id', label: `Categoría: ${category?.name ?? obligationFilters.category_id}` });
    }
    return chips;
  }, [categoryFilters, obligationFilters.active, obligationFilters.category_id, obligationFilters.q]);

  const incomeChips = useMemo(() => {
    const chips = [];
    if (incomeFilters.q) chips.push({ key: 'q', label: `Buscar: ${incomeFilters.q}` });
    if (incomeFilters.is_variable !== 'all') {
      chips.push({ key: 'is_variable', label: incomeFilters.is_variable ? 'Variables' : 'Fijos' });
    }
    return chips;
  }, [incomeFilters.is_variable, incomeFilters.q]);
  const obligationActiveFilterCount = useMemo(
    () => obligationChips.filter((chip) => chip.key !== 'q').length,
    [obligationChips],
  );
  const incomeActiveFilterCount = useMemo(
    () => incomeChips.filter((chip) => chip.key !== 'q').length,
    [incomeChips],
  );
  const toolbar = useMemo(() => {
    if (!detailsOpen) return null;

    if (activeView === 'income') {
      return {
        title: 'Ingresos recurrentes',
        subtitle: 'Fuentes que sostienen el mes',
        searchPlaceholder: 'Nombre',
        searchValue: incomeFilters.q ?? '',
        resultLabel: `${incomeSources.length} resultados`,
        onSearchChange: (q: string) => setIncomeFilters((current) => ({ ...current, q })),
        actions: [
          {
            key: 'sort-income',
            label: 'Ordenar',
            icon: <IonIcon icon={optionsOutline} />,
            onClick: () => setIncomeSortOpen(true),
          },
          {
            key: 'filter-income',
            label: 'Filtrar',
            icon: <IonIcon icon={funnelOutline} />,
            onClick: () => setIncomeFiltersVisible((visible) => !visible),
            badgeCount: incomeActiveFilterCount,
            active: incomeFiltersVisible,
          },
        ],
      };
    }

    return {
      title: 'Obligaciones recurrentes',
      subtitle: 'Compromisos que vuelven cada mes',
      searchPlaceholder: 'Nombre',
      searchValue: obligationFilters.q ?? '',
      resultLabel: `${obligations.length} resultados`,
      onSearchChange: (q: string) => setObligationFilters((current) => ({ ...current, q })),
      actions: [
        {
          key: 'sort-obligations',
          label: 'Ordenar',
          icon: <IonIcon icon={optionsOutline} />,
          onClick: () => setSortOpen(true),
        },
        {
          key: 'filter-obligations',
          label: 'Filtrar',
          icon: <IonIcon icon={funnelOutline} />,
          onClick: () => setObligationFiltersVisible((visible) => !visible),
          badgeCount: obligationActiveFilterCount,
          active: obligationFiltersVisible,
        },
      ],
    };
  }, [
    activeView,
    detailsOpen,
    incomeActiveFilterCount,
    incomeFilters.q,
    incomeFiltersVisible,
    incomeSources.length,
    obligationActiveFilterCount,
    obligationFilters.q,
    obligationFiltersVisible,
    obligations.length,
  ]);

  useAppToolbar(toolbar);

  const debtById = useMemo(
    () => new Map(debts.map((debt) => [debt.id, debt])),
    [debts],
  );

  const debtLinkLabel = (obligation: RecurringObligation) => {
    if (obligation.attributes.source_type !== 'Debt' || !obligation.attributes.source_id) {
      return null;
    }

    const linkedDebt = debtById.get(String(obligation.attributes.source_id));
    if (linkedDebt) {
      return `Deuda: ${linkedDebt.attributes.name}`;
    }

    return `Deuda inexistente (#${obligation.attributes.source_id})`;
  };

  const handleUnlinkDebt = async () => {
    if (!unlinkingObligation) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await financeService.updateRecurringObligation(unlinkingObligation.id, {
        source_type: null,
        source_id: null,
      });
      setUnlinkingObligation(null);
      await load();
      showSuccess('Vínculo de deuda quitado.');
    } catch (unlinkError) {
      setError(unlinkError instanceof Error ? unlinkError.message : 'No fue posible quitar el vínculo de deuda.');
      showError(unlinkError instanceof Error ? unlinkError.message : 'No fue posible quitar el vínculo de deuda.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── TCW-5 "Instrumento": vista de escritorio (mockup U_AscentRecurrentes). Mismos datos, modales y acciones. ──
  const isDesktop = useDesktopLayout();
  const openNewObligation = () => { setEditingObligation(null); setComposerOpen(true); };
  const openNewIncome = () => { setEditingIncome(null); setIncomeComposerOpen(true); };
  const executionById = useMemo(
    () => new Map((recurringExecution?.items ?? []).map((item) => [String(item.id), item])),
    [recurringExecution],
  );
  const obSortDefault = (obligationFilters.sort_by ?? 'due_day') === 'due_day' && (obligationFilters.sort_dir ?? 'asc') === 'asc';
  const obSort = (column: string) => setObligationFilters((current) => ({
    ...current, ...nextSort(current, column, column === 'amount' ? 'desc' : 'asc'),
  }));
  const obHead = (label: string, column: string) => (
    <SortHead label={label} column={column} sortBy={obligationFilters.sort_by} sortDir={obligationFilters.sort_dir}
      isDefault={obSortDefault} onSort={obSort} />
  );
  const inSortDefault = (incomeFilters.sort_by ?? 'expected_day_from') === 'expected_day_from' && (incomeFilters.sort_dir ?? 'asc') === 'asc';
  const inSort = (column: string) => setIncomeFilters((current) => ({
    ...current, ...nextSort(current, column, column === 'expected_amount' ? 'desc' : 'asc'),
  }));
  const inHead = (label: string, column: string) => (
    <SortHead label={label} column={column} sortBy={incomeFilters.sort_by} sortDir={incomeFilters.sort_dir}
      isDefault={inSortDefault} onSort={inSort} />
  );
  const obHeads = [obHead('Recurrente', 'name'), obHead('Día de vencimiento', 'due_day'), 'Deuda vinculada', 'Estado', obHead('Monto (COP)', 'amount')];
  const obAligns: Align[] = ['left', 'right', 'left', 'left', 'right'];
  const inHeads = [inHead('Ingreso', 'name'), inHead('Día esperado', 'expected_day_from'), inHead('Monto (COP)', 'expected_amount')];
  const inAligns: Align[] = ['left', 'left', 'right'];
  const obRows = obligations.map((obligation) => {
    const attrs = obligation.attributes;
    const linked = attrs.source_type === 'Debt' && attrs.source_id ? debtById.get(String(attrs.source_id)) : null;
    const st = obligationState(attrs.active !== false, executionById.get(String(obligation.id))?.status);
    const catResource = categories.find((c) => Number(c.id) === attrs.category_id);
    const catCode = attrs.category_code ?? catResource?.attributes.code ?? null;
    return [
      <Two a={attrs.name} b={
        <CategoryCell code={catCode} subcategoryName={attrs.subcategory_name}
          gavetaName={catCode || attrs.category_name ? getCategoryDisplayName({ name: attrs.category_name, code: catCode, type: catResource?.attributes.category_type }) : null}
          icon={attrs.subcategory_icon ?? catResource?.attributes.icon} />
      } />,
      <Num>{attrs.due_day ?? '—'}</Num>,
      <Sub>{linked ? linked.attributes.name : attrs.source_type === 'Debt' && attrs.source_id ? `Deuda inexistente (#${attrs.source_id})` : '—'}</Sub>,
      <StateTag state={st.label} tone={st.tone} />,
      <CellWithActions actions={[
        ...(attrs.source_type === 'Debt' && attrs.source_id ? [{ label: 'Quitar vínculo', onClick: () => setUnlinkingObligation(obligation) }] : []),
        { label: 'Borrar', danger: true, onClick: () => setDeletingObligation(obligation) },
      ]}>
        <Num strong>{fmtAmount(attrs.amount)}</Num>
      </CellWithActions>,
    ];
  });
  const inRows = incomeSources.map((source) => [
    <span style={{ fontWeight: 500 }}>{source.attributes.name}</span>,
    <DateCell>{incomeDayLabel(source.attributes)}</DateCell>,
    <CellWithActions actions={[{ label: 'Borrar', danger: true, onClick: () => setDeletingIncome(source) }]}>
      <Num strong>{source.attributes.expected_amount > 0 ? fmtAmount(source.attributes.expected_amount) : '—'}</Num>
    </CellWithActions>,
  ]);

  const desktopView = (
    <div className={desk.page} data-testid="recurring-desktop">
      <InstPageHeader title="Recurrentes" sub="Lo que vuelve cada mes, y con qué se paga" />
      <InstStats items={[
        {
          label: 'Recurrentes cubiertos',
          value: recurringExecution
            ? <span className={desk.statBar}>{recurringExecution.pct} %<Bar pct={recurringExecution.pct} width="120px" label="Recurrentes cubiertos" /></span>
            : '—',
          sub: recurringExecution ? `${recurringExecution.covered_count} de ${recurringExecution.total_count} obligaciones completas` : 'sin datos del mes',
        },
        { label: 'Carga recurrente mensual', value: fmtAmount(metrics.obligationsTotal), sub: 'compromisos que vuelven cada mes' },
        { label: 'Por cubrir', value: recurringExecution ? fmtAmount(recurringExecution.remaining_total) : '—', sub: 'antes de fin de mes' },
      ]} />
      {error ? <InstNote error onRetry={() => void load()}>{error}</InstNote> : null}
      <InstSection title="Compromisos que vuelven cada mes" id="rec-obligaciones"
        right={<InstButton primary onClick={openNewObligation}>+ Nuevo recurrente</InstButton>}>
        {loading ? (
          <InstTableSkeleton heads={obHeads} aligns={obAligns} rows={5} />
        ) : error ? null : !obligations.length ? (
          <InstNote>Todavía no hay obligaciones recurrentes.</InstNote>
        ) : (
          <InstTable caption="Obligaciones recurrentes" heads={obHeads} aligns={obAligns} rows={obRows}
            rowKeys={obligations.map((o) => o.id)}
            onRowClick={(i) => { setEditingObligation(obligations[i]); setComposerOpen(true); }} />
        )}
      </InstSection>
      <InstSection title="Fuentes que sostienen el mes" id="rec-ingresos"
        right={<InstButton onClick={openNewIncome}>Agregar ingreso</InstButton>}>
        {loading ? (
          <InstTableSkeleton heads={inHeads} aligns={inAligns} rows={2} />
        ) : error ? null : !incomeSources.length ? (
          <InstNote>Todavía no hay fuentes de ingreso.</InstNote>
        ) : (
          <InstTable caption="Fuentes de ingreso" heads={inHeads} aligns={inAligns} rows={inRows}
            rowKeys={incomeSources.map((s) => s.id)}
            onRowClick={(i) => { setEditingIncome(incomeSources[i]); setIncomeComposerOpen(true); }} />
        )}
      </InstSection>
    </div>
  );

  const overlays = (
    <>
      <SortSheet
        isOpen={sortOpen}
        title="Ordenar recurrentes"
        sortBy={String(obligationFilters.sort_by ?? 'due_day')}
        sortDir={(obligationFilters.sort_dir as 'asc' | 'desc') ?? 'asc'}
        options={[
          { label: 'Día de vencimiento', value: 'due_day' },
          { label: 'Monto', value: 'amount' },
          { label: 'Nombre', value: 'name' },
        ]}
        onClose={() => setSortOpen(false)}
        onChangeSortBy={(sort_by) => setObligationFilters((current) => ({ ...current, sort_by }))}
        onChangeSortDir={(sort_dir) => setObligationFilters((current) => ({ ...current, sort_dir }))}
      />

      <SortSheet
        isOpen={incomeSortOpen}
        title="Ordenar ingresos"
        sortBy={String(incomeFilters.sort_by ?? 'expected_day_from')}
        sortDir={(incomeFilters.sort_dir as 'asc' | 'desc') ?? 'asc'}
        options={[
          { label: 'Día esperado', value: 'expected_day_from' },
          { label: 'Monto', value: 'expected_amount' },
          { label: 'Nombre', value: 'name' },
        ]}
        onClose={() => setIncomeSortOpen(false)}
        onChangeSortBy={(sort_by) => setIncomeFilters((current) => ({ ...current, sort_by }))}
        onChangeSortDir={(sort_dir) => setIncomeFilters((current) => ({ ...current, sort_dir }))}
      />

      <ConfirmModal
        isOpen={Boolean(deletingObligation)}
        title="Borrar recurrente"
        message={
          deletingObligation
            ? `Vas a borrar "${deletingObligation.attributes.name}". Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Borrar"
        danger
        onCancel={() => setDeletingObligation(null)}
        onConfirm={() => void handleDelete()}
      />

      <ConfirmModal
        isOpen={Boolean(unlinkingObligation)}
        title="Quitar vínculo de deuda"
        message={
          unlinkingObligation
            ? `Vas a quitar el vínculo de deuda de "${unlinkingObligation.attributes.name}". La obligación recurrente seguirá existiendo, solo se elimina la relación estructural.`
            : ''
        }
        confirmLabel="Quitar vínculo"
        onCancel={() => setUnlinkingObligation(null)}
        onConfirm={() => void handleUnlinkDebt()}
      />

      <CrudModal
        isOpen={composerOpen}
        title={editingObligation ? 'Editar recurrente' : 'Nuevo recurrente'}
        subtitle="Programa el cobro y clasifícalo con el mismo sistema visual de transacciones."
        onClose={() => {
          setComposerOpen(false);
          setEditingObligation(null);
        }}
      >
        <RecurringObligationComposer
          obligation={editingObligation}
          loading={submitting}
          categories={categories}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onCancel={() => {
            setComposerOpen(false);
            setEditingObligation(null);
          }}
        />
      </CrudModal>

      <CrudModal
        isOpen={incomeComposerOpen}
        title={editingIncome ? 'Editar ingreso' : 'Nuevo ingreso'}
        subtitle="Define cuánto entra, con qué frecuencia y qué tan confiable es para el plan."
        onClose={() => { setIncomeComposerOpen(false); setEditingIncome(null); }}
      >
        <IncomeSourceComposer
          source={editingIncome}
          loading={submitting}
          onCreate={handleCreateIncome}
          onUpdate={handleUpdateIncome}
          onCancel={() => { setIncomeComposerOpen(false); setEditingIncome(null); }}
        />
      </CrudModal>

      <ConfirmModal
        isOpen={Boolean(deletingIncome)}
        title="Borrar ingreso"
        message={deletingIncome ? `Vas a borrar "${deletingIncome.attributes.name}". Esta acción no se puede deshacer.` : ''}
        confirmLabel="Borrar"
        danger
        onCancel={() => setDeletingIncome(null)}
        onConfirm={() => void handleDeleteIncome()}
      />
      {toast}
    </>
  );

  if (isDesktop) {
    return (
      <>
        {desktopView}
        {overlays}
      </>
    );
  }

  return (
    <IonContent className={styles.pageContent}>
      <section className={`${styles.stack} ${!detailsOpen && !loading && !error ? styles.stackFill : ''}`}>
        {!detailsOpen && !loading && !error ? (
          <div className={styles.focusStage}>
            <div className={`${styles.focusCard} ${styles.focusCardFull} ${styles.focusCardCentered}`}>
              <div className={styles.focusGrid}>
                <div className={styles.focusCopy}>
                  <span className={styles.eyebrow}>Recurrentes</span>
                  <p className={styles.focusQuestion}>
                    {activeView === 'income'
                      ? '¿Con qué ingresos espero contar este mes?'
                      : '¿Cuánto pesa mi operación fija todos los meses?'}
                  </p>
                  <h2 className={styles.focusTitle}>
                    {activeView === 'income'
                      ? `${incomeSources.length} fuentes de ingreso`
                      : `${metrics.obligationsCount} obligaciones activas`}
                  </h2>
                  <p className={styles.focusText}>
                    {activeView === 'income'
                      ? incomeSources.length > 0
                        ? `${incomeSources.filter((s) => s.attributes.classification === 'base').length} fuentes base confiables de ${incomeSources.length} registradas.`
                        : 'Agrega tus fuentes de ingreso para que el plan mensual sepa con qué contar cada mes.'
                      : obligations.length > 0
                        ? `${metrics.obligationsCount} obligaciones activas que pesan todos los meses. Cámbialas solo si cambió la realidad.`
                        : 'Registra tus obligaciones recurrentes para ver su impacto en el flujo mensual.'}
                  </p>
                </div>
                <div>
                  <div className={styles.focusValue}>
                    {activeView === 'income' ? formatCurrencyCompact(metrics.incomeTotal) : formatCurrencyCompact(metrics.obligationsTotal)}
                  </div>
                  <p className={styles.focusCaption}>
                    {activeView === 'income' ? 'Ingreso esperado recurrente' : 'Carga recurrente mensual'}
                  </p>
                </div>
              </div>

              {metrics.obligationsTotal > 0 ? (
                <section className={styles.focusSupport}>
                  <div className={styles.focusSupportHeader}>
                    <h3 className={styles.focusSupportTitle}>Cobertura mensual</h3>
                    <span className={styles.focusSupportValue}>{coveragePct}%</span>
                  </div>
                  <div
                    className={styles.focusRail}
                    role="progressbar"
                    aria-valuenow={Math.min(coveragePct, 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Cobertura mensual: ${coveragePct}%`}
                  >
                    <div
                      className={`${styles.focusRailFill} ${coveragePct < 100 ? styles.focusRailFillWarn : ''}`}
                      style={{ width: `${Math.min(coveragePct, 100)}%` }}
                    />
                  </div>
                  <p className={styles.focusSupportText}>
                    {formatCurrencyCompact(metrics.incomeTotal)} de ingresos recurrentes frente a {formatCurrencyCompact(metrics.obligationsTotal)} en obligaciones.
                  </p>
                </section>
              ) : null}

              {incomeExecution || recurringExecution ? (
                <section className={styles.executionGrid}>
                  {incomeExecution ? (
                    <article className={styles.executionCard}>
                      <div className={styles.executionHeader}>
                        <span className={styles.executionLabel}>Ingresos entregados</span>
                        <strong className={styles.executionPct}>{incomeExecution.pct}%</strong>
                      </div>
                      <div
                        className={styles.executionTrack}
                        role="progressbar"
                        aria-valuenow={Math.min(incomeExecution.pct, 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Ingresos entregados: ${incomeExecution.pct}%`}
                      >
                        <div
                          className={styles.executionFill}
                          style={{ width: `${Math.min(incomeExecution.pct, 100)}%` }}
                        />
                      </div>
                      <p className={styles.executionAmount}>
                        {formatCurrencyCompact(incomeExecution.delivered_expected_total)} de {formatCurrencyCompact(incomeExecution.expected_total)}
                      </p>
                      <p className={styles.executionHint}>
                        {formatCurrencyCompact(incomeExecution.remaining_expected_total)} esperado por entregar
                      </p>
                    </article>
                  ) : null}

                  {recurringExecution ? (
                    <article className={styles.executionCard}>
                      <div className={styles.executionHeader}>
                        <span className={styles.executionLabel}>Recurrentes cubiertos</span>
                        <strong className={styles.executionPct}>{recurringExecution.pct}%</strong>
                      </div>
                      <div
                        className={styles.executionTrack}
                        role="progressbar"
                        aria-valuenow={Math.min(recurringExecution.pct, 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Recurrentes cubiertos: ${recurringExecution.pct}%`}
                      >
                        <div
                          className={styles.executionFill}
                          style={{ width: `${Math.min(recurringExecution.pct, 100)}%` }}
                        />
                      </div>
                      <p className={styles.executionAmount}>
                        {formatCurrencyCompact(recurringExecution.covered_total)} de {formatCurrencyCompact(recurringExecution.expected_total)}
                      </p>
                      <p className={styles.executionHint}>
                        {recurringExecution.covered_count}/{recurringExecution.total_count} obligaciones completas · {formatCurrencyCompact(recurringExecution.remaining_total)} por cubrir
                      </p>
                    </article>
                  ) : null}
                </section>
              ) : null}

              <div className={styles.focusMeta}>
                {activeView === 'income' ? (
                  <span className={styles.focusBadge}>{incomeSources.filter((source) => source.attributes.classification === 'base').length} base confiable</span>
                ) : (
                  <span className={styles.focusBadge}>{metrics.obligationsCount} activos</span>
                )}
                <span className={styles.focusBadge}>
                  {activeView === 'income' ? `${incomeSources.length} fuentes` : `${obligations.length} registrados`}
                </span>
              </div>

              <div className={styles.focusActions}>
                {activeView === 'income' ? (
                  <Button
                    label="Agregar ingreso"
                    variant="primary"
                    iconLeft={<IonIcon icon={addOutline} />}
                    onClick={() => { setEditingIncome(null); setIncomeComposerOpen(true); }}
                  />
                ) : (
                  <Button
                    label="Nuevo recurrente"
                    variant="primary"
                    iconLeft={<IonIcon icon={addOutline} />}
                    onClick={() => { setEditingObligation(null); setComposerOpen(true); }}
                  />
                )}
                <Button
                  label="Explorar detalle"
                  variant="ghost"
                  onClick={() => setDetailsOpen(true)}
                />
              </div>
            </div>
          </div>
        ) : null}

        {detailsOpen ? (
          <div className={styles.detailStage}>
            {loading ? <div className={styles.centeredState}><Spinner size="lg" /></div> : null}
            {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
            <BreadcrumbTrail items={[
              { label: 'Recurrentes', onClick: () => setDetailsOpen(false) },
              { label: activeView === 'income' ? 'Ingresos' : 'Obligaciones' },
            ]} />
            <div className={styles.detailHeaderActions}>
              <div className={styles.detailTabBar} role="tablist" aria-label="Vista de recurrentes">
                <button
                  type="button"
                  className={`${styles.detailTabBtn} ${activeView === 'obligations' ? styles.detailTabBtnActive : ''}`}
                  onClick={() => setActiveView('obligations')}
                >
                  Obligaciones
                </button>
                <button
                  type="button"
                  className={`${styles.detailTabBtn} ${activeView === 'income' ? styles.detailTabBtnActive : ''}`}
                  onClick={() => setActiveView('income')}
                >
                  Ingresos
                </button>
              </div>
            </div>
            {activeView === 'income' ? (
              <>
              <div className={styles.detailPanel}>
                {incomeFiltersVisible ? (
                  <div className={styles.filterPanel}>
                    <div className={styles.inlineFilters}>
                      <SelectInput
                        name="income-inline-variable"
                        value={String(incomeFilters.is_variable ?? 'all')}
                        onChange={(is_variable) =>
                          setIncomeFilters((current) => ({
                            ...current,
                            is_variable: is_variable === 'all' ? 'all' : is_variable === 'true',
                          }))
                        }
                        options={[
                          { label: 'Todos', value: 'all' },
                          { label: 'Variables', value: 'true' },
                          { label: 'Fijos', value: 'false' },
                        ]}
                        placeholder="Todos"
                      />
                    </div>
                  </div>
                ) : null}
                <AppliedFiltersBar
                  chips={incomeChips}
                  onRemove={(key) => {
                    const next = { ...incomeFilters, [key]: key === 'is_variable' ? 'all' : '' };
                    setIncomeFilters(next);
                  }}
                  onClearAll={() => {
                    setIncomeFilters(initialIncomeFilters);
                  }}
                />
              </div>
              {!incomeSources.length ? (
                <EmptyState
                  title="No hay fuentes de ingreso"
                  description="Registra tus ingresos para que el plan mensual sepa con qué puede contar antes de proponer decisiones." 
                  actionLabel="Agregar ingreso"
                  onAction={() => { setEditingIncome(null); setIncomeComposerOpen(true); }}
                />
              ) : (
                <div className={styles.list}>
                  {incomeSources.map((source) => (
                    <IncomeSourceSlidingCard
                      key={source.id}
                      source={source}
                      onEdit={(s) => { setEditingIncome(s); setIncomeComposerOpen(true); }}
                      onDelete={setDeletingIncome}
                    />
                  ))}
                </div>
              )}
              </>
            ) : (
              <>
              <div className={styles.detailPanel}>
                {obligationFiltersVisible ? (
                  <div className={styles.filterPanel}>
                    <div className={styles.inlineFilters}>
                      <SelectInput
                        name="rec-inline-active"
                        value={String(obligationFilters.active ?? 'all')}
                        onChange={(active) =>
                          setObligationFilters((current) => ({
                            ...current,
                            active: active === 'all' ? 'all' : active === 'true',
                          }))
                        }
                        options={[
                          { label: 'Todos', value: 'all' },
                          { label: 'Activos', value: 'true' },
                          { label: 'Inactivos', value: 'false' },
                        ]}
                        placeholder="Todos"
                      />
                    </div>
                    <section className={styles.filterComposer}>
                      <div className={styles.filterComposerHeader}>
                        <span className={styles.filterComposerLabel}>Categoría</span>
                        <span className={styles.filterComposerHint}>Aplica la misma lectura por color que ya ves en transacciones.</span>
                      </div>

                      <div className={styles.categoryRail}>
                        {categoryFilters.map((category) => {
                          const active = category.id === selectedObligationCategoryId;
                          return (
                            <button
                              key={category.id}
                              type="button"
                              className={[styles.categoryToken, active ? styles.categoryTokenActive : ''].filter(Boolean).join(' ')}
                              style={{ '--category-accent': category.color } as CSSProperties}
                              onClick={() =>
                                setObligationFilters((current) => ({
                                  ...current,
                                  category_id: active ? '' : category.id,
                                }))
                              }
                            >
                              <span className={styles.categorySwatch} />
                              <span className={styles.categoryTokenText}>{category.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                ) : null}
                <AppliedFiltersBar
                  chips={obligationChips}
                  onRemove={(key) => {
                    const next: RecurringObligationQueryParams =
                      key === 'active'
                        ? { ...obligationFilters, active: 'all' }
                        : key === 'category_id'
                          ? { ...obligationFilters, category_id: '' }
                          : { ...obligationFilters, q: '' };
                    setObligationFilters(next);
                  }}
                  onClearAll={() => {
                    setObligationFilters(initialObligationFilters);
                  }}
                />
              </div>
              {!obligations.length ? (
                <EmptyState
                  title="No hay obligaciones recurrentes"
                  description="Carga tus obligaciones fijas para que la app pueda calcular presión mensual y cobertura real." 
                  actionLabel="Nuevo recurrente"
                  onAction={() => { setEditingObligation(null); setComposerOpen(true); }}
                />
              ) : (
                <div className={styles.list}>
                  {obligations.map((obligation) => (
                    <RecurringObligationSlidingCard
                      key={obligation.id}
                      obligation={obligation}
                      linkedDebtLabel={debtLinkLabel(obligation)}
                      onUnlinkDebt={setUnlinkingObligation}
                      onEdit={(nextObligation) => {
                        setEditingObligation(nextObligation);
                        setComposerOpen(true);
                      }}
                      onDelete={setDeletingObligation}
                    />
                  ))}
                </div>
              )}
              </>
            )}
          </div>
        ) : null}
      </section>

      {overlays}
    </IonContent>
  );
};

export const RecurringObligationsPage = () => (
  <AppLayout title="Recurrentes" ownHeader>
    <RecurringObligationsContent />
  </AppLayout>
);
