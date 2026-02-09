import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Spinner } from '~/components/ui/spinner';
import { Badge } from '~/components/ui/badge';
import { Save, FileText, Calendar, MapPin, Users, Eye, MessageCircle, HelpCircle } from 'lucide-react';
import { EventCoverUpload } from './event-cover-upload';
import { EventBasicInfo } from './event-form-fields/event-basic-info';
import { EventDateTime } from './event-form-fields/event-datetime';
import { EventLocation } from './event-form-fields/event-location';
import { EventCapacity } from './event-form-fields/event-capacity';
import { EventDiscussion } from './event-form-fields/event-discussion';
import { CustomQuestionsBuilder } from './custom-questions-builder';
import { createClient } from '~/lib/supabase.client';
import { toast } from 'sonner';
import type { Database } from '~/models/database.types';
import type { CustomQuestionJson } from '~/models/event.types';
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
      };

      if (mode === 'create') {
        // Insert new event
        const { error } = await supabase
          .from('events')
          .insert(eventData);

        if (error) {
          console.error('Error creating event:', error);
          toast.error(error.message || 'Failed to create event');
          return;
        }

        toast.success(`Event ${isDraft ? 'saved as draft' : 'published'} successfully!`);
        navigate(`/dashboard/${communitySlug}/events`);
      } else if (mode === 'edit' && eventId) {
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
            {mode === 'create' ? 'Create Event' : 'Edit Event'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'create'
              ? 'Fill in the details to create a new event'
              : 'Update event information'}
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
              {capacity && (
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-muted-foreground">Max {capacity} attendees</p>
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

