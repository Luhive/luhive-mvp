import { useNavigate, Form, useNavigation, useFetcher } from "react-router";
import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Calendar, MapPin, Copy, ExternalLink, Bell, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { Button } from "~/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/shared/components/ui/sheet";
import type { Community, Event, Profile } from "~/shared/models/entity.types";
import type { ExternalPlatform } from "~/modules/events/model/event.types";
import { getExternalPlatformName, getExternalPlatformIcon } from "~/modules/events/utils/external-platform";
import { Badge } from "~/shared/components/ui/badge";
import AttendersAvatars from "~/modules/events/components/attenders/attenders-avatars";
import { AnonymousRegistrationDialog } from "../registration/anonymous-registration-dialog";
import { AnonymousSubscriptionDialog } from "../registration/anonymous-subscription-dialog";
import { CustomQuestionsForm } from "../registration/custom-questions-form";
import { createClient } from "~/shared/lib/supabase/client";

dayjs.extend(utc);
dayjs.extend(timezone);

type SubmissionIntent = "register" | "unregister";

interface EventPreviewSidebarProps {
  event: Event | null;
  community: Community | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToEvent?: () => void;
  registrationCount?: number;
  user?: { id: string; email?: string | null } | null;
  userProfile?: Profile | null;
  isUserRegistered?: boolean;
}

