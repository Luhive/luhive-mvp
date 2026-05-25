import {
  CalendarDays,
  ChevronDown,
  Lightbulb,
  Pointer,
  Sparkles,
  Trophy,
  TrendingUp,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
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

const ROSTER = [
  {
    initials: "AM",
    name: "Alex M.",
    meta: {
      type: "stats" as const,
      joined: 6,
      affinity: { kind: "format" as const, key: "hackathon" as const },
    },
    badge: "+1 visit",
    tone: "from-primary to-primary/80",
    avatarSrc: "/landing/features/feature-avatar-1.svg",
    isActive: true,
  },
  {
    initials: "SK",
    name: "Sam K.",
    meta: {
      type: "stats" as const,
      joined: 3,
      affinity: { kind: "topic" as const, key: "ai" as const },
    },
    badge: "5x",
    tone: "from-primary/80 to-primary/60",
    avatarSrc: "/landing/features/feature-avatar-2.svg",
    isActive: false,
  },
  {
    initials: "MR",
    name: "Maya R.",
    meta: { type: "first" as const },
    badge: "New",
    tone: "from-primary/60 to-primary/40",
    avatarSrc: "/landing/features/feature-avatar-4.svg",
    isActive: false,
  },
  {
    initials: "JT",
    name: "Jordan T.",
    meta: {
      type: "stats" as const,
      joined: 4,
      affinity: { kind: "format" as const, key: "webinar" as const },
    },
    badge: "+2 visits",
    tone: "from-primary to-primary/60",
    avatarSrc: "/landing/features/feature-avatar-3.svg",
    isActive: false,
  },
] as const;

const ACTIVE_MEMBER = ROSTER[0];

type RosterMember = (typeof ROSTER)[number];
type AffinityKey =
  | "hackathon"
  | "webinar"
  | "workshop"
  | "ai"
  | "tips"
  | "career";

const AFFINITY_CONFIG: Record<
  AffinityKey,
  { i18nKey: string; Icon: LucideIcon }
> = {
  hackathon: { i18nKey: "affinityHackathon", Icon: Trophy },
  webinar: { i18nKey: "affinityWebinar", Icon: Video },
  workshop: { i18nKey: "affinityWorkshop", Icon: Users },
  ai: { i18nKey: "affinityAi", Icon: Sparkles },
  tips: { i18nKey: "affinityTips", Icon: Lightbulb },
  career: { i18nKey: "affinityCareer", Icon: TrendingUp },
};

function MemberRosterMeta({ meta }: { meta: RosterMember["meta"] }) {
  const { t } = useTranslation("landing");
  const prefix = "featuresShowcase.items.memberMemory.visual";

  if (meta.type === "first") {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
          <Sparkles className="size-3 shrink-0" aria-hidden />
          {t(`${prefix}.firstEventToday`)}
        </span>
      </div>
    );
  }

  const { i18nKey, Icon } = AFFINITY_CONFIG[meta.affinity.key];

  return (
    <div className="flex flex-col gap-0.5 lg:flex-row lg:flex-wrap lg:items-center lg:gap-1">
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <CalendarDays className="size-3 shrink-0 text-primary" aria-hidden />
        {t(`${prefix}.joinedEvents`, { count: meta.joined })}
      </span>
      <span
        className="hidden text-[10px] text-muted-foreground/50 lg:inline"
        aria-hidden
      >
        ·
      </span>
      <span className="inline-flex min-w-0 items-center gap-1 text-[10px] font-medium text-primary lg:truncate">
        <Icon className="size-3 shrink-0" aria-hidden />
        {t(`${prefix}.${i18nKey}`)}
      </span>
    </div>
  );
}

const FOOTER_AVATARS = [
  { initials: "SK", src: "/landing/features/feature-avatar-2.svg" },
  { initials: "JT", src: "/landing/features/feature-avatar-3.svg" },
  { initials: "MR", src: "/landing/features/feature-avatar-4.svg" },
] as const;

const TIMELINE = [
  { stepKey: "stepRegistered", event: "Tech Meetup", state: "done" },
  { stepKey: "stepAttended", event: "Tech Meetup", state: "done" },
  { stepKey: "stepReturned", event: "Demo Day", state: "active" },
] as const;

