import { Type } from '@angular/core';

export interface SectionRenderEntry {
  load: () => Promise<Type<unknown>>;
  inputs: (section: any, orgSlug: string) => Record<string, unknown>;
}

const configOnly = (section: any) => ({ config: section.config });

export const SECTION_COMPONENT_REGISTRY: Record<string, SectionRenderEntry> = {
  hero_banner: {
    load: () => import('../components/hero-banner/hero-banner.component').then(m => m.HeroBannerComponent),
    inputs: configOnly
  },
  product_slider: {
    load: () => import('../components/product-slider/product-slider.component').then(m => m.ProductSliderComponent),
    inputs: section => ({ config: section.config, products: section.data ?? [] })
  },
  product_grid: {
    load: () => import('../pages/product-grid/product-grid.component').then(m => m.ProductGridComponent),
    inputs: (section, orgSlug) => ({ config: section.config, products: section.data ?? [], orgSlug })
  },
  category_grid: {
    load: () => import('../pages/category-grid/category-grid.component').then(m => m.CategoryGridComponent),
    inputs: (section, orgSlug) => ({ config: section.config, categories: section.data ?? [], orgSlug })
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
    inputs: section => ({ config: section.config, locations: section.data ?? [] })
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
    inputs: section => ({ config: section.config, posts: section.data ?? [] })
  }
};
