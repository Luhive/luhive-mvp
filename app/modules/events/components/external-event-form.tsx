import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '~/shared/components/ui/card';
import { Button } from '~/shared/components/ui/button';
import { Separator } from '~/shared/components/ui/separator';
import { Spinner } from '~/shared/components/ui/spinner';
import { Badge } from '~/shared/components/ui/badge';
import { Input } from '~/shared/components/ui/input';
import { Label } from '~/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/shared/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '~/shared/components/ui/alert';
import {
  Save,
  FileText,
  Calendar,
  MapPin,
  Eye,
  MessageCircle,
  ExternalLink,
  Lightbulb,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { EventCoverUpload } from './event-cover-upload';
import { EventBasicInfo } from './event-form-fields/event-basic-info';
import { EventDateTime } from './event-form-fields/event-datetime';
import { EventLocation } from './event-form-fields/event-location';
import { EventDiscussion } from './event-form-fields/event-discussion';
import { createClient } from '~/shared/lib/supabase/client';
import { toast } from 'sonner';
import type { Database } from '~/shared/models/database.types';
import type { ExternalPlatform } from '~/modules/events/model/event.types';
import {
  detectExternalPlatform,
  getExternalPlatformName,
  getExternalPlatformIcon,
  isValidExternalUrl,
  externalPlatformOptions,
} from '~/modules/events/utils/external-platform';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

type EventType = Database['public']['Enums']['event_type'];
type EventStatus = Database['public']['Enums']['event_status'];

interface ExternalEventFormProps {
  communitySlug: string;
  communityId: string;
  eventId?: string;
  mode: 'create' | 'edit';
  initialData?: {
    title?: string;
    description?: string;
    startDate?: Date;
    startTime?: string;
    endTime?: string;
    timezone?: string;
    eventType?: EventType;
    locationAddress?: string;
    onlineMeetingLink?: string;
    discussionLink?: string;
    coverUrl?: string;
    status?: EventStatus;
    externalPlatform?: ExternalPlatform;
    externalRegistrationUrl?: string;
  };
}

export function ExternalEventForm({
  communitySlug,
  communityId,
  eventId,
  mode,
  initialData,
}: ExternalEventFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNudge, setShowNudge] = useState(true);
  const initialRef = useRef(initialData);

  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [startDate, setStartDate] = useState<Date | undefined>(initialData?.startDate);
  const [startTime, setStartTime] = useState(initialData?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '10:00');
  const [timezoneValue, setTimezoneValue] = useState(initialData?.timezone || 'Asia/Baku');
  const [eventType, setEventType] = useState<EventType>(initialData?.eventType || 'in-person');
  const [locationAddress, setLocationAddress] = useState(initialData?.locationAddress || '');
  const [onlineMeetingLink, setOnlineMeetingLink] = useState(initialData?.onlineMeetingLink || '');
  const [discussionLink, setDiscussionLink] = useState(initialData?.discussionLink || '');
  const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl || '');
  const [status, setStatus] = useState<EventStatus>(initialData?.status || 'draft');

  // External registration state
  const [externalPlatform, setExternalPlatform] = useState<ExternalPlatform>(
    initialData?.externalPlatform || 'google_forms'
  );
  const [externalRegistrationUrl, setExternalRegistrationUrl] = useState(
    initialData?.externalRegistrationUrl || ''
  );
  const [urlError, setUrlError] = useState<string | null>(null);

  // Auto-detect platform when URL changes
  useEffect(() => {
    if (externalRegistrationUrl) {
      const detected = detectExternalPlatform(externalRegistrationUrl);
      if (detected !== 'other') {
        setExternalPlatform(detected);
      }
    }
  }, [externalRegistrationUrl]);

  // Validate URL
  useEffect(() => {
    if (externalRegistrationUrl && !isValidExternalUrl(externalRegistrationUrl)) {
      setUrlError('Please enter a valid URL (starting with http:// or https://)');
    } else {
      setUrlError(null);
    }
  }, [externalRegistrationUrl]);

  // Get platform icon component
  const PlatformIcon = getExternalPlatformIcon(externalPlatform);

  // Validation
  const isValid = () => {
    if (!title.trim()) return false;
    if (!startDate) return false;
    if (!startTime) return false;
    if (!externalRegistrationUrl.trim()) return false;
    if (!isValidExternalUrl(externalRegistrationUrl)) return false;

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const submitStatus: EventStatus = isDraft ? 'draft' : 'published';

      // Combine date and time into ISO timestamp with timezone
      const startDateTime = dayjs
        .tz(`${dayjs(startDate).format('YYYY-MM-DD')}T${startTime}`, timezoneValue)
        .toISOString();

      const endDateTime = endTime
        ? dayjs
            .tz(`${dayjs(startDate).format('YYYY-MM-DD')}T${endTime}`, timezoneValue)
            .toISOString()
        : null;

      // Prepare event data
      const eventData = {
        community_id: communityId,
        created_by: user.id,
        title,
        description: description || null,
        start_time: startDateTime,
        end_time: endDateTime,
        timezone: timezoneValue,
        event_type: eventType,
        location_address: locationAddress || null,
        online_meeting_link: onlineMeetingLink || null,
        discussion_link: discussionLink.trim() || null,
        cover_url: coverUrl || null,
        status: submitStatus,
        // External registration fields
        registration_type: 'external',
        external_platform: externalPlatform,
        external_registration_url: externalRegistrationUrl.trim(),
        // Set these to null for external events
        capacity: null,
        registration_deadline: null,
        is_approve_required: false,
        custom_questions: null,
      };

      if (mode === 'create') {
        // Insert new event
        const { error } = await supabase.from('events').insert(eventData);

        if (error) {
          console.error('Error creating event:', error);
          toast.error(error.message || 'Failed to create event');
          return;
        }

        toast.success(`External event ${isDraft ? 'saved as draft' : 'published'} successfully!`);
        navigate(`/dashboard/${communitySlug}/events`);
      } else if (mode === 'edit' && eventId) {
        // Update existing event
        const { error } = await supabase.from('events').update(eventData).eq('id', eventId);

        if (error) {
          console.error('Error updating event:', error);
          toast.error(error.message || 'Failed to update event');
          return;
        }

        // For external events, also notify attendees if only schedule/location changed
        const submitStatus: EventStatus = isDraft ? 'draft' : 'published';
        const initial = initialRef.current;

        if (submitStatus === 'published' && initial) {
          const sameDate = (a?: Date, b?: Date) => {
            if (!a && !b) return true;
            if (!a || !b) return false;
            return dayjs(a).isSame(dayjs(b), 'day');
          };

          const sameOrDefault = (a: string | undefined, b: string | undefined, fallback: string) =>
            (a || fallback) === (b || fallback);

          const nonScheduleChanged =
            (initial.title || '') !== title ||
            (initial.description || '') !== description ||
            (initial.eventType || 'in-person') !== eventType ||
            (initial.discussionLink || '') !== discussionLink ||
            (initial.coverUrl || '') !== coverUrl ||
            (initial.timezone || 'Asia/Baku') !== timezoneValue;

          const scheduleChanged =
            !sameDate(initial.startDate, startDate) ||
            !sameOrDefault(initial.startTime, startTime, '09:00') ||
            !sameOrDefault(initial.endTime, endTime, '10:00') ||
            (initial.locationAddress || '') !== locationAddress ||
            (initial.onlineMeetingLink || '') !== onlineMeetingLink;

          if (!nonScheduleChanged && scheduleChanged) {
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
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {mode === 'create' ? 'Create External Event' : 'Edit External Event'}
              </h1>
              <Badge variant="outline" className="border-primary/50 bg-primary/5 text-primary">
                <ExternalLink className="h-3 w-3 mr-1" />
                External Registration
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'create'
                ? 'Create an event with registration on an external platform'
                : 'Update external event information'}
            </p>
          </div>
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
                Publish External Event
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Conversion Nudge */}
      {showNudge && (
        <Alert className="bg-primary/5 border-primary/20">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary text-md">Tip: Get more from Luhive</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Switch to Luhive registration to get automatic analytics, email reminders, and attendee
            management.{' '}
            <Button
              variant="link"
              className="h-auto p-0 text-primary"
              onClick={() => navigate(`/dashboard/${communitySlug}/events/create`)}
            >
              Create with Luhive Registration →
            </Button>
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => setShowNudge(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

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
                isCreating={mode === 'create'}
              />
            </CardContent>
          </Card>

          {/* Quick Preview */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{title || 'Event Title'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-muted-foreground">
                    {startDate ? dayjs(startDate).format('MMM D, YYYY') : 'No date set'}
                    {startTime && ` at ${startTime}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <Badge variant="secondary" className="text-xs">
                    {eventType === 'in-person' && 'In-person'}
                    {eventType === 'online' && 'Online'}
                    {eventType === 'hybrid' && 'Hybrid'}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-2">
                <PlatformIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-xs">
                    Registration on {getExternalPlatformName(externalPlatform)}
                  </p>
                </div>
              </div>
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
                timezone={timezoneValue}
                onStartDateChange={setStartDate}
                onStartTimeChange={setStartTime}
                onEndTimeChange={setEndTime}
                onTimezoneChange={setTimezoneValue}
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

          {/* External Registration */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                External Registration
                <Badge
                  variant="outline"
                  className="ml-2 border-primary/50 bg-primary/5 text-primary"
                >
                  Required
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Users will be redirected to your external form to register for this event.
              </p>

              {/* Platform Selector */}
              <div className="space-y-2">
                <Label htmlFor="external-platform">Registration Platform</Label>
                <Select
                  value={externalPlatform}
                  onValueChange={(value) => setExternalPlatform(value as ExternalPlatform)}
                >
                  <SelectTrigger id="external-platform">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {externalPlatformOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="external-url">Registration Form URL</Label>
                <Input
                  id="external-url"
                  type="url"
                  placeholder="https://forms.gle/xxxxx or https://forms.office.com/xxxxx"
                  value={externalRegistrationUrl}
                  onChange={(e) => setExternalRegistrationUrl(e.target.value)}
                  className={urlError ? 'border-red-500' : ''}
                />
                {urlError ? (
                  <p className="text-xs text-red-500">{urlError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Paste the link where people can register for this event
                  </p>
                )}
              </div>

              {/* URL Preview */}
              {externalRegistrationUrl && isValidExternalUrl(externalRegistrationUrl) && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <PlatformIcon className="h-5 w-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {getExternalPlatformName(externalPlatform)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {externalRegistrationUrl}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={externalRegistrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Test
                    </a>
                  </Button>
                </div>
              )}
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

          {/* Info Box */}
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertTitle>External Registration Note</AlertTitle>
            <AlertDescription>
              This event uses external registration. Registration counts must be updated manually if
              you want to display them on the event page.
            </AlertDescription>
          </Alert>
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

