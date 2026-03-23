import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ShieldCheck,
  ScrollText,
  GitBranch,
  Building2,
  FileSignature,
  AlertTriangle,
  FileSearch,
  ExternalLink,
  Search,
  Bell,
  Mail,
  MessageCircle,
  Slack,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppCard from "@/components/AppCard";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import loginBg from "@/assets/login-bg.jpg";

const apps = [
  { icon: ScrollText, title: "Alvarás", description: "Controle e acompanhamento de alvarás e licenças de funcionamento.", status: "online" as const, url: "https://o2controle-gestao-alvaras.vercel.app/", sso: true },
  { icon: ShieldCheck, title: "Certificado Digital", description: "Gestão de certificados digitais, validades e renovações.", status: "online" as const },
  { icon: FileText, title: "CND's", description: "Emissão e monitoramento de Certidões Negativas de Débito.", status: "online" as const },
  { icon: GitBranch, title: "Gestão de Processos", description: "Acompanhamento de processos administrativos e fluxos de trabalho.", status: "online" as const },
  { icon: Building2, title: "Cadastro de Empresas", description: "Registro e manutenção de dados cadastrais de empresas.", status: "online" as const },
  { icon: FileSignature, title: "Procurações", description: "Controle de procurações, vencimentos e outorgantes.", status: "online" as const },
  { icon: AlertTriangle, title: "Situação Fiscal", description: "Consulta e monitoramento da situação fiscal das empresas.", status: "online" as const },
  { icon: FileSearch, title: "Consulta Simples Nacional", description: "Consulta de enquadramento e situação no regime do Simples Nacional.", status: "online" as const, url: "https://simples-status-checker.vercel.app/", sso: true },
];

const externalLinks = [
  { title: "Assessórias", url: "https://app.acessorias.com/sysmain.php", description: "Plataforma de assessorias contábeis" },
  { title: "Domínio Web", url: "https://www.dominioweb.com.br/", description: "Sistema Domínio Thomson Reuters" },
  { title: "Digisac", url: "https://o2con.digisac.co/", description: "Atendimento multicanal via WhatsApp" },
  { title: "Slack", url: import.meta.env.VITE_SLACK_URL || "https://app.slack.com", description: "Comunicação e colaboração em equipe" },
  { title: "Veri", url: "#", description: "Gestão Fiscal" },
  { title: "GOB", url: "https://app.gob.com.br/login", description: "Gestão de Obrigações Acessórias" },
  { title: "Sittax", url: "https://app.sittax.com.br/login", description: "Apuração Fiscal Automatizada para o Simples Nacional" },
  { title: "SIEG", url: "https://auth.sieg.com/", description: "Soluções Fiscais Estratégicas" },
];

const prefeituras = [
  { name: "Imbituba", url: "https://imbituba.atende.net/" },
  { name: "Garopaba", url: "https://garopaba.atende.net/cidadao" },
  { name: "Paulo Lopes", url: "https://paulolopes.sc.gov.br/" },
  { name: "Biguaçu", url: "https://bigua.atende.net/cidadao/" },
  { name: "Tubarão", url: "https://tubarao.sc.gov.br/" },
  { name: "Criciúma", url: "https://www.criciuma.sc.gov.br/" },
];

const DIGISAC_URL = "https://o2con.digisac.co/";
const SLACK_URL = import.meta.env.VITE_SLACK_URL || "https://app.slack.com";

type NotificationSource = "digisac" | "slack";

interface Notification {
  id: string;
  userId: string;
  source: NotificationSource;
  title: string;
  message: string;
  timestamp: string;
  url: string;
  read?: boolean;
}

// Notificações mock - filtradas pelo usuário logado (substituir por API GET /notifications?userId=...)
const mockNotifications: Notification[] = [
  {
    id: "1",
    userId: "1",
    source: "digisac",
    title: "Nova mensagem no WhatsApp",
    message: "Cliente solicitou certidão negativa",
    timestamp: "Agora",
    url: DIGISAC_URL,
    read: false,
  },
  {
    id: "2",
    userId: "1",
    source: "slack",
    title: "Mensagem em #geral",
    message: "João: Reunião às 14h confirmada",
    timestamp: "5 min",
    url: SLACK_URL,
    read: false,
  },
  {
    id: "3",
    userId: "1",
    source: "digisac",
    title: "Conversa encerrada",
    message: "Atendimento #1234 finalizado",
    timestamp: "1h",
    url: DIGISAC_URL,
    read: true,
  },
];

const usefulLinks = [
  { title: "Prefeituras", modal: true, description: "Portais das prefeituras" },
  { title: "Estado (SEF)", url: "https://www.sef.sc.gov.br/", description: "Secretaria da Fazenda do Estado" },
  { title: "Jucesc", url: "https://www.jucesc.sc.gov.br/", description: "Junta Comercial de Santa Catarina" },
  { title: "Consulta CNPJ", url: "https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp", description: "Consulta cadastral de CNPJ" },
  { title: "Emissor Nacional", url: "https://www.nfse.gov.br/EmissorNacional/Login?ReturnUrl=%2fEmissorNacional", description: "Emissor Nacional de NF-e" },
  { title: "Portal NFe", url: "https://www.nfe.fazenda.gov.br/portal/principal.aspx", description: "Portal Nacional da NF-e" },
  { title: "E-CAC", url: "https://cav.receita.fazenda.gov.br/autenticacao/login", description: "Centro Virtual de Atendimento da Receita Federal" },
];

