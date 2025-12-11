import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker'; // ✅ NEW
import { ToastModule } from 'primeng/toast';

// Services & Components
import { SharedGridComponent } from '../../../shared/AgGrid/grid/shared-grid/shared-grid.component';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { InvoiceService } from '../../services/invoice-service';
import { CommonMethodService } from '../../../../core/utils/common-method.service'; // ✅ NEW

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    SharedGridComponent,
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    RouterModule,
    ToastModule,
    DatePickerModule // ✅ NEW
  ],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss',
})
export class InvoiceListComponent implements OnInit {
  // --- Injected Services ---
  private cdr = inject(ChangeDetectorRef);
  private invoiceService = inject(InvoiceService);
  private messageService = inject(AppMessageService);
  public masterList = inject(MasterListService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private common = inject(CommonMethodService); // ✅ Used for downloadBlob

  // --- Grid & Data ---
  private gridApi!: GridApi;
  private currentPage = 1;
  private pageSize = 20;
  isLoading = false;
  isExporting = false; // ✅ Loader for export button
  totalCount = 0;
  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';

  // --- Master List Signals ---
  customerOptions = signal<any[]>([]);

  // --- Options ---
  statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Issued', value: 'issued' },
    { label: 'Paid', value: 'paid' },
    { label: 'Cancelled', value: 'cancelled' },
  ];
  
  paymentStatusOptions = [
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Partial', value: 'partial' },
    { label: 'Paid', value: 'paid' },
  ];

  // --- Filters ---
  invoiceFilter = {
    invoiceNumber: '',
    customerId: null,
    status: null,
    paymentStatus: null,
  };
  
  // ✅ Date Range State
  dateRange: Date[] | undefined;

