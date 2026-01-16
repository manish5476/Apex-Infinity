import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { combineLatest } from 'rxjs';

// Services
import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
import { StorefrontStateService } from '../../../../core/services/storefront-state.service';

// Components (Only Section Components, NO Layout Components)
import { HeroBannerComponent } from '../../sections/hero-banner/hero-banner.component';
import { ProductSliderComponent } from '../../sections/product-slider/product-slider.component';
import { PublicPageResponse } from '../../../../core/models/storefront.model';

@Component({
  selector: 'app-dynamic-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeroBannerComponent,
    ProductSliderComponent
  ],
  template: `
    @if (isLoading()) {
      <div class="flex items-center justify-center min-h-screen">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }

    @if (error()) {
      <div class="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p class="text-gray-600 text-lg mb-6">{{ error() }}</p>
        <a routerLink="/" class="text-blue-600 hover:underline">Return Home</a>
      </div>
    }

    @if (pageData(); as data) {
      <div class="flex flex-col"
           [style.--primary-color]="data.page.theme.primaryColor || '#3B82F6'"
           [style.--secondary-color]="data.page.theme.secondaryColor || '#10B981'"
           [style.font-family]="data.page.theme.fontFamily || 'inherit'">

        <main class="flex-grow">
          @for (section of data.page.sections; track section.id) {
            <section [id]="'section-' + section.position" class="w-full">
              
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
                @case ('feature_grid') {
                  <div class="p-12 text-center bg-gray-50 border-y border-gray-100">
                    <h3 class="text-lg font-medium text-gray-900">{{ section.config.title || 'Feature Grid' }}</h3>
                  </div>
                }
                @default {
                  @if (isDevMode) {
                    <div class="p-4 border-2 border-dashed border-red-300 m-4 text-center text-red-500 bg-red-50 rounded-lg">
                      Unknown Section: {{ section.type }}
                    </div>
                  }
                }
              }
            </section>
          }
        </main>

      </div>
    }
  `
})
export class DynamicPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private storefrontService = inject(StorefrontPublicService);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private stateService = inject(StorefrontStateService); // ✅ Inject State Service

  pageData = signal<PublicPageResponse | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  isDevMode = true; 

ngOnInit() {
    // FIX: Combine Parent Params (orgSlug) + Child Params (pageSlug)
    // We use 'route.parent.params' because orgSlug is defined in the layout route
    if (this.route.parent) {
      combineLatest([
        this.route.parent.params, // Gets :orgSlug
        this.route.params         // Gets :pageSlug
      ]).subscribe(([parentParams, childParams]) => {
        
        const orgSlug = parentParams['orgSlug'];
        const pageSlug = childParams['pageSlug'];

        if (orgSlug) {
          // Default to 'home' if pageSlug is somehow missing
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
        
        // 1. Update Local Data
        this.pageData.set(res);
        
        // 2. Update Global Layout (Header/Footer) via Service
        this.stateService.setState(res); 
        
        this.updateSeo(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Page Load Error:', err);
        this.error.set(err.status === 404 ? 'Page not found' : 'Could not load page data');
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