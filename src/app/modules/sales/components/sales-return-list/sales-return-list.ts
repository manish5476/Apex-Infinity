import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation, inject, signal, OnDestroy } from '@angular/core';

import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { GridApi, GridReadyEvent } from 'ag-grid-community';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';

// App Core & Shared
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { SalesReturnService, GetSalesReturnsQuery } from '../../../../core/services/sales.return.service';
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
import { SalesReturnActionDialogComponent } from '../sales-return-action-dialog/sales-return-action-dialog';
import { DataGridComponent } from '@shared/ui/grid';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';

// ============================================================================
// Custom Cell Renderer for Action Buttons
// ============================================================================
@Component({
  selector: 'app-action-buttons-renderer',
  standalone: true,
  template: `
    @if (params?.data?.status?.toLowerCase() === 'pending') {
      <div class="action-btn-container">
        <button class="action-btn approve-btn" 
                title="Approve"
                (click)="onClick('approve', $event)">
          <i class="pi pi-check"></i>
        </button>
        <button class="action-btn reject-btn" 
                title="Reject"
                (click)="onClick('reject', $event)">
          <i class="pi pi-ban"></i>
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
    event.stopPropagation();
    if (this.params.onAction) {
      this.params.onAction(this.params.data, action);
    }
  }
}

// ============================================================================
// Main Sales Return Component
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
    DataGridComponent,
    ToastModule,
    DatePickerModule,
    HasPermissionDirective,
    DynamicDialogModule,
    MasterDropdownComponent,
    PageHeaderComponent,
    PageContentComponent
  ],
  providers: [DialogService],
  template: `
    <p-toast position="bottom-right" appendTo="body"></p-toast>

    <div class="page-layout">
      
      <header class="list-header elevation-card">
        <div class="header-left">
          <div class="icon-box">
            <i class="pi pi-replay"></i>
          </div>
          <div class="header-titles">
            <h1>Sales Returns</h1>
            <p>Track and manage credit notes & product returns</p>
          </div>
        </div>

        <div class="header-actions">
          <p-button icon="pi pi-refresh" 
            styleClass="p-button-text p-button-rounded theme-btn-secondary"
            [loading]="isLoading()" 
            (onClick)="getData(true)" 
            pTooltip="Refresh List" tooltipPosition="bottom">
          </p-button>

          <p-button *hasPermission="PERMISSIONS.SALES.MANAGE" 
            label="New Sales Return" icon="pi pi-plus" 
            routerLink="/invoices"
            styleClass="p-button-primary">
          </p-button>
        </div>
      </header>

      <div class="filter-panel elevation-card">
        <div class="filter-grid">
          
          <div class="filter-field">
            <label>Search</label>
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <input type="text" pInputText 
                [formControl]="searchControl" 
                placeholder="Return #, Invoice #..."
                class="w-full theme-control" />
            </span>
          </div>

          <div class="filter-field">
            <label>Status</label>
            <p-select 
              [options]="statusOptions" 
              [(ngModel)]="filter.status" 
              (onChange)="applyFilters()"
              placeholder="Select Status" 
              class="w-full" 
              styleClass="w-full theme-control"
              [showClear]="true">
            </p-select>
          </div>

          <div class="filter-field">
            <label>Branch</label>
            <app-master-dropdown 
              endpoint="branches" 
              [(ngModel)]="filter.branchId" 
              (onChange)="applyFilters()"
              placeholder="Select Branch">
            </app-master-dropdown>
          </div>

          <div class="filter-field">
            <div class="filter-label-row">
              <label>Date Range</label>
              @if (filter.dateRange) {
                <button class="clear-link" (click)="resetDateRange()">Clear</button>
              }
            </div>
            <p-datepicker 
              [(ngModel)]="filter.dateRange" 
              selectionMode="range" 
              (onSelect)="applyFilters()"
              placeholder="Start - End" 
              class="w-full" 
              styleClass="w-full theme-control"
              appendTo="body">
            </p-datepicker>
          </div>

        </div>
      </div>

      <div class="grid-wrapper elevation-card relative">
        <app-ag-share-grid 
          class="full-size-grid"
          [columns]="column" 
          [data]="data()" 
          (gridEvent)="eventFromGrid($event)">
        </app-ag-share-grid>

        @if (isLoading() && data().length === 0) {
          <div class="overlay-state blur-backdrop">
            <div class="flex-center-col gap-sm">
              <p class="overlay-text">FETCHING RETURNS...</p>
            </div>
          </div>
        }

        @if (!isLoading() && data().length === 0) {
          <div class="overlay-state empty-state">
            <div class="empty-icon-circle">
              <i class="pi pi-inbox"></i>
            </div>
            <h3>No Returns Found</h3>
            <p>Try adjusting your filters or search terms to find what you're looking for.</p>
            <p-button label="Clear All Filters" styleClass="p-button-text p-button-sm theme-btn-secondary mt-2" (onClick)="resetFilters()"></p-button>
          </div>
        }
      </div>

      <footer class="list-footer">
        <p>Showing <span class="highlight">{{ data().length }}</span> of <span class="highlight">{{ totalCount }}</span> results</p>
      </footer>

    </div>
  `,
  styles: [`
    /* =========================================================
       SALES RETURN LIST - STRICT APEX CRM THEME
       ========================================================= */

    :host {
      display: block;
      width: 100%;
      height: 100%;
      font-family: var(--font-body);
    }

    /* Layout Skeleton */
    .page-layout {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      padding: var(--spacing-2xl);
      gap: var(--spacing-xl);
      overflow: hidden;
    }

    /* Shared Card Styles */
    .elevation-card {
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--shadow-sm);
    }

    /* ── HEADER ── */
    .list-header {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg) var(--spacing-2xl);
      flex-wrap: wrap;
      gap: var(--spacing-lg);

      .header-left {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);

        .icon-box {
          width: 3rem;
          height: 3rem;
          background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
          color: var(--accent-primary);
          border-radius: var(--ui-border-radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-xl);
        }

        .header-titles {
          h1 {
            font-family: var(--font-heading);
            font-size: var(--font-size-xl);
            font-weight: var(--font-weight-bold);
            color: var(--text-primary);
            margin: 0 0 2px 0;
            letter-spacing: -0.02em;
          }
          p {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            margin: 0;
            font-weight: var(--font-weight-medium);
          }
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }
    }

    /* ── FILTER PANEL ── */
    .filter-panel {
      flex-shrink: 0;
      padding: var(--spacing-lg) var(--spacing-2xl);
      display: flex;
      flex-direction: column;

      .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-lg);
        width: 100%;
      }

      .filter-field {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);

        label {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-tertiary);
          margin: 0;
        }

        .filter-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .clear-link {
            background: none; border: none; padding: 0; margin: 0;
            font-size: var(--font-size-xs);
            color: var(--accent-primary);
            cursor: pointer;
            &:hover { text-decoration: underline; }
          }
        }
      }
    }

    /* ── AG GRID WRAPPER ── */
    .grid-wrapper {
      flex: 1;           /* Take all remaining space */
      min-height: 0;     /* CRITICAL: Prevent grid blowout */
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;

      .full-size-grid {
        flex: 1;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;

        ::ng-deep ag-grid-angular {
          width: 100%;
          height: 100%;
          flex: 1;
        }

        ::ng-deep .ag-root-wrapper {
          border: none !important;
          border-radius: var(--ui-border-radius-lg);
        }
      }
    }

    /* Overlays */
    .overlay-state {
      position: absolute;
      top: 0; right: 0; bottom: 0; left: 0;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: var(--ui-border-radius-lg);
    }
    
    .blur-backdrop {
      background: color-mix(in srgb, var(--bg-primary) 40%, transparent);
      backdrop-filter: blur(2px);
    }

    .flex-center-col { display: flex; flex-direction: column; align-items: center; }
    .overlay-text { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-secondary); letter-spacing: 0.05em; margin-top: var(--spacing-md); }

    .empty-state {
      background: var(--bg-secondary);
      padding: var(--spacing-3xl);
      text-align: center;

      .empty-icon-circle {
        width: 5rem; height: 5rem;
        border-radius: 50%;
        background: var(--bg-ternary);
        display: flex; align-items: center; justify-content: center;
        margin-bottom: var(--spacing-md);
        i { font-size: 2rem; color: var(--text-tertiary); opacity: 0.5; }
      }
      h3 { margin: 0 0 var(--spacing-xs); font-size: var(--font-size-lg); color: var(--text-primary); }
      p { margin: 0; font-size: var(--font-size-sm); color: var(--text-secondary); max-width: 300px; }
      .mt-2 { margin-top: var(--spacing-md); }
    }

    /* Footer */
    .list-footer {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 var(--spacing-xs);

      p {
        margin: 0;
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-medium);
        color: var(--text-secondary);

        .highlight {
          color: var(--text-primary);
          font-weight: var(--font-weight-bold);
        }
      }
    }

    /* ==========================================================================
       GLOBAL INJECTED STYLES FOR CELL RENDERERS
       ========================================================================== */
    ::ng-deep {
      
      /* Layout & Alignments */
      .cell-flex-center { display: flex; align-items: center; height: 100%; gap: var(--spacing-sm); }
      .cell-flex-end { display: flex; align-items: center; justify-content: flex-end; height: 100%; gap: var(--spacing-sm); }
      
      /* Typography */
      .font-mono { font-family: var(--font-mono); }
      .font-semibold { font-weight: var(--font-weight-semibold); }
      .font-bold { font-weight: var(--font-weight-bold); }
      .cursor-pointer { cursor: pointer; }
      .hover-underline:hover { text-decoration: underline; }

      .text-xs { font-size: var(--font-size-xs); }
      .text-sm { font-size: var(--font-size-sm); }

      .text-primary { color: var(--text-primary); }
      .text-secondary { color: var(--text-secondary); }
      .text-tertiary { color: var(--text-tertiary); }
      .text-accent { color: var(--accent-primary); }
      .text-success { color: var(--color-success); }
      .text-error { color: var(--color-error); }
      .text-info { color: var(--color-info); }

      .ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; max-width: 100%; }

      /* Badges */
      .grid-badge {
        padding: 3px 10px;
        border-radius: var(--ui-border-radius-pill);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        height: fit-content;
      }
      .badge-success-soft { background: var(--color-success-bg); color: var(--color-success-dark); }
      .badge-danger-soft { background: var(--color-error-bg); color: var(--color-error-dark); }
      .badge-warning-soft { background: var(--color-warning-bg); color: var(--color-warning-dark); }

      /* Action Buttons */
      .action-btn-container { display: flex; gap: var(--spacing-xs); align-items: center; height: 100%; }
      .action-btn {
        width: 28px; height: 28px; padding: 0;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%; border: none; cursor: pointer;
        transition: var(--transition-fast);
        
        i { font-size: var(--font-size-sm); font-weight: bold; }
        
        &.approve-btn { 
          background: var(--color-success-bg); color: var(--color-success); 
          &:hover { background: var(--color-success); color: var(--bg-primary); }
        }
        &.reject-btn { 
          background: var(--color-error-bg); color: var(--color-error); 
          &:hover { background: var(--color-error); color: var(--bg-primary); }
        }
      }

      /* Buttons & Utilities */
      .theme-btn-secondary {
        color: var(--text-secondary) !important;
        border-color: var(--border-secondary) !important;
        &:hover { background: var(--bg-ternary) !important; color: var(--text-primary) !important; }
      }
    }
  `],
  encapsulation: ViewEncapsulation.None
})
export class SalesReturnListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly PERMISSIONS = PERMISSIONS;

  private cdr = inject(ChangeDetectorRef);
  private salesReturnService = inject(SalesReturnService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  public common = inject(CommonMethodService);
  private dialogService = inject(DialogService);

  private gridApi!: GridApi;
  private currentPage = 1;
  private pageSize = 50;
  totalCount = 0;

  isLoading = signal(false);
  data = signal<any[]>([]);

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

  column: any[] = [];

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);

    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.searchControl.setValue('', { emitEvent: false });
    this.filter = { status: null, branchId: null, dateRange: null };
    this.getData(true);
  }

  resetDateRange() {
    this.filter.dateRange = null;
    this.applyFilters();
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
          const newData = res.data?.returns || res.data?.data || res.results || [];
          this.totalCount = res.total || res.pagination?.totalResults || res.results?.length || 0;

          if (isReset) {
            this.data.set(newData);
          } else {
            this.data.update(prev => [...prev, ...newData]);
          }

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
      const rowData = event.row || event.data;

      if (event.field === 'invoiceId.invoiceNumber' || event.field === 'invoiceId') {
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
      {
        field: 'returnDate',
        headerName: 'Return Date',
        width: 140,
        sortable: true,
        cellClass: 'cell-flex-center text-secondary text-sm font-semibold',
        valueFormatter: (p: any) => this.common.formatDate(p.value, 'dd MMM yyyy')
      },
      {
        field: 'returnNumber',
        headerName: 'Return #',
        width: 150,
        sortable: true,
        cellClass: 'cell-flex-center font-bold text-accent font-mono text-sm'
      },
      {
        field: 'invoiceId.invoiceNumber',
        headerName: 'Invoice #',
        width: 170,
        valueGetter: (p: any) => p.data?.invoiceId?.invoiceNumber || '—',
        cellClass: 'cell-flex-center font-bold text-info font-mono text-sm cursor-pointer hover-underline'
      },
      {
        field: 'customerId.name',
        headerName: 'Customer',
        flex: 1,
        minWidth: 180,
        valueGetter: (p: any) => p.data?.customerId?.name || '—',
        cellClass: 'cell-flex-center font-bold text-primary text-sm'
      },
      {
        field: 'customerId.phone',
        headerName: 'Phone',
        width: 140,
        valueGetter: (p: any) => p.data?.customerId?.phone || '—',
        cellClass: 'cell-flex-center text-secondary font-mono text-sm'
      },
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
        cellClass: 'cell-flex-center text-secondary text-xs ellipsis',
        tooltipValueGetter: (p: any) => {
          const items = p.data?.items || [];
          return items.map((i: any) => `${i.name} ×${i.quantity} @ ${i.unitPrice}`).join('\n');
        }
      },
      {
        field: 'reason',
        headerName: 'Reason',
        width: 140,
        valueFormatter: (p: any) => p.value ? p.value.charAt(0).toUpperCase() + p.value.slice(1) : '—',
        cellClass: 'cell-flex-center text-secondary text-sm'
      },
      {
        field: 'subTotal',
        headerName: 'Sub Total',
        width: 130,
        sortable: true,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.common.formatCurrency(p.value ?? 0),
        cellClass: 'cell-flex-end font-mono text-secondary text-sm'
      },
      {
        field: 'taxTotal',
        headerName: 'Tax',
        width: 110,
        sortable: true,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.common.formatCurrency(p.value ?? 0),
        cellClass: 'cell-flex-end font-mono text-secondary text-sm'
      },
      {
        field: 'totalRefundAmount',
        headerName: 'Refund Amt',
        width: 150,
        sortable: true,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.common.formatCurrency(p.value ?? 0),
        cellClass: (p: any) => p.value > 0 ? 'cell-flex-end font-mono font-bold text-error text-sm' : 'cell-flex-end font-mono font-bold text-primary text-sm'
      },
      {
        field: 'approvedBy',
        headerName: 'Actioned By',
        width: 160,
        valueGetter: (p: any) => {
          const row = p.data;
          if (row?.approvedBy?.name) return `✓ ${row.approvedBy.name}`;
          if (row?.rejectedBy?.name) return `✗ ${row.rejectedBy.name}`;
          return '—';
        },
        cellClass: (p: any) => {
          const row = p.data;
          if (row?.approvedBy?.name) return 'cell-flex-center text-success font-semibold text-xs';
          if (row?.rejectedBy?.name) return 'cell-flex-center text-error font-semibold text-xs';
          return 'cell-flex-center text-tertiary text-xs';
        }
      },
      {
        field: 'rejectionReason',
        headerName: 'Rejection Note',
        width: 160,
        valueGetter: (p: any) => p.data?.rejectionReason || '—',
        cellClass: 'cell-flex-center text-error text-xs font-semibold ellipsis',
        tooltipValueGetter: (p: any) => p.data?.rejectionReason || ''
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        sortable: true,
        cellRenderer: (p: any) => {
          if (p.node?.rowPinned) return '';
          const status = (p.value || 'pending').toLowerCase();
          const map: Record<string, { class: string; label: string }> = {
            approved: { class: 'badge-success-soft', label: '✓ Approved' },
            rejected: { class: 'badge-danger-soft', label: '✗ Rejected' },
            pending: { class: 'badge-warning-soft', label: '⏳ Pending' }
          };
          const s = map[status] ?? map['pending'];
          return `<span class="grid-badge ${s.class}">${s.label}</span>`;
        },
        cellClass: 'cell-flex-center'
      },
      {
        headerName: 'Actions',
        width: 110,
        suppressSizeToFit: true,
        sortable: false,
        filter: false,
        pinned: 'right',
        cellRenderer: ActionButtonsRenderer,
        cellRendererParams: {
          onAction: (row: any, actionType: 'approve' | 'reject') => this.openActionDialog(row, actionType)
        }
      }
    ];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}// import { ChangeDetectorRef, Component, OnInit, inject, signal, OnDestroy } from '@angular/core';

// import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
// import { Router, ActivatedRoute, RouterModule } from '@angular/router';
// import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';
// import { toSignal } from '@angular/core/rxjs-interop';
// import { GridApi, GridReadyEvent } from 'ag-grid-community';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { TooltipModule } from 'primeng/tooltip';
// import { DatePickerModule } from 'primeng/datepicker';
// import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
// import { SalesReturnActionDialogComponent } from '../sales-return-action-dialog/sales-return-action-dialog';

// // Services
// import { AppMessageService } from '../../../../core/services/message.service';
// import { CommonMethodService } from '../../../../core/utils/common-method.service';
// import { SalesReturnService, GetSalesReturnsQuery } from '../../../../core/services/sales.return.service';
// import { AgShareGrid } from '../../../shared/components/ag-shared-grid';
// import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
// import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
// import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
// import { Toast } from 'primeng/toast';
// import { Subject } from "rxjs";

// // ============================================================================
// // Custom Cell Renderer for Action Buttons
// // ============================================================================
// @Component({
//   selector: 'app-action-buttons-renderer',
//   standalone: true,
//   template: `
//     @if (params?.data?.status?.toLowerCase() === 'pending') {
//       <div class="flex gap-1 items-center h-full">
//         <button class="p-button-sm p-button-success p-button-text p-button-rounded action-btn approve-btn"
//                 style="padding: 0; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: rgba(16, 185, 129, 0.1); border: none; color: #10b981; cursor: pointer; border-radius: 50%; transition: all 0.2s;"
//                 title="Approve"
//                 (click)="onClick('approve', $event)">
//           <i class="pi pi-check" style="font-size: 0.8rem;"></i>
//         </button>
//         <button class="p-button-sm p-button-danger p-button-text p-button-rounded action-btn reject-btn"
//                 style="padding: 0; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.1); border: none; color: #ef4444; cursor: pointer; border-radius: 50%; transition: all 0.2s;"
//                 title="Reject"
//                 (click)="onClick('reject', $event)">
//           <i class="pi pi-ban" style="font-size: 0.8rem;"></i>
//         </button>
//       </div>
//     }
//   `
// })
// export class ActionButtonsRenderer {
//   params: any;

