"use client";

import { useTranslation } from "react-i18next";
import { ChevronDown, Globe } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "~/shared/components/ui/dropdown-menu";
import { cn } from "~/shared/lib/utils/cn";
import "~/shared/lib/i18n";

const LANGUAGES = [
  { code: "en", label: "English", shortLabel: "En" },
  { code: "az", label: "Azərbaycan", shortLabel: "Az" },
] as const;

export function FooterLanguageMenu({
  className,
  compactLabels = false,
  comfortableTouch = false,
}: {
  className?: string;
  compactLabels?: boolean;
  comfortableTouch?: boolean;
}) {
  const { i18n } = useTranslation();
  const current = i18n.language?.split("-")[0] || "en";
  const lang = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];
  const currentLabel = compactLabels ? lang.shortLabel : lang.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-full border border-black bg-white px-3.5 py-2 text-xs font-normal text-black outline-none transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 data-[state=open]:bg-neutral-50",
          comfortableTouch &&
            "h-10 w-fit touch-manipulation justify-center px-3 py-0 text-sm gap-2.5 active:bg-neutral-100",
          className,
        )}
        aria-label="Choose language"
      >
        <Globe
          className={cn(
            "shrink-0 stroke-[1.5]",
            comfortableTouch ? "size-5" : "size-4",
          )}
          aria-hidden
        />
        <span>{currentLabel}</span>
        <ChevronDown
          className={cn(
            "shrink-0 stroke-[1.5] opacity-80",
            comfortableTouch ? "size-5" : "size-4",
          )}
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-[9.5rem]">
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(code) => {
            void i18n.changeLanguage(code);
          }}
        >
          {LANGUAGES.map((lang) => (
            <DropdownMenuRadioItem key={lang.code} value={lang.code}>
              {lang.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
