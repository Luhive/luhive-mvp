import { useRef, useState } from 'react';
import { Label } from '~/shared/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '~/shared/components/ui/toggle-group';
import { InputGroup, InputGroupAddon, InputGroupInput } from '~/shared/components/ui/input-group';
import { MapPin, Video, Combine, Loader2 } from 'lucide-react';
import { usePlaceAutocomplete } from '~/modules/events/hooks/use-place-autocomplete';
import { LocationMapPreview } from '~/modules/events/components/event-form/fields/location-map-preview';
import type { LocationValue } from '~/modules/events/model/event-location.types';
import type { Database } from '~/shared/models/database.types';

type EventType = Database['public']['Enums']['event_type'];

interface EventLocationProps {
  eventType: EventType;
  location: LocationValue | null;
  /** Legacy plain-text address for events created before structured data (read-only fallback) */
  legacyAddress?: string;
  onlineMeetingLink?: string;
  onEventTypeChange: (type: EventType) => void;
  onLocationChange: (value: LocationValue | null) => void;
  onOnlineMeetingLinkChange: (link: string) => void;
}

export function EventLocation({
  eventType,
  location,
  legacyAddress,
  onlineMeetingLink = '',
  onEventTypeChange,
  onLocationChange,
  onOnlineMeetingLinkChange,
}: EventLocationProps) {
  const showPhysicalLocation = eventType === 'in-person' || eventType === 'hybrid';
  const showOnlineLink = eventType === 'online' || eventType === 'hybrid';

  const { query, setQuery, suggestions, isLoading, select, reset } = usePlaceAutocomplete();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    setDropdownOpen(false);
    try {
      const resolved = await select(suggestion);
      onLocationChange(resolved);
    } catch {
      // If resolution fails, leave previous value intact
    }
  };

  const handleClear = () => {
    onLocationChange(null);
    reset();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setDropdownOpen(true);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) setDropdownOpen(true);
  };

  const handleInputBlur = () => {
    // Delay so clicks on dropdown items register before closing
    setTimeout(() => setDropdownOpen(false), 150);
  };

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

          {/* Show map preview when a structured place is selected */}
          {location ? (
            <LocationMapPreview location={location} onClear={handleClear} mapHeight={200} />
          ) : (
            <>
              {/* Autocomplete input */}
              <div className="relative">
                <InputGroup>
                  <InputGroupAddon>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                  </InputGroupAddon>
                  <InputGroupInput
                    ref={inputRef}
                    id="location-address"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Search for a venue or address"
                    autoComplete="off"
                  />
                </InputGroup>

                {/* Suggestions dropdown */}
                {dropdownOpen && suggestions.length > 0 && (
                  <ul
                    role="listbox"
                    className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden"
                  >
                    {suggestions.map((s, idx) => {
                      const pred = s.placePrediction;
                      if (!pred) return null;
                      const mainText = pred.mainText?.toString() ?? '';
                      const secondaryText = pred.secondaryText?.toString() ?? '';
                      return (
                        <li
                          key={pred.placeId ?? idx}
                          role="option"
                          aria-selected={false}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelect(s);
                          }}
                          className="flex cursor-pointer items-start gap-2 px-3 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                          <span className="min-w-0">
                            <span className="font-medium">{mainText}</span>
                            {secondaryText && (
                              <span className="block text-xs text-muted-foreground truncate">
                                {secondaryText}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Legacy read-only fallback for events without a place_id */}
              {legacyAddress && (
                <p className="text-xs text-muted-foreground">
                  Current address: {legacyAddress}. Search above to upgrade to a mapped location.
                </p>
              )}
            </>
          )}
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
