import '@testing-library/jest-dom/vitest';
import { stubMatchMedia } from './stubMatchMedia';

// jsdom has no matchMedia and themeStore reads it on import (TCW-27 CA10).
stubMatchMedia();
