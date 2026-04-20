import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { GridApi } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { Toast } from 'primeng/toast';

import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
// import { MasterListService } from '../../../../core/services/master-list.service';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
import { AppMessageService } from '../../../../core/services/message.service';
import { PaymentService } from '../../services/payment-service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { finalize, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PaymentFilter {
  type: string | null;
  customerId: string | null;
  supplierId: string | null;
  paymentMethod: string | null;
  status: string | null;
}

interface PillConfig {
  label: string;
  bg: string;
  color: string;
  dot?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-payment-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    RouterModule,
    Toast,
    AgShareGrid,
    HasPermissionDirective,
    CurrencyPipe,
    MasterDropdownComponent,
  ],
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss',
})
export class PaymentListComponent implements OnInit, OnDestroy {

  // ── DI ────────────────────────────────────────────────────────────────────
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly payment = inject(PaymentService);
  private readonly msg = inject(AppMessageService);
  private readonly common = inject(CommonMethodService);
  // readonly masterList = inject(MasterListService);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  private readonly destroy$ = new Subject<void>();

  // ── Permissions ───────────────────────────────────────────────────────────
  readonly PERMISSIONS = PERMISSIONS;

  readonly paymentActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: false,
    showDelete: false,
    viewPermission: PERMISSIONS.PAYMENT.READ,
  };

  // ── Grid API ──────────────────────────────────────────────────────────────
  private gridApi!: GridApi;

  // ── Pagination (plain — not reactive) ─────────────────────────────────────
  private currentPage = 1;
  private totalPages = 1;
  private pageSize = 50;

  // ─────────────────────────────────────────────────────────────────────────
  // Signals — declare DATA first, all computed() depend on it
  // ─────────────────────────────────────────────────────────────────────────

  readonly isLoading = signal(false);
  readonly totalCount = signal(0);           // server-reported total (for pagination)

  /** All rows currently held in the grid */
  readonly data = signal<any[]>([]);

  /** Column definitions — built once on init */
  readonly column = signal<any[]>([]);

  // ── Lookup lists ──────────────────────────────────────────────────────────
  readonly customerOptions = signal<any[]>([]);
  readonly supplierOptions = signal<any[]>([]);

  // ─────────────────────────────────────────────────────────────────────────
  // Computed summaries (ALL depend on data — keep below data signal)
  // ─────────────────────────────────────────────────────────────────────────

  /** Sum of all inflow amounts in the loaded set */
  readonly totalInflow = computed(() =>
    this.data()
      .filter(r => r.type === 'inflow')
      .reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0)
  );

  /** Sum of all outflow amounts in the loaded set */
  readonly totalOutflow = computed(() =>
    this.data()
      .filter(r => r.type === 'outflow')
      .reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0)
  );

  /** Net position: inflow minus outflow */
  readonly netPosition = computed(() => this.totalInflow() - this.totalOutflow());

  /** Total unrecovered amount still owed across all loaded rows */
  readonly totalRemaining = computed(() =>
    this.data().reduce((sum: number, r: any) => sum + (r.remainingAmount ?? 0), 0)
  );

  /** Rows with status = completed */
  readonly completedCount = computed(() =>
    this.data().filter(r => r.status === 'completed').length
  );

  /** Rows with status = pending or failed (need attention) */
  readonly pendingCount = computed(() =>
    this.data().filter(r => r.status === 'pending' || r.status === 'failed').length
  );

  /** Rows fully reconciled */
  readonly fullyAllocatedCount = computed(() =>
    this.data().filter(r => r.allocationStatus === 'fully_allocated').length
  );

  /** Rows unreconciled or only partially reconciled */
  readonly unallocatedCount = computed(() =>
    this.data().filter(
      r => r.allocationStatus === 'unallocated' || r.allocationStatus === 'partially_allocated'
    ).length
  );

  /** True when the server has more pages and we are not already loading */
  readonly canLoadMore = computed(
    () => !this.isLoading() && this.data().length < this.totalCount()
  );

  // ── Filter signal ─────────────────────────────────────────────────────────
  readonly filter = signal<PaymentFilter>({
    type: null,
    customerId: null,
    supplierId: null,
    paymentMethod: null,
    status: null,
  });

  // ── Static option lists ───────────────────────────────────────────────────
  readonly typeOptions = [
    { label: 'Inflow (Received)', value: 'inflow' },
    { label: 'Outflow (Made)', value: 'outflow' },
  ];

  readonly paymentMethodOptions = [
    { label: 'Cash', value: 'cash' },
    { label: 'UPI', value: 'upi' },
    { label: 'NEFT', value: 'neft' },
    { label: 'RTGS', value: 'rtgs' },
    { label: 'Card', value: 'card' },
    { label: 'Cheque', value: 'cheque' },
    { label: 'Other', value: 'other' },
  ];

  readonly statusOptions = [
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  readonly rowSelectionMode = 'single';

  // ─────────────────────────────────────────────────────────────────────────
  // Constructor
  // ─────────────────────────────────────────────────────────────────────────
  constructor() {
    // effect(() => {
    //   this.customerOptions.set(this.masterList.customers());
    //   this.supplierOptions.set(this.masterList.suppliers());
    // });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.column.set(this.buildColumns());
    this.loadData(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Filter helpers
  // ─────────────────────────────────────────────────────────────────────────
  patchFilter(patch: Partial<PaymentFilter>): void {
    this.filter.update(f => ({ ...f, ...patch }));
  }

  applyFilters(): void {
    this.loadData(true);
  }

  resetFilters(): void {
    this.filter.set({
      type: null,
      customerId: null,
      supplierId: null,
      paymentMethod: null,
      status: null,
    });
    this.loadData(true);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Data loading
  // ─────────────────────────────────────────────────────────────────────────
  loadData(reset = false): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    if (reset) {
      this.currentPage = 1;
      this.data.set([]);
      this.totalCount.set(0);
    }

    const params = {
      ...this.filter(),
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.payment.getAllPayments(params)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res: any) => {
          const newRows = res.data?.data ?? [];
          const pagination = res.data?.pagination;

          if (pagination) {
            this.totalCount.set(pagination.totalResults);
            this.totalPages = pagination.totalPages;
          }

          if (reset) {
            this.data.set(newRows);
          } else {
            this.data.update(existing => [...existing, ...newRows]);
            this.gridApi?.applyTransaction({ add: newRows });
          }

          this.currentPage++;
        },
        error: (err: any) => this.msg.handleHttpError(err),
      });
  }

  onScrolledToBottom(): void {
    if (this.canLoadMore()) this.loadData(false);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Grid event bus
  // ─────────────────────────────────────────────────────────────────────────
  eventFromGrid(event: any): void {
    switch (event.type) {
      case 'init':
        this.gridApi = event.api;
        break;
      case 'cellClicked': {
        const id = event.row?._id;
        if (id) this.router.navigate([id], { relativeTo: this.route });
        break;
      }
      case 'reachedBottom':
        this.onScrolledToBottom();
        break;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Column definitions
  // ─────────────────────────────────────────────────────────────────────────
  private buildColumns(): any[] {
    return [

      // ── # ─────────────────────────────────────────────────────────────────
      {
        headerName: '#',
        valueGetter: 'node.rowIndex + 1',
        width: 48,
        sortable: false,
        filter: false,
        suppressHeaderMenuButton: true,
        pinned: 'left',
        cellStyle: {
          color: 'var(--text-tertiary)',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      },

      // ── Date ──────────────────────────────────────────────────────────────
      {
        field: 'paymentDate',
        headerName: 'Date',
        width: 120,
        sortable: true,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        cellRenderer: (p: any) => {
          if (!p.value) return '<span style="color:var(--text-tertiary)">—</span>';
          return this.twoLine(
            this.common.formatDate(p.value, 'dd MMM yyyy'),
            this.common.formatDate(p.value, 'hh:mm a'),
            'font-size:12px;font-weight:500;color:var(--text-primary);',
            'font-size:10px;color:var(--text-tertiary);font-family:var(--font-mono);',
          );
        },
      },

      // ── Type ──────────────────────────────────────────────────────────────
      {
        field: 'type',
        headerName: 'Type',
        width: 90,
        sortable: true,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 10px' },
        cellRenderer: (p: any) => {
          const isIn = (p.value ?? '').toLowerCase() === 'inflow';
          return this.pill(
            isIn ? '↑ In' : '↓ Out',
            isIn ? '#EAF3DE' : '#FCEBEB',
            isIn ? '#27500A' : '#791F1F',
          );
        },
      },

      // ── Entity ────────────────────────────────────────────────────────────
      {
        headerName: 'Entity',
        flex: 1,
        minWidth: 200,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        cellRenderer: (p: any) => {
          const isIn = p.data?.type === 'inflow';
          const name = isIn
            ? (p.data?.customerId?.name || 'Walk-in Customer')
            : (p.data?.supplierId?.companyName || 'Unknown Supplier');
          const sub = isIn
            ? (p.data?.customerId?.phone || p.data?.customerId?.email || '—')
            : (p.data?.supplierId?.gstin || 'Supplier');
          const branch = p.data?.branchId?.name || '';
          const avatar = this.common.getAvatarStyle(name);
          const initials = this.common.getInitials(name);

          return `
            <div style="display:flex;align-items:center;gap:8px;min-width:0;padding:6px 0;">
              <span style="width:28px;height:28px;border-radius:50%;flex-shrink:0;
                background:${avatar.background};color:${avatar.color};
                display:inline-flex;align-items:center;justify-content:center;
                font-size:9px;font-weight:700;">${initials}</span>
              <div style="min-width:0;flex:1;overflow:hidden;">
                <div style="font-size:12.5px;font-weight:500;color:var(--text-primary);
                  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
                <div style="font-size:11px;color:var(--text-secondary);margin-top:1px;
                  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sub}</div>
                ${branch ? `<span style="font-size:10px;color:var(--text-tertiary);display:block;
                  margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${branch}</span>` : ''}
              </div>
            </div>`;
        },
        tooltipValueGetter: (p: any) =>
          p.data?.customerId?.name ?? p.data?.supplierId?.companyName ?? 'Walk-in',
      },

      // ── Invoice ───────────────────────────────────────────────────────────
      {
        headerName: 'Invoice',
        width: 148,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        cellRenderer: (p: any) => {
          const inv = p.data?.invoiceId;
          if (!inv) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
          return this.twoLine(
            `<span style="font-family:var(--font-mono);font-size:11.5px;font-weight:600;color:#185FA5;">${inv.invoiceNumber}</span>`,
            `Total: ${this.common.formatCurrency(inv.grandTotal)}`,
            '',
            'font-size:10.5px;color:var(--text-secondary);',
          );
        },
      },

      // ── Amount ────────────────────────────────────────────────────────────
      {
        field: 'amount',
        headerName: 'Amount',
        width: 148,
        sortable: true,
        type: 'rightAligned',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
        cellRenderer: (p: any) => {
          const isIn = p.data?.type === 'inflow';
          const color = isIn ? '#27500A' : '#791F1F';
          const prefix = isIn ? '+' : '−';
          const rem = p.data?.remainingAmount ?? 0;
          return this.twoLine(
            `<span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${color};">
              ${prefix} ${this.common.formatCurrency(p.data?.amount ?? 0)}
            </span>`,
            rem > 0
              ? `<span style="font-size:10px;color:var(--text-tertiary);">Rem: ${this.common.formatCurrency(rem)}</span>`
              : '',
            'text-align:right;',
            'text-align:right;',
          );
        },
      },

      // ── Method ────────────────────────────────────────────────────────────
      {
        field: 'paymentMethod',
        headerName: 'Method',
        width: 90,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 10px' },
        cellRenderer: (p: any) => {
          const m = (p.value || 'other').toLowerCase();
          const map: Record<string, PillConfig> = {
            cash: { label: 'Cash', bg: '#EAF3DE', color: '#27500A' },
            upi: { label: 'UPI', bg: '#E6F1FB', color: '#0C447C' },
            card: { label: 'Card', bg: '#EEEDFE', color: '#3C3489' },
            neft: { label: 'NEFT', bg: '#FAEEDA', color: '#633806' },
            rtgs: { label: 'RTGS', bg: '#FAEEDA', color: '#633806' },
            bank_transfer: { label: 'Bank', bg: '#FAEEDA', color: '#633806' },
            cheque: { label: 'Cheque', bg: '#FBEAF0', color: '#72243E' },
          };
          const cfg = map[m] ?? { label: m.toUpperCase(), bg: '#F1EFE8', color: '#444441' };
          return this.pill(cfg.label, cfg.bg, cfg.color, true);
        },
      },

      // ── Mode ──────────────────────────────────────────────────────────────
      {
        field: 'transactionMode',
        headerName: 'Mode',
        width: 80,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 10px' },
        cellRenderer: (p: any) => {
          const m = (p.value || '').toLowerCase();
          const isAuto = m === 'auto';
          return `<span style="font-size:11px;font-weight:500;
            color:${isAuto ? '#0C447C' : 'var(--text-secondary)'};
            background:${isAuto ? '#E6F1FB' : '#F1EFE8'};
            padding:2px 8px;border-radius:4px;
            text-transform:capitalize;white-space:nowrap;">${m || '—'}</span>`;
        },
      },

      // ── Status ────────────────────────────────────────────────────────────
      {
        field: 'status',
        headerName: 'Status',
        width: 115,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 10px' },
        cellRenderer: (p: any) => {
          const s = (p.value || '').toLowerCase();
          const map: Record<string, PillConfig> = {
            completed: { label: 'Completed', bg: '#EAF3DE', color: '#27500A', dot: '#3B6D11' },
            pending: { label: 'Pending', bg: '#FAEEDA', color: '#633806', dot: '#854F0B' },
            failed: { label: 'Failed', bg: '#FCEBEB', color: '#791F1F', dot: '#A32D2D' },
            cancelled: { label: 'Cancelled', bg: '#F1EFE8', color: '#444441', dot: '#888780' },
          };
          const cfg = map[s] ?? { label: s, bg: '#F1EFE8', color: '#444441', dot: '#888780' };
          const dot = `<span style="width:5px;height:5px;border-radius:50%;
            background:${cfg.dot};flex-shrink:0;display:inline-block;"></span>`;
          return `<span style="display:inline-flex;align-items:center;gap:5px;
            font-size:11px;font-weight:500;padding:3px 8px;border-radius:4px;white-space:nowrap;
            background:${cfg.bg};color:${cfg.color};">${dot}${cfg.label}</span>`;
        },
      },

      // ── Allocation ────────────────────────────────────────────────────────
      {
        field: 'allocationStatus',
        headerName: 'Allocation',
        width: 135,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 10px' },
        cellRenderer: (p: any) => {
          const a = (p.value || '').toLowerCase();
          const map: Record<string, PillConfig> = {
            fully_allocated: { label: 'Fully allocated', bg: '#E6F1FB', color: '#0C447C' },
            partially_allocated: { label: 'Partial', bg: '#FAEEDA', color: '#633806' },
            unallocated: { label: 'Unallocated', bg: '#F1EFE8', color: '#444441' },
          };
          const cfg = map[a] ?? { label: a.replace(/_/g, ' '), bg: '#F1EFE8', color: '#444441' };
          return this.pill(cfg.label, cfg.bg, cfg.color);
        },
      },

      // ── Remarks ───────────────────────────────────────────────────────────
      {
        field: 'remarks',
        headerName: 'Remarks',
        flex: 1,
        minWidth: 160,
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
        valueGetter: (p: any) => p.data?.remarks || '—',
        tooltipValueGetter: (p: any) => p.data?.remarks || '',
      },

    ];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HTML cell helpers
  // ─────────────────────────────────────────────────────────────────────────

  private twoLine(
    top: string,
    bottom: string,
    topStyle = 'font-size:12px;color:var(--text-primary);font-weight:500;',
    bottomStyle = 'font-size:10px;color:var(--text-tertiary);',
  ): string {
    return `
      <div style="display:flex;flex-direction:column;justify-content:center;gap:1px;
        line-height:1.25;overflow:hidden;">
        <span style="${topStyle}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${top}</span>
        ${bottom ? `<span style="${bottomStyle}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${bottom}</span>` : ''}
      </div>`;
  }

  private pill(label: string, bg: string, color: string, uppercase = false): string {
    return `<span style="
      display:inline-flex;align-items:center;
      padding:2px 8px;border-radius:4px;
      font-size:11px;font-weight:600;
      letter-spacing:${uppercase ? '.04em' : '.01em'};
      white-space:nowrap;line-height:16px;
      ${uppercase ? 'text-transform:uppercase;' : ''}
      background:${bg};color:${color};">
      ${label}
    </span>`;
  }
}