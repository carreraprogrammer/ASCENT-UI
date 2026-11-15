type StatusTone = 'success' | 'warning' | 'error' | 'neutral';

const LABELS: Record<StatusTone, string> = {
  success: 'Listo',
  warning: 'Atención',
  error: 'Error',
  neutral: 'Estado',
};

const COLORS: Record<StatusTone, { bg: string; border: string; text: string }> = {
  success: {
    bg: 'var(--color-success-subtle)',
    border: 'color-mix(in srgb, var(--data-both) 35%, transparent)',
    text: 'var(--color-success)',
  },
  warning: {
    bg: 'var(--color-warning-subtle)',
    border: 'color-mix(in srgb, var(--data-lexical) 35%, transparent)',
    text: 'var(--color-warning)',
  },
  error: {
    bg: 'var(--color-error-subtle)',
    border: 'color-mix(in srgb, var(--data-lexical) 35%, transparent)',
    text: 'var(--color-error)',
  },
  neutral: {
    bg: 'color-mix(in srgb, var(--ink) 4%, transparent)',
    border: 'color-mix(in srgb, var(--ink) 12%, transparent)',
    text: 'var(--color-text-secondary)',
  },
};

interface StatusBadgeProps {
  label?: string;
  tone?: StatusTone;
}

export const StatusBadge = ({ label, tone = 'neutral' }: StatusBadgeProps) => {
  const colors = COLORS[tone];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.35rem 0.7rem',
        borderRadius: '999px',
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        color: colors.text,
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--font-semibold)',
      }}
    >
      <span aria-hidden="true">●</span>
      <span>{label ?? LABELS[tone]}</span>
    </span>
  );
};