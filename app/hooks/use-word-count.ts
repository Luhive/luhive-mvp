import { useState, useCallback } from "react";
import { countWords } from "~/lib/utils/text";

/**
 * React hook for tracking the word count of a text value.
 *
 * Returns the current word count and an `onChange` handler that can be passed
 * directly to inputs/textareas.
 */
export function useWordCount<T extends HTMLInputElement | HTMLTextAreaElement>() {
  const [wordCount, setWordCount] = useState(0);

  const handleChange = useCallback(
    (event: React.ChangeEvent<T>) => {
      const value = event.target.value;
      setWordCount(countWords(value));
    },
    []
  );

  return { wordCount, handleChange, setWordCount };
}

