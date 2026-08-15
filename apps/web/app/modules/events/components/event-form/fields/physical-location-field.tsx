import { useRef, useState } from 'react';
import { Label } from '~/shared/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupInput } from '~/shared/components/ui/input-group';
import { MapPin, Loader2 } from 'lucide-react';
import { usePlaceAutocomplete } from '~/modules/events/hooks/use-place-autocomplete';
import { LocationMapPreview } from '~/modules/events/components/event-form/fields/location-map-preview';
import type { LocationValue } from '~/modules/events/model/event-location.types';

interface PhysicalLocationFieldProps {
  location: LocationValue | null;
  legacyAddress?: string;
  onLocationChange: (value: LocationValue | null) => void;
  label?: string;
  required?: boolean;
}

export function PhysicalLocationField({
  location,
  legacyAddress,
  onLocationChange,
  label = 'Event Location',
  required = false,
}: PhysicalLocationFieldProps) {
  const { query, setQuery, suggestions, isLoading, select, reset } = usePlaceAutocomplete();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    setDropdownOpen(false);
    try {
      const resolved = await select(suggestion);
      onLocationChange(resolved);
    } catch {
      // Keep previous value if resolution fails
    }
  };

  const handleClear = () => {
    onLocationChange(null);
    reset();
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="event-location">
        {label}
        {required ? ' *' : ''}
      </Label>

      {location ? (
        <LocationMapPreview location={location} onClear={handleClear} mapHeight={200} />
      ) : (
        <>
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
                id="event-location"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setDropdownOpen(true);
                }}
                onBlur={() => {
                  setTimeout(() => setDropdownOpen(false), 150);
                }}
                placeholder="What's the address?"
                autoComplete="off"
              />
            </InputGroup>

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

          {legacyAddress && (
            <p className="text-xs text-muted-foreground">
              Current address: {legacyAddress}. Search above to upgrade to a mapped location.
            </p>
          )}
        </>
      )}
    </div>
  );
}