//   agInit(params: any): void {
//     this.params = params;
//   }

//   refresh(params: any): boolean {
//     this.params = params;
//     return true;
//   }

//   onClick(action: 'approve' | 'reject', event: Event) {
//     event.stopPropagation(); // Prevents the grid cellClicked event from firing
//     if (this.params.onAction) {
//       this.params.onAction(this.params.data, action);
//     }
//   }
// }
// // ============================================================================

// @Component({
//   selector: 'app-sales-return-list',
//   standalone: true,
//   imports: [
//     SelectModule,
//     FormsModule,
//     ReactiveFormsModule,
//     ButtonModule,
//     InputTextModule,
//     RouterModule,
//     TooltipModule,
//     AgShareGrid,
//     Toast,
//     DatePickerModule,
//     HasPermissionDirective,
//     DynamicDialogModule,
//     MasterDropdownComponent
//   ],
//   templateUrl: './sales-return-list.html',
//   styleUrl: './sales-return-list.scss',
//   providers: [DialogService]
// })
// export class SalesReturnListComponent implements OnInit, OnDestroy {
//   private readonly destroy$ = new Subject<void>();
//   readonly PERMISSIONS = PERMISSIONS;

//   private cdr = inject(ChangeDetectorRef);
//   private salesReturnService = inject(SalesReturnService);
//   private messageService = inject(AppMessageService);
//   private router = inject(Router);
//   public common = inject(CommonMethodService);
//   private dialogService = inject(DialogService);

