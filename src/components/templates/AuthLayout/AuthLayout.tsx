import type { ReactNode } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { BrandMark } from '../../atoms/BrandMark';
import { CromoSeal } from '../../atoms/CromoSeal';
import { AscentMountain } from '../../molecules/AscentMountain';
import styles from './AuthLayout.module.css';

// ASC-4 fase 1: en escritorio (≥ 1024 px) el login y el registro siguen el mockup AscentLogin: a la izquierda la
// marca, "Cada mes, un paso más arriba.", las cuatro etapas y la montaña con el escalador; a la derecha el
// separador, el título y las acciones. Por debajo de 1024 px se ve la tarjeta de siempre (móvil queda igual).
const STAGES = [
  { label: 'Fondo semilla', at: 0 },
  { label: 'Pagar deudas', at: 0.4 },
  { label: 'Fondo de emergencia', at: 0.7 },
  { label: 'Crecer patrimonio', at: 0.95 },
];

export interface AuthLayoutProps {
  /** Título de la tarjeta en móvil y tableta. */
  title: string;
  /** Escritorio: texto del separador sobre el título ("Iniciar sesión"). */
  section?: string;
  /** Escritorio: título del panel derecho ("Sigue tu ascenso"). */
  heading?: string;
  children: ReactNode;
}

export const AuthLayout = ({ title, section, heading, children }: AuthLayoutProps) => (
  <IonPage className={styles.authPage}>
    <IonContent className={styles.authContent} fullscreen>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCard}>
            <div className={styles.brandLockup}>
              <BrandMark variant="monoline" size="lg" />
              <div className={styles.brandText}>
                <span className={styles.eyebrow}>a cromo by The Cyborg Way</span>
                <strong className={styles.brandTitle}>Ascent</strong>
              </div>
            </div>
            <div className={styles.copy}>
              <h1 className={styles.title}>{title}</h1>
            </div>
          </div>

          <div className={styles.story}>
            <div className={styles.storyLockup}>
              <BrandMark variant="monoline" size="sm" />
              <div className={styles.storyLockupText}>
                <span className={styles.storyKicker}>a cromo by The Cyborg Way</span>
                <span className={styles.storyBrand}>Ascent</span>
              </div>
            </div>
            <div className={styles.storyCopy}>
              <span className={styles.storyTagline}>Tu coach de finanzas personal</span>
              <h2 className={styles.storyTitle}>Cada mes, un paso más arriba.</h2>
              <p className={styles.storyText}>
                Primero un colchón, luego las deudas, después tu fondo de emergencia y al final tu patrimonio. Ascent
                te dice en qué tramo vas y cuánto te falta.
              </p>
            </div>
            <AscentMountain
              className={styles.storyMountain}
              width={620}
              height={330}
              progress={0.4}
              stages={STAGES}
              ticks
              topLabel="cima"
              bottomLabel="hoy"
              climberLabel="Tú · 40%"
            />
          </div>
        </section>
        <section className={styles.panel}>
          <div className={styles.panelGlow} aria-hidden="true" />
          <div className={styles.panelBody}>
            {heading ? (
              <div className={styles.panelHead}>
                {section ? (
                  <div className={styles.panelDivider}>
                    <span className={styles.panelLine} aria-hidden="true" />
                    <span>{section}</span>
                    <span className={styles.panelLine} aria-hidden="true" />
                  </div>
                ) : null}
                <h1 className={styles.panelTitle}>{heading}</h1>
              </div>
            ) : null}
            {children}
            <CromoSeal className={styles.seal} />
          </div>
        </section>
      </main>
    </IonContent>
  </IonPage>
);
