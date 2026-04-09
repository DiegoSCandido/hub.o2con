/**
 * Utilitário SSO - Single Sign-On entre Hub e aplicativos internos
 *
 * O token é passado via query string para facilitar integração entre apps.
 *
 * INTEGRAÇÃO NOS APPS ADICIONAIS:
 * Ao carregar, o app deve verificar se há token na URL:
 *
 *   const params = new URLSearchParams(window.location.search);
 *   const token = params.get("sso_token");
 *   if (token) {
 *     // Validar token no backend e fazer login automático
 *     // localStorage.setItem('o2con_hub_token', token);
 *     // Limpar URL: history.replaceState(null, '', location.pathname);
 *   }
 *
 * O backend deve validar o mesmo token JWT usado no Hub.
 */

export const SSO_PARAM = "sso_token";

/**
 * Monta a URL do app com o token SSO para login automático
 */
export function buildSsoUrl(baseUrl: string, token: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set(SSO_PARAM, token);
  return url.toString();
}
