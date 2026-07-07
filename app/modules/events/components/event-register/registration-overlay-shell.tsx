import { useNavigate } from "react-router";
import { XIcon } from "lucide-react";
import { cn } from "~/shared/lib/utils/cn";

const OVERLAY_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

interface RegistrationOverlayShellProps {
  title: string;
  onCloseHref: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function RegistrationOverlayShell({
  title,
  onCloseHref,
  children,
  footer,
  className,
}: RegistrationOverlayShellProps) {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(onCloseHref, { replace: true });
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 overflow-y-auto bg-background",
        className,
      )}
    >
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close registration"
        style={{ animationTimingFunction: OVERLAY_EASE }}
        className={cn(
          "fixed top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground",
          "animate-in fade-in duration-300 motion-reduce:animate-none",
          "transition-[background-color,color,transform] active:scale-[0.97]",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "md:top-6 md:right-6",
        )}
      >
        <XIcon className="h-5 w-5" />
      </button>

      <div
        style={{ animationTimingFunction: OVERLAY_EASE }}
        className={cn(
          "mx-auto flex min-h-full w-full max-w-[420px] flex-col px-6 py-16 md:py-20",
          "animate-in fade-in slide-in-from-bottom-1.5 duration-300 motion-reduce:animate-none",
        )}
      >
        <h1 className="mb-8 text-2xl font-bold tracking-tight">{title}</h1>

        <div className="flex-1 min-w-0">{children}</div>

        {footer && (
          <div className="shrink-0 pt-6 pb-[max(0px,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
