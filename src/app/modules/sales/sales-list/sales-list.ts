import { ChangeDetectorRef, Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { SalesService } from '../sales-service';
import { AgShareGrid } from "../../shared/components/ag-shared-grid";
import { Toast } from "primeng/toast";

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    CommonModule,
    SelectModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    RouterModule,
    TooltipModule,
    AgShareGrid,
    Toast
],
  templateUrl: './sales-list.html',
  styleUrl: './sales-list.scss',
})
export class SalesListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private salesService = inject(SalesService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  public common = inject(CommonMethodService);

  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 50;
  
  data: any[] = [];
  column: any = [];
  rowSelectionMode: 'single' | 'multiple' = 'single';

  searchControl = new FormControl('');
  searchQuery = toSignal(this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()), { initialValue: '' });

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

  constructor() {}

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.searchControl.setValue('');
    this.salesFilter = { status: null, paymentStatus: null, dateRange: null };
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (this.isLoading && !isReset) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

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
    if (event.type === 'cellClicked') {
      if (event.field === 'invoiceNumber') {
         const invoiceId =event.row.invoiceId._id;
         if (invoiceId) {
           this.router.navigate(['/invoices', invoiceId]);
         }
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event)
    }
  }

  getColumn(): void {
    this.column = [
      {
        field: 'createdAt',
        headerName: 'Date',
        sortable: true,
        width: 140,
        valueFormatter: (params: any) => this.common.formatDate(params.value, 'dd MMM yyyy'),
        cellStyle: { 'color': 'var(--text-secondary)' }
      },
      {
        field: 'invoiceNumber',
        headerName: 'Invoice #',
        sortable: true,
        width: 180,
        // Using cellStyle to indicate it's clickable
        cellStyle: { 'font-weight': '600', 'color': 'var(--accent-primary)', 'cursor': 'pointer' }
      },
      {
        field: 'customerId.name', 
        headerName: 'Customer',
        sortable: true,
        flex: 1,
        minWidth: 200,
        // Safely access customer name from object
        valueGetter: (params: any) => params.data.customerId?.name || 'Walk-in Customer'
      },
      {
        field: 'items',
        headerName: 'Items',
        width: 100,
        type: 'rightAligned',
        valueGetter: (params: any) => params.data.items?.length || 0,
      },
      {
        field: 'totalAmount',
        headerName: 'Total',
        sortable: true,
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.common.formatCurrency(params.value),
        cellStyle: { 'font-weight': 'bold' }
      },
      {
        field: 'dueAmount',
        headerName: 'Due',
        sortable: true,
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.common.formatCurrency(params.value),
        cellStyle: (params: any) => params.value > 0 ? {'color': 'var(--color-error)'} : {'color': 'var(--color-success)'}
      },
      {
        field: 'paymentStatus',
        headerName: 'Payment',
        sortable: true,
        width: 130,
        cellRenderer: (params: any) => {
          const status = params.value?.toLowerCase() || 'unpaid';
          return `<span class="status-badge status-${status}">${status}</span>`;
        }
      },
      {
        field: 'status',
        headerName: 'Order Status',
        sortable: true,
        width: 130,
        valueFormatter: (params: any) => (params.value || '').toUpperCase(),
        cellStyle: { 'font-size': '0.75rem', 'font-weight': '600', 'color': 'var(--text-secondary)' }
      }
    ];
    this.cdr.detectChanges();
  }
  
  onCreateSales() {
      this.router.navigate(['/invoices/create']); 
  }
}