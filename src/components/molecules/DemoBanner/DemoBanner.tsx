import { useAuthStore } from '../../../store/authStore';
import styles from './DemoBanner.module.css';

// ASC-4 fase 6: franja discreta en la cabecera mientras la sesión es la cuenta demo. Si se entró con el
// interruptor de Mi perfil, trae "Volver a mi cuenta", que restaura la sesión real sin cerrar sesión.
export const DemoBanner = () => {
  const isDemo = useAuthStore((state) => state.user?.demo === true);
  const canReturn = useAuthStore((state) => state.demoStash !== null);
  const exitDemoMode = useAuthStore((state) => state.exitDemoMode);

  if (!isDemo) return null;

  const handleReturn = () => {
    exitDemoMode();
    // Recarga completa: nada de la cuenta demo queda en memoria al volver a la real.
    window.location.assign('/profile');
  };

  return (
    <div className={styles.banner} role="status" data-demo-banner="">
      <span className={styles.label}>Modo demo · datos de ejemplo</span>
      {canReturn ? (
        <button type="button" className={styles.returnBtn} onClick={handleReturn}>
          Volver a mi cuenta
        </button>
      ) : null}
    </div>
  );
};
