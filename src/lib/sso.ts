/**
 * Utilitário SSO - Single Sign-On entre Hub e aplicativos internos
 *
 * O token é passado via hash (#) para não ser enviado ao servidor em requisições.
 *
 * INTEGRAÇÃO NOS APPS ADICIONAIS:
 * Ao carregar, o app deve verificar se há token no hash:
 *
 *   const hash = window.location.hash;
 *   const match = hash.match(/sso_token=([^&]+)/);
 *   if (match) {
 *     const token = decodeURIComponent(match[1]);
 *     // Validar token no backend e fazer login automático
 *     // localStorage.setItem('o2con_hub_token', token);
 *     // Limpar hash: history.replaceState(null, '', location.pathname);
 *   }
 *
 * O backend deve validar o mesmo token JWT usado no Hub.
 */

export const SSO_HASH_PARAM = "sso_token";

/**
 * Monta a URL do app com o token SSO no hash para login automático
 */
export function buildSsoUrl(baseUrl: string, token: string): string {
  const url = new URL(baseUrl);
  url.hash = `${SSO_HASH_PARAM}=${encodeURIComponent(token)}`;
  return url.toString();
}
