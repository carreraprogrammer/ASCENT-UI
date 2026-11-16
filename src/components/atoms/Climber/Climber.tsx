import { useId } from 'react';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import styles from './Climber.module.css';

// ASC-4 fase 3: el escalador de Ascent, un solo dibujo para todos sus usos (Dashboard, login, regreso de Gmail y
// el botón del asistente). Esfera dorada con degradado radial, brillo curvo arriba, halo suave, aro oscuro que la
// separa del fondo, sombra corta debajo y dos pupilas verticales con su punto de brillo que parpadean. Sin boca.
// Los colores salen de los tokens (Climber.module.css). Con reduced motion no parpadea.
// `label` ("Tú · 40%") se ve solo en escritorio (≥ 1024 px): en móvil el layout queda igual.
//
// TCW-2 fase 3: las expresiones que tenían las caras de Buddy, hechas solo con los ojos y el movimiento (sin boca):
//   calm   — pupilas verticales que parpadean (el dibujo de siempre);
//   happy  — ojos en arco y un saltito;
//   cheer  — ojos en arco, saltito con balanceo y dos destellos (ánimo: llega un insight nuevo);
//   think  — pupilas que miran arriba a la derecha y un leve ladeo;
//   worry  — pupilas más cortas y bajas, con un temblor corto;
//   sleep  — ojos cerrados y respiración lenta.
// Con prefers-reduced-motion no hay animación: la expresión se ve solo en los ojos.
export type ClimberEmotion = 'calm' | 'happy' | 'cheer' | 'think' | 'worry' | 'sleep';

export interface ClimberProps {
  size?: number;
  emotion?: ClimberEmotion;
  label?: string;
  className?: string;
  title?: string;
}

const pupils = (dx = 0, dy = 0, height = 9) => (
  <>
    <rect className={styles.pupil} x={16.6 + dx} y={17.6 + dy} width="5.2" height={height} rx="2.6" />
    <rect className={styles.pupil} x={26.2 + dx} y={17.6 + dy} width="5.2" height={height} rx="2.6" />
    <circle className={styles.glint} cx={20 + dx} cy={19.6 + dy} r="1.25" />
    <circle className={styles.glint} cx={29.6 + dx} cy={19.6 + dy} r="1.25" />
  </>
);

const eyesFor = (emotion: ClimberEmotion) => {
  switch (emotion) {
    case 'happy':
    case 'cheer':
      return (
        <>
          <path className={styles.lid} d="M16.4 23.6 Q19.2 17.6 22 23.6" />
          <path className={styles.lid} d="M26 23.6 Q28.8 17.6 31.6 23.6" />
        </>
      );
    case 'think':
      return pupils(1.2, -1.6);
    case 'worry':
      return pupils(0, 1.6, 7.4);
    case 'sleep':
      return (
        <>
          <path className={styles.lid} d="M16.4 22 Q19.2 25.6 22 22" />
          <path className={styles.lid} d="M26 22 Q28.8 25.6 31.6 22" />
        </>
      );
    default:
      return pupils();
  }
};

export const Climber = ({ size = 40, emotion = 'calm', label, className, title }: ClimberProps) => {
  const reducedMotion = usePrefersReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const face = `climber-face-${uid}`;
  const glow = `climber-glow-${uid}`;

  return (
    <span
      className={[styles.climber, styles[emotion], reducedMotion ? undefined : styles.animated, className]
        .filter(Boolean)
        .join(' ')}
      style={{ width: size, height: size }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-climber=""
      data-emotion={emotion}
      data-motion={reducedMotion ? 'off' : 'on'}
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
        <g className={styles.figure}>
          <circle className={styles.ring} cx="24" cy="24" r="18.5" />
          <circle cx="24" cy="24" r="16" fill={`url(#${face})`} />
          <path className={styles.shine} d="M12.5 18.5 A13 13 0 0 1 30 10.6" />
          <g className={styles.eyes}>{eyesFor(emotion)}</g>
          {emotion === 'cheer' ? (
            <g className={styles.sparks}>
              <path className={styles.spark} d="M41 6.5 L42 9.5 L45 10.5 L42 11.5 L41 14.5 L40 11.5 L37 10.5 L40 9.5 Z" />
              <path className={styles.spark} d="M6.5 9 L7.1 10.9 L9 11.5 L7.1 12.1 L6.5 14 L5.9 12.1 L4 11.5 L5.9 10.9 Z" />
            </g>
          ) : null}
        </g>
      </svg>
      {label ? <span className={styles.label}>{label}</span> : null}
    </span>
  );
};
