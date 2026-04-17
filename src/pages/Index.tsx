import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  KeyRound,
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
  Menu,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppCard from "@/components/AppCard";
import { ExternalPlatformCard } from "@/components/ExternalPlatformCard";
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
import { isHubAlwaysVisibleSystem } from "@/lib/hub-always-visible-systems";

type SystemKey =
  | "alvaras"
  | "certificados"
  | "cnds"
  | "processos"
  | "cadastro_empresas"
  | "procuracoes"
  | "fiscal"
  | "simples_nacional";

function normalizeSystemKey(value: string): SystemKey | null {
  const key = value.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  const alias: Record<string, SystemKey> = {
    alvaras: "alvaras",
    certificados: "certificados",
    cnds: "cnds",
    cnd: "cnds",
    processos: "processos",
    gestao_de_processos: "processos",
    cadastro_empresas: "cadastro_empresas",
    cadastro_de_empresas: "cadastro_empresas",
    procuracoes: "procuracoes",
    fiscal: "fiscal",
    situacao_fiscal: "fiscal",
    simples_nacional: "simples_nacional",
    consulta_simples_nacional: "simples_nacional",
    simples: "simples_nacional",
    consulta_simples: "simples_nacional",
  };
  return alias[key] || null;
}

type ExternalPlatformDef = {
  title: string;
  url: string;
  description: string;
  logoSrc?: string;
  fallbackIcon?: LucideIcon;
};

const apps = [
  { icon: ScrollText, title: "Alvarás", systemKey: "alvaras" as SystemKey, description: "Controle e acompanhamento de alvarás e licenças de funcionamento.", status: "online" as const, url: "https://o2controle-gestao-alvaras.vercel.app/", sso: true },
  { icon: KeyRound, title: "Certificado Digital", systemKey: "certificados" as SystemKey, description: "Gestão de certificados digitais, validades e renovações.", status: "online" as const, url: "https://certificados-o2con.vercel.app/", sso: true },
  { icon: FileText, title: "CND's", systemKey: "cnds" as SystemKey, description: "Emissão e monitoramento de Certidões Negativas de Débito.", status: "offline" as const },
  { icon: GitBranch, title: "Gestão de Processos", systemKey: "processos" as SystemKey, description: "Acompanhamento de processos administrativos e fluxos de trabalho.", status: "offline" as const },
  { icon: Building2, title: "Cadastro de Empresas", systemKey: "cadastro_empresas" as SystemKey, description: "Registro e manutenção de dados cadastrais de empresas.", status: "offline" as const },
  { icon: FileSignature, title: "Procurações", systemKey: "procuracoes" as SystemKey, description: "Controle de procurações, vencimentos e outorgantes.", status: "offline" as const },
  { icon: AlertTriangle, title: "Situação Fiscal", systemKey: "fiscal" as SystemKey, description: "Consulta e monitoramento da situação fiscal das empresas.", status: "offline" as const },
  { icon: FileSearch, title: "Consulta Simples Nacional", systemKey: "simples_nacional" as SystemKey, description: "Consulta de enquadramento e situação no regime do Simples Nacional.", status: "online" as const, url: "https://simples-status-checker.vercel.app/", sso: true },
];

