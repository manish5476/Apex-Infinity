import { Component, OnInit, inject, signal, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG Imports (Kept for layout/feedback, removed Table)
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { CarouselModule } from 'primeng/carousel';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';

// Services & Shared
import { ProductService } from '../../services/product-service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { ImageViewerDirective } from '../../../shared/directives/image-viewer.directive';
import { ProductAnalyticsDirective } from '../../../../core/interceptors/pProductAnalyticsDirective';
import { AgShareGrid } from '../../../shared/components/ag-shared-grid';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ButtonModule, 
    TagModule, 
    SkeletonModule, 
    CarouselModule, 
    TooltipModule,
    ToastModule,
    ImageViewerDirective,
    ProductAnalyticsDirective,
    AgShareGrid // 👈 Added
  ],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.scss'],
})
export class ProductDetailsComponent implements OnInit {
  // --- Injections ---
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);
  public common = inject(CommonMethodService);
  private cdr = inject(ChangeDetectorRef);

  // --- Signals ---
  product = signal<any | null>(null);
  loading = signal(true);
  isError = signal(false);
  
  // Inventory Grid Data
  inventoryData: any[] = [];
  inventoryColumns: any[] = [];

  // Helpers
  branchNameMap = new Map<string, string>();

  constructor() {
    // Populate branch map for quick lookup
    effect(() => {
      this.masterList.branches().forEach(b => this.branchNameMap.set(b._id, b.name));
    });
  }

  ngOnInit(): void {
    this.setupInventoryColumns(); // Prepare Grid Columns
    
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
          const p = res.data.data || res.data;
          this.product.set(p);
          // Set Grid Data
          this.inventoryData = p.inventory || [];
        } else {
          this.isError.set(true);
        }
      },
      error: () => this.isError.set(true)
    });
  }

  // --- AG Grid Setup for Inventory ---
  setupInventoryColumns() {
    this.inventoryColumns = [
      {
        headerName: 'Branch',
        field: 'branchId',
        width: 150,
        cellRenderer: (params: any) => {
          // Handle both populated object or raw ID
          const id = typeof params.value === 'object' ? params.value?._id : params.value;
          const name = this.branchNameMap.get(id) || 'Unknown Branch';
          return `<div style="font-weight:600; color:var(--text-primary);">${name}</div>`;
        }
      },
      {
        headerName: 'Current Stock',
        field: 'quantity',
        width: 130,
        cellStyle: { 'justify-content': 'flex-end', 'display': 'flex' }, // Right align numbers
        cellRenderer: (params: any) => {
          return `<div style="font-family:var(--font-mono); font-weight:700; color:var(--text-primary);">${params.value}</div>`;
        }
      },
      {
        headerName: 'Re-Order Level',
        field: 'reorderLevel',
        width: 130,
        cellStyle: { 'justify-content': 'flex-end', 'display': 'flex' },
        cellRenderer: (params: any) => {
           return `<div style="font-family:var(--font-mono); color:var(--text-tertiary);">${params.value}</div>`;
        }
      },
      {
        headerName: 'Status',
        width: 140,
        valueGetter: (params: any) => {
          return params.data.quantity <= params.data.reorderLevel ? 'Low' : 'OK';
        },
        cellRenderer: (params: any) => {
          const isLow = params.value === 'Low';
          const bg = isLow ? 'var(--bg-warning-subtle)' : 'var(--bg-success-subtle)'; // You'll need to ensure these map to your rgba tokens or use specific colors
          const color = isLow ? '#d97706' : '#15803d'; // Fallback or token
          const icon = isLow ? 'pi-exclamation-triangle' : 'pi-check-circle';
          const text = isLow ? 'LOW STOCK' : 'IN STOCK';

          // Inline styles using variables where possible
          return `
            <div style="display:flex; align-items:center; height:100%;">
              <span style="
                background-color: ${isLow ? '#fffbeb' : '#ecfdf5'}; 
                color: ${color}; 
                border: 1px solid ${isLow ? '#fcd34d' : '#bbf7d0'};
                padding: 2px 8px; 
                border-radius: 4px; 
                font-size: 10px; 
                font-weight: 700; 
                text-transform: uppercase; 
                display:flex; align-items:center; gap:4px;
              ">
                <i class="pi ${icon}" style="font-size:10px"></i> ${text}
              </span>
            </div>`;
        }
      }
    ];
  }

  // --- Logic Helpers ---

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
    this.messageService.showInfo('Coming Soon', 'Stock adjustment module in progress');
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
            this.messageService.showSuccess('Success', 'Images uploaded successfully');
          }
        });
    }
  }

  // Grid Event Listener (Optional if you need row clicks in inventory)
  eventFromGrid(event: any) {
     // Handle grid events if necessary
  }
}