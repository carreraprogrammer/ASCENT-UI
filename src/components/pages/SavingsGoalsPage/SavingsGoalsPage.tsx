import { useEffect, useMemo, useState } from 'react';
import { IonContent } from '@ionic/react';
import { AppLayout } from '../../templates/AppLayout';
import { useDesktopLayout } from '../../../hooks/useDesktopLayout';
import { Button } from '../../atoms/Button';
import { DateInput } from '../../atoms/DateInput';
import { NumberInput } from '../../atoms/NumberInput';
import { TextInput } from '../../atoms/TextInput';
import { ConfirmModal } from '../../molecules/ConfirmModal';
import { CrudModal } from '../../molecules/CrudModal';
import { DataState } from '../../molecules/DataState/DataState';
import { financeService } from '../../../services/financeService';
import type { SavingsGoal, SavingsGoalPayload } from '../../../types/finance.types';
import { formatCurrencyCompact } from '../../../utils/formatCurrency';
import pageStyles from '../FinancePage.module.css';
import styles from './SavingsGoalsPage.module.css';
import desk from './SavingsGoalsDesktop.module.css';
import { BarPct, DateCell, InstButton, Num, Sub, Two } from '../../atoms/Inst';
import { InstNote, InstPageHeader, InstSection, InstStats, InstTable, InstTableSkeleton, type Align } from '../../molecules/Inst';
import { fmtAmount, fmtDayYear } from '../../../utils/instrumento';

type GoalForm = {
  name: string;
  target_amount: number | '';
  current_amount: number | '';
  target_date: string;
  monthly_contribution: number | '';
};

const emptyForm: GoalForm = {
  name: '',
  target_amount: '',
  current_amount: 0,
  target_date: '',
  monthly_contribution: 0,
};

const goalToForm = (goal: SavingsGoal): GoalForm => ({
  name: goal.name,
  target_amount: goal.target_amount,
  current_amount: goal.current_amount,
  target_date: goal.target_date ?? '',
  monthly_contribution: goal.monthly_contribution,
});

const formToPayload = (form: GoalForm): SavingsGoalPayload => ({
  name: form.name,
  target_amount: Number(form.target_amount || 0),
  current_amount: Number(form.current_amount || 0),
  target_date: form.target_date || null,
  monthly_contribution: Number(form.monthly_contribution || 0),
});

