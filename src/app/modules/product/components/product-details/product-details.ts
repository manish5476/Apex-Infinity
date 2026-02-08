import { Component, OnInit, inject, signal, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { CarouselModule } from 'primeng/carousel';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast'; import { DialogService } from 'primeng/dynamicdialog';

// Services & Shared
import { ProductService } from '../../services/product-service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { ImageViewerDirective } from '../../../shared/directives/image-viewer.directive';
import { ProductAnalyticsDirective } from '../../../../core/interceptors/pProductAnalyticsDirective';
import { AgShareGrid } from '../../../shared/components/ag-shared-grid';
import { StockAdjustmentComponent } from '../stock-adjustment/stock-adjustment';
import { StockTransferComponent } from '../stoct-transfer/stoct-transfer';
import { ProductHistoryComponent } from '../product-history/product-history';

// Import the dialog component (Ensure path is correct)

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule, SkeletonModule, CarouselModule, TooltipModule, ToastModule, ImageViewerDirective, ProductAnalyticsDirective, AgShareGrid],
  providers: [DialogService],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.scss'],
})
export class ProductDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);
  public common = inject(CommonMethodService);
  private cdr = inject(ChangeDetectorRef); private dialogService = inject(DialogService);

  product = signal<any | null>(null);
  loading = signal(true);
  isError = signal(false);

  inventoryData: any[] = [];
  inventoryColumns: any[] = []; productId: string | null = null;

  branchNameMap = new Map<string, string>();

  constructor() {
    effect(() => {
      this.masterList.branches().forEach(b => this.branchNameMap.set(b._id, b.name));
    });
  }

  ngOnInit(): void {
    this.setupInventoryColumns();

    this.route.paramMap.subscribe(params => {
      this.productId = params.get('id'); this.loadProductData();
    });
  }

  loadProductData() {
    if (!this.productId) return;

    this.loading.set(true);
    this.isError.set(false);

    this.productService.getProductById(this.productId).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (res: any) => {
        if (res?.data?.data || res?.data) {
          const p = res.data.data || res.data;
          const calculatedStock = p.inventory?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0;
          p.totalStock = calculatedStock;
          this.product.set(p);
          this.inventoryData = [...(p.inventory || [])];
        } else {
          this.isError.set(true);
        }
      },
      error: () => this.isError.set(true)
    });
  }

  openStockAdjustment(product: any) {
    const ref: any = this.dialogService.open(StockAdjustmentComponent, {
      header: `Adjust Stock: ${product.name}`,
      width: '80%',
      contentStyle: { overflow: 'visible' },
      baseZIndex: 10000,
      data: {
        id: product._id
      }
    });

    ref.onClose.subscribe((success: boolean) => {
      if (success) {
        this.loadProductData();
      }
    });
  }
  openStockTransfer(product: any) {
    const ref: any = this.dialogService.open(StockTransferComponent, {
      header: `transfer Stock: ${product.name}`,
      width: '80%',
      contentStyle: { overflow: 'visible' },
      baseZIndex: 10000,
      data: { id: product._id }
    });
    ref.onClose.subscribe((success: boolean) => {
      if (success) {
        this.loadProductData();
      }
    });
  }

  setupInventoryColumns() {
    this.inventoryColumns = [
      {
        headerName: 'Branch',
        field: 'branchId',
        width: 150,
        cellRenderer: (params: any) => {
          if (!params.value) return '';
          const id = typeof params.value === 'object' ? params.value?._id : params.value;
          const name = this.branchNameMap.get(id) || 'Unknown Branch';
          return `<div style="font-weight:600;">${name}</div>`;
        }
      },
      {
        headerName: 'Current Stock',
        field: 'quantity',
        width: 130,
        cellStyle: { 'justify-content': 'flex-end', 'display': 'flex' },
        cellRenderer: (params: any) => {
          const val = params.value !== undefined ? params.value : 0;
          return `<div style="font-family:monospace; font-weight:700;">${val}</div>`;
        }
      },
      {
        headerName: 'Re-Order Level',
        field: 'reorderLevel',
        width: 130,
        cellStyle: { 'justify-content': 'flex-end', 'display': 'flex' },
        cellRenderer: (params: any) => params.value
      },
      {
        headerName: 'Status',
        width: 140,
        valueGetter: (params: any) => {
          const qty = params.data.quantity || 0;
          const reorder = params.data.reorderLevel || 0;
          return qty <= reorder ? 'Low' : 'OK';
        },
        cellRenderer: (params: any) => {
          const isLow = params.value === 'Low';
          const color = isLow ? '#d97706' : '#15803d';
          const bg = isLow ? '#fffbeb' : '#ecfdf5';
          const border = isLow ? '#fcd34d' : '#bbf7d0';
          const icon = isLow ? 'pi-exclamation-triangle' : 'pi-check-circle';
          const text = isLow ? 'LOW STOCK' : 'IN STOCK';

          return `
            <div style="display:flex; align-items:center; height:100%;">
              <span style="
                background-color: ${bg}; 
                color: ${color}; 
                border: 1px solid ${border};
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

  formatCurrency(val: any): string {
    return this.common.formatCurrency(val);
  }

  formatDate(val: any): string {
    return this.common.formatDate(val);
  }

  calculateMargin(p: any): string {
    if (!p?.sellingPrice || !p?.purchasePrice) return '0.00';
    const margin = ((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100;
    return margin.toFixed(2);
  }

  getFilteredTags(): string[] {
    return this.product()?.tags?.filter((t: string) => t && t.trim()) || [];
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    const prod = this.product();
    if (files?.length && prod?._id) {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('photos', files[i]);
      }
      this.loading.set(true);
      this.productService.uploadProductFile(prod._id, formData)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe((res: any) => {
          if (res?.data?.product) {
            this.product.set(res.data.product);
            this.messageService.showSuccess('Success', 'Images uploaded successfully');
          }
        });
    }
  }

  eventFromGrid(event: any) {
  }

  openHistory(product: any) {
    const ref: any = this.dialogService.open(ProductHistoryComponent, {
      header: `transfer Stock: ${product.name}`,
      width: '80%',
      contentStyle: { overflow: 'visible' },
      baseZIndex: 10000,
      data: { productId: product._id }
    });
    ref.onClose.subscribe((success: boolean) => {
      if (success) {
        this.loadProductData();
      }
    });
  }
}

// import { Component, OnInit, inject, signal, effect, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { finalize, switchMap } from 'rxjs/operators';
// import { of } from 'rxjs';
//
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { SkeletonModule } from 'primeng/skeleton';
// import { CarouselModule } from 'primeng/carousel';
// import { TooltipModule } from 'primeng/tooltip';
// import { ToastModule } from 'primeng/toast';
//
// import { ProductService } from '../../services/product-service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { CommonMethodService } from '../../../../core/utils/common-method.service';
// import { ImageViewerDirective } from '../../../shared/directives/image-viewer.directive';
// import { ProductAnalyticsDirective } from '../../../../core/interceptors/pProductAnalyticsDirective';
// import { AgShareGrid } from '../../../shared/components/ag-shared-grid';
// import { DialogService } from 'primeng/dynamicdialog';

// @Component({
//   selector: 'app-product-details',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ButtonModule,
//     TagModule,
//     SkeletonModule,
//     CarouselModule,
//     TooltipModule,
//     ToastModule,
//     ImageViewerDirective,
//     ProductAnalyticsDirective,//     AgShareGrid
//   ],
//   templateUrl: './product-details.html',
//   styleUrls: ['./product-details.scss'],
// })
// export class ProductDetailsComponent implements OnInit {//
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private productService = inject(ProductService);
//   private masterList = inject(MasterListService);
//   private messageService = inject(AppMessageService);
//   public common = inject(CommonMethodService);
//   private cdr = inject(ChangeDetectorRef);
//   private dialogService: DialogService//
//   product = signal<any | null>(null);
//   loading = signal(true);
//   isError = signal(false);
//
//   inventoryData: any[] = [];
//   inventoryColumns: any[] = [];
//
//   branchNameMap = new Map<string, string>();

//   constructor() {//
//     effect(() => {
//       this.masterList.branches().forEach(b => this.branchNameMap.set(b._id, b.name));
//     });
//   }

//   ngOnInit(): void {//     this.setupInventoryColumns();
//     this.route.paramMap.pipe(
//       switchMap(params => {
//         const id = params.get('id');
//         if (!id) return of(null);
//         this.loading.set(true);
//         this.isError.set(false);
//         return this.productService.getProductById(id).pipe(
//           finalize(() => this.loading.set(false))
//         );
//       })
//     ).subscribe({
//       next: (res: any) => {
//         if (res?.data?.data || res?.data) {
//           const p = res.data.data || res.data;
//           this.product.set(p);//
//           this.inventoryData = p.inventory || [];
//         } else {
//           this.isError.set(true);
//         }
//       },
//       error: () => this.isError.set(true)
//     });
//   }

// openStockAdjustment(product: any) {
//   const ref = this.dialogService.open(StockAdjustmentComponent, {
//     header: `Adjust Stock: ${product.name}`,
//     width: '400px',//     contentStyle: { overflow: 'visible' },
//     baseZIndex: 10000,
//     data: {//       id: product._id
//     }
//   });

//   ref.onClose.subscribe((success: boolean) => {
//     if (success) {//
//       this.loadProducts();
//     }
//   });
// }//
//   setupInventoryColumns() {
//     this.inventoryColumns = [
//       {
//         headerName: 'Branch',
//         field: 'branchId',
//         width: 150,
//         cellRenderer: (params: any) => {//
//           const id = typeof params.value === 'object' ? params.value?._id : params.value;
//           const name = this.branchNameMap.get(id) || 'Unknown Branch';
//           return `<div style="font-weight:600; color:var(--text-primary);">${name}</div>`;
//         }
//       },
//       {
//         headerName: 'Current Stock',
//         field: 'quantity',
//         width: 130,//         cellStyle: { 'justify-content': 'flex-end', 'display': 'flex' },
//         cellRenderer: (params: any) => {
//           return `<div style="font-family:var(--font-mono); font-weight:700; color:var(--text-primary);">${params.value}</div>`;
//         }
//       },
//       {
//         headerName: 'Re-Order Level',
//         field: 'reorderLevel',
//         width: 130,
//         cellStyle: { 'justify-content': 'flex-end', 'display': 'flex' },
//         cellRenderer: (params: any) => {
//           return `<div style="font-family:var(--font-mono); color:var(--text-tertiary);">${params.value}</div>`;
//         }
//       },
//       {
//         headerName: 'Status',
//         width: 140,
//         valueGetter: (params: any) => {
//           return params.data.quantity <= params.data.reorderLevel ? 'Low' : 'OK';
//         },
//         cellRenderer: (params: any) => {
//           const isLow = params.value === 'Low';//           const bg = isLow ? 'var(--bg-warning-subtle)' : 'var(--bg-success-subtle)';//           const color = isLow ? '#d97706' : '#15803d';
//           const icon = isLow ? 'pi-exclamation-triangle' : 'pi-check-circle';
//           const text = isLow ? 'LOW STOCK' : 'IN STOCK';
//
//           return `
//             <div style="display:flex; align-items:center; height:100%;">
//               <span style="
//                 background-color: ${isLow ? '#fffbeb' : '#ecfdf5'};
//                 color: ${color};
//                 border: 1px solid ${isLow ? '#fcd34d' : '#bbf7d0'};
//                 padding: 2px 8px;
//                 border-radius: 4px;
//                 font-size: 10px;
//                 font-weight: 700;
//                 text-transform: uppercase;
//                 display:flex; align-items:center; gap:4px;
//               ">
//                 <i class="pi ${icon}" style="font-size:10px"></i> ${text}
//               </span>
//             </div>`;
//         }
//       }
//     ];
//   }
//

//   formatCurrency(val: any): string {
//     return this.common.formatCurrency(val);
//   }

//   formatDate(val: any): string {
//     return this.common.formatDate(val);
//   }

//   calculateMargin(p: any): string {
//     if (!p.sellingPrice || !p.purchasePrice) return '0.00';
//     const margin = ((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100;
//     return margin.toFixed(2);
//   }

//   getFilteredTags(): string[] {
//     return this.product()?.tags?.filter((t: string) => t.trim()) || [];
//   }
//


//   onFileSelected(event: any) {
//     const files = event.target.files;
//     if (files?.length) {
//       const formData = new FormData();
//       for (let i = 0; i < files.length; i++) {
//         formData.append('photos', files[i]);
//       }
//       this.loading.set(true);
//       this.productService.uploadProductFile(this.product()._id, formData)
//         .pipe(finalize(() => this.loading.set(false)))
//         .subscribe((res: any) => {
//           if (res?.data?.product) {
//             this.product.set(res.data.product);
//             this.messageService.showSuccess('Success', 'Images uploaded successfully');
//           }
//         });
//     }
//   }
//
//   eventFromGrid(event: any) {//
//   }
// }