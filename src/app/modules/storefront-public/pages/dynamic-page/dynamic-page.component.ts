import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { combineLatest } from 'rxjs';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';

// Services
import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
import { StorefrontStateService } from '../../../../core/services/storefront-state.service';

// Components
import { HeroBannerComponent } from '../../sections/hero-banner/hero-banner.component';
import { ProductSliderComponent } from '../../sections/product-slider/product-slider.component';
import { PublicPageResponse } from '../../../../core/models/storefront.model';
import { MapLocationsComponent } from "../map-locations/map-locations.component";
import { ProductGridComponent } from "../product-grid/product-grid.component";

@Component({
  selector: 'app-dynamic-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeroBannerComponent,
    ProductSliderComponent,
    MapLocationsComponent,
    ProductGridComponent
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
                @case ('feature_grid') {
                  <div class="py-24 px-6 text-center border-y border-slate-100 bg-white/50 backdrop-blur-sm">
                    <h3 class="font-serif text-2xl text-slate-900 mb-2">{{ section.config.title || 'Feature Grid' }}</h3>
                    <p class="text-slate-500 text-sm tracking-wide">Component under construction</p>
                  </div>
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

    // Short delay to prevent flickering on fast connections
    // and to let the "Loading Experience" animation play briefly
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