import { ChangeDetectorRef, Component, OnInit, effect, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { GridApi, GridReadyEvent } from 'ag-grid-community';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { AppMessageService } from '../../../core/services/message.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { SharedGridComponent } from '../../shared/AgGrid/grid/shared-grid/shared-grid.component';
import { SalesService } from '../sales-service';



@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    CommonModule,
    SharedGridComponent,
    SelectModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    RouterModule,
    TooltipModule
  ],
  templateUrl: './sales-list.html',
  styleUrl: './sales-list.scss',
})
export class SalesListComponent implements OnInit {
  // --- Injected Services ---
  private cdr = inject(ChangeDetectorRef);
  private salesService = inject(SalesService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public common = inject(CommonMethodService);

  // --- Grid & Data ---
  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 50;
  
  data: any[] = [];
  column: any = [];
  rowSelectionMode: 'single' | 'multiple' = 'single';

  // --- Search Signal ---
  searchControl = new FormControl('');
  searchQuery = toSignal(this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()), { initialValue: '' });

  // --- Computed (Fixes TS Error) ---
  // We use the Search API param instead of client-side filtering for large datasets usually,
  // but here is the client-side computed logic fixed:
  filteredData = computed(() => {
    const query = (this.searchQuery() ?? '').toLowerCase(); // Fix: Null check
    const rows = this.data;
    if (!query) return rows;

    return rows.filter(s => 
      s.invoiceNumber?.toLowerCase().includes(query) ||
      s.customerId?.name?.toLowerCase().includes(query)
    );
  });

