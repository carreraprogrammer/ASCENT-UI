import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonContent, IonPage, isPlatform } from '@ionic/react';
import { AuthLayout } from '../../templates/AuthLayout';
import { FormSection } from '../../molecules/FormSection/FormSection';
import { ErrorState } from '../../molecules/ErrorState';
import { Spinner } from '../../atoms/Spinner';
import { DynamicForm } from '../../organisms/DynamicForm';
import { GoogleButton } from '../../atoms/GoogleButton';
import { CyborgWayButton } from '../../atoms/CyborgWayButton';
import { startCyborgWayLogin } from '../../../services/cyborgWayAuth';
import { useAuthStore } from '../../../store/authStore';
import { useFormStore } from '../../../store/formStore';
import { useToast } from '../../../hooks/useToast';
import { startGoogleOAuth, loginWithGoogleMobile, initGoogleAuth } from '../../../services/authService';
import { getLastAuthPath } from '../../../utils/navigation';
import { localizeAuthSchema } from '../../../utils/authFormCopy';
import { useDesktopLayout } from '../../../hooks/useDesktopLayout';
import { CONTACT_URL } from '../../../services/contact';
import styles from '../AuthPage.module.css';
import nativeStyles from './LoginPageNative.module.css';

const fallbackSchema = {
  slug: 'login-form',
  title: 'Login',
  submit_endpoint: '/api/v1/auth/login',
  submit_method: 'POST' as const,
  fields: [
    { name: 'email', type: 'email' as const, label: 'Email' },
    { name: 'password', type: 'password' as const, label: 'Password' },
  ],
};