//   private gridApi!: GridApi;
//   private currentPage = 1;
//   private pageSize = 50;
//   private totalCount = 0;

//   isLoading = signal(false);
//   data = signal<any[]>([]);

//   // Filters
//   searchControl = new FormControl('');
//   searchQuery = toSignal(this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()), { initialValue: '' });

//   filter: {
//     status: string | null;
//     branchId: string | null;
//     dateRange: [Date | null, Date | null] | null;
//   } = {
//       status: null,
//       branchId: null,
//       dateRange: null
//     };

//   statusOptions = [
//     { label: 'Pending', value: 'pending' },
//     { label: 'Approved', value: 'approved' },
//     { label: 'Rejected', value: 'rejected' }
//   ];

//   column: any = [];

//   constructor() { }

//   ngOnInit(): void {
//     this.getColumn();
//     this.getData(true);

//     this.searchControl.valueChanges.pipe(
//       debounceTime(400),
//       distinctUntilChanged(), takeUntil(this.destroy$)
//     ).subscribe(() => {
//       this.applyFilters();
//     });
//   }

//   onGridReady(params: GridReadyEvent) {
//     this.gridApi = params.api;
//   }

//   applyFilters() {
//     this.getData(true);
//   }

//   resetFilters() {
//     this.searchControl.setValue('', { emitEvent: false });
//     this.filter = { status: null, branchId: null, dateRange: null };
//     this.getData(true);
//   }

