import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Trash2, Pencil } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { formatNewsDate } from "@/lib/news-date";

type NewsCategory = "novidade" | "aviso" | "manutencao" | "atualizacao";

type AdminNewsItem = {
  id: string;
  category: NewsCategory;
  title: string;
  summary: string;
  content?: string;
  imageSrc?: string;
  imageAlt?: string;
  publishedAt?: string;
  isUrgent?: boolean;
  isNew: boolean;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type AdminListResponse = {
  page: number;
  limit: number;
  total: number;
  pageCount: number;
  items: AdminNewsItem[];
};

type UpsertPayload = {
  category: NewsCategory;
  title: string;
  summary: string;
  content?: string;
  imageSrc?: string;
  imageAlt?: string;
  publishedAt?: string;
  isUrgent: boolean;
  isNew: boolean;
  isPublished: boolean;
};

const EMPTY_FORM: UpsertPayload = {
  category: "novidade",
  title: "",
  summary: "",
  content: "",
  imageSrc: "",
  imageAlt: "",
  publishedAt: "",
  isUrgent: false,
  isNew: true,
  isPublished: true,
};

function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoFromDatetimeLocal(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return undefined;
  return d.toISOString();
}

function AdminNewsContent() {
  const { user, getToken } = useAuth();
  const { effectiveMainOffset, setMobileMenuOpen } = useSidebar();
  const isAdmin = user?.role === "admin";
  const token = getToken();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdminNewsItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminNewsItem | null>(null);
  const [form, setForm] = useState<UpsertPayload>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch<AdminListResponse>(`/admin/news?page=${page}&limit=20`, token);
      setItems(res.items || []);
      setPageCount(res.pageCount || 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar notícias");
    } finally {
      setLoading(false);
    }
  }, [page, token]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item: AdminNewsItem) => {
    setEditing(item);
    const normalizedPublishedAt = (() => {
      if (!item.publishedAt) return "";
      const d = new Date(item.publishedAt);
      if (!Number.isFinite(d.getTime())) return "";
      return d.toISOString();
    })();
    setForm({
      category: item.category,
      title: item.title,
      summary: item.summary,
      content: item.content || "",
      imageSrc: item.imageSrc || "",
      imageAlt: item.imageAlt || "",
      publishedAt: normalizedPublishedAt,
      isUrgent: Boolean(item.isUrgent),
      isNew: item.isNew,
      isPublished: item.isPublished,
    });
    setModalOpen(true);
  };

  const canSubmit = useMemo(() => {
    if (!form.title.trim()) return false;
    if (!form.summary.trim()) return false;
    return true;
  }, [form.summary, form.title]);

  const handleSubmit = async () => {
    if (!token) return;
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload: UpsertPayload = {
        ...form,
        title: form.title.trim(),
        summary: form.summary.trim(),
        content: form.content?.trim() ? form.content.trim() : undefined,
        imageSrc: form.imageSrc?.trim() ? form.imageSrc.trim() : undefined,
        imageAlt: form.imageAlt?.trim() ? form.imageAlt.trim() : undefined,
        publishedAt: form.publishedAt?.trim() ? form.publishedAt.trim() : undefined,
      };

      if (editing) {
        await apiFetch(`/admin/news/${encodeURIComponent(editing.id)}`, token, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Notícia atualizada");
      } else {
        await apiFetch("/admin/news", token, { method: "POST", body: JSON.stringify(payload) });
        toast.success("Notícia criada");
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar notícia");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: AdminNewsItem) => {
    if (!token) return;
    if (!window.confirm(`Excluir "${item.title}"?`)) return;
    try {
      await apiFetch(`/admin/news/${encodeURIComponent(item.id)}`, token, { method: "DELETE" });
      toast.success("Notícia excluída");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  };

  return (
    <div className="min-h-screen min-w-0 bg-background">
      <Sidebar />
      <main
        className="relative min-h-screen min-w-0 transition-all duration-150"
        style={{
          marginLeft: `${effectiveMainOffset}px`,
          width: `calc(100% - ${effectiveMainOffset}px)`,
        }}
      >
        <header className="sticky top-0 z-40 flex h-16 min-w-0 items-center justify-between gap-2 border-b border-border bg-card px-3 sm:px-4 lg:px-8">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold sm:text-base">Administração de notícias</h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              Criar, editar e publicar avisos para todos os usuários
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setMobileMenuOpen(true)} className="lg:hidden">
              Menu
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nova notícia
            </Button>
          </div>
        </header>

        <div className="p-3 sm:p-4 lg:p-8">
          <div className="rounded-lg border border-border bg-card">
            <div className="grid grid-cols-12 gap-2 border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <div className="col-span-6">Título</div>
              <div className="col-span-2">Categoria</div>
              <div className="col-span-2">Data</div>
              <div className="col-span-1 text-center">Urg.</div>
              <div className="col-span-1 text-center">Pub.</div>
              <div className="col-span-1 text-right">Ações</div>
            </div>

            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Nenhuma notícia cadastrada.</div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 items-center gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0"
                >
                  <div className="col-span-6 min-w-0">
                    <div className="truncate font-medium">{item.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{item.summary}</div>
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground">{item.category}</div>
                  <div className="col-span-2 text-xs text-muted-foreground">
                    {formatNewsDate(item.publishedAt)}
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={item.isUrgent ? "text-amber-600" : "text-muted-foreground"}>
                      {item.isUrgent ? "Sim" : "Não"}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={item.isPublished ? "text-emerald-600" : "text-muted-foreground"}>
                      {item.isPublished ? "Sim" : "Não"}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} aria-label="Excluir">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {pageCount > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-start gap-2">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  onClick={() => setPage(p)}
                  className={p === page ? "brand-gradient text-white shadow-glow-primary" : ""}
                >
                  {p}
                </Button>
              ))}
            </div>
          )}
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="w-[min(100vw-2rem,56rem)] max-w-none">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar notícia" : "Nova notícia"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 grid gap-2">
                <Label>Título</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex.: Instabilidade no Domínio Web"
                />
              </div>

              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as NewsCategory }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novidade">Novidade</SelectItem>
                    <SelectItem value="atualizacao">Atualização</SelectItem>
                    <SelectItem value="aviso">Aviso</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Publicar em</Label>
                <Input
                  type="datetime-local"
                  value={toDatetimeLocalValue(form.publishedAt)}
                  onChange={(e) => setForm((f) => ({ ...f, publishedAt: toIsoFromDatetimeLocal(e.target.value) || "" }))}
                />
                <p className="text-xs text-muted-foreground">Se vazio, o backend usa “agora”.</p>
              </div>

              <div className="sm:col-span-2 grid gap-2">
                <Label>Resumo</Label>
                <Textarea
                  value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  placeholder="Texto curto que aparece na listagem"
                />
              </div>

              <div className="sm:col-span-2 grid gap-2">
                <Label>Conteúdo completo</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  className="min-h-[180px]"
                  placeholder="Texto completo (pode usar quebras de linha)"
                />
              </div>

              <div className="grid gap-2">
                <Label>Imagem (URL)</Label>
                <Input
                  value={form.imageSrc}
                  onChange={(e) => setForm((f) => ({ ...f, imageSrc: e.target.value }))}
                  placeholder="https://... ou /caminho-no-public"
                />
              </div>
              <div className="grid gap-2">
                <Label>Alt da imagem</Label>
                <Input
                  value={form.imageAlt}
                  onChange={(e) => setForm((f) => ({ ...f, imageAlt: e.target.value }))}
                  placeholder="Descrição para acessibilidade"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                <div>
                  <div className="text-sm font-medium">Urgente</div>
                  <div className="text-xs text-muted-foreground">Aparece no banner laranja da home</div>
                </div>
                <Checkbox
                  checked={form.isUrgent}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isUrgent: v === true }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                <div>
                  <div className="text-sm font-medium">Marcar como NOVO</div>
                  <div className="text-xs text-muted-foreground">Usuário verá “NOVO” até abrir</div>
                </div>
                <Switch checked={form.isNew} onCheckedChange={(v) => setForm((f) => ({ ...f, isNew: v }))} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                <div>
                  <div className="text-sm font-medium">Publicado</div>
                  <div className="text-xs text-muted-foreground">Visível para todos os usuários</div>
                </div>
                <Switch checked={form.isPublished} onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default function AdminNewsPage() {
  return (
    <SidebarProvider>
      <AdminNewsContent />
    </SidebarProvider>
  );
}

