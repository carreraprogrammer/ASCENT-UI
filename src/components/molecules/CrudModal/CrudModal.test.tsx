// TCW-27 CA2 (delegación) y CA12 (móvil y Capacitor sin cambios).
//
// CONTRATO PARA EL CONSTRUCTOR
//   CrudModal conserva su ruta (src/components/molecules/CrudModal) y sus props actuales (isOpen, title, subtitle,
//   children, onClose) y añade props OPCIONALES que solo usa el panel: origin?, figure?, onSubmit?, onDelete?,
//   submitLabel?, cancelLabel?, deleteLabel? (mismos nombres y significado que SidePanel).
//   Escritorio (useDesktopLayout() === true: >= 1024 px y no nativo) -> renderiza <SidePanel> (data-testid="side-panel").
//   Móvil (< 1024 px) o Capacitor -> renderiza exactamente el IonModal de hoy (clase "crud-modal", eyebrow "Ascent"),
//   sin ningún [data-testid="side-panel"].
import { render, screen } from '@testing-library/react';
import { mockMedia } from '../../../../tests/helpers/media';

let native = false;
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return { ...actual, isPlatform: (p: string) => (p === 'capacitor' ? native : actual.isPlatform(p as never)) };
});

import { CrudModal } from './CrudModal';

const renderModal = () =>
  render(
    <CrudModal isOpen title="Editar transacción" onClose={() => {}} onSubmit={() => {}} submitLabel="Guardar" cancelLabel="Cancelar">
      <p>cuerpo del formulario</p>
    </CrudModal>,
  );

beforeEach(() => { native = false; });

describe('CrudModal según plataforma', () => {
  it('TCW-27 CA2: en escritorio (>= 1024 px, web) CrudModal monta el panel lateral con role=dialog y aria-modal', () => {
    mockMedia({ desktop: true });
    renderModal();
    const dialog = screen.getByRole('dialog', { name: 'Editar transacción' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('data-testid', 'side-panel');
    expect(document.querySelector('ion-modal')).toBeNull();
  });

  it('TCW-27 CA12: con menos de 1024 px se monta la hoja IonModal actual, sin panel', () => {
    mockMedia({ desktop: false });
    renderModal();
    expect(screen.queryByTestId('side-panel')).toBeNull();
    const sheet = document.querySelector('ion-modal');
    expect(sheet).not.toBeNull();
    expect(sheet).toHaveClass('crud-modal');
  });

  it('TCW-27 CA12: en Capacitor (nativo) aunque el ancho sea >= 1024 px se monta la hoja IonModal actual', () => {
    mockMedia({ desktop: true });
    native = true;
    renderModal();
    expect(screen.queryByTestId('side-panel')).toBeNull();
    expect(document.querySelector('ion-modal')).toHaveClass('crud-modal');
  });
});
