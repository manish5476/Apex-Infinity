import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { CarouselModule } from 'primeng/carousel';
import { TooltipModule } from 'primeng/tooltip';

// Services & Components
import { ProductService } from '../../services/product-service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { ImageViewerDirective } from '../../../shared/directives/image-viewer.directive';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ButtonModule, TagModule, 
    SkeletonModule, TableModule, CarouselModule, TooltipModule,
    ImageViewerDirective
  ],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.scss'],
})
export class ProductDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);
  public common = inject(CommonMethodService); // Access to formatCurrency, etc.

  // Signals
  product = signal<any | null>(null);
  loading = signal(true);
  isError = signal(false);
  
  // Helpers
  branchNameMap = new Map<string, string>();

  constructor() {
    // Populate branch map for quick lookup in inventory table
    this.masterList.branches().forEach(b => this.branchNameMap.set(b._id, b.name));
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) return of(null);
        this.loading.set(true);
        this.isError.set(false);
        return this.productService.getProductById(id).pipe(
          finalize(() => this.loading.set(false))
        );
      })
    ).subscribe({
      next: (res: any) => {
        if (res?.data?.data || res?.data) {
          this.product.set(res.data.data || res.data);
        } else {
          this.isError.set(true);
        }
      },
      error: () => this.isError.set(true)
    });
  }

  // --- UI Helpers ---

  getBranchName(id: string): string {
    return this.branchNameMap.get(id) || 'Unknown Branch';
  }

  formatCurrency(val: any): string {
    return this.common.formatCurrency(val);
  }

  formatDate(val: any): string {
    return this.common.formatDate(val);
  }

  calculateMargin(p: any): string {
    if (!p.sellingPrice || !p.purchasePrice) return '0.00';
    const margin = ((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100;
    return margin.toFixed(2);
  }

  getFilteredTags(): string[] {
    return this.product()?.tags?.filter((t: string) => t.trim()) || [];
  }

  // --- Actions ---

  openStockAdjustment() {
    // this.messageService.showInfoGrowlMessage('Stock adjustment module coming soon');
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files?.length) {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('photos', files[i]);
      }
      this.loading.set(true);
      this.productService.uploadProductFile(this.product()._id, formData)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe((res: any) => {
          if (res?.data?.product) {
            this.product.set(res.data.product);
            this.messageService.showSuccess('Success', 'Images uploaded');
          }
        });
    }
  }
}
// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { finalize, switchMap } from 'rxjs/operators';
// import { of, map } from 'rxjs';
// import { CarouselModule } from 'primeng/carousel'; // <--- IMPORT THIS
// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { DividerModule } from 'primeng/divider';
// import { TagModule } from 'primeng/tag';
// import { AvatarModule } from 'primeng/avatar'; // For placeholder
// import { TableModule } from 'primeng/table'; // For inventory
// import { LoadingService } from '../../../../core/services/loading.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { ProductService } from '../../services/product-service';
// import { ImageViewerDirective } from '../../../shared/directives/image-viewer.directive';

// // A simplified interface based on your model
// interface IProduct {
//   _id: string;
//   name: string;
//   sku?: string;
//   description?: string;
//   brand?: string;
//   category?: string;
//   sellingPrice: number;
//   purchasePrice?: number;
//   taxRate?: number;
//   isTaxInclusive?: boolean;
//   inventory: { branchId: string; quantity: number; reorderLevel: number }[];
//   images?: string[];
//   defaultSupplierId?: any;
//   tags?: string[];
//   isActive: boolean;
//   totalStock: number; // The virtual
//   createdAt: string;
// }

// @Component({
//   selector: 'app-product-details',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ButtonModule,ImageViewerDirective,
//     DividerModule,
//     TagModule,
//     AvatarModule,
//     TableModule,CarouselModule
//   ],
//   templateUrl: './product-details.html',
//   styleUrl: './product-details.scss',
// })
// export class ProductDetailsComponent implements OnInit {
//   // Injected services
//   private route = inject(ActivatedRoute);
//   private productService = inject(ProductService);
//   private loadingService = inject(LoadingService);
//   private messageService = inject(AppMessageService);
//   private masterList = inject(MasterListService); // To get branch names
//   product = signal<IProduct | null>(null);
//   branchNameMap = new Map<string, string>();
//   constructor() {
//     // Create a map from the master list of branches
//     this.masterList.branches().forEach(branch => {
//       this.branchNameMap.set(branch._id, branch.name);
//     });
//   }

//   ngOnInit(): void {
//     this.loadProductData();
//   }

//   private loadProductData(): void {
//     this.route.paramMap.pipe(
//       switchMap(params => {
//         const productId = params.get('id');
//         if (!productId) {
//           this.messageService.showError('Error', 'No product ID provided');
//           return of(null);
//         }
//         this.loadingService.show();
//         return this.productService.getProductById(productId).pipe(
//           finalize(() => this.loadingService.hide())
//         );
//       })
//     ).subscribe({
//       next: (response: any) => {
//         if (response && response.data && response.data.data) {
//           this.product.set(response.data.data);
//         } else if (response !== null) {
//           this.messageService.showError('Error', 'Failed to load product details');
//         }
//       },
//       error: (err) => {
//         console.error('Failed to fetch product:', err);
//         this.messageService.showError('Error', err.error?.message || 'Could not fetch product');
//       }
//     });
//   }

//   formatCurrency(value: number | undefined | null): string {
//     if (value === undefined || value === null) value = 0;
//     return `₹ ${value.toFixed(2)}`;
//   }

//   formatDate(dateString: string | undefined): string {
//     if (!dateString) return 'N/A';
//     // Using a more readable format
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//     });
//   }

//   getFilteredTags(): string[] {
//     const tags = this.product()?.tags;
//     if (Array.isArray(tags)) {
//       return tags.filter(tag => tag && tag.trim() !== '');
//     }
//     return [];
//   }
//   onFileSelected(event: any): void {
//     const input = event.target;
//     const files: FileList = input.files;

//     if (files && files.length > 0) {
//       const formData = new FormData();

//       // 1. Loop through all selected files
//       for (let i = 0; i < files.length; i++) {
//         const file = files[i];

//         // Validate each file
//         if (!file.type.startsWith('image/')) {
//           this.messageService.showError('Invalid File', `File ${file.name} is not an image.`);
//           continue; 
//         }

//         // 2. Append using the SAME key 'photos' (must match backend upload.array('photos'))
//         formData.append('photos', file);
//       }

//       // 3. Call API
//       this.uploadImage(formData);

//       // 4. CRITICAL FIX: Reset input value so the (change) event fires 
//       // even if you select the same file again later.
//       input.value = ''; 
//     }
//   }

//   private uploadImage(formData: FormData): void {
//     const productId = this.product()?._id;
//     if (!productId) return;

//     this.loadingService.show();

//     // Ensure your ProductService calls .patch properly
//     this.productService.uploadProductFile(productId, formData).subscribe({
//       next: (res: any) => {
//         const updatedProduct = res.data?.product;
//         if (updatedProduct) {
//           this.product.set(updatedProduct);
//           this.messageService.showSuccess('Success', 'Images uploaded successfully');
//         }
//         this.loadingService.hide();
//       },
//       error: (err) => {
//         console.error(err);
//         this.messageService.showError('Upload Failed', 'Could not upload images');
//         this.loadingService.hide();
//       }
//     });
//   }

// }