//   getData(isReset: boolean = false) {
//     if (this.isLoading() && !isReset) return;

//     this.isLoading.set(true);

//     if (isReset) {
//       this.currentPage = 1;
//       this.data.set([]);
//     }

//     const query: GetSalesReturnsQuery = {
//       page: this.currentPage,
//       limit: this.pageSize,
//       status: this.filter.status || undefined,
//       branchId: this.filter.branchId || undefined,
//       search: this.searchControl.value || undefined
//     };

//     if (this.filter.dateRange && this.filter.dateRange.length === 2 && this.filter.dateRange[1]) {
//       query.startDate = this.filter.dateRange[0]?.toISOString();
//       query.endDate = this.filter.dateRange[1]?.toISOString();
//     }

//     this.salesReturnService.getSalesReturns(query)
//       .pipe(finalize(() => {
//         this.isLoading.set(false);
//         this.cdr.markForCheck();
//       }), takeUntil(this.destroy$))
//       .subscribe({
//         next: (res: any) => {
//           const newData = res.data?.returns || res.data?.data || res.results || [];
//           this.totalCount = res.total || res.pagination?.totalResults || res.results?.length || 0;

//           if (isReset) {
//             this.data.set(newData);
//           } else {
//             this.data.update(prev => [...prev, ...newData]);
//           }

