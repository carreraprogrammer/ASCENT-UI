import { create } from 'zustand';

// TCW-1: Ascent is a cromo of The Cyborg Way. The brand has one accent, violet, and it comes from the tokens
// (src/theme/tcw.css), so there is nothing to pick: the old presets are gone and applyAccent sets nothing.
export const ACCENT_PRESETS = [{ label: 'The Cyborg Way', color: 'var(--violet)', rgb: '', hue: 0 }] as const;

export const applyAccent = (_preset: (typeof ACCENT_PRESETS)[number]) => {
  const root = document.documentElement;
  for (const name of ['--color-brand', '--color-brand-rgb', '--color-brand-hover', '--color-brand-active', '--color-brand-hue']) {
    root.style.removeProperty(name);   // an accent saved by an older version must not override the tokens
  }
};

type AccentState = { preset: (typeof ACCENT_PRESETS)[number] };

export const useAccentStore = create<AccentState>(() => ({ preset: ACCENT_PRESETS[0] }));
