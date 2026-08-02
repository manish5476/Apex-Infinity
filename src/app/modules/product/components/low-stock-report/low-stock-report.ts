import { Component, OnInit, inject, signal, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, finalize } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';

import { ProductService } from '../../services/product-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';

import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';

@Component({
  selector: 'app-low-stock-report',
  standalone: true,
  imports: [
    RouterModule,
    ButtonModule,
    ToastModule,
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
  ],
  providers: [DecimalPipe],
  template: `
    <p-toast position="bottom-right" appendTo="body"></p-toast>
    <app-page>
      <app-page-header
        title="Low Stock Alert"
        subtitle="Products that are at or below their reorder level.">
        <div header-left>
          <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 text-red-600 border border-red-200 shadow-sm mr-3">
            <i class="pi pi-exclamation-triangle text-xl"></i>
          </div>
        </div>
        <div header-right>
          <p-button label="Refresh" icon="pi pi-refresh" severity="secondary" [text]="true" (onClick)="refresh()"></p-button>
        </div>
      </app-page-header>
      <app-page-content [padded]="false">
        <app-data-grid
          [columns]="columns"
          [data]="data"
          [loading]="isLoading()"
          [rowActions]="rowActions"
          (gridEvent)="eventFromGrid($event)">
        </app-data-grid>
      </app-page-content>
    </app-page>
  `,
  styles: []
})
export class LowStockReportComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  private productService = inject(ProductService);
  private messageService = inject(AppMessageService);
  private cdr = inject(ChangeDetectorRef);
  private decimalPipe = inject(DecimalPipe);

  readonly isLoading = signal(true);
  data: any[] = [];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'view',
      icon: 'pi pi-eye',
      tooltip: 'View Product',
      variant: 'primary',
      permission: PERMISSIONS.PRODUCT.READ,
      callback: (row) => {
        // Navigation would typically happen here
      }
    }
  ];

  readonly columns: GridColumn[] = [
    {
      field: 'image',
      header: 'Image',
      type: 'image',
      width: '80px',
      formatter: (_val: any, row: any) => row?.image || row?.images?.[0] || null
    },
    {
      field: 'name',
      header: 'Product',
      type: 'user',
      minWidth: '220px',
      formatter: (_val: any, row: any) => row?.name || '—'
    },
    {
      field: 'sku',
      header: 'SKU',
      width: '120px',
      formatter: (val: any) => val || '—'
    },
    {
      field: 'categoryId.name',
      header: 'Category',
      width: '140px',
      formatter: (_val: any, row: any) => row?.categoryId?.name || '—'
    },
    {
      field: 'branchId.name',
      header: 'Branch',
      width: '130px',
      type: 'badge',
      formatter: (_val: any, row: any) => row?.branchName || row?.branch?.name || row?.branchId?.name || '—'
    },
    {
      field: 'defaultSupplierId.companyName',
      header: 'Supplier',
      width: '160px',
      formatter: (_val: any, row: any) => row?.supplierName || row?.defaultSupplierId?.companyName || '—'
    },
    {
      field: 'reorderLevel',
      header: 'Reorder Level',
      width: '130px',
      align: 'right',
      formatter: (_val: any, row: any) => String(row?.reorderLevel ?? row?.inventory?.[0]?.reorderLevel ?? 0)
    },
    {
      field: 'currentStock',
      header: 'Current Stock',
      width: '130px',
      align: 'right',
      formatter: (_val: any, row: any) => String(row?.currentStock ?? row?.inventory?.[0]?.quantity ?? 0)
    },
    {
      field: 'shortage',
      header: 'Shortage',
      width: '120px',
      align: 'right',
      formatter: (_val: any, row: any) => {
        const stock = row?.currentStock ?? row?.inventory?.[0]?.quantity ?? 0;
        const reorder = row?.reorderLevel ?? row?.inventory?.[0]?.reorderLevel ?? 0;
        return String(Math.max(0, reorder - stock));
      }
    },
    {
      field: 'sellingPrice',
      header: 'Sell Price',
      width: '120px',
      type: 'currency',
      align: 'right'
    },
    {
      field: 'updatedAt',
      header: 'Last Updated',
      width: '150px',
      formatter: (val: any) => {
        if (!val) return '—';
        const d = new Date(val);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
  ];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.productService
      .getLowStockProducts()
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.cdr.detectChanges();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res: any) => {
          if (res?.data?.products) {
            this.data = res.data.products;
          } else if (Array.isArray(res?.data)) {
            this.data = res.data;
          } else {
            this.data = [];
          }
        },
        error: (err: any) => this.messageService.handleHttpError(err),
      });
  }

  refresh() {
    this.loadData();
  }

  eventFromGrid(event: any) {
    // Handle grid events
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}