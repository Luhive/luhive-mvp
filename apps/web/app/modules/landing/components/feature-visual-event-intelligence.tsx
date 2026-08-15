import { ChevronDown, Pointer, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "~/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/shared/components/ui/card";

type FormatKey = "hackathon" | "webinar" | "workshop" | "mixer";

const FORMAT_CONFIG: Record<FormatKey, { i18nKey: string }> = {
  hackathon: { i18nKey: "formatHackathon" },
  webinar: { i18nKey: "formatWebinar" },
  workshop: { i18nKey: "formatWorkshop" },
  mixer: { i18nKey: "formatMixer" },
};

function FormatTile({ format }: { format: FormatKey }) {
  if (format === "hackathon") {
    return (
      <div
        aria-hidden
        className="relative size-7 shrink-0 overflow-hidden rounded-lg bg-primary/10 p-1.5"
      >
        <div className="flex h-full flex-col justify-center gap-0.5">
          <div className="h-1 w-full rounded-full bg-primary/50" />
          <div className="h-1 w-3/4 rounded-full bg-primary/35" />
          <div className="h-1 w-1/2 rounded-full bg-primary/20" />
        </div>
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary/60" />
      </div>
    );
  }

  if (format === "webinar") {
    return (
      <div
        aria-hidden
        className="relative size-7 shrink-0 overflow-hidden rounded-lg bg-primary/[0.07] p-1.5"
      >
        <div className="mb-1 h-2.5 w-full rounded bg-primary/25" />
        <div className="mb-0.5 h-0.5 w-full rounded-full bg-primary/20" />
        <div className="h-0.5 w-2/3 rounded-full bg-primary/15" />
        <span className="absolute bottom-1 right-1 size-1.5 rounded-full bg-primary/40" />
      </div>
    );
  }

  if (format === "workshop") {
    return (
      <div
        aria-hidden
        className="relative size-7 shrink-0 overflow-hidden rounded-lg bg-primary/[0.09] p-1.5"
      >
        <div className="flex h-full flex-col justify-center gap-0.5">
          <div className="flex items-center gap-0.5">
            <span className="size-1 shrink-0 rounded-sm bg-primary/50" />
            <div className="h-0.5 flex-1 rounded-full bg-primary/20" />
          </div>
          <div className="flex items-center gap-0.5">
            <span className="size-1 shrink-0 rounded-sm bg-primary/35" />
            <div className="h-0.5 w-2/3 rounded-full bg-primary/20" />
          </div>
          <div className="flex items-center gap-0.5">
            <span className="size-1 shrink-0 rounded-sm bg-primary/20" />
            <div className="h-0.5 w-4/5 rounded-full bg-primary/15" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="relative size-7 shrink-0 overflow-hidden rounded-lg bg-primary/[0.06]"
    >
      <span className="absolute left-1.5 top-1.5 size-2 rounded-full bg-primary/40" />
      <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary/25" />
      <span className="absolute bottom-1.5 left-1/2 size-2 -translate-x-1/2 rounded-full bg-primary/50" />
    </div>
  );
}

const EVENTS = [
  {
    name: "AI Hackathon Finals",
    date: "May 10",
    format: "hackathon" as FormatKey,
    registered: 46,
    attended: 41,
    isActive: true,
  },
  {
    name: "Startup Webinar",
    date: "Apr 28",
    format: "webinar" as FormatKey,
    registered: 60,
    attended: 43,
    isActive: false,
  },
  {
    name: "Dev Workshop",
    date: "Apr 14",
    format: "workshop" as FormatKey,
    registered: 30,
    attended: 22,
    isActive: false,
  },
  {
    name: "Community Mixer",
    date: "Apr 3",
    format: "mixer" as FormatKey,
    registered: 52,
    attended: 38,
    isActive: false,
  },
] as const;

const ACTIVE_EVENT = EVENTS[0];

export function FeatureVisualEventIntelligence() {
  const { t } = useTranslation("landing");
  const prefix = "featuresShowcase.items.eventIntelligence.visual";
  const [isInsightOpen, setIsInsightOpen] = useState(false);

  return (
    <div className="relative h-full w-full">
      <Card className="flex h-full w-full flex-col gap-5 rounded-[14px] border-border/60 bg-card py-6 shadow-xl shadow-black/10">
        <CardHeader className="px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              {t(`${prefix}.title`)}
            </CardTitle>
            <Badge
              variant="secondary"
              className="bg-primary/10 text-sm text-primary"
            >
              24
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-primary" />
            {t(`${prefix}.autoTracked`)}
          </div>
        </CardHeader>

        <CardContent className="flex-1 px-6">
          <ul className="flex h-full flex-col justify-around">
            {EVENTS.map((event, index) => {
              const rate = Math.round(
                (event.attended / event.registered) * 100,
              );
              const { i18nKey } = FORMAT_CONFIG[event.format];
              return (
                <li
                  key={event.name}
                  onClick={
                    event.isActive
                      ? () => setIsInsightOpen((p) => !p)
                      : undefined
                  }
                  className={
                    event.isActive
                      ? "-mx-3 cursor-pointer rounded-lg bg-primary/5 px-3 py-3 ring-1 ring-inset ring-primary/15 lg:cursor-default"
                      : `py-3 ${index < EVENTS.length - 1 ? "border-b border-border/60" : ""}`
                  }
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <FormatTile format={event.format} />
                      <span className="truncate text-sm font-semibold text-foreground">
                        {event.name}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="text-sm font-semibold text-primary">
                        {rate}%
                      </span>
                      {event.isActive && (
                        <ChevronDown
                          aria-hidden
                          className={`size-3.5 shrink-0 text-primary transition-transform duration-300 lg:hidden ${
                            isInsightOpen ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {event.date}
                      <span
                        className="mx-1 text-muted-foreground/50"
                        aria-hidden
                      >
                        ·
                      </span>
                      {t(`${prefix}.${i18nKey}`)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {event.attended}/{event.registered}
                    </span>
                  </div>

                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10"
                    role="progressbar"
                    aria-valuenow={rate}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span
                      className="block h-full rounded-full bg-primary/80"
                      style={{ width: `${rate}%` }}
                    />
                  </div>

                  {event.isActive && (
                    <>
                      {!isInsightOpen && (
                        <div className="mt-2 flex items-center gap-1 lg:hidden">
                          <Pointer
                            className="size-3 animate-pulse text-primary"
                            aria-hidden
                          />
                          <span className="text-[10px] font-medium text-primary">
                            {t("featuresShowcase.clickDetails")}
                          </span>
                        </div>
                      )}

                      <div
                        className={`grid transition-[grid-template-rows] duration-300 ease-in-out lg:hidden ${
                          isInsightOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="mt-3 rounded-xl border border-primary/20 bg-card/80 p-3 shadow-sm shadow-black/8 backdrop-blur-sm">
                            <div className="mb-3 flex items-center gap-2">
                              <FormatTile format={ACTIVE_EVENT.format} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-foreground">
                                  {ACTIVE_EVENT.name}
                                </p>
                                <p className="text-[9px] uppercase tracking-wide text-primary">
                                  {t(`${prefix}.eventInsight`)}
                                </p>
                              </div>
                            </div>

                            <div className="mb-3 grid grid-cols-3 gap-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-lg font-semibold text-foreground">
                                  89%
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {t(`${prefix}.showRate`)}
                                </span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-lg font-semibold text-foreground">
                                  14
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {t(`${prefix}.returning`)}
                                </span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-lg font-semibold text-foreground">
                                  27
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {t(`${prefix}.newAttendees`)}
                                </span>
                              </div>
                            </div>

                            <div className="mb-3 rounded-lg bg-primary/5 p-2.5 ring-1 ring-inset ring-primary/15">
                              <div className="mb-1 flex items-center gap-1">
                                <Sparkles
                                  className="size-3 shrink-0 text-primary"
                                  aria-hidden
                                />
                                <span className="text-[9px] font-semibold uppercase tracking-wide text-primary">
                                  {t(`${prefix}.aiSuggestionLabel`)}
                                </span>
                              </div>
                              <p className="text-[10px] leading-[1.5] text-foreground">
                                {t(`${prefix}.aiSuggestion`)}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 border-t border-primary/10 pt-2.5">
                              <TrendingUp
                                className="size-3 shrink-0 text-primary"
                                aria-hidden
                              />
                              <span className="text-[10px] font-medium text-primary">
                                {t(`${prefix}.monthlyTrend`)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>

        <CardFooter className="px-6 pt-0">
          <div className="flex w-full items-center gap-1.5">
            <TrendingUp className="size-3.5 text-primary" aria-hidden />
            <span className="text-xs text-muted-foreground">
              {t(`${prefix}.avgShowRate`)}
            </span>
          </div>
        </CardFooter>
      </Card>

      <Card className="absolute right-3 top-3 hidden w-[12rem] gap-2 overflow-visible rotate-[3deg] border-primary/20 bg-card/60 py-3 shadow-md shadow-black/10 backdrop-blur-sm backdrop-saturate-50 lg:block md:right-4 md:top-4">
        <span
          aria-hidden
          className="absolute -left-[7px] top-24 size-3 rotate-45 border-b border-l border-primary/20 bg-card/60 backdrop-blur-sm backdrop-saturate-50"
        />

        <CardHeader className="px-3">
          <div className="flex items-center gap-2">
            <FormatTile format={ACTIVE_EVENT.format} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {ACTIVE_EVENT.name}
              </p>
              <p className="text-[9px] uppercase tracking-wide text-primary">
                {t(`${prefix}.eventInsight`)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-2 px-3 pb-1">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold text-foreground">
                89%
              </span>
              <span className="text-[10px] text-muted-foreground">
                {t(`${prefix}.showRate`)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold text-foreground">14</span>
              <span className="text-[10px] text-muted-foreground">
                {t(`${prefix}.returning`)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold text-foreground">27</span>
              <span className="text-[10px] text-muted-foreground">
                {t(`${prefix}.newAttendees`)}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-primary/5 p-2 ring-1 ring-inset ring-primary/15">
            <div className="mb-1 flex items-center gap-1">
              <Sparkles className="size-3 shrink-0 text-primary" aria-hidden />
              <span className="text-[9px] font-semibold uppercase tracking-wide text-primary">
                {t(`${prefix}.aiSuggestionLabel`)}
              </span>
            </div>
            <p className="text-[10px] leading-[1.5] text-foreground">
              {t(`${prefix}.aiSuggestion`)}
            </p>
          </div>
        </CardContent>

        <CardFooter className="px-3 pt-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-3 shrink-0 text-primary" aria-hidden />
            <span className="text-[10px] font-medium text-primary">
              {t(`${prefix}.monthlyTrend`)}
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
