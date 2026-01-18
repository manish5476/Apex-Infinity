// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { Title, Meta } from '@angular/platform-browser';
// import { combineLatest } from 'rxjs';
// import { animate, style, transition, trigger, query, stagger } from '@angular/animations';

// // Services
// import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
// import { StorefrontStateService } from '../../../../core/services/storefront-state.service';
// import { PublicPageResponse } from '../../../../core/models/storefront.model';

// // Existing Components
// import { HeroBannerComponent } from '../../sections/hero-banner/hero-banner.component';
// import { ProductSliderComponent } from '../../sections/product-slider/product-slider.component';
// import { MapLocationsComponent } from "../map-locations/map-locations.component";
// import { ProductGridComponent } from "../product-grid/product-grid.component";

// // --- NEW COMPONENTS (Imports assumed to exist or will be created) ---
// // Note: If you haven't created these files yet, remove the imports and use the
// // "Temporary Placeholder" logic in the template below until we build them.
// import { CategoryGridComponent } from '../category-grid/category-grid.component';
// import { FeatureGridComponent } from '../feature-grid/feature-grid.component';
// import { VideoHeroComponent } from '../video-hero/video-hero.component';
// import { SplitContentComponent } from '../split-content/split-content.component';
// import { TestimonialSliderComponent } from '../testimonial-slider/testimonial-slider.component';
// import { LogoCloudComponent } from '../logo-cloud/logo-cloud.component';
// import { NewsletterSignupComponent } from '../newsletter-signup/newsletter-signup.component';
// import { StatsCounterComponent } from '../stats-counter/stats-counter.component';
// import { PricingTableComponent } from '../pricing-table/pricing-table.component';
// import { FaqAccordionComponent } from '../faq-accordion/faq-accordion.component';
// import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';
// import { BlogFeedComponent } from '../blog-feed/blog-feed.component';
// import { ContactFormComponent } from '../contact-form/contact-form.component';
// import { TextContentComponent } from '../text-content/text-content.component';

// @Component({
//   selector: 'app-dynamic-page',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     // Register Components
//     HeroBannerComponent,
//     ProductSliderComponent,
//     MapLocationsComponent,
//     ProductGridComponent,
//     CategoryGridComponent,
//     FeatureGridComponent,
//     VideoHeroComponent,
//     SplitContentComponent,
//     TestimonialSliderComponent,
//     LogoCloudComponent,
//     NewsletterSignupComponent,
//     StatsCounterComponent,
//     PricingTableComponent,
//     FaqAccordionComponent,
//     CountdownTimerComponent,
//     BlogFeedComponent,
//     ContactFormComponent,
//     TextContentComponent
//   ],
//   template: `
//     @if (isLoading()) {
//       <div class="flex flex-col items-center justify-center min-h-[60vh] space-y-4 fade-out">
//         <div class="relative w-16 h-16">
//           <div class="absolute inset-0 rounded-full border border-slate-200"></div>
//           <div class="absolute inset-0 rounded-full border-t-2 border-[var(--primary-color)] animate-spin"></div>
//         </div>
//         <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 animate-pulse">Loading Experience</p>
//       </div>
//     }

//     @if (error()) {
//       <div class="flex flex-col items-center justify-center min-h-[70vh] px-4" @fadeInUp>
//         <div class="relative max-w-md w-full p-12 text-center rounded-[2rem] overflow-hidden shadow-2xl bg-white/40 backdrop-blur-xl border border-white/50">
//           <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)]"></div>
//           <h1 class="font-serif text-6xl font-bold text-slate-900 mb-2">404</h1>
//           <div class="w-12 h-1 bg-slate-900 mx-auto mb-6 rounded-full opacity-20"></div>
//           <p class="text-slate-600 text-lg mb-8 font-light">{{ error() }}</p>
//           <a routerLink="/" 
//              class="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-800 hover:scale-105 transition-all duration-300 shadow-lg shadow-slate-900/20">
//             <i class="pi pi-arrow-left"></i> Return Home
//           </a>
//         </div>
//       </div>
//     }

//     @if (pageData(); as data) {
//       <div class="flex flex-col w-full"
//            [style.font-family]="data.page.theme.fontFamily || 'inherit'"
//            @staggerFade>

//         <main class="flex-grow w-full">
//           @for (section of data.page.sections; track section.id) {

//             <section [id]="'section-' + section.position" class="w-full relative section-enter">

//               @switch (section.type) {

//                 // --- HERO & MEDIA ---
//                 @case ('hero_banner') {
//                   <app-hero-banner [config]="section.config" />
//                 }
//                 @case ('video_hero') {
//                   <app-video-hero [config]="section.config" />
//                 }