  constructor() {
    effect(() => {
      this.customerOptions.set(this.masterList.customers());
    });
  }

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  // --- Actions ---

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.invoiceFilter = {
      invoiceNumber: '',
      customerId: null,
      status: null,
      paymentStatus: null,
    };
    this.dateRange = undefined; // ✅ Reset Date
    this.getData(true);
  }

  /**
   * ✅ EXPORT FUNCTIONALITY
   * Gathers all current filters + dates and triggers download
   */
  exportReport() {
    if (this.isExporting) return;
    this.isExporting = true;

    // 1. Prepare Params
    const params: any = { ...this.invoiceFilter, format: 'csv' };
    
    // Add Dates if selected
    if (this.dateRange && this.dateRange[0]) {
      params.start = this.dateRange[0].toISOString();
    }
    if (this.dateRange && this.dateRange[1]) {
      params.end = this.dateRange[1].toISOString();
    }

    // 2. Call API
    this.invoiceService.exportInvoices(params)
      .pipe(finalize(() => this.isExporting = false))
      .subscribe({
        next: (blob) => {
          const filename = `Invoices_Export_${new Date().toISOString().slice(0, 10)}.csv`;
          this.common.downloadBlob(blob, filename);
        },
        error: (err) => this.messageService.showError('Export Failed', 'Could not download report.')
      });
  }

  getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    // Mix standard filters with Date Range
    const filterParams: any = {
      ...this.invoiceFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    if (this.dateRange && this.dateRange[0]) {
      filterParams.start = this.dateRange[0].toISOString();
    }
    if (this.dateRange && this.dateRange[1]) {
      filterParams.end = this.dateRange[1].toISOString();
    }

    this.invoiceService.getAllInvoices(filterParams).subscribe({
      next: (res: any) => {
        let newData: any[] = [];
        if (res.data && Array.isArray(res.data.data)) {
          newData = res.data.data;
        }

        this.totalCount = res.results || this.totalCount;
        this.data = [...this.data, ...newData];

        this.currentPage++;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.messageService.showError('Error', 'Failed to fetch invoices.');
      }
    });
  }

  // ... (Keep existing onScrolledToBottom, onGridReady, eventFromGrid) ...
  onScrolledToBottom(_: any) {
    if (!this.isLoading && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  eventFromGrid(event: any) {
    if (event.eventType === 'RowSelectedEvent') {
      const invoiceId = event.event.data._id;
      if (invoiceId) {
        this.router.navigate([invoiceId], { relativeTo: this.route });
      }
    }
  }

  getColumn(): void {
    this.column = [
      {
        field: 'invoiceNumber',
        headerName: 'Number',
        sortable: true,
        filter: true,
        resizable: true,
        cellStyle: { 'color': 'var(--accent-primary)', 'font-weight': '600', 'cursor': 'pointer' }
      },
      {
        field: 'customer.name',
        headerName: 'Customer',
        sortable: true,
        filter: true,
        resizable: true,
        valueGetter: (params: any) => params.data.customer?.name || 'N/A',
      },
      {
        field: 'status',
        headerName: 'Status',
        sortable: true,
        resizable: true,
        cellClass: (params: any) => params.value ? `cell-status status-${params.value}` : ''
      },
      {
        field: 'paymentStatus',
        headerName: 'Payment',
        sortable: true,
        resizable: true,
        cellClass: (params: any) => params.value ? `cell-status status-${params.value}` : ''
      },
      {
        field: 'invoiceDate',
        headerName: 'Date',
        sortable: true,
        resizable: true,
        valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
      },
      {
        field: 'dueDate',
        headerName: 'Due Date',
        sortable: true,
        resizable: true,
        valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
      },
      {
        field: 'grandTotal',
        headerName: 'Total',
        sortable: true,
        resizable: true,
        type: 'rightAligned',
        valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
      },
      {
        field: 'balanceAmount',
        headerName: 'Balance',
        sortable: true,
        resizable: true,
        type: 'rightAligned',
        valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
      },
    ];
    this.cdr.detectChanges();
  }
}
// import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { GridApi, GridReadyEvent } from 'ag-grid-community';
// import { FormsModule } from '@angular/forms';
// import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { SharedGridComponent } from '../../../shared/AgGrid/grid/shared-grid/shared-grid.component';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { InvoiceService } from '../../services/invoice-service';
// import { Toast } from "primeng/toast";

// // Shared Components & Services
// @Component({
//   selector: 'app-invoice-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     SharedGridComponent,
//     SelectModule,
//     FormsModule,
//     ButtonModule,
//     InputTextModule,
//     RouterModule,
//     Toast
// ],
//   templateUrl: './invoice-list.html',
//   styleUrl: './invoice-list.scss',
// })
// export class InvoiceListComponent implements OnInit {
//   // --- Injected Services ---
//   private cdr = inject(ChangeDetectorRef);
//   private invoiceService = inject(InvoiceService);
//   private messageService = inject(AppMessageService);
//   public masterList = inject(MasterListService); // Made public for template
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);

//   // --- Grid & Data ---
//   private gridApi!: GridApi;
//   private currentPage = 1;
//   private isLoading = false;
//   private totalCount = 0;
//   private pageSize = 20;
//   data: any[] = [];
//   column: any = [];
//   rowSelectionMode: any = 'single';

//   // --- Master List Signals ---
//   customerOptions = signal<any[]>([]);

//   // --- Enums for Filters ---
//   statusOptions = [
//     { label: 'Draft', value: 'draft' },
//     { label: 'Issued', value: 'issued' },
//     { label: 'Paid', value: 'paid' },
//     { label: 'Cancelled', value: 'cancelled' },
//   ];
  
//   paymentStatusOptions = [
//     { label: 'Unpaid', value: 'unpaid' },
//     { label: 'Partial', value: 'partial' },
//     { label: 'Paid', value: 'paid' },
//   ];

//   // --- Filters ---
//   invoiceFilter = {
//     invoiceNumber: '',
//     customerId: null,
//     status: null,
//     paymentStatus: null,
//   };

//   constructor() {
//     effect(() => {
//       this.customerOptions.set(this.masterList.customers());
//     });
//   }

//   ngOnInit(): void {
//     this.getColumn();
//     this.getData(true);
//   }

//   applyFilters() {
//     this.getData(true);
//   }

