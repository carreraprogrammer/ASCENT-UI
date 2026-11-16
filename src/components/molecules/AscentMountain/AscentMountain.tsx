import { useId } from 'react';
import { Climber } from '../../atoms/Climber';
import styles from './AscentMountain.module.css';

// ASC-4: la montaña de "Tu ascenso" para el login web y el regreso de Gmail (misma idea que el login nativo y el
// gráfico del Dashboard): pico con bandera, ladera recorrida en violeta hasta el escalador y, si se piden, las
// cuatro etapas marcadas. El escalador es atoms/Climber, encima del SVG, en la misma proporción.
export interface MountainStage {
  label: string;
  at: number;
}

export interface AscentMountainProps {
  width: number;
  height: number;
  progress: number;
  stages?: MountainStage[];
  ticks?: boolean;
  topLabel?: string;
  bottomLabel?: string;
  climberSize?: number;
  climberLabel?: string;
  className?: string;
}

export const AscentMountain = ({
  width: w,
  height: h,
  progress,
  stages,
  ticks = false,
  topLabel,
  bottomLabel,
  climberSize = 40,
  climberLabel,
  className,
}: AscentMountainProps) => {
  const peakId = `ascent-peak-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const frac = Math.max(0, Math.min(1, progress));
  const px = w * 0.5;
  const py = h * 0.12;
  const lx = w * 0.06;
  const ly = h * 0.92;
  const rx = w * 0.96;
  const at = (f: number) => ({ x: lx + (px - lx) * f, y: ly + (py - ly) * f });
  const climber = at(frac);

  return (
    <div className={[styles.mountain, className].filter(Boolean).join(' ')} aria-hidden="true">
      <svg className={styles.svg} viewBox={`0 0 ${w} ${h}`} focusable="false">
        <defs>
          <linearGradient id={peakId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={styles.peakTop} />
            <stop offset="1" className={styles.peakBottom} />
          </linearGradient>
        </defs>
        {ticks
          ? [0.25, 0.5, 0.75, 1].map((f) => (
              <line key={f} className={styles.tick} x1={w * 0.02} x2={w * 0.98} y1={at(f).y} y2={at(f).y} />
            ))
          : null}
        <path d={`M${lx},${ly} L${px},${py} L${rx},${ly} Z`} fill={`url(#${peakId})`} />
        <line className={styles.slope} x1={lx} y1={ly} x2={px} y2={py} />
        <line className={styles.slopeDone} x1={lx} y1={ly} x2={climber.x} y2={climber.y} />
        <line className={styles.pole} x1={px} y1={py} x2={px} y2={py - 24} />
        <path className={styles.flag} d={`M${px},${py - 23} L${px + 15},${py - 19} L${px},${py - 14} Z`} />
        {stages?.map((stage) => {
          const p = at(stage.at);
          const reached = stage.at <= frac;
          return (
            <g key={stage.label}>
              <circle className={reached ? styles.stageDotDone : styles.stageDot} cx={p.x} cy={p.y} r="4" />
              <text className={reached ? styles.stageTextDone : styles.stageText} x={p.x + 12} y={p.y + 4}>
                {stage.label}
              </text>
            </g>
          );
        })}
        {topLabel ? <text className={styles.edgeLabel} x={w * 0.98} y={py - 6} textAnchor="end">{topLabel}</text> : null}
        {bottomLabel ? <text className={styles.edgeLabel} x={w * 0.98} y={ly - 6} textAnchor="end">{bottomLabel}</text> : null}
      </svg>
      <span
        className={styles.climber}
        style={{ left: `${(climber.x / w) * 100}%`, top: `${(climber.y / h) * 100}%` }}
      >
        <Climber size={climberSize} label={climberLabel} />
      </span>
    </div>
  );
};
