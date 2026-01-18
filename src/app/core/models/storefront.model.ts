// 1. Common Types
// ✅ Added 'navbar_simple' and 'footer_simple' to valid types
export type SectionType = 
  | 'navbar_simple' | 'footer_simple' // <-- New Layout Types
  | 'hero_banner' | 'feature_grid' | 'product_slider' | 'product_grid' 
  | 'category_grid' | 'text_content' | 'testimonial_slider' | 'contact_form' |'split_image_text'
  | 'map_locations' | 'faq_accordion'| 'blog_feed' |'countdown_timer'| 'pricing_table'| 'video_hero' | 'cta_banner'|'stats_counter' | 'faq_section'|'logo_cloud'|'newsletter_signup';

export type DataSource = 'static' | 'smart' | 'manual' | 'dynamic' | 'category' | 'pages';

// 2. Hydrated Product Data
export interface PublicProduct {
  id: string;
  _id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  price: {
    original: number;
    discounted?: number;
    currency: string;
    formattedOriginal: string;
    formattedDiscounted?: string;
    hasDiscount: boolean;
  };
  category: string;
  url: string;
  tags: string[];
  sku: string;
  stock: {
    total: number;
    available: boolean;
    lowStock: boolean;
  };
  quickActions: {
    addToCart: boolean;
    addToWishlist: boolean;
    quickView: boolean;
  };
}

// 3. Hydrated Branch Data
export interface PublicBranch {
  id: string;
  name: string;
  code: string;
  address: any;
  location: { type: string; coordinates: number[] };
  phone: string;
  isMain: boolean;
  fullAddress: string;
}

// 4. Menu Item Data (For Navbar)
export interface MenuItem {
  label: string;
  url: string;
  type?: 'page' | 'link';
  id?: string;
}

// 5. Section Structure
export interface PageSection {
  id: string;
  type: SectionType;
  position: number;
  config: {
    title?: string;
    subtitle?: string;
    backgroundImage?: string;
    itemsPerView?: number;
    showPrice?: boolean;
    menuItems?: MenuItem[]; // <-- Added for Navbar
    copyrightText?: string; // <-- Added for Footer
    ctaButtons?: Array<{ text: string; url: string; variant: string }>;
    [key: string]: any; 
  };
  dataSource: DataSource;
  isActive: boolean;
  // The 'data' field can be Products, Branches, or Menu Items
  data?: PublicProduct[] | PublicBranch[] | MenuItem[] | any; 
  error?: boolean; // <-- Added for error handling
}

// 6. Global Settings (New)
export interface GlobalSettings {
  defaultSeo?: {
    siteName?: string;
    defaultImage?: string;
  };
  favicon?: string;
  logo?: {
    url: string;
    altText?: string;
    width?: number;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

// 7. Full Page Response (The Main Interface)
export interface PublicPageResponse {
  meta?: {
    generatedIn: string;
    timestamp: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    contact: { email: string; phone: string };
    logo: string;
  };
  
  // ✅ NEW: Layout Structure
  layout: {
    header: PageSection[];
    footer: PageSection[];
  };

  // ✅ NEW: Global Settings
  settings: GlobalSettings;

  page: {
    id: string;
    name: string;
    slug: string;
    pageType: string;
    sections: PageSection[];
    seo: {
      title: string;
      description: string;
      keywords: string[];
      image?: string;
    };
    theme: {
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
      borderRadius: string;
      containerWidth: 'full' | 'wide' | 'standard' | 'narrow';
    };
    viewCount: number;
  };
}
