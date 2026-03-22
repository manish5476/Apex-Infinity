import { 
  Component, 
  OnInit, 
  inject, 
  signal, 
  computed, 
  ChangeDetectionStrategy, 
  OnDestroy, 
  ViewEncapsulation,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  trigger, 
  transition, 
  style, 
  animate, 
  query, 
  stagger 
} from '@angular/animations'; // ✅ CORRECT IMPORT
import { Subject, combineLatest, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

// PrimeNG Imports
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

import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
import { StorefrontStateService } from '../../../../core/services/storefront-state.service';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { ProductListingConfig } from '@core/models/storefront.model';

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
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(50, [
            animate('0.4s cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.3s ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class ProductListingComponent implements OnInit, OnDestroy {
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

  readonly paddingMap: Record<string, string> = {
    none: '0',
    sm: 'var(--spacing-3xl)',
    md: 'var(--spacing-5xl)',
    lg: 'calc(var(--spacing-5xl) * 1.5)',
    xl: 'calc(var(--spacing-5xl) * 2)'
  };

  readonly sectionStyle = computed(() => ({
    'padding-top': this.paddingMap[this.cfg().paddingTop] ?? this.paddingMap['md'],
    'padding-bottom': this.paddingMap[this.cfg().paddingBottom] ?? this.paddingMap['md'],
    'background-color': this.cfg().backgroundColor || ''
  }));
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private publicService = inject(StorefrontPublicService);
  public stateService = inject(StorefrontStateService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // --- State Signals ---
  products = signal<any[]>([]);
  
  // Metadata Signals
  categories = signal<any[]>([]); 
  brands = signal<any[]>([]);     
  tags = signal<string[]>([]);    
  priceLimits = signal<{ min: number, max: number }>({ min: 0, max: 10000 });

  // ✅ Universal Search Helper: Combines Cats & Brands
  allFilters = computed(() => [...this.categories(), ...this.brands()]);

  // UI State
  loading = signal(true);
  showMobileFilters = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');

  // Pagination
  totalItems = signal(0);
  rows = signal(12);
  first = signal(0);
  orgSlug = '';

  // Sort Options (Matches Backend Logic)
  sortOptions = [
    { label: 'Newest Arrivals', value: '-createdAt', icon: 'pi pi-calendar' },
    { label: 'Price: Low to High', value: 'sellingPrice', icon: 'pi pi-sort-amount-up' },
    { label: 'Price: High to Low', value: '-sellingPrice', icon: 'pi pi-sort-amount-down' },
    { label: 'Name (A-Z)', value: 'name', icon: 'pi pi-sort-alpha-down' }
  ];

  filters: any = {
    category: '',
    brand: '',
    minPrice: null,
    maxPrice: null,
    search: '',
    inStock: false,
    tags: '',
    sort: '-createdAt',
    page: 1,
    limit: 12
  };

  // Slider UI Model
  rangeValues: number[] = [0, 10000];

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.filters.category) count++;
    if (this.filters.brand) count++;
    if (this.filters.minPrice || this.filters.maxPrice) count++;
    if (this.filters.inStock) count++;
    if (this.filters.tags) count++;
    return count;
  });

  ngOnInit() {
    // 1. Smart Search Subscriber
    this.searchSubject.pipe(
      debounceTime(500), // Wait for user to finish typing
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.handleSmartSearch(term);
    });

    // 2. Initialize Data
    combineLatest([
      this.route.parent?.paramMap || new Subject(),
      this.route.queryParams
    ]).pipe(takeUntil(this.destroy$)).subscribe(([parentParams, queryParams]: any) => {

      const newSlug = parentParams.get('orgSlug');

      console.log(this.orgSlug);
      if (newSlug && newSlug !== this.orgSlug) {
        this.orgSlug = newSlug;
        console.log(this.orgSlug);
        this.loadStoreMetadata();
      }

      this.syncFiltersFromUrl(queryParams);

      if (this.orgSlug) this.loadProducts();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Data Loading ---

  loadStoreMetadata() {
    this.publicService.getStoreMetadata(this.orgSlug).subscribe({
      next: (res: any) => {
        // ✅ Map response to signals
        this.categories.set(res.enums.categories || []);
        this.brands.set(res.enums.brands || []);
        this.tags.set(res.enums.tags || []);

        // ✅ Set Price Limits
        const limits = res.filters.price;
        this.priceLimits.set({ min: limits.min, max: limits.max });

        // Initialize slider only if user hasn't set a custom price
        if (!this.filters.minPrice && !this.filters.maxPrice) {
          this.rangeValues = [limits.min, limits.max];
        }
      },
      error: (err) => console.error('Meta load failed', err)
    });
  }

  loadProducts() {
    this.loading.set(true);
    this.publicService.getProducts(this.orgSlug, this.filters).subscribe({
      next: (res: any) => {
        this.products.set(res.products);
        this.totalItems.set(res.pagination.total);
        this.loading.set(false);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  // --- Actions ---

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchSubject.next(val);
  }

  /**
   * ✅ SMART SEARCH LOGIC
   * Checks if user input matches a Category or Brand name.
   * If yes -> Applies that Filter.
   * If no -> Performs standard Text Search.
   */
  handleSmartSearch(term: string) {
    if (!term) {
      this.applyFilter('search', null);
      return;
    }

    const cleanTerm = term.toLowerCase().trim();
    
    // Check local metadata for matches
    const matchedFilter = this.allFilters().find(
      item => item.name.toLowerCase() === cleanTerm
    );

    if (matchedFilter) {
      // It's a Category or Brand! Apply exact filter.
      if (matchedFilter.type === 'category') {
        this.applyFilter('category', matchedFilter.id);
        // Clear search text to avoid double filtering
        this.applyFilter('search', null, false); 
      } 
      else if (matchedFilter.type === 'brand') {
        this.applyFilter('brand', matchedFilter.id);
        this.applyFilter('search', null, false);
      }
    } else {
      // Standard Text Search
      this.applyFilter('search', term);
    }
  }

  syncFiltersFromUrl(params: any) {
    this.filters = {
      category: '', brand: '', minPrice: null, maxPrice: null,
      search: '', sort: '-createdAt', inStock: false, tags: '',
      page: 1, limit: 12,
      ...params
    };

    // Coerce types
    if (params['page']) this.filters.page = +params['page'];
    if (params['limit']) this.filters.limit = +params['limit'];
    else this.filters.limit = this.cfg().itemsPerPage;
    this.filters.inStock = params['inStock'] === 'true';

    // Sync Slider UI
    if (params['minPrice'] || params['maxPrice']) {
      this.rangeValues = [
        params['minPrice'] ? +params['minPrice'] : this.priceLimits().min,
        params['maxPrice'] ? +params['maxPrice'] : this.priceLimits().max
      ];
    }

    this.rows.set(this.filters.limit);
    this.first.set((this.filters.page - 1) * this.filters.limit);
  }

  applyFilter(key: string, value: any, triggerNavigation = true) {
    // 1. Update Local State
    this.filters[key] = value;
    
    if (!triggerNavigation) return;

    const queryParams: any = { ...this.filters, page: 1 };

    // 2. Clean URL Params (Remove null/empty)
    Object.keys(queryParams).forEach(k => {
      if (queryParams[k] === null || queryParams[k] === '' || queryParams[k] === undefined) {
        delete queryParams[k];
      }
    });

    if (key === 'inStock' && value === false) delete queryParams['inStock'];

    this.updateRouter(queryParams);
  }

  onPriceChange(event: any) {
    const [min, max] = event.values;
    // Debounce check: only update if changed
    if (min !== this.filters.minPrice || max !== this.filters.maxPrice) {
      const qp = { ...this.filters, minPrice: min, maxPrice: max, page: 1 };
      this.updateRouter(qp);
    }
  }

  toggleTag(tag: string) {
    let currentTags = this.filters.tags ? this.filters.tags.split(',') : [];
    if (currentTags.includes(tag)) currentTags = currentTags.filter((t: string) => t !== tag);
    else currentTags.push(tag);
    this.applyFilter('tags', currentTags.length ? currentTags.join(',') : null);
  }

  onPageChange(event: any) {
    const newPage = (event.first / event.rows) + 1;
    this.updateRouter({ ...this.filters, page: newPage, limit: event.rows });
  }

  clearFilters() {
    this.filters.search = '';
    this.rangeValues = [this.priceLimits().min, this.priceLimits().max];
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  private updateRouter(queryParams: any) {
    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }
}

// import {
//   Component, OnInit, inject, signal, computed,
//   ChangeDetectionStrategy, OnDestroy, ViewEncapsulation,
//   Input
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
// import { Subject, combineLatest, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

// // PrimeNG
// import { SelectModule } from 'primeng/select';
// import { PaginatorModule } from 'primeng/paginator';
// import { ButtonModule } from 'primeng/button';
// import { CheckboxModule } from 'primeng/checkbox';
// import { DrawerModule } from 'primeng/drawer';
// import { BadgeModule } from 'primeng/badge';
// import { InputTextModule } from 'primeng/inputtext';
// import { SkeletonModule } from 'primeng/skeleton';
// import { SliderModule } from 'primeng/slider'; // ✅ Added for Price Range

// // Services & Components
// import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
// import { ProductCardComponent } from '../../components/product-card/product-card';
// import { StorefrontStateService } from '../../../../core/services/storefront-state.service';

// @Component({
//   selector: 'app-product-listing',
//   standalone: true,
//   imports: [
//     CommonModule, RouterModule, FormsModule, ProductCardComponent,
//     SelectModule, CheckboxModule, PaginatorModule, ButtonModule,
//     DrawerModule, BadgeModule, InputTextModule, SkeletonModule, SliderModule
//   ],
//   templateUrl: './product-listing.component.html',
//   styleUrls: ['./product-listing.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   animations: [
//     trigger('listAnimation', [
//       transition('* => *', [
//         query(':enter', [
//           style({ opacity: 0, transform: 'translateY(20px)' }),
//           stagger(50, [
//             animate('0.4s cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
//           ])
//         ], { optional: true })
//       ])
//     ]),
//     trigger('fadeIn', [
//       transition(':enter', [
//         style({ opacity: 0 }),
//         animate('0.3s ease-out', style({ opacity: 1 }))
//       ])
//     ])
//   ]
// })
// export class ProductListingComponent implements OnInit, OnDestroy {
//   @Input() config: any
  
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private publicService = inject(StorefrontPublicService);
//   public stateService = inject(StorefrontStateService);
//   private destroy$ = new Subject<void>();

//   public allFilters = [...this.categories(), ...this.brands()];
//   // --- Search Debounce ---
//   private searchSubject = new Subject<string>();

//   // --- State Signals ---
//   products = signal<any[]>([]);
//   categories = signal<any[]>([]); // populated from metadata
//   brands = signal<any[]>([]);     // populated from metadata
//   tags = signal<string[]>([]);    // populated from metadata
//   priceLimits = signal<{ min: number, max: number }>({ min: 0, max: 10000 });

//   loading = signal(true);
//   showMobileFilters = signal(false);
//   viewMode = signal<'grid' | 'list'>('grid');

//   // Pagination
//   totalItems = signal(0);
//   rows = signal(12);
//   first = signal(0);
//   orgSlug = '';

//   // ✅ SORT OPTIONS
//   // Matches backend logic: "-sellingPrice" means "descending price"
//   sortOptions = [
//     { label: 'Newest Arrivals', value: '-createdAt', icon: 'pi pi-calendar' },
//     { label: 'Price: Low to High', value: 'sellingPrice', icon: 'pi pi-sort-amount-up' },
//     { label: 'Price: High to Low', value: '-sellingPrice', icon: 'pi pi-sort-amount-down' },
//     { label: 'Name (A-Z)', value: 'name', icon: 'pi pi-sort-alpha-down' }
//   ];

//   filters: any = {
//     category: '',
//     brand: '',
//     minPrice: null,
//     maxPrice: null,
//     search: '',
//     inStock: false,
//     tags: '',
//     sort: '-createdAt', // Set a default valid string, not just 'createdAt'
//     page: 1,
//     limit: 12
//   };

//   // Slider values
//   rangeValues: number[] = [0, 10000];

//   activeFilterCount = computed(() => {
//     let count = 0;
//     if (this.filters.category) count++;
//     if (this.filters.brand) count++;
//     if (this.filters.minPrice || this.filters.maxPrice) count++;
//     if (this.filters.inStock) count++;
//     if (this.filters.tags) count++;
//     return count;
//   });

//   ngOnInit() {
//     // 1. Setup Search Debounce
//     this.searchSubject.pipe(
//       debounceTime(400),
//       distinctUntilChanged(),
//       takeUntil(this.destroy$)
//     ).subscribe(searchTerm => {
//       this.applyFilter('search', searchTerm);
//     });

//     // 2. Initialize (Combine Route Params + Query Params)
//     combineLatest([
//       this.route.parent?.paramMap || new Subject(),
//       this.route.queryParams
//     ]).pipe(takeUntil(this.destroy$)).subscribe(([parentParams, queryParams]: any) => {

//       const newSlug = parentParams.get('orgSlug');

//       // If Org changed (or first load), fetch Metadata
//       if (newSlug && newSlug !== this.orgSlug) {
//         this.orgSlug = newSlug;
//         this.loadStoreMetadata();
//       }

//       // Sync Filters
//       this.syncFiltersFromUrl(queryParams);

//       // Fetch Products
//       if (this.orgSlug) this.loadProducts();
//     });
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   // --- Data Loading ---

  
//   loadStoreMetadata() {
//     this.publicService.getStoreMetadata(this.orgSlug).subscribe({
//       next: (res: any) => {
//         this.categories.set(res.enums.categories || []);
//         this.brands.set(res.enums.brands || []);
//         this.tags.set(res.enums.tags || []);

//         const limits = res.filters.price;
//         this.priceLimits.set({ min: limits.min, max: limits.max });

//         // Init Slider if filters empty
//         if (!this.filters.minPrice) this.rangeValues = [limits.min, limits.max];
//       },
//       error: (err) => console.error('Meta load failed', err)
//     });
//   }

//   loadProducts() {
//     this.loading.set(true);
//     this.publicService.getProducts(this.orgSlug, this.filters).subscribe({
//       next: (res: any) => {
//         this.products.set(res.products);
//         this.totalItems.set(res.pagination.total);
//         this.loading.set(false);
//         if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
//       },
//       error: (err) => {
//         console.error(err);
//         this.loading.set(false);
//       }
//     });
//   }

//   // --- Actions ---

//   // ✅ FIXED: Explicitly added this method to satisfy template
//   onSearchInput(event: Event) {
//     const val = (event.target as HTMLInputElement).value;
//     this.searchSubject.next(val);
//   }

//   syncFiltersFromUrl(params: any) {
//     this.filters = {
//       category: '', brand: '', minPrice: null, maxPrice: null,
//       search: '', sort: '-createdAt', inStock: false, tags: '',
//       page: 1, limit: 12,
//       ...params // Overwrite defaults with URL params
//     };

//     // Coerce numbers
//     if (params['page']) this.filters.page = +params['page'];
//     if (params['limit']) this.filters.limit = +params['limit'];
//     this.filters.inStock = params['inStock'] === 'true';

//     // Sync Slider
//     if (params['minPrice'] || params['maxPrice']) {
//       this.rangeValues = [
//         params['minPrice'] ? +params['minPrice'] : this.priceLimits().min,
//         params['maxPrice'] ? +params['maxPrice'] : this.priceLimits().max
//       ];
//     }

//     this.rows.set(this.filters.limit);
//     this.first.set((this.filters.page - 1) * this.filters.limit);
//   }

//   // ⚡ APPLY FILTER (Router Fix)
//   applyFilter(key: string, value: any) {
//     const queryParams: any = { ...this.filters, [key]: value, page: 1 };

//     // Remove null/undefined/empty to keep URL clean
//     Object.keys(queryParams).forEach(k => {
//       if (queryParams[k] === null || queryParams[k] === '' || queryParams[k] === undefined) {
//         delete queryParams[k];
//       }
//     });

//     // Special handling for boolean false
//     if (key === 'inStock' && value === false) delete queryParams['inStock'];

//     this.updateRouter(queryParams);
//   }
//   // applyFilter(key: string, value: any) {
//   //   const queryParams: any = { ...this.filters, [key]: value, page: 1 };

//   //   if (value === null || value === '' || value === undefined) delete queryParams[key];
//   //   if (key === 'inStock' && value === false) delete queryParams['inStock'];

//   //   if (key !== 'search' && this.filters.search) queryParams.search = this.filters.search;

//   //   this.updateRouter(queryParams);
//   // }

//   onPriceChange(event: any) {
//     const [min, max] = event.values;
//     if (min !== this.filters.minPrice || max !== this.filters.maxPrice) {
//       // Use helper to update router
//       this.applyFilter('minPrice', min); // Hacky: calls updateRouter twice if we don't batch, 
//       // but usually onSlideEnd triggers once.
//       // Better:
//       const qp = { ...this.filters, minPrice: min, maxPrice: max, page: 1 };
//       this.updateRouter(qp);
//     }
//   }

//   toggleTag(tag: string) {
//     let currentTags = this.filters.tags ? this.filters.tags.split(',') : [];
//     if (currentTags.includes(tag)) currentTags = currentTags.filter((t: string) => t !== tag);
//     else currentTags.push(tag);
//     this.applyFilter('tags', currentTags.length ? currentTags.join(',') : null);
//   }

//   onPageChange(event: any) {
//     const newPage = (event.first / event.rows) + 1;
//     this.updateRouter({ ...this.filters, page: newPage, limit: event.rows });
//   }

//   clearFilters() {
//     // Reset local state first to update UI instantly
//     this.filters.search = '';
//     this.rangeValues = [this.priceLimits().min, this.priceLimits().max];

//     // Navigate to clean URL (removes all query params)
//     this.router.navigate([], { relativeTo: this.route, queryParams: {} });
//   }
  
//   // clearFilters() {
//   //   this.rangeValues = [this.priceLimits().min, this.priceLimits().max];
//   //   this.router.navigate([], { relativeTo: this.route, queryParams: {} });
//   // }

//   private updateRouter(queryParams: any) {
//     this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
//   }
// }
// //   private route = inject(ActivatedRoute);
// //   private router = inject(Router);
// //   private publicService = inject(StorefrontPublicService);
// //   private destroy$ = new Subject<void>();
// //   private searchSubject = new Subject<string>();
// //   // --- State Signals ---
// //   products = signal<any[]>([]);

// //   // ✅ Metadata State (Populated from /meta endpoint)
// //   categories = signal<any[]>([]);
// //   brands = signal<any[]>([]);
// //   tags = signal<string[]>([]);
// //   priceLimits = signal<{ min: number, max: number }>({ min: 0, max: 10000 });

// //   loading = signal(true);
// //   showMobileFilters = signal(false);
// //   viewMode = signal<'grid' | 'list'>('grid');

// //   // Pagination
// //   totalItems = signal(0);
// //   rows = signal(12);
// //   first = signal(0);
// //   orgSlug = '';

// //   // Sort Options
// //   sortOptions = [
// //     { label: 'Newest Arrivals', value: 'createdAt' },
// //     { label: 'Price: Low to High', value: 'sellingPrice' },
// //     { label: 'Price: High to Low', value: '-sellingPrice' },
// //     { label: 'Name (A-Z)', value: 'name' }
// //   ];

// //   // Current Filter State
// //   filters: any = {
// //     category: '',
// //     brand: '',
// //     minPrice: null,
// //     maxPrice: null,
// //     search: '',
// //     sort: 'createdAt',
// //     inStock: false,
// //     tags: '',
// //     page: 1,
// //     limit: 12
// //   };

// //   // Range Values for Slider UI
// //   rangeValues: number[] = [0, 10000];

// //   activeFilterCount = computed(() => {
// //     let count = 0;
// //     if (this.filters.category) count++;
// //     if (this.filters.brand) count++;
// //     if (this.filters.minPrice || this.filters.maxPrice) count++;
// //     if (this.filters.inStock) count++;
// //     if (this.filters.tags) count++;
// //     return count;
// //   });

// //   ngOnInit() {
// //     // 1. Search Debounce
// //     this.searchSubject.pipe(
// //       debounceTime(400),
// //       distinctUntilChanged(),
// //       takeUntil(this.destroy$)
// //     ).subscribe(term => this.applyFilter('search', term));

// //     // 2. Initialize (Get Slug -> Get Meta -> Get Products)
// //     combineLatest([
// //       this.route.parent?.paramMap || new Subject(),
// //       this.route.queryParams
// //     ]).pipe(takeUntil(this.destroy$)).subscribe(([parentParams, queryParams]: any) => {

// //       const newSlug = parentParams.get('orgSlug');

// //       // If Org changed (or first load), fetch Metadata
// //       if (newSlug && newSlug !== this.orgSlug) {
// //         this.orgSlug = newSlug;
// //         this.loadStoreMetadata();
// //       }

// //       // Sync Filters from URL
// //       this.syncFiltersFromUrl(queryParams);

// //       // Fetch Products
// //       if (this.orgSlug) this.loadProducts();
// //     });
// //   }

// //   ngOnDestroy() {
// //     this.destroy$.next();
// //     this.destroy$.complete();
// //   }

// //   // --- Data Loading ---

// //   loadStoreMetadata() {
// //     this.publicService.getStoreMetadata(this.orgSlug).subscribe({
// //       next: (res: any) => {
// //         // ✅ Populate Signals with robust data
// //         this.categories.set(res.enums.categories || []);
// //         this.brands.set(res.enums.brands || []);
// //         this.tags.set(res.enums.tags || []);

// //         // Set Price Slider Limits
// //         const limits = res.filters.price;
// //         this.priceLimits.set({ min: limits.min, max: limits.max });

// //         // Init Slider Values if URL params are empty
// //         if (!this.filters.minPrice) this.rangeValues = [limits.min, limits.max];
// //       }
// //     });
// //   }

// //   loadProducts() {
// //     this.loading.set(true);
// //     this.publicService.getProducts(this.orgSlug, this.filters).subscribe({
// //       next: (res: any) => {
// //         this.products.set(res.products);
// //         this.totalItems.set(res.pagination.total);
// //         this.loading.set(false);

// //         // Scroll to top on page change
// //         if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
// //       },
// //       error: () => this.loading.set(false)
// //     });
// //   }

// //   // --- Filter Logic ---

// //   syncFiltersFromUrl(params: any) {
// //     this.filters = {
// //       category: '', brand: '', minPrice: null, maxPrice: null,
// //       search: '', sort: 'createdAt', inStock: false, tags: '',
// //       page: 1, limit: 12, ...params
// //     };

// //     // Type coercion
// //     if (params['page']) this.filters.page = +params['page'];
// //     if (params['limit']) this.filters.limit = +params['limit'];
// //     this.filters.inStock = params['inStock'] === 'true';

// //     // Sync Slider UI
// //     if (params['minPrice'] || params['maxPrice']) {
// //       this.rangeValues = [
// //         params['minPrice'] ? +params['minPrice'] : this.priceLimits().min,
// //         params['maxPrice'] ? +params['maxPrice'] : this.priceLimits().max
// //       ];
// //     }

// //     // Sync Paginator UI
// //     this.rows.set(this.filters.limit);
// //     this.first.set((this.filters.page - 1) * this.filters.limit);
// //   }

// //   applyFilter(key: string, value: any) {
// //     const queryParams: any = { ...this.filters, [key]: value, page: 1 };

// //     // Clean up empty params
// //     if (value === null || value === '' || value === undefined) delete queryParams[key];
// //     if (key === 'inStock' && value === false) delete queryParams['inStock'];

// //     this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
// //   }

// //   // Handle Price Slider Change (Debounced by UI usually, but we trigger here)
// //   onPriceChange(event: any) {
// //     const [min, max] = event.values;
// //     // Only apply if different from current
// //     if (min !== this.filters.minPrice || max !== this.filters.maxPrice) {
// //       const queryParams = { ...this.filters, minPrice: min, maxPrice: max, page: 1 };
// //       this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
// //     }
// //   }

// //   toggleTag(tag: string) {
// //     let currentTags = this.filters.tags ? this.filters.tags.split(',') : [];
// //     if (currentTags.includes(tag)) currentTags = currentTags.filter((t: string) => t !== tag);
// //     else currentTags.push(tag);
// //     this.applyFilter('tags', currentTags.length ? currentTags.join(',') : null);
// //   }

// //   onPageChange(event: any) {
// //     const newPage = (event.first / event.rows) + 1;
// //     const queryParams = { ...this.filters, page: newPage, limit: event.rows };
// //     this.router.navigate([], { relativeTo: this.route, queryParams });
// //   }

// //   clearFilters() {
// //     this.rangeValues = [this.priceLimits().min, this.priceLimits().max];
// //     this.router.navigate([], { relativeTo: this.route, queryParams: {} });
// //   }
// // }

// // // import {
// // //   Component,
// // //   OnInit,
// // //   inject,
// // //   signal,
// // //   computed,
// // //   ChangeDetectionStrategy,
// // //   OnDestroy,
// // //   ViewEncapsulation,
// // //   Input
// // // } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// // // import { FormsModule } from '@angular/forms';
// // // import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
// // // import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

// // // // ✅ PrimeNG Imports
// // // import { SelectModule } from 'primeng/select';
// // // import { PaginatorModule } from 'primeng/paginator';
// // // import { ButtonModule } from 'primeng/button';
// // // import { CheckboxModule } from 'primeng/checkbox';
// // // import { DrawerModule } from 'primeng/drawer';
// // // import { BadgeModule } from 'primeng/badge';
// // // import { InputTextModule } from 'primeng/inputtext';
// // // import { AccordionModule } from 'primeng/accordion';
// // // import { RippleModule } from 'primeng/ripple';
// // // import { SkeletonModule } from 'primeng/skeleton';
// // // import { TooltipModule } from 'primeng/tooltip';

// // // // ✅ Services & Components
// // // import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
// // // import { StorefrontStateService } from '../../../../core/services/storefront-state.service';
// // // import { ProductCardComponent } from '../../components/product-card/product-card';
// // // // import { ProductCardComponent } from '../../components/product-card/product-card.component';

// // // @Component({
// // //   selector: 'app-product-listing',
// // //   standalone: true,
// // //   imports: [
// // //     CommonModule,
// // //     RouterModule,
// // //     FormsModule,
// // //     ProductCardComponent,
// // //     SelectModule,
// // //     CheckboxModule,
// // //     PaginatorModule,
// // //     ButtonModule,
// // //     DrawerModule,
// // //     BadgeModule,
// // //     InputTextModule,
// // //     AccordionModule,
// // //     RippleModule,
// // //     SkeletonModule,
// // //     TooltipModule
// // //   ],
// // //   templateUrl: './product-listing.component.html',
// // //   styleUrls: ['./product-listing.component.scss'],
// // //   changeDetection: ChangeDetectionStrategy.OnPush,
// // //   encapsulation: ViewEncapsulation.None,
// // //   animations: [
// // //     trigger('listAnimation', [
// // //       transition('* => *', [
// // //         query(':enter', [
// // //           style({ opacity: 0, transform: 'translateY(20px)' }),
// // //           stagger(50, [
// // //             animate('0.4s cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
// // //           ])
// // //         ], { optional: true })
// // //       ])
// // //     ]),
// // //     trigger('fadeIn', [
// // //       transition(':enter', [
// // //         style({ opacity: 0 }),
// // //         animate('0.3s ease-out', style({ opacity: 1 }))
// // //       ])
// // //     ])
// // //   ]
// // // })
// // // export class ProductListingComponent implements OnInit, OnDestroy {
// // //   private route = inject(ActivatedRoute);
// // //   private router = inject(Router);
// // //   private publicService = inject(StorefrontPublicService);
// // //   public stateService = inject(StorefrontStateService);
// // //   private destroy$ = new Subject<void>();
// // //   @Input() config: any
// // //   // --- Search Debounce ---
// // //   private searchSubject = new Subject<string>();

// // //   // --- State Signals ---
// // //   products = signal<any[]>([]);
// // //   categories = signal<any[]>([]);
// // //   tags = signal<string[]>([]);
// // //   loading = signal(true);

// // //   // UI State
// // //   showMobileFilters = signal(false);
// // //   viewMode = signal<'grid' | 'list'>('grid');

// // //   // Pagination
// // //   totalItems = signal(0);
// // //   rows = signal(12);
// // //   first = signal(0);
// // //   orgSlug = '';

// // //   sortOptions = [
// // //     { label: 'Newest Arrivals', value: 'createdAt', icon: 'pi pi-calendar' },
// // //     { label: 'Price: Low to High', value: 'sellingPrice', icon: 'pi pi-sort-amount-up' },
// // //     { label: 'Price: High to Low', value: '-sellingPrice', icon: 'pi pi-sort-amount-down' },
// // //     { label: 'Name (A-Z)', value: 'name', icon: 'pi pi-sort-alpha-down' }
// // //   ];

// // //   filters: any = {
// // //     category: '',
// // //     minPrice: null,
// // //     maxPrice: null,
// // //     search: '',
// // //     sort: 'createdAt',
// // //     inStock: false,
// // //     tags: '',
// // //     page: 1,
// // //     limit: 12
// // //   };

// // //   activeFilterCount = computed(() => {
// // //     let count = 0;
// // //     if (this.filters.category) count++;
// // //     if (this.filters.minPrice || this.filters.maxPrice) count++;
// // //     if (this.filters.inStock) count++;
// // //     if (this.filters.tags) count++;
// // //     return count;
// // //   });

// // //   ngOnInit() {
// // //     // 1. Setup Search Debounce
// // //     this.searchSubject.pipe(
// // //       debounceTime(400),
// // //       distinctUntilChanged(),
// // //       takeUntil(this.destroy$)
// // //     ).subscribe(searchTerm => {
// // //       this.applyFilter('search', searchTerm);
// // //     });

// // //     // 2. Load Org Slug
// // //     this.route.parent?.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
// // //       this.orgSlug = params.get('orgSlug') || '';
// // //       if (this.orgSlug) this.loadSidebarData();
// // //     });

// // //     // 3. Listen to URL Changes
// // //     this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
// // //       this.resetFiltersState();

// // //       if (Object.keys(params).length > 0) {
// // //         this.filters = { ...this.filters, ...params };
// // //         if (params['page']) this.filters.page = +params['page'];
// // //         if (params['limit']) this.filters.limit = +params['limit'];
// // //         if (params['minPrice']) this.filters.minPrice = +params['minPrice'];
// // //         if (params['maxPrice']) this.filters.maxPrice = +params['maxPrice'];
// // //         this.filters.inStock = params['inStock'] === 'true';
// // //       }

// // //       this.rows.set(this.filters.limit);
// // //       this.first.set((this.filters.page - 1) * this.filters.limit);

// // //       if (this.orgSlug) this.loadProducts();
// // //     });
// // //   }

// // //   ngOnDestroy() {
// // //     this.destroy$.next();
// // //     this.destroy$.complete();
// // //   }

// // //   // --- Actions ---

// // //   onSearchInput(event: Event) {
// // //     const val = (event.target as HTMLInputElement).value;
// // //     this.searchSubject.next(val); // Debounced trigger
// // //   }

// // //   loadProducts() {
// // //     this.loading.set(true);
// // //     this.publicService.getProducts(this.orgSlug, this.filters).subscribe({
// // //       next: (res: any) => {
// // //         this.products.set(res.products);
// // //         this.totalItems.set(res.pagination.total);
// // //         this.loading.set(false);
// // //       },
// // //       error: (err) => {
// // //         console.error(err);
// // //         this.loading.set(false);
// // //       }
// // //     });
// // //   }

// // //   loadSidebarData() {
// // //     this.publicService.getCategories(this.orgSlug).subscribe((res: any) => this.categories.set(res.categories));
// // //     this.publicService.getTags(this.orgSlug).subscribe((res: any) => this.tags.set(res.tags));
// // //   }

// // //   resetFiltersState() {
// // //     this.filters = { category: '', minPrice: null, maxPrice: null, search: '', sort: 'createdAt', inStock: false, tags: '', page: 1, limit: 12 };
// // //   }

// // //   applyFilter(key: string, value: any) {
// // //     const queryParams: any = { ...this.filters, [key]: value, page: 1 };

// // //     if (value === null || value === '' || value === undefined) delete queryParams[key];
// // //     if (key === 'inStock' && value === false) delete queryParams['inStock'];

// // //     // Maintain search term if not changing search
// // //     if (key !== 'search' && this.filters.search) queryParams.search = this.filters.search;

// // //     this.updateRouter(queryParams);
// // //   }

// // //   toggleTag(tag: string) {
// // //     let currentTags = this.filters.tags ? this.filters.tags.split(',') : [];
// // //     if (currentTags.includes(tag)) currentTags = currentTags.filter((t: string) => t !== tag);
// // //     else currentTags.push(tag);
// // //     this.applyFilter('tags', currentTags.length ? currentTags.join(',') : null);
// // //   }

// // //   onPageChange(event: any) {
// // //     const newPage = (event.first / event.rows) + 1;
// // //     this.updateRouter({ ...this.filters, page: newPage, limit: event.rows });
// // //   }

// // //   clearFilters() {
// // //     this.router.navigate([], { relativeTo: this.route, queryParams: {} });
// // //   }

// // //   private updateRouter(queryParams: any) {
// // //     this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
// // //   }
// // // }