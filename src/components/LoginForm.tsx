import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, LogIn, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { collectSystemKeysFromUnknown } from "@/lib/user-systems";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function inferUserRole(apiUser: Record<string, unknown>): "admin" | "user" {
  const isAdminBoolean =
    apiUser.isAdmin === true ||
    apiUser.admin === true ||
    apiUser.is_admin === true;
  if (isAdminBoolean) return "admin";

  const directCandidates = [
    apiUser.role,
    apiUser.userRole,
    apiUser.profile,
    apiUser.perfil,
    apiUser.tipo,
    apiUser.type,
  ];

  for (const candidate of directCandidates) {
    const normalized = String(candidate || "")
      .trim()
      .toLowerCase();
    if (normalized === "admin" || normalized === "administrator" || normalized === "adm") {
      return "admin";
    }
  }

  const listCandidates = [apiUser.roles, apiUser.permissions, apiUser.perfis, apiUser.scopes];
  for (const candidate of listCandidates) {
    if (!Array.isArray(candidate)) continue;
    const hasAdmin = candidate.some((entry) => {
      const normalized = String(entry || "")
        .trim()
        .toLowerCase();
      return normalized === "admin" || normalized === "administrator" || normalized === "adm";
    });
    if (hasAdmin) return "admin";
  }

  return "user";
}

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, getToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Troca de senha no primeiro login
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        toast.error(`Muitas tentativas. Tente novamente em ${data.retryAfter || 60} segundos.`);
        return;
      }

      if (!res.ok) {
        // Erro de validação de senha (backend exige: 8+ chars, maiúscula, minúscula, número, especial)
        if (data.errors && Array.isArray(data.errors)) {
          toast.error(data.errors.join(". "));
        } else {
          toast.error(data.message || "Credenciais inválidas.");
        }
        return;
      }

      const token = data.token;
      const apiUser = (data.user || {}) as Record<string, unknown>;

      if (!token || !apiUser) {
        toast.error("Resposta inválida do servidor.");
        return;
      }

      const user = {
        id: String(apiUser.id ?? ""),
        email: String(apiUser.email ?? ""),
        name: String(apiUser.fullName || apiUser.name || apiUser.email || "Usuário"),
        role: inferUserRole(apiUser),
        systems: collectSystemKeysFromUnknown(apiUser.systems),
        systemPermissions:
          apiUser.systemPermissions && typeof apiUser.systemPermissions === "object"
            ? (apiUser.systemPermissions as Record<string, "viewer" | "editor" | "admin">)
            : {},
      };
      login(token, user, { rememberMe });

      if (data.mustChangePassword) {
        setCurrentPassword(password);
        setShowChangePassword(true);
        toast.info("Por segurança, altere sua senha antes de continuar.");
      } else {
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao fazer login.";
      // Erro de rede (backend inacessível)
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        toast.error("Não foi possível conectar ao servidor. Verifique se o backend está rodando e a variável VITE_API_URL no .env");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Informe seu e-mail");
      return;
    }
    setForgotLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        toast.error(`Muitas tentativas. Tente novamente em ${data.retryAfter || 60} segundos.`);
        return;
      }

      if (!res.ok) {
        toast.error(data.message || "Erro ao enviar e-mail.");
        return;
      }

      toast.success(data.message || "Verifique seu e-mail.");
      setForgotOpen(false);
      setForgotEmail("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao processar.";
      toast.error(msg.includes("Failed to fetch") ? "Não foi possível conectar ao servidor." : msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setChangePasswordLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const token = getToken();
      const res = await fetch(`${apiUrl}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          toast.error(data.errors.join(". "));
        } else {
          toast.error(data.message || "Erro ao alterar senha.");
        }
        return;
      }
      toast.success("Senha alterada com sucesso!");
      setShowChangePassword(false);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar senha.");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  if (showChangePassword) {
    return (
      <form onSubmit={handleChangePassword} className="space-y-5">
        <p className="text-sm text-muted-foreground text-center mb-4">
          Por segurança, altere sua senha antes de acessar o sistema.
        </p>
        <div className="space-y-2">
          <Label htmlFor="current-password">Senha atual</Label>
          <Input
            id="current-password"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="h-11"
            disabled={changePasswordLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">Nova senha</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-11 pr-10"
              disabled={changePasswordLoading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            8+ caracteres, maiúscula, minúscula, número e especial
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar nova senha</Label>
          <Input
            id="confirm-password"
            type={showNewPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11"
            disabled={changePasswordLoading}
          />
        </div>
        <Button type="submit" className="w-full h-11" disabled={changePasswordLoading}>
          {changePasswordLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Alterar senha e continuar
            </>
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          E-mail
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 bg-muted/50 border-border focus:bg-background transition-colors"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          Senha
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 bg-muted/50 border-border focus:bg-background transition-colors pr-10"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <Label
            htmlFor="remember"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Lembrar-me
          </Label>
        </div>
        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="text-sm text-primary hover:text-primary-light transition-colors font-medium"
        >
          Esqueceu a senha?
        </button>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Esqueceu a senha?</DialogTitle>
            <DialogDescription>
              Informe seu e-mail cadastrado. Se estiver no sistema, você receberá um link para criar uma nova senha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">E-mail</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="seu@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="h-11"
                disabled={forgotLoading}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotOpen(false)}
                disabled={forgotLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={forgotLoading}>
                {forgotLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar link
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Button type="submit" className="w-full h-11" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            Entrar
          </>
        )}
      </Button>
    </form>
  );
};

export default LoginForm;
