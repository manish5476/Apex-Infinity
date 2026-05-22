export interface StorefrontThemeTokens {
  mode?: 'auto' | 'light' | 'dark' | 'glass';
  primary?: string;
  accent?: string;
  background?: string;
  headingFont?: string;
  bodyFont?: string;
}

export function storefrontThemeStyle(tokens: StorefrontThemeTokens = {}): Record<string, string> {
  return {
    '--sf-color-primary': tokens.primary ?? '',
    '--sf-color-accent': tokens.accent ?? '',
    '--sf-color-canvas': tokens.background ?? '',
    '--sf-font-heading': tokens.headingFont ?? '',
    '--sf-font-body': tokens.bodyFont ?? ''
  };
}
