import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce any fast-changing value by a specified delay.
 * Useful for search inputs to prevent flooding APIs with requests on every keystroke.
 *
 * @param value The value to debounce (e.g. search query)
 * @param delay Time in milliseconds to wait after the last change before updating (default: 350ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
