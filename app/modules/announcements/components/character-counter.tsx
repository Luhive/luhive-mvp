import { cn } from "~/shared/lib/utils/cn";

type CharacterCounterProps = {
  current: number;
  max: number;
};

export function CharacterCounter({ current, max }: CharacterCounterProps) {
  const remaining = max - current;
  const isWarning = remaining <= 100;
  const isOver = remaining < 0;

  return (
    <span
      className={cn(
        "text-xs tracking-wide tabular-nums",
        isOver ? "text-destructive font-medium" : isWarning ? "text-orange-500" : "text-muted-foreground"
      )}
    >
      {(current)}/{(max)}
    </span>
  );
}
