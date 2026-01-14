// 1. Common Types
export type SectionType = 
  | 'hero_banner' | 'feature_grid' | 'product_slider' | 'product_grid' 
  | 'category_grid' | 'text_content' | 'testimonial_slider' | 'contact_form' 
  | 'map_locations' | 'blog_feed' | 'video_section' | 'cta_banner' | 'faq_section';

export type DataSource = 'static' | 'smart' | 'manual' | 'dynamic' | 'category';

// 2. Hydrated Product Data (Matches your ProductPublicController.transform)
export interface PublicProduct {
  id: string;
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
  url:string;
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

// 3. Hydrated Branch Data (Matches DataHydrationService.getBranches)
export interface PublicBranch {
  id: string;
  name: string;
  code: string;
  address: any;
  location: { type: string; coordinates: number[] }; // GeoJSON
  phone: string;
  isMain: boolean;
  fullAddress: string;
}

// 4. Section Structure
export interface PageSection {
  id: string;
  type: SectionType;
  position: number;
  // Config is flexible based on sectionRegistry.config.js
  config: {
    title?: string;
    subtitle?: string;
    backgroundImage?: string;
    itemsPerView?: number;
    showPrice?: boolean;
    ctaButtons?: Array<{ text: string; url: string; variant: string }>;
    [key: string]: any; 
  };
  dataSource: DataSource;
  isActive: boolean;
  // The 'data' field is populated by your DataHydrationService
  data?: PublicProduct[] | PublicBranch[] | any; 
}

// 5. Full Page Response
export interface PublicPageResponse {
  organization: {
    id: string;
    name: string;
    slug: string;
    contact: { email: string; phone: string };
    logo: string;
  };
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
    };
    theme: {
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
      borderRadius: string;
      containerWidth: 'full' | 'wide' | 'standard' | 'narrow';
    };
  };
}

// export interface StorefrontPage {
//   _id?: string;
//   name: string;
//   slug: string;
//   pageType: 'home' | 'products' | 'product_detail' | 'category' | 'blog' | 'about' | 'contact' | 'custom';
//   sections: any[]; // You can refine this with the Section interface later
//   seo?: {
//     title?: string;
//     description?: string;
//     keywords?: string[];
//     ogImage?: string;
//     noIndex?: boolean;
//   };
//   theme?: {
//     primaryColor: string;
//     secondaryColor: string;
//     fontFamily: string;
//   };
//   isPublished: boolean;
//   isHomepage: boolean;
//   status: 'draft' | 'published' | 'archived';
//   organizationId: string;
//   viewCount?: number;
//   updatedAt?: Date;
// }

// export interface SectionTemplate {
//   _id: string;
//   name: string;
//   sectionType: string;
//   config: any;
//   previewImage?: string;
//   category: string;
// }

// export interface SmartRule {
//   _id?: string;
//   name: string;
//   ruleType: string;
//   filters: any[];
//   sortBy: string;
//   limit: number;
//   isActive: boolean;
// }

// export interface PageAnalytics {
//   views: number;
//   uniqueVisitors?: number; // If you add this later
//   lastViewed?: Date;
// }