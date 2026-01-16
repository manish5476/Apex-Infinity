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

  // ngOnInit() {
  //   combineLatest([this.route.paramMap]).subscribe(([params]) => {
  //     const orgSlug = params.get('orgSlug');
  //     const pageSlug = params.get('pageSlug');

  //     if (orgSlug) {
  //       // Default to 'home' if pageSlug is missing
  //       this.loadPage(orgSlug, pageSlug || 'home');
  //     } else {
  //       this.error.set('Invalid URL parameters');
  //       this.isLoading.set(false);
  //     }
  //   });
  // }
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

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { Title, Meta } from '@angular/platform-browser';
// import { combineLatest } from 'rxjs';

// // Services
// import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';

// // Models
// import { PublicPageResponse } from '../../../../core/models/storefront.model';
// import { HeroBannerComponent } from '../../sections/hero-banner/hero-banner.component';
// import { ProductSliderComponent } from '../../sections/product-slider/product-slider.component';
// import { FooterSimpleComponent } from '../../components/footer-simple/footer-simple.component';
// import { NavbarSimpleComponent } from '../../components/navbar-simple/navbar-simple.component';
// import { StorefrontStateService } from '../../../../core/services/storefront-state.service';

// @Component({
//   selector: 'app-dynamic-page',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     // Add new imports
//     NavbarSimpleComponent,
//     FooterSimpleComponent,
//     HeroBannerComponent,
//     ProductSliderComponent
//   ],
//   template: `
//     @if (isLoading()) {
//       <div class="flex items-center justify-center min-h-screen">
//         <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     }

//     @if (error()) {
//       <div class="flex flex-col items-center justify-center min-h-screen text-center px-4">
//         <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
//         <p class="text-gray-600 text-lg mb-6">{{ error() }}</p>
//         <a routerLink="/" class="text-blue-600 hover:underline">Return Home</a>
//       </div>
//     }

//     @if (pageData(); as data) {
//       <div class="min-h-screen flex flex-col"
//            [style.--primary-color]="data.page.theme.primaryColor || '#3B82F6'"
//            [style.--secondary-color]="data.page.theme.secondaryColor || '#10B981'"
//            [style.font-family]="data.page.theme.fontFamily || 'inherit'">

//         @for (section of data.layout.header; track section.id) {
//           @switch (section.type) {
//             @case ('navbar_simple') {
//               <app-navbar-simple 
//                 [config]="section.config" 
//                 [logo]="data.organization.logo"
//                 [orgSlug]="currentOrgSlug">
//               </app-navbar-simple>
//             }
//           }
//         }

//         <main class="flex-grow">
//           @for (section of data.page.sections; track section.id) {
//             <section [id]="'section-' + section.position" class="w-full">
              
//               @switch (section.type) {
//                 @case ('hero_banner') {
//                   <app-hero-banner [config]="section.config" />
//                 }
//                 @case ('product_slider') {
//                   <app-product-slider 
//                     [config]="section.config" 
//                     [products]="section.data || []"> 
//                   </app-product-slider>
//                 }
//                 @case ('feature_grid') {
//                   <div class="p-12 text-center bg-gray-50 border-y border-gray-100">
//                     <h3 class="text-lg font-medium text-gray-900">{{ section.config.title || 'Feature Grid' }}</h3>
//                   </div>
//                 }
//                 @default {
//                   @if (isDevMode) {
//                     <div class="p-4 border-2 border-dashed border-red-300 m-4 text-center text-red-500 bg-red-50 rounded-lg">
//                       Unknown Section: {{ section.type }}
//                     </div>
//                   }
//                 }
//               }
//             </section>
//           }
//         </main>

//         @for (section of data.layout.footer; track section.id) {
//           @switch (section.type) {
//             @case ('footer_simple') {
//               <app-footer-simple [config]="section.config" />
//             }
//           }
//         }

//       </div>
//     }
//   `
// })
// export class DynamicPageComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private storefrontService = inject(StorefrontPublicService);
//   private titleService = inject(Title);
//   private metaService = inject(Meta);
// private stateService = inject(StorefrontStateService);
//   pageData = signal<PublicPageResponse | null>(null);
//   isLoading = signal(true);
//   error = signal<string | null>(null);
//   currentOrgSlug: string = ''; // Store slug for links
//   isDevMode = true; 

//   ngOnInit() {
//     combineLatest([this.route.paramMap]).subscribe(([params]) => {
//       const orgSlug = params.get('orgSlug');
//       const pageSlug = params.get('pageSlug'); // Can be null if it's base route

//       if (orgSlug) {
//         this.currentOrgSlug = orgSlug; // Save for navbar links
//         // Default to 'home' if pageSlug is missing
//         this.loadPage(orgSlug, pageSlug || 'home');
//       } else {
//         this.error.set('Invalid URL parameters');
//         this.isLoading.set(false);
//       }
//     });
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
//         this.pageData.set(res);
//         this.stateService.setState(res); 
//         this.updateSeo(res);
//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         console.error('Page Load Error:', err);
//         this.error.set(err.status === 404 ? 'Page not found' : 'Could not load page data');
//         this.isLoading.set(false);
//       }
//     });
//   }

