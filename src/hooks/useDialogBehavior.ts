import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

interface Options {
  isOpen: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** Cmd/Ctrl+Enter. */
  onSubmit?: () => void;
  /** Selector del elemento que recibe el foco al abrir (por defecto, el primer enfocable). */
  initialFocus?: string;
}

const stack: object[] = [];

const focusables = (root: HTMLElement): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));

/** Comportamiento común de los diálogos de escritorio (TCW-27): foco atrapado y devuelto, Esc, Cmd/Ctrl+Enter y fondo sin scroll. */
export const useDialogBehavior = ({ isOpen, containerRef, onClose, onSubmit, initialFocus }: Options): void => {
  const closeRef = useRef(onClose);
  const submitRef = useRef(onSubmit);
  closeRef.current = onClose;
  submitRef.current = onSubmit;

  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const root = containerRef.current;
    if (root) {
      const target = (initialFocus ? root.querySelector<HTMLElement>(initialFocus) : null) ?? focusables(root)[0] ?? root;
      target.focus();
    }

    // Con diálogos apilados (p. ej. la confirmación sobre el panel) solo reacciona el de arriba.
    const token = {};
    stack.push(token);

    const onKeyDown = (e: KeyboardEvent) => {
      const box = containerRef.current;
      if (!box || e.defaultPrevented || stack[stack.length - 1] !== token) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && submitRef.current) {
        e.preventDefault();
        submitRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables(box);
      if (!items.length) { e.preventDefault(); box.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!active || !box.contains(active)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && (active === first || active === box)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      stack.splice(stack.indexOf(token), 1);
      document.body.style.overflow = previousOverflow;
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) previous.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
};
