import { useEffect, useState } from 'react';
import { IonToast } from '@ionic/react';
import { DEMO_READ_ONLY_EVENT, DEMO_READ_ONLY_MESSAGE } from '../../../services/demoReadOnly';

// ASC-4 fase 6: el aviso global que dispara el interceptor de axios ante un 403 demo_read_only.
export const DemoReadOnlyNotice = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(DEMO_READ_ONLY_EVENT, show);
    return () => window.removeEventListener(DEMO_READ_ONLY_EVENT, show);
  }, []);

  return (
    <IonToast
      isOpen={open}
      message={DEMO_READ_ONLY_MESSAGE}
      color="primary"
      duration={3500}
      onDidDismiss={() => setOpen(false)}
    />
  );
};
