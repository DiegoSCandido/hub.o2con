export function formatNewsDate(publishedAt?: string): string {
  if (!publishedAt) return "";
  const dt = new Date(publishedAt);
  const ts = dt.getTime();
  if (!Number.isFinite(ts)) return "";

  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `Há ${diffMin} min`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Há ${diffH}h`;
  if (diffH < 48) return "Ontem";

  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `Há ${diffD} dias`;

  try {
    return dt.toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