function MemberDetailPanel() {
  const { t } = useTranslation("landing");
  const prefix = "featuresShowcase.items.memberMemory.visual";

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <Avatar className="size-7">
          <AvatarImage
            src={ACTIVE_MEMBER.avatarSrc}
            alt={ACTIVE_MEMBER.name}
          />
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-[10px] font-semibold text-primary-foreground">
            {ACTIVE_MEMBER.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">
            {ACTIVE_MEMBER.name}
          </p>
          <p className="text-[9px] uppercase tracking-wide text-primary">
            {t(`${prefix}.savedAutomatically`)}
          </p>
        </div>
      </div>

      <ol className="relative ml-1 flex flex-col gap-3 border-l border-dashed border-primary/30 pl-4">
        {TIMELINE.map((step) => (
          <li key={step.stepKey} className="relative">
            <span
              aria-hidden
              className={`absolute -left-[1.32rem] top-1 size-2.5 rounded-full ring-2 ring-card ${
                step.state === "done" ? "bg-primary" : "bg-primary/40"
              }`}
            />
            <p className="text-[11px] font-medium text-foreground">
              {t(`${prefix}.${step.stepKey}`)}
            </p>
            <p className="text-[10px] text-muted-foreground">{step.event}</p>
          </li>
        ))}
      </ol>
    </>
  );
}

export function FeatureVisualMemberMemory() {
  const { t } = useTranslation("landing");
  const prefix = "featuresShowcase.items.memberMemory.visual";
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
            {t(`${prefix}.autoSynced`)}
          </div>
        </CardHeader>

        <CardContent className="flex-1 px-6">
          <ul className="flex h-full flex-col justify-around">
            {ROSTER.map((member, index) => {
              if (member.isActive) {
                return (
                  <li
                    key={member.name}
                    onClick={() => setIsDetailOpen((p) => !p)}
                    className="-mx-3 flex cursor-pointer flex-col rounded-lg bg-primary/5 px-3 py-3 ring-1 ring-inset ring-primary/15 lg:cursor-default"
                  >
                    <div className="flex w-full items-center gap-3">
                      <Avatar className="size-10 shrink-0">
                        <AvatarImage
                          src={member.avatarSrc}
                          alt={member.name}
                        />
                        <AvatarFallback
                          className={`bg-gradient-to-br ${member.tone} text-xs font-semibold text-primary-foreground`}
                        >
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {member.name}
                        </p>
                        <MemberRosterMeta meta={member.meta} />
                      </div>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-primary/30 text-[10px] font-medium text-primary"
                      >
                        {member.badge}
                      </Badge>
                    </div>

                    <div
                      className={`mt-2 flex items-center lg:hidden ${
                        isDetailOpen ? "justify-end" : "justify-between"
                      }`}
                    >
                      {!isDetailOpen && (
                        <div className="flex items-center gap-1">
                          <Pointer
                            className="size-3 animate-pulse text-primary"
                            aria-hidden
                          />
                          <span className="text-[10px] font-medium text-primary">
                            {t("featuresShowcase.clickDetails")}
                          </span>
                        </div>
                      )}
                      <ChevronDown
                        aria-hidden
                        className={`size-3.5 shrink-0 text-primary transition-transform duration-300 ${
                          isDetailOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-in-out lg:hidden ${
                        isDetailOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="mt-3 rounded-xl border border-primary/20 bg-card/80 p-3 shadow-sm shadow-black/8 backdrop-blur-sm">
                          <MemberDetailPanel />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li
                  key={member.name}
                  className={`flex items-center gap-3 py-3 ${
                    index < ROSTER.length - 1 ? "border-b border-border/60" : ""
                  }`}
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarImage src={member.avatarSrc} alt={member.name} />
                    <AvatarFallback
                      className={`bg-gradient-to-br ${member.tone} text-xs font-semibold text-primary-foreground`}
                    >
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {member.name}
                    </p>
                    <MemberRosterMeta meta={member.meta} />
                  </div>
                  <Badge
                    variant="outline"
                    className="border-primary/30 text-[10px] font-medium text-primary"
                  >
                    {member.badge}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </CardContent>

        <CardFooter className="px-6 pt-0">
          <div className="flex w-full items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {t(`${prefix}.weeklyGrowth`)}
            </span>
            <div className="flex -space-x-2">
              {FOOTER_AVATARS.map((avatar, i) => (
                <Avatar
                  key={avatar.initials}
                  className="size-6 ring-2 ring-card"
                  style={{ zIndex: FOOTER_AVATARS.length - i }}
                >
                  <AvatarImage src={avatar.src} alt="" />
                  <AvatarFallback className="bg-primary/15 text-[9px] font-semibold text-primary">
                    {avatar.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </CardFooter>
      </Card>

      <Card className="absolute right-3 top-3 hidden w-[15.5rem] gap-3 overflow-visible rotate-[3deg] border-primary/20 bg-card/60 py-4 shadow-md shadow-black/10 backdrop-blur-sm backdrop-saturate-50 lg:block md:right-6 md:top-6">
        <span
          aria-hidden
          className="absolute -left-[7px] top-25 size-3 rotate-45 border-b border-l border-primary/20 bg-card/60 backdrop-blur-sm backdrop-saturate-50"
        />
        <CardContent className="px-4 pb-1">
          <MemberDetailPanel />
        </CardContent>
      </Card>
    </div>
  );
}
