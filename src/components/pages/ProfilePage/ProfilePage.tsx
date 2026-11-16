import { useEffect, useMemo, useRef, useState } from 'react';
import { IonContent } from '@ionic/react';
import { useToast } from '../../../hooks/useToast';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../atoms/Button';
import { useThemeStore, type ThemePreference } from '../../../store/themeStore';
import { useProgressStore } from '../../../store/progressStore';
import { useEmailConnectionStore } from '../../../store/emailConnectionStore';
import { Buddy } from '../../atoms/Buddy';
import { useBuddyStore, PERSONAS } from '../../../store/buddyStore';
import type { Persona } from '../../../store/buddyStore';
import { api } from '../../../services/api';
import { adminService, type AdminAccount } from '../../../services/adminService';
import { DataState } from '../../molecules/DataState/DataState';
import { DynamicForm } from '../../organisms/DynamicForm';
import { AppLayout } from '../../templates/AppLayout';
import styles from './ProfilePage.module.css';
import desk from './ProfileDesktop.module.css';
import { useDesktopLayout } from '../../../hooks/useDesktopLayout';
import { InstButton } from '../../atoms/Inst';
import { InstKeyValue, InstNote, InstPageHeader, InstSection } from '../../molecules/Inst';

interface FinancialCtx {
  phase?: string | null;
  strategy?: string | null;
  notes?: string | null;
}

const PHASE_LABEL: Record<string, string> = {
  debt_payoff:     'Pago de deudas',
  emergency_fund:  'Fondo de emergencia',
  investing:       'Inversión',
  wealth_building: 'Construcción de patrimonio',
};

const STRATEGY_LABEL: Record<string, string> = {
  snowball:  'Bola de nieve (menor deuda primero)',
  avalanche: 'Avalancha (mayor interés primero)',
};

const PERSONA_ORDER: Persona[] = ['nilo', 'pip', 'teo'];

