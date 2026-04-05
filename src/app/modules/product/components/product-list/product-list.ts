import { ChangeDetectorRef, Component, OnInit, effect, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ProductService } from '../../services/product-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { ImageCellRendererComponent } from '../../../shared/AgGrid/AgGridcomponents/image-cell-renderer/image-cell-renderer.component';
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
import { Dialog } from "primeng/dialog";
import { BulkProductEntry } from "../bulk-product-entry/bulk-product-entry";
import { finalize } from 'rxjs';
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    RouterModule,
    AgShareGrid,
    Dialog,
    BulkProductEntry,
    HasPermissionDirective,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private productService = inject(ProductService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmationService = inject(ConfirmationService);

  PERMISSIONS = PERMISSIONS;

  public selectedRows: any
  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 50;
  public bulkDialogVisible: boolean = false
  @ViewChild('fileInput') fileInput!: ElementRef;
  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';

  brandOptions = signal<any[]>([]);
  categoryOptions = signal<any[]>([]);

  productFilter = {
    name: null,
    sku: null,
    brand: null,
    category: null,
  };

  constructor() {
    effect(() => {
      this.brandOptions.set(this.masterList.brands());
      this.categoryOptions.set(this.masterList.categories());
    });
  }

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.productFilter = { name: null, sku: null, brand: null, category: null };
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    const filterParams = {
      ...this.productFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.productService.getAllProducts(filterParams)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res: any) => {
          let newData: any[] = [];

          // 1. EXTRACT DATA
          // Structure is: root -> data -> data (array)
          if (res.data && Array.isArray(res.data.data)) {
            newData = res.data.data;
          }

          // 2. EXTRACT PAGINATION
          // Structure is: root -> pagination -> totalResults
          if (res.pagination) {
            this.totalCount = res.pagination.totalResults;
          }

          // 3. UPDATE LOCAL STATE
          this.data = [...this.data, ...newData];

          // 4. UPDATE GRID
          if (this.gridApi) {
            if (isReset) {
              // If resetting, replace all data
              this.gridApi.setGridOption('rowData', this.data);
            } else {
              // If appending (scrolling), just add new rows
              this.gridApi.applyTransaction({ add: newData });
            }
          }

          this.currentPage++;
        },
        error: (err: any) => {
          // Replaced console.error and manual toast with global handler
          this.messageService.handleHttpError(err);
        }
      });
  }

  onScrolledToBottom(event: any) {
    if (!this.isLoading && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  eventFromGrid(event: any) {
    console.log(event);
    if (event.type === 'cellClicked' && event.field === 'name') {
      const productId = event.row._id;
      if (productId) {
        this.router.navigate([productId], { relativeTo: this.route });
      }
    }
    console.log(event);
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event)
    }
    if (event.type === 'selectionChanged') {
      this.selectedRows = event.rows
    }
  }

  deleteProduct() {
    if (!this.selectedRows || this.selectedRows.length !== 1) return;
    const productId = this.selectedRows[0]._id;
    const productName = this.selectedRows[0].name;

    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${productName}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.productService.deleteProductById(productId).subscribe({
          next: () => {
            this.messageService.showSuccess('Product deleted successfully');
            this.selectedRows = [];
            this.getData(true);
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }

  triggerUpload() {
    if (this.selectedRows && this.selectedRows.length === 1) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (!files?.length || !this.selectedRows || this.selectedRows.length !== 1) return;

    const productId = this.selectedRows[0]._id;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }

    this.isLoading = true;
    this.productService.uploadProductFile(productId, formData)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res: any) => {
          this.messageService.showSuccess('Images uploaded successfully.');
          this.getData(true);
        },
        error: (err: any) => {
          this.messageService.handleHttpError(err);
        }
      });
  }
  getColumn(): void {
    this.column = [
      // ═══════════════════════════════════════════════════════
      // GROUP 1 — PRODUCT DETAILS
      // ═══════════════════════════════════════════════════════
      {
        headerName: 'Product Details',
        children: [
          {
            field: 'images',
            headerName: '',
            width: 60,
            pinned: 'left',
            cellRenderer: ImageCellRendererComponent,
            valueGetter: (params: any) => params.data.images?.[0] || null,
            filter: false,
            sortable: false,
            suppressMenu: true,
            cellClass: 'cell-flex-center'
          },
          {
            field: 'name',
            headerName: 'Product Name',
            pinned: 'left',
            flex: 1.5,
            minWidth: 220,
            filter: 'agTextColumnFilter',
            cellConfig: { type: 'text', placeholder: 'Product Name' },
            cellClass: 'font-semibold text-primary cell-flex-center'
          },
          {
            field: 'sku',
            headerName: 'SKU',
            width: 130,
            pinned: 'left',
            cellClass: 'font-mono text-secondary text-xs cell-flex-center'
          }
        ]
      },

      // ═══════════════════════════════════════════════════════
      // GROUP 2 — CLASSIFICATION
      // ═══════════════════════════════════════════════════════
      {
        headerName: 'Classification',
        children: [
          {
            field: 'brandId.name',
            headerName: 'Brand',
            width: 120,
            filter: 'agSetColumnFilter',
            cellConfig: { type: 'select', options: [{ label: 'Apple', value: 'Apple' }, { label: 'Samsung', value: 'Samsung' }] },
            cellClass: 'text-secondary cell-flex-center'
          },
          {
            field: 'categoryId.name',
            headerName: 'Category',
            width: 130,
            filter: 'agSetColumnFilter',
            cellClass: 'text-secondary cell-flex-center'
          },
          {
            field: 'subCategoryId.name',
            headerName: 'Sub-Category',
            width: 130,
            hide: true,
            cellClass: 'text-secondary cell-flex-center'
          }
        ]
      },

      // ═══════════════════════════════════════════════════════
      // GROUP 3 — PRICING & MARGINS
      // ═══════════════════════════════════════════════════════
      {
        headerName: 'Pricing',
        children: [
          {
            field: 'purchasePrice',
            headerName: 'Buy Price',
            width: 110,
            type: 'rightAligned',
            valueFormatter: this.currencyFormatter,
            cellConfig: { type: 'number', min: 0 },
            cellClass: 'font-mono text-secondary text-sm cell-flex-end'
          },
          {
            field: 'sellingPrice',
            headerName: 'Sell Price',
            width: 110,
            type: 'rightAligned',
            valueFormatter: this.currencyFormatter,
            cellConfig: { type: 'number', min: 0 },
            cellClass: 'font-mono font-bold text-primary text-sm cell-flex-end'
          },
          {
            headerName: 'Margin',
            width: 100,
            type: 'rightAligned',
            valueGetter: (params: any) => {
              const buy = params.data.purchasePrice || 0;
              const sell = params.data.sellingPrice || 0;
              if (sell === 0) return 0;
              return ((sell - buy) / sell) * 100;
            },
            cellClass: 'cell-flex-end',
            cellRenderer: (params: any) => {
              const val = params.value || 0;
              if (val === 0) return `<span class="text-tertiary">—</span>`;

              const colorClass = val > 20 ? 'text-success' : val < 10 ? 'text-error' : 'text-warning';
              const icon = val > 20 ? 'pi-arrow-up-right' : val < 10 ? 'pi-arrow-down-right' : 'pi-minus';

              return `
                <div class="cell-flex-center gap-xs ${colorClass}">
                  <span class="font-mono font-bold text-xs">${val.toFixed(1)}%</span>
                  <i class="pi ${icon} icon-xxs"></i>
                </div>`;
            }
          },
          {
            field: 'taxRate',
            headerName: 'Tax %',
            width: 90,
            type: 'rightAligned',
            cellConfig: { type: 'number', max: 100 },
            cellClass: 'font-mono text-tertiary text-xs cell-flex-end',
            valueFormatter: (params: any) => params.value ? `${params.value}%` : '-'
          }
        ]
      },

      // ═══════════════════════════════════════════════════════
      // GROUP 4 — INVENTORY & STATUS
      // ═══════════════════════════════════════════════════════
      {
        headerName: 'Inventory & Status',
        children: [
          {
            headerName: 'Total Stock',
            width: 120,
            type: 'rightAligned',
            valueGetter: (params: any) => {
              if (!params.data.inventory || !Array.isArray(params.data.inventory)) return 0;
              return params.data.inventory.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
            },
            cellClass: 'cell-flex-end',
            cellRenderer: (params: any) => {
              const stock = params.value;
              // Check against the first branch's reorder level, default to 10 if missing
              const reorderLevel = params.data.inventory?.[0]?.reorderLevel || 10;
              const isLowStock = stock <= reorderLevel;

              if (isLowStock) {
                return `
                  <div class="cell-flex-center gap-xs">
                    <span class="font-mono font-bold text-error">${stock}</span>
                    <i class="pi pi-exclamation-triangle text-error icon-xs" title="Low Stock Warning"></i>
                  </div>`;
              }
              return `<span class="font-mono font-semibold text-primary">${stock}</span>`;
            }
          },
          {
            field: 'unitId.code',
            headerName: 'Unit',
            width: 80,
            cellClass: 'text-tertiary text-xs cell-flex-center font-bold uppercase'
          },
          {
            field: 'defaultSupplierId.companyName',
            headerName: 'Supplier',
            width: 160,
            tooltipField: 'defaultSupplierId.contactPerson',
            cellClass: 'text-secondary cell-flex-center ellipsis'
          },
          {
            field: 'isActive',
            headerName: 'Active',
            width: 105,
            cellClass: 'cell-flex-center',
            cellConfig: { type: 'boolean' },
            cellRenderer: (params: any) => {
              return params.value
                ? `<span class="grid-badge badge-success-solid">Active</span>`
                : `<span class="grid-badge badge-neutral">Inactive</span>`;
            }
          },
          {
            field: 'updatedAt',
            headerName: 'Last Updated',
            width: 140,
            hide: true,
            cellClass: 'text-secondary text-xs cell-flex-center',
            valueFormatter: (params: any) => {
              return params.value ? new Date(params.value).toLocaleDateString() : '-';
            },
            cellConfig: { type: 'date' }
          }
        ]
      }
    ];

    this.cdr.detectChanges();
  }

  // getColumn(): void {
  //   this.column = [
  //     {
  //       field: 'images',
  //       headerName: '',
  //       width: 60,
  //       pinned: 'left',
  //       cellRenderer: ImageCellRendererComponent,
  //       valueGetter: (params: any) => params.data.images?.[0] || null,
  //       filter: false,
  //       sortable: false,
  //       suppressMenu: true
  //     },
  //     {
  //       field: 'name',
  //       headerName: 'Product Name',
  //       pinned: 'left',
  //       flex: 1.5,
  //       minWidth: 220,
  //       filter: 'agTextColumnFilter',
  //       cellConfig: { type: 'text', placeholder: 'Product Name' },
  //       cellStyle: { 'font-weight': '600', 'color': 'var(--text-primary)' }
  //     },
  //     {
  //       field: 'sku',
  //       headerName: 'SKU',
  //       width: 120,
  //       pinned: 'left',
  //       cellStyle: { 'font-family': 'var(--font-mono)', 'font-size': '12px' }
  //     },

  //     {
  //       field: 'brandId.name',
  //       headerName: 'Brand',
  //       width: 130,
  //       filter: 'agSetColumnFilter',
  //       cellConfig: { type: 'select', options: [{ label: 'Apple', value: 'Apple' }, { label: 'Samsung', value: 'Samsung' }] }
  //     },
  //     {
  //       field: 'categoryId.name',
  //       headerName: 'Category',
  //       width: 130,
  //       filter: 'agSetColumnFilter'
  //     },
  //     {
  //       field: 'subCategoryId.name',
  //       headerName: 'Sub-Category',
  //       width: 130,
  //       hide: true
  //     },

  //     {
  //       field: 'purchasePrice',
  //       headerName: 'Buy Price',
  //       width: 110,
  //       type: 'numericColumn',
  //       valueFormatter: this.currencyFormatter,
  //       cellConfig: { type: 'number', min: 0 }
  //     },
  //     {
  //       field: 'sellingPrice',
  //       headerName: 'Sell Price',
  //       width: 110,
  //       type: 'numericColumn',
  //       valueFormatter: this.currencyFormatter,
  //       cellConfig: { type: 'number', min: 0 },
  //       cellStyle: { 'color': 'var(--text-primary)', 'font-weight': '600' }
  //     },
  //     {
  //       headerName: 'Margin',
  //       width: 100,
  //       valueGetter: (params: any) => {
  //         const buy = params.data.purchasePrice || 0;
  //         const sell = params.data.sellingPrice || 0;
  //         if (sell === 0) return 0;
  //         return ((sell - buy) / sell) * 100;
  //       },
  //       valueFormatter: (params: any) => params.value ? `${params.value.toFixed(1)}%` : '-',
  //       cellStyle: (params: any) => {
  //         if (params.value > 20) return { color: 'var(--color-success)' };
  //         if (params.value < 10) return { color: 'var(--color-error)' };
  //         return { color: 'var(--color-warning)' };
  //       }
  //     },
  //     {
  //       field: 'taxRate',
  //       headerName: 'Tax %',
  //       width: 90,
  //       type: 'numericColumn',
  //       cellConfig: { type: 'number', max: 100 }
  //     },

  //     {
  //       headerName: 'Total Stock',
  //       width: 110,
  //       type: 'numericColumn',
  //       valueGetter: (params: any) => {
  //         if (!params.data.inventory || !Array.isArray(params.data.inventory)) return 0;
  //         return params.data.inventory.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  //       },
  //       cellClass: (params: any) => {
  //         return params.value <= 10 ? 'text-danger font-bold' : '';
  //       }
  //     },
  //     {
  //       field: 'unitId.code',
  //       headerName: 'Unit',
  //       width: 80,
  //       cellClass: 'text-muted text-xs'
  //     },

  //     {
  //       field: 'defaultSupplierId.companyName',
  //       headerName: 'Supplier',
  //       width: 160,
  //       tooltipField: 'defaultSupplierId.contactPerson'
  //     },

  //     {
  //       field: 'isActive',
  //       headerName: 'Active',
  //       width: 100,
  //       cellClass: 'flex-center',
  //       cellConfig: { type: 'boolean' },
  //       cellRenderer: (params: any) => {
  //         return params.value
  //           ? `<span class="badge badge-success">Active</span>`
  //           : `<span class="badge badge-danger">Inactive</span>`;
  //       }
  //     },
  //     {
  //       field: 'updatedAt',
  //       headerName: 'Last Updated',
  //       width: 140,
  //       hide: true,
  //       valueFormatter: (params: any) => {
  //         return params.value ? new Date(params.value).toLocaleDateString() : '-';
  //       },
  //       cellConfig: { type: 'date' }
  //     }
  //   ];

  //   this.cdr.detectChanges();
  // }

  currencyFormatter(params: any) {
    if (params.value === null || params.value === undefined) return '-';
    return '₹ ' + params.value.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

}
