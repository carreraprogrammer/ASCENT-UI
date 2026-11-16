import { CromoSeal } from '../../atoms/CromoSeal';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { IonIcon, IonPage, isPlatform } from '@ionic/react';
import { closeOutline, logOutOutline, personCircleOutline } from 'ionicons/icons';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Header } from '../../organisms/Header';
import { ImpersonationBanner } from '../../molecules/ImpersonationBanner/ImpersonationBanner';
import { DemoBanner } from '../../molecules/DemoBanner';
import { BrandMark } from '../../atoms/BrandMark';
import { BreadcrumbTrail, type BreadcrumbItem } from '../../organisms/BreadcrumbTrail';
import { CompletenessIndicator } from '../../molecules/CompletenessIndicator';
import { rememberAuthPath } from '../../../utils/navigation';
import { useAuthStore } from '../../../store/authStore';
import { AppLayoutContext, type AppToolbarConfig } from './AppLayoutContext';
import styles from './AppLayout.module.css';

// "Planes" en el menú lateral (solo visible en escritorio web) abre el plan del mes en
// curso, /planes/:year/:month. Antes apuntaba a /planned-expenses ("Planeados"). En la app
// nativa se conserva el destino de siempre. Ver ASC-4, fase 5.
const PLANES_PREFIX = '/planes/';
const currentPlanesPath = (now = new Date()) => `${PLANES_PREFIX}${now.getFullYear()}/${now.getMonth() + 1}`;
const isNativeApp = () => {
  try {
    return isPlatform('capacitor');
  } catch {
    return false;
  }
};

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transacciones' },
  { to: '/debts', label: 'Deudas' },
  { to: '/planned-expenses', label: 'Planes' },
  { to: '/savings-goals', label: 'Metas' },
  { to: '/recurring', label: 'Recurrentes' },
  { to: '/budgets', label: 'Presupuestos' },
  { to: '/profile', label: 'Mi perfil' },
];

export const AppLayout = ({ title, children }: { title: string; children: ReactNode }) => {
  const location = useLocation();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [toolbar, setToolbar] = useState<AppToolbarConfig | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const layoutContext = useMemo(() => ({ setBreadcrumbs, setToolbar }), []);

  useEffect(() => {
    rememberAuthPath(location.pathname);
    setBreadcrumbs([]);
    setToolbar(null);
  }, [location.pathname]);

  useEffect(() => {
    const shell = shellRef.current;
    const header = headerRef.current;
    if (!shell || !header || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const syncHeaderHeight = () => {
      shell.style.setProperty('--app-header-height', `${header.getBoundingClientRect().height}px`);
    };

    syncHeaderHeight();

    const observer = new ResizeObserver(() => {
      syncHeaderHeight();
    });

    observer.observe(header);

    return () => observer.disconnect();
  }, []);

  const renderNav = () => (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const isPlanes = item.label === 'Planes' && !isNativeApp();
        return (
        <NavLink
          key={item.to}
          to={isPlanes ? currentPlanesPath() : item.to}
          className={styles.navLink}
          activeClassName={styles.navLinkActive}
          exact
          isActive={isPlanes ? (_match, loc) => loc.pathname.startsWith(PLANES_PREFIX) : undefined}
        >
          {item.label}
        </NavLink>
        );
      })}
    </nav>
  );

  return (
    <AppLayoutContext.Provider value={layoutContext}>
      <IonPage className={styles.page}>
        <div ref={shellRef} className={styles.shell}>
          <div className={styles.backdrop} aria-hidden="true" />
          <div ref={headerRef} className={styles.headerSlot}>
            <ImpersonationBanner />
            <DemoBanner />
            <Header currentSection={title} toolbar={toolbar} />
            <BreadcrumbTrail items={breadcrumbs} />
          </div>
          <div className={styles.grid}>
            <aside className={styles.sidebar}>
              <div className={styles.sidebarPanel}>
                <p className={styles.sidebarLabel}>Finanzas</p>
                {renderNav()}
              </div>
            </aside>
            <main className={styles.main}>
              <div className={styles.contentShell} data-agent-drag-surface="content">
                {children}
                <footer className={styles.footer}>
                  <CromoSeal />
                </footer>
              </div>
            </main>
          </div>

          <CompletenessIndicator />
        </div>
      </IonPage>
    </AppLayoutContext.Provider>
  );
};
