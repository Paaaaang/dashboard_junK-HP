import { useEffect, useState } from "react";

/**
 * A hook that returns a debounced version of the provided value.
 * @param value The value to debounce
 * @param delayMs The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debounced;
}
