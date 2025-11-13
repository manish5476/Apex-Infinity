import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router'; // Import RouterModule

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { SharedGridComponent } from '../../../shared/AgGrid/grid/shared-grid/shared-grid.component';
import { ProductService } from '../../services/product-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { ImageCellRendererComponent } from '../../../shared/AgGrid/AgGridcomponents/image-cell-renderer/image-cell-renderer.component';


@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    SharedGridComponent,
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    RouterModule // Add RouterModule
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductListComponent implements OnInit {
  // --- Injected Services ---
  private cdr = inject(ChangeDetectorRef);
  private productService = inject(ProductService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // --- Grid & Data ---
  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 20;
  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';

  // --- Master Data Signals ---
  brandOptions = signal<any[]>([]);
  categoryOptions = signal<any[]>([]);

  // --- Filters ---
  productFilter = {
    name: '',
    sku: '',
    brand: null,
    category: null,
  };

  constructor() {
    effect(() => {
      // Example: this.brandOptions.set(this.masterList.brands());
      // Example: this.categoryOptions.set(this.masterList.categories());
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
    this.productFilter = {
      name: '',
      sku: '',
      brand: null,
      category: null,
    };
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

        if (this.gridApi) {
          if (isReset) {
            // this.gridApi.setRowData(this.data);
          } else {
            this.gridApi.applyTransaction({ add: newData });
          }
        }

        this.currentPage++;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      (err: any) => {
        this.isLoading = false;
        this.messageService.showError('Error', 'Failed to fetch products.');
        console.error('❌ Error fetching products:', err);
      }
    );
  }

  onScrolledToBottom(_: any) {
    if (!this.isLoading && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  eventFromGrid(event: any) {
    if (event.eventType === 'onRowClicked') {
      const productId = event.event.data._id;
      if (productId) {
        // Assuming parent route is '/products'
        this.router.navigate([productId], { relativeTo: this.route });
      }
    }
  }

  getColumn(): void {
    this.column = [
      {
        field: 'images',
        headerName: 'Image',
        cellRenderer: ImageCellRendererComponent,
        valueGetter: (params: any) => params.data.images?.[0], // Show first image
        width: 100,
        filter: false,
        sortable: false,
      },
      {
        field: 'name',
        headerName: 'Name',
        sortable: true,
        filter: true,
        resizable: true,
        cellStyle: {
          'color': 'var(--accent-primary)',
          'font-weight': '600',
          'cursor': 'pointer'
        }
      },
      {
        field: 'sku',
        headerName: 'SKU',
        sortable: true,
        filter: true,
        resizable: true,
      },
      {
        field: 'brand',
        headerName: 'Brand',
        sortable: true,
        filter: true,
        resizable: true,
      },
      {
        field: 'category',
        headerName: 'Category',
        sortable: true,
        filter: true,
        resizable: true,
      },
      {
        field: 'sellingPrice',
        headerName: 'Selling Price',
        sortable: true,
        filter: 'agNumberColumnFilter',
        resizable: true,
        valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
      },
      {
        field: 'totalStock', // Uses the Mongoose Virtual
        headerName: 'Total Stock',
        sortable: true,
        filter: 'agNumberColumnFilter',
        resizable: true,
        // CORRECTED: Using theme-aware cellClass
        cellClass: (params: any) => {
          if (params.value <= 10) { // Assuming reorder level
            return 'cell-status status-low-stock';
          }
          return '';
        }
      },
      {
        field: 'isActive',
        headerName: 'Status',
        sortable: true,
        filter: true,
        resizable: true,
        valueFormatter: (params: any) => params.value ? 'Active' : 'Inactive',
        // CORRECTED: Using theme-aware cellClass
        cellClass: (params: any) => {
          return params.value ? 'cell-status status-active' : 'cell-status status-inactive';
        },
      },
    ];
    this.cdr.detectChanges();
  }
}