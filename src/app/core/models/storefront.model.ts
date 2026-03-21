// src/app/models/storefront/storefront.models.ts
//
// Single source of truth for all storefront-related TypeScript types.
// Mirrors the backend response shapes exactly — update both together.

// ============================================================================
// SECTION TYPES
// ============================================================================

export type SectionType =
  // Navigation (layout-only)
  | 'navbar_simple'
  | 'navbar_mega'
  | 'footer_simple'
  | 'footer_complex'
  // Hero
  | 'hero_banner'
  | 'video_hero'
  // Commerce
  | 'product_slider'
  | 'product_grid'
  | 'product_listing'
  | 'featured_product'
  // Content
  | 'text_content'
  | 'split_image_text'
  | 'feature_grid'
  | 'category_grid'
  | 'faq_accordion'
  | 'blog_feed'
  // Marketing
  | 'newsletter_signup'
  | 'countdown_timer'
  | 'pricing_table'
  | 'stats_counter'
  // Social & Trust
  | 'testimonial_slider'
  | 'logo_cloud'
  | 'instagram_feed'
  // Utility
  | 'map_locations'
  | 'contact_form'
  | 'divider'
  | 'spacer';

export type SectionCategory =
  | 'hero'
  | 'product'
  | 'content'
  | 'marketing'
  | 'social'
  | 'utility'
  | 'navigation';

// ============================================================================
// PRODUCT TYPES  (matches SmartRuleEngine._transformForPublic output)
// ============================================================================

export interface ProductPrice {
  original: number;
  current: number;        // discounted if hasDiscount, else original
  hasDiscount: boolean;
  discountPercentage: number;        // 0 when no discount
  currency: string;        // 'INR', 'USD', etc.
  taxRate: number;
  isTaxInclusive: boolean;
}

export interface ProductStock {
  available: boolean;
  quantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

/**
 * Shared base fields common to both card and detail responses.
 * category and brand are intentionally omitted here because they
 * have incompatible shapes (string on cards, object on detail).
 */
export interface PublicProductBase {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  images: string[];
  sku: string | null;
  price: ProductPrice;
  tags: string[];
  stock: ProductStock;
}

/** Compact DTO — used in product cards (listing, slider, search results) */
export interface PublicProduct extends PublicProductBase {
  /** Flat name string as returned by the listing/SmartRule endpoints */
  category: string | null;
  categorySlug: string | null;
  brand: string | null;
  brandSlug: string | null;
  isNew?: boolean;    // present in listing transform
  url?: string;     // present in listing transform
}

/** Expanded category ref — present on the product detail endpoint only */
export interface ProductCategoryRef {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

/** Expanded brand ref — present on the product detail endpoint only */
export interface ProductBrandRef {
  id: string;
  name: string;
  slug: string;
}

/** Full product detail — used on the product detail page */
export interface PublicProductDetail extends PublicProductBase {
  description: string | null;
  /** Price shape on detail includes the raw discounted value alongside computed fields */
  price: ProductPrice & {
    discounted: number | null;
  };
  /** Object ref on detail (vs flat string on cards) */
  category: ProductCategoryRef | null;
  brand: ProductBrandRef | null;
  unit: string | null;
  dimensions: ProductDimensions | null;
}

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
}

// ============================================================================
// CART TYPES  (matches CartService / StorefrontCart model)
// ============================================================================

export interface CartItemSnapshot {
  name: string;
  slug: string;
  image: string | null;
  sku: string | null;
  sellingPrice: number;
  discountedPrice: number | null;
  taxRate: number;
  isTaxInclusive: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  lineTotal: number;
  branchId: string | null;
  snapshot: CartItemSnapshot;
}

export interface Cart {
  id: string;
  organizationId: string;
  customerId: string | null;
  sessionToken: string | null;
  status: 'active' | 'merged' | 'converted' | 'abandoned';
  items: CartItem[];
  couponCode: string | null;
  discountAmount: number;
  subtotal: number;
  grandTotal: number;
  itemCount: number;
  expiresAt: string;
  updatedAt: string;
}

// ============================================================================
// BRANCH / LOCATION TYPES
// ============================================================================

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number];     // [longitude, latitude]
}

export interface PublicBranch {
  id: string;
  name: string;
  address: BranchAddress;
  location?: GeoLocation;
  phoneNumber: string;
}

export interface BranchAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

export interface MenuItem {
  label: string;
  url: string;
  type?: 'page' | 'link' | 'category';
  id?: string;
}

export interface NavbarData {
  links: MenuItem[];
  showCart: boolean;
  showSearch: boolean;
  sticky: boolean;
}

export interface FooterColumn {
  title: string;
  links: MenuItem[];
}

export interface FooterData {
  copyright: string;
  socialLinks: boolean;
  columns: FooterColumn[];
}

// ============================================================================
// SECTION CONFIG  (per-type configs for the page builder)
// ============================================================================

export interface CtaButton {
  text: string;
  link: string;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: string;
}

export interface HeroBannerConfig {
  title?: string;
  titleTag?: 'h1' | 'h2' | 'h3';
  subtitle?: string;
  alignment?: 'left' | 'center' | 'right';
  backgroundImage?: string;
  height?: 'auto' | 'small' | 'medium' | 'large' | 'screen';
  overlayOpacity?: number;
  ctaButtons?: CtaButton[];
  contentPosition?: 'left' | 'center' | 'right';
}

export interface ProductSectionConfig {
  title?: string;
  ruleType?: string;
  manualProductIds?: string[];
  categoryId?: string;
  limit?: number;
  itemsPerView?: number;
  columns?: 2 | 3 | 4;
  showPrice?: boolean;
  showAddToCart?: boolean;
  autoPlay?: boolean;
  pagination?: boolean;
}

export interface CategoryGridConfig {
  title?: string;
  layout?: 'grid' | 'masonry' | 'circle';
  selectedCategories?: string[];
  limit?: number;
}

export interface TestimonialConfig {
  title?: string;
  items?: TestimonialItem[];
}

export interface TestimonialItem {
  name: string;
  role?: string;
  avatar?: string;
  rating: number;
  text: string;
}

export interface CountdownConfig {
  targetDate: string;
  title?: string;
  style?: 'boxes' | 'plain';
}

