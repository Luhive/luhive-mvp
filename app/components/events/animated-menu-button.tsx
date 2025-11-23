import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface AnimatedMenuButtonProps {
  className?: string;
  isOpen?: boolean;
}

export function AnimatedMenuButton({ className, isOpen = false }: AnimatedMenuButtonProps) {
  return (
    <Button
      size="icon"
      variant="ghost"
      className={cn(
        "relative h-9 w-9 rounded-full",
        "bg-background/80 backdrop-blur-md border border-border/50",
        "shadow-lg hover:shadow-xl",
        "transition-all duration-300",
        "hover:bg-background/90 hover:scale-110",
        "group",
        className
      )}
    >
      {/* Animated Dots */}
      <div className="relative w-4 h-4 flex items-center justify-center">
        {/* Three dots that morph */}
        <div className="absolute inset-0 flex items-center justify-center gap-1">
          <span
            className={cn(
              "absolute w-1.5 h-1.5 rounded-full bg-foreground/70",
              "transition-all duration-300 ease-in-out",
              isOpen
                ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0"
                : "left-0 top-1/2 -translate-y-1/2 group-hover:scale-125"
            )}
            style={{
              transitionDelay: isOpen ? '0ms' : '0ms',
            }}
          />
          <span
            className={cn(
              "absolute w-1.5 h-1.5 rounded-full bg-foreground/70",
              "transition-all duration-300 ease-in-out",
              isOpen
                ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0"
                : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-125"
            )}
            style={{
              transitionDelay: isOpen ? '50ms' : '0ms',
            }}
          />
          <span
            className={cn(
              "absolute w-1.5 h-1.5 rounded-full bg-foreground/70",
              "transition-all duration-300 ease-in-out",
              isOpen
                ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0"
                : "right-0 top-1/2 -translate-y-1/2 group-hover:scale-125"
            )}
            style={{
              transitionDelay: isOpen ? '100ms' : '0ms',
            }}
          />
        </div>

        {/* Pulse effect */}
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-primary/20 animate-pulse",
            "opacity-0 group-hover:opacity-100",
            "transition-opacity duration-300"
          )}
        />

        {/* Menu icon when open */}
        {isOpen && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-3 h-3">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-foreground animate-in fade-in duration-200" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-0.5 rounded-full bg-foreground animate-in fade-in duration-200 delay-75" />
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-foreground animate-in fade-in duration-200 delay-150" />
            </div>
          </div>
        )}
      </div>
    </Button>
  );
}

