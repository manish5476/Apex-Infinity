import { Type } from '@angular/core';
import { SectionDataResolverService } from '../services/section-data-resolver.service';

export interface SectionRenderEntry {
  load: () => Promise<Type<unknown>>;
  inputs: (section: any, orgSlug: string) => Record<string, unknown>;
}

const resolver = new SectionDataResolverService();
const configOnly = (section: any) => ({ config: section.config });

export const SECTION_COMPONENT_REGISTRY: Record<string, SectionRenderEntry> = {
  hero_banner: {
    load: () => import('../pages/hero-banner/hero-banner.component').then(m => m.HeroBannerComponent),
    inputs: configOnly
  },
  product_slider: {
    load: () => import('../pages/product-slider/product-slider.component').then(m => m.ProductSliderComponent),
    inputs: section => ({ config: section.config, products: resolver.resolveProducts(section) })
  },
  product_grid: {
    load: () => import('../pages/product-grid/product-grid.component').then(m => m.ProductGridComponent),
    inputs: (section, orgSlug) => ({ config: section.config, products: resolver.resolveProducts(section), orgSlug })
  },
  category_grid: {
    load: () => import('../pages/category-grid/category-grid.component').then(m => m.CategoryGridComponent),
    inputs: (section, orgSlug) => ({ config: section.config, categories: resolver.resolveCategories(section), orgSlug })
  },
  feature_grid: {
    load: () => import('../pages/feature-grid/feature-grid.component').then(m => m.FeatureGridComponent),
    inputs: configOnly
  },
  text_content: {
    load: () => import('../pages/text-content/text-content.component').then(m => m.TextContentComponent),
    inputs: configOnly
  },
  video_hero: {
    load: () => import('../pages/video-hero/video-hero.component').then(m => m.VideoHeroComponent),
    inputs: configOnly
  },
  split_image_text: {
    load: () => import('../pages/split-content/split-content.component').then(m => m.SplitContentComponent),
    inputs: configOnly
  },
  contact_form: {
    load: () => import('../pages/contact-form/contact-form.component').then(m => m.ContactFormComponent),
    inputs: configOnly
  },
  map_locations: {
    load: () => import('../pages/map-locations/map-locations.component').then(m => m.MapLocationsComponent),
    inputs: section => ({ config: section.config, locations: resolver.resolveLocations(section) })
  },
  testimonial_slider: {
    load: () => import('../pages/testimonial-slider/testimonial-slider.component').then(m => m.TestimonialSliderComponent),
    inputs: configOnly
  },
  logo_cloud: {
    load: () => import('../pages/logo-cloud/logo-cloud.component').then(m => m.LogoCloudComponent),
    inputs: configOnly
  },
  newsletter_signup: {
    load: () => import('../pages/newsletter-signup/newsletter-signup.component').then(m => m.NewsletterSignupComponent),
    inputs: configOnly
  },
  stats_counter: {
    load: () => import('../pages/stats-counter/stats-counter.component').then(m => m.StatsCounterComponent),
    inputs: configOnly
  },
  pricing_table: {
    load: () => import('../pages/pricing-table/pricing-table.component').then(m => m.PricingTableComponent),
    inputs: configOnly
  },
  countdown_timer: {
    load: () => import('../pages/countdown-timer/countdown-timer.component').then(m => m.CountdownTimerComponent),
    inputs: configOnly
  },
  faq_accordion: {
    load: () => import('../pages/faq-accordion/faq-accordion.component').then(m => m.FaqAccordionComponent),
    inputs: configOnly
  },
  blog_feed: {
    load: () => import('../pages/blog-feed/blog-feed.component').then(m => m.BlogFeedComponent),
    inputs: section => ({ config: section.config, posts: resolver.resolvePosts(section) })
  },
  featured_product: {
    load: () => import('../pages/featured-product/featured-product').then(m => m.FeaturedProductComponent),
    inputs: section => ({ config: section.config, product: resolver.resolveArrayData(section)[0] ?? null })
  },
  product_listing: {
    load: () => import('../pages/product-listing/product-listing.component').then(m => m.ProductListingComponent),
    inputs: section => ({ config: section.config, products: resolver.resolveProducts(section) })
  },
  instagram_feed: {
    load: () => import('../pages/instagram-feed/instagram-feed').then(m => m.InstagramFeedComponent),
    inputs: configOnly
  },
  divider: {
    load: () => import('../pages/divider/divider').then(m => m.DividerComponent),
    inputs: configOnly
  },
  spacer: {
    load: () => import('../pages/spacer/spacer').then(m => m.SpacerComponent),
    inputs: configOnly
  }
};

export const SECTION_RUNTIME_TYPES = Object.keys(SECTION_COMPONENT_REGISTRY);
