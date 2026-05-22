export interface StorefrontPrimitiveState {
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
}

export const STOREFRONT_UI_CLASSNAMES = {
  container: 'sf-container',
  section: 'sf-section',
  card: 'sf-card',
  button: 'sf-button'
} as const;
