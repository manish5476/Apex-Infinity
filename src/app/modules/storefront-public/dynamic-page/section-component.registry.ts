import { Type } from '@angular/core';
import { SectionDataResolverService } from '../services/section-data-resolver.service';
import { asRecord } from './section-config.utils';

export interface SectionRenderEntry {
  load: () => Promise<Type<unknown>>;
  inputs: (section: any, orgSlug: string) => Record<string, unknown>;
}

const resolver = new SectionDataResolverService();
const safeConfig = (section: any): Record<string, unknown> => asRecord(section?.config);
const configOnly = (section: any) => ({ config: safeConfig(section) });
const fallbackInputs = (section: any) => ({ config: safeConfig(section), data: section?.data ?? null, sectionType: section?.type ?? 'section' });
const safeInputs = (entry: SectionRenderEntry, section: any, orgSlug: string): Record<string, unknown> => {
  try {
    return entry.inputs(section ?? {}, orgSlug);
  } catch {
    return { config: safeConfig(section), data: [] };
  }
};

export const SECTION_COMPONENT_REGISTRY: Record<string, SectionRenderEntry> = {
  // --- Hero & Editorial ---
  hero_banner: { load: () => import('../pages/hero-banner/hero-banner.component').then(m => m.HeroBannerComponent), inputs: configOnly },
  video_hero: { load: () => import('../pages/video-hero/video-hero.component').then(m => m.VideoHeroComponent), inputs: configOnly },
  editorial_hero: { load: () => import('../pages/editorial-hero/editorial-hero.component').then(m => m.EditorialHeroComponent), inputs: configOnly },
  text_video_mask: { load: () => import('../pages/text-video-mask/text-video-mask.component').then(m => m.TextVideoMaskComponent), inputs: configOnly },
  split_content: { load: () => import('../pages/split-content/split-content.component').then(m => m.SplitContentComponent), inputs: configOnly },
  split_image_text: { load: () => import('../pages/split-content/split-content.component').then(m => m.SplitContentComponent), inputs: configOnly },
  split_screen_slider: { load: () => import('../pages/split-screen-slider/split-screen-slider.component').then(m => m.SplitScreenSliderComponent), inputs: configOnly },

  // --- Product & Commerce ---
  product_slider: { load: () => import('../pages/product-slider/product-slider.component').then(m => m.ProductSliderComponent), inputs: (s, o) => ({ config: safeConfig(s), data: resolver.resolveProducts(s), organizationSlug: o }) },
  product_grid: { load: () => import('../pages/product-grid/product-grid.component').then(m => m.ProductGridComponent), inputs: (s, o) => ({ config: safeConfig(s), data: resolver.resolveProducts(s), orgSlug: o }) },
  product_listing: { load: () => import('../pages/product-listing/product-listing.component').then(m => m.ProductListingComponent), inputs: s => ({ config: safeConfig(s), products: resolver.resolveProducts(s) }) },
  featured_product: { load: () => import('../pages/featured-product/featured-product').then(m => m.FeaturedProductComponent), inputs: s => ({ config: safeConfig(s), product: resolver.resolveData(s) }) },
  category_grid: { load: () => import('../pages/category-grid/category-grid.component').then(m => m.CategoryGridComponent), inputs: (s, o) => ({ config: safeConfig(s), categories: resolver.resolveCategories(s), orgSlug: o }) },
  shoppable_image: { load: () => import('../pages/section-fallback/section-fallback.component').then(m => m.SectionFallbackComponent), inputs: fallbackInputs },
  commerce_flow: { load: () => import('../pages/commerce-flow/commerce-flow.component').then(m => m.CommerceFlowComponent), inputs: configOnly },

  // --- Grids & Layouts ---
  bento_grid: { load: () => import('../pages/bento-grid/bento-grid.component').then(m => m.BentoGridComponent), inputs: configOnly },
  feature_grid: { load: () => import('../pages/feature-grid/feature-grid.component').then(m => m.FeatureGridComponent), inputs: configOnly },
  asymmetric_canvas: { load: () => import('../pages/asymmetric-canvas/asymmetric-canvas.component').then(m => m.AsymmetricCanvasComponent), inputs: configOnly },
  stacked_cards: { load: () => import('../pages/stacked-cards/stacked-cards.component').then(m => m.StackedCardsComponent), inputs: configOnly },
  tabbed_showcase: { load: () => import('../pages/tabbed-showcase/tabbed-showcase.component').then(m => m.TabbedShowcaseComponent), inputs: configOnly },
  masonry_gallery: { load: () => import('../pages/section-fallback/section-fallback.component').then(m => m.SectionFallbackComponent), inputs: fallbackInputs },
  before_after_slider: { load: () => import('../pages/section-fallback/section-fallback.component').then(m => m.SectionFallbackComponent), inputs: fallbackInputs },
  scrolling_marquee: { load: () => import('../pages/section-fallback/section-fallback.component').then(m => m.SectionFallbackComponent), inputs: fallbackInputs },
  divider: { load: () => import('../pages/divider/divider').then(m => m.DividerComponent), inputs: configOnly },
  spacer: { load: () => import('../pages/spacer/spacer').then(m => m.SpacerComponent), inputs: configOnly },

  // --- Trust, Content & Authority ---
  text_content: { load: () => import('../pages/text-content/text-content.component').then(m => m.TextContentComponent), inputs: configOnly },
  testimonial_slider: { load: () => import('../pages/testimonial-slider/testimonial-slider.component').then(m => m.TestimonialSliderComponent), inputs: configOnly },
  stats_counter: { load: () => import('../pages/stats-counter/stats-counter.component').then(m => m.StatsCounterComponent), inputs: configOnly },
  logo_cloud: { load: () => import('../pages/logo-cloud/logo-cloud.component').then(m => m.LogoCloudComponent), inputs: configOnly },
  blog_feed: { load: () => import('../pages/blog-feed/blog-feed.component').then(m => m.BlogFeedComponent), inputs: s => ({ config: safeConfig(s), posts: resolver.resolvePosts(s) }) },
  instagram_feed: { load: () => import('../pages/instagram-feed/instagram-feed').then(m => m.InstagramFeedComponent), inputs: configOnly },
  faq_accordion: { load: () => import('../pages/faq-accordion/faq-accordion.component').then(m => m.FaqAccordionComponent), inputs: configOnly },

  // --- Utility & Experience ---
  contact_form: { load: () => import('../pages/contact-form/contact-form.component').then(m => m.ContactFormComponent), inputs: configOnly },
  newsletter_signup: { load: () => import('../pages/newsletter-signup/newsletter-signup.component').then(m => m.NewsletterSignupComponent), inputs: configOnly },
  pricing_table: { load: () => import('../pages/pricing-table/pricing-table.component').then(m => m.PricingTableComponent), inputs: configOnly },
  countdown_timer: { load: () => import('../pages/countdown-timer/countdown-timer.component').then(m => m.CountdownTimerComponent), inputs: configOnly },
  map_locations: { load: () => import('../pages/map-locations/map-locations.component').then(m => m.MapLocationsComponent), inputs: s => ({ config: safeConfig(s), locations: resolver.resolveLocations(s) }) },
  sticky_scroll_reveal: { load: () => import('../pages/sticky-scroll-reveal/sticky-scroll-reveal.component').then(m => m.StickyScrollRevealComponent), inputs: configOnly },
  hover_reveal_list: { load: () => import('../pages/hover-reveal-list/hover-reveal-list.component').then(m => m.HoverRevealListComponent), inputs: configOnly },
  
  // Note: reset-password, product-detail, product-card, etc., are usually managed 
  // via routing or as sub-components rather than section-renderer entries.
};

export const SECTION_RUNTIME_TYPES = Object.keys(SECTION_COMPONENT_REGISTRY);

export function resolveSectionInputs(entry: SectionRenderEntry, section: any, orgSlug: string): Record<string, unknown> {
  return safeInputs(entry, section, orgSlug);
}
