import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  sidebarWidth: number;
  /** Margem do conteúdo principal: 0 no mobile, largura da sidebar no lg+ */
  effectiveMainOffset: number;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
  isDesktop: boolean;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 72;

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (isDesktop) setMobileMenuOpen(false);
  }, [isDesktop]);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  const effectiveMainOffset = isDesktop ? sidebarWidth : 0;

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        sidebarWidth,
        effectiveMainOffset,
        mobileMenuOpen,
        setMobileMenuOpen,
        isDesktop,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH };
