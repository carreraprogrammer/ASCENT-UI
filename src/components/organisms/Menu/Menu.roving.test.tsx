// TCW-27 (revisión): tabulación tipo roving en las opciones del Menu.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Menu } from './Menu';

const OPTIONS = [
  { value: 'a', label: 'Uno' },
  { value: 'b', label: 'Dos' },
  { value: 'c', label: 'Tres' },
];

describe('Menu roving tabindex', () => {
  it('solo la opción marcada (o la primera) es tabulable; las demás tienen tabindex=-1', async () => {
    const user = userEvent.setup();
    render(<Menu label="Gaveta" options={OPTIONS} selected={['b']} multiple onChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: /Gaveta/ }));
    const items = within(screen.getByRole('menu')).getAllByRole('menuitemcheckbox');
    expect(items.map((i) => i.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
  });

  it('sin selección la primera es la tabulable', async () => {
    const user = userEvent.setup();
    render(<Menu label="Gaveta" options={OPTIONS} selected={[]} multiple onChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: /Gaveta/ }));
    const items = within(screen.getByRole('menu')).getAllByRole('menuitemcheckbox');
    expect(items.map((i) => i.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
  });
});
