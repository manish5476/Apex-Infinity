import { Component, Input, signal, computed, inject, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { StorefrontStateService } from '@core/services/storefront-state.service';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
  url: string;
  count?: number;
}

export interface CategoryGridConfig {
  title?: string;
  layout?: 'grid' | 'masonry' | 'circle';
  selectedCategories?: string[];
  limit?: number;
  design?: any;       // Upgraded: Replaces backgroundColor
  typography?: any;   // Upgraded: Custom fonts/colors
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundImage?: string;
}

const PADDING: Record<string, string> = {
  none: '0', sm: '3rem', md: '5rem', lg: '8rem', xl: '11rem'
};

const MOCK_CATEGORIES: CategoryItem[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80', description: null, url: '/products?category=electronics', count: 84 },
  { id: '2', name: 'Audio', slug: 'audio', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', description: null, url: '/products?category=audio', count: 32 },
  { id: '3', name: 'Wearables', slug: 'wearables', image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&q=80', description: null, url: '/products?category=wearables', count: 19 },
  { id: '4', name: 'Photography', slug: 'photography', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80', description: null, url: '/products?category=photography', count: 47 },
  { id: '5', name: 'Gaming', slug: 'gaming', image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&q=80', description: null, url: '/products?category=gaming', count: 28 },
  { id: '6', name: 'Smart Home', slug: 'smart-home', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80', description: null, url: '/products?category=smart-home', count: 55 },
  { id: '7', name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80', description: null, url: '/products?category=accessories', count: 63 },
  { id: '8', name: 'Computing', slug: 'computing', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80', description: null, url: '/products?category=computing', count: 41 }
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-category-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="grid-root" [ngStyle]="sectionStyle()">

      @if (cfg().backgroundImage) {
        <div class="grid-bg-image" [style.background-image]="'url(' + cfg().backgroundImage + ')'"></div>
        <div class="grid-bg-overlay"></div>
      }

      <div class="grid-container relative z-10 max-w-[1400px] mx-auto px-6 md:px-12">
        <header class="grid-header text-center mb-12 flex flex-col items-center gap-2">
          <span class="grid-eyebrow font-mono text-[10px] font-bold uppercase tracking-[3px]"
                [ngStyle]="{'color': cfg().backgroundImage ? 'rgba(255,255,255,0.7)' : (cfg().typography?.headingColor || 'var(--accent-primary)')}">
            Categories
          </span>
          <h2 class="grid-title font-heading text-4xl md:text-5xl font-bold tracking-tight m-0"
              [ngStyle]="{'font-family': cfg().typography?.headingFont || 'var(--font-heading)', 'color': cfg().backgroundImage ? '#ffffff' : (cfg().typography?.headingColor || 'var(--text-primary)')}">
            {{ cfg().title }}
          </h2>
        </header>

        <div class="cat-grid gap-6 md:gap-8" 
             [ngClass]="{
               'grid-layout': cfg().layout === 'grid' || cfg().layout === 'masonry',
               'circle-layout': cfg().layout === 'circle'
             }">
             
          @for (cat of displayCategories(); track cat.id; let i = $index) {
            <a [routerLink]="categoryLink(cat)" [queryParams]="categoryParams(cat)" class="cat-card group block relative rounded-2xl overflow-hidden bg-surface-100 border border-surface-200 transition-all duration-300"
               [ngClass]="{'aspect-square !rounded-full': cfg().layout === 'circle', 'aspect-[3/4]': cfg().layout !== 'circle'}"
               [ngStyle]="{
                 'border-radius': 'var(--ui-border-radius-' + (cfg().design?.borderRadius || '2xl') + ')',
                 'box-shadow': 'var(--shadow-' + (cfg().design?.boxShadow || 'none') + ')'
               }">

              <div class="absolute inset-0">
                <img [src]="cat.image || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80'" [alt]="cat.name" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div class="cat-gradient absolute inset-0 opacity-75 transition-opacity duration-300 group-hover:opacity-100"></div>
              </div>

              @if (cat.count !== undefined) {
                <span class="absolute top-4 right-4 z-10 bg-white/10 backdrop-blur-md border border-white/20 text-white/90 px-3 py-1 rounded-full font-mono text-[10px] font-bold tracking-wider">
                  {{ cat.count }}
                </span>
              }

              <div class="absolute bottom-0 left-0 right-0 p-6 z-10 flex flex-col gap-2" [ngClass]="{'text-center pb-8': cfg().layout === 'circle'}">
                <h3 class="m-0 font-bold text-white text-xl md:text-2xl leading-tight text-shadow-sm"
                    [ngStyle]="{'font-family': cfg().typography?.headingFont || 'var(--font-heading)'}">
                  {{ cat.name }}
                </h3>
                
                <div class="cat-cta flex items-center justify-between pt-3 border-t border-white/20 opacity-70 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
                     [ngClass]="{'justify-center border-none': cfg().layout === 'circle'}">
                  <span class="font-mono text-[10px] font-bold uppercase tracking-wider text-white/90">Explore</span>
                  <span class="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center text-white transition-transform duration-300 group-hover:translate-x-1"
                        [ngClass]="{'hidden': cfg().layout === 'circle'}">
                    <i class="pi pi-arrow-right text-[10px]"></i>
                  </span>
                </div>
              </div>
            </a>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    
    .grid-root { position: relative; overflow: hidden; width: 100%; }
    .grid-bg-image { position: absolute; inset: 0; background-size: cover; background-position: center; background-attachment: fixed; z-index: 0; }
    .grid-bg-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.55); z-index: 1; }

    .cat-grid { display: grid; }
    .grid-layout { @media (min-width: 480px) { grid-template-columns: repeat(2, 1fr); } @media (min-width: 900px) { grid-template-columns: repeat(4, 1fr); } }
    .circle-layout { @media (min-width: 480px) { grid-template-columns: repeat(3, 1fr); } @media (min-width: 900px) { grid-template-columns: repeat(4, 1fr); } }

    .cat-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-2xl); }
    .cat-card:focus-visible { box-shadow: 0 0 0 3px var(--bg-primary), 0 0 0 5px var(--accent-primary); outline: none; }

    .cat-gradient {
      background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.05) 70%, transparent 100%);
    }
    .circle-layout .cat-gradient {
      background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
    }

    .text-shadow-sm { text-shadow: 0 2px 8px rgba(0,0,0,0.4); }
  `]
})
export class CategoryGridComponent {
  private stateService = inject(StorefrontStateService);
  private router = inject(Router);

  @Input() set config(v: CategoryGridConfig) { this._config.set(v ?? {}); }
  @Input() set categories(v: CategoryItem[]) { this._categories.set(v ?? []); }
  @Input() orgSlug = '';

  private _config = signal<CategoryGridConfig>({});
  private _categories = signal<CategoryItem[]>([]);

  readonly cfg = computed(() => ({
    title: this._config().title ?? 'Browse by Category',
    layout: this._config().layout ?? 'grid',
    limit: this._config().limit ?? 8,
    design: this._config().design,
    typography: this._config().typography,
    paddingTop: this._config().paddingTop ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    backgroundImage: this._config().backgroundImage
  }));

  readonly displayCategories = computed(() => {
    const live = this._categories();
    return (live.length ? live : MOCK_CATEGORIES).slice(0, this.cfg().limit);
  });

  readonly sectionStyle = computed(() => ({
    'padding-top': PADDING[this.cfg().paddingTop],
    'padding-bottom': PADDING[this.cfg().paddingBottom],
    'background-color': this.cfg().design?.customBackground || 'var(--bg-primary)'
  }));

  readonly slug = computed(() => this.stateService.organization()?.slug || this.orgSlug || this._parseSlugFromUrl());

  categoryLink(cat: CategoryItem): string[] {
    const s = this.slug();
    if (s) return ['/store', s, 'products'];
    return [cat.url];
  }

  categoryParams(cat: CategoryItem): Record<string, string> {
    return { category: cat.slug };
  }

  private _parseSlugFromUrl(): string {
    const m = this.router.url.match(/\/store\/([^/?#]+)/);
    return (m?.[1] && m[1] !== 'undefined') ? m[1] : '';
  }
}// // src/app/modules/storefront-public/pages/category-grid/category-grid.component.ts
// import {
//   Component, Input, signal, computed,
//   inject, ChangeDetectionStrategy
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, Router } from '@angular/router';
// import { StorefrontStateService } from '@core/services/storefront-state.service';

// // Matches DataHydrationService._hydrateCategoryGrid output
// export interface CategoryItem {
//   id:          string;
//   name:        string;
//   slug:        string;
//   image:       string | null;
//   description: string | null;
//   url:         string;          // pre-built by hydration service
//   count?:      number;
// }

// export interface CategoryGridConfig {
//   title?:              string;
//   layout?:             'grid' | 'masonry' | 'circle';
//   selectedCategories?: string[];
//   limit?:              number;
//   // Style tokens from section schema
//   paddingTop?:         'none' | 'sm' | 'md' | 'lg' | 'xl';
//   paddingBottom?:      'none' | 'sm' | 'md' | 'lg' | 'xl';
//   backgroundColor?:    string;
//   backgroundImage?:    string;
//   themeMode?:          'auto' | 'light' | 'dark' | 'glass';
// }

// const PADDING: Record<string, string> = {
//   none: '0',
//   sm:   '3rem',
//   md:   '5rem',
//   lg:   '8rem',
//   xl:   '11rem'
// };

// const MOCK_CATEGORIES: CategoryItem[] = [
//   { id: '1', name: 'Electronics',   slug: 'electronics',   image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80', description: null, url: '/products?category=electronics',   count: 84 },
//   { id: '2', name: 'Audio',         slug: 'audio',         image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', description: null, url: '/products?category=audio',         count: 32 },
//   { id: '3', name: 'Wearables',     slug: 'wearables',     image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&q=80', description: null, url: '/products?category=wearables',     count: 19 },
//   { id: '4', name: 'Photography',   slug: 'photography',   image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80', description: null, url: '/products?category=photography',   count: 47 },
//   { id: '5', name: 'Gaming',        slug: 'gaming',        image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&q=80', description: null, url: '/products?category=gaming',        count: 28 },
//   { id: '6', name: 'Smart Home',    slug: 'smart-home',    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80', description: null, url: '/products?category=smart-home',    count: 55 },
//   { id: '7', name: 'Accessories',   slug: 'accessories',   image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80', description: null, url: '/products?category=accessories',   count: 63 },
//   { id: '8', name: 'Computing',     slug: 'computing',     image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80', description: null, url: '/products?category=computing',     count: 41 }
// ];

// @Component({
//   selector: 'app-category-grid',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './category-grid.component.html',
//   styleUrls:   ['./category-grid.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class CategoryGridComponent {

//   private stateService = inject(StorefrontStateService);
//   private router       = inject(Router);

//   @Input() set config(v: CategoryGridConfig) { this._config.set(v ?? {}); }
//   @Input() set categories(v: CategoryItem[]) { this._categories.set(v ?? []); }
//   @Input() orgSlug = '';

//   private _config     = signal<CategoryGridConfig>({});
//   private _categories = signal<CategoryItem[]>([]);

//   readonly cfg = computed(() => ({
//     title:         this._config().title         ?? 'Browse by Category',
//     layout:        this._config().layout        ?? 'grid',
//     paddingTop:    this._config().paddingTop    ?? 'lg',
//     paddingBottom: this._config().paddingBottom ?? 'lg',
//     backgroundColor: this._config().backgroundColor,
//     backgroundImage: this._config().backgroundImage,
//     themeMode:     this._config().themeMode     ?? 'auto'
//   }));

//   readonly displayCategories = computed(() => {
//     const live  = this._categories();
//     const limit = this._config().limit ?? 8;
//     return (live.length ? live : MOCK_CATEGORIES).slice(0, limit);
//   });

//   readonly sectionStyle = computed(() => ({
//     'padding-top':    PADDING[this.cfg().paddingTop]    ?? '8rem',
//     'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '8rem',
//     'background-color': this.cfg().backgroundColor ?? ''
//   }));

//   readonly hasBgImage = computed(() => !!this.cfg().backgroundImage);

//   /** Resolved org slug — state service → @Input → URL */
//   readonly slug = computed(() =>
//     this.stateService.organization()?.slug ||
//     this.orgSlug ||
//     this._parseSlugFromUrl()
//   );

//   /** Build full routerLink array for a category */
//   categoryLink(cat: CategoryItem): string[] {
//     const s = this.slug();
//     if (s) return ['/store', s, 'products'];
//     return [cat.url];
//   }

//   /** Query params for filtering by category */
//   categoryParams(cat: CategoryItem): Record<string, string> {
//     return { category: cat.slug };
//   }

//   private _parseSlugFromUrl(): string {
//     const m = this.router.url.match(/\/store\/([^/?#]+)/);
//     return (m?.[1] && m[1] !== 'undefined') ? m[1] : '';
//   }
// }
