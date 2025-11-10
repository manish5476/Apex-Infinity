// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-invoice-list',
//   imports: [],
//   templateUrl: './invoice-list.html',
//   styleUrl: './invoice-list.scss',
// })
// export class InvoiceList {

// }
import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { SharedGridComponent } from '../../../shared/AgGrid/grid/shared-grid/shared-grid.component';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { InvoiceService } from '../../services/invoice-service';

// Shared Components & Services
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
    RouterModule
  ],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss',
})
export class InvoiceListComponent implements OnInit {
  // --- Injected Services ---
  private cdr = inject(ChangeDetectorRef);
  private invoiceService = inject(InvoiceService);
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

  // --- Master List Signals ---
  customerOptions = signal<any[]>([]);

  // --- Enums for Filters ---
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

  constructor() {
    effect(() => {
      this.customerOptions.set(this.masterList.customers());
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
    this.invoiceFilter = {
      invoiceNumber: '',
      customerId: null,
      status: null,
      paymentStatus: null,
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
      ...this.invoiceFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.invoiceService.getAllInvoices(filterParams).subscribe({
      next: (res: any) => {
        let newData: any[] = [];
        if (res.data && Array.isArray(res.data.data)) {
          newData = res.data.data;
        }

        this.totalCount = res.results || this.totalCount;
        this.data = [...this.data, ...newData];

        if (this.gridApi) {
          // if (isReset) this.gridApi.setRowData(this.data);
          // else this.gridApi.applyTransaction({ add: newData });
        }

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
        cellStyle: {
          'color': 'var(--theme-accent-primary)',
          'font-weight': '600',
          'cursor': 'pointer'
        }
      },
      {
        field: 'customer.name', // Assuming backend populates customer
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
        filter: true,
        resizable: true,
        cellStyle: (params: any) => {
          switch (params.value) {
            case 'paid': return { color: 'var(--theme-success-primary)', fontWeight: 'bold' };
            case 'issued': return { color: 'var(--theme-info-primary)', fontWeight: 'bold' };
            case 'cancelled': return { color: 'var(--theme-error-primary)', fontWeight: 'bold' };
            case 'draft': return { color: 'var(--theme-text-muted)', fontStyle: 'italic' };
            default: return {};
          }
        }
      },
      {
        field: 'paymentStatus',
        headerName: 'Payment',
        sortable: true,
        filter: true,
        resizable: true,
         cellStyle: (params: any) => {
          switch (params.value) {
            case 'paid': return { backgroundColor: '#ccffcc', color: '#006400', fontWeight: 'bold' };
            case 'partial': return { backgroundColor: '#ffe0b3', color: '#d35400', fontWeight: 'bold' };
            case 'unpaid': return { backgroundColor: '#ffcccc', color: '#8b0000', fontWeight: 'bold' };
            default: return {};
          }
        }
      },
      {
        field: 'invoiceDate',
        headerName: 'Date',
        sortable: true,
        filter: 'agDateColumnFilter',
        resizable: true,
        valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
      },
      {
        field: 'dueDate',
        headerName: 'Due Date',
        sortable: true,
        filter: 'agDateColumnFilter',
        resizable: true,
        valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
      },
      {
        field: 'grandTotal',
        headerName: 'Total',
        sortable: true,
        filter: 'agNumberColumnFilter',
        resizable: true,
        valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
      },
      {
        field: 'balanceAmount',
        headerName: 'Balance',
        sortable: true,
        filter: 'agNumberColumnFilter',
        resizable: true,
        valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
      },
    ];
    this.cdr.detectChanges();
  }
}