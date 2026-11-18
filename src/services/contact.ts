// TCW-8: el registro está cerrado. Quien quiera entrar pide acceso aquí (el Calendly de The Cyborg Way, el mismo
// CONTACT_URL del cerebro). Vite lo hornea al compilar; Railway pasa VITE_CONTACT_URL como build arg.
export const CONTACT_URL: string =
  (import.meta.env.VITE_CONTACT_URL as string | undefined) || 'https://calendly.com/carreraprogrammer';
