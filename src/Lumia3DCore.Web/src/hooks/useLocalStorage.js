// Tiny localStorage-backed state hook.
// Persists JSON-serializable state under a namespaced key so refresh keeps tweaks.

import { useEffect, useState, useCallback } from 'react';

const NS = 'lumia3d';

export function useLocalStorage(key, initial) {
  const fullKey = `${NS}:${key}`;
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(fullKey);
      if (raw == null) return initial;
      const parsed = JSON.parse(raw);
      // Shallow-merge defaults so newly-added keys aren't undefined.
      if (initial && typeof initial === 'object' && !Array.isArray(initial)) {
        return { ...initial, ...parsed };
      }
      return parsed;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(fullKey, JSON.stringify(value));
    } catch {
      /* quota / private mode — ignore */
    }
  }, [fullKey, value]);

  const reset = useCallback(() => setValue(initial), [initial]);

  return [value, setValue, reset];
}