export const SavingsGoalsContent = () => {
  // Escritorio (ASC-4, fase 5): resumen fijo a la izquierda y metas a la derecha.
  const isDesktop = useDesktopLayout();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<SavingsGoal | null>(null);
  const [form, setForm] = useState<GoalForm>(emptyForm);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setGoals(await financeService.getSavingsGoals());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar las metas de ahorro.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totals = useMemo(
    () => ({
      current: goals.reduce((sum, goal) => sum + goal.current_amount, 0),
      target: goals.reduce((sum, goal) => sum + goal.target_amount, 0),
    }),
    [goals],
  );

  const openNew = () => {
    setEditingGoal(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setForm(goalToForm(goal));
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingGoal(null);
    setForm(emptyForm);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = formToPayload(form);
      if (editingGoal) {
        await financeService.updateSavingsGoal(editingGoal.id, payload);
      } else {
        await financeService.createSavingsGoal(payload);
      }
      closeModal();
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteGoal = async (goal: SavingsGoal) => {
    await financeService.deleteSavingsGoal(goal.id);
    await load();
  };

  const summaryBody = (
    <>
      <div className={pageStyles.focusGrid}>
        <div className={pageStyles.focusCopy}>
          <span className={pageStyles.eyebrow}>Ahorro dirigido</span>
          <p className={pageStyles.focusQuestion}>¿Qué meta concreta estás financiando mes a mes?</p>
          <h2 className={pageStyles.focusTitle}>
            {goals.length ? `${goals.length} metas activas` : 'Crea tu primera meta'}
          </h2>
          <p className={pageStyles.focusText}>
            Define montos objetivo y fechas para convertir el ahorro en una decisión mensual explícita.
          </p>
        </div>
        <div>
          <div className={pageStyles.focusValue}>{formatCurrencyCompact(totals.current)}</div>
          <p className={pageStyles.focusCaption}>
            acumulado de {formatCurrencyCompact(totals.target)} objetivo
          </p>
        </div>
      </div>
    </>
  );

  const goalsList = (
    <DataState
      loading={loading}
      error={error}
      data={goals}
      emptyTitle="No hay metas de ahorro"
      emptyDescription="Crea tu primera meta para convertir el ahorro en una decisión mensual explícita."
      emptyActionLabel="Nueva meta"
      onEmptyAction={openNew}
      onRetry={() => void load()}
    >
      {(goalItems) => (
        <div className={pageStyles.list}>
          {goalItems.map((goal) => {
            const progress = goal.target_amount > 0
              ? Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)
              : 0;
            return (
              <article key={goal.id} className={pageStyles.listItem}>
                <div className={pageStyles.listPrimary}>
                  <span className={pageStyles.listLabel}>{goal.name}</span>
                  <span className={pageStyles.listMeta}>
                    {formatCurrencyCompact(goal.current_amount)} de {formatCurrencyCompact(goal.target_amount)}
                  </span>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                  </div>
                  <span className={pageStyles.listMeta}>
                    Aporte necesario: {goal.monthly_contribution_needed === null ? 'sin fecha objetivo' : formatCurrencyCompact(goal.monthly_contribution_needed)}
                  </span>
                </div>
                <div className={pageStyles.listSecondary}>
                  <span className={pageStyles.pill}>{progress}%</span>
                  <span className={pageStyles.listMeta}>
                    {goal.target_date ? `Fecha objetivo ${goal.target_date}` : 'Sin fecha objetivo'}
                  </span>
                  <div className={styles.actions}>
                    <Button label="Editar" variant="ghost" size="sm" onClick={() => openEdit(goal)} />
                    <Button label="Eliminar" variant="danger" size="sm" onClick={() => setDeleteConfirm(goal)} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </DataState>
  );

  const modals = (
    <>
        <ConfirmModal
          isOpen={deleteConfirm !== null}
          title="Eliminar meta"
          message={`¿Seguro que quieres eliminar "${deleteConfirm?.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={() => {
            if (deleteConfirm) void deleteGoal(deleteConfirm);
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />

        <CrudModal
          isOpen={modalOpen}
          title={editingGoal ? 'Editar meta' : 'Nueva meta'}
          subtitle="Define el objetivo y una fecha opcional para calcular el aporte mensual necesario."
          onClose={closeModal}
        >
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <TextInput
              name="savings-goal-name"
              label="Nombre"
              value={form.name}
              onChange={(name) => setForm((current) => ({ ...current, name }))}
              required
            />
            <NumberInput
              name="savings-goal-target"
              label="Monto objetivo"
              value={form.target_amount}
              onChange={(target_amount) => setForm((current) => ({ ...current, target_amount }))}
              min={1}
              format="currency"
              required
            />
            <NumberInput
              name="savings-goal-current"
              label="Monto actual"
              value={form.current_amount}
              onChange={(current_amount) => setForm((current) => ({ ...current, current_amount }))}
              min={0}
              format="currency"
            />
            <DateInput
              name="savings-goal-target-date"
              label="Fecha objetivo"
              value={form.target_date}
              onChange={(target_date) => setForm((current) => ({ ...current, target_date }))}
            />
            <NumberInput
              name="savings-goal-monthly"
              label="Aporte mensual actual"
              value={form.monthly_contribution}
              onChange={(monthly_contribution) => setForm((current) => ({ ...current, monthly_contribution }))}
              min={0}
              format="currency"
            />
            <div className={styles.formActions}>
              <Button label="Cancelar" variant="ghost" onClick={closeModal} disabled={submitting} />
              <Button label={submitting ? 'Guardando…' : 'Guardar'} type="submit" disabled={submitting} />
            </div>
          </form>
        </CrudModal>
    </>
  );

  // TCW-5 "Instrumento" (mockup U_AscentMetas): mismas metas, mismos modales y acciones; cambia la presentación.
  if (isDesktop) {
    return (
      <div className={desk.page} data-testid="goals-desktop">
        <SavingsGoalsDesktop goals={goals} loading={loading} error={error} totals={totals}
          onRetry={() => void load()} onNew={openNew} onEdit={openEdit} onDelete={(goal) => setDeleteConfirm(goal)} />
        {modals}
      </div>
    );
  }

  return (
    <IonContent className={pageStyles.pageContent}>
        <section className={pageStyles.stack}>
          <div className={pageStyles.focusStage}>
            <div className={`${pageStyles.focusCard} ${pageStyles.focusCardFull}`}>
              {summaryBody}
              <div className={pageStyles.focusActions}>
                <Button label="Nueva meta" onClick={openNew} />
              </div>
            </div>
          </div>

          {goalsList}
        </section>

        {modals}
    </IonContent>
  );
};

const GOAL_HEADS = ['Meta', 'Fecha objetivo', 'Aporte necesario', 'Avance', 'Acumulado (COP)', ''];
const GOAL_ALIGNS: Align[] = ['left', 'left', 'right', 'left', 'right', 'right'];

const SavingsGoalsDesktop = ({ goals, loading, error, totals, onRetry, onNew, onEdit, onDelete }: {
  goals: SavingsGoal[];
  loading: boolean;
  error: string | null;
  totals: { current: number; target: number };
  onRetry: () => void;
  onNew: () => void;
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (goal: SavingsGoal) => void;
}) => {
  const needed = goals.map((g) => g.monthly_contribution_needed).filter((v): v is number => v != null);
  const header = (
    <InstPageHeader title="Metas" sub="¿Qué meta concreta estás financiando mes a mes?"
      actions={<InstButton primary onClick={onNew}>+ Nueva meta</InstButton>} />
  );
  if (loading) return <>{header}<InstSection title="Detalle"><InstTableSkeleton heads={GOAL_HEADS} aligns={GOAL_ALIGNS} rows={2} /></InstSection></>;
  if (error) return <>{header}<InstNote error onRetry={onRetry}>{error}</InstNote></>;
  if (!goals.length) {
    return (
      <>
        {header}
        <InstNote>No hay metas de ahorro. Crea tu primera meta para convertir el ahorro en una decisión mensual explícita.</InstNote>
      </>
    );
  }
  return (
    <>
      {header}
      <InstStats items={[
        { label: 'Metas activas', value: goals.length, sub: 'ahorro dirigido' },
        { label: 'Acumulado', value: fmtAmount(totals.current), sub: `de ${fmtAmount(totals.target)} objetivo` },
        { label: 'Aporte necesario', value: needed.length ? fmtAmount(needed.reduce((a, b) => a + b, 0)) : '—',
          sub: needed.length ? 'al mes para llegar a tiempo' : 'sin fecha objetivo' },
      ]} />
      <InstSection title="Detalle">
        <InstTable caption="Metas de ahorro" heads={GOAL_HEADS} aligns={GOAL_ALIGNS} rowKeys={goals.map((g) => g.id)}
          rows={goals.map((goal) => {
            const progress = goal.target_amount > 0
              ? Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)
              : 0;
            return [
              <Two a={goal.name} b={goal.status === 'paused' ? 'en pausa' : goal.status === 'completed' ? 'cumplida' : undefined} />,
              goal.target_date ? <DateCell>{fmtDayYear(goal.target_date)}</DateCell> : <Sub>sin fecha objetivo</Sub>,
              goal.monthly_contribution_needed === null ? <Sub>—</Sub> : <Num>{fmtAmount(goal.monthly_contribution_needed)}</Num>,
              <BarPct pct={progress} label={`Avance de ${goal.name}`} />,
              <Num strong>{fmtAmount(goal.current_amount)} / {fmtAmount(goal.target_amount)}</Num>,
              <span className={desk.actions}>
                <button type="button" className={desk.quiet} onClick={() => onEdit(goal)} aria-label={`Editar ${goal.name}`}>Editar</button>
                <span aria-hidden="true" className={desk.dot}>·</span>
                <button type="button" className={desk.quiet} onClick={() => onDelete(goal)} aria-label={`Eliminar ${goal.name}`}>Eliminar</button>
              </span>,
            ];
          })} />
      </InstSection>
    </>
  );
};

export const SavingsGoalsPage = () => (
  <AppLayout title="Metas" ownHeader>
    <SavingsGoalsContent />
  </AppLayout>
);
