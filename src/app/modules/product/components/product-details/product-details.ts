import { Component, OnInit, inject, signal, effect, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, switchMap, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { CarouselModule } from 'primeng/carousel';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast'; import { DialogService } from 'primeng/dynamicdialog';

// Services & Shared
import { ProductService } from '../../services/product-service';
// import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { ImageViewerDirective } from '../../../shared/directives/image-viewer.directive';
import { ProductAnalyticsDirective } from '../../../../core/interceptors/pProductAnalyticsDirective';
import { DataGridComponent, GridColumn } from '@shared/ui/grid';
import { StockAdjustmentComponent } from '../stock-adjustment/stock-adjustment';
import { StockTransferComponent } from '../stoct-transfer/stoct-transfer';
import { ProductHistoryComponent } from '../product-history/product-history';
import { DynamicDialogServices } from '../../../../core/services/dynamic-dialog-services';
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MasterDropdownService } from '../../../../core/services/master-dropdown.service';
import { TabService } from '../../../../Tabbing';


// Import the dialog component (Ensure path is correct)

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule, SkeletonModule, CarouselModule, TooltipModule, ToastModule, ImageViewerDirective, ProductAnalyticsDirective, DataGridComponent, HasPermissionDirective, ConfirmDialogModule],
  providers: [DialogService, ConfirmationService],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.scss'],
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  // private masterList = inject(MasterListService);
  private masterDropdownService = inject(MasterDropdownService);
  private messageService = inject(AppMessageService);
  public common = inject(CommonMethodService);
  private cdr = inject(ChangeDetectorRef); 
  private dialogService = inject(DialogService);
  private confirmationService = inject(ConfirmationService);
  private tabService = inject(TabService);


  PERMISSIONS = PERMISSIONS;

  product = signal<any | null>(null);
  loading = signal(true);
  isError = signal(false);

  inventoryData: any[] = [];
  inventoryColumns: GridColumn[] = []; productId: string | null = null;

  branchNameMap = new Map<string, string>();

  constructor() {
    // effect(() => {
    //   this.masterList.branches().forEach(b => this.branchNameMap.set(b._id, b.name));
    // });
  }

  ngOnInit(): void {
    this.setupInventoryColumns();
    this.loadBranches();

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.productId = params.get('id'); this.loadProductData();
    });
  }

  private loadBranches() {
    this.masterDropdownService.getDropdownData('branches').pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const branches = res.data || [];
        branches.forEach((b: any) => this.branchNameMap.set(b.value, b.label));
        this.cdr.markForCheck();
      }
    });
  }

 
  setupInventoryColumns() {
    this.inventoryColumns = [
      {
        header: 'Branch',
        field: 'branchId',
        width: '150px',
        formatter: (val: any) => {
          if (!val) return '';
          const id = typeof val === 'object' ? val?._id : val;
          const name = this.branchNameMap.get(id) || 'Unknown Branch';
          return `<div style="font-weight:600;">${name}</div>`;
        }
      },
      {
        header: 'Current Stock',
        field: 'quantity',
        width: '130px',
        align: 'right',
        formatter: (val: any) => {
          const v = val !== undefined ? val : 0;
          return `<div style="font-family:monospace; font-weight:700;">${v}</div>`;
        }
      },
      {
        header: 'Re-Order Level',
        field: 'reorderLevel',
        width: '130px',
        align: 'right'
      },
      {
        field: 'status',
        header: 'Status',
        width: '140px',
        formatter: (_val: any, row: any) => {
          const qty = row?.quantity || 0;
          const reorder = row?.reorderLevel || 0;
          const isLow = qty <= reorder;

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

  loadProductData() {
    if (!this.productId) return;

    this.loading.set(true);
    this.isError.set(false);

    this.productService.getProductById(this.productId).pipe(
      finalize(() => this.loading.set(false)), takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        if (res?.data?.data || res?.data) {
          const p = res.data.data || res.data;
          
          // Safeguard the inventory calculation
          const calculatedStock = p.inventory?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0;
          p.totalStock = calculatedStock;
          
          this.product.set(p);
          this.inventoryData = [...(p.inventory || [])];

          // Update tab label with product name
          this.tabService.updateActiveTab({ label: p.name });

        } else {
          this.isError.set(true);
          this.messageService.showError('Product data not found.');
        }
      },
      error: (err) => {
        this.isError.set(true);
        // Integrated global error handler for timeouts or 404s
        this.messageService.handleHttpError(err);
      }
    });
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    const prod = this.product();
    
    // Fast exit if no files or no product ID
    if (!files?.length || !prod?._id) return; 

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }
    
    this.loading.set(true);
    
    this.productService.uploadProductFile(prod._id, formData)
      .pipe(finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res?.data?.product) {
            this.product.set(res.data.product);
            // Updated to single string format
            this.messageService.showSuccess('Images uploaded successfully.');
          }
        },
        error: (err) => {
          // Previously missing! Now catches large file errors or network drops.
          this.messageService.handleHttpError(err);
        }
      });
  }

  eventFromGrid(event: any) {
  }

  private dialogHelper = inject(DynamicDialogServices);

  openStockAdjustment(product: any) {
    const ref = this.dialogHelper.openStockAdjustment(product);
    if (ref) {
      ref.onClose.pipe(takeUntil(this.destroy$)).subscribe((success: boolean) => {
        if (success) {
          this.loadProductData(); 
        }
      });
    }
  }

  openHistory(product: any) {
    const ref = this.dialogHelper.openProductHistory(product);
  }

  openStockTransfer(product: any) {
    const ref = this.dialogHelper.openStockTransfer(product);
    if (ref) {
      ref.onClose.pipe(takeUntil(this.destroy$)).subscribe((success: boolean) => {
        if (success) this.loadProductData();
      });
    }
  }

  deleteProduct() {
     if (!this.productId) return;
     const productName = this.product()?.name || 'this product';

     this.confirmationService.confirm({
       message: `Are you sure you want to delete ${productName}?`,
       header: 'Confirm Deletion',
       icon: 'pi pi-exclamation-triangle',
       accept: () => {
         this.productService.deleteProductById(this.productId!).pipe(takeUntil(this.destroy$)).subscribe({
           next: () => {
             this.messageService.showSuccess('Product deleted successfully');
             this.router.navigate(['/products']);
           },
           error: (err) => this.messageService.handleHttpError(err)
         });
       }
     });
  }

  onTabReattached() {
    this.loadProductData();
  }


    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}