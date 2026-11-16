import { useEffect, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { AscentMountain } from '../../molecules/AscentMountain';
import { useAuthStore } from '../../../store/authStore';
import { useEmailConnectionStore } from '../../../store/emailConnectionStore';
import styles from './GmailCallbackPage.module.css';

// ASC-4 fase 2: a dónde vuelve el navegador después de autorizar Gmail en web. La API (callback de Google)
// redirige aquí con ?status=connected|error. iOS sigue con su deep link (App.tsx), esta página es solo web.
// Vuelve sola a Mi perfil a los 3 s; los enlaces son <a href> reales, así que funcionan aunque falle el JS.
export const RETURN_PATH = '/profile';
export const RETURN_SECONDS = 3;

export const GmailCallbackPage = () => {
  const location = useLocation();
  const history = useHistory();
  const connected = new URLSearchParams(location.search).get('status') === 'connected';
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const startOAuth = useEmailConnectionStore((state) => state.startOAuth);
  const retrying = useEmailConnectionStore((state) => state.actionLoading);
  const [seconds, setSeconds] = useState(RETURN_SECONDS);

  useEffect(() => {
    const tick = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    const back = window.setTimeout(() => history.replace(RETURN_PATH), RETURN_SECONDS * 1000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(back);
    };
  }, [history]);

  const title = connected ? 'Gmail conectado' : 'No pudimos conectar Gmail';

  return (
    <IonPage>
      <IonContent fullscreen className={styles.content}>
        <main className={styles.page}>
          <section className={styles.card} aria-labelledby="gmail-callback-title">
            <div className={styles.art}>
              <AscentMountain width={360} height={150} progress={connected ? 0.62 : 0.4} climberSize={34} />
            </div>
            <div className={styles.body}>
              <span className={styles.kicker}>a cromo by The Cyborg Way · Ascent</span>
              <h1 id="gmail-callback-title" className={styles.title}>
                <span className={connected ? styles.dotOk : styles.dotError} aria-hidden="true" />
                {title}
              </h1>
              {connected ? (
                <p className={styles.text}>
                  Tu agente ya puede leer los correos de tus bancos y registrar cada movimiento por ti. Solo lee: nunca
                  envía ni borra.
                </p>
              ) : (
                <p className={styles.text}>
                  Google no confirmó el permiso. No cambió nada en tu cuenta; puedes intentarlo otra vez desde Mi
                  perfil. Tu agente solo lee tus correos: nunca envía ni borra.
                </p>
              )}
              <a className={styles.primary} href={RETURN_PATH}>
                {connected ? 'Volver a Ascent' : 'Volver a Mi perfil'}
              </a>
              {!connected ? (
                isAuthenticated ? (
                  <button type="button" className={styles.retry} onClick={() => void startOAuth()} disabled={retrying}>
                    {retrying ? 'Abriendo…' : 'Intentar de nuevo'}
                  </button>
                ) : (
                  <a className={styles.retry} href="/login">Intentar de nuevo</a>
                )
              ) : null}
              <p className={styles.countdown} aria-live="polite">
                Te llevamos de vuelta en {seconds} s
              </p>
            </div>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
};