  // --- Filters ---
  salesFilter = {
    status: null,
    paymentStatus: null,
    dateRange: null
  };

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Returned', value: 'returned' }
  ];

  paymentStatusOptions = [
    { label: 'Paid', value: 'paid' },
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Partial', value: 'partial' }
  ];

  constructor() {
    // Effects if needed
  }

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.searchControl.setValue('');
    this.salesFilter = {
      status: null,
      paymentStatus: null,
      dateRange: null
    };
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (this.isLoading && !isReset) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
      if (this.gridApi) {
        // Optional: clear grid if needed
      }
    }

    // Combine Search Input with Dropdown Filters
    const filterParams = {
      ...this.salesFilter,
      search: this.searchControl.value,
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.salesService.getAllSales(filterParams).subscribe({
      next: (res: any) => {
        let newData: any[] = [];
        if (res.success && Array.isArray(res.rows)) {
          newData = res.rows;
        }

        this.totalCount = res.total || this.totalCount;
        
        if (isReset) {
          this.data = newData;
        } else {
          this.data = [...this.data, ...newData];
        }

        // Update Grid
        // if (this.gridApi) {
        //   if (isReset) {
        //     this.gridApi.setRowData(this.data);
        //   } else {
        //     this.gridApi.applyTransaction({ add: newData });
        //   }
        // }

        this.currentPage++;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.messageService.showError('Error', 'Failed to fetch sales.');
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
    if (event.eventType === 'RowSelectedEvent') {
      const invoiceId = event.event.data.invoiceId?._id || event.event.data.invoiceId;
      if (invoiceId) {
        // Redirect to Invoice Details as Sales is usually a view of Invoice
        this.router.navigate(['/invoices', invoiceId]);
      }
    }
  }

  getColumn(): void {
    this.column = [
      {
        field: 'createdAt',
        headerName: 'Date',
        sortable: true,
        filter: true,
        width: 120,
        valueFormatter: (params: any) => this.common.formatDate(params.value),
        cellStyle: { 'color': 'var(--text-secondary)' }
      },
      {
        field: 'invoiceNumber',
        headerName: 'Invoice #',
        sortable: true,
        filter: true,
        width: 180,
        cellStyle: { 'font-weight': '600', 'color': 'var(--accent-primary)', 'cursor': 'pointer' }
      },
      {
        field: 'customerId.name', // AG Grid supports dot notation
        headerName: 'Customer',
        sortable: true,
        filter: true,
        resizable: true,
        width: 200,
        valueGetter: (params: any) => params.data.customerId?.name || 'Walk-in Customer'
      },
      {
        field: 'items',
        headerName: 'Items',
        width: 100,
        valueGetter: (params: any) => params.data.items?.length || 0,
        type: 'rightAligned'
      },
      {
        field: 'totalAmount',
        headerName: 'Total',
        sortable: true,
        filter: 'agNumberColumnFilter',
        width: 140,
        type: 'rightAligned',
        valueFormatter: (params: any) => `₹ ${params.value?.toFixed(2)}`,
        cellStyle: { 'font-weight': 'bold' }
      },
      {
        field: 'dueAmount',
        headerName: 'Due',
        sortable: true,
        width: 140,
        type: 'rightAligned',
        valueFormatter: (params: any) => `₹ ${params.value?.toFixed(2)}`,
        cellStyle: (params: any) => params.value > 0 ? {'color': 'var(--color-error)'} : {'color': 'var(--color-success)'}
      },
      {
        field: 'paymentStatus',
        headerName: 'Payment',
        sortable: true,
        width: 130,
        cellClass: (params: any) => {
          const status = params.value?.toLowerCase();
          if (status === 'paid') return 'cell-status status-in-stock'; // Reuse green style
          if (status === 'partial') return 'cell-status status-low-stock'; // Reuse orange style
          return 'cell-status status-inactive'; // Red
        },
        valueFormatter: (params: any) => (params.value || '').toUpperCase()
      }
    ];
    this.cdr.detectChanges();
  }
  
  onCreateSales() {
     this.router.navigate(['/invoices/create']); // Direct to invoice creation
  }
}

// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-sales-list',
// //   imports: [],
// //   templateUrl: './sales-list.html',
// //   styleUrl: './sales-list.scss',
// // })
// // export class SalesList {

// // }
// import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, Router } from '@angular/router';
// import { FormControl, ReactiveFormsModule } from '@angular/forms';
// import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
// import { toSignal } from '@angular/core/rxjs-interop';

// // Services


// // PrimeNG
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { TagModule } from 'primeng/tag';
// import { TooltipModule } from 'primeng/tooltip';
// import { SkeletonModule } from 'primeng/skeleton';
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';
// import { MenuModule } from 'primeng/menu';
// import { PaginatorModule } from 'primeng/paginator';
// import { AppMessageService } from '../../../core/services/message.service';
// import { CommonMethodService } from '../../../core/utils/common-method.service';
// import { SalesService } from '../sales-service';

// @Component({
//   selector: 'app-sales-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ReactiveFormsModule,
//     TableModule,
//     ButtonModule,
//     InputTextModule,
//     TagModule,
//     TooltipModule,
//     SkeletonModule,
//     IconFieldModule,
//     InputIconModule,
//     MenuModule,
//     PaginatorModule
//   ],
//   providers: [SalesService],
//   templateUrl: './sales-list.html',
//   styleUrls: ['./sales-list.scss']
// })
// export class SalesListComponent implements OnInit {
//   // --- Dependencies ---
//   private salesService = inject(SalesService);
//   private messageService = inject(AppMessageService);
//   private router = inject(Router);
//   public common = inject(CommonMethodService);

//   // --- State Signals ---
//   salesData = signal<any[]>([]);
//   totalRecords = signal(0);
//   isLoading = signal(true);
  
//   // Pagination & Filters
//   page = signal(1);
//   limit = signal(50);
//   searchControl = new FormControl('');
//   searchQuery = toSignal(this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()), { initialValue: '' });

//   // --- Computed Stats ---
//   totalRevenue = computed(() => this.salesData().reduce((acc, row) => acc + (row.totalAmount || 0), 0));
//   totalDue = computed(() => this.salesData().reduce((acc, row) => acc + (row.dueAmount || 0), 0));
//   filteredSales = computed(() => {
//     const query = this.searchQuery().toLowerCase();
//     const data = this.salesData();
//     if (!query) return data;

//     return data.filter(s => 
//       s.invoiceNumber?.toLowerCase().includes(query) ||
//       s.customerId?.name?.toLowerCase().includes(query)
//     );
//   });

//   constructor() {
//     // Reload when pagination changes
//     effect(() => {
//       this.loadSales(this.page(), this.limit());
//     });
//   }

//   ngOnInit(): void {
//     // Initial load triggered by effect
//   }

//   loadSales(page: number, limit: number) {
//     this.isLoading.set(true);
    
//     // Backend expects query params
//     const params = {
//       page,
//       limit,
//       // If your backend supports search via a 'q' or 'search' param, add it here:
//       // search: this.searchQuery() 
//     };

//     this.salesService.getAllSales(params).subscribe({
//       next: (res: any) => {
//         if (res.success) {
//           this.salesData.set(res.rows || []);
//           this.totalRecords.set(res.total || 0);
//         }
//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         this.messageService.showError('Error', 'Failed to load sales records');
//         this.isLoading.set(false);
//       }
//     });
//   }

//   onPageChange(event: any) {
//     // PrimeNG Paginator uses index (0-based), API uses page (1-based) often
//     this.page.set(event.page + 1); 
//     this.limit.set(event.rows);
//   }

//   // --- Actions ---
//   viewSale(id: string) {
//     // this.router.navigate(['/sales', id]); 
//     // Since sales are tightly coupled with invoices in your model:
//     console.log('View Sales ID:', id);
//   }

//   // If you want to navigate to the related invoice
//   viewInvoice(invoiceId: any) {
//     const id = typeof invoiceId === 'object' ? invoiceId._id : invoiceId;
//     if(id) this.router.navigate(['/invoices', id]);
//   }

//   onCreateSales() {
//     // Navigate to a sales creation flow if separate from invoice
//     // this.router.navigate(['/sales/create']);
//     this.messageService.showInfo('Info', 'Create Sales via Invoice module');
//   }

//   // --- Helpers ---
//   getPaymentSeverity(status: string): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" | undefined {
//     switch (status?.toLowerCase()) {
//       case 'paid': return 'success';
//       case 'partial': return 'warning';
//       case 'unpaid': return 'danger';
//       case 'refunded': return 'info';
//       default: return 'secondary';
//     }
//   }
// }