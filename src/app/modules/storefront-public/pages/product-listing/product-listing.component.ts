import { 
  Component, 
  OnInit, 
  inject, 
  signal, 
  computed, 
  ChangeDetectionStrategy,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

// ✅ PrimeNG Imports
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

// ✅ Services & Components
import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
import { StorefrontStateService } from '../../../../core/services/storefront-state.service';
import { ProductCardComponent } from '../../components/product-card/product-card';
// import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'app-product-listing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ProductCardComponent,
    SelectModule,
    CheckboxModule,
    PaginatorModule,
    ButtonModule,
    DrawerModule,
    BadgeModule,
    InputTextModule,
    AccordionModule,
    RippleModule,
    SkeletonModule,
    TooltipModule
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private publicService = inject(StorefrontPublicService);
  public stateService = inject(StorefrontStateService);
  private destroy$ = new Subject<void>();

  // --- Search Debounce ---
  private searchSubject = new Subject<string>();

  // --- State Signals ---
  products = signal<any[]>([]);
  categories = signal<any[]>([]);
  tags = signal<string[]>([]);
  loading = signal(true);
  
  // UI State
  showMobileFilters = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');
  
  // Pagination
  totalItems = signal(0);
  rows = signal(12);
  first = signal(0);
  orgSlug = '';

  sortOptions = [
    { label: 'Newest Arrivals', value: 'createdAt', icon: 'pi pi-calendar' },
    { label: 'Price: Low to High', value: 'sellingPrice', icon: 'pi pi-sort-amount-up' },
    { label: 'Price: High to Low', value: '-sellingPrice', icon: 'pi pi-sort-amount-down' },
    { label: 'Name (A-Z)', value: 'name', icon: 'pi pi-sort-alpha-down' }
  ];

  filters: any = {
    category: '',
    minPrice: null,
    maxPrice: null,
    search: '',
    sort: 'createdAt',
    inStock: false,
    tags: '',
    page: 1,
    limit: 12
  };

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.filters.category) count++;
    if (this.filters.minPrice || this.filters.maxPrice) count++;
    if (this.filters.inStock) count++;
    if (this.filters.tags) count++;
    return count;
  });

  ngOnInit() {
    // 1. Setup Search Debounce
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.applyFilter('search', searchTerm);
    });

    // 2. Load Org Slug
    this.route.parent?.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.orgSlug = params.get('orgSlug') || '';
      if (this.orgSlug) this.loadSidebarData();
    });

    // 3. Listen to URL Changes
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.resetFiltersState();
      
      if (Object.keys(params).length > 0) {
        this.filters = { ...this.filters, ...params };
        if (params['page']) this.filters.page = +params['page'];
        if (params['limit']) this.filters.limit = +params['limit'];
        if (params['minPrice']) this.filters.minPrice = +params['minPrice'];
        if (params['maxPrice']) this.filters.maxPrice = +params['maxPrice'];
        this.filters.inStock = params['inStock'] === 'true';
      }
      
      this.rows.set(this.filters.limit);
      this.first.set((this.filters.page - 1) * this.filters.limit);

      if (this.orgSlug) this.loadProducts();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Actions ---

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchSubject.next(val); // Debounced trigger
  }

  loadProducts() {
    this.loading.set(true);
    this.publicService.getProducts(this.orgSlug, this.filters).subscribe({
      next: (res: any) => {
        this.products.set(res.products);
        this.totalItems.set(res.pagination.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  loadSidebarData() {
    this.publicService.getCategories(this.orgSlug).subscribe((res: any) => this.categories.set(res.categories));
    this.publicService.getTags(this.orgSlug).subscribe((res: any) => this.tags.set(res.tags));
  }

  resetFiltersState() {
    this.filters = { category: '', minPrice: null, maxPrice: null, search: '', sort: 'createdAt', inStock: false, tags: '', page: 1, limit: 12 };
  }

  applyFilter(key: string, value: any) {
    const queryParams: any = { ...this.filters, [key]: value, page: 1 };
    
    if (value === null || value === '' || value === undefined) delete queryParams[key];
    if (key === 'inStock' && value === false) delete queryParams['inStock'];
    
    // Maintain search term if not changing search
    if (key !== 'search' && this.filters.search) queryParams.search = this.filters.search;

    this.updateRouter(queryParams);
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
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  private updateRouter(queryParams: any) {
    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }
}

// import { Component, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

// // PrimeNG Imports
// import { SelectModule } from 'primeng/select';
// import { PaginatorModule } from 'primeng/paginator';
// import { ButtonModule } from 'primeng/button';
// import { CheckboxModule } from 'primeng/checkbox';
// import { DrawerModule } from 'primeng/drawer';
// import { BadgeModule } from 'primeng/badge';
// import { InputTextModule } from 'primeng/inputtext';
// import { AccordionModule } from 'primeng/accordion';
// import { RippleModule } from 'primeng/ripple';

// // Services & Components
// import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
// import { StorefrontStateService } from '../../../../core/services/storefront-state.service';
// import { ProductCardComponent } from '../../components/product-card/product-card';

// @Component({
//   selector: 'app-product-listing',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     FormsModule,
//     ProductCardComponent,
//     SelectModule,
//     CheckboxModule,
//     PaginatorModule,
//     ButtonModule,
//     DrawerModule,
//     BadgeModule,
//     InputTextModule,
//     AccordionModule,
//     RippleModule
//   ],
//   templateUrl: './product-listing.component.html',
//   styleUrls: ['./product-listing.component.scss'],
//   animations: [
//     trigger('listAnimation', [
//       transition('* => *', [
//         query(':enter', [
//           style({ opacity: 0, transform: 'translateY(20px)' }),
//           stagger(60, [
//             animate('0.5s cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
//           ])
//         ], { optional: true })
//       ])
//     ]),
//     trigger('fadeIn', [
//       transition(':enter', [
//         style({ opacity: 0 }),
//         animate('0.4s ease-out', style({ opacity: 1 }))
//       ])
//     ])
//   ]
// })
// export class ProductListingComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private publicService = inject(StorefrontPublicService);
//   private stateService = inject(StorefrontStateService);

//   // --- State ---
//   products = signal<any[]>([]);
//   categories = signal<any[]>([]);
//   tags = signal<string[]>([]);
//   loading = signal(true);
  
//   // UI State
//   showMobileFilters = signal(false);
//   viewMode = signal<'grid' | 'list'>('grid');
  
//   // Pagination
//   totalItems = signal(0);
//   rows = signal(12);
//   first = signal(0);
//   orgSlug = '';

//   sortOptions = [
//     { label: 'Newest Arrivals', value: 'createdAt', icon: 'pi pi-calendar' },
//     { label: 'Price: Low to High', value: 'sellingPrice', icon: 'pi pi-sort-amount-up' },
//     { label: 'Price: High to Low', value: '-sellingPrice', icon: 'pi pi-sort-amount-down' },
//     { label: 'Name (A-Z)', value: 'name', icon: 'pi pi-sort-alpha-down' }
//   ];

//   filters: any = {
//     category: '',
//     minPrice: null,
//     maxPrice: null,
//     search: '',
//     sort: 'createdAt',
//     inStock: false,
//     tags: '',
//     page: 1,
//     limit: 12
//   };

//   activeFilterCount = computed(() => {
//     let count = 0;
//     if (this.filters.category) count++;
//     if (this.filters.minPrice || this.filters.maxPrice) count++;
//     if (this.filters.inStock) count++;
//     if (this.filters.tags) count++;
//     return count;
//   });

//   ngOnInit() {
//     this.route.parent?.paramMap.subscribe(params => {
//       this.orgSlug = params.get('orgSlug') || '';
//       if (this.orgSlug) this.loadSidebarData();
//     });

//     this.route.queryParams.subscribe(params => {
//       this.resetFiltersState();
//       if (Object.keys(params).length > 0) {
//         this.filters = { ...this.filters, ...params };
//         if (params['page']) this.filters.page = +params['page'];
//         if (params['limit']) this.filters.limit = +params['limit'];
//         if (params['minPrice']) this.filters.minPrice = +params['minPrice'];
//         if (params['maxPrice']) this.filters.maxPrice = +params['maxPrice'];
//         this.filters.inStock = params['inStock'] === 'true';
//       }
//       this.rows.set(this.filters.limit);
//       this.first.set((this.filters.page - 1) * this.filters.limit);

//       if (this.orgSlug) this.loadProducts();
//     });
//   }

//   loadProducts() {
//     this.loading.set(true);
//     this.publicService.getProducts(this.orgSlug, this.filters).subscribe({
//       next: (res: any) => {
//         this.products.set(res.products);
//         this.totalItems.set(res.pagination.total);
//         this.stateService.setState(res);
//         this.loading.set(false);
//       },
//       error: (err) => {
//         console.error(err);
//         this.loading.set(false);
//       }
//     });
//   }

//   loadSidebarData() {
//     this.publicService.getCategories(this.orgSlug).subscribe((res: any) => this.categories.set(res.categories));
//     this.publicService.getTags(this.orgSlug).subscribe((res: any) => this.tags.set(res.tags));
//   }

//   resetFiltersState() {
//     this.filters = { category: '', minPrice: null, maxPrice: null, search: '', sort: 'createdAt', inStock: false, tags: '', page: 1, limit: 12 };
//   }

//   applyFilter(key: string, value: any) {
//     const queryParams: any = { ...this.filters, [key]: value, page: 1 };
//     if (value === null || value === '' || value === undefined) delete queryParams[key];
//     if (key === 'inStock' && value === false) delete queryParams['inStock'];
//     this.updateRouter(queryParams);
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
//     this.router.navigate([], { relativeTo: this.route, queryParams: {} });
//   }

//   private updateRouter(queryParams: any) {
//     this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
//   }
// }