//                 // --- PRODUCTS ---
//                 @case ('product_slider') {
//                   <app-product-slider 
//                     [config]="section.config" 
//                     [products]="section.data || []"> 
//                   </app-product-slider>
//                 }
//                 @case ('product_grid') {
//                   <app-product-grid 
//                     [config]="section.config" 
//                     [products]="section.data" 
//                     [orgSlug]="orgSlug">
//                   </app-product-grid>
//                 }

//                 // --- NAVIGATION & LAYOUT ---
//                 @case ('category_grid') {
//                   <app-category-grid 
//                     [config]="section.config" 
//                     [categories]="section.data || []">
//                   </app-category-grid>
//                 }
//                 @case ('feature_grid') {
//                   <app-feature-grid [config]="section.config" />
//                 }
//                 @case ('split_image_text') {
//                   <app-split-content [config]="section.config" />
//                 }
//                 @case ('text_content') {
//                   <app-text-content [config]="section.config" />
//                 }

//                 // --- SOCIAL PROOF ---
//                 @case ('testimonial_slider') {
//                   <app-testimonial-slider [config]="section.config" />
//                 }
//                 @case ('logo_cloud') {
//                   <app-logo-cloud [config]="section.config" />
//                 }

//                 // --- MARKETING ---
//                 @case ('newsletter_signup') {
//                   <app-newsletter-signup [config]="section.config" />
//                 }
//                 @case ('stats_counter') {
//                   <app-stats-counter [config]="section.config" />
//                 }
//                 @case ('pricing_table') {
//                   <app-pricing-table [config]="section.config" />
//                 }
//                 @case ('countdown_timer') {
//                   <app-countdown-timer [config]="section.config" />
//                 }

//                 // --- UTILITY & CONTACT ---
//                 @case ('map_locations') {
//                   <app-map-locations 
//                     [config]="section.config" 
//                     [locations]="section.data || []">
//                   </app-map-locations>
//                 }
// @case ('contact_form') {
//   <app-contact-form [config]="section.config" />
// }
//                 @case ('faq_accordion') {
//                   <app-faq-accordion [config]="section.config" />
//                 }
//                 @case ('blog_feed') {
//                   <app-blog-feed 
//                     [config]="section.config"
//                     [posts]="section.data || []">
//                   </app-blog-feed>
//                 }

//                 // --- FALLBACK ---
//                 @default {
//                   @if (isDevMode) {
//                     <div class="max-w-4xl mx-auto my-12 p-6 border border-dashed border-rose-300 bg-rose-50/50 rounded-2xl flex items-center justify-center gap-4 text-rose-800">
//                       <i class="pi pi-exclamation-triangle text-xl"></i>
//                       <span class="font-mono text-sm">Unknown Section Type: <strong>{{ section.type }}</strong></span>
//                     </div>
//                   }
//                 }
//               }
//             </section>
//           }
//         </main>

//       </div>
//     }
//   `,
//   animations: [
//     trigger('fadeInUp', [
//       transition(':enter', [
//         style({ opacity: 0, transform: 'translateY(20px)' }),
//         animate('0.6s cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
//       ])
//     ]),
//     trigger('staggerFade', [
//       transition(':enter', [
//         query('.section-enter', [
//           style({ opacity: 0, transform: 'translateY(30px)' }),
//           stagger('100ms', [
//             animate('0.8s cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
//           ])
//         ], { optional: true })
//       ])
//     ])
//   ]
// })
// export class DynamicPageComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private storefrontService = inject(StorefrontPublicService);
//   private titleService = inject(Title);
//   private metaService = inject(Meta);
//   private stateService = inject(StorefrontStateService);

//   pageData = signal<PublicPageResponse | null>(null);
//   isLoading = signal(true);
//   error = signal<string | null>(null);

//   isDevMode = true; // Toggle for production
//   orgSlug: string = '';

//   ngOnInit() {
//     if (this.route.parent) {
//       combineLatest([
//         this.route.parent.params,
//         this.route.params
//       ]).subscribe(([parentParams, childParams]) => {

//         this.orgSlug = parentParams['orgSlug'];
//         const pageSlug = childParams['pageSlug'];

//         if (this.orgSlug) {
//           // If no page slug, default to 'home'
//           this.loadPage(this.orgSlug, pageSlug || 'home');
//         } else {
//           this.error.set('Invalid URL parameters: Missing Store ID');
//           this.isLoading.set(false);
//         }
//       });
//     }
//   }

//   loadPage(orgSlug: string, pageSlug: string) {
//     this.isLoading.set(true);
//     this.error.set(null);

//     this.storefrontService.getPage(orgSlug, pageSlug).subscribe({
//       next: (res) => {
//         if (!res || !res.page) {
//           this.error.set('Page not found');
//           this.isLoading.set(false);
//           return;
//         }

//         // 1. Update Signals
//         this.pageData.set(res);

//         // 2. Hydrate Global State (for Header/Footer)
//         this.stateService.setState(res);

