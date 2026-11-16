import { useEffect, useState } from 'react';
import { financeService } from '../../../services/financeService';
import { useEmailConnectionStore } from '../../../store/emailConnectionStore';
import { useAgentDataVersion } from '../../../contexts/AgentUIContext';

// TCW-5: la franja de estado solo muestra lo que ya está guardado (comment-01-datos):
//   Gmail: GET /me/email_connection (conectado, por reconectar o sin conectar). No hay "último correo leído": se omite.
//   Revisión nocturna: la última de GET /night_analyses (su hora y su estado de salud).
//   Por revisar: los movimientos pendientes (GET /transactions/pending).
//   El consolidado al cerebro lo escribe el cromo en el cerebro y Ascent no lo guarda: ese tramo se omite.
export interface InstStatus {
  gmail: 'connected' | 'reconnect' | 'off' | null;
  night: { created_at: string; health_status: string } | null;
  pending: number | null;
}

export const useInstStatus = (): InstStatus => {
  const connected = useEmailConnectionStore((s) => s.connected);
  const needsReconnect = useEmailConnectionStore((s) => s.needsReconnect);
  const fetchStatus = useEmailConnectionStore((s) => s.fetchStatus);
  const dataVersion = useAgentDataVersion();
  const [night, setNight] = useState<InstStatus['night']>(null);
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => { if (connected === null) void fetchStatus(); }, [connected, fetchStatus]);
  useEffect(() => {
    let alive = true;
    financeService.fetchLatestNightAnalysis().then((n) => { if (alive) setNight(n); }).catch(() => undefined);
    financeService.fetchPendingTransactions()
      .then((res) => { if (alive) setPending(res.data.length); })
      .catch(() => { if (alive) setPending(null); });
    return () => { alive = false; };
  }, [dataVersion]);

  const gmail = connected === null ? null : !connected ? 'off' : needsReconnect ? 'reconnect' : 'connected';
  return { gmail, night, pending };
};
