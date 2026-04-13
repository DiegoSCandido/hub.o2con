/**
 * Utilitário SSO - Single Sign-On entre Hub e aplicativos internos
 *
 * INTEGRAÇÃO NOS APPS ADICIONAIS:
 * - **History API (padrão):** ler `sso_token` em `window.location.search`.
 * - **Hash Router:** Alvarás, Certificados e outros apps O2con leem `sso_token` em
 *   `window.location.hash` (regex no hash, ex.: `/#/?sso_token=...`). O hub envia
 *   nesse formato para hosts em `HASH_MODE_HOST_SNIPPETS` ou `VITE_SSO_HASH_MODE_HOSTS`.
 *
 *   const params = new URLSearchParams(window.location.search);
 *   // ou, em apps hash: parse da parte após # (ex. react-router HashRouter)
 */

export const SSO_PARAM = "sso_token";

/**
 * Só envia token SSO para hosts considerados confiáveis.
 * Configure via `VITE_SSO_TRUSTED_HOSTS` (lista separada por vírgula; aceita trechos do hostname).
 *
 * Importante: enviar JWT em querystring pode vazar via logs/histórico. Para hosts confiáveis, o padrão
 * é colocar o token no hash (`#/?sso_token=`), que não vai no request HTTP.
 */
const TRUSTED_HOST_SNIPPETS = [
  // Apps internos conhecidos
  "certificados-o2con",
  "o2controle-gestao-alvaras",
  "gestao-alvaras",
  "simples-status-checker",
];

/** Trechos de hostname para colocar o token no fragment `#/?sso_token=` em vez de `?sso_token=`. */
const HASH_MODE_HOST_SNIPPETS = [
  "certificados-o2con",
  "o2controle-gestao-alvaras",
  "gestao-alvaras",
  "simples-status-checker",
];

function isTrustedSsoHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  const fromEnv = (import.meta.env.VITE_SSO_TRUSTED_HOSTS as string | undefined)
    ?.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const rules = [...(fromEnv ?? []), ...TRUSTED_HOST_SNIPPETS];
  return rules.some((snippet) => snippet && h.includes(snippet));
}

function shouldPutSsoTokenInHash(hostname: string): boolean {
  const h = hostname.toLowerCase();
  const fromEnv = (import.meta.env.VITE_SSO_HASH_MODE_HOSTS as string | undefined)
    ?.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const rules = [...(fromEnv ?? []), ...HASH_MODE_HOST_SNIPPETS];
  return rules.some((snippet) => snippet && h.includes(snippet));
}

/**
 * Monta a URL do app com o token SSO para login automático.
 */
export function buildSsoUrl(baseUrl: string, token: string): string {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return baseUrl;
  }

  if (!isTrustedSsoHost(url.hostname)) {
    // Defensive default: never leak the hub JWT to unknown hosts.
    return baseUrl;
  }

  if (shouldPutSsoTokenInHash(url.hostname)) {
    url.search = "";
    url.hash = `/?${SSO_PARAM}=${encodeURIComponent(token)}`;
    return url.toString();
  }

  // Legacy behavior for trusted hosts that still rely on History API.
  url.searchParams.set(SSO_PARAM, token);
  return url.toString();
}
