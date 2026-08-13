import { useState, useCallback } from "react";
import { countWords } from "~/shared/lib/utils/text";

/**
 * React hook for tracking the word count of a text value.
 *
 * Returns the current word count and an `onChange` handler that can be passed
 * directly to inputs/textareas.
 *
 * `initialValue` seeds the count for uncontrolled fields rendered with a
 * `defaultValue`, so the counter and the field start from the same snapshot.
 */
export function useWordCount<T extends HTMLInputElement | HTMLTextAreaElement>(
  initialValue: string = ""
) {
  const [wordCount, setWordCount] = useState(() => countWords(initialValue));

  const handleChange = useCallback(
    (event: React.ChangeEvent<T>) => {
      const value = event.target.value;
      setWordCount(countWords(value));
    },
    []
  );

  return { wordCount, handleChange, setWordCount };
}
