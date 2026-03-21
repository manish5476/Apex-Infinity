// src/app/modules/storefront-public/pages/category-grid/category-grid.component.ts
import {
  Component, Input, signal, computed,
  inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { StorefrontStateService } from '@core/services/storefront-state.service';

// Matches DataHydrationService._hydrateCategoryGrid output
export interface CategoryItem {
  id:          string;
  name:        string;
  slug:        string;
  image:       string | null;
  description: string | null;
  url:         string;          // pre-built by hydration service
  count?:      number;
}

export interface CategoryGridConfig {
  title?:              string;
  layout?:             'grid' | 'masonry' | 'circle';
  selectedCategories?: string[];
  limit?:              number;
  // Style tokens from section schema
  paddingTop?:         'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?:      'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?:    string;
  backgroundImage?:    string;
  themeMode?:          'auto' | 'light' | 'dark' | 'glass';
}

const PADDING: Record<string, string> = {
  none: '0',
  sm:   '3rem',
  md:   '5rem',
  lg:   '8rem',
  xl:   '11rem'
};

const MOCK_CATEGORIES: CategoryItem[] = [
  { id: '1', name: 'Electronics',   slug: 'electronics',   image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80', description: null, url: '/products?category=electronics',   count: 84 },
  { id: '2', name: 'Audio',         slug: 'audio',         image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', description: null, url: '/products?category=audio',         count: 32 },
  { id: '3', name: 'Wearables',     slug: 'wearables',     image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&q=80', description: null, url: '/products?category=wearables',     count: 19 },
  { id: '4', name: 'Photography',   slug: 'photography',   image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80', description: null, url: '/products?category=photography',   count: 47 },
  { id: '5', name: 'Gaming',        slug: 'gaming',        image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&q=80', description: null, url: '/products?category=gaming',        count: 28 },
  { id: '6', name: 'Smart Home',    slug: 'smart-home',    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80', description: null, url: '/products?category=smart-home',    count: 55 },
  { id: '7', name: 'Accessories',   slug: 'accessories',   image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80', description: null, url: '/products?category=accessories',   count: 63 },
  { id: '8', name: 'Computing',     slug: 'computing',     image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80', description: null, url: '/products?category=computing',     count: 41 }
];

@Component({
  selector: 'app-category-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './category-grid.component.html',
  styleUrls:   ['./category-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryGridComponent {

  private stateService = inject(StorefrontStateService);
  private router       = inject(Router);

  @Input() set config(v: CategoryGridConfig) { this._config.set(v ?? {}); }
  @Input() set categories(v: CategoryItem[]) { this._categories.set(v ?? []); }
  @Input() orgSlug = '';

  private _config     = signal<CategoryGridConfig>({});
  private _categories = signal<CategoryItem[]>([]);

  readonly cfg = computed(() => ({
    title:         this._config().title         ?? 'Browse by Category',
    layout:        this._config().layout        ?? 'grid',
    paddingTop:    this._config().paddingTop    ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    backgroundColor: this._config().backgroundColor,
    backgroundImage: this._config().backgroundImage,
    themeMode:     this._config().themeMode     ?? 'auto'
  }));

  readonly displayCategories = computed(() => {
    const live  = this._categories();
    const limit = this._config().limit ?? 8;
    return (live.length ? live : MOCK_CATEGORIES).slice(0, limit);
  });

  readonly sectionStyle = computed(() => ({
    'padding-top':    PADDING[this.cfg().paddingTop]    ?? '8rem',
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '8rem',
    'background-color': this.cfg().backgroundColor ?? ''
  }));

  readonly hasBgImage = computed(() => !!this.cfg().backgroundImage);

  /** Resolved org slug — state service → @Input → URL */
  readonly slug = computed(() =>
    this.stateService.organization()?.slug ||
    this.orgSlug ||
    this._parseSlugFromUrl()
  );

  /** Build full routerLink array for a category */
  categoryLink(cat: CategoryItem): string[] {
    const s = this.slug();
    if (s) return ['/store', s, 'products'];
    return [cat.url];
  }

  /** Query params for filtering by category */
  categoryParams(cat: CategoryItem): Record<string, string> {
    return { category: cat.slug };
  }

  private _parseSlugFromUrl(): string {
    const m = this.router.url.match(/\/store\/([^/?#]+)/);
    return (m?.[1] && m[1] !== 'undefined') ? m[1] : '';
  }
}