export const ProfileContent = () => {
  const isDesktop = useDesktopLayout();
  // TCW-5: en escritorio, "Editar" abre el mismo formulario de perfil en línea, y "Agregar" el de remitentes.
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingSenders, setEditingSenders] = useState(false);
  const user    = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout  = useAuthStore((state) => state.logout);
  const themePreference = useThemeStore((state) => state.preference);
  const setThemePreference = useThemeStore((state) => state.setPreference);
  const { fetchProgress } = useProgressStore();
  const { persona, setPersona } = useBuddyStore();
  const {
    connected: gmailConnected,
    bankSenders,
    loading: gmailLoading,
    actionLoading: gmailActionLoading,
    error: gmailError,
    fetchStatus: fetchGmailStatus,
    startOAuth,
    disconnect: disconnectGmail,
    updateSenders,
  } = useEmailConnectionStore();
  const [senderInput, setSenderInput] = useState('');
  const senderInputRef = useRef<HTMLInputElement>(null);
  const { showError, showSuccess, toast } = useToast();
  const [financialContext, setFinancialContext] = useState<FinancialCtx | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const startImpersonation = useAuthStore((state) => state.startImpersonation);
  // ASC-4 fase 6: interruptor "Modo demo", solo para el superadministrador (también mientras ve la demo, para volver).
  const demoStash = useAuthStore((state) => state.demoStash);
  const enterDemoMode = useAuthStore((state) => state.enterDemoMode);
  const exitDemoMode = useAuthStore((state) => state.exitDemoMode);
  const canSwitchDemo = Boolean(user?.superAdmin || demoStash?.user.superAdmin);
  const inDemo = user?.demo === true && demoStash !== null;
  const [demoSwitching, setDemoSwitching] = useState(false);

  const handleDemoToggle = async () => {
    if (inDemo) {
      exitDemoMode();
      // Recarga completa: nada de la cuenta demo queda en memoria.
      window.location.assign('/profile');
      return;
    }
    setDemoSwitching(true);
    try {
      await enterDemoMode();
      window.location.assign('/dashboard');
    } catch {
      showError('No pudimos abrir el modo demo.');
      setDemoSwitching(false);
    }
  };
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [impersonatingId, setImpersonatingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.superAdmin) return;
    setAccountsLoading(true);
    adminService.getAccounts()
      .then(({ data }) => setAccounts(data.data))
      .catch(() => { /* silencioso — no bloquea el perfil */ })
      .finally(() => setAccountsLoading(false));
  }, [user?.superAdmin]);

  const handleImpersonate = async (account: AdminAccount) => {
    setImpersonatingId(account.id);
    try {
      const { data } = await adminService.impersonate(account.id);
      startImpersonation(data.data.access_token, { id: account.id, name: account.name, email: account.email });
    } catch {
      showError('No pude impersonar esta cuenta.');
    } finally {
      setImpersonatingId(null);
    }
  };

  useEffect(() => {
    fetchProgress();
    void fetchGmailStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setContextLoading(true);
    setContextError(null);
    api.get('/api/v1/financial_context')
      .then(({ data }) => {
        const attrs = (data as { data?: { attributes?: FinancialCtx } })?.data?.attributes ?? null;
        setFinancialContext(attrs);
        setContextLoading(false);
      })
      .catch((error) => {
        setContextError(error instanceof Error ? error.message : 'No fue posible cargar el contexto financiero.');
        setContextLoading(false);
      });
  }, []);

  const profileSchema = useMemo(
    () => ({
      slug:            'profile-form',
      title:           'Perfil',
      submit_endpoint: `/api/v1/users/${user?.id ?? ':id'}`,
      submit_method:   'PATCH' as const,
      fields: [
        { name: 'name', type: 'text' as const, label: 'Nombre' },
        { name: 'city', type: 'text' as const, label: 'Ciudad', placeholder: 'Ej: Medellín, Colombia' },
      ],
    }),
    [user?.id],
  );

  const initialValues = useMemo(
    () => ({ name: user?.name ?? '', city: user?.city ?? '' }),
    [user?.name, user?.city],
  );


  const addSender = () => {
    const trimmed = senderInput.trim().toLowerCase();
    if (trimmed && !bankSenders.includes(trimmed)) {
      void updateSenders([...bankSenders, trimmed]);
      setSenderInput('');
      senderInputRef.current?.focus();
    }
  };

  // ── Escritorio (TCW-5 "Instrumento", mockup U_AscentPerfil) ─────────────────────
  // Mismas acciones que el árbol móvil: formulario de perfil, apariencia, coach, Gmail y remitentes,
  // impersonar (superadministrador), modo demo y cerrar sesión. Cambia la presentación.
  if (isDesktop) {
    const quiet = (label: string, onClick: () => void, extra?: { disabled?: boolean; pressed?: boolean; ariaLabel?: string }) => (
      <button type="button" className={`${desk.quiet} ${extra?.pressed ? desk.on : ''}`} onClick={onClick}
        disabled={extra?.disabled} aria-pressed={extra?.pressed} aria-label={extra?.ariaLabel}>{label}</button>
    );
    const dotted = (items: JSX.Element[]) => (
      <span className={desk.inline}>
        {items.map((it, i) => <span key={i}>{i > 0 ? <span aria-hidden="true" className={desk.sep}>·</span> : null}{it}</span>)}
      </span>
    );
    const otherAccounts = user?.superAdmin ? accounts.filter((a) => a.user_id !== user.id) : [];

    return (
      <div className={desk.page} data-testid="profile-desktop">
        <InstPageHeader title="Mi perfil" sub="Tu cuenta, tus integraciones y el modo demo" />

        <InstSection title="Tu cuenta">
          <InstKeyValue rows={[
            { k: 'Nombre', v: user?.name ?? 'Sin nombre', action: quiet('Editar', () => setEditingProfile((v) => !v), { ariaLabel: 'Editar nombre' }) },
            { k: 'Ciudad', v: user?.city || '—', action: quiet('Editar', () => setEditingProfile((v) => !v), { ariaLabel: 'Editar ciudad' }) },
            { k: 'Correo', v: <>{user?.email ?? '—'} <span className={desk.muted}>· gestionado por tu proveedor de acceso</span></> },
            { k: 'Rol', v: user?.superAdmin ? 'Superadministrador' : 'Usuario' },
            { k: 'Apariencia', v: (
              <span role="group" aria-label="Modo de color">
                {dotted((['system', 'dark', 'light'] as ThemePreference[]).map((mode) => quiet(
                  mode === 'system' ? 'Auto' : mode === 'dark' ? 'Oscuro' : 'Claro',
                  () => setThemePreference(mode), { pressed: themePreference === mode },
                )))}
              </span>
            ) },
            { k: 'Tu coach', v: (
              <span role="group" aria-label="Elige tu coach">
                {dotted(PERSONA_ORDER.map((pp) => quiet(PERSONAS[pp].name, () => setPersona(pp), { pressed: persona === pp })))}
                <span className={desk.muted}> — {PERSONAS[persona].name}, {PERSONAS[persona].trait}</span>
              </span>
            ) },
          ]} />
          {editingProfile ? (
            <div className={desk.editor}>
              <DynamicForm
                schema={profileSchema}
                initialValues={initialValues}
                submitLabel="Guardar cambios"
                onSuccess={(response) => {
                  const attrs = (response as { data?: { attributes?: { name?: string; city?: string | null } } })
                    ?.data?.attributes;
                  if (user && attrs) {
                    setUser({
                      ...user,
                      ...(attrs.name != null && { name: attrs.name }),
                      ...(attrs.city !== undefined && { city: attrs.city }),
                    });
                  }
                  showSuccess('Perfil actualizado.');
                  setEditingProfile(false);
                }}
                onError={(error) => {
                  console.error('[ProfilePage] submit:error', error);
                  showError('No pude actualizar tu perfil.');
                }}
              />
            </div>
          ) : null}
        </InstSection>

        <InstSection title="Integraciones">
          <InstKeyValue rows={[
            gmailLoading
              ? { k: 'Gmail', v: <span className={desk.muted}>Verificando…</span> }
              : gmailConnected === true
                ? { k: 'Gmail', v: <><span aria-hidden="true" className={desk.dotOk}>●</span> conectado · solo lectura</>,
                    action: quiet(gmailActionLoading ? 'Desconectando…' : 'Desconectar', () => void disconnectGmail(), { disabled: gmailActionLoading, ariaLabel: 'Desconectar Gmail' }) }
                : { k: 'Gmail', v: <><span aria-hidden="true" className={desk.dotOff}>●</span> sin conectar · el agente detecta tus movimientos bancarios cada noche</>,
                    action: quiet(gmailActionLoading ? 'Abriendo…' : 'Conectar', () => void startOAuth(), { disabled: gmailActionLoading, ariaLabel: 'Conectar Gmail' }) },
            ...(gmailConnected === true && !gmailLoading ? [{
              k: 'Correos bancarios',
              v: bankSenders.length === 0
                ? 'detección automática por palabras clave'
                : `${bankSenders.length} ${bankSenders.length === 1 ? 'remitente' : 'remitentes'} · ${bankSenders.slice(0, 2).join(', ')}${bankSenders.length > 2 ? ', …' : ''}`,
              action: quiet(editingSenders ? 'Listo' : 'Agregar', () => setEditingSenders((v) => !v), { ariaLabel: 'Agregar remitentes bancarios' }),
            }] : []),
          ]} />
          {gmailConnected === true && editingSenders ? (
            <div className={desk.editor}>
              <p className={desk.help}>
                {bankSenders.length === 0
                  ? 'El agente detecta correos bancarios automáticamente por keywords. Podés agregar remitentes específicos para mejorar la precisión.'
                  : 'El agente busca correos solo de estos remitentes. Si no encontrás un banco, borralo para volver al modo automático.'}
              </p>
              {bankSenders.length > 0 ? (
                <ul className={desk.senders}>
                  {bankSenders.map((sd) => (
                    <li key={sd}>
                      <span className={desk.mono}>{sd}</span>
                      {quiet('Quitar', () => void updateSenders(bankSenders.filter((x) => x !== sd)), { ariaLabel: `Quitar ${sd}` })}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className={desk.addRow}>
                <input
                  ref={senderInputRef}
                  className={desk.input}
                  type="email"
                  aria-label="Remitente bancario"
                  placeholder="alertas@mibanco.com"
                  value={senderInput}
                  onChange={(e) => setSenderInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const trimmed = senderInput.trim().toLowerCase();
                      if (trimmed && !bankSenders.includes(trimmed)) {
                        void updateSenders([...bankSenders, trimmed]);
                        setSenderInput('');
                      }
                    }
                  }}
                  disabled={gmailActionLoading}
                />
                <InstButton disabled={!senderInput.trim() || gmailActionLoading} onClick={addSender}>Agregar</InstButton>
              </div>
            </div>
          ) : null}
          {gmailError != null ? <InstNote error>{gmailError}</InstNote> : null}
        </InstSection>

        {user?.superAdmin ? (
          <InstSection title="Impersonar usuario">
            {accountsLoading ? <InstNote>Cargando cuentas…</InstNote> : otherAccounts.length === 0 ? <InstNote>No hay otras cuentas.</InstNote> : (
              <InstKeyValue rows={otherAccounts.map((account) => ({
                k: account.name,
                v: <span className={desk.muted}>{account.email}</span>,
                action: quiet(impersonatingId === account.id ? 'Entrando…' : 'Ver como', () => void handleImpersonate(account),
                  { disabled: impersonatingId === account.id, ariaLabel: `Ver como ${account.name}` }),
              }))} />
            )}
          </InstSection>
        ) : null}

        {canSwitchDemo ? (
          <InstSection title="Modo demo">
            <InstKeyValue rows={[{
              k: 'Mostrar con datos de ejemplo',
              v: `${inDemo ? 'Encendido' : 'Apagado'} · tus datos reales no se consultan mientras esté encendido`,
              action: (
                <button type="button" role="switch" aria-checked={inDemo} aria-label="Modo demo" className={desk.quiet}
                  disabled={demoSwitching} onClick={() => void handleDemoToggle()}>
                  {inDemo ? 'Apagar' : 'Encender'}
                </button>
              ),
            }]} />
          </InstSection>
        ) : null}

        <InstSection title="Contexto financiero">
          {contextLoading ? <InstNote>Cargando contexto financiero…</InstNote>
            : contextError ? <InstNote error>{contextError}</InstNote>
              : !financialContext ? <InstNote>Todavía no hay fase, estrategia o notas guardadas para esta cuenta.</InstNote>
                : (
                  <InstKeyValue rows={[
                    { k: 'Fase actual', v: PHASE_LABEL[financialContext.phase ?? ''] ?? financialContext.phase ?? '—' },
                    { k: 'Estrategia de deuda', v: STRATEGY_LABEL[financialContext.strategy ?? ''] ?? financialContext.strategy ?? '—' },
                    ...(financialContext.notes ? [{ k: 'Notas / objetivo', v: financialContext.notes }] : []),
                  ]} />
                )}
        </InstSection>

        <InstSection title="Sesión">
          <InstKeyValue rows={[{ k: 'Cerrar sesión', v: 'En este dispositivo', action: quiet('Cerrar sesión', () => void logout()) }]} />
        </InstSection>

        {toast}
      </div>
    );
  }

  return (
    <IonContent className={styles.pageContent}>
        <section className={styles.grid}>

          {/* ── Left: summary ── */}
          <aside className={styles.summaryCard}>
            <span className={styles.eyebrow}>Perfil</span>
            <h2 className={styles.title}>Tu cuenta</h2>

            <div className={styles.userMeta}>
              <div>
                <span className={styles.metaLabel}>Nombre</span>
                <strong>{user?.name ?? 'Sin nombre'}</strong>
              </div>
              <div>
                <span className={styles.metaLabel}>Ciudad</span>
                <strong>{user?.city || '—'}</strong>
              </div>
              <div>
                <span className={styles.metaLabel}>Correo</span>
                <strong>{user?.email ?? '—'}</strong>
              </div>
              <div>
                <span className={styles.metaLabel}>Rol</span>
                <strong>{user?.superAdmin ? 'Superadministrador' : 'Usuario'}</strong>
              </div>
            </div>

            <div className={styles.preferenceBlock}>
              <div>
                <span className={styles.metaLabel}>Apariencia</span>
                <strong>Modo de color</strong>
              </div>
              <div className={styles.themeSwitch} role="group" aria-label="Modo de color">
                {(['system', 'dark', 'light'] as ThemePreference[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`${styles.themeOption} ${themePreference === mode ? styles.themeOptionActive : ''}`}
                    onClick={() => setThemePreference(mode)}
                    aria-pressed={themePreference === mode}
                  >
                    {mode === 'system' ? 'Auto' : mode === 'dark' ? 'Oscuro' : 'Claro'}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.preferenceBlock}>
              <div>
                <span className={styles.metaLabel}>Tu coach</span>
                <strong>¿Quién te acompaña?</strong>
              </div>
              <div className={styles.personaPicker} role="group" aria-label="Elige tu coach">
                {PERSONA_ORDER.map((p) => {
                  const P = PERSONAS[p];
                  return (
                    <button
                      key={p}
                      type="button"
                      className={`${styles.personaCard} ${persona === p ? styles.personaCardActive : ''}`}
                      style={{ '--persona-color': P.color } as React.CSSProperties}
                      onClick={() => setPersona(p)}
                      aria-pressed={persona === p}
                    >
                      <div className={styles.personaBuddy}>
                        <Buddy persona={p} emotion="calm" size={64} idleBlinkSeed={PERSONA_ORDER.indexOf(p) + 1} />
                      </div>
                      <span className={styles.personaName}>{P.name}</span>
                      <span className={styles.personaTrait}>{P.trait}</span>
                    </button>
                  );
                })}
              </div>
              <p className={styles.personaVoice}>{PERSONAS[persona].voice}</p>
            </div>

            {user?.superAdmin && (
              <div className={styles.preferenceBlock}>
                <div>
                  <span className={styles.metaLabel}>Herramientas</span>
                  <strong>Impersonar usuario</strong>
                </div>
                {accountsLoading && (
                  <span className={styles.controlLabel}>Cargando cuentas...</span>
                )}
                {accounts.filter((a) => a.user_id !== user.id).map((account) => (
                  <div key={account.id} className={styles.impersonateRow}>
                    <div className={styles.impersonateInfo}>
                      <strong>{account.name}</strong>
                      <span>{account.email}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.impersonateBtn}
                      onClick={() => void handleImpersonate(account)}
                      disabled={impersonatingId === account.id}
                    >
                      {impersonatingId === account.id ? 'Entrando...' : 'Ver como'}
                    </button>
                  </div>
                ))}
                {!accountsLoading && accounts.filter((a) => a.user_id !== user.id).length === 0 && (
                  <span className={styles.controlLabel}>No hay otras cuentas.</span>
                )}
              </div>
            )}

            {canSwitchDemo && (
              <div className={styles.preferenceBlock}>
                <div>
                  <span className={styles.metaLabel}>Herramientas</span>
                  <strong>Modo demo</strong>
                </div>
                <label className={styles.demoSwitchRow}>
                  <span className={styles.demoSwitchText}>
                    Muestra Ascent con datos de ejemplo. Tus datos reales no se consultan mientras está activo.
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    className={styles.demoSwitch}
                    checked={inDemo}
                    aria-checked={inDemo}
                    disabled={demoSwitching}
                    onChange={() => void handleDemoToggle()}
                  />
                </label>
              </div>
            )}

            <Button
              label="Cerrar sesión"
              variant="ghost"
              onClick={() => void logout()}
            />

            <span className={styles.eyebrow} style={{ marginTop: '8px' }}>Contexto financiero</span>
            <DataState
              loading={contextLoading}
              error={contextError}
              data={financialContext ? [financialContext] : []}
              emptyTitle="Sin contexto financiero"
              emptyDescription="Todavía no hay fase, estrategia o notas guardadas para esta cuenta."
            >
              {([context]) => (
                <div className={styles.userMeta}>
                  <div>
                    <span className={styles.metaLabel}>Fase actual</span>
                    <strong>{PHASE_LABEL[context.phase ?? ''] ?? context.phase ?? '—'}</strong>
                  </div>
                  <div>
                    <span className={styles.metaLabel}>Estrategia de deuda</span>
                    <strong>{STRATEGY_LABEL[context.strategy ?? ''] ?? context.strategy ?? '—'}</strong>
                  </div>
                  {context.notes ? (
                    <div>
                      <span className={styles.metaLabel}>Notas / objetivo</span>
                      <strong>{context.notes}</strong>
                    </div>
                  ) : null}
                </div>
              )}
            </DataState>
          </aside>

          {/* ── Right: edit form ── */}
          <article className={styles.formCard}>
            <div className={styles.formHeader}>
              <span className={styles.eyebrow}>Editar perfil</span>
              <h2 className={styles.formTitle}>Actualiza tu información</h2>
              <p className={styles.formDescription}>
                El correo se gestiona desde tu proveedor de acceso. El nombre y la ciudad
                se usan como contexto en el asistente financiero.
              </p>
            </div>

            <DynamicForm
              schema={profileSchema}
              initialValues={initialValues}
              submitLabel="Guardar cambios"
              onSuccess={(response) => {
                const attrs = (response as { data?: { attributes?: { name?: string; city?: string | null } } })
                  ?.data?.attributes;
                if (user && attrs) {
                  setUser({
                    ...user,
                    ...(attrs.name != null && { name: attrs.name }),
                    ...(attrs.city !== undefined && { city: attrs.city }),
                  });
                }
                showSuccess('Perfil actualizado.');
              }}
              onError={(error) => {
                console.error('[ProfilePage] submit:error', error);
                showError('No pude actualizar tu perfil.');
              }}
            />

            {/* ── Gmail OAuth ── */}
            <div className={styles.gmailBlock}>
              <div className={styles.gmailBlockHeader}>
                <span className={styles.eyebrow}>Integraciones</span>
                <strong>Gmail</strong>
              </div>

              {gmailLoading ? (
                <span className={styles.controlLabel}>Verificando...</span>
              ) : gmailConnected === true ? (
                <>
                  <div className={styles.gmailStatus}>
                    <span className={styles.gmailDot} />
                    <span className={styles.gmailStatusLabel}>Gmail conectado</span>
                  </div>

                  {/* ── Remitentes bancarios ── */}
                  <div className={styles.gmailSendersSection}>
                    <span className={styles.controlLabel}>
                      Correos bancarios
                    </span>
                    <p className={styles.gmailDescription}>
                      {bankSenders.length === 0
                        ? 'El agente detecta correos bancarios automáticamente por keywords. Podés agregar remitentes específicos para mejorar la precisión.'
                        : 'El agente busca correos solo de estos remitentes. Si no encontrás un banco, borralo para volver al modo automático.'}
                    </p>

                    {/* Chips de remitentes */}
                    {bankSenders.length > 0 && (
                      <div className={styles.senderChips}>
                        {bankSenders.map((s) => (
                          <span key={s} className={styles.senderChip}>
                            {s}
                            <button
                              type="button"
                              className={styles.senderChipRemove}
                              aria-label={`Quitar ${s}`}
                              onClick={() => {
                                const next = bankSenders.filter((x) => x !== s);
                                void updateSenders(next);
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Input para agregar */}
                    <div className={styles.senderInputRow}>
                      <input
                        ref={senderInputRef}
                        className={styles.senderInput}
                        type="email"
                        placeholder="alertas@mibanco.com"
                        value={senderInput}
                        onChange={(e) => setSenderInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const trimmed = senderInput.trim().toLowerCase();
                            if (trimmed && !bankSenders.includes(trimmed)) {
                              void updateSenders([...bankSenders, trimmed]);
                              setSenderInput('');
                            }
                          }
                        }}
                        disabled={gmailActionLoading}
                      />
                      <button
                        type="button"
                        className={styles.senderAddBtn}
                        disabled={!senderInput.trim() || gmailActionLoading}
                        onClick={() => {
                          const trimmed = senderInput.trim().toLowerCase();
                          if (trimmed && !bankSenders.includes(trimmed)) {
                            void updateSenders([...bankSenders, trimmed]);
                            setSenderInput('');
                            senderInputRef.current?.focus();
                          }
                        }}
                      >
                        Agregar
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.gmailDisconnectBtn}
                    onClick={() => void disconnectGmail()}
                    disabled={gmailActionLoading}
                  >
                    {gmailActionLoading ? 'Desconectando...' : 'Desconectar Gmail'}
                  </button>
                </>
              ) : (
                <>
                  <p className={styles.gmailDescription}>
                    Conectá tu Gmail para que el agente detecte automáticamente tus movimientos
                    bancarios cada noche — sin importar con qué banco trabajes.
                  </p>
                  <button
                    type="button"
                    className={styles.gmailConnectBtn}
                    onClick={() => void startOAuth()}
                    disabled={gmailActionLoading}
                  >
                    {gmailActionLoading ? 'Abriendo...' : 'Conectar Gmail'}
                  </button>
                </>
              )}

              {gmailError != null && (
                <span className={styles.gmailError}>{gmailError}</span>
              )}
            </div>

            {toast}
          </article>

        </section>
    </IonContent>
  );
};

export const ProfilePage = () => (
  <AppLayout title="Mi perfil" ownHeader>
    <ProfileContent />
  </AppLayout>
);
