import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { PaginatorModule } from 'primeng/paginator';
import { SliderModule } from 'primeng/slider';
import { ButtonModule } from 'primeng/button';

// Services & Components
import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
import { StorefrontStateService } from '../../../../core/services/storefront-state.service';
import { ProductCardComponent } from '../../components/product-card/product-card';

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
    InputNumberModule,
    CheckboxModule,
    PaginatorModule,
    SliderModule,
    ButtonModule
  ],
  templateUrl: './product-listing.component.html', // We will update this next
  styleUrls: ['./product-listing.component.scss']
})
export class ProductListingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private publicService = inject(StorefrontPublicService);
  private stateService = inject(StorefrontStateService); // ✅ Inject State Service

  // --- State ---
  products = signal<any[]>([]);
  categories = signal<any[]>([]);
  tags = signal<string[]>([]);
  loading = signal(true);
  
  // Pagination
  totalItems = signal(0);
  rows = signal(12);
  first = signal(0);

  orgSlug = '';

  // Options
  sortOptions = [
    { label: 'Newest Arrivals', value: 'createdAt' },
    { label: 'Price: Low to High', value: 'sellingPrice' },
    { label: 'Price: High to Low', value: '-sellingPrice' },
    { label: 'Name (A-Z)', value: 'name' }
  ];

  // Filters State
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

ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      this.orgSlug = params.get('orgSlug') || '';
      if (this.orgSlug) {
        this.loadSidebarData();
        this.loadProducts(); 
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

      // Only load if we already grabbed the slug from the parent
      if (this.orgSlug) {
        this.loadProducts();
      }
    });
  }

  loadProducts() {
    this.loading.set(true);
    this.publicService.getProducts(this.orgSlug, this.filters).subscribe({
      next: (res: any) => {
        // 1. Update Local Data
        this.products.set(res.products);
        this.totalItems.set(res.pagination.total);
        
        // 2. Update Global Layout (Header/Footer) via Service
        this.stateService.setState(res);

        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  // --- Helper Methods ---

  loadSidebarData() {
    this.publicService.getCategories(this.orgSlug).subscribe((res: any) => {
      this.categories.set(res.categories);
    });
    this.publicService.getTags(this.orgSlug).subscribe((res: any) => {
      this.tags.set(res.tags);
    });
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

// import { Component, OnInit, inject, signal, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { FormsModule } from '@angular/forms';

// // PrimeNG Imports
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { CheckboxModule } from 'primeng/checkbox';
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';
// import { PaginatorModule } from 'primeng/paginator';
// import { SliderModule } from 'primeng/slider'; // Added for price range
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';

// // Services & Components
// import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
// import { ProductCardComponent } from '../../components/product-card/product-card';
// import { StorefrontStateService } from '../../../../core/services/storefront-state.service';

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
//     IconFieldModule,
//     InputIconModule,
//     PaginatorModule,
//     SliderModule,
//     ButtonModule,
//     TooltipModule
//   ],
//   templateUrl: './product-listing.component.html',
//   styleUrls: ['./product-listing.component.scss']
// })
// export class ProductListingComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private publicService = inject(StorefrontPublicService);
//   private stateService = inject(StorefrontStateService); // Inject the new service
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

//   ngOnInit() {
//     this.route.paramMap.subscribe(params => {
//       this.orgSlug = params.get('orgSlug') || '';
//       if (this.orgSlug) {
//         this.loadSidebarData();
//       }
//     });

//     this.route.queryParams.subscribe(params => {
//       // 1. Reset filters to defaults first to ensure clean state
//       this.filters = {
//         category: '',
//         minPrice: null,
//         maxPrice: null,
//         search: '',
//         sort: 'createdAt',
//         inStock: false,
//         tags: '',
//         page: 1,
//         limit: 12
//       };

//       // 2. Merge incoming params
//       if (Object.keys(params).length > 0) {
//         this.filters = { ...this.filters, ...params };

//         // Type conversion
//         if (params['limit']) this.filters.limit = +params['limit'];
//         if (params['page']) this.filters.page = +params['page'];
//         if (params['minPrice']) this.filters.minPrice = +params['minPrice'];
//         if (params['maxPrice']) this.filters.maxPrice = +params['maxPrice'];
//         this.filters.inStock = params['inStock'] === 'true';
//       }

//       // 3. Sync Paginator
//       this.rows.set(this.filters.limit);
//       this.first.set((this.filters.page - 1) * this.filters.limit);

//       // 4. Load Data
//       if (this.orgSlug) {
//         this.loadProducts();
//       }
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
//     this.publicService.getCategories(this.orgSlug).subscribe((res: any) => {
//       this.categories.set(res.categories);
//     });

//     this.publicService.getTags(this.orgSlug).subscribe((res: any) => {
//       this.tags.set(res.tags);
//     });
//   }

//   // --- Filter Actions ---

//   applyFilter(key: string, value: any) {
//     const queryParams: any = { ...this.filters, [key]: value, page: 1 };

//     // Remove empty/null values to keep URL clean
//     if (value === null || value === '' || value === undefined) {
//       delete queryParams[key];
//     }

//     // Explicitly handle boolean removal
//     if (key === 'inStock' && value === false) {
//       delete queryParams['inStock'];
//     }

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
//     const queryParams = {
//       ...this.filters,
//       page: newPage,
//       limit: event.rows
//     };
//     this.updateRouter(queryParams);
//   }

//   // ✅ Fixed Reset Logic
//   clearFilters() {
//     // Navigate with empty query params to trigger a full reset via route subscription
//     this.router.navigate([], {
//       relativeTo: this.route,
//       queryParams: {} // Wipes everything
//     });
//   }

//   private updateRouter(queryParams: any) {
//     this.router.navigate([], {
//       relativeTo: this.route,
//       queryParams,
//       // 'replaceUrl' avoids clogging history with every filter click
//       replaceUrl: true
//     });
//   }
// }