import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';

// Shared UI
import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';

// Core
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { AppMessageService } from '../../../../core/services/message.service';
import { DynamicDialogServices } from '../../../../core/services/dynamic-dialog-services';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { InvoiceService } from '../../services/invoice-service';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    ToastModule,
    HasPermissionDirective,
    MasterDropdownComponent,
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
  ],
  template: `
    <p-toast position="bottom-right" appendTo="body"></p-toast>

    <app-page>
      <app-page-header
        title="Invoices"
        subtitle="Manage billing, track payments, and export reports">
        <div header-right class="flex items-center gap-3">
          <p-button
            *hasPermission="PERMISSIONS.INVOICE.EXPORT"
            label="Export CSV"
            icon="pi pi-download"
            [text]="true"
            severity="secondary"
            [loading]="isExporting()"
            (onClick)="exportReport()">
          </p-button>
          <p-button
            *hasPermission="PERMISSIONS.INVOICE.CREATE"
            label="New Invoice"
            icon="pi pi-plus"
            routerLink="create">
          </p-button>
        </div>
      </app-page-header>

      <app-page-content [padded]="true">
        <!-- Filter Toolbar -->
        <div class="filter-toolbar">
          <div class="filter-toolbar__search">
            <input
              type="text"
              pInputText
              [(ngModel)]="invoiceFilter.invoiceNumber"
              placeholder="Invoice No..."
              (keydown.enter)="applyFilters()"
              class="w-full" />
          </div>

          <div class="filter-toolbar__filters">
            <app-master-dropdown
              endpoint="customers"
              [(ngModel)]="invoiceFilter.customerId"
              (onSelect)="applyFilters()"
              placeholder="Customer">
            </app-master-dropdown>

            <p-select
              [options]="statusOptions"
              [(ngModel)]="invoiceFilter.status"
              [showClear]="true"
              placeholder="Status"
              (onChange)="applyFilters()">
            </p-select>

            <p-select
              [options]="paymentStatusOptions"
              [(ngModel)]="invoiceFilter.paymentStatus"
              [showClear]="true"
              placeholder="Payment"
              (onChange)="applyFilters()">
            </p-select>

            <p-datepicker
              [(ngModel)]="dateRange"
              selectionMode="range"
              [readonlyInput]="true"
              placeholder="Date Range"
              appendTo="body"
              (onClose)="applyFilters()">
            </p-datepicker>

            <p-button
              icon="pi pi-times"
              [text]="true"
              severity="secondary"
              pTooltip="Reset Filters"
              (onClick)="resetFilters()">
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

    .filter-toolbar {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex-wrap: wrap;
      margin-bottom: var(--spacing-md);

      &__search {
        min-width: 200px;
        max-width: 280px;
        flex: 1;
      }

      &__filters {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        flex-wrap: wrap;
        flex: 2;
      }
    }
  `]
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly PERMISSIONS = PERMISSIONS;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly invoiceService = inject(InvoiceService);
  private readonly messageService = inject(AppMessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly common = inject(CommonMethodService);
  private readonly dialogServices = inject(DynamicDialogServices);

  private currentPage = 1;
  private readonly pageSize = 50;
  private hasNextPage = true;
  private totalCount = 0;

  readonly isLoading = signal(false);
  readonly isExporting = signal(false);
  readonly data = signal<any[]>([]);

  invoiceFilter = {
    invoiceNumber: null as string | null,
    customerId: null as string | null,
    status: null as string | null,
    paymentStatus: null as string | null,
  };

  dateRange: Date[] | undefined;

  readonly statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Issued', value: 'issued' },
    { label: 'Paid', value: 'paid' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  readonly paymentStatusOptions = [
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Partial', value: 'partial' },
    { label: 'Paid', value: 'paid' },
  ];

  readonly columns: GridColumn[] = [
    {
      field: 'invoiceNumber',
      header: 'Invoice #',
      width: '160px',
      sticky: 'left',
      sortable: true,
    },
    {
      field: 'branchId.name',
      header: 'Branch',
      width: '130px',
      formatter: (_val: any, row: any) => row?.branchId?.name || '—',
    },
    {
      field: 'createdBy.name',
      header: 'Created By',
      width: '140px',
      type: 'user',
      formatter: (_val: any, row: any) => row?.createdBy?.name || '—',
    },
    {
      field: 'customerId.name',
      header: 'Customer',
      minWidth: '180px',
      type: 'user',
      formatter: (_val: any, row: any) => row?.customerId?.name || 'Walk-in',
    },
    {
      field: 'placeOfSupply',
      header: 'Supply State',
      width: '130px',
      formatter: (val: any) => val || '—',
    },
    {
      field: 'gstType',
      header: 'GST Type',
      width: '120px',
      type: 'badge',
      formatter: (val: any) =>
        val ? this.common.toTitleCase(val.replace(/-/g, ' ')) : '—',
    },
    {
      field: 'invoiceDate',
      header: 'Invoice Date',
      width: '130px',
      sortable: true,
      formatter: (val: any) => val ? this.common.formatDate(val) : '—',
    },
    {
      field: 'dueDate',
      header: 'Due Date',
      width: '130px',
      sortable: true,
      formatter: (val: any) => val ? this.common.formatDate(val) : '—',
    },
    {
      field: 'status',
      header: 'Status',
      width: '110px',
      type: 'badge',
    },
    {
      field: 'paymentStatus',
      header: 'Payment',
      width: '110px',
      type: 'badge',
    },
    {
      field: 'paymentMethod',
      header: 'Method',
      width: '110px',
      formatter: (val: any) => val ? this.common.toTitleCase(val) : '—',
    },
    {
      field: 'subTotal',
      header: 'Subtotal',
      width: '120px',
      type: 'currency',
      align: 'right',
    },
    {
      field: 'totalTax',
      header: 'GST',
      width: '105px',
      type: 'currency',
      align: 'right',
    },
    {
      field: 'totalDiscount',
      header: 'Discount',
      width: '110px',
      type: 'currency',
      align: 'right',
    },
    {
      field: 'grandTotal',
      header: 'Grand Total',
      width: '130px',
      type: 'currency',
      align: 'right',
      sortable: true,
    },
    {
      field: 'paidAmount',
      header: 'Paid',
      width: '115px',
      type: 'currency',
      align: 'right',
    },
    {
      field: 'balanceAmount',
      header: 'Balance Due',
      width: '135px',
      type: 'currency',
      align: 'right',
      sortable: true,
    },
  ];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'view',
      icon: 'pi pi-eye',
      tooltip: 'View Invoice',
      variant: 'primary',
      callback: (row) => {
        this.router.navigate([row._id], { relativeTo: this.route });
      },
    },
    {
      id: 'return',
      icon: 'pi pi-replay',
      tooltip: 'Create Return',
      variant: 'ghost',
      callback: (row) => {
        this.dialogServices.openSalesReturn({ invoice: row })
          ?.onClose.pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            if (res) this.getData(true);
          });
      },
    },
  ];

  ngOnInit(): void {
    this.getData(true);
  }

  applyFilters(): void {
    this.getData(true);
  }

  resetFilters(): void {
    this.invoiceFilter = { invoiceNumber: null, customerId: null, status: null, paymentStatus: null };
    this.dateRange = undefined;
    this.getData(true);
  }

  getData(isReset = false): void {
    if (isReset) {
      this.currentPage = 1;
      this.data.set([]);
      this.totalCount = 0;
      this.hasNextPage = true;
    }
    if (this.isLoading() || (!isReset && !this.hasNextPage)) return;
    this.isLoading.set(true);

    let startDate: string | undefined;
    let endDate: string | undefined;
    if (Array.isArray(this.dateRange)) {
      if (this.dateRange[0]) startDate = this.dateRange[0].toISOString();
      if (this.dateRange[1]) endDate = this.dateRange[1].toISOString();
    }

    const filterParams = {
      ...this.invoiceFilter,
      startDate,
      endDate,
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.invoiceService.getAllInvoices(filterParams).pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: (res: any) => {
        const newData: any[] = res.data?.data ?? [];
        if (res.pagination) {
          this.hasNextPage = res.pagination.hasNextPage;
          this.totalCount = res.pagination.totalResults;
        }
        if (isReset) {
          this.data.set(newData);
        } else {
          this.data.update(prev => [...prev, ...newData]);
        }
        if (this.hasNextPage) this.currentPage++;
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.messageService.handleHttpError(err);
        this.cdr.markForCheck();
      },
    });
  }

  exportReport(): void {
    if (this.isExporting()) return;
    this.isExporting.set(true);

    this.invoiceService.exportInvoices({ ...this.invoiceFilter }).pipe(
      finalize(() => {
        this.isExporting.set(false);
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoices_export_${Date.now()}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.messageService.showSuccess('Report exported successfully.');
      },
      error: (err: any) => this.messageService.handleHttpError(err),
    });
  }

  eventFromGrid(event: any): void {
    if (event.type === 'cellClicked') {
      this.router.navigate([event.row._id], { relativeTo: this.route });
    }
    if (event.type === 'reachedBottom') {
      if (!this.isLoading() && this.hasNextPage) this.getData(false);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}