//           if (newData.length > 0 && this.data().length < this.totalCount) {
//             this.currentPage++;
//           }
//         },
//         error: (err) => {
//           this.messageService.handleHttpError(err);
//         }
//       });
//   }

//   onScrolledToBottom(_: any) {
//     if (!this.isLoading() && this.data().length < this.totalCount) {
//       this.getData(false);
//     }
//   }

//   eventFromGrid(event: any) {
//     if (event.type === 'init') {
//       this.gridApi = event.api;
//     }

//     if (event.type === 'cellClicked') {
//       const rowData = event.row || event.data;

//       if (event.field === 'returnNumber') {
//       } else if (event.field === 'invoiceId.invoiceNumber' || event.field === 'invoiceId') {
//         const invoiceId = rowData?.invoiceId?._id || rowData?.invoiceId;
//         if (invoiceId) this.router.navigate(['/invoices', invoiceId]);
//       }
//     }

//     if (event.type === 'reachedBottom') {
//       this.onScrolledToBottom(event);
//     }
//   }

//   openActionDialog(row: any, actionType: 'approve' | 'reject') {
//     const ref = this.dialogService.open(SalesReturnActionDialogComponent, {
//       header: actionType === 'approve' ? 'Approve Return' : 'Reject Return',
//       width: '500px',
//       contentStyle: { 'background': 'transparent', 'padding': '0' },
//       closable: true,
//       data: {
//         actionType,
//         returnId: row._id,
//         returnNumber: row.returnNumber
//       }
//     });

