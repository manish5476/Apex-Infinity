import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { of, map } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar'; // For placeholder
import { TableModule } from 'primeng/table'; // For inventory
import { LoadingService } from '../../../../core/services/loading.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { ProductService } from '../../services/product-service';

// A simplified interface based on your model
interface IProduct {
  _id: string;
  name: string;
  sku?: string;
  description?: string;
  brand?: string;
  category?: string;
  sellingPrice: number;
  purchasePrice?: number;
  taxRate?: number;
  isTaxInclusive?: boolean;
  inventory: { branchId: string; quantity: number; reorderLevel: number }[];
  images?: string[];
  defaultSupplierId?: any;
  tags?: string[];
  isActive: boolean;
  totalStock: number; // The virtual
  createdAt: string;
}

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    DividerModule,
    TagModule,
    AvatarModule,
    TableModule
  ],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetailsComponent implements OnInit {
  // Injected services
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private loadingService = inject(LoadingService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService); // To get branch names

  product = signal<IProduct | null>(null);
  
  // We need to map branch IDs to names for the inventory table
  branchNameMap = new Map<string, string>();

  constructor() {
    // Create a map from the master list of branches
    this.masterList.branches().forEach(branch => {
      this.branchNameMap.set(branch._id, branch.name);
    });
  }

  ngOnInit(): void {
    this.loadProductData();
  }

  private loadProductData(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const productId = params.get('id');
        if (!productId) {
          this.messageService.showError('Error', 'No product ID provided');
          return of(null);
        }
        this.loadingService.show();
        return this.productService.getProductById(productId).pipe(
          finalize(() => this.loadingService.hide())
        );
      })
    ).subscribe({
      next: (response: any) => {
        if (response && response.data && response.data.data) {
          this.product.set(response.data.data);
        } else if (response !== null) {
          this.messageService.showError('Error', 'Failed to load product details');
        }
      },
      error: (err) => {
        console.error('Failed to fetch product:', err);
        this.messageService.showError('Error', err.error?.message || 'Could not fetch product');
      }
    });
  }

  formatCurrency(value: number | undefined | null): string {
    if (value === undefined || value === null) value = 0;
    return `₹ ${value.toFixed(2)}`;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    // Using a more readable format
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getFilteredTags(): string[] {
    const tags = this.product()?.tags;
    if (Array.isArray(tags)) {
      return tags.filter(tag => tag && tag.trim() !== '');
    }
    return [];
  }
}