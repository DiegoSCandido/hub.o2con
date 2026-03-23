import type { CSSProperties } from "react";
import LoginForm from "@/components/LoginForm";
import Logo from "@/components/Logo";
import loginBg from "@/assets/login-bg.jpg";
import o2conIcon from "@/assets/o2con-icon.png";

const loginThemeVars: CSSProperties & Record<string, string> = {
  "--background": "210 25% 97%",
  "--foreground": "220 30% 15%",
  "--card": "0 0% 100%",
  "--card-foreground": "220 30% 15%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "220 30% 15%",
  "--primary": "207 100% 33%",
  "--primary-foreground": "0 0% 100%",
  "--primary-light": "207 85% 55%",
  "--primary-glow": "207 100% 65%",
  "--secondary": "311 69% 34%",
  "--secondary-foreground": "0 0% 100%",
  "--secondary-light": "311 65% 50%",
  "--secondary-glow": "311 70% 60%",
  "--muted": "210 20% 94%",
  "--muted-foreground": "220 15% 45%",
  "--accent": "311 60% 96%",
  "--accent-foreground": "311 69% 34%",
  "--destructive": "0 75% 55%",
  "--destructive-foreground": "0 0% 100%",
  "--border": "210 25% 90%",
  "--input": "210 25% 92%",
  "--ring": "207 100% 45%",
  "--radius": "0.75rem",
};

const Login = () => {
  return (
    <div className="min-h-screen flex" style={loginThemeVars}>
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-fade-in text-center">
          <div className="mb-8 lg:mb-10 flex justify-center">
            <Logo size="lg" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-2">
              Bem-vindo
            </h1>
            <p className="text-muted-foreground text-lg">
              Faça login para acessar sua conta
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 lg:p-8 shadow-soft">
            <LoginForm />
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            © 2025 O2con Soluções Contábeis. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right Side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={loginBg}
          alt="O2controle"
          className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-secondary/80" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="text-center max-w-md animate-fade-in">
            <div className="w-28 h-28 rounded-3xl bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center mx-auto mb-8 shadow-2xl p-4">
              <img
                src={o2conIcon}
                alt="O2con"
                className="w-full h-full object-contain brightness-0 invert"
              />
            </div>

            <h2 className="text-3xl font-display font-bold mb-4">
              Tudo em um só lugar
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Apps internos e externos, links úteis, ferramentas e muito mais.
              Sua intranet contábil completa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