//   updateSeo(data: PublicPageResponse) {
//     if (!data.page?.seo) return;
//     this.titleService.setTitle(data.page.seo.title || data.page.name);
//     if (data.page.seo.description) {
//       this.metaService.updateTag({ name: 'description', content: data.page.seo.description });
//     }
//   }
// }

// // import { Component, OnInit, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ActivatedRoute, RouterModule } from '@angular/router';
// // import { Title, Meta } from '@angular/platform-browser';
// // import { combineLatest } from 'rxjs'; // ✅ Added for robust routing

// // // Services
// // import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';

// // // Models
// // // Ensure this path matches where you actually created the model

// // // Sections
// // import { HeroBannerComponent } from '../../sections/hero-banner/hero-banner.component';
// // import { ProductSliderComponent } from '../../sections/product-slider/product-slider.component';
// // import { PublicPageResponse } from '../../../../core/models/storefront.model';

// // @Component({
// //   selector: 'app-dynamic-page',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     RouterModule,
// //     HeroBannerComponent,
// //     ProductSliderComponent
// //   ],
// //   template: `
// //     @if (isLoading()) {
// //       <div class="flex items-center justify-center min-h-screen">
// //         <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
// //       </div>
// //     }

// //     @if (error()) {
// //       <div class="flex flex-col items-center justify-center min-h-screen text-center px-4">
// //         <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
// //         <p class="text-gray-600 text-lg mb-6">{{ error() }}</p>
// //         <a routerLink="/" class="text-blue-600 hover:underline">Return Home</a>
// //       </div>
// //     }

// //     @if (pageData(); as data) {
// //       <div class="min-h-screen"
// //            [style.--primary-color]="data.page.theme.primaryColor || '#3B82F6'"
// //            [style.--secondary-color]="data.page.theme.secondaryColor || '#10B981'"
// //            [style.font-family]="data.page.theme.fontFamily || 'inherit'">

// //         @for (section of data.page.sections; track section.id) {
// //           <section [id]="'section-' + section.position" class="w-full">
            
// //             @switch (section.type) {
              
// //               @case ('hero_banner') {
// //                 <app-hero-banner [config]="section.config" />
// //               }

// //               @case ('product_slider') {
// //                 <app-product-slider 
// //                   [config]="section.config" 
// //                   [products]="section.data || []"> 
// //                 </app-product-slider>
// //               }

// //               @case ('feature_grid') {
// //                 <div class="p-12 text-center bg-gray-50 border-y border-gray-100">
// //                   <h3 class="text-lg font-medium text-gray-900">Feature Grid</h3>
// //                   <p class="text-gray-500">Coming Soon</p>
// //                 </div>
// //               }

// //               @default {
// //                 @if (isDevMode) {
// //                   <div class="p-4 border-2 border-dashed border-red-300 m-4 text-center text-red-500 bg-red-50 rounded-lg">
// //                     ⚠️ Unknown Section Type: <strong>{{ section.type }}</strong>
// //                   </div>
// //                 }
// //               }

// //             }
// //           </section>
// //         }

// //       </div>
// //     }
// //   `
// // })
// // export class DynamicPageComponent implements OnInit {
// //   private route = inject(ActivatedRoute);
// //   private storefrontService = inject(StorefrontPublicService);
// //   private titleService = inject(Title);
// //   private metaService = inject(Meta);

// //   pageData = signal<PublicPageResponse | null>(null);
// //   isLoading = signal(true);
// //   error = signal<string | null>(null);
// //   isDevMode = true; 

// //   ngOnInit() {
// //     // ✅ Use combineLatest to ensure params are ready and prevent race conditions
// //     combineLatest([this.route.paramMap]).subscribe(([params]) => {
// //       const orgSlug = params.get('orgSlug');
// //       const pageSlug = params.get('pageSlug');

// //       if (orgSlug && pageSlug) {
// //         this.loadPage(orgSlug, pageSlug);
// //       } else {
// //         this.error.set('Invalid URL parameters');
// //         this.isLoading.set(false);
// //       }
// //     });
// //   }

// //   loadPage(orgSlug: string, pageSlug: string) {
// //     this.isLoading.set(true);
// //     this.error.set(null);

// //     this.storefrontService.getPage(orgSlug, pageSlug).subscribe({
// //       next: (res) => {
// //         if (!res || !res.page) {
// //           this.error.set('Page not found');
// //           this.isLoading.set(false);
// //           return;
// //         }
        
