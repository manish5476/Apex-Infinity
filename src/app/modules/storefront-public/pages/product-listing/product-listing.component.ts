import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { PaginatorModule } from 'primeng/paginator';
import { SliderModule } from 'primeng/slider';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';

// Services & Components
import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
import { StorefrontStateService } from '../../../../core/services/storefront-state.service';
import { ProductCardComponent } from '../../components/product-card/product-card';
import { DrawerModule } from 'primeng/drawer';

@Component({
  selector: 'app-product-listing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ProductCardComponent,
    SelectModule,
    InputTextModule,
    CheckboxModule,
    PaginatorModule,
    SliderModule,
    ButtonModule,
    DrawerModule,
    ChipModule
  ],
  templateUrl: './product-listing.component.html',
  styleUrls: ['./product-listing.component.scss']
})
export class ProductListingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private publicService = inject(StorefrontPublicService);
  private stateService = inject(StorefrontStateService);

  // --- State ---
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
    { label: 'Newest Arrivals', value: 'createdAt' },
    { label: 'Price: Low to High', value: 'sellingPrice' },
    { label: 'Price: High to Low', value: '-sellingPrice' },
    { label: 'Name (A-Z)', value: 'name' }
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

  // Helper to show active count
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.filters.category) count++;
    if (this.filters.minPrice || this.filters.maxPrice) count++;
    if (this.filters.inStock) count++;
    if (this.filters.tags) count++;
    return count;
  });

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      this.orgSlug = params.get('orgSlug') || '';
      if (this.orgSlug) {
        this.loadSidebarData();
        // Initial load is triggered by queryParams subscription below
      }
    });

    this.route.queryParams.subscribe(params => {
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

  loadProducts() {
    this.loading.set(true);
    this.publicService.getProducts(this.orgSlug, this.filters).subscribe({
      next: (res: any) => {
        this.products.set(res.products);
        this.totalItems.set(res.pagination.total);
        this.stateService.setState(res);
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
    this.filters = {
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
  }

  applyFilter(key: string, value: any) {
    const queryParams: any = { ...this.filters, [key]: value, page: 1 };
    
    if (value === null || value === '' || value === undefined) delete queryParams[key];
    if (key === 'inStock' && value === false) delete queryParams['inStock'];

    this.updateRouter(queryParams);
  }

  toggleTag(tag: string) {
    let currentTags = this.filters.tags ? this.filters.tags.split(',') : [];
    if (currentTags.includes(tag)) {
      currentTags = currentTags.filter((t: string) => t !== tag);
    } else {
      currentTags.push(tag);
    }
    this.applyFilter('tags', currentTags.length ? currentTags.join(',') : null);
  }

  onPageChange(event: any) {
    const newPage = (event.first / event.rows) + 1;
    const queryParams = { ...this.filters, page: newPage, limit: event.rows };
    this.updateRouter(queryParams);
  }

  clearFilters() {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  private updateRouter(queryParams: any) {
    this.router.navigate([], { 
      relativeTo: this.route, 
      queryParams, 
      replaceUrl: true 
    });
  }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { FormsModule } from '@angular/forms';

// // PrimeNG Imports
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { CheckboxModule } from 'primeng/checkbox';
// import { PaginatorModule } from 'primeng/paginator';
// import { SliderModule } from 'primeng/slider';
// import { ButtonModule } from 'primeng/button';

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
//     InputTextModule,
//     InputNumberModule,
//     CheckboxModule,
//     PaginatorModule,
//     SliderModule,
//     ButtonModule
//   ],
//   templateUrl: './product-listing.component.html', // We will update this next
//   styleUrls: ['./product-listing.component.scss']
// })
// export class ProductListingComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private publicService = inject(StorefrontPublicService);
//   private stateService = inject(StorefrontStateService); // ✅ Inject State Service

//   // --- State ---
//   products = signal<any[]>([]);
//   categories = signal<any[]>([]);
//   tags = signal<string[]>([]);
//   loading = signal(true);
  
//   // Pagination
//   totalItems = signal(0);
//   rows = signal(12);
//   first = signal(0);

//   orgSlug = '';

//   // Options
//   sortOptions = [
//     { label: 'Newest Arrivals', value: 'createdAt' },
//     { label: 'Price: Low to High', value: 'sellingPrice' },
//     { label: 'Price: High to Low', value: '-sellingPrice' },
//     { label: 'Name (A-Z)', value: 'name' }
//   ];

//   // Filters State
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

// ngOnInit() {
//     this.route.parent?.paramMap.subscribe(params => {
//       this.orgSlug = params.get('orgSlug') || '';
//       if (this.orgSlug) {
//         this.loadSidebarData();
//         this.loadProducts(); 
//       }
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

//       // Only load if we already grabbed the slug from the parent
//       if (this.orgSlug) {
//         this.loadProducts();
//       }
//     });
//   }

//   loadProducts() {
//     this.loading.set(true);
//     this.publicService.getProducts(this.orgSlug, this.filters).subscribe({
//       next: (res: any) => {
//         // 1. Update Local Data
//         this.products.set(res.products);
//         this.totalItems.set(res.pagination.total);
        
//         // 2. Update Global Layout (Header/Footer) via Service
//         this.stateService.setState(res);

//         this.loading.set(false);
//       },
//       error: (err) => {
//         console.error(err);
//         this.loading.set(false);
//       }
//     });
//   }

//   // --- Helper Methods ---

//   loadSidebarData() {
//     this.publicService.getCategories(this.orgSlug).subscribe((res: any) => {
//       this.categories.set(res.categories);
//     });
//     this.publicService.getTags(this.orgSlug).subscribe((res: any) => {
//       this.tags.set(res.tags);
//     });
//   }

//   resetFiltersState() {
//     this.filters = {
//       category: '',
//       minPrice: null,
//       maxPrice: null,
//       search: '',
//       sort: 'createdAt',
//       inStock: false,
//       tags: '',
//       page: 1,
//       limit: 12
//     };
//   }

//   applyFilter(key: string, value: any) {
//     const queryParams: any = { ...this.filters, [key]: value, page: 1 };
    
//     if (value === null || value === '' || value === undefined) delete queryParams[key];
//     if (key === 'inStock' && value === false) delete queryParams['inStock'];

//     this.updateRouter(queryParams);
//   }

//   toggleTag(tag: string) {
//     let currentTags = this.filters.tags ? this.filters.tags.split(',') : [];
//     if (currentTags.includes(tag)) {
//       currentTags = currentTags.filter((t: string) => t !== tag);
//     } else {
//       currentTags.push(tag);
//     }
//     this.applyFilter('tags', currentTags.length ? currentTags.join(',') : null);
//   }

//   onPageChange(event: any) {
//     const newPage = (event.first / event.rows) + 1;
//     const queryParams = { ...this.filters, page: newPage, limit: event.rows };
//     this.updateRouter(queryParams);
//   }

//   clearFilters() {
//     this.router.navigate([], { relativeTo: this.route, queryParams: {} });
//   }

//   private updateRouter(queryParams: any) {
//     this.router.navigate([], { 
//       relativeTo: this.route, 
//       queryParams, 
//       replaceUrl: true 
//     });
//   }
// }