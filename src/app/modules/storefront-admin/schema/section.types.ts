// section.types.ts
// Shared interfaces derived from the API response shape.

export interface SectionPrice {
    original: number;
    current: number;
    hasDiscount: boolean;
    discountPercentage: number;
    currency: string;
    currencySymbol?: string;
    taxRate: number;
    isTaxInclusive: boolean;
}

export interface SectionStock {
    available: boolean;
    quantity: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface SectionProduct {
    id: string;
    name: string;
    slug: string;
    sku?: string | null;
    image?: string | null;
    images?: string[];
    price: SectionPrice;
    category?: string | null;
    categorySlug?: string | null;
    brand?: string | null;
    brandSlug?: string | null;
    tags?: string[];
    stock: SectionStock;
    description?: string;
    rating?: number;
    reviewCount?: number;
}

export interface SectionCategory {
    id: string;
    name: string;
    slug: string;
    image?: string | null;
    description?: string;
    url: string;
}

export interface SectionBlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    image?: string | null;
    publishedAt?: string;
    author?: string;
    category?: string;
}

export interface SectionTestimonial {
    name: string;
    role?: string;
    avatar?: string;
    rating?: number;
    text: string;
}

export interface SectionButton {
    text?: string | null;
    link?: string | null;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    icon?: string | null;
}

export interface SectionLocation {
    _id?: string;
    name: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    location?: { lat: number; lng: number };
    phoneNumber?: string;
}

export interface SectionLogo {
    image: string;
    alt?: string;
    link?: string;
}

export interface SectionFeatureItem {
    icon?: string;
    title?: string;
    description?: string;
}

export interface SectionFaqItem {
    question: string;
    answer: string;
}

export interface SectionStatItem {
    value: number;
    suffix?: string;
    label?: string;
}

export interface SectionPricingPlan {
    name: string;
    price: string;
    period?: string;
    features?: string[];
    isPopular?: boolean;
    ctaText?: string;
    ctaLink?: string;
}

// Base section config fields shared by all sections
export interface SectionBaseConfig {
    isActive?: boolean;
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
    paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    backgroundColor?: string;
    themeMode?: 'auto' | 'light' | 'dark' | 'glass';
}

// Padding map — converts schema token to px value
export const PADDING_MAP: Record<string, string> = {
    none: '0',
    sm: '24px',
    md: '48px',
    lg: '72px',
    xl: '96px',
};