// Generic fallback for configs not yet strongly typed
export type SectionConfig =
  | HeroBannerConfig
  | ProductSectionConfig
  | CategoryGridConfig
  | TestimonialConfig
  | CountdownConfig
  | Record<string, any>;

// ============================================================================
// SECTION STRUCTURE
// ============================================================================

export interface SectionStyles {
  backgroundColor?: string;
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  themeMode?: 'light' | 'dark' | 'glass' | 'auto';
}

export interface SectionManualData {
  productIds?: string[];
  categoryIds?: string[];
  imageUrls?: string[];
}

export interface PageSection {
  id: string;
  type: SectionType;
  config: Record<string, any>;  // Loose typing — validated by SectionRegistry on backend
  styles?: SectionStyles;
  isActive: boolean;
  isHiddenOnMobile?: boolean;
  isHiddenOnDesktop?: boolean;
  smartRuleId?: string | null;
  manualData?: SectionManualData;   // For manual product/category selection

  // Injected by DataHydrationService at runtime (public API only)
  data?: PublicProduct[] | PublicBranch[] | NavbarData | FooterData | any;
  dataSource?: string;
  error?: boolean;
  errorMessage?: string;
}

// ============================================================================
// LAYOUT
// ============================================================================

export interface StorefrontLayout {
  header: PageSection[];
  footer: PageSection[];
}

// ============================================================================
// GLOBAL SETTINGS  (matches StorefrontLayout.globalSettings)
// ============================================================================

export interface CommerceSettings {
  currency: string;
  currencySymbol: string;
  allowGuestCheckout: boolean;
  taxDisplayMode: 'inclusive' | 'exclusive' | 'hidden';
  shippingEnabled: boolean;
  minOrderAmount: number;
}

export interface GlobalSettings {
  favicon?: string;
  logo?: {
    url: string;
    altText?: string;
    width?: number;
  };
  typography?: {
    headingFont: string;
    bodyFont: string;
  };
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  defaultSeo?: {
    siteName: string;
    defaultImage?: string;
    titleSuffix?: string;
  };
  commerce?: CommerceSettings;
}

// ============================================================================
// SEO
// ============================================================================

export interface PageSeo {
  title: string;
  description: string;
  keywords: string[];
  image?: string;          // og:image
  noIndex?: boolean;
}

// ============================================================================
// THEME OVERRIDES
// ============================================================================

export interface ThemeCustomSettings {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  backgroundColor?: string;
}

export interface ThemeOverride {
  mode?: 'preset' | 'custom';
  presetId?: string;
  customSettings?: ThemeCustomSettings;
}

// ============================================================================
// PAGE
// ============================================================================

export type PageType =
  | 'home' | 'products' | 'product_detail' | 'category'
  | 'blog' | 'about' | 'contact' | 'landing' | 'custom';

export interface StorefrontPage {
  /** MongoDB _id — present in all API responses */
  _id: string;
  /** Alias used in some public responses */
  id?: string;
  name: string;
  slug: string;
  type: PageType;
  sections: PageSection[];
  seo: PageSeo;
  themeOverride: ThemeOverride;
  updatedAt: string;
}

// Admin-only page (includes publishing state)
export interface AdminPage extends StorefrontPage {
  pageType: PageType;
  status: 'draft' | 'published' | 'archived';
  isPublished: boolean;
  isHomepage: boolean;
  publishedAt?: string;
  viewCount: number;
  lastViewedAt?: string;
  version: number;
  sectionsCount?: number;   // injected by list endpoint
  createdBy?: string;
  createdAt: string;
}

// ============================================================================
// BREADCRUMBS
// ============================================================================

export interface Breadcrumb {
  name: string;
  url: string;
}

// ============================================================================
// ORGANISATION
// ============================================================================

export interface PublicOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description?: string | null;
  contact: {
    email: string | null;
    phone: string | null;
    address?: any;
  };
}

// ============================================================================
// API RESPONSE SHAPES
// ============================================================================

/** GET /api/v1/store/:slug/:pageSlug */
export interface PublicPageResponse {
  status: 'success';
  data: {
    meta: {
      generatedIn: string;
      timestamp: string;
    };
    organization: PublicOrganization;
    settings: GlobalSettings;
    layout: StorefrontLayout;
    page: StorefrontPage;
  };
}

/** GET /api/v1/store/:slug/products */
export interface ProductListResponse {
  status: 'success';
  organization: PublicOrganization;
  layout: StorefrontLayout;
  products: PublicProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/** GET /api/v1/store/:slug/products/:productSlug */
export interface ProductDetailResponse {
  status: 'success';
  organization: PublicOrganization;
  layout: StorefrontLayout;
  settings: GlobalSettings;
  product: PublicProductDetail;
  breadcrumbs: Breadcrumb[];
}

/** GET /api/v1/store/:slug/search */
export interface SearchResponse {
  status: 'success';
  query: string;
  results: Array<{
    id: string;
    name: string;
    slug: string;
    image: string | null;
    price: number;
    originalPrice: number;
    hasDiscount: boolean;
    category: string | null;
    url: string;
  }>;
}

/** GET /api/v1/store/:slug/meta */
export interface StoreMetadataResponse {
  status: 'success';
  data: {
    organization: { id: string; name: string };
    enums: {
      categories: MetaItem[];
      brands: MetaItem[];
      departments: MetaItem[];
      units: Array<{ id: string; name: string }>;
      tags: string[];
    };
    filters: {
      price: { min: number; max: number };
    };
  };
}

export interface MetaItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  image?: string | null;
  parentId?: string | null;
  count: number;
}

/** GET /api/v1/store/:slug/filters */
export interface ShopFiltersResponse {
  status: 'success';
  data: {
    categories: Array<{ id: string; name: string; slug: string; count: number }>;
    brands: Array<{ id: string; name: string; slug: string; count: number }>;
    price: { min: number; max: number };
  };
}

/** Cart API responses */
export interface CartResponse {
  status: 'success';
  message?: string;
  data: Cart;
}

export interface CartValidationResponse {
  status: 'success' | 'conflict';
  message: string;
  data: {
    valid: boolean;
    issues: CartValidationIssue[];
  };
}

export interface CartValidationIssue {
  itemId: string;
  productName: string;
  issue: 'unavailable' | 'out_of_stock' | 'insufficient_stock';
  requested: number;
  available: number;
}