//     ref?.onClose.pipe(takeUntil(this.destroy$)).subscribe((result) => {
//       if (result) {
//         this.getData(true);
//       }
//     });
//   }

//   getColumn(): void {
//     this.column = [
//       {
//         field: 'returnDate',
//         headerName: 'Return Date',
//         width: 150,
//         sortable: true,
//         valueFormatter: (p: any) => this.common.formatDate(p.value, 'dd MMM yyyy'),
//         cellStyle: {
//           'color': 'var(--text-secondary)',
//           'font-size': '13.5px',
//           'display': 'flex',
//           'align-items': 'center'
//         }
//       },
//       {
//         field: 'returnNumber',
//         headerName: 'Return #',
//         width: 140,
//         sortable: true,
//         cellStyle: {
//           'font-weight': '600',
//           'color': 'var(--accent-primary)',
//           'font-size': '13.5px',
//           'display': 'flex',
//           'align-items': 'center'
//         }
//       },
//       {
//         field: 'invoiceId.invoiceNumber',
//         headerName: 'Invoice #',
//         width: 185,
//         valueGetter: (p: any) => p.data?.invoiceId?.invoiceNumber || '—',
//         cellStyle: {
//           'font-weight': '500',
//           'color': 'var(--color-info)',
//           'cursor': 'pointer',
//           'font-size': '13.5px',
//           'display': 'flex',
//           'align-items': 'center'
//         }
//       },
//       {
//         field: 'customerId.name',
//         headerName: 'Customer',
//         flex: 1,
//         minWidth: 180,
//         valueGetter: (p: any) => p.data?.customerId?.name || '—',
//         cellStyle: {
//           'font-weight': '500',
//           'font-size': '13.5px',
//           'display': 'flex',
//           'align-items': 'center'
//         }
//       },
//       {
//         field: 'customerId.phone',
//         headerName: 'Phone',
//         width: 145,
//         valueGetter: (p: any) => p.data?.customerId?.phone || '—',
//         cellStyle: {
//           'color': 'var(--text-secondary)',
//           'font-size': '13px',
//           'font-family': 'var(--font-mono)',
//           'display': 'flex',
//           'align-items': 'center'
//         }
//       },
//       {
//         field: 'items',
//         headerName: 'Items',
//         width: 220,
//         sortable: false,
//         valueGetter: (p: any) => {
//           const items = p.data?.items || [];
//           if (!items.length) return '—';
//           return items.map((i: any) => `${i.name} ×${i.quantity}`).join(', ');
//         },
//         cellStyle: {
//           'color': 'var(--text-secondary)',
//           'font-size': '13px',
//           'overflow': 'hidden',
//           'text-overflow': 'ellipsis',
//           'white-space': 'nowrap',
//           'display': 'flex',
//           'align-items': 'center'
//         },
//         tooltipValueGetter: (p: any) => {
//           const items = p.data?.items || [];
//           return items.map((i: any) => `${i.name} ×${i.quantity} @ ₹${i.unitPrice}`).join('\n');
//         }
//       },
//       {
//         field: 'reason',
//         headerName: 'Reason',
//         width: 140,
//         valueFormatter: (p: any) =>
//           p.value ? p.value.charAt(0).toUpperCase() + p.value.slice(1) : '—',
//         cellStyle: {
//           'color': 'var(--text-secondary)',
//           'font-size': '13.5px',
//           'display': 'flex',
//           'align-items': 'center'
//         }
//       },
//       {
//         field: 'subTotal',
//         headerName: 'Sub Total',
//         width: 130,
//         sortable: true,
//         type: 'rightAligned',
//         valueFormatter: (p: any) => this.common.formatCurrency(p.value ?? 0),
//         cellStyle: {
//           'font-family': 'var(--font-mono)',
//           'font-size': '13px',
//           'color': 'var(--text-secondary)',
//           'display': 'flex',
//           'align-items': 'center',
//           'justify-content': 'flex-end'
//         }
//       },
//       {
//         field: 'taxTotal',
//         headerName: 'Tax',
//         width: 110,
//         sortable: true,
//         type: 'rightAligned',
//         valueFormatter: (p: any) => this.common.formatCurrency(p.value ?? 0),
//         cellStyle: {
//           'font-family': 'var(--font-mono)',
//           'font-size': '13px',
//           'color': 'var(--text-secondary)',
//           'display': 'flex',
//           'align-items': 'center',
//           'justify-content': 'flex-end'
//         }
//       },
//       {
//         field: 'totalRefundAmount',
//         headerName: 'Refund Amt',
//         width: 145,
//         sortable: true,
//         type: 'rightAligned',
//         valueFormatter: (p: any) => this.common.formatCurrency(p.value ?? 0),
//         cellStyle: (p: any) => ({
//           'font-family': 'var(--font-mono)',
//           'font-size': '14px',
//           'font-weight': '700',
//           'color': p.value > 0 ? 'var(--color-error)' : 'var(--text-primary)',
//           'display': 'flex',
//           'align-items': 'center',
//           'justify-content': 'flex-end'
//         })
//       },
//       {
//         field: 'approvedBy',
//         headerName: 'Actioned By',
//         width: 150,
//         valueGetter: (p: any) => {
//           const row = p.data;
//           if (row?.approvedBy?.name) return `✓ ${row.approvedBy.name}`;
//           if (row?.rejectedBy?.name) return `✗ ${row.rejectedBy.name}`;
//           return '—';
//         },
//         cellStyle: (p: any) => {
//           const row = p.data;
//           const color = row?.approvedBy?.name
//             ? 'var(--color-success)'
//             : row?.rejectedBy?.name
//               ? 'var(--color-error)'
//               : 'var(--text-secondary)';
//           return {
//             'color': color,
//             'font-size': '13px',
//             'font-weight': '500',
//             'display': 'flex',
//             'align-items': 'center'
//           };
//         }
//       },
//       {
//         field: 'rejectionReason',
//         headerName: 'Rejection Note',
//         width: 160,
//         valueGetter: (p: any) => p.data?.rejectionReason || '—',
//         cellStyle: {
//           'color': 'var(--color-error)',
//           'font-size': '13px',
//           'font-style': 'italic',
//           'overflow': 'hidden',
//           'text-overflow': 'ellipsis',
//           'white-space': 'nowrap',
//           'display': 'flex',
//           'align-items': 'center'
//         },
//         tooltipValueGetter: (p: any) => p.data?.rejectionReason || ''
//       },
//       {
//         field: 'status',
//         headerName: 'Status',
//         width: 130,
//         sortable: true,
//         cellRenderer: (p: any) => {
//           if (p.node?.rowPinned) return '';
//           const status = (p.value || 'pending').toLowerCase();
//           const map: Record<string, { bg: string; color: string; label: string }> = {
//             approved: { bg: 'var(--color-success-bg)', color: 'var(--color-success-dark)', label: '✓ Approved' },
//             rejected: { bg: 'var(--color-error-bg)', color: 'var(--color-error-dark)', label: '✗ Rejected' },
//             pending: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning-dark)', label: '⏳ Pending' }
//           };
//           const s = map[status] ?? map['pending'];
//           return `
//           <span style="
//             display:inline-flex; align-items:center;
//             padding:3px 10px; border-radius:20px;
//             font-size:12px; font-weight:600; white-space:nowrap;
//             background:${s.bg}; color:${s.color};
//           ">${s.label}</span>`;
//         },
//         cellStyle: {
//           'display': 'flex',
//           'align-items': 'center'
//         }
//       },
//       {
//         headerName: 'Actions',
//         width: 110,
//         suppressSizeToFit: true,
//         sortable: false,
//         filter: false,
//         pinned: 'right',
//         cellRenderer: ActionButtonsRenderer,
//         cellRendererParams: {
//           onAction: (row: any, actionType: 'approve' | 'reject') =>
//             this.openActionDialog(row, actionType)
//         },
//         cellStyle: {
//           'display': 'flex',
//           'align-items': 'center',
//           'justify-content': 'center'
//         }
//       }
//     ];
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }
