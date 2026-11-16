import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}

export const FormSection = ({ title, description, className, children }: FormSectionProps) => (
  <section
    className={className}
    style={{
      display: 'grid',
      gap: 'var(--space-4)',
      padding: 'var(--space-5)',
      border: '1px solid color-mix(in srgb, var(--ink) 8%, transparent)',
      borderRadius: 'var(--radius-xl)',
      background: 'color-mix(in srgb, var(--ink) 3%, transparent)',
    }}
  >
    <div data-form-section-head="" style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <h3 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>{title}</h3>
      {description ? (
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          {description}
        </p>
      ) : null}
    </div>
    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>{children}</div>
  </section>
);