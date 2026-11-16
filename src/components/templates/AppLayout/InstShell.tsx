import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, useHistory } from 'react-router-dom';
import { BrandMark } from '../../atoms/BrandMark';
import { InstButton } from '../../atoms/Inst';
import { InstPageHeader } from '../../molecules/Inst';
import { ImpersonationBanner } from '../../molecules/ImpersonationBanner/ImpersonationBanner';
import { useAuthStore } from '../../../store/authStore';
import { fmtAgo } from '../../../utils/instrumento';
import type { AppToolbarConfig } from './AppLayoutContext';
import type { BreadcrumbItem } from '../../organisms/BreadcrumbTrail';
import { useInstStatus } from './useInstStatus';
import styles from './InstShell.module.css';

// TCW-5 "Instrumento": el armazón de escritorio de Ascent (mockups U_Ascent*). Mismas rutas y el mismo menú que
// AppLayout; cambia la presentación. Se monta solo en escritorio web: en móvil y en Capacitor AppLayout sigue
// renderizando su árbol de siempre.

export interface InstNavItem { to: string; label: string; isActive?: (pathname: string) => boolean }

const COMMIT = (import.meta.env.VITE_COMMIT as string | undefined)?.slice(0, 7) || null;

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/gu, '').toLowerCase().trim();

const HEALTH: Record<string, string> = { comfortable: 'ok', warning: 'justo', critical: 'en rojo' };

export const InstShell = ({ nav, title, toolbar, breadcrumbs, ownHeader, children }: {
  nav: InstNavItem[];
  title: string;
  toolbar: AppToolbarConfig | null;
  breadcrumbs: BreadcrumbItem[];
  ownHeader?: boolean;
  children: ReactNode;
}) => {
  const history = useHistory();
  const status = useInstStatus();
  const isDemo = useAuthStore((s) => s.user?.demo === true);
  const canReturn = useAuthStore((s) => s.demoStash !== null);
  const exitDemoMode = useAuthStore((s) => s.exitDemoMode);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');

  // El scroll es el del documento mientras el armazón de escritorio está montado.
  useEffect(() => {
    document.documentElement.classList.add('inst-desktop');
    return () => document.documentElement.classList.remove('inst-desktop');
  }, []);

  // ⌘K / Ctrl+K lleva al buscador.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // "Buscar o ir a…": el nombre de una sección lleva a ella; cualquier otra cosa busca en Transacciones
  // (la búsqueda por concepto o producto que ya existe).
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const hit = nav.find((n) => norm(n.label).startsWith(norm(q)));
    history.push(hit ? hit.to : `/transactions?q=${encodeURIComponent(q)}`);
    setQuery('');
    searchRef.current?.blur();
  };

  const night = status.night;
  const nightAgo = night ? fmtAgo(night.created_at) : null;

  return (
    <div className={styles.root}>
      <ImpersonationBanner />
      <header className={styles.header}>
        <BrandMark size="sm" className={styles.mark} />
        <Link to="/dashboard" className={styles.brand}>Ascent</Link>
        <a className={styles.cromo} href="https://thecyborgway.dev" target="_blank" rel="noreferrer">a cromo by The Cyborg Way</a>
        <span className={styles.spacer} />
        <form className={styles.search} role="search" onSubmit={submit}>
          <input ref={searchRef} className={styles.searchInput} type="search" value={query}
            onChange={(e) => setQuery(e.target.value)} placeholder="Buscar o ir a…" aria-label="Buscar movimientos o ir a una sección"
            aria-keyshortcuts="Meta+K Control+K" />
          <span className={styles.kbd} aria-hidden="true">⌘K</span>
        </form>
        <Link to="/profile" className={styles.profile}>Mi perfil</Link>
      </header>

      <div className={styles.strip} role="status" aria-label="Estado de Ascent">
        {status.gmail ? (
          <span>
            <span aria-hidden="true" className={status.gmail === 'connected' ? styles.dotOk : status.gmail === 'reconnect' ? styles.dotWarn : styles.dotOff}>● </span>
            {status.gmail === 'connected' ? 'Gmail conectado' : status.gmail === 'reconnect' ? 'Gmail por reconectar' : 'Gmail sin conectar'}
          </span>
        ) : null}
        {night && nightAgo ? <span>revisión nocturna · {nightAgo} · {HEALTH[night.health_status] ?? night.health_status}</span> : null}
        <span className={styles.spacer} />
        {status.pending ? (
          <Link className={styles.stripRight} to="/transactions?status=pending">
            {status.pending === 1 ? '1 movimiento por revisar' : `${status.pending} movimientos por revisar`}
          </Link>
        ) : null}
      </div>

      <div className={styles.body}>
        <nav aria-label="Finanzas" className={styles.nav}>
          <div className={styles.navInner}>
            <span className={styles.navLabel}>Finanzas</span>
            {nav.map((item) => (
              <NavLink key={item.label} to={item.to} exact className={styles.navLink} activeClassName={styles.navActive}
                isActive={item.isActive ? (_m, loc) => item.isActive!(loc.pathname) : undefined}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
        <main className={styles.main}>
          <div className={styles.content}>
            {breadcrumbs.length ? (
              <nav aria-label="Ruta" className={styles.crumbs}>
                {breadcrumbs.map((b, i) => (
                  <span key={`${b.label}-${i}`}>
                    {i > 0 ? '› ' : ''}
                    {b.onClick ? <button type="button" onClick={b.onClick}>{b.label}</button> : b.to ? <Link to={b.to}>{b.label}</Link> : b.label}
                  </span>
                ))}
              </nav>
            ) : null}
            {ownHeader ? null : (
              <InstPageHeader title={toolbar?.title || title} sub={toolbar?.subtitle}
                actions={toolbar?.actions?.length ? toolbar.actions.map((a) => (
                  <InstButton key={a.key} onClick={a.onClick} aria-label={a.label}>{a.label}</InstButton>
                )) : null} />
            )}
            {children}
            <footer className={styles.footer}>
              <a className={styles.footerLink} href="https://thecyborgway.dev" target="_blank" rel="noreferrer">
                <BrandMark size="sm" className={styles.footerMark} />
                <span>a cromo by <strong>The Cyborg Way</strong></span>
              </a>
              <span className={styles.spacer} />
              <span>
                {[COMMIT, isDemo ? 'datos de ejemplo' : null].filter(Boolean).join(' · ')}
                {isDemo && canReturn ? (
                  <> · <button type="button" className={styles.footerBtn}
                    onClick={() => { exitDemoMode(); window.location.assign('/profile'); }}>Volver a mi cuenta</button></>
                ) : null}
              </span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};