/** Admin page list */
export interface AdminPageListResponse {
  status: 'success';
  results: number;
  total: number;
  data: AdminPage[];
}

/** Smart rule */
export interface SmartRuleResponse {
  status: 'success';
  data: {
    rule: SmartRule;
  };
}

export interface SmartRuleListResponse {
  status: 'success';
  results: number;
  data: {
    rules: SmartRule[];
  };
}

export interface SmartRule {
  _id: string;
  organizationId: string;
  name: string;
  description?: string;
  ruleType: string;
  filters: SmartRuleFilter[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit: number;
  cacheDuration: number;
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmartRuleFilter {
  field: string;
  operator: string;
  value: any;
  value2?: any;
}

// ============================================================================
// PAGE BUILDER — Section Registry types
// (Used in the admin page builder sidebar)
// ============================================================================

export interface SectionFieldDef {
  type: string;
  label?: string;
  required?: boolean;
  default?: any;
  enum?: string[];
  min?: number;
  max?: number;
  maxLength?: number;
  maxItems?: number;
  ref?: string;
  description?: string;
  itemSchema?: Record<string, SectionFieldDef>;
}

export interface SectionDefinition {
  type: SectionType;
  name: string;
  category: SectionCategory;
  icon: string;
  description: string;
  isSystem: boolean;
  /** Loose typing matches ConfigFormComponent @Input() schema: Record<string, any> */
  schema: Record<string, any>;
}

export interface SectionTemplate {
  _id: string;
  name: string;
  description?: string;
  sectionType: SectionType;
  defaultConfig: SectionConfig;
  previewImage?: string;
  category: SectionCategory;
  styleTags?: string[];
  isSystemTemplate: boolean;
  isPublic: boolean;
  isPremium: boolean;
  usageCount: number;
}

// // src/app/models/storefront/storefront.models.ts
// //
// // Single source of truth for all storefront-related TypeScript types.
// // Mirrors the backend response shapes exactly — update both together.

// // ============================================================================
// // SECTION TYPES
// // ============================================================================

// export type SectionType =
//   // Navigation (layout-only)
//   | 'navbar_simple'
//   | 'navbar_mega'
//   | 'footer_simple'
//   | 'footer_complex'
//   // Hero
//   | 'hero_banner'
//   | 'video_hero'
//   // Commerce
//   | 'product_slider'
//   | 'product_grid'
//   | 'product_listing'
//   | 'featured_product'
//   // Content
//   | 'text_content'
//   | 'split_image_text'
//   | 'feature_grid'
//   | 'category_grid'
//   | 'faq_accordion'
//   | 'blog_feed'
//   // Marketing
//   | 'newsletter_signup'
//   | 'countdown_timer'
//   | 'pricing_table'
//   | 'stats_counter'
//   // Social & Trust
//   | 'testimonial_slider'
//   | 'logo_cloud'
//   | 'instagram_feed'
//   // Utility
//   | 'map_locations'
//   | 'contact_form'
//   | 'divider'
//   | 'spacer';

// export type SectionCategory =
//   | 'hero'
//   | 'product'
//   | 'content'
//   | 'marketing'
//   | 'social'
//   | 'utility'
//   | 'navigation';

// // ============================================================================
// // PRODUCT TYPES  (matches SmartRuleEngine._transformForPublic output)
// // ============================================================================

// export interface ProductPrice {
//   original: number;
//   current: number;        // discounted if hasDiscount, else original
//   hasDiscount: boolean;
//   discountPercentage: number;        // 0 when no discount
//   currency: string;        // 'INR', 'USD', etc.
//   taxRate: number;
//   isTaxInclusive: boolean;
// }

// export interface ProductStock {
//   available: boolean;
//   quantity: number;
//   status: 'in_stock' | 'low_stock' | 'out_of_stock';
// }

// /** Compact DTO — used in product cards (listing, slider, search results) */
// export interface PublicProduct {
//   id: string;
//   name: string;
//   slug: string;
//   image: string | null;
//   images: string[];
//   sku: string | null;
//   price: ProductPrice;
//   category: string | null;
//   categorySlug: string | null;
//   brand: string | null;
//   brandSlug: string | null;
//   tags: string[];
//   stock: ProductStock;
//   isNew?: boolean;             // present in listing, absent in SmartRule output
//   url?: string;              // present in listing transform
// }

// /** Full product detail — used on the product detail page */
// export interface PublicProductDetail extends PublicProduct {
//   description: string | null;
//   price: ProductPrice & {
//     discounted: number | null;       // raw discounted price
//   };
//   category: {                        // object on detail, string on card
//     id: string;
//     name: string;
//     slug: string;
//     image: string | null;
//   } | null;
//   brand: {
//     id: string;
//     name: string;
//     slug: string;
//   } | null;
//   unit: string | null;
//   dimensions: ProductDimensions | null;
// }

// export interface ProductDimensions {
//   length?: number;
//   width?: number;
//   height?: number;
//   weight?: number;
// }

// // ============================================================================
// // CART TYPES  (matches CartService / StorefrontCart model)
// // ============================================================================

// export interface CartItemSnapshot {
//   name: string;
//   slug: string;
//   image: string | null;
//   sku: string | null;
//   sellingPrice: number;
//   discountedPrice: number | null;
//   taxRate: number;
//   isTaxInclusive: boolean;
// }

// export interface CartItem {
//   id: string;
//   productId: string;
//   quantity: number;
//   lineTotal: number;
//   branchId: string | null;
//   snapshot: CartItemSnapshot;
// }

// export interface Cart {
//   id: string;
//   organizationId: string;
//   customerId: string | null;
//   sessionToken: string | null;
//   status: 'active' | 'merged' | 'converted' | 'abandoned';
//   items: CartItem[];
//   couponCode: string | null;
//   discountAmount: number;
//   subtotal: number;
//   grandTotal: number;
//   itemCount: number;
//   expiresAt: string;
//   updatedAt: string;
// }

// // ============================================================================
// // BRANCH / LOCATION TYPES
// // ============================================================================

// export interface GeoLocation {
//   type: 'Point';
//   coordinates: [number, number];     // [longitude, latitude]
// }

// export interface PublicBranch {
//   id: string;
//   name: string;
//   address: BranchAddress;
//   location?: GeoLocation;
//   phoneNumber: string;
// }

// export interface BranchAddress {
//   street?: string;
//   city?: string;
//   state?: string;
//   zipCode?: string;
//   country?: string;
// }

// // ============================================================================
// // NAVIGATION TYPES
// // ============================================================================

// export interface MenuItem {
//   label: string;
//   url: string;
//   type?: 'page' | 'link' | 'category';
//   id?: string;
// }

// export interface NavbarData {
//   links: MenuItem[];
//   showCart: boolean;
//   showSearch: boolean;
//   sticky: boolean;
// }

// export interface FooterColumn {
//   title: string;
//   links: MenuItem[];
// }

// export interface FooterData {
//   copyright: string;
//   socialLinks: boolean;
//   columns: FooterColumn[];
// }

// // ============================================================================
// // SECTION CONFIG  (per-type configs for the page builder)
// // ============================================================================

// export interface CtaButton {
//   text: string;
//   link: string;
//   variant: 'primary' | 'secondary' | 'outline' | 'ghost';
//   icon?: string;
// }

// export interface HeroBannerConfig {
//   title?: string;
//   titleTag?: 'h1' | 'h2' | 'h3';
//   subtitle?: string;
//   alignment?: 'left' | 'center' | 'right';
//   backgroundImage?: string;
//   height?: 'auto' | 'small' | 'medium' | 'large' | 'screen';
//   overlayOpacity?: number;
//   ctaButtons?: CtaButton[];
//   contentPosition?: 'left' | 'center' | 'right';
// }

// export interface ProductSectionConfig {
//   title?: string;
//   ruleType?: string;
//   manualProductIds?: string[];
//   categoryId?: string;
//   limit?: number;
//   itemsPerView?: number;
//   columns?: 2 | 3 | 4;
//   showPrice?: boolean;
//   showAddToCart?: boolean;
//   autoPlay?: boolean;
//   pagination?: boolean;
// }

// export interface CategoryGridConfig {
//   title?: string;
//   layout?: 'grid' | 'masonry' | 'circle';
//   selectedCategories?: string[];
//   limit?: number;
// }

// export interface TestimonialConfig {
//   title?: string;
//   items?: TestimonialItem[];
// }

// export interface TestimonialItem {
//   name: string;
//   role?: string;
//   avatar?: string;
//   rating: number;
//   text: string;
// }

// export interface CountdownConfig {
//   targetDate: string;
//   title?: string;
//   style?: 'boxes' | 'plain';
// }

// // Generic fallback for configs not yet strongly typed
// export type SectionConfig =
//   | HeroBannerConfig
//   | ProductSectionConfig
//   | CategoryGridConfig
//   | TestimonialConfig
//   | CountdownConfig
//   | Record<string, any>;

// // ============================================================================
// // SECTION STRUCTURE
// // ============================================================================

// export interface SectionStyles {
//   backgroundColor?: string;
//   paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
//   paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
//   themeMode?: 'light' | 'dark' | 'glass' | 'auto';
// }

// export interface SectionManualData {
//   productIds?: string[];
//   categoryIds?: string[];
//   imageUrls?: string[];
// }

// export interface PageSection {
//   id: string;
//   type: SectionType;
//   config: Record<string, any>;  // Loose typing — validated by SectionRegistry on backend
//   styles?: SectionStyles;
//   isActive: boolean;
//   isHiddenOnMobile?: boolean;
//   isHiddenOnDesktop?: boolean;
//   smartRuleId?: string | null;
//   manualData?: SectionManualData;   // For manual product/category selection

//   // Injected by DataHydrationService at runtime (public API only)
//   data?: PublicProduct[] | PublicBranch[] | NavbarData | FooterData | any;
//   dataSource?: string;
//   error?: boolean;
//   errorMessage?: string;
// }

// // ============================================================================
// // LAYOUT
// // ============================================================================

// export interface StorefrontLayout {
//   header: PageSection[];
//   footer: PageSection[];
// }

// // ============================================================================
// // GLOBAL SETTINGS  (matches StorefrontLayout.globalSettings)
// // ============================================================================

// export interface CommerceSettings {
//   currency: string;
//   currencySymbol: string;
//   allowGuestCheckout: boolean;
//   taxDisplayMode: 'inclusive' | 'exclusive' | 'hidden';
//   shippingEnabled: boolean;
//   minOrderAmount: number;
// }

// export interface GlobalSettings {
//   favicon?: string;
//   logo?: {
//     url: string;
//     altText?: string;
//     width?: number;
//   };
//   typography?: {
//     headingFont: string;
//     bodyFont: string;
//   };
//   colors?: {
//     primary: string;
//     secondary: string;
//     accent: string;
//   };
//   socialLinks?: {
//     facebook?: string;
//     instagram?: string;
//     twitter?: string;
//     linkedin?: string;
//     youtube?: string;
//   };
//   defaultSeo?: {
//     siteName: string;
//     defaultImage?: string;
//     titleSuffix?: string;
//   };
//   commerce?: CommerceSettings;
// }

// // ============================================================================
// // SEO
// // ============================================================================

// export interface PageSeo {
//   title: string;
//   description: string;
//   keywords: string[];
//   image?: string;          // og:image
//   noIndex?: boolean;
// }

// // ============================================================================
// // THEME OVERRIDES
// // ============================================================================

// export interface ThemeCustomSettings {
//   primaryColor?: string;
//   secondaryColor?: string;
//   fontFamily?: string;
//   backgroundColor?: string;
// }

// export interface ThemeOverride {
//   mode?: 'preset' | 'custom';
//   presetId?: string;
//   customSettings?: ThemeCustomSettings;
// }

// // ============================================================================
// // PAGE
// // ============================================================================

// export type PageType =
//   | 'home' | 'products' | 'product_detail' | 'category'
//   | 'blog' | 'about' | 'contact' | 'landing' | 'custom';

// export interface StorefrontPage {
//   /** MongoDB _id — present in all API responses */
//   _id: string;
//   /** Alias used in some public responses */
//   id?: string;
//   name: string;
//   slug: string;
//   type: PageType;
//   sections: PageSection[];
//   seo: PageSeo;
//   themeOverride: ThemeOverride;
//   updatedAt: string;
// }

// // Admin-only page (includes publishing state)
// export interface AdminPage extends StorefrontPage {
//   pageType: PageType;
//   status: 'draft' | 'published' | 'archived';
//   isPublished: boolean;
//   isHomepage: boolean;
//   publishedAt?: string;
//   viewCount: number;
//   lastViewedAt?: string;
//   version: number;
//   sectionsCount?: number;   // injected by list endpoint
//   createdBy?: string;
//   createdAt: string;
// }

// // ============================================================================
// // BREADCRUMBS
// // ============================================================================

// export interface Breadcrumb {
//   name: string;
//   url: string;
// }

// // ============================================================================
// // ORGANISATION
// // ============================================================================

// export interface PublicOrganization {
//   id: string;
//   name: string;
//   slug: string;
//   logo: string | null;
//   description?: string | null;
//   contact: {
//     email: string | null;
//     phone: string | null;
//     address?: any;
//   };
// }

// // ============================================================================
// // API RESPONSE SHAPES
// // ============================================================================

// /** GET /api/v1/store/:slug/:pageSlug */
// export interface PublicPageResponse {
//   status: 'success';
//   data: {
//     meta: {
//       generatedIn: string;
//       timestamp: string;
//     };
//     organization: PublicOrganization;
//     settings: GlobalSettings;
//     layout: StorefrontLayout;
//     page: StorefrontPage;
//   };
// }

// /** GET /api/v1/store/:slug/products */
// export interface ProductListResponse {
//   status: 'success';
//   organization: PublicOrganization;
//   layout: StorefrontLayout;
//   products: PublicProduct[];
//   pagination: {
//     page: number;
//     limit: number;
//     total: number;
//     pages: number;
//   };
// }

// /** GET /api/v1/store/:slug/products/:productSlug */
// export interface ProductDetailResponse {
//   status: 'success';
//   organization: PublicOrganization;
//   layout: StorefrontLayout;
//   settings: GlobalSettings;
//   product: PublicProductDetail;
//   breadcrumbs: Breadcrumb[];
// }

// /** GET /api/v1/store/:slug/search */
// export interface SearchResponse {
//   status: 'success';
//   query: string;
//   results: Array<{
//     id: string;
//     name: string;
//     slug: string;
//     image: string | null;
//     price: number;
//     originalPrice: number;
//     hasDiscount: boolean;
//     category: string | null;
//     url: string;
//   }>;
// }

// /** GET /api/v1/store/:slug/meta */
// export interface StoreMetadataResponse {
//   status: 'success';
//   data: {
//     organization: { id: string; name: string };
//     enums: {
//       categories: MetaItem[];
//       brands: MetaItem[];
//       departments: MetaItem[];
//       units: Array<{ id: string; name: string }>;
//       tags: string[];
//     };
//     filters: {
//       price: { min: number; max: number };
//     };
//   };
// }

// export interface MetaItem {
//   id: string;
//   name: string;
//   slug: string;
//   type: string;
//   image?: string | null;
//   parentId?: string | null;
//   count: number;
// }

// /** GET /api/v1/store/:slug/filters */
// export interface ShopFiltersResponse {
//   status: 'success';
//   data: {
//     categories: Array<{ id: string; name: string; slug: string; count: number }>;
//     brands: Array<{ id: string; name: string; slug: string; count: number }>;
//     price: { min: number; max: number };
//   };
// }

// /** Cart API responses */
// export interface CartResponse {
//   status: 'success';
//   message?: string;
//   data: Cart;
// }

// export interface CartValidationResponse {
//   status: 'success' | 'conflict';
//   message: string;
//   data: {
//     valid: boolean;
//     issues: CartValidationIssue[];
//   };
// }

// export interface CartValidationIssue {
//   itemId: string;
//   productName: string;
//   issue: 'unavailable' | 'out_of_stock' | 'insufficient_stock';
//   requested: number;
//   available: number;
// }

// /** Admin page list */
// export interface AdminPageListResponse {
//   status: 'success';
//   results: number;
//   total: number;
//   data: AdminPage[];
// }

// /** Smart rule */
// export interface SmartRuleResponse {
//   status: 'success';
//   data: {
//     rule: SmartRule;
//   };
// }

// export interface SmartRuleListResponse {
//   status: 'success';
//   results: number;
//   data: {
//     rules: SmartRule[];
//   };
// }

// export interface SmartRule {
//   _id: string;
//   organizationId: string;
//   name: string;
//   description?: string;
//   ruleType: string;
//   filters: SmartRuleFilter[];
//   sortBy: string;
//   sortOrder: 'asc' | 'desc';
//   limit: number;
//   cacheDuration: number;
//   isActive: boolean;
//   executionCount: number;
//   lastExecutedAt?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface SmartRuleFilter {
//   field: string;
//   operator: string;
//   value: any;
//   value2?: any;
// }

// // ============================================================================
// // PAGE BUILDER — Section Registry types
// // (Used in the admin page builder sidebar)
// // ============================================================================

// export interface SectionFieldDef {
//   type: string;
//   label?: string;
//   required?: boolean;
//   default?: any;
//   enum?: string[];
//   min?: number;
//   max?: number;
//   maxLength?: number;
//   maxItems?: number;
//   ref?: string;
//   description?: string;
//   itemSchema?: Record<string, SectionFieldDef>;
// }

// export interface SectionDefinition {
//   type: SectionType;
//   name: string;
//   category: SectionCategory;
//   icon: string;
//   description: string;
//   isSystem: boolean;
//   /** Loose typing matches ConfigFormComponent @Input() schema: Record<string, any> */
//   schema: Record<string, any>;
// }

// export interface SectionTemplate {
//   _id: string;
//   name: string;
//   description?: string;
//   sectionType: SectionType;
//   defaultConfig: SectionConfig;
//   previewImage?: string;
//   category: SectionCategory;
//   styleTags?: string[];
//   isSystemTemplate: boolean;
//   isPublic: boolean;
//   isPremium: boolean;
//   usageCount: number;
// }

// // // src/app/models/storefront/storefront.models.ts
// // //
// // // Single source of truth for all storefront-related TypeScript types.
// // // Mirrors the backend response shapes exactly — update both together.

// // // ============================================================================
// // // SECTION TYPES
// // // ============================================================================

// // export type SectionType =
// //   // Navigation (layout-only)
// //   | 'navbar_simple'
// //   | 'navbar_mega'
// //   | 'footer_simple'
// //   | 'footer_complex'
// //   // Hero
// //   | 'hero_banner'
// //   | 'video_hero'
// //   // Commerce
// //   | 'product_slider'
// //   | 'product_grid'
// //   | 'product_listing'
// //   | 'featured_product'
// //   // Content
// //   | 'text_content'
// //   | 'split_image_text'
// //   | 'feature_grid'
// //   | 'category_grid'
// //   | 'faq_accordion'
// //   | 'blog_feed'
// //   // Marketing
// //   | 'newsletter_signup'
// //   | 'countdown_timer'
// //   | 'pricing_table'
// //   | 'stats_counter'
// //   // Social & Trust
// //   | 'testimonial_slider'
// //   | 'logo_cloud'
// //   | 'instagram_feed'
// //   // Utility
// //   | 'map_locations'
// //   | 'contact_form'
// //   | 'divider'
// //   | 'spacer';

// // export type SectionCategory =
// //   | 'hero'
// //   | 'product'
// //   | 'content'
// //   | 'marketing'
// //   | 'social'
// //   | 'utility'
// //   | 'navigation';

// // // ============================================================================
// // // PRODUCT TYPES  (matches SmartRuleEngine._transformForPublic output)
// // // ============================================================================

// // export interface ProductPrice {
// //   original:           number;
// //   current:            number;        // discounted if hasDiscount, else original
// //   hasDiscount:        boolean;
// //   discountPercentage: number;        // 0 when no discount
// //   currency:           string;        // 'INR', 'USD', etc.
// //   taxRate:            number;
// //   isTaxInclusive:     boolean;
// // }

// // export interface ProductStock {
// //   available: boolean;
// //   quantity:  number;
// //   status:    'in_stock' | 'low_stock' | 'out_of_stock';
// // }

// // /** Compact DTO — used in product cards (listing, slider, search results) */
// // export interface PublicProduct {
// //   id:           string;
// //   name:         string;
// //   slug:         string;
// //   image:        string | null;
// //   images:       string[];
// //   sku:          string | null;
// //   price:        ProductPrice;
// //   category:     string | null;
// //   categorySlug: string | null;
// //   brand:        string | null;
// //   brandSlug:    string | null;
// //   tags:         string[];
// //   stock:        ProductStock;
// //   isNew?:       boolean;             // present in listing, absent in SmartRule output
// //   url?:         string;              // present in listing transform
// // }

// // /** Full product detail — used on the product detail page */
// // export interface PublicProductDetail extends PublicProduct {
// //   description:  string | null;
// //   price: ProductPrice & {
// //     discounted: number | null;       // raw discounted price
// //   };
// //   category: {                        // object on detail, string on card
// //     id:    string;
// //     name:  string;
// //     slug:  string;
// //     image: string | null;
// //   } | null;
// //   brand: {
// //     id:   string;
// //     name: string;
// //     slug: string;
// //   } | null;
// //   unit:        string | null;
// //   dimensions:  ProductDimensions | null;
// // }

// // export interface ProductDimensions {
// //   length?: number;
// //   width?:  number;
// //   height?: number;
// //   weight?: number;
// // }

// // // ============================================================================
// // // CART TYPES  (matches CartService / StorefrontCart model)
// // // ============================================================================

// // export interface CartItemSnapshot {
// //   name:            string;
// //   slug:            string;
// //   image:           string | null;
// //   sku:             string | null;
// //   sellingPrice:    number;
// //   discountedPrice: number | null;
// //   taxRate:         number;
// //   isTaxInclusive:  boolean;
// // }

// // export interface CartItem {
// //   id:        string;
// //   productId: string;
// //   quantity:  number;
// //   lineTotal: number;
// //   branchId:  string | null;
// //   snapshot:  CartItemSnapshot;
// // }

// // export interface Cart {
// //   id:             string;
// //   organizationId: string;
// //   customerId:     string | null;
// //   sessionToken:   string | null;
// //   status:         'active' | 'merged' | 'converted' | 'abandoned';
// //   items:          CartItem[];
// //   couponCode:     string | null;
// //   discountAmount: number;
// //   subtotal:       number;
// //   grandTotal:     number;
// //   itemCount:      number;
// //   expiresAt:      string;
// //   updatedAt:      string;
// // }

// // // ============================================================================
// // // BRANCH / LOCATION TYPES
// // // ============================================================================

// // export interface GeoLocation {
// //   type:        'Point';
// //   coordinates: [number, number];     // [longitude, latitude]
// // }

// // export interface PublicBranch {
// //   id:          string;
// //   name:        string;
// //   address:     BranchAddress;
// //   location?:   GeoLocation;
// //   phoneNumber: string;
// // }

// // export interface BranchAddress {
// //   street?:  string;
// //   city?:    string;
// //   state?:   string;
// //   zipCode?: string;
// //   country?: string;
// // }

// // // ============================================================================
// // // NAVIGATION TYPES
// // // ============================================================================

// // export interface MenuItem {
// //   label: string;
// //   url:   string;
// //   type?: 'page' | 'link' | 'category';
// //   id?:   string;
// // }

// // export interface NavbarData {
// //   links:      MenuItem[];
// //   showCart:   boolean;
// //   showSearch: boolean;
// //   sticky:     boolean;
// // }

// // export interface FooterColumn {
// //   title: string;
// //   links: MenuItem[];
// // }

// // export interface FooterData {
// //   copyright:   string;
// //   socialLinks: boolean;
// //   columns:     FooterColumn[];
// // }

// // // ============================================================================
// // // SECTION CONFIG  (per-type configs for the page builder)
// // // ============================================================================

// // export interface CtaButton {
// //   text:    string;
// //   link:    string;
// //   variant: 'primary' | 'secondary' | 'outline' | 'ghost';
// //   icon?:   string;
// // }

// // export interface HeroBannerConfig {
// //   title?:           string;
// //   titleTag?:        'h1' | 'h2' | 'h3';
// //   subtitle?:        string;
// //   alignment?:       'left' | 'center' | 'right';
// //   backgroundImage?: string;
// //   height?:          'auto' | 'small' | 'medium' | 'large' | 'screen';
// //   overlayOpacity?:  number;
// //   ctaButtons?:      CtaButton[];
// //   contentPosition?: 'left' | 'center' | 'right';
// // }

// // export interface ProductSectionConfig {
// //   title?:            string;
// //   ruleType?:         string;
// //   manualProductIds?: string[];
// //   categoryId?:       string;
// //   limit?:            number;
// //   itemsPerView?:     number;
// //   columns?:          2 | 3 | 4;
// //   showPrice?:        boolean;
// //   showAddToCart?:    boolean;
// //   autoPlay?:         boolean;
// //   pagination?:       boolean;
// // }

// // export interface CategoryGridConfig {
// //   title?:              string;
// //   layout?:             'grid' | 'masonry' | 'circle';
// //   selectedCategories?: string[];
// //   limit?:              number;
// // }

// // export interface TestimonialConfig {
// //   title?: string;
// //   items?: TestimonialItem[];
// // }

// // export interface TestimonialItem {
// //   name:   string;
// //   role?:  string;
// //   avatar?: string;
// //   rating: number;
// //   text:   string;
// // }

// // export interface CountdownConfig {
// //   targetDate: string;
// //   title?:     string;
// //   style?:     'boxes' | 'plain';
// // }

// // // Generic fallback for configs not yet strongly typed
// // export type SectionConfig =
// //   | HeroBannerConfig
// //   | ProductSectionConfig
// //   | CategoryGridConfig
// //   | TestimonialConfig
// //   | CountdownConfig
// //   | Record<string, any>;

// // // ============================================================================
// // // SECTION STRUCTURE
// // // ============================================================================

// // export interface SectionStyles {
// //   backgroundColor?:  string;
// //   paddingTop?:       'none' | 'sm' | 'md' | 'lg' | 'xl';
// //   paddingBottom?:    'none' | 'sm' | 'md' | 'lg' | 'xl';
// //   themeMode?:        'light' | 'dark' | 'glass' | 'auto';
// // }

// // export interface SectionManualData {
// //   productIds?:  string[];
// //   categoryIds?: string[];
// //   imageUrls?:   string[];
// // }

// // export interface PageSection {
// //   id:                string;
// //   type:              SectionType;
// //   config:            Record<string, any>;  // Loose typing — validated by SectionRegistry on backend
// //   styles?:           SectionStyles;
// //   isActive:          boolean;
// //   isHiddenOnMobile?: boolean;
// //   isHiddenOnDesktop?:boolean;
// //   smartRuleId?:      string | null;
// //   manualData?:       SectionManualData;   // For manual product/category selection

// //   // Injected by DataHydrationService at runtime (public API only)
// //   data?:        PublicProduct[] | PublicBranch[] | NavbarData | FooterData | any;
// //   dataSource?:  string;
// //   error?:       boolean;
// //   errorMessage?:string;
// // }

// // // ============================================================================
// // // LAYOUT
// // // ============================================================================

// // export interface StorefrontLayout {
// //   header: PageSection[];
// //   footer: PageSection[];
// // }

// // // ============================================================================
// // // GLOBAL SETTINGS  (matches StorefrontLayout.globalSettings)
// // // ============================================================================

// // export interface CommerceSettings {
// //   currency:           string;
// //   currencySymbol:     string;
// //   allowGuestCheckout: boolean;
// //   taxDisplayMode:     'inclusive' | 'exclusive' | 'hidden';
// //   shippingEnabled:    boolean;
// //   minOrderAmount:     number;
// // }

// // export interface GlobalSettings {
// //   favicon?:  string;
// //   logo?: {
// //     url:      string;
// //     altText?: string;
// //     width?:   number;
// //   };
// //   typography?: {
// //     headingFont: string;
// //     bodyFont:    string;
// //   };
// //   colors?: {
// //     primary:   string;
// //     secondary: string;
// //     accent:    string;
// //   };
// //   socialLinks?: {
// //     facebook?:  string;
// //     instagram?: string;
// //     twitter?:   string;
// //     linkedin?:  string;
// //     youtube?:   string;
// //   };
// //   defaultSeo?: {
// //     siteName:      string;
// //     defaultImage?: string;
// //     titleSuffix?:  string;
// //   };
// //   commerce?: CommerceSettings;
// // }

// // // ============================================================================
// // // SEO
// // // ============================================================================

// // export interface PageSeo {
// //   title:        string;
// //   description:  string;
// //   keywords:     string[];
// //   image?:       string;          // og:image
// //   noIndex?:     boolean;
// // }

// // // ============================================================================
// // // THEME OVERRIDES
// // // ============================================================================

// // export interface ThemeCustomSettings {
// //   primaryColor?:   string;
// //   secondaryColor?: string;
// //   fontFamily?:     string;
// //   backgroundColor?:string;
// // }

// // export interface ThemeOverride {
// //   mode?:           'preset' | 'custom';
// //   presetId?:       string;
// //   customSettings?: ThemeCustomSettings;
// // }

// // // ============================================================================
// // // PAGE
// // // ============================================================================

// // export type PageType =
// //   | 'home' | 'products' | 'product_detail' | 'category'
// //   | 'blog' | 'about' | 'contact' | 'landing' | 'custom';

// // export interface StorefrontPage {
// //   /** MongoDB _id — present in all API responses */
// //   _id:           string;
// //   /** Alias used in some public responses */
// //   id?:           string;
// //   name:          string;
// //   slug:          string;
// //   type:          PageType;
// //   sections:      PageSection[];
// //   seo:           PageSeo;
// //   themeOverride: ThemeOverride;
// //   updatedAt:     string;
// // }

// // // Admin-only page (includes publishing state)
// // export interface AdminPage extends StorefrontPage {
// //   pageType:       PageType;
// //   status:         'draft' | 'published' | 'archived';
// //   isPublished:    boolean;
// //   isHomepage:     boolean;
// //   publishedAt?:   string;
// //   viewCount:      number;
// //   lastViewedAt?:  string;
// //   version:        number;
// //   sectionsCount?: number;   // injected by list endpoint
// //   createdBy?:     string;
// //   createdAt:      string;
// // }

// // // ============================================================================
// // // BREADCRUMBS
// // // ============================================================================

// // export interface Breadcrumb {
// //   name: string;
// //   url:  string;
// // }

// // // ============================================================================
// // // ORGANISATION
// // // ============================================================================

// // export interface PublicOrganization {
// //   id:           string;
// //   name:         string;
// //   slug:         string;
// //   logo:         string | null;
// //   description?: string | null;
// //   contact: {
// //     email:   string | null;
// //     phone:   string | null;
// //     address?: any;
// //   };
// // }

// // // ============================================================================
// // // API RESPONSE SHAPES
// // // ============================================================================

// // /** GET /api/v1/store/:slug/:pageSlug */
// // export interface PublicPageResponse {
// //   status: 'success';
// //   data: {
// //     meta: {
// //       generatedIn: string;
// //       timestamp:   string;
// //     };
// //     organization: PublicOrganization;
// //     settings:     GlobalSettings;
// //     layout:       StorefrontLayout;
// //     page:         StorefrontPage;
// //   };
// // }

// // /** GET /api/v1/store/:slug/products */
// // export interface ProductListResponse {
// //   status:       'success';
// //   organization: PublicOrganization;
// //   layout:       StorefrontLayout;
// //   products:     PublicProduct[];
// //   pagination: {
// //     page:  number;
// //     limit: number;
// //     total: number;
// //     pages: number;
// //   };
// // }

// // /** GET /api/v1/store/:slug/products/:productSlug */
// // export interface ProductDetailResponse {
// //   status:       'success';
// //   organization: PublicOrganization;
// //   layout:       StorefrontLayout;
// //   settings:     GlobalSettings;
// //   product:      PublicProductDetail;
// //   breadcrumbs:  Breadcrumb[];
// // }

// // /** GET /api/v1/store/:slug/search */
// // export interface SearchResponse {
// //   status:  'success';
// //   query:   string;
// //   results: Array<{
// //     id:            string;
// //     name:          string;
// //     slug:          string;
// //     image:         string | null;
// //     price:         number;
// //     originalPrice: number;
// //     hasDiscount:   boolean;
// //     category:      string | null;
// //     url:           string;
// //   }>;
// // }

// // /** GET /api/v1/store/:slug/meta */
// // export interface StoreMetadataResponse {
// //   status: 'success';
// //   data: {
// //     organization: { id: string; name: string };
// //     enums: {
// //       categories:  MetaItem[];
// //       brands:      MetaItem[];
// //       departments: MetaItem[];
// //       units:       Array<{ id: string; name: string }>;
// //       tags:        string[];
// //     };
// //     filters: {
// //       price: { min: number; max: number };
// //     };
// //   };
// // }

// // export interface MetaItem {
// //   id:       string;
// //   name:     string;
// //   slug:     string;
// //   type:     string;
// //   image?:   string | null;
// //   parentId?: string | null;
// //   count:    number;
// // }

// // /** GET /api/v1/store/:slug/filters */
// // export interface ShopFiltersResponse {
// //   status: 'success';
// //   data: {
// //     categories: Array<{ id: string; name: string; slug: string; count: number }>;
// //     brands:     Array<{ id: string; name: string; slug: string; count: number }>;
// //     price:      { min: number; max: number };
// //   };
// // }

// // /** Cart API responses */
// // export interface CartResponse {
// //   status:  'success';
// //   message?: string;
// //   data:    Cart;
// // }

// // export interface CartValidationResponse {
// //   status:  'success' | 'conflict';
// //   message: string;
// //   data: {
// //     valid:  boolean;
// //     issues: CartValidationIssue[];
// //   };
// // }

// // export interface CartValidationIssue {
// //   itemId:      string;
// //   productName: string;
// //   issue:       'unavailable' | 'out_of_stock' | 'insufficient_stock';
// //   requested:   number;
// //   available:   number;
// // }

// // /** Admin page list */
// // export interface AdminPageListResponse {
// //   status:  'success';
// //   results: number;
// //   total:   number;
// //   data:    AdminPage[];
// // }

// // /** Smart rule */
// // export interface SmartRuleResponse {
// //   status: 'success';
// //   data: {
// //     rule: SmartRule;
// //   };
// // }

// // export interface SmartRuleListResponse {
// //   status:  'success';
// //   results: number;
// //   data: {
// //     rules: SmartRule[];
// //   };
// // }

// // export interface SmartRule {
// //   _id:           string;
// //   organizationId:string;
// //   name:          string;
// //   description?:  string;
// //   ruleType:      string;
// //   filters:       SmartRuleFilter[];
// //   sortBy:        string;
// //   sortOrder:     'asc' | 'desc';
// //   limit:         number;
// //   cacheDuration: number;
// //   isActive:      boolean;
// //   executionCount:number;
// //   lastExecutedAt?: string;
// //   createdAt:     string;
// //   updatedAt:     string;
// // }

// // export interface SmartRuleFilter {
// //   field:    string;
// //   operator: string;
// //   value:    any;
// //   value2?:  any;
// // }

// // // ============================================================================
// // // PAGE BUILDER — Section Registry types
// // // (Used in the admin page builder sidebar)
// // // ============================================================================

// // export interface SectionFieldDef {
// //   type:        string;
// //   label?:      string;
// //   required?:   boolean;
// //   default?:    any;
// //   enum?:       string[];
// //   min?:        number;
// //   max?:        number;
// //   maxLength?:  number;
// //   maxItems?:   number;
// //   ref?:        string;
// //   description?:string;
// //   itemSchema?: Record<string, SectionFieldDef>;
// // }

// // export interface SectionDefinition {
// //   type:        SectionType;
// //   name:        string;
// //   category:    SectionCategory;
// //   icon:        string;
// //   description: string;
// //   isSystem:    boolean;
// //   /** Loose typing matches ConfigFormComponent @Input() schema: Record<string, any> */
// //   schema:      Record<string, any>;
// // }

// // export interface SectionTemplate {
// //   _id:             string;
// //   name:            string;
// //   description?:    string;
// //   sectionType:     SectionType;
// //   defaultConfig:   SectionConfig;
// //   previewImage?:   string;
// //   category:        SectionCategory;
// //   styleTags?:      string[];
// //   isSystemTemplate:boolean;
// //   isPublic:        boolean;
// //   isPremium:       boolean;
// //   usageCount:      number;
// // }