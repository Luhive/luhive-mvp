import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  Clock,
  Filter,
  Send,
  Sparkles,
  Trophy,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
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

type SegmentKey = "all" | "hackathon" | "webinar" | "recent";

const SEGMENT_CONFIG: Record<
  SegmentKey,
  { segmentI18nKey: string; filterI18nKey: string; Icon: LucideIcon }
> = {
  all: {
    segmentI18nKey: "segmentAll",
    filterI18nKey: "filterAll",
    Icon: Users,
  },
  hackathon: {
    segmentI18nKey: "segmentHackathon",
    filterI18nKey: "filterHackathon",
    Icon: Trophy,
  },
  webinar: {
    segmentI18nKey: "segmentWebinar",
    filterI18nKey: "filterWebinar",
    Icon: Video,
  },
  recent: {
    segmentI18nKey: "segmentRecent",
    filterI18nKey: "filterRecent",
    Icon: Sparkles,
  },
};

function SegmentIconTile({ segment }: { segment: SegmentKey }) {
  const { Icon } = SEGMENT_CONFIG[segment];

  if (segment === "all") {
    return (
      <div
        aria-hidden
        className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10"
      >
        <Icon className="size-3.5 text-primary/70" />
        <span className="absolute bottom-1 right-1 size-1.5 rounded-full bg-primary/40" />
      </div>
    );
  }

  if (segment === "hackathon") {
    return (
      <div
        aria-hidden
        className="relative size-7 shrink-0 overflow-hidden rounded-lg bg-primary/10 p-1.5"
      >
        <div className="flex h-full flex-col justify-center gap-0.5">
          <div className="h-1 w-full rounded-full bg-primary/50" />
          <div className="h-1 w-3/4 rounded-full bg-primary/35" />
        </div>
        <Trophy className="absolute bottom-0.5 right-0.5 size-2 text-primary/60" />
      </div>
    );
  }

  if (segment === "webinar") {
    return (
      <div
        aria-hidden
        className="relative size-7 shrink-0 overflow-hidden rounded-lg bg-primary/[0.07] p-1.5"
      >
        <div className="mb-1 h-2.5 w-full rounded bg-primary/25" />
        <div className="h-0.5 w-2/3 rounded-full bg-primary/15" />
        <Video className="absolute bottom-0.5 right-0.5 size-2 text-primary/50" />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/[0.08]"
    >
      <Sparkles className="size-3 text-primary/60" />
    </div>
  );
}

const SEGMENTS = [
  { key: "all" as const, count: 248, isActive: false },
  { key: "hackathon" as const, count: 42, isActive: true },
  { key: "webinar" as const, count: 31, isActive: false },
  { key: "recent" as const, count: 18, isActive: false },
] as const;

function SegmentMeta({ segmentKey }: { segmentKey: SegmentKey }) {
  const { t } = useTranslation("landing");
  const prefix = "featuresShowcase.items.reachTheRightPeople.visual";
  const { filterI18nKey } = SEGMENT_CONFIG[segmentKey];
  const segment = SEGMENTS.find((s) => s.key === segmentKey)!;

  return (
    <div className="flex flex-col gap-0.5 lg:flex-row lg:flex-wrap lg:items-center lg:gap-1">
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Filter className="size-3 shrink-0 text-primary" aria-hidden />
        {t(`${prefix}.${filterI18nKey}`)}
      </span>
      <span
        className="hidden text-[10px] text-muted-foreground/50 lg:inline"
        aria-hidden
      >
        ·
      </span>
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
        {t(`${prefix}.memberCount`, { count: segment.count })}
      </span>
    </div>
  );
}

function ActiveSendButton() {
  const { t } = useTranslation("landing");
  const prefix = "featuresShowcase.items.reachTheRightPeople.visual";
  const [isSent, setIsSent] = useState(false);

  function handleClick() {
    if (isSent) return;
    setIsSent(true);
    setTimeout(() => setIsSent(false), 2000);
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`relative inline-flex h-7 shrink-0 items-center overflow-hidden rounded-md px-3 text-xs font-medium transition-colors duration-300 ${
        isSent
          ? "bg-green-500 text-white"
          : "bg-primary text-primary-foreground"
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isSent ? (
          <motion.span
            key="sent"
            className="flex items-center gap-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            <Check className="size-3" aria-hidden />
            {t(`${prefix}.sentButton`)}
          </motion.span>
        ) : (
          <motion.span
            key="send"
            className="flex items-center gap-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            <Send className="size-3" aria-hidden />
            {t(`${prefix}.sendButton`)}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function InactiveSendButton() {
  const { t } = useTranslation("landing");
  const prefix = "featuresShowcase.items.reachTheRightPeople.visual";

  return (
    <button
      type="button"
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-primary/30 bg-transparent px-3 text-xs font-medium text-primary"
      tabIndex={-1}
      aria-hidden
    >
      <Send className="size-3" aria-hidden />
      {t(`${prefix}.sendButton`)}
    </button>
  );
}

export function FeatureVisualReachTheRightPeople() {
  const { t } = useTranslation("landing");
  const prefix = "featuresShowcase.items.reachTheRightPeople.visual";

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
              248
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-primary" />
            {t(`${prefix}.filteredByHistory`)}
          </div>
        </CardHeader>

        <CardContent className="flex-1 px-6">
          <ul className="flex h-full flex-col justify-around">
            {SEGMENTS.map((segment, index) => {
              const { segmentI18nKey } = SEGMENT_CONFIG[segment.key];

              if (segment.isActive) {
                return (
                  <li
                    key={segment.key}
                    className="-mx-3 flex items-center gap-3 rounded-lg bg-primary/5 px-3 py-3 ring-1 ring-inset ring-primary/15"
                  >
                    <SegmentIconTile segment={segment.key} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {t(`${prefix}.${segmentI18nKey}`)}
                      </p>
                      <SegmentMeta segmentKey={segment.key} />
                    </div>
                    <ActiveSendButton />
                  </li>
                );
              }

              return (
                <li
                  key={segment.key}
                  className={`flex items-center gap-3 py-3 ${
                    index < SEGMENTS.length - 1
                      ? "border-b border-border/60"
                      : ""
                  }`}
                >
                  <SegmentIconTile segment={segment.key} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {t(`${prefix}.${segmentI18nKey}`)}
                    </p>
                    <SegmentMeta segmentKey={segment.key} />
                  </div>
                  <InactiveSendButton />
                </li>
              );
            })}
          </ul>
        </CardContent>

        <CardFooter className="px-6 pt-0">
          <div className="flex w-full items-center gap-1.5">
            <Clock className="size-3.5 text-primary" aria-hidden />
            <span className="text-xs text-muted-foreground">
              {t(`${prefix}.lastSent`)}
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
