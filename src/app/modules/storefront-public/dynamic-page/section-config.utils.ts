import { PublicProduct } from '@core/models/storefront.model';
import { PADDING_MAP, SectionProduct } from './section.types';

type UnknownRecord = Record<string, unknown>;

export interface NormalizedTypography {
  headingText?: string;
  subText?: string;
  headingFont: string;
  bodyFont: string;
  headingColor: string;
  bodyColor: string;
  headingSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'display';
  fontWeight?: string | number;
  letterSpacing?: string;
  lineHeight?: string | number;
  textTransform?: string;
  alignment: 'left' | 'center' | 'right';
}

export interface NormalizedDesign {
  customBackground?: string;
  overlayColor?: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  boxShadow: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface NormalizedSectionConfig {
  typography: NormalizedTypography;
  design: NormalizedDesign;
}

const DEFAULT_TYPOGRAPHY: NormalizedTypography = {
  headingFont: 'var(--font-heading)',
  bodyFont: 'var(--font-body)',
  headingColor: 'var(--text-primary, var(--theme-text-primary, #111827))',
  bodyColor: 'var(--text-secondary, var(--theme-text-secondary, #4b5563))',
  headingSize: 'lg',
  alignment: 'left',
};

const DEFAULT_DESIGN: NormalizedDesign = {
  borderRadius: 'none',
  boxShadow: 'none',
};

export const FONT_FAMILY_OPTIONS = [
  'Inter',
  'Poppins',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Nunito Sans',
  'Manrope',
  'DM Sans',
  'Source Sans 3',
  'Work Sans',
  'Raleway',
  'Playfair Display',
  'Merriweather',
  'Oswald',
  'Ubuntu',
  'Rubik',
  'Plus Jakarta Sans',
  'Noto Sans',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'system-ui',
  'serif',
  'sans-serif',
  'Space Grotesk',
  'Syne',
  'Outfit',
  'Clash Display',
  'Cormorant Garamond',
  'Cinzel'
] as const;

const FONT_FAMILY_SET = new Set<string>(FONT_FAMILY_OPTIONS.map(font => font.toLowerCase()));

export function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

export function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function asNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeTypography(config: unknown): NormalizedTypography {
  const cfg = asRecord(config);
  const typography = asRecord(cfg['typography']);
  const legacyTitle = firstString(
    typography['headingText'],
    typography['title'],
    typography['heading'],
    cfg['headingText'],
    cfg['title'],
    cfg['heading']
  );
  const legacySubText = firstString(
    typography['subText'],
    typography['subHeadingText'],
    typography['subtitle'],
    typography['bodyText'],
    cfg['subHeadingText'],
    cfg['subtitle'],
    cfg['description']
  );
  const alignment = firstString(typography['alignment'], cfg['alignment']);

  return {
    ...DEFAULT_TYPOGRAPHY,
    headingText: legacyTitle,
    subText: legacySubText,
    headingFont: normalizeFont(firstString(typography['headingFont'], typography['fontFamily'], cfg['headingFont']), DEFAULT_TYPOGRAPHY.headingFont),
    bodyFont: normalizeFont(firstString(typography['bodyFont'], typography['fontFamily'], cfg['bodyFont']), DEFAULT_TYPOGRAPHY.bodyFont),
    headingColor: normalizeColor(firstString(typography['headingColor'], typography['titleColor'], cfg['headingColor'])) ?? DEFAULT_TYPOGRAPHY.headingColor,
    bodyColor: normalizeColor(firstString(typography['bodyColor'], typography['textColor'], cfg['bodyColor'])) ?? DEFAULT_TYPOGRAPHY.bodyColor,
    headingSize: normalizeHeadingSize(firstString(typography['headingSize'], typography['fontSize'], cfg['headingSize'])),
    fontWeight: asString(typography['fontWeight']) ?? asNumber(typography['fontWeight']),
    letterSpacing: asString(typography['letterSpacing']),
    lineHeight: asString(typography['lineHeight']) ?? asNumber(typography['lineHeight']),
    textTransform: asString(typography['textTransform']),
    alignment: alignment === 'left' || alignment === 'center' || alignment === 'right' ? alignment : DEFAULT_TYPOGRAPHY.alignment,
  };
}

export function normalizeDesign(config: unknown): NormalizedDesign {
  const cfg = asRecord(config);
  const design = asRecord(cfg['design']);
  const borderRadius = firstString(design['borderRadius'], cfg['borderRadius']);
  const boxShadow = firstString(design['boxShadow'], cfg['boxShadow']);

  return {
    ...DEFAULT_DESIGN,
    customBackground: normalizeColor(firstString(design['customBackground'], cfg['backgroundColor'])),
    overlayColor: normalizeColor(firstString(design['overlayColor'], cfg['overlayColor'])),
    borderRadius: normalizeToken(borderRadius, ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'], DEFAULT_DESIGN.borderRadius),
    boxShadow: normalizeToken(boxShadow, ['none', 'sm', 'md', 'lg', 'xl'], DEFAULT_DESIGN.boxShadow),
  };
}

export function normalizeSectionConfig(config: unknown): NormalizedSectionConfig {
  return {
    typography: normalizeTypography(config),
    design: normalizeDesign(config),
  };
}

export function resolveSectionTitle(config: unknown, fallback: string): string {
  return normalizeTypography(config).headingText ?? fallback;
}

export function resolveSectionSubtitle(config: unknown, fallback = ''): string {
  return normalizeTypography(config).subText ?? fallback;
}

export function sectionPaddingStyles(config: unknown, fallback: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md'): Record<string, string> {
  const cfg = asRecord(config);
  const top = asString(cfg['paddingTop']) ?? fallback;
  const bottom = asString(cfg['paddingBottom']) ?? fallback;

  return {
    'padding-top': PADDING_MAP[top] ?? PADDING_MAP[fallback] ?? PADDING_MAP['md'],
    'padding-bottom': PADDING_MAP[bottom] ?? PADDING_MAP[fallback] ?? PADDING_MAP['md'],
  };
}

export function headingStyle(config: unknown, overrides: Record<string, string | number | undefined> = {}): Record<string, string | number> {
  const typography = normalizeTypography(config);
  return compactStyle({
    'font-family': typography.headingFont,
    'color': typography.headingColor,
    'font-weight': typography.fontWeight,
    'letter-spacing': typography.letterSpacing,
    'line-height': typography.lineHeight,
    'text-transform': typography.textTransform,
    ...overrides,
  });
}

export function bodyStyle(config: unknown, overrides: Record<string, string | number | undefined> = {}): Record<string, string | number> {
  const typography = normalizeTypography(config);
  return compactStyle({
    'font-family': typography.bodyFont,
    'color': typography.bodyColor,
    ...overrides,
  });
}

export function toPublicProduct(product: Partial<SectionProduct> & UnknownRecord): PublicProduct {
  const price = asRecord(product['price']);
  const stock = asRecord(product['stock']);
  const quantity = asNumber(stock['quantity']) ?? 0;
  const original = asNumber(price['original']) ?? asNumber(price['current']) ?? 0;
  const current = asNumber(price['current']) ?? original;
  const hasDiscount = Boolean(price['hasDiscount']) || current < original;

  return {
    id: asString(product['id']) ?? asString(product['_id']) ?? '',
    name: asString(product['name']) ?? 'Untitled product',
    slug: asString(product['slug']) ?? asString(product['id']) ?? '',
    sku: asString(product['sku']) ?? null,
    image: asString(product['image']) ?? firstString(...asArray(product['images'])) ?? null,
    images: asArray(product['images']).filter((image): image is string => typeof image === 'string'),
    tags: asArray(product['tags']).filter((tag): tag is string => typeof tag === 'string'),
    price: {
      original,
      current,
      hasDiscount,
      discountPercentage: asNumber(price['discountPercentage']) ?? (hasDiscount && original ? Math.round(((original - current) / original) * 100) : 0),
      currency: asString(price['currency']) ?? 'INR',
      taxRate: asNumber(price['taxRate']) ?? 0,
      isTaxInclusive: Boolean(price['isTaxInclusive']),
    },
    stock: {
      available: typeof stock['available'] === 'boolean' ? stock['available'] : quantity > 0,
      quantity,
      status: stock['status'] === 'low_stock' || stock['status'] === 'out_of_stock' || stock['status'] === 'in_stock'
        ? stock['status']
        : quantity <= 0 ? 'out_of_stock' : quantity < 5 ? 'low_stock' : 'in_stock',
    },
    category: asString(product['category']) ?? null,
    categorySlug: asString(product['categorySlug']) ?? null,
    brand: asString(product['brand']) ?? null,
    brandSlug: asString(product['brandSlug']) ?? null,
  };
}

function firstString(...values: unknown[]): string | undefined {
  return values.map(asString).find(Boolean);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeHeadingSize(value: string | undefined): NormalizedTypography['headingSize'] {
  return normalizeToken(value, ['sm', 'md', 'lg', 'xl', '2xl', 'display'], DEFAULT_TYPOGRAPHY.headingSize);
}

function normalizeToken<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizeFont(value: string | undefined, fallback: string): string {
  const font = value?.trim();
  if (!font) return fallback;
  if (font.startsWith('var(--') && font.endsWith(')')) return font;

  const lower = font.replace(/^["']|["']$/g, '').toLowerCase();
  if (FONT_FAMILY_SET.has(lower)) return font;

  const stack = font.split(',').map(part => part.trim().replace(/^["']|["']$/g, ''));
  if (stack.length > 1 && stack.every(part => FONT_FAMILY_SET.has(part.toLowerCase()) || part.startsWith('var(--'))) {
    return font;
  }

  return fallback;
}

export function normalizeColor(value: string | undefined): string | undefined {
  const color = value?.trim();
  if (!color) return undefined;
  if (/^#[0-9a-f]{3}([0-9a-f]{3})?([0-9a-f]{2})?$/i.test(color)) return color;
  if (/^[0-9a-f]{6}$/i.test(color)) return `#${color}`;
  if (/^var\(--[a-z0-9-_]+\)$/i.test(color)) return color;
  if (/^(rgb|hsl)a?\(\s*[-\d.%]+\s*,\s*[-\d.%]+\s*,\s*[-\d.%]+(?:\s*,\s*(?:0|1|0?\.\d+|[\d.]+%))?\s*\)$/i.test(color)) return color;
  return undefined;
}

function compactStyle(style: Record<string, string | number | undefined>): Record<string, string | number> {
  return Object.fromEntries(Object.entries(style).filter(([, value]) => value !== undefined)) as Record<string, string | number>;
}
