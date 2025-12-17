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
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';

// Services
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { InvoiceService } from '../../services/invoice-service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    RouterModule,
    ToastModule,
    DatePickerModule,
    AgShareGrid
  ],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss',
})
export class InvoiceListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private invoiceService = inject(InvoiceService);
  private messageService = inject(AppMessageService);
  public masterList = inject(MasterListService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private common = inject(CommonMethodService);

  private gridApi!: GridApi;
  private currentPage = 1;
  private pageSize = 20;
  isLoading = false;
  isExporting = false;
  totalCount = 0;
  
  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';

  customerOptions = signal<any[]>([]);

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

  invoiceFilter = {
    invoiceNumber: '',
    customerId: null,
    status: null,
    paymentStatus: null,
  };
  
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
    this.dateRange = undefined;
    this.getData(true);
  }

  exportReport() {
    if (this.isExporting) return;
    this.isExporting = true;

    const params: any = { ...this.invoiceFilter, format: 'csv' };
    
    if (this.dateRange && this.dateRange[0]) {
      params.start = this.dateRange[0].toISOString();
    }
    if (this.dateRange && this.dateRange[1]) {
      params.end = this.dateRange[1].toISOString();
    }

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

        if (this.gridApi && !isReset) {
           this.gridApi.applyTransaction({ add: newData });
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
    console.log(event);
    if (event.type === 'cellClicked') {
      const invoiceId = event.row._id;
      if (invoiceId) {
        this.router.navigate([invoiceId], { relativeTo: this.route });
      }
    } 
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event)
    }
  }

  getColumn(): void {
    this.column = [
      {
        field: 'invoiceNumber',
        headerName: 'Number',
        sortable: true,
        filter: true,
        width: 150,
        cellStyle: { 'color': 'var(--accent-primary)', 'font-weight': '600', 'cursor': 'pointer' }
      },
      {
        field: 'customer.name',
        headerName: 'Customer',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 200,
        valueGetter: (params: any) => params.data.customer?.name || 'N/A',
      },
      {
        field: 'status',
        headerName: 'Status',
        sortable: true,
        width: 130,
        cellClass: (params: any) => params.value ? `cell-status status-${params.value}` : ''
      },
      {
        field: 'paymentStatus',
        headerName: 'Payment',
        sortable: true,
        width: 130,
        cellClass: (params: any) => params.value ? `cell-status status-${params.value}` : ''
      },
      {
        field: 'invoiceDate',
        headerName: 'Date',
        sortable: true,
        width: 140,
        valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
      },
      {
        field: 'dueDate',
        headerName: 'Due Date',
        sortable: true,
        width: 140,
        valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '',
      },
      {
        field: 'grandTotal',
        headerName: 'Total',
        sortable: true,
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
        cellStyle: { 'font-weight': 'bold' }
      },
      {
        field: 'balanceAmount',
        headerName: 'Balance',
        sortable: true,
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => (typeof params.value === 'number') ? `₹ ${params.value.toFixed(2)}` : 'N/A',
        cellStyle: (params: any) => params.value > 0 ? {'color': 'var(--color-error)'} : {'color': 'var(--color-success)'}
      },
    ];
    this.cdr.detectChanges();
  }
}