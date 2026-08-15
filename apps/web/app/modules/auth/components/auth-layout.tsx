import { Link } from "react-router";
import LuhiveLogo from "~/assets/images/LuhiveLogo.svg";

interface AuthLayoutProps {
  children: React.ReactNode;
  logoSize?: "sm" | "md" | "lg";
}

export function AuthLayout({
  children,
  logoSize = "md",
}: AuthLayoutProps) {
  const logoClass =
    logoSize === "sm"
      ? "h-8 w-8"
      : logoSize === "lg"
        ? "h-12 w-12"
        : "h-10 w-10";

  return (
    <div className="mt-16">
      <div className="flex flex-col items-center text-center">
        <Link
          to="/"
          className="mb-6 rounded-3xl bg-primary/10 p-4 transition-all hover:shadow-sm active:scale-95"
        >
          <img
            src={LuhiveLogo}
            alt="Luhive logo"
            className={logoClass}
          />
        </Link>
        {children}
      </div>
    </div>
  );
}
