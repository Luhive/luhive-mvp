import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMaps } from '~/modules/events/utils/google-maps';
import type { LocationValue } from '~/modules/events/model/event-location.types';

interface UsePlaceAutocompleteReturn {
  query: string;
  setQuery: (value: string) => void;
  suggestions: google.maps.places.AutocompleteSuggestion[];
  isLoading: boolean;
  select: (suggestion: google.maps.places.AutocompleteSuggestion) => Promise<LocationValue>;
  reset: () => void;
}

const DEBOUNCE_MS = 300;

/**
 * Manages the full autocomplete lifecycle:
 *  - debounced suggestion fetching via GoogleMaps util
 *  - session token creation and rotation after each place resolution
 *  - loading/error state isolation so the field component stays presentational
 */
export function usePlaceAutocomplete(
  locationBias?: google.maps.places.LocationBias,
): UsePlaceAutocompleteReturn {
  const [query, setQueryState] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const tokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureToken = useCallback(async () => {
    if (!tokenRef.current) {
      tokenRef.current = await GoogleMaps.createSessionToken();
    }
    return tokenRef.current;
  }, []);

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value.trim()) {
        setSuggestions([]);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const token = await ensureToken();
          const results = await GoogleMaps.getSuggestions(value, token, locationBias);
          setSuggestions(results);
        } finally {
          setIsLoading(false);
        }
      }, DEBOUNCE_MS);
    },
    [ensureToken, locationBias],
  );

  const select = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion): Promise<LocationValue> => {
      const token = await ensureToken();
      const place = await GoogleMaps.resolvePlace(suggestion, token);
      // Rotate token after a completed session (autocomplete → place details)
      tokenRef.current = null;
      setSuggestions([]);
      setQueryState('');
      return place;
    },
    [ensureToken],
  );

  const reset = useCallback(() => {
    setQueryState('');
    setSuggestions([]);
    tokenRef.current = null;
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { query, setQuery, suggestions, isLoading, select, reset };
}
