import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { combineLatest } from 'rxjs';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';

// Services
import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
import { StorefrontStateService } from '../../../../core/services/storefront-state.service';
import { PublicPageResponse } from '../../../../core/models/storefront.model';

// Components
import { HeroBannerComponent } from '../../sections/hero-banner/hero-banner.component';
import { ProductSliderComponent } from '../../sections/product-slider/product-slider.component';
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
import { CategoryGridComponent } from '../category-grid/category-grid.component';

@Component({
  selector: 'app-dynamic-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CategoryGridComponent,
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
      <div class="loader-screen">
        <div class="loader-pulse"></div>
        <span class="loading-text">Loading Experience</span>
      </div>
    }

    @if (error()) {
      <div class="error-screen" @fadeInUp>
        <div class="error-card">
          <div class="gradient-line"></div>
          <h1 class="error-code">404</h1>
          <div class="separator"></div>
          <p class="error-msg">{{ error() }}</p>
          
          <a routerLink="/" class="return-btn">
            <i class="pi pi-arrow-left"></i> Return Home
          </a>
        </div>
      </div>
    }

    @if (pageData(); as data) {
      <div class="page-wrapper"
           [style.--primary-color]="data.page.theme.primaryColor || '#0f172a'"
           [style.--secondary-color]="data.page.theme.secondaryColor || '#64748b'"
           [style.font-family]="data.page.theme.fontFamily || 'inherit'"
           @staggerFade>

        <main class="main-content">
          
          @for (section of data.page.sections; track section.id) {
            <section [id]="'section-' + section.position" class="section-block section-enter">
              
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
                
                @case ('category_grid') {
                  <app-category-grid 
                    [config]="section.config" 
                    [categories]="section.data || []"
                    [orgSlug]="orgSlug">
                  </app-category-grid>
                }

                @case ('product_grid') {
                  <app-product-grid 
                    [config]="section.config" 
                    [products]="section.data || []" 
                    [orgSlug]="orgSlug">
                  </app-product-grid>
                }

                @case ('feature_grid') {
                  <app-feature-grid [config]="section.config" />
                }

                @case ('text_content') {
                  <app-text-content [config]="section.config" />
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

                @case ('map_locations') {
                  <app-map-locations 
                    [config]="section.config" 
                    [locations]="section.data || []">
                  </app-map-locations>
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

                @case ('newsletter_signup') {
                  <app-newsletter-signup [config]="section.config" />
                }

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

                @default {
                  @if (isDevMode) {
                    <div class="debug-placeholder">
                      <i class="pi pi-code"></i>
                      <span>Unknown Section: <strong>{{ section.type }}</strong></span>
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
  styles: [`
    :host { display: block; }

    /* LOADING SCREEN */
    .loader-screen {
      height: 60vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
    }
    
    .loader-pulse {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--color-primary, #0f172a);
      animation: pulse 1.5s infinite ease-in-out;
    }

    .loading-text {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #94a3b8;
    }

    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 0.5; }
      100% { transform: scale(1.5); opacity: 0; }
    }

    /* ERROR SCREEN */
    .error-screen {
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .error-card {
      position: relative;
      max-width: 480px;
      width: 100%;
      padding: 3rem;
      text-align: center;
      
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .gradient-line {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 4px;
      background: linear-gradient(90deg, #f43f5e, #6366f1);
    }

    .error-code {
      font-family: 'Playfair Display', serif;
      font-size: 4rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1;
    }

    .separator {
      width: 40px;
      height: 2px;
      background: #e2e8f0;
      margin: 1.5rem auto;
    }

    .error-msg {
      color: #64748b;
      font-size: 1.125rem;
      margin-bottom: 2rem;
    }

    .return-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 2rem;
      background: #0f172a;
      color: white;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      text-decoration: none;
      transition: all 0.2s;
      
      &:hover {
        background: #1e293b;
        transform: translateY(-2px);
        box-shadow: 0 10px 20px -10px rgba(0,0,0,0.3);
      }
    }

    /* MAIN CONTENT */
    .page-wrapper {
      width: 100%;
      min-height: 100vh;
    }

    .section-block {
      position: relative;
      width: 100%;
    }

    .debug-placeholder {
      margin: 3rem auto;
      max-width: 600px;
      padding: 2rem;
      border: 1px dashed #fca5a5;
      background: #fef2f2;
      border-radius: 12px;
      color: #991b1b;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      font-family: monospace;
    }
  `],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
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
  
  // Safe OrgSlug for Child Components
  orgSlug: string = '';

  // Set to false in production
  isDevMode = true;

  ngOnInit() {
    if (this.route.parent) {
      combineLatest([
        this.route.parent.params,
        this.route.params
      ]).subscribe(([parentParams, childParams]) => {

        const orgSlug = parentParams['orgSlug'];
        const pageSlug = childParams['pageSlug'];
        
        // Save Org Slug for children
        this.orgSlug = orgSlug || '';

        if (orgSlug) {
          this.loadPage(orgSlug, pageSlug || 'home');
        } else {
          this.error.set('Invalid Store URL');
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
        this.stateService.setState(res); // Pass data to State Service for Navbar/Footer
        this.updateSeo(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Page Load Error:', err);
        const msg = err.status === 404 
          ? 'The page you are looking for does not exist.' 
          : 'We encountered an error loading this experience.';
        this.error.set(msg);
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
