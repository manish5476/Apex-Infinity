import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
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
    AgShareGrid
  ],
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

  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 50;

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
      // Load master data logic here if needed
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
    this.productService.getAllProducts(filterParams).subscribe(
      (res: any) => {
        let newData: any[] = [];
        if (res.data && Array.isArray(res.data.data)) {
          newData = res.data.data;
        }
        this.totalCount = res.results || this.totalCount;
        this.data = [...this.data, ...newData];
        if (this.gridApi && !isReset) {
          this.gridApi.applyTransaction({ add: newData });
        }
        this.currentPage++;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      (err: any) => {
        this.isLoading = false;
        this.messageService.showError('Error', 'Failed to fetch products.');
      }
    );
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
    if (event.type === 'cellClicked' && event.field === 'name') {
      const productId = event.row._id;
      if (productId) {
        this.router.navigate([productId], { relativeTo: this.route });
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event)
    }
  }

  getColumn(): void {
    this.column = [
      // 1. IMAGE & IDENTITY
      {
        field: 'images',
        headerName: '',
        width: 60,
        pinned: 'left',
        cellRenderer: ImageCellRendererComponent,
        valueGetter: (params: any) => params.data.images?.[0] || null,
        filter: false,
        sortable: false,
        suppressMenu: true
      },
      {
        field: 'name',
        headerName: 'Product Name',
        pinned: 'left',
        flex: 1.5,
        minWidth: 220,
        filter: 'agTextColumnFilter',
        // Enable Text Editing
        cellConfig: { type: 'text', placeholder: 'Product Name' },
        cellStyle: {
          'font-weight': '600',
          'color': 'var(--text-primary)'
        }
      },
      {
        field: 'sku',
        headerName: 'SKU',
        width: 120,
        pinned: 'left',
        cellStyle: { 'font-family': 'var(--font-mono)', 'font-size': '12px' }
      },

      // 2. CLASSIFICATION (Dropdown Editors)
      {
        field: 'brandId.name',
        headerName: 'Brand',
        width: 130,
        filter: 'agSetColumnFilter',
        // Example: Using Select editor (You would populate options dynamically in real app)
        cellConfig: {
          type: 'select',
          options: [{ label: 'Apple', value: 'Apple' }, { label: 'Samsung', value: 'Samsung' }]
        }
      },
      {
        field: 'categoryId.name',
        headerName: 'Category',
        width: 130,
        filter: 'agSetColumnFilter'
      },
      {
        field: 'subCategoryId.name',
        headerName: 'Sub-Category',
        width: 130,
        hide: true // Hidden by default, user can enable
      },

      // 3. PRICING & FINANCIALS (Numeric Editors)
      {
        field: 'purchasePrice',
        headerName: 'Buy Price',
        width: 110,
        type: 'numericColumn',
        valueFormatter: this.currencyFormatter,
        cellConfig: { type: 'number', min: 0 }
      },
      {
        field: 'sellingPrice',
        headerName: 'Sell Price',
        width: 110,
        type: 'numericColumn',
        valueFormatter: this.currencyFormatter,
        cellConfig: { type: 'number', min: 0 },
        cellStyle: { 'color': 'var(--text-primary)', 'font-weight': '600' }
      },
      {
        headerName: 'Margin',
        width: 100,
        // Calculated Column: (Sell - Buy) / Sell %
        valueGetter: (params: any) => {
          const buy = params.data.purchasePrice || 0;
          const sell = params.data.sellingPrice || 0;
          if (sell === 0) return 0;
          return ((sell - buy) / sell) * 100;
        },
        valueFormatter: (params: any) => params.value ? `${params.value.toFixed(1)}%` : '-',
        cellStyle: (params: any) => {
          if (params.value > 20) return { color: 'var(--color-success)' };
          if (params.value < 10) return { color: 'var(--color-error)' };
          return { color: 'var(--color-warning)' };
        }
      },
      {
        field: 'taxRate',
        headerName: 'Tax %',
        width: 90,
        type: 'numericColumn',
        cellConfig: { type: 'number', max: 100 }
      },

      // 4. INVENTORY & UNIT
      {
        headerName: 'Total Stock',
        width: 110,
        type: 'numericColumn',
        // Aggregate inventory array: Sum of all branch quantities
        valueGetter: (params: any) => {
          if (!params.data.inventory || !Array.isArray(params.data.inventory)) return 0;
          return params.data.inventory.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        },
        cellClass: (params: any) => {
          return params.value <= 10 ? 'text-danger font-bold' : '';
        }
      },
      {
        field: 'unitId.code',
        headerName: 'Unit',
        width: 80,
        cellClass: 'text-muted text-xs'
      },

      // 5. SUPPLIER & LOGISTICS
      {
        field: 'defaultSupplierId.companyName',
        headerName: 'Supplier',
        width: 160,
        tooltipField: 'defaultSupplierId.contactPerson'
      },

      // 6. STATUS & AUDIT
      {
        field: 'isActive',
        headerName: 'Active',
        width: 100,
        cellClass: 'flex-center',
        // Boolean Switch Editor
        cellConfig: { type: 'boolean' },
        cellRenderer: (params: any) => {
          return params.value
            ? `<span class="badge badge-success">Active</span>`
            : `<span class="badge badge-danger">Inactive</span>`;
        }
      },
      {
        field: 'updatedAt',
        headerName: 'Last Updated',
        width: 140,
        hide: true, // Optional
        valueFormatter: (params: any) => {
          return params.value ? new Date(params.value).toLocaleDateString() : '-';
        },
        cellConfig: { type: 'date' }
      }
    ];

    this.cdr.detectChanges();
  }

  // Helper for Currency
  currencyFormatter(params: any) {
    if (params.value === null || params.value === undefined) return '-';
    return '₹ ' + params.value.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

}
