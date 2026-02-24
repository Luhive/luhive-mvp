import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '~/shared/components/ui/card';
import { Button } from '~/shared/components/ui/button';
import { Separator } from '~/shared/components/ui/separator';
import { Spinner } from '~/shared/components/ui/spinner';
import { Badge } from '~/shared/components/ui/badge';
import { Save, FileText, Calendar, MapPin, Users, Eye, MessageCircle, HelpCircle, Users2 } from 'lucide-react';
import { EventCoverUpload } from '~/modules/events/components/event-form/event-cover-upload';
import { EventBasicInfo } from '~/modules/events/components/event-form/fields/event-basic-info';
import { EventDateTime } from '~/modules/events/components/event-form/fields/event-datetime';
import { EventLocation } from '~/modules/events/components/event-form/fields/event-location';
import { EventCapacity } from '~/modules/events/components/event-form/fields/event-capacity';
import { EventDiscussion } from '~/modules/events/components/event-form/fields/event-discussion';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '~/shared/components/ui/select';
import { Textarea } from '~/shared/components/ui/textarea';
import { Checkbox } from '~/shared/components/ui/checkbox';
import { CustomQuestionsBuilder } from '~/modules/events/components/registration/custom-questions-builder';
import { CollaborationInviteDialog } from '~/modules/events/components/collaboration/collaboration-invite-dialog';
import { CollaborationList } from '~/modules/events/components/collaboration/collaboration-list';
import type { CollaborationWithCommunity } from '~/modules/events/components/collaboration/collaboration-list';
import { createClient } from '~/shared/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '~/shared/models/database.types';
import type { CustomQuestionJson } from '~/modules/events/model/event.types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

type EventType = Database['public']['Enums']['event_type'];
type EventStatus = Database['public']['Enums']['event_status'];

interface EventFormData {
  title: string;
  description: string;
  startDate?: Date;
  startTime: string;
  endTime?: string;
  timezone: string;
  eventType: EventType;
  locationAddress?: string;
  onlineMeetingLink?: string;
  discussionLink?: string;
  capacity?: number;
  registrationDeadline?: Date;
  coverUrl?: string;
  status: EventStatus;
  isApproveRequired: boolean;
  customQuestions?: CustomQuestionJson | null;
  notification_send_before?: string | null;
  notification_message?: string | null;
}

interface EventFormProps {
  communitySlug: string;
  communityId: string;
  eventId?: string;
  mode: 'create' | 'edit';
  initialData?: Partial<EventFormData>;
}

