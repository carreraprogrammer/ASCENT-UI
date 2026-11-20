# Brand — Ascent, a cromo by The Cyborg Way

Ascent wears the brand of **The Cyborg Way** (TCW-1). The design system is the source of truth:

- Design system "The Cyborg Way": https://claude.ai/artifact/FZvaVhoGfKcZvLmnW3XExe (README, tokens, components).
- Copy in this repo: `src/theme/tcw-tokens.json` → `src/theme/tcw.css` (`node scripts/build-tokens.mjs`).
  `src/theme/tokens.css` maps Ascent's own variable names to those tokens. No colour is written anywhere else:
  `src/test/brand.test.ts` fails on any hex outside `tcw.css`.
- Type: Inter Tight (400/500/600) and Geist Mono (400/500), served from `public/fonts/` (OFL licences there).
- Dark is the default; light follows `data-theme` on `<html>` (Profile → theme).

## Product rules (Ascent only)

- **Amounts in mono**: every amount uses `var(--font-mono)` with tabular figures (`CurrencyValue`, and any class
  named `*amount*`).
- **Income and expense with existing tokens**: income `--color-income` (= `--data-both`), expense
  `--color-expense` (= `--data-lexical`). `--danger` only for errors.
- **Categories**: the categorical palette of the brand (`--cat-*`): committed rose, necessary gold, flexible sky,
  investment lime, social coral, unknown slate. Charts use the same palette; never violet.
- **Violet** only for the one primary action of a view and the violet square of the mark. One primary per view.
- **Seal**: "a cromo by The Cyborg Way" (`CromoSeal`) in the sign-in and at the foot of every page.
- **Sign-in**: "Continuar con The Cyborg Way" (OIDC + PKCE against the brain) is the primary action; Google and
  email stay.
- Corners at most `--radius-lg` (12 px); cards separate with lines, not shadows; labels in sentence case.
