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
    this.column = [
      // ── Date ──────────────────────────────────────────────────────
      {
        field: 'returnDate',
        headerName: 'Return Date',
        width: 150,
        sortable: true,
        valueFormatter: (p: any) => this.common.formatDate(p.value, 'dd MMM yyyy'),
        cellStyle: {
          'color': 'var(--text-secondary)',
          'font-size': '13.5px',
          'display': 'flex',
          'align-items': 'center'
        }
      },

      // ── Return # ──────────────────────────────────────────────────
      {
        field: 'returnNumber',
        headerName: 'Return #',
        width: 140,
        sortable: true,
        cellStyle: {
          'font-weight': '600',
          'color': 'var(--accent-primary)',
          'font-size': '13.5px',
          'display': 'flex',
          'align-items': 'center'
        }
      },

      // ── Invoice # ─────────────────────────────────────────────────
      {
        field: 'invoiceId.invoiceNumber',
        headerName: 'Invoice #',
        width: 185,
        valueGetter: (p: any) => p.data?.invoiceId?.invoiceNumber || '—',
        cellStyle: {
          'font-weight': '500',
          'color': 'var(--color-info)',
          'cursor': 'pointer',
          'font-size': '13.5px',
          'display': 'flex',
          'align-items': 'center'
        }
      },

      // ── Customer ──────────────────────────────────────────────────
      {
        field: 'customerId.name',
        headerName: 'Customer',
        flex: 1,
        minWidth: 180,
        valueGetter: (p: any) => p.data?.customerId?.name || '—',
        cellStyle: {
          'font-weight': '500',
          'font-size': '13.5px',
          'display': 'flex',
          'align-items': 'center'
        }
      },

      // ── Customer Phone ────────────────────────────────────────────
      {
        field: 'customerId.phone',
        headerName: 'Phone',
        width: 145,
        valueGetter: (p: any) => p.data?.customerId?.phone || '—',
        cellStyle: {
          'color': 'var(--text-secondary)',
          'font-size': '13px',
          'font-family': 'var(--font-mono)',
          'display': 'flex',
          'align-items': 'center'
        }
      },

      // ── Items (count + names) ─────────────────────────────────────
      {
        field: 'items',
        headerName: 'Items',
        width: 220,
        sortable: false,
        valueGetter: (p: any) => {
          const items = p.data?.items || [];
          if (!items.length) return '—';
          return items.map((i: any) => `${i.name} ×${i.quantity}`).join(', ');
        },
        cellStyle: {
          'color': 'var(--text-secondary)',
          'font-size': '13px',
          'overflow': 'hidden',
          'text-overflow': 'ellipsis',
          'white-space': 'nowrap',
          'display': 'flex',
          'align-items': 'center'
        },
        tooltipValueGetter: (p: any) => {
          const items = p.data?.items || [];
          return items.map((i: any) => `${i.name} ×${i.quantity} @ ₹${i.unitPrice}`).join('\n');
        }
      },

      // ── Reason ────────────────────────────────────────────────────
      {
        field: 'reason',
        headerName: 'Reason',
        width: 140,
        valueFormatter: (p: any) =>
          p.value ? p.value.charAt(0).toUpperCase() + p.value.slice(1) : '—',
        cellStyle: {
          'color': 'var(--text-secondary)',
          'font-size': '13.5px',
          'display': 'flex',
          'align-items': 'center'
        }
      },

      // ── Sub Total ─────────────────────────────────────────────────
      {
        field: 'subTotal',
        headerName: 'Sub Total',
        width: 130,
        sortable: true,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.common.formatCurrency(p.value ?? 0),
        cellStyle: {
          'font-family': 'var(--font-mono)',
          'font-size': '13px',
          'color': 'var(--text-secondary)',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'flex-end'
        }
      },

      // ── Tax Total ─────────────────────────────────────────────────
      {
        field: 'taxTotal',
        headerName: 'Tax',
        width: 110,
        sortable: true,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.common.formatCurrency(p.value ?? 0),
        cellStyle: {
          'font-family': 'var(--font-mono)',
          'font-size': '13px',
          'color': 'var(--text-secondary)',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'flex-end'
        }
      },

      // ── Total Refund ─────────────────────────────────────────────
      {
        field: 'totalRefundAmount',
        headerName: 'Refund Amt',
        width: 145,
        sortable: true,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.common.formatCurrency(p.value ?? 0),
        cellStyle: (p: any) => ({
          'font-family': 'var(--font-mono)',
          'font-size': '14px',
          'font-weight': '700',
          'color': p.value > 0 ? 'var(--color-error)' : 'var(--text-primary)',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'flex-end'
        })
      },

      // ── Approved / Rejected By ────────────────────────────────────
      {
        field: 'approvedBy',
        headerName: 'Actioned By',
        width: 150,
        valueGetter: (p: any) => {
          const row = p.data;
          if (row?.approvedBy?.name) return `✓ ${row.approvedBy.name}`;
          if (row?.rejectedBy?.name) return `✗ ${row.rejectedBy.name}`;
          return '—';
        },
        cellStyle: (p: any) => {
          const row = p.data;
          const color = row?.approvedBy?.name
            ? 'var(--color-success)'
            : row?.rejectedBy?.name
              ? 'var(--color-error)'
              : 'var(--text-secondary)';
          return {
            'color': color,
            'font-size': '13px',
            'font-weight': '500',
            'display': 'flex',
            'align-items': 'center'
          };
        }
      },

      // ── Rejection Reason (only shown if rejected) ─────────────────
      {
        field: 'rejectionReason',
        headerName: 'Rejection Note',
        width: 160,
        valueGetter: (p: any) => p.data?.rejectionReason || '—',
        cellStyle: {
          'color': 'var(--color-error)',
          'font-size': '13px',
          'font-style': 'italic',
          'overflow': 'hidden',
          'text-overflow': 'ellipsis',
          'white-space': 'nowrap',
          'display': 'flex',
          'align-items': 'center'
        },
        tooltipValueGetter: (p: any) => p.data?.rejectionReason || ''
      },

      // ── Status Badge ─────────────────────────────────────────────
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        sortable: true,
        cellRenderer: (p: any) => {
          if (p.node?.rowPinned) return '';
          const status = (p.value || 'pending').toLowerCase();
          const map: Record<string, { bg: string; color: string; label: string }> = {
            approved: { bg: 'var(--color-success-bg)', color: 'var(--color-success-dark)', label: '✓ Approved' },
            rejected: { bg: 'var(--color-error-bg)', color: 'var(--color-error-dark)', label: '✗ Rejected' },
            pending: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning-dark)', label: '⏳ Pending' }
          };
          const s = map[status] ?? map['pending'];
          return `
          <span style="
            display:inline-flex; align-items:center;
            padding:3px 10px; border-radius:20px;
            font-size:12px; font-weight:600; white-space:nowrap;
            background:${s.bg}; color:${s.color};
          ">${s.label}</span>`;
        },
        cellStyle: {
          'display': 'flex',
          'align-items': 'center'
        }
      },

      // ── Actions ───────────────────────────────────────────────────
      {
        headerName: 'Actions',
        width: 110,
        suppressSizeToFit: true,
        sortable: false,
        filter: false,
        pinned: 'right',
        cellRenderer: ActionButtonsRenderer,
        cellRendererParams: {
          onAction: (row: any, actionType: 'approve' | 'reject') =>
            this.openActionDialog(row, actionType)
        },
        cellStyle: {
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center'
        }
      }
    ];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}