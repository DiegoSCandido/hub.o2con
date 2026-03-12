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
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppCard from "@/components/AppCard";


const apps = [
  { icon: ScrollText, title: "Alvarás", description: "Controle e acompanhamento de alvarás e licenças de funcionamento.", status: "online" as const },
  { icon: ShieldCheck, title: "Certificado Digital", description: "Gestão de certificados digitais, validades e renovações.", status: "online" as const },
  { icon: FileText, title: "CND's", description: "Emissão e monitoramento de Certidões Negativas de Débito.", status: "online" as const },
  { icon: GitBranch, title: "Gestão de Processos", description: "Acompanhamento de processos administrativos e fluxos de trabalho.", status: "online" as const },
  { icon: Building2, title: "Cadastro de Empresas", description: "Registro e manutenção de dados cadastrais de empresas.", status: "online" as const },
  { icon: FileSignature, title: "Procurações", description: "Controle de procurações, vencimentos e outorgantes.", status: "online" as const },
  { icon: AlertTriangle, title: "Situação Fiscal", description: "Consulta e monitoramento da situação fiscal das empresas.", status: "online" as const },
  { icon: FileSearch, title: "Consulta Simples Nacional", description: "Consulta de enquadramento e situação no regime do Simples Nacional.", status: "online" as const },
];

const externalLinks = [
  { title: "Assessórias", url: "#", description: "Plataforma de assessorias contábeis" },
  { title: "Domínio Web", url: "#", description: "Sistema Domínio Thomson Reuters" },
  { title: "Digisac", url: "#", description: "Atendimento multicanal via WhatsApp" },
  { title: "Veri", url: "#", description: "Gestão Fiscal" },
  { title: "GOB", url: "#", description: "Gestão de Obrigações Acessórias" },
  { title: "Sittax", url: "#", description: "Apuração Fiscal Automatizada para o Simples Nacional" },
  { title: "SIEG", url: "#", description: "Soluções Fiscais Estratégicas" },
];

const usefulLinks = [
  { title: "Prefeituras", url: "#", description: "Portais das prefeituras" },
  { title: "Estado (SEF)", url: "#", description: "Secretaria da Fazenda do Estado" },
  { title: "Jucesc", url: "#", description: "Junta Comercial de Santa Catarina" },
  { title: "Consulta CNPJ", url: "#", description: "Consulta cadastral de CNPJ" },
  { title: "Emissor Nacional", url: "#", description: "Emissor Nacional de NF-e" },
  { title: "Portal NFe", url: "#", description: "Portal Nacional da NF-e" },
  { title: "E-CAC", url: "#", description: "Centro Virtual de Atendimento da Receita Federal" },
];

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(0);

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

      <main className="ml-[260px] min-h-screen transition-all duration-150">
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
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground">
              <Bell className="h-5 w-5" strokeWidth={1.5} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
            </button>
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
                  {usefulLinks.map((link) => (
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
