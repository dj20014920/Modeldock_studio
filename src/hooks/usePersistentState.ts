import { useState, useCallback } from 'react';

/**
 * usePersistentState
 * 
 * A custom hook that manages state synchronized with localStorage.
 * It includes error handling for parsing JSON and fallback to initial values.
 * 
 * @param key The localStorage key
 * @param initialValue The default value if nothing is in storage
 */
export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // 1. Initialize state lazily
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`[usePersistentState] Error reading key "${key}":`, error);
      return initialValue;
    }
  });

  // 2. Wrap setState to sync with localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`[usePersistentState] Error setting key "${key}":`, error);
    }
  }, [key, state]);

  // 3. Optional: Listen for storage events (sync across tabs if needed)
  // omitted for simplicity in this extension context, but good for future scalability.

  return [state, setValue];
}
