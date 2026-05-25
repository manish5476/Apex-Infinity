export type StorefrontId = string;
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | string;
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject { readonly [key: string]: JsonValue; }

export interface StorefrontApiResponse<T> {
  readonly status?: 'success' | 'fail' | 'error' | 'conflict';
  readonly message?: string;
  readonly data?: T;
  readonly pagination?: StorefrontPagination;
  readonly metadata?: StorefrontMetadata;
}

export interface StorefrontListResponse<T> extends StorefrontApiResponse<readonly T[]> {
  readonly results?: number;
}

export interface StorefrontPagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly pages: number;
}

export interface StorefrontMetadata {
  readonly [key: string]: JsonValue;
}

export interface NormalizedStorefrontResponse<T> {
  readonly data: T;
  readonly message: string | null;
  readonly pagination: StorefrontPagination | null;
  readonly metadata: StorefrontMetadata | null;
  readonly status: string | null;
}

export interface StorefrontApiError {
  readonly status: number;
  readonly message: string;
  readonly code: string;
  readonly issues: readonly StorefrontValidationIssue[];
}

export interface StorefrontValidationIssue {
  readonly itemId?: StorefrontId;
  readonly productName?: string;
  readonly issue?: 'unavailable' | 'out_of_stock' | 'insufficient_stock' | string;
  readonly requested?: number;
  readonly available?: number;
  readonly message?: string;
}

export interface MoneyBreakdown {
  readonly subtotal?: number;
  readonly discount?: number;
  readonly shipping?: number;
  readonly tax?: number;
  readonly total?: number;
  readonly grandTotal?: number;
  readonly currency?: CurrencyCode;
}

export interface AppliedCoupon {
  readonly code: string;
  readonly discountType: 'fixed' | 'percentage' | 'shipping';
  readonly amount: number;
  readonly metadata?: StorefrontMetadata;
}

export interface ProductSnapshot {
  readonly name: string;
  readonly slug?: string;
  readonly image?: string;
  readonly sku?: string;
  readonly variantTitle?: string;
  readonly sellingPrice: number;
  readonly discountedPrice?: number;
  readonly taxRate?: number;
  readonly isTaxInclusive?: boolean;
  readonly currency?: CurrencyCode;
  readonly hsnCode?: string;
}

export interface StorefrontCartItem {
  readonly _id?: StorefrontId;
  readonly id?: StorefrontId;
  readonly productId: StorefrontId;
  readonly variantId?: StorefrontId | null;
  readonly branchId?: StorefrontId | null;
  readonly snapshot: ProductSnapshot;
  readonly quantity: number;
  readonly unitPrice?: number;
  readonly lineTotal?: number;
  readonly metadata?: StorefrontMetadata;
}

export interface StorefrontCart {
  readonly _id?: StorefrontId;
  readonly id?: StorefrontId;
  readonly currency: CurrencyCode;
  readonly items?: readonly StorefrontCartItem[];
  readonly cartItems?: readonly StorefrontCartItem[];
  readonly itemCount?: number;
  readonly totals?: MoneyBreakdown;
  readonly discountTotals?: MoneyBreakdown;
  readonly shippingTotals?: MoneyBreakdown;
  readonly taxTotals?: MoneyBreakdown;
  readonly appliedCoupons?: readonly AppliedCoupon[];
  readonly status?: 'active' | 'merged' | 'converted' | 'abandoned' | 'expired';
  readonly updatedAt?: string;
}

export interface AddCartItemDto {
  readonly productId: StorefrontId;
  readonly quantity?: number;
  readonly branchId?: StorefrontId;
  readonly variantId?: StorefrontId;
}

export interface UpdateCartItemDto {
  readonly quantity: number;
}

export interface ApplyCouponDto {
  readonly couponCode: string;
}

export interface ShippingEstimateDto {
  readonly amount?: number;
  readonly address?: StorefrontAddressDto;
}

export interface CartValidationResult {
  readonly valid: boolean;
  readonly issues: readonly StorefrontValidationIssue[];
}

export type AddressType = 'home' | 'work' | 'billing' | 'shipping' | 'other';

export interface StorefrontAddressDto {
  readonly fullName: string;
  readonly phone: string;
  readonly country?: string;
  readonly state: string;
  readonly city: string;
  readonly postalCode: string;
  readonly addressLine1: string;
  readonly addressLine2?: string;
  readonly landmark?: string;
  readonly addressType?: AddressType;
  readonly isDefault?: boolean;
}

