import { render } from '@testing-library/react';
import { Climber } from './Climber';

const setReducedMotion = (reduce: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion'), media: query, onchange: null,
      addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
};

describe('Climber', () => {
  beforeEach(() => setReducedMotion(false));

  it('draws the sphere, two pupils with their glints and no mouth', () => {
    const { container } = render(<Climber size={40} />);
    expect(container.querySelectorAll('rect')).toHaveLength(2);
    expect(container.querySelector('path[d^="M12.5"]')).not.toBeNull();
    expect(container.querySelector('[data-climber]')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('[data-climber]')).toHaveAttribute('data-emotion', 'calm');
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

  // TCW-2 fase 3: las expresiones de Buddy, con ojos y movimiento, sin boca.
  it('cheer: arched eyes, sparks and the animated cheer class', () => {
    const { container } = render(<Climber emotion="cheer" />);
    const root = container.querySelector('[data-climber]')!;
    expect(root).toHaveAttribute('data-emotion', 'cheer');
    expect(root.className).toMatch(/cheer/);
    expect(root.className).toMatch(/animated/);
    expect(root).toHaveAttribute('data-motion', 'on');
    expect(container.querySelectorAll('rect')).toHaveLength(0);
    expect(container.querySelectorAll('[class*="lid"]')).toHaveLength(2);
    expect(container.querySelectorAll('[class*="spark"]').length).toBeGreaterThan(0);
  });

  it.each(['happy', 'think', 'worry', 'sleep'] as const)('%s has its own expression', (emotion) => {
    const { container } = render(<Climber emotion={emotion} />);
    const root = container.querySelector('[data-climber]')!;
    expect(root).toHaveAttribute('data-emotion', emotion);
    expect(root.className).toMatch(new RegExp(emotion));
  });

  it('never draws a mouth', () => {
    for (const emotion of ['calm', 'happy', 'cheer', 'think', 'worry', 'sleep'] as const) {
      const { container, unmount } = render(<Climber emotion={emotion} />);
      expect(container.querySelector('[class*="mouth"]')).toBeNull();
      unmount();
    }
  });

  it('does not animate under prefers-reduced-motion (the expression stays in the eyes)', () => {
    setReducedMotion(true);
    const { container } = render(<Climber emotion="cheer" />);
    const root = container.querySelector('[data-climber]')!;
    expect(root).toHaveAttribute('data-motion', 'off');
    expect(root.className).not.toMatch(/animated/);
    expect(root.className).toMatch(/cheer/);
    expect(container.querySelectorAll('[class*="lid"]')).toHaveLength(2);
  });
});
