// src/app/modules/storefront-public/dynamic-page/dynamic-page.component.ts
import { Component, OnInit, inject, signal, isDevMode, OnDestroy } from '@angular/core';

import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { combineLatest, Subject } from 'rxjs';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';


// Section components
import { BlogFeedComponent }          from '../pages/blog-feed/blog-feed.component';
import { CategoryGridComponent }      from '../pages/category-grid/category-grid.component';
import { ContactFormComponent }       from '../pages/contact-form/contact-form.component';
import { CountdownTimerComponent }    from '../pages/countdown-timer/countdown-timer.component';
import { FaqAccordionComponent }      from '../pages/faq-accordion/faq-accordion.component';
import { FeatureGridComponent }       from '../pages/feature-grid/feature-grid.component';
import { LogoCloudComponent }         from '../pages/logo-cloud/logo-cloud.component';
import { MapLocationsComponent }      from '../pages/map-locations/map-locations.component';
import { NewsletterSignupComponent }  from '../pages/newsletter-signup/newsletter-signup.component';
import { PricingTableComponent }      from '../pages/pricing-table/pricing-table.component';
import { ProductGridComponent }       from '../pages/product-grid/product-grid.component';
import { SplitContentComponent }      from '../pages/split-content/split-content.component';
import { StatsCounterComponent }      from '../pages/stats-counter/stats-counter.component';
import { TestimonialSliderComponent } from '../pages/testimonial-slider/testimonial-slider.component';
import { TextContentComponent }       from '../pages/text-content/text-content.component';
import { VideoHeroComponent }         from '../pages/video-hero/video-hero.component';
import { HeroBannerComponent }        from '../components/hero-banner/hero-banner.component';
import { StorefrontPublicService } from '@core/services/storefront-public.service';
import { StorefrontStateService } from '@core/services/storefront-state.service';
import { ProductSliderComponent } from '../components/product-slider/product-slider.component';
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-dynamic-page',
  standalone: true,
  imports: [
    RouterModule,
    HeroBannerComponent,
    ProductSliderComponent,
    CategoryGridComponent,
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
    BlogFeedComponent,
    MapLocationsComponent
],
  templateUrl: './dynamic-page.component.html',
  styles: [`
    :host {
      display: block;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-body);
      min-height: 100vh;
    }

    .loader-screen {
      height: 60vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-2xl);
    }

    .loader-pulse {
      width: 48px; height: 48px;
      border-radius: 50%;
      background: var(--accent-primary);
      box-shadow: var(--shadow-lg);
      animation: pulse 1.5s infinite ease-in-out;
    }

    .loading-text {
      font-family: var(--font-heading);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--text-tertiary);
    }

    @keyframes pulse {
      0%   { transform: scale(0.8); opacity: 0.5; }
      100% { transform: scale(1.5); opacity: 0; }
    }

    .error-screen {
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl);
    }

    .error-card {
      position: relative;
      max-width: 480px; width: 100%;
      padding: var(--spacing-4xl);
      text-align: center;
      background: var(--glass-bg-c);
      backdrop-filter: var(--glass-blur-c);
      border: 1px solid var(--glass-border-c);
      box-shadow: var(--glass-shadow-c);
      border-radius: var(--radius-2xl);
      overflow: hidden;
    }

    .gradient-line {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 4px;
      background: var(--accent-gradient);
    }

    .error-code {
      font-family: var(--font-heading);
      font-size: var(--font-size-5xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
    }

    .separator {
      width: 40px; height: 2px;
      background: var(--border-secondary);
      margin: var(--spacing-2xl) auto;
    }

    .error-msg {
      color: var(--text-secondary);
      font-size: var(--font-size-lg);
      margin-bottom: var(--spacing-3xl);
    }

    .return-btn {
      display: inline-flex; align-items: center; gap: var(--spacing-md);
      padding: var(--spacing-lg) var(--spacing-3xl);
      background: var(--accent-primary);
      color: var(--bg-primary);
      border-radius: 100px;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase; letter-spacing: 0.1em;
      text-decoration: none; transition: var(--transition-base);
      box-shadow: var(--shadow-md);
      &:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
    }

    .page-wrapper { width: 100%; min-height: 100vh; }
    .section-block { position: relative; width: 100%; }

    .debug-placeholder {
      margin: var(--spacing-3xl) auto;
      max-width: 600px; padding: var(--spacing-2xl);
      border: 1px dashed var(--color-error-border);
      background: var(--color-error-bg);
      color: var(--color-error-dark);
      border-radius: var(--ui-border-radius-lg);
      display: flex; align-items: center; justify-content: center;
      gap: var(--spacing-xl);
      font-family: var(--font-mono); font-size: var(--font-size-sm);
    }
  `],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerFade', [
      transition(':enter', [
        query('.section-enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger('100ms', [
            animate('0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class DynamicPageComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private route           = inject(ActivatedRoute);
  private storefrontService = inject(StorefrontPublicService);
  private stateService    = inject(StorefrontStateService);
  private titleService    = inject(Title);
  private metaService     = inject(Meta);

  pageData   = signal<any>(null);
  isLoading  = signal(true);
  error      = signal<string | null>(null);

  orgSlug    = '';
  // Expose isDevMode as a property for the template
  readonly isDev = isDevMode();
isDevMode: any;

  ngOnInit(): void {
    combineLatest([
            this.route.parent?.params ?? this.route.params,
            this.route.params
          ]).pipe(takeUntil(this.destroy$)).subscribe(([parentParams, childParams]) => {
      const params  = { ...parentParams, ...childParams };
      const orgSlug = params['orgSlug'];
      const pageSlug = params['pageSlug'] || 'home';

      this.orgSlug = orgSlug ?? '';

      if (orgSlug) {
        this.loadPage(orgSlug, pageSlug);
      }
    });
  }

  loadPage(orgSlug: string, pageSlug: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.storefrontService.getPage(orgSlug, pageSlug).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        // Handle both { data: {...} } and flat response shapes
        const data = res?.data ?? res;

        if (!data?.page) {
          this.error.set('Page not found.');
          this.isLoading.set(false);
          return;
        }

        this.pageData.set(data);
        this.stateService.setState(data);
        this._updateSeo(data);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        const msg = err?.status === 404
          ? 'The page you are looking for does not exist.'
          : 'We encountered an error loading this page.';
        this.error.set(msg);
        this.isLoading.set(false);
      }
    });
  }

  private _updateSeo(data: any): void {
    const seo = data?.page?.seo;
    if (!seo) return;
    this.titleService.setTitle(seo.title ?? data.page.name ?? 'Store');
    if (seo.description) {
      this.metaService.updateTag({ name: 'description',        content: seo.description });
      this.metaService.updateTag({ property: 'og:description', content: seo.description });
    }
    if (seo.image) {
      this.metaService.updateTag({ property: 'og:image', content: seo.image });
    }
    if (seo.noIndex) {
      this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    }
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule, Params } from '@angular/router';
// import { Title, Meta } from '@angular/platform-browser';
// import { combineLatest, Observable } from 'rxjs';
// import { animate, style, transition, trigger, query, stagger } from '@angular/animations';

// // Services
// import { StorefrontPublicService } from '../../../core/services/storefront-public.service';
// import { StorefrontStateService } from '../../../core/services/storefront-state.service';

// // Components
// import { BlogFeedComponent } from '../pages/blog-feed/blog-feed.component';
// import { CategoryGridComponent } from '../pages/category-grid/category-grid.component';
// import { ContactFormComponent } from '../pages/contact-form/contact-form.component';
// import { CountdownTimerComponent } from '../pages/countdown-timer/countdown-timer.component';
// import { FaqAccordionComponent } from '../pages/faq-accordion/faq-accordion.component';
// import { FeatureGridComponent } from '../pages/feature-grid/feature-grid.component';
// import { LogoCloudComponent } from '../pages/logo-cloud/logo-cloud.component';
// import { MapLocationsComponent } from '../pages/map-locations/map-locations.component';
// import { NewsletterSignupComponent } from '../pages/newsletter-signup/newsletter-signup.component';
// import { PricingTableComponent } from '../pages/pricing-table/pricing-table.component';
// import { ProductGridComponent } from '../pages/product-grid/product-grid.component';
// import { SplitContentComponent } from '../pages/split-content/split-content.component';
// import { StatsCounterComponent } from '../pages/stats-counter/stats-counter.component';
// import { TestimonialSliderComponent } from '../pages/testimonial-slider/testimonial-slider.component';
// import { TextContentComponent } from '../pages/text-content/text-content.component';
// import { VideoHeroComponent } from '../pages/video-hero/video-hero.component';
// import { HeroBannerComponent } from '../sections/hero-banner/hero-banner.component';
// import { ProductSliderComponent } from '../sections/product-slider/product-slider.component';

// @Component({
//   selector: 'app-dynamic-page',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     CategoryGridComponent,
//     HeroBannerComponent,
//     ProductSliderComponent,
//     MapLocationsComponent,
//     ProductGridComponent,
//     FeatureGridComponent,
//     TextContentComponent,
//     ContactFormComponent,
//     VideoHeroComponent,
//     SplitContentComponent,
//     TestimonialSliderComponent,
//     LogoCloudComponent,
//     NewsletterSignupComponent,
//     StatsCounterComponent,
//     PricingTableComponent,
//     CountdownTimerComponent,
//     FaqAccordionComponent,
//     BlogFeedComponent
//   ],
//   templateUrl: './dynamic-page.component.html',
//   styles: [`
//     :host { 
//       display: block; 
//       background-color: var(--bg-primary);
//       color: var(--text-primary);
//       font-family: var(--font-body);
//       min-height: 100vh;
//     }

//     /* =========================
//        LOADING SCREEN
//        ========================= */
//     .loader-screen {
//       height: 60vh;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-2xl);
//     }
    
//     .loader-pulse {
//       width: 48px;
//       height: 48px;
//       border-radius: 50%;
//       background: var(--accent-primary); /* Canonical Accent */
//       box-shadow: var(--shadow-lg);
//       animation: pulse 1.5s infinite ease-in-out;
//     }

//     .loading-text {
//       font-family: var(--font-heading);
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.2em;
//       color: var(--text-tertiary); /* Muted text token */
//     }

//     @keyframes pulse {
//       0% { transform: scale(0.8); opacity: 0.5; }
//       100% { transform: scale(1.5); opacity: 0; }
//     }

//     /* =========================
//        ERROR SCREEN
//        ========================= */
//     .error-screen {
//       min-height: 70vh;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       padding: var(--spacing-xl);
//       background: var(--bg-secondary); /* Subtle contrast for error page */
//     }

//     .error-card {
//       position: relative;
//       max-width: 480px;
//       width: 100%;
//       padding: var(--spacing-4xl);
//       text-align: center;
      
//       /* Glassmorphism via Canonical Tokens */
//       background: var(--glass-bg-c);
//       backdrop-filter: var(--glass-blur-c);
//       -webkit-backdrop-filter: var(--glass-blur-c);
//       border: 1px solid var(--glass-border-c);
//       box-shadow: var(--glass-shadow-c);
      
//       border-radius: var(--radius-2xl);
//       overflow: hidden;
//     }

//     .gradient-line {
//       position: absolute;
//       top: 0; left: 0; width: 100%; height: 4px;
//       background: var(--accent-gradient);
//     }

//     .error-code {
//       font-family: var(--font-heading);
//       font-size: var(--font-size-5xl); /* Scaled up */
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0;
//       line-height: var(--line-height-tight);
//     }

//     .separator {
//       width: 40px;
//       height: 2px;
//       background: var(--border-secondary);
//       margin: var(--spacing-2xl) auto;
//     }

//     .error-msg {
//       color: var(--text-secondary);
//       font-family: var(--font-body);
//       font-size: var(--font-size-lg);
//       line-height: var(--line-height-relaxed);
//       margin-bottom: var(--spacing-3xl);
//     }

//     .return-btn {
//       display: inline-flex;
//       align-items: center;
//       gap: var(--spacing-md);
//       padding: var(--spacing-lg) var(--spacing-3xl);
      
//       /* Action Colors */
//       background: var(--accent-primary);
//       color: var(--bg-primary); /* Contrast text against accent */
      
//       border-radius: 100px;
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.1em;
//       text-decoration: none;
//       transition: var(--transition-base);
//       box-shadow: var(--shadow-md);
      
//       &:hover {
//         background: var(--accent-hover);
//         transform: translateY(-2px);
//         box-shadow: var(--shadow-lg);
//       }

//       i { font-size: 0.9em; }
//     }

//     /* =========================
//        MAIN CONTENT
//        ========================= */
//     .page-wrapper {
//       width: 100%;
//       min-height: 100vh;
//       background-color: var(--bg-primary);
//     }

//     .section-block {
//       position: relative;
//       width: 100%;
//     }

//     /* =========================
//        DEBUG / DEV MODE
//        ========================= */
//     .debug-placeholder {
//       margin: var(--spacing-3xl) auto;
//       max-width: 600px;
//       padding: var(--spacing-2xl);
      
//       /* Semantic Error Colors */
//       border: 1px dashed var(--color-error-border);
//       background: var(--color-error-bg);
//       color: var(--color-error-dark);
      
//       border-radius: var(--ui-border-radius-lg);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-xl);
//       font-family: var(--font-mono);
//       font-size: var(--font-size-sm);
//       box-shadow: var(--shadow-sm);

//       i { font-size: var(--font-size-xl); }
//     }
//   `],
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

//   pageData = signal<any>(null);
//   isLoading = signal(true);
//   error = signal<string | null>(null);

//   orgSlug: string = '';
//   isDevMode = true; // Set to false in production

//   ngOnInit() {
//     let routeParams$: Observable<Params[]>;

//     if (this.route.parent) {
//       routeParams$ = combineLatest([
//         this.route.parent.params,
//         this.route.params
//       ]);
//     } else {
//       routeParams$ = combineLatest([this.route.params]);
//     }

//     routeParams$.subscribe((paramsArray: Params[]) => {
//       const params = paramsArray.reduce((acc, curr) => ({ ...acc, ...curr }), {});

//       const orgSlug = params['orgSlug'];
//       const pageSlug = params['pageSlug'];

//       this.orgSlug = orgSlug || '';

//       if (orgSlug) {
//         this.loadPage(orgSlug, pageSlug || 'home');
//       }
//     });
//   }

//   loadPage(orgSlug: string, pageSlug: string) {
//     this.isLoading.set(true);
//     this.error.set(null);

//     this.storefrontService.getPage(orgSlug, pageSlug).subscribe({
//       next: (res) => {
//         const actualData = res.data || res;

//         if (!actualData || !actualData.page) {
//           this.error.set('Page not found');
//           this.isLoading.set(false);
//           return;
//         }

//         this.pageData.set(actualData);
//         this.stateService.setState(actualData);
//         this.updateSeo(actualData);
//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         console.error('Page Load Error:', err);
//         const msg = err.status === 404
//           ? 'The page you are looking for does not exist.'
//           : 'We encountered an error loading this experience.';
//         this.error.set(msg);
//         this.isLoading.set(false);
//       }
//     });
//   }

//   updateSeo(data: any) {
//     if (!data.page?.seo) return;
//     this.titleService.setTitle(data.page.seo.title || data.page.name);
//     if (data.page.seo.description) {
//       this.metaService.updateTag({ name: 'description', content: data.page.seo.description });
//     }
//   }
// }
