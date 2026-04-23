import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import type { NewsItem } from "@/components/news/NewsCard";

type NewsListResponse = {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
  items: Array<NewsItem & { unread?: boolean; publishedAt?: string; isNew?: boolean }>;
};

type NewsLatestResponse = {
  items: Array<NewsItem & { unread?: boolean; publishedAt?: string; isNew?: boolean }>;
};

type NewsUrgentResponse = {
  item: (NewsItem & { unread?: boolean; publishedAt?: string; isNew?: boolean; isUrgent?: boolean }) | null;
};

type UnreadCountResponse = { unreadCount: number };

export function useNewsUnreadCount() {
  const { getToken } = useAuth();
  const token = getToken();
  return useQuery({
    queryKey: ["news", "unreadCount"],
    queryFn: () => apiFetch<UnreadCountResponse>("/news/unread-count", token),
    enabled: Boolean(token),
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
}

export function useNewsLatest(limit = 4) {
  const { getToken } = useAuth();
  const token = getToken();
  return useQuery({
    queryKey: ["news", "latest", limit],
    queryFn: () => apiFetch<NewsLatestResponse>(`/news/latest?limit=${limit}`, token),
    enabled: Boolean(token),
    staleTime: 15_000,
  });
}

export function useNewsUrgent() {
  const { getToken } = useAuth();
  const token = getToken();
  return useQuery({
    queryKey: ["news", "urgent"],
    queryFn: () => apiFetch<NewsUrgentResponse>("/news/urgent", token),
    enabled: Boolean(token),
    staleTime: 15_000,
  });
}

export function useNewsPage(page: number, limit: number) {
  const { getToken } = useAuth();
  const token = getToken();
  return useQuery({
    queryKey: ["news", "page", page, limit],
    queryFn: () => apiFetch<NewsListResponse>(`/news?page=${page}&limit=${limit}`, token),
    enabled: Boolean(token),
    keepPreviousData: true,
    staleTime: 15_000,
  });
}

export function useMarkNewsRead() {
  const { getToken } = useAuth();
  const token = getToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiFetch<null>(`/news/${encodeURIComponent(id)}/read`, token, { method: "POST" }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["news", "unreadCount"] }),
        qc.invalidateQueries({ queryKey: ["news", "latest"] }),
        qc.invalidateQueries({ queryKey: ["news", "urgent"] }),
        qc.invalidateQueries({ queryKey: ["news", "page"] }),
      ]);
    },
  });
}

export function isItemUnread(item: NewsItem & { unread?: boolean }): boolean {
  return item.unread === true;
}

