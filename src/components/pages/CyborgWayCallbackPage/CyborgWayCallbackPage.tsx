import { useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import { Spinner } from '../../atoms/Spinner';
import { useAuthStore } from '../../../store/authStore';
import { finishCyborgWayLogin } from '../../../services/cyborgWayAuth';
import { getLastAuthPath } from '../../../utils/navigation';

// /auth/tcw/callback: the brain of The Cyborg Way sends the browser back here with a code (TCW-1).
export const CyborgWayCallbackPage = () => {
  const location = useLocation();
  const history = useHistory();
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    finishCyborgWayLogin(location.search)
      .then((response) => {
        hydrateAuth(response as Parameters<typeof hydrateAuth>[0]);
        history.replace(getLastAuthPath());
      })
      .catch(() => history.replace('/login', { oauthError: 'No se pudo iniciar sesión con The Cyborg Way.' }));
  }, [history, hydrateAuth, location.search]);

  return (
    <IonPage>
      <IonContent fullscreen>
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '100%' }} role="status" aria-live="polite">
          <Spinner size="lg" />
        </div>
      </IonContent>
    </IonPage>
  );
};
