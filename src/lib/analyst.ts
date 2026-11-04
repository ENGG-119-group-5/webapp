"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * The analyst's display name. There is no auth in the MVP; this name is sent
 * with score overrides and match decisions so the audit log records who acted.
 */
const STORAGE_KEY = "vcdd.analystName";
const CHANGE_EVENT = "vcdd:analyst-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function read(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function useAnalyst(): [string, (name: string) => void] {
  const name = useSyncExternalStore(subscribe, read, () => "");
  const setName = useCallback((value: string) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* storage unavailable (private mode); the name just won't persist */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return [name, setName];
}
