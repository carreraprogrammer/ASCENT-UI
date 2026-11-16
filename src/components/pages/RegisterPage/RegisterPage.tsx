import { useMemo } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { AuthLayout } from '../../templates/AuthLayout';
import { FormSection } from '../../molecules/FormSection/FormSection';
import { DynamicForm } from '../../organisms/DynamicForm';
import { GoogleButton } from '../../atoms/GoogleButton';
import { startGoogleOAuth } from '../../../services/authService';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../hooks/useToast';
import { getLastAuthPath } from '../../../utils/navigation';
import { localizeAuthSchema } from '../../../utils/authFormCopy';
import { DESKTOP_QUERY, useMediaQuery } from '../../../hooks/useMediaQuery';
import styles from '../AuthPage.module.css';

const schema = {
  slug: 'register-form',
  title: 'Register',
  submit_endpoint: '/api/v1/auth/register',
  submit_method: 'POST' as const,
  fields: [
    { name: 'name', type: 'text' as const, label: 'Nombre' },
    { name: 'email', type: 'email' as const, label: 'Email' },
    { name: 'password', type: 'password' as const, label: 'Password' },
  ],
};

export const RegisterPage = () => {
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const history = useHistory();
  const { showError, toast } = useToast();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const formSchema = useMemo(() => (isDesktop ? localizeAuthSchema(schema) : schema), [isDesktop]);

  return (
    <AuthLayout title="Registro" section="Crear cuenta" heading="Empieza tu ascenso">
      <div className={styles.stack}>
        <div className={`${styles.contentHeader} ${styles.mobileOnly}`}>
          <span className={styles.contentEyebrow}>Crear acceso</span>
          <p className={styles.contentText}>Empieza con Google o crea tu acceso con email.</p>
        </div>

        <GoogleButton onClick={startGoogleOAuth} />

        <div className={styles.divider} aria-hidden="true">
          <span className={styles.line} />
          <span className={styles.dividerText}>
            <span className={styles.mobileOnly}>o regístrate con email</span>
            <span className={styles.desktopOnly}>o con tu correo</span>
          </span>
          <span className={styles.line} />
        </div>

        <FormSection
          className={styles.emailSection}
          title="Registro con email"
          description="Crea tu acceso y entra directo al tablero financiero una vez se complete el alta."
        >
          <DynamicForm
            schema={formSchema}
            submitLabel="Crear cuenta"
            onSuccess={(response) => {
              hydrateAuth(response);
              history.replace(getLastAuthPath());
            }}
            onError={() => {
              showError('No se pudo completar el registro.');
            }}
          />
        </FormSection>

        <Link className={styles.link} to="/login">
          ¿Ya tienes cuenta? <span className={styles.linkAccent}>Inicia sesión</span>
        </Link>
        {toast}
      </div>
    </AuthLayout>
  );
};
