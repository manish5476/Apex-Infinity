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
        <!-- Filter Toolbar -->
        <div class="app-filter-panel mb-4">
          <div class="filter-field flex-[2] min-w-[250px]">
            <label>Search</label>
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                [formControl]="searchControl"
                placeholder="Return #, Invoice #..."
                class="w-full" />
            </span>
          </div>

          <div class="filter-field">
            <label>Status</label>
            <p-select
              [options]="statusOptions"
              [(ngModel)]="filter.status"
              (onChange)="applyFilters()"
              placeholder="All Statuses"
              [showClear]="true"
              styleClass="w-full">
            </p-select>
          </div>

          <div class="filter-field">
            <label>Branch</label>
            <app-master-dropdown
              endpoint="branches"
              [(ngModel)]="filter.branchId"
              (onChange)="applyFilters()"
              placeholder="All Branches">
            </app-master-dropdown>
          </div>

          <div class="filter-field relative">
            <label>Date Range</label>
            <p-datepicker
              [(ngModel)]="filter.dateRange"
              selectionMode="range"
              (onSelect)="applyFilters()"
              placeholder="Start - End"
              appendTo="body"
              [showIcon]="true"
              styleClass="w-full" inputStyleClass="w-full">
            </p-datepicker>
            @if (filter.dateRange) {
              <i class="pi pi-times absolute right-12 top-[34px] cursor-pointer text-gray-400 hover:text-gray-600 z-10" (click)="resetDateRange()"></i>
            }
          </div>

          <div class="filter-actions ml-auto">
            <p-button icon="pi pi-filter-slash" styleClass="p-button-text p-button-rounded p-button-secondary" 
              (click)="filter = { status: null, branchId: null, dateRange: null }; searchControl.setValue('', {emitEvent: false}); applyFilters()" pTooltip="Clear Filters">
            </p-button>
          </div>
        </div>

        <!-- DataGrid -->
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

    /* ── Filter Toolbar ── */
    .filter-toolbar {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex-wrap: wrap;
      margin-bottom: var(--spacing-md);

      &__search {
        flex: 1;
        min-width: 220px;
        max-width: 320px;

        span { width: 100%; }
        input { width: 100%; }
      }

      &__filters {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        flex-wrap: wrap;
        flex: 1;
      }
    }

    .date-field {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .clear-date {
      background: none;
      border: none;
      padding: 0;
      font-size: var(--font-size-xs);
      color: var(--accent-primary);
      cursor: pointer;
      white-space: nowrap;
      &:hover { text-decoration: underline; }
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
