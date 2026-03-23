import { cn } from "@/lib/utils";
import o2conLogo from "@/assets/o2con-logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const Logo = ({ className, size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-10",
    md: "h-12",
    lg: "h-16",
  };

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={o2conLogo}
        alt="O2con Soluções Contábeis"
        className={cn("object-contain", sizeClasses[size])}
      />
    </div>
  );
};

export default Logo;
