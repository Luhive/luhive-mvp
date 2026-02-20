import { Label } from '~/shared/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '~/shared/components/ui/toggle-group';
import { InputGroup, InputGroupAddon, InputGroupInput } from '~/shared/components/ui/input-group';
import { MapPin, Video, Combine } from 'lucide-react';
import type { Database } from '~/shared/models/database.types';

type EventType = Database['public']['Enums']['event_type'];

interface EventLocationProps {
  eventType: EventType;
  locationAddress?: string;
  onlineMeetingLink?: string;
  onEventTypeChange: (type: EventType) => void;
  onLocationAddressChange: (address: string) => void;
  onOnlineMeetingLinkChange: (link: string) => void;
}

export function EventLocation({
  eventType,
  locationAddress = '',
  onlineMeetingLink = '',
  onEventTypeChange,
  onLocationAddressChange,
  onOnlineMeetingLinkChange,
}: EventLocationProps) {
  const showPhysicalLocation = eventType === 'in-person' || eventType === 'hybrid';
  const showOnlineLink = eventType === 'online' || eventType === 'hybrid';

  return (
    <div className="space-y-4">
      {/* Event Type Toggle */}
      <div className="space-y-2">
        <Label>Event Type *</Label>
        <ToggleGroup
          type="single"
          value={eventType}
          onValueChange={(value) => {
            if (value) onEventTypeChange(value as EventType);
          }}
          className="justify-start bg-muted"
        >
          <ToggleGroupItem value="in-person" aria-label="In-person event" className="gap-2">
            <MapPin className="h-4 w-4" />
            In-person
          </ToggleGroupItem>
          <ToggleGroupItem value="online" aria-label="Online event" className="gap-2">
            <Video className="h-4 w-4" />
            Online
          </ToggleGroupItem>
          <ToggleGroupItem value="hybrid" aria-label="Hybrid event" className="gap-2">
            <Combine className="h-4 w-4" />
            Hybrid
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Physical Location */}
      {showPhysicalLocation && (
        <div className="space-y-2">
          <Label htmlFor="location-address">
            Physical Location {eventType === 'in-person' ? '*' : ''}
          </Label>
          <InputGroup>
            <InputGroupAddon>
              <MapPin className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="location-address"
              value={locationAddress}
              onChange={(e) => onLocationAddressChange(e.target.value)}
              placeholder="Enter venue address"
              required={eventType === 'in-person'}
            />
          </InputGroup>
        </div>
      )}

      {/* Online Meeting Link */}
      {showOnlineLink && (
        <div className="space-y-2">
          <Label htmlFor="online-meeting-link">
            Online Meeting Link {eventType === 'online' ? '*' : ''}
          </Label>
          <InputGroup>
            <InputGroupAddon>
              <Video className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="online-meeting-link"
              type="url"
              value={onlineMeetingLink}
              onChange={(e) => onOnlineMeetingLinkChange(e.target.value)}
              placeholder="https://zoom.us/j/... or Google Meet link"
              required={eventType === 'online'}
            />
          </InputGroup>
          <p className="text-xs text-muted-foreground">
            Zoom, Google Meet, Microsoft Teams, or any other meeting platform link
          </p>
        </div>
      )}
    </div>
  );
}

