// TCW-27 (revisión): en el panel, Cancelar acciona el Cancelar del composer (que limpia y cierra); Guardar acciona el principal.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockMedia } from '../../../../tests/helpers/media';
import { CrudModal } from './CrudModal';
import { SortSheet } from '../SortSheet';

beforeEach(() => { mockMedia({ desktop: true }); });

describe('CrudModal con composer', () => {
  it('Cancelar del panel llama al Cancelar del composer; Guardar al principal', async () => {
    const user = userEvent.setup();
    const cancel = vi.fn();
    const save = vi.fn();
    render(
      <CrudModal isOpen title="Editar" onClose={() => {}}>
        <div data-composer-actions>
          <button type="button" onClick={cancel}>Cancelar</button>
          <button type="button" onClick={save}>Guardar cambios</button>
        </div>
      </CrudModal>,
    );
    const dialog = screen.getByRole('dialog');
    const buttons = Array.from(dialog.querySelectorAll('footer button'));
    await user.click(buttons.find((b) => b.textContent === 'Cancelar') as HTMLElement);
    expect(cancel).toHaveBeenCalledTimes(1);
    await user.click(buttons.find((b) => b.textContent?.startsWith('Guardar cambios')) as HTMLElement);
    expect(save).toHaveBeenCalledTimes(1);
  });
});

describe('SortSheet según plataforma', () => {
  const props = { isOpen: true, title: 'Ordenar', sortBy: 'date', sortDir: 'desc' as const, options: [{ label: 'Fecha', value: 'date' }],
    onClose: () => {}, onChangeSortBy: () => {}, onChangeSortDir: () => {} };

  it('en escritorio no monta la hoja desde abajo', () => {
    render(<SortSheet {...props} />);
    expect(document.querySelector('ion-modal')).toBeNull();
  });

  it('en móvil monta la hoja de siempre', () => {
    mockMedia({ desktop: false });
    render(<SortSheet {...props} />);
    expect(document.querySelector('ion-modal')).not.toBeNull();
  });
});
