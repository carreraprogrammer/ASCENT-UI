import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import type { AuthUser, PermissionSlug } from '../types/authorization.types';
import type { AuthResponse, JwtPayload, LoginCredentials } from '../types/auth.types';
import { authService, demoService } from '../services/authService';
import { resetThemePreference } from './themeStore';
export interface ImpersonatedAccount { id:number; name:string; email:string; }
/** ASC-4: la sesión real del superadministrador, guardada aparte mientras ve la cuenta demo con el interruptor. */
export interface DemoStash { accessToken:string; refreshToken:string; user:AuthUser; }
interface AuthState { user:AuthUser|null; accessToken:string|null; isAuthenticated:boolean; isLoading:boolean; impersonatedAccount:ImpersonatedAccount|null; _originalToken:string|null; _originalUser:AuthUser|null; login:(credentials:LoginCredentials)=>Promise<void>; hydrateAuth:(response:AuthResponse|RawAuthEnvelope)=>void; logout:()=>Promise<void>; clearSession:()=>void; refreshToken:()=>Promise<void>; setUser:(user:AuthUser)=>void; hasPermission:(slug:PermissionSlug)=>boolean; isSuperAdmin:()=>boolean; startImpersonation:(token:string,account:ImpersonatedAccount)=>void; stopImpersonation:()=>void; isImpersonating:()=>boolean; demoStash:DemoStash|null; startDemo:()=>Promise<void>; enterDemoMode:()=>Promise<void>; exitDemoMode:()=>void; }
const RFT_KEY='rft';
const AT_KEY='at';
const USER_KEY='auth_user';
export const DEMO_STASH_KEY='demo_stash';
// Security note: refresh tokens stored in localStorage are accessible to any injected script (XSS).
// Prefer httpOnly cookies if the backend supports them.
type RawAuthEnvelope = {
  data?: {
    id?: number | string;
    attributes?: {
      name?: string;
      email?: string;
      avatar_url?: string | null;
      auth_provider?: string | null;
      permissions?: string[];
      super_admin?: boolean;
      demo?: boolean;
    };
  };
  meta?: {
    access_token?: string;
    refresh_token?: string;
  };
};