export function EventForm({
  communitySlug,
  communityId,
  eventId,
  mode,
  initialData,
}: EventFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialRef = useRef<Partial<EventFormData> | undefined>(initialData);

  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [startDate, setStartDate] = useState<Date | undefined>(initialData?.startDate);
  const [startTime, setStartTime] = useState(initialData?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '10:00');
  const [timezone, setTimezone] = useState(initialData?.timezone || 'Asia/Baku');
  const [eventType, setEventType] = useState<EventType>(initialData?.eventType || 'in-person');
  const [locationAddress, setLocationAddress] = useState(initialData?.locationAddress || '');
  const [onlineMeetingLink, setOnlineMeetingLink] = useState(initialData?.onlineMeetingLink || '');
  const [discussionLink, setDiscussionLink] = useState(initialData?.discussionLink || '');
  const [capacity, setCapacity] = useState<number | undefined>(initialData?.capacity);
  const [registrationDeadline, setRegistrationDeadline] = useState<Date | undefined>(
    initialData?.registrationDeadline
  );
  const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl || '');
  const [status, setStatus] = useState<EventStatus>(initialData?.status || 'draft');
  const [isApproveRequired, setIsApproveRequired] = useState(initialData?.isApproveRequired || false);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestionJson | null>(
    initialData?.customQuestions || null
  );

  // Notification settings for attendees
  const [notificationTiming, setNotificationTiming] = useState<'1_hour' | '1_day' | undefined>(
    (initialData as any)?.notification_send_before || undefined
  );
  const [notificationMessage, setNotificationMessage] = useState<string | undefined>(
    (initialData as any)?.notification_message || ''
  );
  const [useDefaultNotificationMessage, setUseDefaultNotificationMessage] = useState<boolean>(
    (initialData as any)?.notification_message ? false : true
  );

  // Collaboration state
  const [collaborations, setCollaborations] = useState<CollaborationWithCommunity[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [loadingCollaborations, setLoadingCollaborations] = useState(false);
  // Pending invites when creating an event (collected before event exists)
  const [pendingInvites, setPendingInvites] = useState<{
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
  }[]>([]);

  // Validation
  const isValid = () => {
    if (!title.trim()) return false;
    if (!startDate) return false;
    if (!startTime) return false;
    
    // Check event type specific validations
    if (eventType === 'in-person' && !locationAddress.trim()) return false;
    if (eventType === 'online' && !onlineMeetingLink.trim()) return false;
    if (eventType === 'hybrid' && (!locationAddress.trim() || !onlineMeetingLink.trim())) return false;
    
    // Validate discussion link if provided (must be valid URL)
    if (discussionLink.trim()) {
      try {
        new URL(discussionLink.trim());
      } catch {
        return false;
      }
    }

    return true;
  };

  // Load collaborations when in edit mode
  useEffect(() => {
    if (mode === 'edit' && eventId) {
      async function loadCollaborations() {
        setLoadingCollaborations(true);
        const supabase = createClient();
        
        try {
          // Check if this community is host
          const { data: hostCollab } = await supabase
            .from('event_collaborations')
            .select('role')
            .eq('event_id', eventId)
            .eq('community_id', communityId)
            .eq('role', 'host')
            .eq('status', 'accepted')
            .single();
          
          setIsHost(!!hostCollab);
          
          // Load all collaborations
          const { data: collabs, error } = await supabase
            .from('event_collaborations')
            .select(`
              *,
              community:communities!event_collaborations_community_id_fkey (
                id,
                name,
                slug,
                logo_url
              )
            `)
            .eq('event_id', eventId)
            .order('created_at', { ascending: true });
          
          if (error) {
            console.error('Error loading collaborations:', error);
          } else if (collabs) {
            const formatted = collabs.map((c: any) => ({
              id: c.id,
              role: c.role as 'host' | 'co-host',
              status: c.status as 'pending' | 'accepted' | 'rejected',
              invited_at: c.invited_at,
              accepted_at: c.accepted_at,
              community: Array.isArray(c.community) ? c.community[0] : c.community,
            })) as CollaborationWithCommunity[];
            setCollaborations(formatted);
          }
        } catch (error) {
          console.error('Error loading collaborations:', error);
        } finally {
          setLoadingCollaborations(false);
        }
      }
      loadCollaborations();
    }
  }, [mode, eventId, communityId]);

  const hasOnlyScheduleOrLocationChanges = () => {
    if (!initialRef.current || mode !== 'edit') {
      return false;
    }

    const initial = initialRef.current;

    // Helper to compare dates by day
    const sameDate = (a?: Date, b?: Date) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      return dayjs(a).isSame(dayjs(b), 'day');
    };

    const sameOrDefault = (a: string | undefined, b: string | undefined, fallback: string) =>
      (a || fallback) === (b || fallback);

    // 1) Check if any non schedule/location fields changed
    const nonScheduleChanged =
      (initial.title || '') !== title ||
      (initial.description || '') !== description ||
      (initial.eventType || 'in-person') !== eventType ||
      (initial.discussionLink || '') !== discussionLink ||
      (initial.coverUrl || '') !== coverUrl ||
      (initial.timezone || 'Asia/Baku') !== timezone ||
      (initial.capacity || undefined) !== capacity ||
      (!!initial.registrationDeadline) !== (!!registrationDeadline) ||
      (initial.registrationDeadline &&
        registrationDeadline &&
        !sameDate(initial.registrationDeadline, registrationDeadline)) ||
      (initial.isApproveRequired || false) !== isApproveRequired ||
      JSON.stringify(initial.customQuestions ?? null) !==
        JSON.stringify(customQuestions ?? null);

    if (nonScheduleChanged) {
      return false;
    }

    // 2) Check if at least one schedule/location field changed
    const scheduleChanged =
      !sameDate(initial.startDate, startDate) ||
      !sameOrDefault(initial.startTime, startTime, '09:00') ||
      !sameOrDefault(initial.endTime, endTime, '10:00') ||
      (initial.locationAddress || '') !== locationAddress ||
      (initial.onlineMeetingLink || '') !== onlineMeetingLink;

    return scheduleChanged;
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!isValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Initialize Supabase client (client-side only)
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const submitStatus: EventStatus = isDraft ? 'draft' : 'published';

      // Combine date and time into ISO timestamp with timezone
      const startDateTime = dayjs.tz(
        `${dayjs(startDate).format('YYYY-MM-DD')}T${startTime}`,
        timezone
      ).toISOString();
      
      const endDateTime = endTime
        ? dayjs.tz(
            `${dayjs(startDate).format('YYYY-MM-DD')}T${endTime}`,
            timezone
          ).toISOString()
        : null;

      // Prepare event data
      const defaultNotificationMessage = startDate
        ? `Reminder: "${title || 'Event'}" starts on ${dayjs(startDate).tz(timezone).format('MMM D, YYYY [at] HH:mm')}`
        : `Reminder: "${title || 'Event'}" is coming up soon.`;

      const eventData = {
        community_id: communityId,
        created_by: user.id,
        title,
        description: description || null,
        start_time: startDateTime,
        end_time: endDateTime,
        timezone,
        event_type: eventType,
        location_address: locationAddress || null,
        online_meeting_link: onlineMeetingLink || null,
        discussion_link: discussionLink.trim() || null,
        capacity: capacity || null,
        registration_deadline: registrationDeadline ? registrationDeadline.toISOString() : null,
        cover_url: coverUrl || null,
        status: submitStatus,
        is_approve_required: isApproveRequired,
        custom_questions: customQuestions,
        notification_send_before: notificationTiming || null,
        notification_message: useDefaultNotificationMessage ? defaultNotificationMessage : (notificationMessage || null),
      };

      if (mode === 'create') {
        // Insert new event
        const { data: newEvent, error } = await supabase
          .from('events')
          .insert(eventData)
          .select('id')
          .single();

        if (error || !newEvent) {
          console.error('Error creating event:', error);
          toast.error(error?.message || 'Failed to create event');
          return;
        }

        // Create host collaboration record
        const { error: collabError } = await supabase
          .from('event_collaborations')
          .insert({
            event_id: newEvent.id,
            community_id: communityId,
            role: 'host',
            status: 'accepted',
            invited_by: user.id,
            invited_at: new Date().toISOString(),
            accepted_at: new Date().toISOString(),
          });

        if (collabError) {
          console.error('Error creating host collaboration:', collabError);
          // Don't fail the event creation, just log the error
        }

        // If there are pending invites collected during create flow, submit them to the collaboration action
        // so the server can create the collaboration rows and send invitation emails.
        if (pendingInvites.length > 0) {
          try {
            for (const p of pendingInvites) {
              try {
                const form = new FormData();
                form.append('intent', 'invite-collaboration');
                form.append('coHostCommunityId', p.id);

                const res = await fetch(`/c/${communitySlug}/events/${newEvent.id}/collaboration`, {
                  method: 'POST',
                  body: form,
                  credentials: 'same-origin',
                });

                if (!res.ok) {
                  const body = await res.text();
                  console.error('Failed to send pending invite via action:', res.status, body);
                } else {
                  const json = await res.json().catch(() => null);
                  if (!json || !json.success) {
                    console.error('Invite action returned error for', p.id, json);
                  }
                }
              } catch (err) {
                console.error('Error sending invite for pending community', p.id, err);
              }
            }
            toast.success(`Sent ${pendingInvites.length} collaboration invite(s)`);
          } catch (inviteErr) {
            console.error('Error sending pending invites:', inviteErr);
          } finally {
            setPendingInvites([]);
          }
        }

        toast.success(`Event ${isDraft ? 'saved as draft' : 'published'} successfully!`);
        navigate(`/dashboard/${communitySlug}/events`);
      } else if (mode === 'edit' && eventId) {
        // Check if community is host (only host can update)
        const { data: collaboration } = await supabase
          .from('event_collaborations')
          .select('role')
          .eq('event_id', eventId)
          .eq('community_id', communityId)
          .eq('role', 'host')
          .eq('status', 'accepted')
          .single();

        if (!collaboration) {
          toast.error('Only host community can update event details');
          return;
        }

        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', eventId);

        if (error) {
          console.error('Error updating event:', error);
          toast.error(error.message || 'Failed to update event');
          return;
        }

        // If only schedule/location changed for a published event, notify attendees
        const submitStatus: EventStatus = isDraft ? 'draft' : 'published';
        if (submitStatus === 'published' && hasOnlyScheduleOrLocationChanges()) {
          try {
            await fetch('/api/events/schedule-update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ eventId }),
            });
          } catch (notifyError) {
            console.error('Failed to trigger schedule update emails:', notifyError);
          }
        }

        toast.success('Event updated successfully!');
        navigate(`/dashboard/${communitySlug}/events`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "Create Event" : "Edit Event"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "create"
              ? "Fill in the details to create a new event"
              : "Update event information"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || !isValid()}
            onClick={() => handleSubmit(true)}
          >
            {isSubmitting ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Save as Draft
              </>
            )}
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || !isValid()}
            onClick={() => handleSubmit(false)}
          >
            {isSubmitting ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Publishing...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Publish Event
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Cover and Preview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Event Cover */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Cover</CardTitle>
            </CardHeader>
            <CardContent>
              <EventCoverUpload
                communitySlug={communitySlug}
                eventId={eventId}
                currentCoverUrl={coverUrl}
                onCoverUpdate={setCoverUrl}
                isCreating={mode === "create"}
              />
            </CardContent>
          </Card>

          {/* Notifications for Attendees */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Send reminder</label>
                  <Select value={notificationTiming} onValueChange={(v) => setNotificationTiming(v as any)}>
                    <SelectTrigger className="w-full sm:w-[220px]">
                      <SelectValue placeholder="Select reminder timing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1_hour">1 hour before</SelectItem>
                      <SelectItem value="1_day">1 day before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={useDefaultNotificationMessage}
                      onCheckedChange={(v) => setUseDefaultNotificationMessage(!!v)}
                    />
                    <span className="text-sm">Use default message</span>
                  </div>
                  <Textarea
                    placeholder="Write custom notification message"
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    disabled={useDefaultNotificationMessage}
                    className="w-full"
                    rows={3}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">You can customize the reminder message or use a default one that includes event title and time.</p>
            </CardContent>
          </Card> */}

          {/* Quick Preview */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {title || "Event Title"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-muted-foreground">
                    {startDate
                      ? dayjs(startDate).format("MMM D, YYYY")
                      : "No date set"}
                    {startTime && ` at ${startTime}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <Badge variant="secondary" className="text-xs">
                    {eventType === "in-person" && "In-person"}
                    {eventType === "online" && "Online"}
                    {eventType === "hybrid" && "Hybrid"}
                  </Badge>
                </div>
              </div>
              {capacity && (
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-muted-foreground">
                      Max {capacity} attendees
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Form Fields */}
        <div className="lg:col-span-2 space-y-6 max-h-[75svh] overflow-y-scroll">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EventBasicInfo
                title={title}
                description={description}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
              />
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EventDateTime
                startDate={startDate}
                startTime={startTime}
                endTime={endTime}
                timezone={timezone}
                onStartDateChange={setStartDate}
                onStartTimeChange={setStartTime}
                onEndTimeChange={setEndTime}
                onTimezoneChange={setTimezone}
              />
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EventLocation
                eventType={eventType}
                locationAddress={locationAddress}
                onlineMeetingLink={onlineMeetingLink}
                onEventTypeChange={setEventType}
                onLocationAddressChange={setLocationAddress}
                onOnlineMeetingLinkChange={setOnlineMeetingLink}
              />
            </CardContent>
          </Card>

          {/* Discussion Channel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Discussion Channel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EventDiscussion
                discussionLink={discussionLink}
                onDiscussionLinkChange={setDiscussionLink}
              />
            </CardContent>
          </Card>

          {/* Capacity & Registration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Capacity & Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EventCapacity
                capacity={capacity}
                registrationDeadline={registrationDeadline}
                isApproveRequired={isApproveRequired}
                onCapacityChange={setCapacity}
                onRegistrationDeadlineChange={setRegistrationDeadline}
                onIsApproveRequiredChange={setIsApproveRequired}
                eventStartDate={startDate}
              />
            </CardContent>
          </Card>

          {/* Custom Registration Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Registration Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomQuestionsBuilder
                value={customQuestions}
                onChange={setCustomQuestions}
              />
            </CardContent>
          </Card>

          {/* Collaboration - show in edit mode or create mode (collect pending invites) */}
          {(mode === "edit" && eventId) || mode === "create" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users2 className="h-4 w-4" />
                  Collaboration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Invite other communities to co-host this event
                  </p>
                  {(mode === "create" || isHost) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInviteDialog(true)}
                    >
                      <Users2 className="h-4 w-4 mr-2" />
                      Invite Community
                    </Button>
                  )}
                </div>

                {loadingCollaborations ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : (
                  <CollaborationList
                    collaborations={collaborations}
                    isHost={isHost}
                    pendingInvites={pendingInvites}
                    onRemovePending={(communityId) =>
                      setPendingInvites((prev) =>
                        prev.filter((x) => x.id !== communityId),
                      )
                    }
                    onRemove={async (collaborationId) => {
                      try {
                        const formData = new FormData();
                        formData.append("intent", "remove-collaboration");
                        formData.append("collaborationId", collaborationId);

                        const response = await fetch(
                          `/c/${communitySlug}/events/${eventId}/collaboration`,
                          {
                            method: "POST",
                            body: formData,
                          },
                        );

                        const result = await response.json();
                        if (result.success) {
                          toast.success("Collaboration removed");
                          // Reload collaborations
                          const supabase = createClient();
                          const { data: collabs } = await supabase
                            .from("event_collaborations")
                            .select(
                              `
                              *,
                              community:communities!event_collaborations_community_id_fkey (
                                id,
                                name,
                                slug,
                                logo_url
                              )
                            `,
                            )
                            .eq("event_id", eventId)
                            .order("created_at", { ascending: true });

                          if (collabs) {
                            const formatted = collabs.map((c: any) => ({
                              id: c.id,
                              role: c.role as "host" | "co-host",
                              status: c.status as
                                | "pending"
                                | "accepted"
                                | "rejected",
                              invited_at: c.invited_at,
                              accepted_at: c.accepted_at,
                              community: Array.isArray(c.community)
                                ? c.community[0]
                                : c.community,
                            })) as CollaborationWithCommunity[];
                            setCollaborations(formatted);
                          }
                        } else {
                          toast.error(
                            result.error || "Failed to remove collaboration",
                          );
                        }
                      } catch (error) {
                        console.error("Error removing collaboration:", error);
                        toast.error("Failed to remove collaboration");
                      }
                    }}
                  />
                )}

                <CollaborationInviteDialog
                  open={showInviteDialog}
                  onOpenChange={setShowInviteDialog}
                  eventId={mode === "edit" ? eventId : undefined}
                  hostCommunityId={communityId}
                  communitySlug={communitySlug}
                  collectOnly={mode === "create"}
                  onCollect={(community) => {
                    setPendingInvites((prev) =>
                      prev.some((p) => p.id === community.id)
                        ? prev
                        : [...prev, community],
                    );
                  }}
                  onSuccess={async () => {
                    // Reload collaborations
                    const supabase = createClient();
                    const { data: collabs } = await supabase
                      .from("event_collaborations")
                      .select(
                        `
                          *,
                          community:communities!event_collaborations_community_id_fkey (
                            id,
                            name,
                            slug,
                            logo_url
                          )
                        `,
                      )
                      .eq("event_id", eventId)
                      .order("created_at", { ascending: true });

                    if (collabs) {
                      const formatted = collabs.map((c: any) => ({
                        id: c.id,
                        role: c.role as "host" | "co-host",
                        status: c.status as "pending" | "accepted" | "rejected",
                        invited_at: c.invited_at,
                        accepted_at: c.accepted_at,
                        community: Array.isArray(c.community)
                          ? c.community[0]
                          : c.community,
                      })) as CollaborationWithCommunity[];
                      setCollaborations(formatted);
                    }
                  }}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Mobile Submit Buttons */}
      <div className="lg:hidden sticky bottom-0 bg-background border-t p-4 -mx-4 flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={isSubmitting || !isValid()}
          onClick={() => handleSubmit(true)}
        >
          Save as Draft
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={isSubmitting || !isValid()}
          onClick={() => handleSubmit(false)}
        >
          Publish
        </Button>
      </div>
    </div>
  );
}