//   resetFilters() {
//     this.invoiceFilter = {
//       invoiceNumber: '',
//       customerId: null,
//       status: null,
//       paymentStatus: null,
//     };
//     this.getData(true);
//   }

//   getData(isReset: boolean = false) {
//     if (this.isLoading) return;
//     this.isLoading = true;

//     if (isReset) {
//       this.currentPage = 1;
//       this.data = [];
//       this.totalCount = 0;
//     }

//     const filterParams = {
//       ...this.invoiceFilter,
//       page: this.currentPage,
//       limit: this.pageSize,
//     };

//     this.invoiceService.getAllInvoices(filterParams).subscribe({
//       next: (res: any) => {
//         let newData: any[] = [];
//         if (res.data && Array.isArray(res.data.data)) {
//           newData = res.data.data;
//         }

//         this.totalCount = res.results || this.totalCount;
//         this.data = [...this.data, ...newData];

//         if (this.gridApi) {
//           // if (isReset) this.gridApi.setRowData(this.data);
//           // else this.gridApi.applyTransaction({ add: newData });
//         }

//         this.currentPage++;
//         this.isLoading = false;
//         this.cdr.markForCheck();
//       },
//       error: (err: any) => {
//         this.isLoading = false;
//         this.messageService.showError('Error', 'Failed to fetch invoices.');
//       }
//     });
//   }

//   onScrolledToBottom(_: any) {
//     if (!this.isLoading && this.data.length < this.totalCount) {
//       this.getData(false);
//     }
//   }

//   onGridReady(params: GridReadyEvent) {
//     this.gridApi = params.api;
//   }

//   eventFromGrid(event: any) {
//     if (event.eventType === 'RowSelectedEvent') {
//       const invoiceId = event.event.data._id;
//       if (invoiceId) {
//         this.router.navigate([invoiceId], { relativeTo: this.route });
//       }
//     }
//   }

//   getColumn(): void {
//     this.column = [
//       {
//         field: 'invoiceNumber',
//         headerName: 'Number',
//         sortable: true,
//         filter: true,
//         resizable: true,
//         cellStyle: {
//           'color': 'var(--accent-primary)',
//           'font-weight': '600',
//           'cursor': 'pointer'
//         }
//       },
//       {
//         field: 'customer.name', // Assuming backend populates customer
//         headerName: 'Customer',
//         sortable: true,
//         filter: true,
//         resizable: true,
//         valueGetter: (params: any) => params.data.customer?.name || 'N/A',
//       },
//       {
//         field: 'status',
//         headerName: 'Status',
//         sortable: true,
//         filter: true,
//         resizable: true,
//         // CORRECTED: Using theme-aware cell classes
//         cellClass: (params: any) => {
//           if (!params.value) return '';
//           return `cell-status status-${params.value}`; // e.g., 'cell-status status-issued'
//         }
//       },
//       {
//         field: 'paymentStatus',
//         headerName: 'Payment',
//         sortable: true,
//         filter: true,
//         resizable: true,
//         // CORRECTED: Using theme-aware cell classes
//         cellClass: (params: any) => {
//            if (!params.value) return '';
//            return `cell-status status-${params.value}`; // e.g., 'cell-status status-paid'
//         }
//       },
//       {
//         field: 'invoiceDate',
//         headerName: 'Date',
//         sortable: true,
//         filter: 'agDateColumnFilter',
//         resizable: true,
//         valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
//       },
//       {
//         field: 'dueDate',
//         headerName: 'Due Date',
//         sortable: true,
//         filter: 'agDateColumnFilter',
//         resizable: true,
//         valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
//       },
//       {
//         field: 'grandTotal',
//         headerName: 'Total',
//         sortable: true,
//         filter: 'agNumberColumnFilter',
//         resizable: true,
//         valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
//       },
//       {
//         field: 'balanceAmount',
//         headerName: 'Balance',
//         sortable: true,
//         filter: 'agNumberColumnFilter',
//         resizable: true,
//         valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
//       },
//     ];
//     this.cdr.detectChanges();
//   }
// }
