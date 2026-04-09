import { ChangeDetectorRef, Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { DatePickerModule } from 'primeng/datepicker';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { SalesReturnActionDialogComponent } from '../sales-return-action-dialog/sales-return-action-dialog';

// Services
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { SalesReturnService, GetSalesReturnsQuery } from '../../../../core/services/sales.return.service';
import { AgShareGrid } from '../../../shared/components/ag-shared-grid';
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { MasterListService } from '../../../../core/services/master-list.service';
import { Toast } from 'primeng/toast';
import { Subject } from "rxjs";

// ============================================================================
// Custom Cell Renderer for Action Buttons
// ============================================================================
@Component({
  selector: 'app-action-buttons-renderer',
  standalone: true,
  template: `
    @if (params?.data?.status?.toLowerCase() === 'pending') {
      <div class="flex gap-1 items-center h-full">
        <button class="p-button-sm p-button-success p-button-text p-button-rounded action-btn approve-btn" 
                style="padding: 0; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: rgba(16, 185, 129, 0.1); border: none; color: #10b981; cursor: pointer; border-radius: 50%; transition: all 0.2s;" 
                title="Approve"
                (click)="onClick('approve', $event)">
          <i class="pi pi-check" style="font-size: 0.8rem;"></i>
        </button>
        <button class="p-button-sm p-button-danger p-button-text p-button-rounded action-btn reject-btn" 
                style="padding: 0; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.1); border: none; color: #ef4444; cursor: pointer; border-radius: 50%; transition: all 0.2s;" 
                title="Reject"
                (click)="onClick('reject', $event)">
          <i class="pi pi-ban" style="font-size: 0.8rem;"></i>
        </button>
      </div>
    }
  `
})
export class ActionButtonsRenderer {
  params: any;

  agInit(params: any): void {
    this.params = params;
  }

  refresh(params: any): boolean {
    this.params = params;
    return true;
  }

  onClick(action: 'approve' | 'reject', event: Event) {
    event.stopPropagation(); // Prevents the grid cellClicked event from firing
    if (this.params.onAction) {
      this.params.onAction(this.params.data, action);
    }
  }
}
// ============================================================================

@Component({
  selector: 'app-sales-return-list',
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
    Toast,
    DatePickerModule,
    HasPermissionDirective,
    DynamicDialogModule
  ],
  templateUrl: './sales-return-list.html',
  styleUrl: './sales-return-list.scss',
  providers: [DialogService]
})
export class SalesReturnListComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  readonly PERMISSIONS = PERMISSIONS;

  private cdr = inject(ChangeDetectorRef);
  private salesReturnService = inject(SalesReturnService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  public common = inject(CommonMethodService);
  public masterList = inject(MasterListService);
  private dialogService = inject(DialogService);

  private gridApi!: GridApi;
  private currentPage = 1;
  private pageSize = 50;
  private totalCount = 0;

  isLoading = signal(false);
  data = signal<any[]>([]);

  // Filters
  searchControl = new FormControl('');
  searchQuery = toSignal(this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()), { initialValue: '' });

  filter: {
    status: string | null;
    branchId: string | null;
    dateRange: [Date | null, Date | null] | null;
  } = {
      status: null,
      branchId: null,
      dateRange: null
    };

  statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' }
  ];

  column: any = [];

  constructor() { }

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);

    // Subscribe to search query changes after initial load
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.searchControl.setValue('', { emitEvent: false });
    this.filter = { status: null, branchId: null, dateRange: null };
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (this.isLoading() && !isReset) return;

    this.isLoading.set(true);

    if (isReset) {
      this.currentPage = 1;
      this.data.set([]);
    }

    const query: GetSalesReturnsQuery = {
      page: this.currentPage,
      limit: this.pageSize,
      status: this.filter.status || undefined,
      branchId: this.filter.branchId || undefined,
      search: this.searchControl.value || undefined
    };

    if (this.filter.dateRange && this.filter.dateRange.length === 2 && this.filter.dateRange[1]) {
      query.startDate = this.filter.dateRange[0]?.toISOString();
      query.endDate = this.filter.dateRange[1]?.toISOString();
    }

    this.salesReturnService.getSalesReturns(query)
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }), takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          // Binding based on the provided API response structure (res.data.returns)
          const newData = res.data?.returns || res.data?.data || res.results || [];
          this.totalCount = res.total || res.pagination?.totalResults || res.results?.length || 0;

          if (isReset) {
            this.data.set(newData);
          } else {
            this.data.update(prev => [...prev, ...newData]);
          }

          // Stop incrementing page if we fetched all data
          if (newData.length > 0 && this.data().length < this.totalCount) {
            this.currentPage++;
          }
        },
        error: (err) => {
          this.messageService.handleHttpError(err);
        }
      });
  }

  onScrolledToBottom(_: any) {
    if (!this.isLoading() && this.data().length < this.totalCount) {
      this.getData(false);
    }
  }

  eventFromGrid(event: any) {
    if (event.type === 'init') {
      this.gridApi = event.api;
    }

    if (event.type === 'cellClicked') {
      const rowData = event.row || event.data; // Ensure robust data access

      if (event.field === 'returnNumber') {
      } else if (event.field === 'invoiceId.invoiceNumber' || event.field === 'invoiceId') {
        const invoiceId = rowData?.invoiceId?._id || rowData?.invoiceId;
        if (invoiceId) this.router.navigate(['/invoices', invoiceId]);
      }
    }

    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event);
    }
  }

  openActionDialog(row: any, actionType: 'approve' | 'reject') {
    const ref = this.dialogService.open(SalesReturnActionDialogComponent, {
      header: actionType === 'approve' ? 'Approve Return' : 'Reject Return',
      width: '500px',
      contentStyle: { 'background': 'transparent', 'padding': '0' },
      closable: true,
      data: {
        actionType,
        returnId: row._id,
        returnNumber: row.returnNumber
      }
    });

    ref?.onClose.pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.getData(true);
      }
    });
  }

  getColumn(): void {
    // Columns strictly mapped to JSON schema provided
    this.column = [
      {
        field: 'createdAt',
        headerName: 'Date',
        width: 140,
        valueFormatter: (p: any) => this.common.formatDate(p.value, 'dd MMM yyyy'),
        cellStyle: { 'color': 'var(--text-secondary)' }
      },
      {
        field: 'returnNumber',
        headerName: 'Return #',
        width: 150,
        cellStyle: { 'font-weight': '700', 'color': 'var(--accent-primary)' }
      },
      {
        field: 'invoiceId.invoiceNumber',
        headerName: 'Invoice #',
        width: 170,
        cellStyle: { 'font-weight': '600', 'color': 'var(--text-secondary)', 'cursor': 'pointer' },
        valueGetter: (p: any) => p.data.invoiceId?.invoiceNumber || '-'
      },
      {
        field: 'customerId.name',
        headerName: 'Customer',
        flex: 1,
        minWidth: 200,
        valueGetter: (p: any) => p.data.customerId?.name || '-'
      },
      {
        field: 'reason',
        headerName: 'Reason',
        width: 150,
        valueFormatter: (p: any) => p.value ? p.value.charAt(0).toUpperCase() + p.value.slice(1) : '-',
        cellStyle: { 'color': 'var(--text-secondary)' }
      },
      {
        field: 'totalRefundAmount',
        headerName: 'Refund Amt',
        width: 140,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.common.formatCurrency(p.value),
        cellStyle: { 'font-weight': 'bold', 'color': 'var(--text-primary)' }
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        cellRenderer: (p: any) => {
          const status = p.value?.toLowerCase() || 'pending';
          return `<span class="status-badge status-${status}">${status}</span>`;
        }
      },
      {
        headerName: 'Actions',
        width: 100,
        suppressSizeToFit: true,
        cellRenderer: ActionButtonsRenderer,
        cellRendererParams: {
          onAction: (row: any, actionType: 'approve' | 'reject') => this.openActionDialog(row, actionType)
        },
        cellStyle: { 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' }
      }
    ];
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}