// TCW-5: botón de /login que entra con la sesión de ejemplo, sin credenciales. Solo se carga con VITE_LOCAL_FIXTURES=1.
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
  return (
    <button type="button" className={styles.demoLink} data-testid="local-fixtures-login" onClick={enter}>
      <span className={styles.demoText}>Entrar con la sesión de ejemplo</span>
      <span className={styles.demoHint}>datos inventados, sin red</span>
    </button>
  );
};

export default LocalLoginShortcut;
