import { ChangeDetectorRef, Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';

import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { GridApi, GridReadyEvent } from 'ag-grid-community';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';

// Services
import { AppMessageService } from '../../../core/services/message.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { SalesService } from '../sales-service';
import { DataGridComponent, GridColumn } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { Subject } from "rxjs";
import { MasterDropdownComponent } from '../../shared/components/masterFilterDropdown/master-dropdown.component';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    SelectModule, 
    FormsModule, 
    ReactiveFormsModule, 
    ButtonModule, 
    InputTextModule, 
    RouterModule, 
    TooltipModule, 
    DataGridComponent, 
    ToastModule, 
    DatePickerModule, 
    HasPermissionDirective, 
    MasterDropdownComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent
  ],
  templateUrl: './sales-list.html',
  styleUrl: './sales-list.scss',
})
export class SalesListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly PERMISSIONS = PERMISSIONS;

  private cdr = inject(ChangeDetectorRef);
  private salesService = inject(SalesService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  public common = inject(CommonMethodService);
  private gridApi!: GridApi;
  private currentPage = 1;
  public isLoading = false;
  private totalCount = 0;
  private pageSize = 50;

  data: any[] = [];
  column: GridColumn[] = [];
  rowSelectionMode: 'single' | 'multiple' = 'multiple';
  searchControl = new FormControl('');
  searchQuery = toSignal(this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()), { initialValue: '' });
  salesFilter: any = {
    branchId: null,
    status: null,
    paymentStatus: null,
    dateRange: null
  };

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Draft', value: 'draft' }
  ];

  paymentStatusOptions = [
    { label: 'Paid', value: 'paid' },
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Partial', value: 'partial' }
  ];

  constructor() { }

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.searchControl.setValue('');
    this.salesFilter = { branchId: null, status: null, paymentStatus: null, dateRange: null };
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

    const { dateRange, ...baseFilters } = this.salesFilter || {};
    let startDate: string | undefined;
    let endDate: string | undefined;
    if (Array.isArray(dateRange)) {
      if (dateRange[0]) startDate = (dateRange[0] as Date).toISOString();
      if (dateRange[1]) endDate = (dateRange[1] as Date).toISOString();
    }

    const filterParams = {
      ...baseFilters,
      search: this.searchControl.value,
      startDate,
      endDate,
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.salesService.getAllSales(filterParams)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }), takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          // --- UPGRADED DATA PARSING ---
          // Accessing res.data.data based on your shared JSON structure
          let newData: any[] = [];
          if (res.status === 'success' && res.data && Array.isArray(res.data.data)) {
            newData = res.data.data;
          } else if (res.results && Array.isArray(res.results)) {
            // Fallback if structure is flat
            newData = res.results;
          }

          // --- UPGRADED PAGINATION LOGIC ---
          // Getting total from pagination object or total property
          if (res.pagination) {
            this.totalCount = res.pagination.totalResults;
          } else {
            this.totalCount = res.results?.length || 0;
          }

          if (isReset) {
            this.data = newData;
          } else {
            // Append data for infinite scroll
            this.data = [...this.data, ...newData];
          }

          // Only increment page if we actually received data and haven't hit total
          if (newData.length > 0 && this.data.length < this.totalCount) {
            this.currentPage++;
          }
        },
        error: (err: any) => {
          // Delegated to global HTTP error handler
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
    if (event.type === 'cellClicked') {
      if (event.field === 'invoiceNumber') {
        // Using invoiceId object from JSON or row ID if needed
        const invoiceId = event.row.invoiceId?._id || event.row._id;
        if (invoiceId) {
          this.router.navigate(['/invoices', invoiceId]);
        }
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event);
    }
  }

  getColumn(): void {
    this.column = [
      {
        field: 'createdAt',
        header: 'Date',
        sortable: true,
        width: '130px',
        formatter: (val: any) => val ? this.common.formatDate(val, 'dd MMM yyyy') : '—'
      },
      {
        field: 'invoiceNumber',
        header: 'Invoice / Branch',
        width: '1fr',
        minWidth: '195px',
        formatter: (val: any, row: any) => {
          const inv = row?.invoiceNumber ?? row?.invoiceId?.invoiceNumber ?? '—';
          const branch = row?.branchId?.name ?? '—';
          return `${inv} (${branch})`;
        }
      },
      {
        field: 'customerId',
        header: 'Customer',
        type: 'user',
        width: '1fr',
        minWidth: '190px',
        formatter: (val: any) => val?.name ?? 'Walk-in Customer'
      },
      {
        field: 'status',
        header: 'Status',
        type: 'badge',
        width: '120px',
        sortable: true
      },
      {
        field: 'totalAmount',
        header: 'Grand Total',
        sortable: true,
        width: '135px',
        type: 'currency',
        currencyCode: 'INR',
        align: 'right'
      },
      {
        field: 'paidAmount',
        header: 'Paid',
        sortable: true,
        width: '120px',
        type: 'currency',
        currencyCode: 'INR',
        align: 'right'
      },
      {
        field: 'dueAmount',
        header: 'Due',
        sortable: true,
        width: '120px',
        type: 'currency',
        currencyCode: 'INR',
        align: 'right'
      },
      {
        field: 'paymentStatus',
        header: 'Payment Status',
        type: 'badge',
        width: '165px'
      }
    ];
  }

  onCreateSales() {
    this.router.navigate(['/invoices/create']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
