import { X, MapPin } from 'lucide-react';
import { GoogleMaps } from '~/modules/events/utils/google-maps';
import type { LocationValue } from '~/modules/events/model/event-location.types';

interface LocationMapPreviewProps {
  location: LocationValue;
  /** Render the dismiss (X) button — omit on the public event detail page */
  onClear?: () => void;
  /** Height of the embedded map iframe (default 200px) */
  mapHeight?: number;
}

/**
 * Presentational card: venue name + address header, optional clear button,
 * and a free Maps Embed API iframe with a location pin.
 * Used by the event form (with onClear) and the event detail page (without).
 */
export function LocationMapPreview({
  location,
  onClear,
  mapHeight = 200,
}: LocationMapPreviewProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      {/* Header: name + address + optional clear */}
      <div className="flex items-start justify-between gap-2 px-3 py-2.5 bg-muted/40">
        <div className="flex items-start gap-2 min-w-0">
          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{location.name}</p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5 line-clamp-2">
              {location.address}
            </p>
          </div>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Clear location"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Embedded map — free Maps Embed API, unlimited loads */}
      <iframe
        src={GoogleMaps.embedUrl(location)}
        width="100%"
        height={mapHeight}
        style={{ border: 0, display: 'block' }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Map of ${location.name}`}
      />
    </div>
  );
}
