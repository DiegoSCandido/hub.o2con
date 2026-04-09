/**
 * Utilitário SSO - Single Sign-On entre Hub e aplicativos internos
 *
 * INTEGRAÇÃO NOS APPS ADICIONAIS:
 * - **History API (padrão):** ler `sso_token` em `window.location.search`.
 * - **Hash Router:** alguns apps (ex.: Certificados O2con) leem `sso_token` em
 *   `window.location.hash` (ex.: `/#/?sso_token=...`). O hub envia nesse formato
 *   automaticamente para hosts configurados em `HASH_MODE_HOST_SNIPPETS` ou
 *   `VITE_SSO_HASH_MODE_HOSTS` (lista separada por vírgulas).
 *
 *   const params = new URLSearchParams(window.location.search);
 *   // ou, em apps hash: parse da parte após # (ex. react-router HashRouter)
 */

export const SSO_PARAM = "sso_token";

/** Trechos de hostname para colocar o token no fragment `#/?sso_token=` em vez de `?sso_token=`. */
const HASH_MODE_HOST_SNIPPETS = ["certificados-o2con"];

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

  if (shouldPutSsoTokenInHash(url.hostname)) {
    url.search = "";
    url.hash = `/?${SSO_PARAM}=${encodeURIComponent(token)}`;
    return url.toString();
  }

  url.searchParams.set(SSO_PARAM, token);
  return url.toString();
}
