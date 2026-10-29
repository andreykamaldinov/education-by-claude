import { Injectable } from '@angular/core';

const NAMESPACE = 'devshelf';

/**
 * Thin, failure-tolerant wrapper over localStorage.
 * Private windows, disabled cookies and SSR all make storage throw or vanish,
 * so every call degrades to "nothing stored" instead of breaking the page.
 * Values come back as `unknown`: callers validate at the boundary.
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  read(key: string): unknown {
    try {
      const raw = globalThis.localStorage?.getItem(`${NAMESPACE}:${key}`);
      return raw == null ? undefined : JSON.parse(raw);
    } catch {
      return undefined;
    }
  }

  write(key: string, value: unknown): void {
    try {
      globalThis.localStorage?.setItem(`${NAMESPACE}:${key}`, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage disabled: progress simply stays in memory.
    }
  }
}