function DashboardContent() {
  const { user } = useAuth();
  const { sidebarWidth } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(0);
  const [prefeiturasOpen, setPrefeiturasOpen] = useState(false);
  const [notifications] = useState<Notification[]>(mockNotifications);

  const userNotifications = user
    ? notifications.filter((n) => n.userId === user.id)
    : [];
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && visibleCount < apps.length) {
      const timer = setTimeout(() => setVisibleCount((c) => c + 1), 100);
      return () => clearTimeout(timer);
    }
  }, [loading, visibleCount]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main
        className="relative min-h-screen transition-all duration-150"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        {/* Background image - fixed, não rola com o conteúdo */}
        <div
          className="fixed top-0 right-0 bottom-0 z-0 bg-cover bg-center bg-no-repeat opacity-[.4] dark:opacity-[0.06]"
          style={{
            left: `${sidebarWidth}px`,
            backgroundImage: `url(${loginBg})`,
            backgroundAttachment: "fixed",
          }}
          aria-hidden
        />
        <div
          className="fixed top-0 right-0 bottom-0 z-0 bg-background/70 dark:bg-background/80"
          style={{ left: `${sidebarWidth}px` }}
          aria-hidden
        />

        <div className="relative z-10">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-8">
          <div>
            <p className="text-sm font-semibold text-foreground">Bem-vindo</p>
            <p className="text-xs text-muted-foreground">Administrador</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Buscar..."
                className="h-9 w-64 rounded-lg border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors duration-150"
              />
            </div>
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
              title="Gmail"
            >
              <Mail className="h-5 w-5" strokeWidth={1.5} />
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground">
                  <Bell className="h-5 w-5" strokeWidth={1.5} />
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userNotifications.length === 0 ? (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    Nenhuma notificação
                  </div>
                ) : (
                  userNotifications.map((notif) => (
                    <DropdownMenuItem key={notif.id} asChild>
                      <a
                        href={notif.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex cursor-pointer flex-col gap-0.5 px-3 py-2.5 ${!notif.read ? "bg-accent/50" : ""}`}
                      >
                        <div className="flex items-start gap-2">
                          {notif.source === "digisac" ? (
                            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={1.5} />
                          ) : (
                            <Slack className="mt-0.5 h-4 w-4 shrink-0 text-[#4A154B]" strokeWidth={1.5} />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{notif.title}</p>
                            <p className="truncate text-xs text-muted-foreground">{notif.message}</p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">{notif.timestamp}</p>
                          </div>
                          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                      </a>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-display text-xs font-semibold text-primary-foreground">
              AD
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-8 py-8">
          <AnimatePresence>
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="flex h-[60vh] items-center justify-center"
              >
                <p className="font-display text-lg text-muted-foreground animate-pulse">
                  Organizando seu espaço...
                </p>
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.15 } }}>
                {/* Sistemas */}
                <div className="mb-6">
                  <h2 className="font-display text-xl font-bold text-foreground">Sistemas</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {apps.length} sistemas disponíveis
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {apps.map((app, i) => (
                    <motion.div
                      key={app.title}
                      initial={{ opacity: 0 }}
                      animate={i < visibleCount ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.05 }}
                    >
                      <AppCard {...app} />
                    </motion.div>
                  ))}
                </div>

                {/* Links externos */}
                <div className="mt-12 mb-6">
                  <h2 className="font-display text-xl font-bold text-foreground">Plataformas Externas</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Acesso rápido a ferramentas de parceiros
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {externalLinks.map((link) => (
                    <a
                      key={link.title}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-lg border border-border bg-card p-6 transition-colors duration-150 hover:border-primary"
                    >
                      <div>
                        <h3 className="font-display text-base font-semibold text-card-foreground">{link.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
                      </div>
                      <ExternalLink className="h-5 w-5 shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-primary" strokeWidth={1.5} />
                    </a>
                  ))}
                </div>

                {/* Links Úteis */}
                <div className="mt-12 mb-6">
                  <h2 className="font-display text-xl font-bold text-foreground">Links Úteis</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Acesso rápido a portais e serviços governamentais
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {usefulLinks.map((link) =>
                    "modal" in link && link.modal ? (
                      <button
                        key={link.title}
                        type="button"
                        onClick={() => setPrefeiturasOpen(true)}
                        className="group flex w-full items-center justify-between rounded-lg border border-border bg-card p-6 text-left transition-colors duration-150 hover:border-primary"
                      >
                        <div>
                          <h3 className="font-display text-base font-semibold text-card-foreground">{link.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
                        </div>
                        <ExternalLink className="h-5 w-5 shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-primary" strokeWidth={1.5} />
                      </button>
                    ) : (
                      <a
                        key={link.title}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between rounded-lg border border-border bg-card p-6 transition-colors duration-150 hover:border-primary"
                      >
                        <div>
                          <h3 className="font-display text-base font-semibold text-card-foreground">{link.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
                        </div>
                        <ExternalLink className="h-5 w-5 shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-primary" strokeWidth={1.5} />
                      </a>
                    )
                  )}
                </div>

                <Dialog open={prefeiturasOpen} onOpenChange={setPrefeiturasOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Prefeituras</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2 py-2">
                      {prefeituras.map((pref) => (
                        <a
                          key={pref.name}
                          href={pref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:border-primary hover:bg-accent/50"
                        >
                          <span className="font-medium">{pref.name}</span>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                        </a>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </main>
    </div>
  );
}

export default function Index() {
  return (
    <SidebarProvider>
      <DashboardContent />
    </SidebarProvider>
  );
}