export function EventPreviewSidebar({
  event,
  community,
  open,
  onOpenChange,
  onNavigateToEvent,
  registrationCount,
  user,
  userProfile,
  isUserRegistered = false,
}: EventPreviewSidebarProps) {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const [showAnonymousDialog, setShowAnonymousDialog] = useState(false);
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [showCustomQuestionsForm, setShowCustomQuestionsForm] = useState(false);
  const [anonymousName, setAnonymousName] = useState<string | null>(null);
  const [anonymousEmail, setAnonymousEmail] = useState<string | null>(null);
  const [localIsRegistered, setLocalIsRegistered] = useState(isUserRegistered);
  const lastSubmittedIntentRef = useRef<SubmissionIntent | null>(null);
  const prevEventIdRef = useRef<string | null>(null);
  
  // Sync local state with prop when it changes
  useEffect(() => {
    setLocalIsRegistered(isUserRegistered);
  }, [isUserRegistered]);

  // Reset transient registration state only when switching between different events
  useEffect(() => {
    const currentEventId = event?.id ?? null;

    if (
      prevEventIdRef.current !== null &&
      currentEventId !== null &&
      prevEventIdRef.current !== currentEventId
    ) {
      setLocalIsRegistered(false);
      lastSubmittedIntentRef.current = null;
      setAnonymousName(null);
      setAnonymousEmail(null);
      setShowAnonymousDialog(false);
      setShowCustomQuestionsForm(false);
    }

    prevEventIdRef.current = currentEventId;
  }, [event?.id]);
  
  // Check registration status client-side when sidebar opens or event/user changes
  useEffect(() => {
    // Only check if sidebar is open, user is available, and event is available
    if (!open || !user || !event) {
      return;
    }
    const eventId = event.id;
    const userId = user.id;

    async function checkRegistrationStatus() {
      try {
        const supabase = createClient();
        const { data: registration } = await supabase
          .from("event_registrations")
          .select("id")
          .eq("event_id", eventId)
          .eq("user_id", userId)
          .maybeSingle();

        setLocalIsRegistered(!!registration);
      } catch (error) {
        console.error("Error checking registration status:", error);
        // Don't update state on error, keep current state
      }
    }

    checkRegistrationStatus();
  }, [open, user?.id, event?.id]);
  
  // Monitor fetcher data for successful registration
  useEffect(() => {
    if (fetcher.data) {
      const lastSubmittedIntent = lastSubmittedIntentRef.current;

      if (fetcher.data.success) {
        if (lastSubmittedIntent === "unregister") {
          setLocalIsRegistered(false);
        } else {
          setLocalIsRegistered(true);
          setShowCustomQuestionsForm(false);
          if (fetcher.data.message) {
            toast.success(fetcher.data.message);
          } else {
            toast.success("Successfully registered for the event!");
          }
        }
      } else if (fetcher.data.error) {
        toast.error(fetcher.data.error);
      }

      lastSubmittedIntentRef.current = null;
    }
  }, [fetcher.data]);
  
  const isSubmitting = fetcher.state === "submitting" || fetcher.state === "loading";
  const currentSubmittingIntent = fetcher.formData?.get("intent");
  const isUnregistering = isSubmitting && currentSubmittingIntent === "unregister";

  if (!event || !community) return null;

  const eventDate = dayjs(event.start_time).tz(event.timezone);
  const eventEndDate = event.end_time
    ? dayjs(event.end_time).tz(event.timezone)
    : null;
  const isPastEvent = eventDate.isBefore(dayjs());

  // Check if this is an external event
  const isExternalEvent = event.registration_type === "external";
  const platform = event.external_platform as ExternalPlatform | null;
  const PlatformIcon = platform ? getExternalPlatformIcon(platform) : null;

  // Check if event has custom questions
  const hasCustomQuestions = event.custom_questions && (
    (event.custom_questions as any)?.phone?.enabled ||
    ((event.custom_questions as any)?.custom && (event.custom_questions as any).custom.length > 0)
  );

  // Get user phone from profile metadata
  const userPhone = userProfile?.metadata && typeof userProfile.metadata === 'object' && 'phone' in userProfile.metadata
    ? (userProfile.metadata as any).phone
    : null;

  const eventUrl = `${window.location.origin}/c/${community.slug}/events/${event.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventUrl);
    toast.success("Event link copied to clipboard!");
  };

  const handleNavigateToEvent = () => {
    // Close sidebar first
    onOpenChange(false);
    
    // Trigger the navigation callback if provided (for instant overlay)
    if (onNavigateToEvent) {
      onNavigateToEvent();
    }
    
    // Navigate to the event page with event data in state
    navigate(`/c/${community.slug}/events/${event.id}`, {
      state: { event },
    });
  };

  const handleOpenEventPageInNewTab = () => {
    onOpenChange(false);
    window.open(eventUrl, "_blank", "noopener,noreferrer");
  };

  const handleRegisterClick = () => {
    // For past events, navigate to event page
    if (isPastEvent) {
      handleNavigateToEvent();
      return;
    }

    // For external events, handle subscription
    if (isExternalEvent) {
      if (user) {
        // Logged-in user: navigate to external URL or show subscription dialog
        if (event.external_registration_url) {
          window.open(event.external_registration_url, "_blank", "noopener,noreferrer");
        } else {
          setShowSubscribeDialog(true);
        }
      } else {
        // Not logged in: show subscription dialog
        setShowSubscribeDialog(true);
      }
      return;
    }

    // For regular events
    if (user) {
      // Logged-in user: check if custom questions are needed
      if (hasCustomQuestions) {
        setShowCustomQuestionsForm(true);
      }
      // If no custom questions, the form will be rendered below and submitted directly
    } else {
      // Not logged in: show anonymous registration dialog
      setShowAnonymousDialog(true);
    }
  };

  const handleCustomQuestionsSubmit = (answers: any) => {
    const isAnonymousFlow = !user && !!anonymousName && !!anonymousEmail;
    lastSubmittedIntentRef.current = "register";

    // Use fetcher to submit without navigation (fetcher doesn't navigate by default)
    const formData = new FormData();
    formData.append('intent', isAnonymousFlow ? 'anonymous-custom-questions' : 'register');
    formData.append('custom_answers', JSON.stringify(answers));

    if (isAnonymousFlow) {
      formData.append('name', anonymousName);
      formData.append('email', anonymousEmail);
      formData.append('_source', 'sidebar');
    }

    fetcher.submit(formData, { 
      method: 'POST',
      action: `/c/${community.slug}/events/${event.id}`
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden [&>button]:hidden"
      >
        {/* Header with action buttons */}
        <SheetHeader className="shrink-0 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Close sidebar</span>
            </Button>
            
            <div className="flex-1" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEventPageInNewTab}
              className="gap-1.5"
            >
              Event Page
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
          </div>
          <SheetTitle className="sr-only">{event.title}</SheetTitle>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto event-sidebar-scrollbar">
          {/* Event Cover - 300x300px */}
          <div className="p-4 pb-0">
            <div className="relative h-[300px] w-[300px] m-auto rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-background">
              {event.cover_url ? (
                <img
                  src={event.cover_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <Calendar className="h-16 w-16 text-primary/30" />
                </div>
              )}
              
              {/* Past Event Overlay */}
              {isPastEvent && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge
                    variant="outline"
                    className="bg-black/60 text-white border-white/20"
                  >
                    Past Event
                  </Badge>
                </div>
              )}

              {/* External badge overlay on cover */}
              {isExternalEvent && (
                <div className="absolute bottom-3 right-3">
                  <Badge
                    variant="outline"
                    className="bg-background/90 border-primary/50 text-primary"
                  >
                    {PlatformIcon ? (
                      <PlatformIcon className="w-3 h-3 mr-1" />
                    ) : (
                      <ExternalLink className="w-3 h-3 mr-1" />
                    )}
                    {platform ? getExternalPlatformName(platform) : "External"}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="p-4 space-y-4">
            {/* Title */}
            <h2 className="text-xl font-bold leading-tight">
              {event.title}
            </h2>

            {/* Date & Location - Side by side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Date Card */}
              <div className="rounded-lg bg-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Date</span>
                </div>
                <p className="text-sm font-semibold">
                  {eventDate.format("MMM D, YYYY")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {eventDate.format("h:mm A")}
                  {eventEndDate && ` - ${eventEndDate.format("h:mm A")}`}
                </p>
              </div>

              {/* Location Card */}
              <div className="rounded-lg bg-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Location</span>
                </div>
                {event.location_address ? (
                  <>
                    <p className="text-sm font-semibold truncate">
                      {event.location_address.split(",")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {event.location_address.split(",").slice(1).join(",").trim() || "View on map"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold">
                      {event.event_type === "online" ? "Online Event" : "TBA"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.event_type === "online" ? "Virtual attendance" : "Location pending"}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="rounded-lg bg-card p-3">
                <h3 className="text-xs text-muted-foreground font-medium mb-2">About</h3>
                <p className="text-sm text-foreground line-clamp-4 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Hosted by & Attenders - Side by side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Hosted by */}
              <div className="rounded-lg bg-card p-3">
                <span className="text-xs text-muted-foreground font-medium block mb-2">Hosted by</span>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage
                      src={community.logo_url || ""}
                      alt={community.name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {community.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {community.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attenders */}
              <div className="rounded-lg bg-card p-3">
                <span className="text-xs text-muted-foreground font-medium block mb-2">Attending</span>
                <AttendersAvatars 
                  eventId={event.id} 
                  maxVisible={4} 
                  isExternalEvent={isExternalEvent}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA with Free text */}
        <div className="shrink-0 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between gap-4">
            <div className="shrink-0">
              <p className="text-lg font-bold">Free</p>
            </div>
            {isPastEvent ? (
              <Button
                onClick={handleNavigateToEvent}
                className="w-[20rem]"
                size="lg"
              >
                View Event Details
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            ) : isExternalEvent ? (
              <Button
                onClick={handleRegisterClick}
                className="w-[20rem]"
                size="lg"
                disabled={isSubmitting}
              >
                <Bell className="h-4 w-4 mr-2" />
                {isSubmitting ? "Processing..." : "Subscribe for Updates"}
              </Button>
            ) : user ? (
              // Logged-in user: show registration form
              localIsRegistered ? (
                <fetcher.Form
                  method="post"
                  action={`/c/${community.slug}/events/${event.id}`}
                  onSubmit={() => {
                    lastSubmittedIntentRef.current = "unregister";
                  }}
                >
                  <input type="hidden" name="intent" value="unregister" />
                  <Button
                    type="submit"
                    className="w-[20rem]"
                    size="lg"
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    {isUnregistering ? "Unregistering..." : "Unregister"}
                  </Button>
                </fetcher.Form>
              ) : hasCustomQuestions ? (
                // Show button that opens custom questions form
                <Button
                  onClick={handleRegisterClick}
                  className="w-[20rem]"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Registering..." : "Register"}
                </Button>
              ) : (
                <fetcher.Form
                  method="post"
                  action={`/c/${community.slug}/events/${event.id}`}
                  onSubmit={() => {
                    lastSubmittedIntentRef.current = "register";
                  }}
                >
                  <input type="hidden" name="intent" value="register" />
                  <Button
                    type="submit"
                    className="w-[20rem]"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Registering..." : "Register"}
                  </Button>
                </fetcher.Form>
              )
            ) : (
              // Not logged in: show register button that opens dialog
              <Button
                onClick={handleRegisterClick}
                className="w-[20rem]"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Register"}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>

      </Sheet>

      {/* Registration Dialogs */}
      <AnonymousRegistrationDialog
        open={showAnonymousDialog}
        onOpenChange={setShowAnonymousDialog}
        eventId={event.id}
        communitySlug={community.slug}
        preventNavigation
        onSuccess={() => {
          toast.success("Check your email to verify your registration!");
          setAnonymousName(null);
          setAnonymousEmail(null);
          setShowAnonymousDialog(false);
        }}
        onNeedsCustomQuestions={({ anonymousName: nextAnonymousName, anonymousEmail: nextAnonymousEmail }) => {
          setAnonymousName(nextAnonymousName);
          setAnonymousEmail(nextAnonymousEmail);
          setShowAnonymousDialog(false);
          setShowCustomQuestionsForm(true);
        }}
      />
      <AnonymousSubscriptionDialog
        open={showSubscribeDialog}
        onOpenChange={setShowSubscribeDialog}
        eventId={event.id}
        communitySlug={community.slug}
      />
      {hasCustomQuestions && (
        <CustomQuestionsForm
          open={showCustomQuestionsForm}
          onOpenChange={setShowCustomQuestionsForm}
          eventId={event.id}
          customQuestions={event.custom_questions as any}
          userName={userProfile?.full_name || undefined}
          userEmail={user?.email || undefined}
          userAvatarUrl={userProfile?.avatar_url || undefined}
          userPhone={userPhone}
          anonymousName={anonymousName || undefined}
          anonymousEmail={anonymousEmail || undefined}
          onSubmit={handleCustomQuestionsSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}

export default EventPreviewSidebar;

