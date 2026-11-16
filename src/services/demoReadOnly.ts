// ASC-4 fase 6: la cuenta demo es de solo lectura. La API responde 403 {"error":"demo_read_only"} a toda escritura
// con un token demo; un interceptor global de axios lo detecta y avisa una vez, sin que cada página lo maneje.
export const DEMO_READ_ONLY_EVENT = 'ascent:demo-read-only';
export const DEMO_READ_ONLY_MESSAGE = 'Estás en el modo demo: es de solo lectura y no guarda cambios.';

export const isDemoReadOnlyError = (error: unknown): boolean => {
  const response = (error as { response?: { status?: number; data?: unknown } } | null)?.response;
  if (response?.status !== 403) return false;
  const data = response.data as { error?: unknown } | null | undefined;
  return data?.error === 'demo_read_only';
};

export const notifyDemoReadOnly = (): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DEMO_READ_ONLY_EVENT));
};

/** Interceptor de respuesta (rama de error): avisa y deja seguir el rechazo para que la página no asuma éxito. */
export const demoReadOnlyInterceptor = (error: unknown): Promise<never> => {
  if (isDemoReadOnlyError(error)) {
    (error as { demoReadOnly?: boolean }).demoReadOnly = true;
    notifyDemoReadOnly();
  }
  return Promise.reject(error);
};
