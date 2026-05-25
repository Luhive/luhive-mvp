import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Megaphone,
  Pointer,
  Sparkles,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/shared/components/ui/avatar";
import { Badge } from "~/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/shared/components/ui/dialog";

type FeedKey = "event" | "announcement" | "member" | "coOrg";

type FeedActor = {
  name: string;
  initials: string;
  avatarSrc: string;
};

const FEED_CONFIG: Record<
  FeedKey,
  { activityI18nKey: string; Icon: LucideIcon }
> = {
  event: { activityI18nKey: "activityEvent", Icon: CalendarDays },
  announcement: { activityI18nKey: "activityAnnouncement", Icon: Megaphone },
  member: { activityI18nKey: "activityMember", Icon: UserPlus },
  coOrg: { activityI18nKey: "activityCoOrg", Icon: UserCheck },
};

const ACTIVE_CO_ORG: FeedActor = {
  name: "Jordan T.",
  initials: "JT",
  avatarSrc: "/landing/features/feature-avatar-3.svg",
};

const FEED = [
  {
    key: "event" as const,
    label: "AI Hackathon Finals",
    date: "May 10",
    actor: {
      name: "Alex M.",
      initials: "AM",
      avatarSrc: "/landing/features/feature-avatar-1.svg",
    },
    metaCount: 41,
    isActive: false,
  },
  {
    key: "announcement" as const,
    label: "Demo Day announcement",
    date: "May 8",
    actor: {
      name: "Sam K.",
      initials: "SK",
      avatarSrc: "/landing/features/feature-avatar-2.svg",
    },
    metaCount: 248,
    isActive: false,
  },
  {
    key: "member" as const,
    label: "Alex M. joined",
    date: "May 5",
    actor: {
      name: "Alex M.",
      initials: "AM",
      avatarSrc: "/landing/features/feature-avatar-1.svg",
    },
    metaCount: 248,
    isActive: false,
  },
  {
    key: "coOrg" as const,
    label: "Jordan T. added",
    date: "Today",
    actor: ACTIVE_CO_ORG,
    metaCount: 0,
    isActive: true,
  },
] as const;

type FeedItem = (typeof FEED)[number];

const CHECKLIST_ITEMS = [
  { labelKey: "checkHistory", metaKey: "checkHistoryMeta" },
  { labelKey: "checkMembers", metaKey: "checkMembersMeta" },
  { labelKey: "checkAnnouncements", metaKey: "checkAnnouncementsMeta" },
] as const;

function TimelineNode({ feedKey }: { feedKey: FeedKey }) {
  const { Icon } = FEED_CONFIG[feedKey];

  return (
    <span
      aria-hidden
      className="absolute -left-[11px] top-0.5 z-10 flex size-6 items-center justify-center rounded-md bg-card ring-[3px] ring-card"
    >
      <span className="flex size-full items-center justify-center rounded-[5px] bg-primary/10">
        <Icon className="size-3 text-primary" />
      </span>
    </span>
  );
}

function EntryMetaBadge({
  feedKey,
  metaCount,
}: {
  feedKey: FeedKey;
  metaCount: number;
}) {
  const { t } = useTranslation("landing");
  const prefix = "featuresShowcase.items.communityMemory.visual";

  if (feedKey === "coOrg") {
    return (
      <Badge
        variant="outline"
        className="ml-auto shrink-0 border-primary/30 text-[10px] font-medium text-primary"
      >
        {t(`${prefix}.coOrgRole`)}
      </Badge>
    );
  }

  const metaKey =
    feedKey === "event"
      ? "metaAttended"
      : feedKey === "announcement"
        ? "metaSentTo"
        : "metaMemberNumber";

  return (
    <Badge
      variant="outline"
      className="ml-auto shrink-0 border-primary/30 text-[10px] font-medium text-primary"
    >
      {t(`${prefix}.${metaKey}`, { count: metaCount })}
    </Badge>
  );
}

function FeedRowHeadline({
  feedKey,
  date,
}: {
  feedKey: FeedKey;
  date: string;
}) {
  const { t } = useTranslation("landing");
  const prefix = "featuresShowcase.items.communityMemory.visual";
  const { activityI18nKey } = FEED_CONFIG[feedKey];

  return (
    <p className="truncate text-sm font-semibold leading-snug text-foreground">
      {t(`${prefix}.${activityI18nKey}`)}
      <span className="mx-1 text-foreground/40" aria-hidden>
        ·
      </span>
      {date}
    </p>
  );
}

function FeedRowDetail({ label }: { label: string }) {
  return (
    <p className="truncate text-[10px] text-muted-foreground">{label}</p>
  );
}

