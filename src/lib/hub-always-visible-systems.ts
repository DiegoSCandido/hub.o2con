/**
 * Chaves de sistema exibidas no hub para qualquer usuário autenticado,
 * mesmo sem registro em `user.systems` no backend (ex.: app externo público).
 * Para incluir outro módulo, adicione a mesma chave usada em `Sidebar` / `Index` (`systemKey`).
 */
const KEYS = new Set<string>(["simples_nacional"]);

export function isHubAlwaysVisibleSystem(systemKey: string | undefined): boolean {
  if (!systemKey) return false;
  return KEYS.has(systemKey);
}