// //         this.pageData.set(res);
// //         this.updateSeo(res);
// //         this.isLoading.set(false);
// //       },
// //       error: (err) => {
// //         console.error('Page Load Error:', err);
// //         this.error.set(err.status === 404 ? 'Page not found' : 'Could not load page data');
// //         this.isLoading.set(false);
// //       }
// //     });
// //   }

// //   updateSeo(data: PublicPageResponse) {
// //     if (!data.page?.seo) return;

// //     this.titleService.setTitle(data.page.seo.title || data.page.name);
    
// //     if (data.page.seo.description) {
// //       this.metaService.updateTag({ name: 'description', content: data.page.seo.description });
// //     }
    
// //     // Safety check for keywords
// //     if (data.page.seo.keywords && Array.isArray(data.page.seo.keywords)) {
// //        this.metaService.updateTag({ name: 'keywords', content: data.page.seo.keywords.join(', ') });
// //     }
// //   }
// // }

// // // import { Component, OnInit, inject, signal } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { ActivatedRoute } from '@angular/router';
// // // import { Title, Meta } from '@angular/platform-browser';

// // // // Models
// // // import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';

// // // // Sections
// // // import { HeroBannerComponent } from '../../sections/hero-banner/hero-banner.component';
// // // import { ProductSliderComponent } from '../../sections/product-slider/product-slider.component';
// // // import { PublicPageResponse } from '../../../../core/models/storefront.model';
// // // // Import other sections...

// // // @Component({
// // //   selector: 'app-dynamic-page',
// // //   standalone: true,
// // //   imports: [
// // //     CommonModule,
// // //     HeroBannerComponent,
// // //     ProductSliderComponent
// // //     // Add other sections to imports
// // //   ],
// // //   template: `
// // //     @if (isLoading()) {
// // //       <div class="flex items-center justify-center min-h-screen">
// // //         <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
// // //       </div>
// // //     }

// // //     @if (error()) {
// // //       <div class="flex flex-col items-center justify-center min-h-screen text-center px-4">
// // //         <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
// // //         <p class="text-gray-600 text-lg">{{ error() }}</p>
// // //       </div>
// // //     }

// // //     @if (pageData(); as data) {
// // //       <div class="min-h-screen"
// // //            [style.--primary-color]="data.page.theme.primaryColor"
// // //            [style.--secondary-color]="data.page.theme.secondaryColor"
// // //            [style.font-family]="data.page.theme.fontFamily">

// // //         @for (section of data.page.sections; track section.id) {
// // //           <section [id]="'section-' + section.position" class="w-full">
            
// // //             @switch (section.type) {
              
// // //               @case ('hero_banner') {
// // //                 <app-hero-banner [config]="section.config" />
// // //               }

// // //               @case ('product_slider') {
// // //                 <app-product-slider 
// // //                   [config]="section.config" 
// // //                   [products]="section.data"> </app-product-slider>
// // //               }

// // //               @case ('feature_grid') {
// // //                 <div class="p-8 text-center bg-gray-100">Feature Grid Placeholder</div>
// // //               }

// // //               @default {
// // //                 @if (isDevMode) {
// // //                   <div class="p-4 border-2 border-dashed border-red-300 m-4 text-center text-red-500">
// // //                     Unknown Section Type: {{ section.type }}
// // //                   </div>
// // //                 }
// // //               }

// // //             }
// // //           </section>
// // //         }

// // //       </div>
// // //     }
// // //   `
// // // })
// // // export class DynamicPageComponent implements OnInit {
// // //   private route = inject(ActivatedRoute);
// // //   private storefrontService = inject(StorefrontPublicService);
// // //   private titleService = inject(Title);
// // //   private metaService = inject(Meta);

// // //   pageData = signal<PublicPageResponse | null>(null);
// // //   isLoading = signal(true);
// // //   error = signal<string | null>(null);
// // //   isDevMode = true; // Set to false in production

// // //   ngOnInit() {
// // //     this.route.paramMap.subscribe(params => {
// // //       const orgSlug = params.get('orgSlug');
// // //       const pageSlug = params.get('pageSlug');

// // //       if (orgSlug && pageSlug) {
// // //         this.loadPage(orgSlug, pageSlug);
// // //       }
// // //     });
// // //   }

// // //   loadPage(orgSlug: string, pageSlug: string) {
// // //     this.isLoading.set(true);
// // //     this.storefrontService.getPage(orgSlug, pageSlug).subscribe({
// // //       next: (res) => {
// // //         this.pageData.set(res);
// // //         this.updateSeo(res);
// // //         this.isLoading.set(false);
// // //       },
// // //       error: (err) => {
// // //         this.error.set(err.error?.message || 'Page not found');
// // //         this.isLoading.set(false);
// // //       }
// // //     });
// // //   }

// // //   updateSeo(data: PublicPageResponse) {
// // //     this.titleService.setTitle(data.page.seo.title || data.page.name);
// // //     this.metaService.updateTag({ name: 'description', content: data.page.seo.description || '' });
// // //     // Add more meta tags here
// // //   }
// // // }