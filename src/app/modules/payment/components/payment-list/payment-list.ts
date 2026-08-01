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

import { DataGridComponent, GridColumn } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
// import { MasterListService } from '../../../../core/services/master-list.service';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
import { AppMessageService } from '../../../../core/services/message.service';
import { PaymentService } from '../../services/payment-service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { finalize, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActionColumnConfig } from '../../../shared/components/ag-shared-grid';

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
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
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
          const rawRows = res.data?.data ?? [];
          const newRows = rawRows.map((r: any) => {
            const isIn = r.type === 'inflow';
            const customer = r.customerId;
            const supplier = r.supplierId;
            const entityName = isIn
              ? (customer?.name || 'Walk-in Customer')
              : (supplier?.companyName || 'Unknown Supplier');
            
            const ref = r.invoiceId || r.purchaseId;
            const referenceText = ref ? ref.invoiceNumber : '—';
            
            return {
              ...r,
              entityName,
              referenceText
            };
          });
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
  private buildColumns(): GridColumn[] {
    return [
      {
        field: 'paymentDate',
        header: 'Date',
        width: '120px',
        sortable: true,
        formatter: (val: any) => val ? this.common.formatDate(val, 'dd MMM yyyy') : '—'
      },
      {
        field: 'type',
        header: 'Type',
        type: 'badge',
        width: '110px',
        sortable: true
      },
      {
        field: 'entityName',
        header: 'Entity',
        type: 'user',
        width: '1fr',
        minWidth: '200px'
      },
      {
        field: 'referenceText',
        header: 'Reference',
        width: '148px'
      },
      {
        field: 'amount',
        header: 'Amount',
        type: 'currency',
        currencyCode: 'INR',
        width: '148px',
        sortable: true,
        align: 'right'
      },
      {
        field: 'paymentMethod',
        header: 'Method',
        type: 'badge',
        width: '100px'
      },
      {
        field: 'transactionMode',
        header: 'Mode',
        type: 'badge',
        width: '100px'
      },
      {
        field: 'status',
        header: 'Status',
        type: 'badge',
        width: '115px'
      },
      {
        field: 'allocationStatus',
        header: 'Allocation',
        type: 'badge',
        width: '135px'
      },
      {
        field: 'remarks',
        header: 'Remarks',
        width: '1fr',
        minWidth: '160px',
        formatter: (val: any) => val || '—'
      }
    ];
  }
}