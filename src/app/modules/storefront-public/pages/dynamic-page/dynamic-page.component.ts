import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

// Models
import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';

// Sections
import { HeroBannerComponent } from '../../sections/hero-banner/hero-banner.component';
import { ProductSliderComponent } from '../../sections/product-slider/product-slider.component';
import { PublicPageResponse } from '../../../../core/models/storefront.model';
// Import other sections...

@Component({
  selector: 'app-dynamic-page',
  standalone: true,
  imports: [
    CommonModule,
    HeroBannerComponent,
    ProductSliderComponent
    // Add other sections to imports
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
        <p class="text-gray-600 text-lg">{{ error() }}</p>
      </div>
    }

    @if (pageData(); as data) {
      <div class="min-h-screen"
           [style.--primary-color]="data.page.theme.primaryColor"
           [style.--secondary-color]="data.page.theme.secondaryColor"
           [style.font-family]="data.page.theme.fontFamily">

        @for (section of data.page.sections; track section.id) {
          <section [id]="'section-' + section.position" class="w-full">
            
            @switch (section.type) {
              
              @case ('hero_banner') {
                <app-hero-banner [config]="section.config" />
              }

              @case ('product_slider') {
                <app-product-slider 
                  [config]="section.config" 
                  [products]="section.data"> </app-product-slider>
              }

              @case ('feature_grid') {
                <div class="p-8 text-center bg-gray-100">Feature Grid Placeholder</div>
              }

              @default {
                @if (isDevMode) {
                  <div class="p-4 border-2 border-dashed border-red-300 m-4 text-center text-red-500">
                    Unknown Section Type: {{ section.type }}
                  </div>
                }
              }

            }
          </section>
        }

      </div>
    }
  `
})
export class DynamicPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private storefrontService = inject(StorefrontPublicService);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  pageData = signal<PublicPageResponse | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  isDevMode = true; // Set to false in production

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const orgSlug = params.get('orgSlug');
      const pageSlug = params.get('pageSlug');

      if (orgSlug && pageSlug) {
        this.loadPage(orgSlug, pageSlug);
      }
    });
  }

  loadPage(orgSlug: string, pageSlug: string) {
    this.isLoading.set(true);
    this.storefrontService.getPage(orgSlug, pageSlug).subscribe({
      next: (res) => {
        this.pageData.set(res);
        this.updateSeo(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Page not found');
        this.isLoading.set(false);
      }
    });
  }

  updateSeo(data: PublicPageResponse) {
    this.titleService.setTitle(data.page.seo.title || data.page.name);
    this.metaService.updateTag({ name: 'description', content: data.page.seo.description || '' });
    // Add more meta tags here
  }
}