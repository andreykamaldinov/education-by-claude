import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { LocalStorageService } from '../storage/local-storage.service';

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

const STORAGE_KEY = 'theme';

const isThemePreference = (value: unknown): value is ThemePreference =>
  THEME_PREFERENCES.some((preference) => preference === value);

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(LocalStorageService);
  private readonly systemPrefersDark = signal(this.queryPrefersDark());

  readonly preference = signal<ThemePreference>(this.readPreference());
  readonly resolved = computed<ResolvedTheme>(() => {
    const preference = this.preference();
    if (preference !== 'system') {
      return preference;
    }
    return this.systemPrefersDark() ? 'dark' : 'light';
  });

  constructor() {
    this.watchSystemTheme();
    effect(() => {
      this.document.documentElement.dataset['theme'] = this.resolved();
      this.storage.write(STORAGE_KEY, this.preference());
    });
  }

  toggle(): void {
    this.preference.set(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  private readPreference(): ThemePreference {
    const stored = this.storage.read(STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  }

  private queryPrefersDark(): boolean {
    return this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  private watchSystemTheme(): void {
    const media = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
    media?.addEventListener('change', (event) => this.systemPrefersDark.set(event.matches));
  }
}
