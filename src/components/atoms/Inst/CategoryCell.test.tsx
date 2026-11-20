// TCW-5: CategoryCell, la pieza de escritorio con el icono y el color de la gaveta.
// Contrato (plan-01): props { code, gavetaName, subcategoryName, icon, income }. El color sale de
// var(--color-<code>) (o --color-income / --color-unknown), el icono de resolveNamedIcon. La app solo está en
// español (no hay capa i18n): el único texto propio de la pieza es "por clasificar".
import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { helpCircleOutline } from 'ionicons/icons';
import { resolveNamedIcon } from '../../organisms/BudgetWizard/iconRegistry';
import { CategoryCell } from './CategoryCell';

// IonIcon se sustituye por un <i> que expone el icono recibido y deja pasar aria-hidden.
vi.mock('@ionic/react', async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  IonIcon: ({ icon, ...rest }: { icon: string } & Record<string, unknown>) => (
    <i data-testid="cell-icon" data-icon={icon} {...rest} />
  ),
}));

const GAVETAS = [
  { code: 'committed', gaveta: 'Comprometido', sub: 'Arriendo', icon: 'homeOutline' },
  { code: 'necessary', gaveta: 'Necesario', sub: 'Mercado', icon: 'cartOutline' },
  { code: 'discretionary', gaveta: 'Flexible', sub: 'Restaurantes', icon: 'restaurantOutline' },
] as const;

describe('CategoryCell', () => {
  it.each(GAVETAS)('TCW-5 CA1: $code usa var(--color-$code) y el icono de su subcategoría', ({ code, gaveta, sub, icon }) => {
    const { container } = render(<CategoryCell code={code} gavetaName={gaveta} subcategoryName={sub} icon={icon} />);
    expect(container.innerHTML).toContain(`var(--color-${code})`);
    expect(container.innerHTML).not.toContain('var(--color-unknown)');
    expect(screen.getByTestId('cell-icon').getAttribute('data-icon')).toBe(resolveNamedIcon(icon));
    expect(screen.getByText(sub)).toBeInTheDocument();
  });

  it('TCW-5 CA1: income usa var(--color-income) y su icono', () => {
    const { container } = render(<CategoryCell income code="committed" gavetaName="Ingreso" subcategoryName="Salario" icon="cashOutline" />);
    expect(container.innerHTML).toContain('var(--color-income)');
    expect(container.innerHTML).not.toContain('var(--color-committed)');
    expect(screen.getByTestId('cell-icon').getAttribute('data-icon')).toBe(resolveNamedIcon('cashOutline'));
    expect(screen.getByText('Ingreso')).toBeInTheDocument();
  });

  it('TCW-5 CA1: unknown usa var(--color-unknown), icono de interrogación y el texto "por clasificar"', () => {
    const { container } = render(<CategoryCell code={null} gavetaName={null} subcategoryName={null} icon={null} />);
    expect(container.innerHTML).toContain('var(--color-unknown)');
    expect(screen.getByTestId('cell-icon').getAttribute('data-icon')).toBe(helpCircleOutline);
    expect(screen.getByText('por clasificar')).toBeInTheDocument();
  });

  it('TCW-5 CA1: con code ausente (undefined) también cae en unknown', () => {
    const { container } = render(<CategoryCell gavetaName={undefined} subcategoryName={undefined} icon={undefined} />);
    expect(container.innerHTML).toContain('var(--color-unknown)');
    expect(screen.getByText('por clasificar')).toBeInTheDocument();
  });

  it.each(GAVETAS)('TCW-5 CA4: el nombre de la gaveta "$gaveta" siempre está escrito como texto', ({ code, gaveta, sub, icon }) => {
    render(<CategoryCell code={code} gavetaName={gaveta} subcategoryName={sub} icon={icon} />);
    expect(screen.getByText(gaveta)).toBeVisible();
  });

  it('TCW-5 CA4: el icono lleva aria-hidden="true"', () => {
    render(<CategoryCell code="necessary" gavetaName="Necesario" subcategoryName="Mercado" icon="cartOutline" />);
    expect(screen.getByTestId('cell-icon')).toHaveAttribute('aria-hidden', 'true');
  });

  it('TCW-5 CA4: sin clasificar el icono también es aria-hidden y no depende del color', () => {
    render(<CategoryCell code={null} gavetaName={null} subcategoryName={null} icon={null} />);
    expect(screen.getByTestId('cell-icon')).toHaveAttribute('aria-hidden', 'true');
  });

  it('TCW-5 CA1: usa categoryIcon cuando la subcategoría no trae icono (el llamador pasa subcategoryIcon ?? categoryIcon)', () => {
    render(<CategoryCell code="committed" gavetaName="Comprometido" subcategoryName="Arriendo" icon="homeOutline" />);
    expect(screen.getByTestId('cell-icon').getAttribute('data-icon')).toBe(resolveNamedIcon('homeOutline'));
  });
});

describe('CategoryCell: medidas (Inst.module.css)', () => {
  const css = readFileSync('src/components/atoms/Inst/Inst.module.css', 'utf8');
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({ sel: sel.trim(), body }));

  it('TCW-5 CA1: cuadro de 28px x 28px, radio 8px y fondo del color de la gaveta al 14%', () => {
    const box = rules.find((r) => /width:\s*28px/.test(r.body) && /height:\s*28px/.test(r.body));
    expect(box, 'falta una regla 28x28 en Inst.module.css').toBeDefined();
    expect(box!.body).toMatch(/border-radius:\s*8px/);
    expect(box!.body).toMatch(/background(-color)?:\s*color-mix\(\s*in srgb,[^;]*\b14%/);
  });

  it('TCW-5 CA1: icono de 15px', () => {
    expect(rules.some((r) => /(font-size|width):\s*15px/.test(r.body))).toBe(true);
  });

  it('TCW-5 CA1: nombre de gaveta en mono de 10 a 11px', () => {
    const mono = rules.find((r) => /font-family:[^;]*mono/i.test(r.body) && /font-size:\s*1[01]px/.test(r.body));
    expect(mono, 'falta regla mono 10-11px para la gaveta').toBeDefined();
  });
});
