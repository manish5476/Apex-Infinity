import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { GlobalSettings, ThemeOverride } from '@core/models/storefront.model';

export interface RuntimeThemeInput {
  settings?: GlobalSettings | null;
  override?: ThemeOverride | null;
  dark?: boolean;
}

export interface RuntimeThemeSnapshot {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  fontFamily: string;
  dark: boolean;
}

const DEFAULT_THEME: RuntimeThemeSnapshot = {
  primary: '#2563eb',
  secondary: '#111827',
  accent: '#14b8a6',
  background: '#f7f8fb',
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  dark: false
};

@Injectable({ providedIn: 'root' })
export class ThemeEngineService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly input = signal<RuntimeThemeInput>({});

  readonly theme = computed<RuntimeThemeSnapshot>(() => {
    const next = this.input();
    const colors = next.settings?.colors;
    const custom = next.override?.customSettings;
    const dark = next.dark ?? false;

    return {
      primary: custom?.primaryColor ?? colors?.primary ?? DEFAULT_THEME.primary,
      secondary: custom?.secondaryColor ?? colors?.secondary ?? DEFAULT_THEME.secondary,
      accent: colors?.accent ?? DEFAULT_THEME.accent,
      background: custom?.backgroundColor ?? (dark ? '#09090b' : DEFAULT_THEME.background),
      fontFamily: custom?.fontFamily ?? next.settings?.typography?.bodyFont ?? DEFAULT_THEME.fontFamily,
      dark
    };
  });

  readonly styleMap = computed<Record<string, string>>(() => {
    const theme = this.theme();
    return {
      '--primary': theme.primary,
      '--secondary': theme.secondary,
      '--bg-page': theme.background,
      '--apx-color-primary': theme.primary,
      '--apx-color-secondary': theme.secondary,
      '--apx-color-accent': theme.accent,
      '--apx-color-canvas': theme.background,
      '--apx-font-sans': theme.fontFamily,
      '--glass-border': theme.dark ? 'rgba(255,255,255,0.14)' : 'rgba(17,24,39,0.08)'
    };
  });

  constructor() {
    effect(() => {
      const theme = this.theme();
      if (!isPlatformBrowser(this.platformId)) return;
      this.document.documentElement.classList.toggle('apx-theme-dark', theme.dark);
      this.document.documentElement.style.setProperty('--apx-tenant-primary', theme.primary);
      this.document.documentElement.style.setProperty('--apx-tenant-accent', theme.accent);
    });
  }

  apply(input: RuntimeThemeInput): void {
    this.input.set(input);
  }
}