//         // 3. Set SEO
//         this.updateSeo(res);

//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         console.error('Page Load Error:', err);
//         this.error.set(err.status === 404 ? 'Page not found' : 'Could not load page content');
//         this.isLoading.set(false);
//       }
//     });
//   }

//   updateSeo(data: PublicPageResponse) {
//     if (!data.page?.seo) return;

//     const pageTitle = data.page.seo.title || data.page.name;
//     this.titleService.setTitle(pageTitle);

//     if (data.page.seo.description) {
//       this.metaService.updateTag({ name: 'description', content: data.page.seo.description });
//       this.metaService.updateTag({ property: 'og:description', content: data.page.seo.description });
//     }

//     if (data.page.seo.ogImage) {
//       this.metaService.updateTag({ property: 'og:image', content: data.page.seo.ogImage });
//     }
//   }
// }

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { combineLatest } from 'rxjs';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';
import { CategoryGridComponent } from '../category-grid/category-grid.component';

// Services
import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
import { StorefrontStateService } from '../../../../core/services/storefront-state.service';

// Components
import { HeroBannerComponent } from '../../sections/hero-banner/hero-banner.component';
import { ProductSliderComponent } from '../../sections/product-slider/product-slider.component';
import { PublicPageResponse } from '../../../../core/models/storefront.model';
import { MapLocationsComponent } from "../map-locations/map-locations.component";
import { ProductGridComponent } from "../product-grid/product-grid.component";
import { FeatureGridComponent } from "../feature-grid/feature-grid.component";
import { TextContentComponent } from "../text-content/text-content.component";
import { ContactFormComponent } from "../contact-form/contact-form.component";
import { VideoHeroComponent } from "../video-hero/video-hero.component";
import { SplitContentComponent } from "../split-content/split-content.component";
import { TestimonialSliderComponent } from "../testimonial-slider/testimonial-slider.component";
import { LogoCloudComponent } from "../logo-cloud/logo-cloud.component";
import { NewsletterSignupComponent } from "../newsletter-signup/newsletter-signup.component";
import { StatsCounterComponent } from "../stats-counter/stats-counter.component";
import { PricingTableComponent } from "../pricing-table/pricing-table.component";
import { CountdownTimerComponent } from "../countdown-timer/countdown-timer.component";
import { FaqAccordionComponent } from "../faq-accordion/faq-accordion.component";
import { BlogFeedComponent } from "../blog-feed/blog-feed.component";

