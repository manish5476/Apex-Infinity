
import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { MasterListService } from '../../../core/services/master-list.service';
import { AppMessageService } from '../../../core/services/message.service';
import { SharedGridComponent } from '../../shared/AgGrid/grid/shared-grid/shared-grid.component';
import { PurchaseService } from '../purchase.service';

// Custom Components & Services

@Component({
  selector: 'app-purchase-list',
  standalone: true,
  imports: [
    CommonModule,
    SharedGridComponent,
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DatePicker,
    RouterModule
  ],
  templateUrl: './purchase-list.html',
  styleUrl: './purchase-list.scss',
})
export class PurchaseListComponent implements OnInit {
  // --- Injected Services ---
  private cdr = inject(ChangeDetectorRef);
  private purchaseService = inject(PurchaseService);
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
  supplierOptions = signal<any[]>([]);

  // Static Options for Filters
  statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Received', value: 'received' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  paymentStatusOptions = [
    { label: 'Paid', value: 'paid' },
    { label: 'Partial', value: 'partial' },
    { label: 'Unpaid', value: 'unpaid' }
  ];

  // --- Filters ---
  purchaseFilter = {
    invoiceNumber: '',
    supplierId: null,
    status: null,
    paymentStatus: null,
    dateRange: null // For Calendar
  };

  constructor() {
    effect(() => {
      this.supplierOptions.set(this.masterList.suppliers());
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
    this.purchaseFilter = {
      invoiceNumber: '',
      supplierId: null,
      status: null,
      paymentStatus: null,
      dateRange: null
    };
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;
    if (isReset) { this.currentPage = 1; this.data = []; this.totalCount = 0 }
    // Handle Date Range Extraction
    let startDate, endDate;
    if (this.purchaseFilter.dateRange && Array.isArray(this.purchaseFilter.dateRange)) {
      startDate = this.purchaseFilter.dateRange[0];
      endDate = this.purchaseFilter.dateRange[1];
    }

    const filterParams = { ...this.purchaseFilter, startDate, endDate, page: this.currentPage, limit: this.pageSize };
    delete (filterParams as any).dateRange;
    this.purchaseService.getAllPurchases(filterParams).subscribe({
      next: (res: any) => {
        let newData: any[] = [];
        if (res.data && Array.isArray(res.data.purchases)) { newData = res.data.purchases }
        this.totalCount = res.results || this.totalCount;
        this.data = [...this.data, ...newData];
        if (this.gridApi) {
          if (isReset) {
            // Optional: this.gridApi.setRowData(this.data);
          } else {
            this.gridApi.applyTransaction({ add: newData });
          }
        }

        this.currentPage++;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.messageService.showError('Error', 'Failed to fetch purchases.');
        console.error('❌ Error fetching purchases:', err);
      }
    });
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
    if (event.eventType === 'RowSelectedEvent') {
      const purchaseId = event.event.data._id;
      if (purchaseId) {
        this.router.navigate([purchaseId], { relativeTo: this.route });
      }
    }
  }

  getColumn(): void {
    this.column = [
      {
        field: 'invoiceNumber',
        headerName: 'Invoice #',
        sortable: true,
        filter: true,
        resizable: true,
        cellStyle: { 'font-weight': '600', 'color': 'var(--text-primary)' }
      },
      {
        field: 'purchaseDate',
        headerName: 'Date',
        sortable: true,
        resizable: true,
        valueFormatter: (params: any) => {
          if (!params.value) return '';
          return new Date(params.value).toLocaleDateString('en-IN');
        }
      },
      {
        field: 'supplierId.companyName', // Accessing populated field
        headerName: 'Supplier',
        sortable: true,
        filter: true,
        resizable: true,
        valueGetter: (params: any) => params.data.supplierId?.companyName || 'N/A'
      },
      {
        field: 'grandTotal',
        headerName: 'Grand Total',
        sortable: true,
        filter: 'agNumberColumnFilter',
        resizable: true,
        cellStyle: { 'font-weight': '600' },
        valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
      },
      {
        field: 'balanceAmount',
        headerName: 'Balance Due',
        sortable: true,
        filter: 'agNumberColumnFilter',
        resizable: true,
        valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : '0.00',
        cellClass: (params: any) => {
          return params.value > 0 ? 'text-red-500 font-medium' : 'text-green-600';
        }
      },
      {
        field: 'status',
        headerName: 'Status',
        sortable: true,
        resizable: true,
        cellClass: (params: any) => {
          switch (params.value) {
            case 'received': return 'cell-status status-received';
            case 'draft': return 'cell-status status-draft';
            case 'cancelled': return 'cell-status status-cancelled';
            default: return '';
          }
        },
      },
      {
        field: 'paymentStatus',
        headerName: 'Payment',
        sortable: true,
        resizable: true,
        cellClass: (params: any) => {
          switch (params.value) {
            case 'paid': return 'cell-status pay-paid';
            case 'partial': return 'cell-status pay-partial';
            case 'unpaid': return 'cell-status pay-unpaid';
            default: return '';
          }
        },
      }
    ];
    this.cdr.detectChanges();
  }
}