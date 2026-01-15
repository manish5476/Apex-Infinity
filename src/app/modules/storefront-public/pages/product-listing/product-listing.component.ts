import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component'; // Ensure you have this or use inline HTML

@Component({
  selector: 'app-product-listing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent],
  templateUrl: './product-listing.component.html'
})
export class ProductListingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private publicService = inject(StorefrontPublicService);

  // State
  products = signal<any[]>([]);
  categories = signal<any[]>([]);
  tags = signal<string[]>([]);
  loading = signal(true);
  total = signal(0);
  orgSlug = '';

  // Filters
  filters = {
    category: '',
    minPrice: null,
    maxPrice: null,
    search: '',
    sort: 'createdAt', // Default sort
    inStock: false,
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

    // Listen to query params changes (URL drives the state)
    this.route.queryParams.subscribe(params => {
      this.filters = { ...this.filters, ...params };
      // Convert strings to numbers where needed
      if (params['page']) this.filters.page = +params['page'];
      
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
        this.total.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadSidebarData() {
    // 1. Get Categories
    this.publicService.getCategories(this.orgSlug).subscribe((res: any) => {
      this.categories.set(res.categories);
    });

    // 2. Get Tags
    this.publicService.getTags(this.orgSlug).subscribe((res: any) => {
      this.tags.set(res.tags);
    });
  }

  // --- ACTIONS ---

  applyFilter(key: string, value: any) {
    // Reset page to 1 when filtering
    const queryParams = { ...this.filters, [key]: value, page: 1 };
    
    // Remove null/empty values to keep URL clean
    if (!value) delete (queryParams as any)[key];

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge' // Merge with existing params
    });
  }

  changePage(newPage: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: newPage },
      queryParamsHandling: 'merge'
    });
  }

  clearFilters() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        category: null, 
        minPrice: null, 
        maxPrice: null, 
        search: null, 
        inStock: null,
        page: 1 
      }
    });
  }
}
