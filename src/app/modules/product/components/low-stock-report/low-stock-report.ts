import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { AgShareGrid } from '../../../shared/components/ag-shared-grid';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';
import { ImageCellRendererComponent } from '../../../shared/AgGrid/AgGridcomponents/image-cell-renderer/image-cell-renderer.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-low-stock-report',
  standalone: true,
  imports: [CommonModule, AgShareGrid, ButtonModule, RouterModule],
  templateUrl: './low-stock-report.html',
  styleUrls: ['./low-stock-report.scss']
})
export class LowStockReportComponent implements OnInit {
  private productService = inject(ProductService);
  private messageService = inject(AppMessageService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = signal(true);
  data: any[] = [];
  columns: any[] = [];

  ngOnInit() {
    this.setupColumns();
    this.loadData();
  }

  setupColumns() {
    this.columns = [
      {
        field: 'image',
        headerName: '',
        width: 60,
        pinned: 'left',
        cellRenderer: ImageCellRendererComponent,
        valueGetter: (params: any) => params.data.image || params.data.images?.[0] || null,
        filter: false,
        sortable: false,
        suppressMenu: true
      },
      {
        field: 'name',
        headerName: 'Product Name',
        flex: 1,
        minWidth: 200,
        filter: 'agTextColumnFilter',
        cellStyle: { 'font-weight': '600', 'color': 'var(--text-primary)' }
      },
      {
        field: 'sku',
        headerName: 'SKU',
        width: 150,
        filter: 'agTextColumnFilter',
        cellStyle: { 'font-family': 'var(--font-mono)' }
      },
      {
        field: 'reorderLevel',
        headerName: 'Reorder Level',
        width: 140,
        type: 'numericColumn',
      },
      {
        field: 'currentStock',
        headerName: 'Current Stock',
        width: 140,
        type: 'numericColumn',
        cellClass: 'text-danger font-bold',
        cellRenderer: (params: any) => {
          return `<div style="display:flex; align-items:center; justify-content: flex-end; gap: 6px;">
                    <i class="pi pi-exclamation-triangle text-danger" style="font-size: 12px"></i>
                    ${params.value !== undefined ? params.value : 0}
                  </div>`;
        }
      }
    ];
  }

  loadData() {
    this.isLoading.set(true);
    this.productService.getLowStockProducts()
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.cdr.detectChanges();
      }))
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
        error: (err) => {
          this.messageService.handleHttpError(err);
        }
      });
  }

  refresh() {
    this.loadData();
  }
}
