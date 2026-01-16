import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PaginatorModule } from 'primeng/paginator';
import { SliderModule } from 'primeng/slider'; // Added for price range
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

// Services & Components
import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
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
    IconFieldModule,
    InputIconModule,
    PaginatorModule,
    SliderModule,
    ButtonModule,
    TooltipModule
  ],
  templateUrl: './product-listing.component.html',
  styleUrls: ['./product-listing.component.scss']
})
export class ProductListingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private publicService = inject(StorefrontPublicService);

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
    this.route.paramMap.subscribe(params => {
      this.orgSlug = params.get('orgSlug') || '';
      if (this.orgSlug) {
        this.loadSidebarData();
      }
    });

    this.route.queryParams.subscribe(params => {
      // 1. Reset filters to defaults first to ensure clean state
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

      // 2. Merge incoming params
      if (Object.keys(params).length > 0) {
        this.filters = { ...this.filters, ...params };
        
        // Type conversion
        if (params['page']) this.filters.page = +params['page'];
        if (params['limit']) this.filters.limit = +params['limit'];
        if (params['minPrice']) this.filters.minPrice = +params['minPrice'];
        if (params['maxPrice']) this.filters.maxPrice = +params['maxPrice'];
        this.filters.inStock = params['inStock'] === 'true';
      }

      // 3. Sync Paginator
      this.rows.set(this.filters.limit);
      this.first.set((this.filters.page - 1) * this.filters.limit);

      // 4. Load Data
      if (this.orgSlug) {
        this.loadProducts();
      }
    });
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
    this.publicService.getCategories(this.orgSlug).subscribe((res: any) => {
      this.categories.set(res.categories);
    });

    this.publicService.getTags(this.orgSlug).subscribe((res: any) => {
      this.tags.set(res.tags);
    });
  }

  // --- Filter Actions ---

  applyFilter(key: string, value: any) {
    const queryParams: any = { ...this.filters, [key]: value, page: 1 };
    
    // Remove empty/null values to keep URL clean
    if (value === null || value === '' || value === undefined) {
      delete queryParams[key];
    }
    
    // Explicitly handle boolean removal
    if (key === 'inStock' && value === false) {
      delete queryParams['inStock'];
    }

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
    const queryParams = { 
        ...this.filters, 
        page: newPage,
        limit: event.rows 
    };
    this.updateRouter(queryParams);
  }

  // ✅ Fixed Reset Logic
  clearFilters() {
    // Navigate with empty query params to trigger a full reset via route subscription
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {} // Wipes everything
    });
  }

  private updateRouter(queryParams: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      // 'replaceUrl' avoids clogging history with every filter click
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
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';
// import { PaginatorModule } from 'primeng/paginator';

// // Services & Components
// import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
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
//     IconFieldModule,
//     InputIconModule,
//     PaginatorModule
//   ],
//   templateUrl: './product-listing.component.html',
//   styleUrls: ['./product-listing.component.scss']
// })
// export class ProductListingComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private publicService = inject(StorefrontPublicService);

//   // --- State ---
//   products = signal<any[]>([]);
//   categories = signal<any[]>([]);
//   tags = signal<string[]>([]);
//   loading = signal(true);
  
//   // Pagination
//   totalItems = signal(0);
//   rows = signal(12); // Items per page
//   first = signal(0); // PrimeNG paginator index (0-based)

//   orgSlug = '';

//   // Sort Options for PrimeNG Select
//   sortOptions = [
//     { label: 'Newest Arrivals', value: 'createdAt' },
//     { label: 'Price: Low to High', value: 'sellingPrice' },
//     { label: 'Price: High to Low', value: '-sellingPrice' },
//     { label: 'Name (A-Z)', value: 'name' }
//   ];

//   // Filters object
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
//       // Merge params into filters
//       this.filters = { ...this.filters, ...params };
      
//       // Handle boolean and number conversions
//       if (params['page']) this.filters.page = +params['page'];
//       if (params['limit']) this.filters.limit = +params['limit'];
      
//       this.filters.inStock = params['inStock'] === 'true';

//       // Sync PrimeNG Paginator state
//       this.rows.set(this.filters.limit);
//       this.first.set((this.filters.page - 1) * this.filters.limit);

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

//   // --- Actions ---

//   applyFilter(key: string, value: any) {
//     // Reset page to 1 on filter change
//     const queryParams: any = { ...this.filters, [key]: value, page: 1 };
    
//     // Clean null/empty values
//     if (value === null || value === '' || value === undefined) {
//       delete queryParams[key];
//     }
    
//     // Special handling for boolean false to remove param
//     if (key === 'inStock' && value === false) {
//       delete queryParams['inStock'];
//     }

//     this.updateRouter(queryParams);
//   }

//   // PrimeNG Paginator Event
//   onPageChange(event: any) {
//     const newPage = (event.first / event.rows) + 1;
    
//     const queryParams = { 
//         ...this.filters, 
//         page: newPage,
//         limit: event.rows 
//     };

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

//   clearFilters() {
//     this.updateRouter({ 
//       page: 1,
//       limit: 12
//       // Removing other params essentially clears them
//     });
//   }

//   private updateRouter(queryParams: any) {
//     this.router.navigate([], {
//       relativeTo: this.route,
//       queryParams,
//       // We don't use merge here because we want to clear removed keys
//     });
//   }
// }
