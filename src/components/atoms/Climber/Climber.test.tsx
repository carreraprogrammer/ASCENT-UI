import { render } from '@testing-library/react';
import { Climber } from './Climber';

describe('Climber', () => {
  it('draws the sphere, two pupils with their glints and no mouth', () => {
    const { container } = render(<Climber size={40} />);
    expect(container.querySelectorAll('rect')).toHaveLength(2);
    expect(container.querySelector('path[d^="M12.5"]')).not.toBeNull();
    expect(container.querySelector('[data-climber]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('gives each instance its own gradient ids', () => {
    const { container } = render(<><Climber /><Climber /></>);
    const ids = [...container.querySelectorAll('radialGradient')].map((g) => g.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('renders the label (shown only on desktop by CSS)', () => {
    const { getByText } = render(<Climber label="Tú · 40%" />);
    expect(getByText('Tú · 40%')).toBeInTheDocument();
  });
});
