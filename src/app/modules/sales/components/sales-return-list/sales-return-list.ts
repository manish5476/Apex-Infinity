import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

// Shared UI
import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';

// Core
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { AppMessageService } from '../../../../core/services/message.service';
import { GetSalesReturnsQuery, SalesReturnService } from '../../../../core/services/sales.return.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
import { SalesReturnActionDialogComponent } from '../sales-return-action-dialog/sales-return-action-dialog';

@Component({
  selector: 'app-sales-return-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    SelectModule,
    TooltipModule,
    DatePickerModule,
    ToastModule,
    DynamicDialogModule,
    HasPermissionDirective,
    MasterDropdownComponent,
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
  ],
  providers: [DialogService],
  template: `
    <p-toast position="bottom-right" appendTo="body"></p-toast>

    <app-page>
      <app-page-header
        title="Sales Returns"
        subtitle="Track and manage credit notes & product returns">
        <div header-right class="flex items-center gap-3">
          <p-button
            icon="pi pi-refresh"
            [text]="true"
            [rounded]="true"
            severity="secondary"
            [loading]="isLoading()"
            (onClick)="getData(true)"
            pTooltip="Refresh"
            tooltipPosition="bottom">
          </p-button>
          <p-button
            *hasPermission="PERMISSIONS.SALES.MANAGE"
            label="New Return"
            icon="pi pi-plus"
            routerLink="/invoices">
          </p-button>
        </div>
      </app-page-header>

      <app-page-content [padded]="true">
        <!-- ── Filter Bar ─────────────────────────────────────────────── -->
        <div class="flex items-end gap-3 flex-wrap mb-4 p-3
                    bg-[var(--bg-secondary)] border border-[var(--border-secondary)]
                    rounded-[var(--ui-border-radius-lg)]">

          <!-- Search -->
          <div class="flex flex-col gap-1 flex-[2] min-w-[220px]">
            <label class="text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)]
                          text-[var(--text-secondary)] uppercase tracking-wide">Search</label>
            <div class="flex items-center gap-2 px-3 py-2
                        bg-[var(--bg-primary)] border border-[var(--border-secondary)]
                        rounded-[var(--ui-border-radius-md)]
                        focus-within:border-[var(--accent-primary)]
                        focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent-primary)_15%,transparent)]
                        transition-all duration-150">
              <i class="pi pi-search text-[11px] text-[var(--text-tertiary)] shrink-0"></i>
              <input type="text" [formControl]="searchControl"
                     placeholder="Return #, Invoice #..."
                     class="flex-1 bg-transparent border-none outline-none
                            text-[length:var(--font-size-sm)] text-[var(--text-primary)]
                            placeholder:text-[var(--text-tertiary)] w-full" />
            </div>
          </div>

          <!-- Status -->
          <div class="flex flex-col gap-1 min-w-[160px]">
            <label class="text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)]
                          text-[var(--text-secondary)] uppercase tracking-wide">Status</label>
            <p-select [options]="statusOptions" [(ngModel)]="filter.status"
                      (onChange)="applyFilters()" placeholder="All Statuses"
                      [showClear]="true" styleClass="w-full">
            </p-select>
          </div>

          <!-- Branch -->
          <div class="flex flex-col gap-1 min-w-[180px]">
            <label class="text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)]
                          text-[var(--text-secondary)] uppercase tracking-wide">Branch</label>
            <app-master-dropdown endpoint="branches" [(ngModel)]="filter.branchId"
                                 (onChange)="applyFilters()" placeholder="All Branches">
            </app-master-dropdown>
          </div>

          <!-- Date Range -->
          <div class="flex flex-col gap-1 min-w-[200px] relative">
            <label class="text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)]
                          text-[var(--text-secondary)] uppercase tracking-wide">Date Range</label>
            <p-datepicker [(ngModel)]="filter.dateRange" selectionMode="range"
                          (onSelect)="applyFilters()" placeholder="Start – End"
                          appendTo="body" [showIcon]="true"
                          styleClass="w-full" inputStyleClass="w-full">
            </p-datepicker>
            @if (filter.dateRange) {
              <button type="button"
                      class="absolute right-10 bottom-[9px] text-[var(--text-tertiary)]
                             hover:text-[var(--text-primary)] transition-colors z-10"
                      (click)="resetDateRange()">
                <i class="pi pi-times text-[10px]"></i>
              </button>
            }
          </div>

          <!-- Clear Filters -->
          <div class="flex items-end pb-0.5">
            <button type="button"
                    class="flex items-center gap-1.5 px-3 py-2
                           rounded-[var(--ui-border-radius-md)]
                           text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)]
                           text-[var(--text-secondary)] border border-[var(--border-secondary)]
                           bg-transparent hover:bg-[var(--component-bg-hover)]
                           hover:text-[var(--text-primary)] transition-colors"
                    title="Clear all filters"
                    (click)="filter = { status: null, branchId: null, dateRange: null };
                             searchControl.setValue('', {emitEvent: false});
                             applyFilters()">
              <i class="pi pi-filter-slash text-[11px]"></i>
              Clear
            </button>
          </div>

        </div>

        <!-- ── DataGrid ───────────────────────────────────────────────── -->
        <app-data-grid
          [columns]="columns"
          [data]="data()"
          [loading]="isLoading()"
          [rowActions]="rowActions"
          (gridEvent)="eventFromGrid($event)">
        </app-data-grid>
      </app-page-content>
    </app-page>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
      height: 100%;
    }
  `]
})
export class SalesReturnListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly PERMISSIONS = PERMISSIONS;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly salesReturnService = inject(SalesReturnService);
  private readonly messageService = inject(AppMessageService);
  private readonly router = inject(Router);
  private readonly common = inject(CommonMethodService);
  private readonly dialogService = inject(DialogService);

  private currentPage = 1;
  private readonly pageSize = 50;
  totalCount = 0;

  readonly isLoading = signal(false);
  readonly data = signal<any[]>([]);

  readonly searchControl = new FormControl('');

  filter: {
    status: string | null;
    branchId: string | null;
    dateRange: [Date | null, Date | null] | null;
  } = { status: null, branchId: null, dateRange: null };

  readonly statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  readonly columns: GridColumn[] = [
    {
      field: 'returnDate',
      header: 'Date',
      width: '130px',
      sortable: true,
      formatter: (val: any) => this.common.formatDate(val, 'dd MMM yyyy'),
    },
    {
      field: 'returnNumber',
      header: 'Return #',
      width: '150px',
      sortable: true,
    },
    {
      field: 'invoiceId.invoiceNumber',
      header: 'Invoice #',
      width: '160px',
      formatter: (_val: any, row: any) => row?.invoiceId?.invoiceNumber || '—',
    },
    {
      field: 'customerId.name',
      header: 'Customer',
      minWidth: '180px',
      formatter: (_val: any, row: any) => row?.customerId?.name || '—',
    },
    {
      field: 'customerId.phone',
      header: 'Phone',
      width: '130px',
      formatter: (_val: any, row: any) => row?.customerId?.phone || '—',
    },
    {
      field: 'items',
      header: 'Items',
      width: '220px',
      formatter: (_val: any, row: any) => {
        const items: any[] = row?.items || [];
        if (!items.length) return '—';
        return items.map((i: any) => `${i.name} ×${i.quantity}`).join(', ');
      },
    },
    {
      field: 'reason',
      header: 'Reason',
      width: '130px',
      formatter: (val: any) =>
        val ? val.charAt(0).toUpperCase() + val.slice(1) : '—',
    },
    {
      field: 'subTotal',
      header: 'Sub Total',
      width: '120px',
      sortable: true,
      align: 'right',
      type: 'currency',
    },
    {
      field: 'taxTotal',
      header: 'Tax',
      width: '110px',
      sortable: true,
      align: 'right',
      type: 'currency',
    },
    {
      field: 'totalRefundAmount',
      header: 'Refund',
      width: '140px',
      sortable: true,
      align: 'right',
      type: 'currency',
    },
    {
      field: 'approvedBy',
      header: 'Actioned By',
      width: '150px',
      formatter: (_val: any, row: any) => {
        if (row?.approvedBy?.name) return `✓ ${row.approvedBy.name}`;
        if (row?.rejectedBy?.name) return `✗ ${row.rejectedBy.name}`;
        return '—';
      },
    },
    {
      field: 'rejectionReason',
      header: 'Rejection Note',
      width: '150px',
      formatter: (_val: any, row: any) => row?.rejectionReason || '—',
    },
    {
      field: 'status',
      header: 'Status',
      width: '120px',
      sortable: true,
      type: 'badge',
    },
  ];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'approve',
      icon: 'pi pi-check',
      tooltip: 'Approve',
      variant: 'success',
      callback: (row) => {
        if (row.status?.toLowerCase() === 'pending') {
          this.openActionDialog(row, 'approve');
        } else {
          this.messageService.showWarn('Only pending returns can be approved.');
        }
      },
    },
    {
      id: 'reject',
      icon: 'pi pi-ban',
      tooltip: 'Reject',
      variant: 'danger',
      callback: (row) => {
        if (row.status?.toLowerCase() === 'pending') {
          this.openActionDialog(row, 'reject');
        } else {
          this.messageService.showWarn('Only pending returns can be rejected.');
        }
      },
    },
  ];

  ngOnInit(): void {
    this.getData(true);
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => this.applyFilters());
  }

  applyFilters(): void {
    this.getData(true);
  }

  resetFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.filter = { status: null, branchId: null, dateRange: null };
    this.getData(true);
  }

  resetDateRange(): void {
    this.filter.dateRange = null;
    this.applyFilters();
  }

  getData(isReset = false): void {
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
      search: this.searchControl.value || undefined,
    };

    if (this.filter.dateRange?.[1]) {
      query.startDate = this.filter.dateRange[0]?.toISOString();
      query.endDate = this.filter.dateRange[1]?.toISOString();
    }

    this.salesReturnService.getSalesReturns(query).pipe(
      finalize(() => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (res: any) => {
        const newData: any[] = res.data?.returns ?? res.data?.data ?? res.results ?? [];
        this.totalCount = res.total ?? res.pagination?.totalResults ?? newData.length;

        if (isReset) {
          this.data.set(newData);
        } else {
          this.data.update(prev => [...prev, ...newData]);
        }

        if (newData.length > 0 && this.data().length < this.totalCount) {
          this.currentPage++;
        }
      },
      error: (err) => this.messageService.handleHttpError(err),
    });
  }

  eventFromGrid(event: any): void {
    if (event.type === 'cellClicked') {
      const row = event.row ?? event.data;
      if (event.field === 'invoiceId.invoiceNumber' || event.field === 'invoiceId') {
        const invoiceId = row?.invoiceId?._id ?? row?.invoiceId;
        if (invoiceId) this.router.navigate(['/invoices', invoiceId]);
      }
    }
    if (event.type === 'reachedBottom') {
      if (!this.isLoading() && this.data().length < this.totalCount) {
        this.getData(false);
      }
    }
  }

  openActionDialog(row: any, actionType: 'approve' | 'reject'): void {
    const ref = this.dialogService.open(SalesReturnActionDialogComponent, {
      header: actionType === 'approve' ? 'Approve Return' : 'Reject Return',
      width: '500px',
      contentStyle: { background: 'transparent', padding: '0' },
      closable: true,
      data: { actionType, returnId: row._id, returnNumber: row.returnNumber },
    });

    ref?.onClose.pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) this.getData(true);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
