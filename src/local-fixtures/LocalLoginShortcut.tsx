// TCW-5: /login con VITE_LOCAL_FIXTURES=1. Entra SOLO con la sesión de ejemplo al montar (office-shot --login solo abre
// la página: no hace clic ni escribe) y conserva el botón. hydrateAuth guarda la sesión en localStorage, así que
// recargas y goto a otras rutas siguen autenticados. Solo se carga con la variable; el build de producción no lo incluye.
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { exampleAuthEnvelope } from './session';
import styles from '../components/pages/AuthPage.module.css';

const LocalLoginShortcut = () => {
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const history = useHistory();
  const enter = () => {
    hydrateAuth(exampleAuthEnvelope());
    history.replace('/dashboard');
  };

  useEffect(() => {
    if (!useAuthStore.getState().isAuthenticated) enter();
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button type="button" className={styles.demoLink} data-testid="local-fixtures-login" onClick={enter}>
      <span className={styles.demoText}>Entrar con la sesión de ejemplo</span>
      <span className={styles.demoHint}>datos inventados, sin red</span>
    </button>
  );
};

export default LocalLoginShortcut;