const getStoredAccessToken=():string|null=>localStorage.getItem(AT_KEY);
const getStoredUser=():AuthUser|null=>{ const raw=localStorage.getItem(USER_KEY); if(!raw) return null; try { return JSON.parse(raw) as AuthUser; } catch { localStorage.removeItem(USER_KEY); return null; } };
const normalizeAuthResponse=(response:AuthResponse|RawAuthEnvelope):AuthResponse=>'tokens' in response ? response : { data:{ id:response.data?.id, attributes:{ name:response.data?.attributes?.name ?? '', email:response.data?.attributes?.email, avatar_url:response.data?.attributes?.avatar_url ?? null, auth_provider:response.data?.attributes?.auth_provider ?? null, permissions:response.data?.attributes?.permissions ?? [], super_admin:response.data?.attributes?.super_admin ?? false, demo:response.data?.attributes?.demo ?? false } }, meta:response.meta, tokens:{ accessToken:response.meta?.access_token ?? '', refreshToken:response.meta?.refresh_token ?? '' } };
const mapUser=(response:AuthResponse,currentUser:AuthUser|null):AuthUser=>{ const accessToken=response.tokens.accessToken; const payload=jwtDecode<JwtPayload>(accessToken); return { id:payload.user_id,email:response.data.attributes.email ?? currentUser?.email ?? payload.email,name:response.data.attributes.name || currentUser?.name || payload.email,avatarUrl:response.data.attributes.avatar_url ?? currentUser?.avatarUrl ?? null,authProvider:response.data.attributes.auth_provider ?? currentUser?.authProvider ?? null,superAdmin:payload.super_admin,permissions:payload.permissions,demo:Boolean(response.data.attributes.demo ?? payload.demo)};};
const applyAuthResponse=(incoming:AuthResponse|RawAuthEnvelope,set:(partial:Partial<AuthState>)=>void,currentUser:AuthUser|null)=>{ const response=normalizeAuthResponse(incoming); const user=mapUser(response,currentUser); localStorage.setItem(RFT_KEY,response.tokens.refreshToken); localStorage.setItem(AT_KEY,response.tokens.accessToken); localStorage.setItem(USER_KEY,JSON.stringify(user)); set({accessToken:response.tokens.accessToken,isAuthenticated:true,user,isLoading:false}); };
const clearStoredSession=()=>{ localStorage.removeItem(RFT_KEY); localStorage.removeItem(AT_KEY); localStorage.removeItem(USER_KEY); localStorage.removeItem(DEMO_STASH_KEY); };
const getStoredDemoStash=():DemoStash|null=>{ const raw=localStorage.getItem(DEMO_STASH_KEY); if(!raw) return null; try { const stash=JSON.parse(raw) as DemoStash; return stash?.accessToken && stash.user ? stash : null; } catch { localStorage.removeItem(DEMO_STASH_KEY); return null; } };
const initialAccessToken=getStoredAccessToken();
const initialUser=getStoredUser();
export const useAuthStore=create<AuthState>((set,get)=>({ user:initialUser,accessToken:initialAccessToken,isAuthenticated:Boolean(initialAccessToken&&initialUser),isLoading:false, async login(credentials){ set({isLoading:true}); try { const response=await authService.login(credentials); applyAuthResponse(response,set,get().user); } catch(error){ set({isLoading:false}); throw error;} }, hydrateAuth(response){ applyAuthResponse(response,set,get().user); }, clearSession(){ clearStoredSession(); set({user:null,accessToken:null,isAuthenticated:false,isLoading:false,demoStash:null}); }, async logout(){ get().clearSession(); resetThemePreference(); }, async refreshToken(){ const refreshToken=localStorage.getItem(RFT_KEY); const userId=get().user?.id; if(!refreshToken || !userId) throw new Error('Missing refresh session'); const response=await authService.refresh(refreshToken,userId); applyAuthResponse(response,set,get().user); }, setUser(user){ localStorage.setItem(USER_KEY,JSON.stringify(user)); set({user}); }, hasPermission(slug){ const {user}=get(); if(!user) return false; if(user.superAdmin) return true; return user.permissions.includes(slug); }, isSuperAdmin(){ return get().user?.superAdmin ?? false; }, impersonatedAccount:null, _originalToken:null, _originalUser:null, startImpersonation(token,account){ const {accessToken:originalToken,user:originalUser}=get(); const payload=jwtDecode<JwtPayload>(token); const newUser:AuthUser={id:payload.user_id,email:account.email,name:account.name,superAdmin:payload.super_admin,permissions:payload.permissions,avatarUrl:null,authProvider:null,city:null}; set({accessToken:token,user:newUser,impersonatedAccount:account,_originalToken:originalToken,_originalUser:originalUser}); }, stopImpersonation(){ const {_originalToken,_originalUser}=get(); set({accessToken:_originalToken,user:_originalUser,impersonatedAccount:null,_originalToken:null,_originalUser:null}); }, isImpersonating(){ return get().impersonatedAccount!==null; },
  // ASC-4 fase 6: modo demo. Siempre con un token que emite la API para la cuenta demo, nunca un flag del cliente.
  demoStash:getStoredDemoStash(),
  // "Ver demo" en el login: una sesión normal (como un login), en la cuenta demo de solo lectura.
  async startDemo(){ set({isLoading:true}); try { const response=await demoService.session(); applyAuthResponse(response,set,null); } catch(error){ set({isLoading:false}); throw error; } },
  // Interruptor de Mi perfil (superadministrador): pide la sesión demo con el token real, guarda la real aparte y
  // entra a la demo. Si la API falla no cambia nada.
  async enterDemoMode(){ const {accessToken,user,demoStash}=get(); if(demoStash) return; if(!accessToken||!user) throw new Error('Missing session'); const response=await demoService.switchToDemo(); const stash:DemoStash={accessToken,refreshToken:localStorage.getItem(RFT_KEY) ?? '',user}; localStorage.setItem(DEMO_STASH_KEY,JSON.stringify(stash)); set({demoStash:stash}); applyAuthResponse(response,set,null); },
  // "Volver a mi cuenta": restaura la sesión real guardada, sin cerrar sesión.
  exitDemoMode(){ const stash=get().demoStash; if(!stash) return; localStorage.setItem(AT_KEY,stash.accessToken); localStorage.setItem(RFT_KEY,stash.refreshToken); localStorage.setItem(USER_KEY,JSON.stringify(stash.user)); localStorage.removeItem(DEMO_STASH_KEY); set({accessToken:stash.accessToken,user:stash.user,isAuthenticated:true,isLoading:false,demoStash:null}); } }));
