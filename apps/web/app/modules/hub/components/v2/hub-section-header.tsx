import { cn } from "~/shared/lib/utils/cn";

type HubSectionHeaderProps = {
  id: string;
  title: string;
  /** The design sizes the communities and events "See all" differently. */
  toggleSize?: "md" | "lg";
  isExpanded?: boolean;
  onToggle?: () => void;
  controlsId?: string;
};

const labelLayer =
  "col-start-1 row-start-1 transition-[opacity,filter,transform] duration-200 ease-out-strong";

export function HubSectionHeader({
  id,
  title,
  toggleSize = "md",
  isExpanded = false,
  onToggle,
  controlsId,
}: HubSectionHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between gap-4 leading-none">
      <h2 id={id} className="text-[24px] font-semibold leading-none text-[#111] sm:text-[32px]">
        {title}
      </h2>
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={controlsId}
          className={cn(
            "-mx-2 -my-1 rounded-full px-2 py-1 font-medium leading-none text-[#888]",
            "transition-[color,transform] duration-150 ease-out-strong hover:text-[#111] active:scale-[0.96]",
            "outline-none focus-visible:ring-2 focus-visible:ring-[#111]/15",
            toggleSize === "lg" ? "text-[16px] sm:text-[20px]" : "text-[16px]",
          )}
        >
          <span className="grid justify-items-end">
            <span
              aria-hidden={isExpanded}
              className={cn(labelLayer, isExpanded && "translate-y-[-3px] opacity-0 blur-[2px]")}
            >
              See all
            </span>
            <span
              aria-hidden={!isExpanded}
              className={cn(labelLayer, !isExpanded && "translate-y-[3px] opacity-0 blur-[2px]")}
            >
              Show less
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