const externalLinks: ExternalPlatformDef[] = [
  { title: "Acessorias", url: "https://app.acessorias.com/sysmain.php", description: "Plataforma de assessorias contábeis", logoSrc: "/external-logos/acessorias.png" },
  { title: "Digisac", url: "https://o2con.digisac.co/", description: "Atendimento multicanal via WhatsApp", logoSrc: "/external-logos/digisac.png" },
  { title: "Domínio Web", url: "https://www.dominioweb.com.br/", description: "Sistema Domínio Thomson Reuters", logoSrc: "/external-logos/dominioweb.png" },
  { title: "Slack", url: import.meta.env.VITE_SLACK_URL || "https://app.slack.com", description: "Comunicação e colaboração em equipe", logoSrc: "/external-logos/slack.png" },
  { title: "ITCNET", url: "https://itcnet.com.br/", description: "Legislação tributária, consultoria eletrônica e conteúdos para clientes", logoSrc: "/external-logos/itcnet.png" },
  { title: "E-Auditoria", url: "https://conta.e-auditoria.com.br/home", description: "Portal da plataforma E-Auditoria", logoSrc: "/external-logos/e-auditoria.png" },
  { title: "Veri", url: "#", description: "Gestão Fiscal", fallbackIcon: BarChart3 },
  { title: "GOB", url: "https://app.gob.com.br/login", description: "Gestão de Obrigações Acessórias", logoSrc: "/external-logos/gob.ico" },
  { title: "Sittax", url: "https://app.sittax.com.br/login", description: "Apuração Fiscal Automatizada para o Simples Nacional", logoSrc: "/external-logos/sittax.png" },
  { title: "SIEG", url: "https://auth.sieg.com/", description: "Soluções Fiscais Estratégicas", logoSrc: "/external-logos/sieg.png" },
  {
    title: "PROCESSO.PRO",
    url: "https://app.processo.pro/auth/login",
    description: "Gestão de processos",
    logoSrc: "/external-logos/processo-pro.ico",
  },
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
  const { effectiveMainOffset, setMobileMenuOpen } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(0);
  const [prefeiturasOpen, setPrefeiturasOpen] = useState(false);
  const [notifications] = useState<Notification[]>(mockNotifications);

  const userNotifications = user
    ? notifications.filter((n) => n.userId === user.id)
    : [];
  const unreadCount = userNotifications.filter((n) => !n.read).length;
  const allowedSystems = new Set(
    (user?.systems || [])
      .map((s) => normalizeSystemKey(String(s)))
      .filter((s): s is SystemKey => s !== null)
  );
  const visibleApps = apps.filter(
    (app) => allowedSystems.has(app.systemKey) || isHubAlwaysVisibleSystem(app.systemKey)
  );

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && visibleCount < visibleApps.length) {
      const timer = setTimeout(() => setVisibleCount((c) => c + 1), 100);
      return () => clearTimeout(timer);
    }
  }, [loading, visibleCount, visibleApps.length]);

  return (
    <div className="min-h-screen min-w-0 bg-background">
      <Sidebar />

      <main
        className="relative min-h-screen min-w-0 transition-all duration-150"
        style={{
          marginLeft: `${effectiveMainOffset}px`,
          /* Evita 100% + margem da sidebar > largura da viewport (cortava o conteúdo no desktop) */
          width: `calc(100% - ${effectiveMainOffset}px)`,
        }}
      >
        {/* Background image - fixed, não rola com o conteúdo */}
        <div
          className="fixed top-0 right-0 bottom-0 z-0 bg-cover bg-center bg-no-repeat opacity-[.2] dark:opacity-[0.06]"
          style={{
            left: `${effectiveMainOffset}px`,
            backgroundImage: `url(${loginBg})`,
            backgroundAttachment: "fixed",
          }}
          aria-hidden
        />
        <div
          className="fixed top-0 right-0 bottom-0 z-0 bg-background/70 dark:bg-background/80"
          style={{ left: `${effectiveMainOffset}px` }}
          aria-hidden
        />

        <div className="relative z-10">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 min-w-0 items-center justify-between gap-2 border-b border-border bg-card px-3 sm:px-4 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">Bem-vindo</p>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">Administrador</p>
            </div>
          </div>
          <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 md:gap-4">
            <div className="relative hidden min-w-0 sm:block md:max-w-[12rem] lg:max-w-none lg:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="search"
                placeholder="Buscar..."
                className="h-9 w-full min-w-0 rounded-lg border border-input bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors duration-150 md:pr-4"
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
                    <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full brand-gradient px-1 text-[10px] font-semibold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[min(100vw-2rem,20rem)] sm:w-80">
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full brand-gradient font-display text-xs font-semibold text-white shadow-glow-primary">
              AD
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
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
                    {visibleApps.length} sistemas disponíveis
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleApps.map((app, i) => {
                    const { systemKey, ...appCardProps } = app;
                    return (
                    <motion.div
                      key={app.title}
                      initial={{ opacity: 0 }}
                      animate={i < visibleCount ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.05 }}
                    >
                      <AppCard {...appCardProps} />
                    </motion.div>
                    );
                  })}
                </div>
                {visibleApps.length === 0 && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Nenhum sistema liberado para seu usuário.
                  </p>
                )}

                {/* Links externos */}
                <div className="mt-12 mb-6">
                  <h2 className="font-display text-xl font-bold text-foreground">Plataformas Externas</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Acesso rápido a ferramentas de parceiros
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {externalLinks.map((link) => (
                    <ExternalPlatformCard
                      key={link.title}
                      title={link.title}
                      description={link.description}
                      href={link.url}
                      logoSrc={link.logoSrc}
                      fallbackIcon={link.fallbackIcon}
                    />
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
