/**
 * Extrai identificadores de sistemas de respostas da API / claims de JWT.
 * Evita perder módulos (ex.: Simples) quando o backend manda `{ key, level }[]` em vez de `string[]`.
 */
export function collectSystemKeysFromUnknown(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => {
      if (typeof item === "string" && item.trim()) return [item.trim()];
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const k = o.key ?? o.system ?? o.systemKey ?? o.code ?? o.name;
        if (typeof k === "string" && k.trim()) return [k.trim()];
      }
      return [];
    });
  }
  if (typeof raw === "object") {
    return Object.keys(raw as Record<string, unknown>).filter((k) => k.trim().length > 0);
  }
  return [];
}

/** Possíveis chaves onde o JWT guarda a lista de sistemas. */
const JWT_SYSTEMS_KEYS = [
  "systems",
  "allowedSystems",
  "modules",
  "apps",
  "systemIds",
  "accessibleSystems",
] as const;

export function collectSystemsFromJwtClaims(claims: Record<string, unknown> | null): string[] {
  if (!claims) return [];
  const out: string[] = [];
  for (const key of JWT_SYSTEMS_KEYS) {
    out.push(...collectSystemKeysFromUnknown(claims[key]));
  }
  const nestedUser = claims.user;
  if (nestedUser && typeof nestedUser === "object" && !Array.isArray(nestedUser)) {
    out.push(...collectSystemKeysFromUnknown((nestedUser as Record<string, unknown>).systems));
  }
  return out;
}
