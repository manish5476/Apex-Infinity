import {
  Component, OnInit, inject, signal, computed,
  ChangeDetectionStrategy, OnDestroy, ViewEncapsulation,
  Input, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject, combineLatest, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { SelectModule } from 'primeng/select';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DrawerModule } from 'primeng/drawer';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import { AccordionModule } from 'primeng/accordion';
import { RippleModule } from 'primeng/ripple';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { SliderModule } from 'primeng/slider';

import { StorefrontPublicService, ProductListParams } from '../../../../core/services/storefront-public.service';
import { StorefrontStateService } from '../../../../core/services/storefront-state.service';
import { ProductCardComponent } from '../product-card/product-card';
import { ProductListingConfig } from '@core/models/storefront.model';

export interface ProductListingFilters {
  category: string;
  brand: string;
  minPrice: number | null;
  maxPrice: number | null;
  search: string;
  inStock: boolean;
  tags: string;
  sort: string;
  page: number;
  limit: number;
}

function defaultListingFilters(limit: number): ProductListingFilters {
  return {
    category: '', brand: '', minPrice: null, maxPrice: null,
    search: '', inStock: false, tags: '', sort: '-createdAt', page: 1, limit
  };
}

@Component({
  selector: 'app-product-listing',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ProductCardComponent,
    SelectModule, CheckboxModule, PaginatorModule, ButtonModule,
    DrawerModule, BadgeModule, InputTextModule, AccordionModule,
    RippleModule, SkeletonModule, TooltipModule, SliderModule
  ],
  templateUrl: './product-listing.component.html',
  styleUrls: ['./product-listing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger(30, [animate('0.35s cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))])
        ], { optional: true })
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.25s ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class ProductListingComponent implements OnInit, OnDestroy {
  // Reference to the scrollable products container — used for scroll reset on page change
  @ViewChild('productsScrollArea') productsScrollArea!: ElementRef<HTMLDivElement>;

  @Input() set config(v: ProductListingConfig) { this._config.set(v ?? {}); }
  private _config = signal<ProductListingConfig>({});

  readonly cfg = computed(() => ({
    showSidebar: this._config().showSidebar ?? true,
    defaultSort: this._config().defaultSort ?? 'newest',
    itemsPerPage: this._config().itemsPerPage ?? 12,
    paddingTop: this._config().paddingTop ?? 'md',
    paddingBottom: this._config().paddingBottom ?? 'md',
    backgroundColor: this._config().backgroundColor ?? ''
  }));

  // Padding is now irrelevant since page-root is height:100vh, but keep for bg color
  readonly sectionStyle = computed(() => ({
    'background-color': this.cfg().backgroundColor || ''
  }));

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private publicService = inject(StorefrontPublicService);
  public stateService = inject(StorefrontStateService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  products = signal<any[]>([]);
  categories = signal<any[]>([]);
  brands = signal<any[]>([]);
  tags = signal<string[]>([]);
  priceLimits = signal<{ min: number; max: number }>({ min: 0, max: 10000 });
  allFilters = computed(() => [...this.categories(), ...this.brands()]);

  loading = signal(true);
  showMobileFilters = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');

  // Filter dialog: which tab is active
  activeFilterTab = signal<'sort' | 'category' | 'brand' | 'price' | 'tags' | 'stock'>('sort');

  // Quick price preset chips
  pricePresets = computed(() => {
    const { min, max } = this.priceLimits();
    return [
      { label: 'Under ₹500', min, max: 500 },
      { label: '₹500–₹1k', min: 500, max: 1000 },
      { label: '₹1k–₹5k', min: 1000, max: 5000 },
      { label: '₹5k–₹10k', min: 5000, max: 10000 },
      { label: 'Above ₹10k', min: 10000, max },
    ].filter(p => p.min < max);
  });

  totalItems = signal(0);
  rows = signal(12);
  first = signal(0);
  orgSlug = signal('');

  sortOptions = [
    { label: 'Newest Arrivals', value: '-createdAt', icon: 'pi pi-calendar' },
    { label: 'Price: Low to High', value: 'sellingPrice', icon: 'pi pi-sort-amount-up' },
    { label: 'Price: High to Low', value: '-sellingPrice', icon: 'pi pi-sort-amount-down' },
    { label: 'Name (A-Z)', value: 'name', icon: 'pi pi-sort-alpha-down' }
  ];

  filters = signal<ProductListingFilters>(defaultListingFilters(12));
  rangeValues = signal<[number, number]>([0, 10000]);

  activeFilterCount = computed(() => {
    const f = this.filters();
    return [f.category, f.brand, f.minPrice != null || f.maxPrice != null, f.inStock, f.tags]
      .filter(Boolean).length;
  });

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(450),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.handleSmartSearch(term));

    combineLatest([
      this.route.parent?.paramMap || new Subject(),
      this.route.queryParams
    ]).pipe(takeUntil(this.destroy$)).subscribe(([parentParams, queryParams]: any) => {
      const newSlug = parentParams.get('orgSlug') ?? '';
      if (newSlug && newSlug !== this.orgSlug()) {
        this.orgSlug.set(newSlug);
        this.loadStoreMetadata();
      }
      this.syncFiltersFromUrl(queryParams);
      if (this.orgSlug()) this.loadProducts();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStoreMetadata() {
    this.publicService.getStoreMetadata(this.orgSlug()).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.categories.set(data.enums?.categories || []);
        this.brands.set(data.enums?.brands || []);
        this.tags.set(data.enums?.tags || []);
        const limits = data.filters?.price || { min: 0, max: 10000 };
        this.priceLimits.set({ min: limits.min, max: limits.max });
        const f = this.filters();
        if (f.minPrice == null && f.maxPrice == null) {
          this.rangeValues.set([limits.min, limits.max]);
        }
      },
      error: (err) => console.error('Meta load failed', err)
    });
  }

  loadProducts() {
    this.loading.set(true);
    const f = this.filters();
    const params: ProductListParams = {
      ...f,
      minPrice: f.minPrice ?? undefined,
      maxPrice: f.maxPrice ?? undefined,
    };
    this.publicService.getProducts(this.orgSlug(), params).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.products.set(data.products || []);
        this.totalItems.set(data.pagination?.total || 0);
        this.loading.set(false);
        // Scroll ONLY the products panel back to top — not window
        this.scrollProductsToTop();
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  /** Scroll only the inner products scroll area — not the window */
  private scrollProductsToTop() {
    const el = this.productsScrollArea?.nativeElement;
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onSearchInput(event: Event) {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  handleSmartSearch(term: string) {
    if (!term) { this.applyFilter('search', null); return; }
    const cleanTerm = term.toLowerCase().trim();
    const matchedFilter = this.allFilters().find(item => item.name.toLowerCase() === cleanTerm);
    if (matchedFilter) {
      if (matchedFilter.type === 'category') {
        this.applyFilter('category', matchedFilter.id);
        this.applyFilter('search', null, false);
      } else if (matchedFilter.type === 'brand') {
        this.applyFilter('brand', matchedFilter.id);
        this.applyFilter('search', null, false);
      }
    } else {
      this.applyFilter('search', term);
    }
  }

  syncFiltersFromUrl(params: any) {
    const base = defaultListingFilters(this.cfg().itemsPerPage);
    const merged: ProductListingFilters = {
      ...base,
      category: params['category'] ?? '',
      brand: params['brand'] ?? '',
      minPrice: params['minPrice'] != null && params['minPrice'] !== '' ? +params['minPrice'] : null,
      maxPrice: params['maxPrice'] != null && params['maxPrice'] !== '' ? +params['maxPrice'] : null,
      search: params['search'] ?? '',
      sort: params['sort'] ?? '-createdAt',
      inStock: params['inStock'] === 'true',
      tags: params['tags'] ?? '',
      page: params['page'] ? +params['page'] : 1,
      limit: params['limit'] ? +params['limit'] : this.cfg().itemsPerPage,
    };
    this.filters.set(merged);
    if (params['minPrice'] || params['maxPrice']) {
      this.rangeValues.set([
        params['minPrice'] ? +params['minPrice'] : this.priceLimits().min,
        params['maxPrice'] ? +params['maxPrice'] : this.priceLimits().max
      ]);
    }
    this.rows.set(merged.limit);
    // KEY FIX: first = (page - 1) * limit for paginator stability
    this.first.set((merged.page - 1) * merged.limit);
  }

  applyFilter(key: string, value: any, triggerNavigation = true) {
    this.filters.update(f => ({ ...f, [key]: value, ...(triggerNavigation ? { page: 1 } : {}) }));
    if (!triggerNavigation) return;
    const queryParams: any = { ...this.filters(), page: 1 };
    Object.keys(queryParams).forEach(k => {
      if (queryParams[k] === null || queryParams[k] === '' || queryParams[k] === undefined) {
        delete queryParams[k];
      }
    });
    if (key === 'inStock' && value === false) delete queryParams['inStock'];
    this.updateRouter(queryParams);
  }

  onPriceChange(event: any) {
    const [min, max] = event.values as [number, number];
    const f = this.filters();
    if (min !== f.minPrice || max !== f.maxPrice) {
      this.rangeValues.set([min, max]);
      this.updateRouter({ ...f, minPrice: min, maxPrice: max, page: 1 });
    }
  }

  patchRangeEnd(index: 0 | 1, value: number) {
    const r = this.rangeValues();
    const next: [number, number] = index === 0 ? [+value, r[1]] : [r[0], +value];
    this.rangeValues.set(next);
    this.onPriceChange({ values: next });
  }

  toggleTag(tag: string) {
    const f = this.filters();
    let currentTags = f.tags ? f.tags.split(',') : [];
    if (currentTags.includes(tag)) currentTags = currentTags.filter((t: string) => t !== tag);
    else currentTags.push(tag);
    this.applyFilter('tags', currentTags.length ? currentTags.join(',') : null);
  }


  applyPreset(preset: { label: string; min: number; max: number }) {
    this.rangeValues.set([preset.min, preset.max]);
    this.onPriceChange({ values: [preset.min, preset.max] });
  }

  onPageChange(event: any) {
    const newPage = Math.floor(event.first / event.rows) + 1;
    // Update first + rows signals immediately for stable paginator state
    this.first.set(event.first);
    this.rows.set(event.rows);
    this.updateRouter({ ...this.filters(), page: newPage, limit: event.rows });
  }

  clearFilters() {
    this.rangeValues.set([this.priceLimits().min, this.priceLimits().max]);
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  private updateRouter(queryParams: any) {
    // Clean nulls / empty
    const clean: any = {};
    for (const k of Object.keys(queryParams)) {
      if (queryParams[k] !== null && queryParams[k] !== '' && queryParams[k] !== undefined) {
        clean[k] = queryParams[k];
      }
    }
    this.router.navigate([], { relativeTo: this.route, queryParams: clean, replaceUrl: true });
  }
}