export const LoginPage = () => {
  const schema = useFormStore((state) => state.schemas['login-form']);
  const isLoading = useFormStore((state) => state.isLoading);
  const schemaError = useFormStore((state) => state.error);
  const fetchSchema = useFormStore((state) => state.fetchSchema);
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const startDemo = useAuthStore((state) => state.startDemo);
  const isDesktop = useDesktopLayout();
  const [demoLoading, setDemoLoading] = useState(false);
  const location = useLocation();
  const history = useHistory();
  const { showError, toast } = useToast();
  const oauthError = (location.state as { oauthError?: string } | null)?.oauthError;
  const [mobileLoading, setMobileLoading] = useState(false);
  const isNative = isPlatform('capacitor');

  useEffect(() => {
    if (isNative) {
      initGoogleAuth();
      return;
    }
    void fetchSchema('login-form').catch(() => undefined);
  }, [fetchSchema, isNative]);

  useEffect(() => {
    if (!oauthError) return;
    showError(oauthError);
    history.replace(location.pathname, {});
  }, [history, location.pathname, oauthError, showError]);

  // ASC-4 fase 6: "Ver demo" abre una sesión de solo lectura en la cuenta demo, sin credenciales.
  const formSchema = useMemo(() => {
    const base = schema ?? fallbackSchema;
    return isDesktop ? localizeAuthSchema(base) : base;
  }, [schema, isDesktop]);

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await startDemo();
      history.replace('/dashboard');
    } catch {
      showError('No pudimos abrir la demo. Intenta de nuevo.');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleMobileGoogleLogin = async () => {
    setMobileLoading(true);
    try {
      const response = await loginWithGoogleMobile();
      hydrateAuth(response);
      history.replace(getLastAuthPath());
    } catch {
      showError('No se pudo iniciar sesión con Google.');
    } finally {
      setMobileLoading(false);
    }
  };

  if (isNative) {
    return (
      <IonPage>
        <IonContent fullscreen style={{ '--background': 'var(--color-bg-primary)' }}>
          <div className={nativeStyles.page}>
            <svg className={nativeStyles.bg} viewBox="0 0 390 844" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <polyline points="10,800 100,540 200,670 310,430 380,460" fill="none" stroke="var(--text-on-surface-soft)" strokeWidth="2" opacity="0.065" strokeLinejoin="round" strokeLinecap="round" />
              <line x1="10" y1="820" x2="380" y2="820" stroke="var(--text-on-surface-muted)" strokeWidth="1" opacity="0.05" />
              <circle cx="310" cy="430" r="6" fill="var(--color-text-primary)" opacity="0.10" />
            </svg>

            <div className={nativeStyles.top}>
              <span className={nativeStyles.tagline}>Tu coach de finanzas personal</span>
            </div>

            <div className={nativeStyles.center}>
              <div className={nativeStyles.divider}>
                <span className={nativeStyles.dividerLine} />
                <span className={nativeStyles.dividerText}>Iniciar sesión</span>
                <span className={nativeStyles.dividerLine} />
              </div>

              {mobileLoading ? (
                <Spinner />
              ) : (
                <button
                  className={nativeStyles.gButton}
                  onClick={() => void handleMobileGoogleLogin()}
                  aria-label="Iniciar sesión con Google"
                >
                  <img className={nativeStyles.gIcon} src="/icons/google-g.svg" alt="" aria-hidden="true" />
                </button>
              )}
            </div>

            <a className={nativeStyles.registerLink} href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
              ¿Aún sin acceso? <span>Solicitar acceso</span>
            </a>
          </div>
          {toast}
        </IonContent>
      </IonPage>
    );
  }

  if (isLoading && !schema) {
    return <Spinner />;
  }

  return (
    <AuthLayout title="Iniciar sesión" section="Iniciar sesión" heading="Sigue tu ascenso">
      <div className={styles.stack}>
        <div className={`${styles.contentHeader} ${styles.mobileOnly}`}>
          <span className={styles.contentEyebrow}>Acceso rápido</span>
          <p className={styles.contentText}>Entra con The Cyborg Way, con Google o con tu correo.</p>
        </div>

        <CyborgWayButton onClick={() => void startCyborgWayLogin()} />
        <GoogleButton onClick={startGoogleOAuth} />

        <div className={styles.divider} aria-hidden="true">
          <span className={styles.line} />
          <span className={styles.dividerText}>
            <span className={styles.mobileOnly}>o con email</span>
            <span className={styles.desktopOnly}>o con tu correo</span>
          </span>
          <span className={styles.line} />
        </div>

        <FormSection
          className={`${styles.emailSection} ${styles.phoneHideSchemaText}`}
          title="Acceso con email"
          description="Usa tu correo para entrar. Si el esquema dinámico no carga, el formulario base sigue disponible."
        >
          {schemaError && !schema && !isDesktop ? (
            <ErrorState
              title="No pudimos cargar el formulario dinámico"
              message={schemaError}
              onRetry={() => void fetchSchema('login-form')}
            />
          ) : null}

          {isLoading && !schema ? (
            <div style={{ display: 'grid', placeItems: 'center', padding: 'var(--space-4)' }}>
              <Spinner size="lg" />
            </div>
          ) : null}

          <DynamicForm
            schema={formSchema}
            submitLabel="Entrar"
            onSuccess={(response) => {
              hydrateAuth(response);
              history.replace(getLastAuthPath());
            }}
            onError={() => {
              showError('No se pudo iniciar sesión. Verifica tus credenciales.');
            }}
          />
        </FormSection>

        <a className={styles.link} href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
          ¿Aún sin acceso? <span className={styles.linkAccent}>Solicitar acceso</span>
        </a>

        <button
          type="button"
          className={`${styles.demoLink} ${styles.desktopOnly}`}
          onClick={() => void handleDemo()}
          disabled={demoLoading}
        >
          <span className={styles.demoText}>{demoLoading ? 'Abriendo la demo…' : 'Ver demo'}</span>
          <span className={styles.demoHint}>datos de ejemplo, sin cuenta</span>
        </button>
        {toast}
      </div>
    </AuthLayout>
  );
};
