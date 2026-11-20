// TCW-5 CA2: las vistas de escritorio del plan-01 usan CategoryCell donde hoy hay gaveta/categoría en texto gris.
// Prueba de contrato sobre el código fuente: cada archivo importa y renderiza <CategoryCell.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const P = 'src/components/pages';
const VISTAS = [
  'TransactionsPage/instDesk.tsx',
  'DashboardPage/DashboardDesktop.tsx',
  'RecurringObligationsPage/RecurringObligationsPage.tsx',
  'PlannedExpensesPage/PlannedExpensesPage.tsx',
  'SubcategoriesPage/SubcategoriesPage.tsx',
  'BudgetsPage/BudgetsPage.tsx',
  'BudgetDetailPage/BudgetDetailPage.tsx',
  'MonthlyInsightDetailPage/InsightDesk.tsx',
  'YearlyInsightDetailPage/YearlyInsightDetailPage.tsx',
  'NightAnalysisDetailPage/NightAnalysisDetailPage.tsx',
];

describe('vistas de escritorio con CategoryCell', () => {
  it.each(VISTAS)('TCW-5 CA2: %s importa y usa <CategoryCell', (rel) => {
    const src = readFileSync(join(P, rel), 'utf8');
    expect(src).toMatch(/import[^;]*\bCategoryCell\b[^;]*from/);
    expect(src).toContain('<CategoryCell');
  });

  it('TCW-5 CA2: la tabla de Transacciones armada en TransactionsPage.tsx también la usa', () => {
    const src = readFileSync(join(P, 'TransactionsPage/TransactionsPage.tsx'), 'utf8');
    expect(src).toMatch(/\bCategoryCell\b/);
  });

  it('TCW-5 CA2: Inst exporta CategoryCell', () => {
    expect(readFileSync('src/components/atoms/Inst/index.ts', 'utf8')).toMatch(/CategoryCell/);
  });

  it('TCW-5 CA3: móvil intacto, TransactionSlidingCard no usa CategoryCell', () => {
    const src = readFileSync('src/components/organisms/TransactionSlidingCard/TransactionSlidingCard.tsx', 'utf8');
    expect(src).not.toContain('CategoryCell');
  });
});