@Component({
  selector: 'app-dynamic-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, CategoryGridComponent,
    HeroBannerComponent,
    ProductSliderComponent,
    MapLocationsComponent,
    ProductGridComponent,
    FeatureGridComponent,
    TextContentComponent,
    ContactFormComponent,
    VideoHeroComponent,
    SplitContentComponent,
    TestimonialSliderComponent,
    LogoCloudComponent,
    NewsletterSignupComponent,
    StatsCounterComponent,
    PricingTableComponent,
    CountdownTimerComponent,
    FaqAccordionComponent,
    BlogFeedComponent
  ],
  template: `
    @if (isLoading()) {
      <div class="flex flex-col items-center justify-center min-h-[60vh] space-y-4 fade-out">
        <div class="relative w-16 h-16">
          <div class="absolute inset-0 rounded-full border border-slate-200"></div>
          <div class="absolute inset-0 rounded-full border-t-2 border-slate-900 animate-spin"></div>
        </div>
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 animate-pulse">Loading Experience</p>
      </div>
    }

    @if (error()) {
      <div class="flex flex-col items-center justify-center min-h-[70vh] px-4" @fadeInUp>
        <div class="relative max-w-md w-full p-12 text-center rounded-3xl overflow-hidden shadow-2xl bg-white/40 backdrop-blur-xl border border-white/50">
          
          <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-300 to-indigo-300"></div>
          
          <h1 class="font-serif text-6xl font-bold text-slate-900 mb-2">404</h1>
          <div class="w-12 h-1 bg-slate-900 mx-auto mb-6 rounded-full opacity-20"></div>
          
          <p class="text-slate-600 text-lg mb-8 font-light">{{ error() }}</p>
          
          <a routerLink="/" 
             class="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-800 hover:scale-105 transition-all duration-300 shadow-lg shadow-slate-900/20">
            <i class="pi pi-arrow-left"></i> Return Home
          </a>
        </div>
      </div>
    }

    @if (pageData(); as data) {
      <div class="flex flex-col w-full"
           [style.--primary-color]="data.page.theme.primaryColor || '#0f172a'"
           [style.--secondary-color]="data.page.theme.secondaryColor || '#64748b'"
           [style.font-family]="data.page.theme.fontFamily || 'inherit'"
           @staggerFade>

        <main class="flex-grow w-full">
          @for (section of data.page.sections; track section.id) {
            
            <section [id]="'section-' + section.position" class="w-full relative section-enter">
              
              @switch (section.type) {
                @case ('hero_banner') {
                  <app-hero-banner [config]="section.config" />
                }
                @case ('product_slider') {
                  <app-product-slider 
                    [config]="section.config" 
                    [products]="section.data || []"> 
                  </app-product-slider>
                }
                @case ('map_locations') {
                    <app-map-locations 
                      [config]="section.config" 
                      [locations]="section.data || []">
                    </app-map-locations>
                  }
                  
                   @case ('video_hero') {
                  <app-video-hero [config]="section.config" />
                }
                
                  @case ('split_image_text') {
                  <app-split-content [config]="section.config" />
                }
                  @case ('contact_form') {
                  <app-contact-form [config]="section.config" />
                }
                @case ('feature_grid') {
                           <app-feature-grid [config]="section.config" />
                }
                @case ('blog_feed') {
                  <app-blog-feed 
                    [config]="section.config"
                    [posts]="section.data || []">
                  </app-blog-feed>
                }
                @case ('logo_cloud') {
                   <app-logo-cloud [config]="section.config" />
                 }
                   @case ('testimonial_slider') {
                   <app-testimonial-slider [config]="section.config" />
                 }
                  @case ('text_content') {
                   <app-text-content [config]="section.config" />
                 }
                  @case ('newsletter_signup') {
                   <app-newsletter-signup [config]="section.config" />
                 }

  @case ('stats_counter') {
                   <app-stats-counter [config]="section.config" />
                 }



<!--               
                 @case ('logo_cloud') {
                   <app-logo-cloud [config]="section.config" />
                 } -->

                
                 @case ('stats_counter') {
                   <app-stats-counter [config]="section.config" />
                 }
                 @case ('pricing_table') {
                   <app-pricing-table [config]="section.config" />
                 }

                 @case ('countdown_timer') {
                   <app-countdown-timer [config]="section.config" />
                 }
                 
  @case ('faq_accordion') {
                  <app-faq-accordion [config]="section.config" />
                }

                  @case ('category_grid') {
                   <app-category-grid 
                     [config]="section.config" 
                     [categories]="section.data || []">
                   </app-category-grid>
                 }
                @case ('product_grid') {
    <app-product-grid 
      [config]="section.config" 
      [products]="section.data" 
      [orgSlug]="orgSlug">
    </app-product-grid>
  }
                @default {
                  @if (isDevMode) {
                    <div class="max-w-4xl mx-auto my-12 p-6 border border-dashed border-rose-300 bg-rose-50/50 rounded-2xl flex items-center justify-center gap-4 text-rose-800">
                      <i class="pi pi-exclamation-triangle text-xl"></i>
                      <span class="font-mono text-sm">Unknown Section Type: <strong>{{ section.type }}</strong></span>
                    </div>
                  }
                }
              }
            </section>
          }
        </main>

      </div>
    }
  `,
  animations: [
    // Smooth Fade Up for Error Page
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    // Staggered Animation for Sections
    trigger('staggerFade', [
      transition(':enter', [
        query('.section-enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger('100ms', [
            animate('0.8s cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class DynamicPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private storefrontService = inject(StorefrontPublicService);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private stateService = inject(StorefrontStateService);

  pageData = signal<PublicPageResponse | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Set to false in production
  isDevMode = true;
  orgSlug: any;

  ngOnInit() {
    if (this.route.parent) {
      combineLatest([
        this.route.parent.params,
        this.route.params
      ]).subscribe(([parentParams, childParams]) => {

        const orgSlug = parentParams['orgSlug'];
        const pageSlug = childParams['pageSlug'];
        this.orgSlug = orgSlug
        if (orgSlug) {
          this.loadPage(orgSlug, pageSlug || 'home');
        } else {
          this.error.set('Invalid URL parameters: Missing Org Slug');
          this.isLoading.set(false);
        }
      });
    }
  }

  loadPage(orgSlug: string, pageSlug: string) {
    this.isLoading.set(true);
    this.error.set(null);
    this.storefrontService.getPage(orgSlug, pageSlug).subscribe({
      next: (res) => {
        if (!res || !res.page) {
          this.error.set('Page not found');
          this.isLoading.set(false);
          return;
        }

        this.pageData.set(res);
        this.stateService.setState(res);
        this.updateSeo(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Page Load Error:', err);
        this.error.set(err.status === 404 ? 'The page you are looking for does not exist.' : 'We could not load the page data.');
        this.isLoading.set(false);
      }
    });
  }

  updateSeo(data: PublicPageResponse) {
    if (!data.page?.seo) return;
    this.titleService.setTitle(data.page.seo.title || data.page.name);
    if (data.page.seo.description) {
      this.metaService.updateTag({ name: 'description', content: data.page.seo.description });
    }
  }
}