export interface StorefrontAddress extends StorefrontAddressDto {
  readonly _id?: StorefrontId;
  readonly id?: StorefrontId;
  readonly customerId?: StorefrontId;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface StorefrontCustomer {
  readonly _id?: StorefrontId;
  readonly id?: StorefrontId;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly avatar?: string | null;
  readonly authProvider?: 'guest' | 'password' | 'google' | 'facebook' | 'apple' | 'otp';
  readonly guestAccount: boolean;
  readonly marketingOptIn?: boolean;
  readonly status?: 'active' | 'blocked' | 'deleted';
  readonly orderCount?: number;
  readonly totalSpent?: number;
  readonly defaultAddressId?: StorefrontId | null;
  readonly recentlyViewed?: readonly RecentlyViewedProduct[];
}

export interface RecentlyViewedProduct {
  readonly productId: StorefrontId;
  readonly viewedAt: string;
}

export interface StorefrontDashboard {
  readonly customer: StorefrontCustomer;
  readonly addresses: readonly StorefrontAddress[];
  readonly orders: readonly StorefrontOrder[];
  readonly wishlist: readonly StorefrontWishlistItem[];
  readonly carts: readonly StorefrontCart[];
}

export interface StorefrontRegisterDto {
  readonly email: string;
  readonly password: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phone?: string;
  readonly marketingOptIn?: boolean;
}

export interface StorefrontLoginDto {
  readonly email: string;
  readonly password: string;
}

export interface ForgotPasswordDto {
  readonly email: string;
}

export interface ResetPasswordDto {
  readonly token: string;
  readonly password: string;
  readonly passwordConfirm?: string;
}

export interface StorefrontCheckoutDto {
  readonly customer?: {
    readonly email?: string;
    readonly phone?: string;
    readonly firstName?: string;
    readonly lastName?: string;
    readonly marketingOptIn?: boolean;
  };
  readonly shippingAddress: StorefrontAddressDto;
  readonly billingAddress?: StorefrontAddressDto;
  readonly saveAddress?: boolean;
  readonly defaultAddress?: boolean;
  readonly paymentIntentId?: string;
}

export interface StorefrontOrderItem {
  readonly _id?: StorefrontId;
  readonly productId: StorefrontId;
  readonly variantId?: StorefrontId | null;
  readonly branchId?: StorefrontId | null;
  readonly snapshot: ProductSnapshot;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discountAmount: number;
  readonly taxAmount: number;
  readonly lineTotal: number;
}

export interface StorefrontOrder {
  readonly _id?: StorefrontId;
  readonly id?: StorefrontId;
  readonly orderNumber: string;
  readonly guestOrder: boolean;
  readonly billingAddress: StorefrontAddressDto;
  readonly shippingAddress: StorefrontAddressDto;
  readonly items: readonly StorefrontOrderItem[];
  readonly totals: MoneyBreakdown;
  readonly appliedCoupons: readonly string[];
  readonly paymentStatus: 'pending' | 'authorized' | 'paid' | 'failed' | 'partially_refunded' | 'refunded';
  readonly fulfillmentStatus: 'unfulfilled' | 'partial' | 'fulfilled' | 'shipped' | 'delivered' | 'returned';
  readonly orderStatus: 'draft' | 'placed' | 'confirmed' | 'processing' | 'cancelled' | 'closed';
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface StorefrontWishlistItem {
  readonly _id?: StorefrontId;
  readonly id?: StorefrontId;
  readonly productId: StorefrontId | StorefrontWishlistProduct;
  readonly variantId?: StorefrontId | null;
  readonly addedAt?: string;
}

export interface StorefrontWishlistProduct {
  readonly _id?: StorefrontId;
  readonly id?: StorefrontId;
  readonly name: string;
  readonly slug?: string;
  readonly images?: readonly string[];
  readonly sellingPrice?: number;
  readonly discountedPrice?: number;
}

export interface PublicProduct {
  readonly _id?: StorefrontId;
  readonly id?: StorefrontId;
  readonly name: string;
  readonly slug?: string;
  readonly sku?: string;
  readonly description?: string;
  readonly image?: string;
  readonly images?: readonly string[];
  readonly url?: string;
  readonly brand?: { readonly name?: string } | string;
  readonly category?: { readonly name?: string } | string;
  readonly unit?: string;
  readonly price?: {
    readonly current?: number;
    readonly original?: number;
    readonly currency?: CurrencyCode;
    readonly hasDiscount?: boolean;
    readonly discountPercentage?: number;
  };
  readonly stock?: {
    readonly available?: boolean;
    readonly quantity?: number;
  };
}

export interface PublicProductList {
  readonly products: readonly PublicProduct[];
  readonly pagination?: StorefrontPagination;
}

export interface ProductListParams {
  readonly page?: number;
  readonly limit?: number;
  readonly sort?: string;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
  readonly category?: string;
  readonly brand?: string;
  readonly subCategory?: string;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly search?: string;
  readonly tags?: string;
  readonly inStock?: boolean;
}

// ── Store / Org info ──────────────────────────────────────────────────────────

export interface StorefrontOrganizationInfo {
  readonly _id?: StorefrontId;
  readonly id?: StorefrontId;
  readonly name: string;
  readonly slug: string;
  readonly logo?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly address?: Partial<StorefrontAddressDto> | null;
  readonly settings?: JsonObject;
  readonly theme?: JsonObject;
}

export interface StorefrontSitemapEntry {
  readonly slug: string;
  readonly name: string;
  readonly pageType?: string;
  readonly updatedAt?: string;
}

export interface StorefrontSitemap {
  readonly pages: readonly StorefrontSitemapEntry[];
}

// ── Catalogue metadata ────────────────────────────────────────────────────────

export interface StorefrontCategory {
  readonly _id?: StorefrontId;
  readonly id?: StorefrontId;
  readonly name: string;
  readonly slug?: string;
  readonly image?: string | null;
  readonly description?: string | null;
  readonly productCount?: number;
  readonly parentCategory?: StorefrontId | null;
  readonly children?: readonly StorefrontCategory[];
}

export interface StorefrontBrand {
  readonly _id?: StorefrontId;
  readonly id?: StorefrontId;
  readonly name: string;
  readonly slug?: string;
  readonly logo?: string | null;
  readonly productCount?: number;
}

export interface StorefrontTag {
  readonly _id?: StorefrontId;
  readonly id?: StorefrontId;
  readonly name: string;
  readonly slug?: string;
  readonly productCount?: number;
}

export interface StorefrontPriceRange {
  readonly min: number;
  readonly max: number;
  readonly currency?: CurrencyCode;
}

/** Response shape of GET /meta */
export interface StorefrontMeta {
  readonly categories?: readonly StorefrontCategory[];
  readonly brands?: readonly StorefrontBrand[];
  readonly tags?: readonly StorefrontTag[];
  readonly priceRange?: StorefrontPriceRange;
  readonly productCount?: number;
}

/** Response shape of GET /filters — lighter version of meta */
export interface StorefrontFilters {
  readonly categories?: readonly StorefrontCategory[];
  readonly brands?: readonly StorefrontBrand[];
  readonly priceRange?: StorefrontPriceRange;
}

// ── Page rendering ────────────────────────────────────────────────────────────

export interface StorefrontSection {
  readonly _id?: StorefrontId;
  readonly id?: StorefrontId;
  readonly sectionType: string;
  readonly config?: JsonObject;
  readonly data?: JsonValue;
  readonly hydratedData?: JsonValue;
  readonly manualData?: JsonValue;
  readonly order?: number;
}

export interface StorefrontPage {
  readonly _id?: StorefrontId;
  readonly id?: StorefrontId;
  readonly name: string;
  readonly slug: string;
  readonly pageType?: string;
  readonly status?: 'draft' | 'published' | 'archived';
  readonly isHomepage?: boolean;
  readonly sections?: readonly StorefrontSection[];
  readonly seo?: {
    readonly title?: string;
    readonly description?: string;
    readonly ogImage?: string;
    readonly noIndex?: boolean;
  };
  readonly themeOverride?: JsonObject;
  readonly updatedAt?: string;
  readonly publishedAt?: string;
}

/** Full page render response: org + layout + page + settings */
export interface StorefrontPageRender {
  readonly organization: StorefrontOrganizationInfo;
  readonly layout: {
    readonly header?: readonly StorefrontSection[];
    readonly footer?: readonly StorefrontSection[];
  };
  readonly settings?: JsonObject;
  readonly page: StorefrontPage;
}

// ── Form submission ───────────────────────────────────────────────────────────

export type StorefrontFormFieldValue = string | number | boolean | null | readonly string[];

export interface StorefrontFormSubmission {
  readonly formId?: StorefrontId;
  readonly formTitle?: string;
  readonly fields: Record<string, StorefrontFormFieldValue>;
  readonly submittedAt?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly pageSlug?: string;
}

export interface StorefrontFormSubmitDto {
  readonly formId?: StorefrontId;
  readonly fields: Record<string, StorefrontFormFieldValue>;
  readonly pageSlug?: string;
  readonly source?: string;
}

export type StorefrontSubmissionStatus = 'new' | 'read' | 'replied' | 'spam' | 'archived';

export interface StorefrontSubmissionListParams {
  readonly status?: StorefrontSubmissionStatus;
  readonly formId?: StorefrontId;
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}
