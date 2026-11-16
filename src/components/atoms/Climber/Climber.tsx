import { useId } from 'react';
import styles from './Climber.module.css';

// ASC-4 fase 3: el escalador de Ascent, un solo dibujo para todos sus usos (Dashboard, login, regreso de Gmail y
// el botón del asistente). Esfera dorada con degradado radial, brillo curvo arriba, halo suave, aro oscuro que la
// separa del fondo, sombra corta debajo y dos pupilas verticales con su punto de brillo que parpadean. Sin boca.
// Los colores salen de los tokens (Climber.module.css). Con reduced motion no parpadea.
// `label` ("Tú · 40%") se ve solo en escritorio (≥ 1024 px): en móvil el layout queda igual.
export interface ClimberProps {
  size?: number;
  label?: string;
  className?: string;
  title?: string;
}

export const Climber = ({ size = 40, label, className, title }: ClimberProps) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const face = `climber-face-${uid}`;
  const glow = `climber-glow-${uid}`;

  return (
    <span
      className={[styles.climber, className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-climber=""
    >
      <svg className={styles.svg} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={face} cx="0.38" cy="0.3" r="0.8">
            <stop offset="0" className={styles.stopLight} />
            <stop offset="0.55" className={styles.stopMid} />
            <stop offset="1" className={styles.stopDeep} />
          </radialGradient>
          <radialGradient id={glow} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" className={styles.glowIn} />
            <stop offset="1" className={styles.glowOut} />
          </radialGradient>
        </defs>
        <circle cx="24" cy="26" r="24" fill={`url(#${glow})`} />
        <ellipse className={styles.shadow} cx="24" cy="44.5" rx="10" ry="2" />
        <circle className={styles.ring} cx="24" cy="24" r="18.5" />
        <circle cx="24" cy="24" r="16" fill={`url(#${face})`} />
        <path className={styles.shine} d="M12.5 18.5 A13 13 0 0 1 30 10.6" />
        <g className={styles.eyes}>
          <rect className={styles.pupil} x="16.6" y="17.6" width="5.2" height="9" rx="2.6" />
          <rect className={styles.pupil} x="26.2" y="17.6" width="5.2" height="9" rx="2.6" />
          <circle className={styles.glint} cx="20" cy="19.6" r="1.25" />
          <circle className={styles.glint} cx="29.6" cy="19.6" r="1.25" />
        </g>
      </svg>
      {label ? <span className={styles.label}>{label}</span> : null}
    </span>
  );
};