function ContextAccessPanel() {
  const { t } = useTranslation("landing");
  const prefix = "featuresShowcase.items.communityMemory.visual";

  return (
    <>
      <p className="mb-2.5 text-[9px] uppercase tracking-wide text-primary">
        {t(`${prefix}.contextAccess`)}
      </p>
      <ul className="mb-3 flex flex-col gap-2.5">
        {CHECKLIST_ITEMS.map((item) => (
          <li key={item.labelKey} className="flex gap-2">
            <Check
              className="mt-0.5 size-3 shrink-0 text-primary"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">
                {t(`${prefix}.${item.labelKey}`)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t(`${prefix}.${item.metaKey}`)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-1.5 border-t border-primary/10 pt-2.5">
        <Sparkles className="size-3 shrink-0 text-primary" aria-hidden />
        <span className="text-[10px] font-medium text-primary">
          {t(`${prefix}.readyFromDayOne`)}
        </span>
      </div>
    </>
  );
}

function TimelineAttribution({ item }: { item: FeedItem }) {
  return (
    <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
      <Avatar className="size-5 shrink-0">
        <AvatarImage src={item.actor.avatarSrc} alt={item.actor.name} />
        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-[8px] font-semibold text-primary-foreground">
          {item.actor.initials}
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-[10px] font-medium text-foreground">
        {item.actor.name}
      </span>
      <EntryMetaBadge feedKey={item.key} metaCount={item.metaCount} />
    </div>
  );
}

function TimelineEntryBody({
  item,
  isContextOpen,
}: {
  item: FeedItem;
  isContextOpen?: boolean;
}) {
  const { t } = useTranslation("landing");

  if (item.isActive) {
    return (
      <>
        <FeedRowHeadline feedKey={item.key} date={item.date} />
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <FeedRowDetail label={item.label} />
          </div>
          <span className="hidden shrink-0 items-center gap-1 text-primary lg:flex">
            <Pointer className="size-3" aria-hidden />
            <span className="text-[10px] font-medium">
              {t("featuresShowcase.clickDetails")}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-primary lg:hidden">
            {!isContextOpen && (
              <>
                <Pointer
                  className="size-3 animate-pulse"
                  aria-hidden
                />
                <span className="text-[10px] font-medium">
                  {t("featuresShowcase.clickDetails")}
                </span>
              </>
            )}
            <ChevronDown
              aria-hidden
              className={`size-3.5 transition-transform duration-300 ${
                isContextOpen ? "rotate-180" : ""
              }`}
            />
          </span>
        </div>
        <TimelineAttribution item={item} />
      </>
    );
  }

  return (
    <>
      <FeedRowHeadline feedKey={item.key} date={item.date} />
      <FeedRowDetail label={item.label} />
      <TimelineAttribution item={item} />
    </>
  );
}

function ContextAccessModal({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FeedItem;
}) {
  const { t } = useTranslation("landing");
  const prefix = "featuresShowcase.items.communityMemory.visual";
  const { activityI18nKey } = FEED_CONFIG[item.key];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-md">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage
                src={item.actor.avatarSrc}
                alt={item.actor.name}
              />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-xs font-semibold text-primary-foreground">
                {item.actor.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <DialogTitle className="text-base">
                {t(`${prefix}.${activityI18nKey}`)}
                <span className="mx-1 text-foreground/40" aria-hidden>
                  ·
                </span>
                {item.date}
              </DialogTitle>
              <DialogDescription className="text-[10px]">
                {item.label}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <ContextAccessPanel />
      </DialogContent>
    </Dialog>
  );
}

function TimelineEntry({
  item,
  isContextOpen,
  onActivateContext,
}: {
  item: FeedItem;
  isContextOpen: boolean;
  onActivateContext: () => void;
}) {
  if (item.isActive) {
    return (
      <li className="relative pb-4 pl-6 last:pb-0">
        <TimelineNode feedKey={item.key} />
        <button
          type="button"
          onClick={onActivateContext}
          className="-mx-2 w-[calc(100%+1rem)] cursor-pointer rounded-lg bg-primary/5 px-2 py-2 text-left ring-1 ring-inset ring-primary/15"
        >
          <TimelineEntryBody item={item} isContextOpen={isContextOpen} />

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out lg:hidden ${
              isContextOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="mt-3 rounded-xl border border-primary/20 bg-card/80 p-3 shadow-sm shadow-black/8 backdrop-blur-sm">
                <ContextAccessPanel />
              </div>
            </div>
          </div>
        </button>
      </li>
    );
  }

  return (
    <li className="relative pb-4 pl-6 last:pb-0">
      <TimelineNode feedKey={item.key} />
      <TimelineEntryBody item={item} />
    </li>
  );
}

const ACTIVE_FEED_ITEM = FEED.find((item) => item.isActive)!;

function handleContextActivate(
  setIsContextOpen: Dispatch<SetStateAction<boolean>>,
  setIsModalOpen: Dispatch<SetStateAction<boolean>>,
) {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches
  ) {
    setIsModalOpen(true);
    return;
  }
  setIsContextOpen((open) => !open);
}

export function FeatureVisualCommunityMemory() {
  const { t } = useTranslation("landing");
  const prefix = "featuresShowcase.items.communityMemory.visual";
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative h-full w-full">
      <ContextAccessModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        item={ACTIVE_FEED_ITEM}
      />
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
            {t(`${prefix}.autoPreserved`)}
          </div>
        </CardHeader>

        <CardContent className="flex-1 px-6">
          <ol className="relative ml-3 border-l border-primary/30">
            {FEED.map((item) => (
              <TimelineEntry
                key={item.key}
                item={item}
                isContextOpen={isContextOpen}
                onActivateContext={() =>
                  handleContextActivate(setIsContextOpen, setIsModalOpen)
                }
              />
            ))}
          </ol>
        </CardContent>

        <CardFooter className="px-6 pt-0">
          <div className="flex w-full items-center gap-1.5">
            <BookOpen className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span className="text-xs text-muted-foreground">
              {t(`${prefix}.preservedSince`)}
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
