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
import { Subject, finalize } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
import { PageToolbarComponent } from '@shared/ui/layout/page-toolbar/page-toolbar.component';
import { SearchFilterComponent } from '@shared/ui/filters/search-filter.component';
import { DateFilterComponent } from '@shared/ui/filters/date-filter.component';
import { SelectFilterComponent } from '@shared/ui/filters/select-filter.component';

// Core
import { HasPermissionDirective } from '../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../core/auth/permissions.constants';
import { AppMessageService } from '../../../core/services/message.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { PurchaseService } from '../purchase.service';
import { MasterDropdownComponent } from '../../shared/components/masterFilterDropdown/master-dropdown.component';

@Component({
  selector: 'app-purchase-list',
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
    PageToolbarComponent,
    SearchFilterComponent,
    DateFilterComponent,
    SelectFilterComponent
  ],
  template: `
    <p-toast position="bottom-right" appendTo="body"></p-toast>

    <app-page>
      <app-page-header
        title="Purchase Orders"
        subtitle="Manage supplier purchases, track deliveries, and monitor payments">
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
            *hasPermission="PERMISSIONS.PURCHASE.CREATE"
            label="New Purchase"
            icon="pi pi-plus"
            routerLink="create">
          </p-button>
        </div>
      </app-page-header>

      <app-page-toolbar>
        <app-search-filter
          [value]="purchaseFilter.invoiceNumber"
          (valueChange)="purchaseFilter.invoiceNumber = $event; applyFilters()">
        </app-search-filter>

        <app-master-dropdown
          endpoint="suppliers"
          [(ngModel)]="purchaseFilter.supplierId"
          (onChange)="applyFilters()"
          placeholder="Supplier">
        </app-master-dropdown>

        <app-master-dropdown
          endpoint="branches"
          [(ngModel)]="purchaseFilter.branchId"
          (onChange)="applyFilters()"
          placeholder="Branch">
        </app-master-dropdown>

        <app-select-filter
          [options]="statusOptions"
          [value]="purchaseFilter.status"
          placeholder="Status"
          (valueChange)="purchaseFilter.status = $event; applyFilters()">
        </app-select-filter>

        <app-select-filter
          [options]="paymentStatusOptions"
          [value]="purchaseFilter.paymentStatus"
          placeholder="Payment"
          (valueChange)="purchaseFilter.paymentStatus = $event; applyFilters()">
        </app-select-filter>

        <app-date-filter
          [value]="purchaseFilter.dateRange"
          (valueChange)="purchaseFilter.dateRange = $any($event); applyFilters()">
        </app-date-filter>

        <p-button
          icon="pi pi-times"
          [text]="true"
          severity="secondary"
          pTooltip="Reset Filters"
          (onClick)="resetFilters()">
        </p-button>
      </app-page-toolbar>

      <app-page-content [padded]="false">
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
  styles: []
})
export class PurchaseListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly PERMISSIONS = PERMISSIONS;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly purchaseService = inject(PurchaseService);
  private readonly messageService = inject(AppMessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly common = inject(CommonMethodService);

  private currentPage = 1;
  private readonly pageSize = 50;
  private totalCount = 0;

  readonly isLoading = signal(false);
  readonly data = signal<any[]>([]);

  purchaseFilter: {
    invoiceNumber: string | null;
    supplierId: string | null;
    branchId: string | null;
    status: string | null;
    paymentStatus: string | null;
    dateRange: Date[] | null;
  } = {
    invoiceNumber: null,
    supplierId: null,
    branchId: null,
    status: null,
    paymentStatus: null,
    dateRange: null,
  };

  readonly statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Received', value: 'received' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  readonly paymentStatusOptions = [
    { label: 'Paid', value: 'paid' },
    { label: 'Partial', value: 'partial' },
    { label: 'Unpaid', value: 'unpaid' },
  ];

  readonly columns: GridColumn[] = [
    {
      field: 'invoiceNumber',
      header: 'Invoice #',
      width: '140px',
      sticky: 'left',
      sortable: true,
    },
    {
      field: 'purchaseDate',
      header: 'Date',
      width: '120px',
      sortable: true,
      formatter: (val: any) => val ? this.common.formatDate(val) : '—',
    },
    {
      field: 'supplierId.companyName',
      header: 'Supplier',
      minWidth: '200px',
      type: 'user',
      formatter: (_val: any, row: any) => row?.supplierId?.companyName || '—',
    },
    {
      field: 'supplierId.contactPerson',
      header: 'Contact',
      width: '150px',
      formatter: (_val: any, row: any) => row?.supplierId?.contactPerson || '—',
    },
    {
      field: 'supplierId.email',
      header: 'Email',
      width: '200px',
      type: 'email',
      formatter: (_val: any, row: any) => row?.supplierId?.email || '—',
    },
    {
      field: 'supplierId.phone',
      header: 'Phone',
      width: '130px',
      type: 'phone',
      formatter: (_val: any, row: any) => row?.supplierId?.phone || '—',
    },
    {
      field: 'branchId.name',
      header: 'Branch',
      width: '130px',
      formatter: (_val: any, row: any) => row?.branchId?.name || '—',
    },
    {
      field: 'items',
      header: 'Items',
      width: '80px',
      align: 'right',
      formatter: (_val: any, row: any) => String(row?.items?.length ?? 0),
    },
    {
      field: 'subTotal',
      header: 'Sub Total',
      width: '120px',
      type: 'currency',
      align: 'right',
    },
    {
      field: 'totalTax',
      header: 'Tax',
      width: '100px',
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
      width: '120px',
      type: 'currency',
      align: 'right',
    },
    {
      field: 'balanceAmount',
      header: 'Balance',
      width: '120px',
      type: 'currency',
      align: 'right',
      sortable: true,
    },
    {
      field: 'status',
      header: 'Status',
      width: '120px',
      type: 'badge',
    },
    {
      field: 'paymentStatus',
      header: 'Payment',
      width: '130px',
      type: 'badge',
    },
    {
      field: 'paymentMethod',
      header: 'Method',
      width: '110px',
      formatter: (val: any) => val ? val.toUpperCase() : '—',
    },
    {
      field: 'createdBy.name',
      header: 'Created By',
      width: '140px',
      formatter: (_val: any, row: any) => row?.createdBy?.name || 'System',
    },
  ];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'view',
      icon: 'pi pi-eye',
      tooltip: 'View Purchase',
      variant: 'primary',
      callback: (row) => {
        this.router.navigate([row._id], { relativeTo: this.route });
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
    this.purchaseFilter = {
      invoiceNumber: null, supplierId: null, branchId: null,
      status: null, paymentStatus: null, dateRange: null,
    };
    this.getData(true);
  }

  getData(isReset = false): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    if (isReset) {
      this.currentPage = 1;
      this.data.set([]);
      this.totalCount = 0;
    }

    const { dateRange, ...baseFilters } = this.purchaseFilter;
    let startDate: string | undefined;
    let endDate: string | undefined;
    if (Array.isArray(dateRange)) {
      if (dateRange[0]) startDate = (dateRange[0] as Date).toISOString();
      if (dateRange[1]) endDate = (dateRange[1] as Date).toISOString();
    }

    this.purchaseService.getAllPurchases({
      ...baseFilters, startDate, endDate,
      page: this.currentPage, limit: this.pageSize,
    }).pipe(
      finalize(() => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (res: any) => {
        const newData: any[] = res.data?.data ?? [];
        if (res.pagination) {
          this.totalCount = res.pagination.totalResults;
        }
        if (isReset) {
          this.data.set(newData);
        } else {
          this.data.update(prev => [...prev, ...newData]);
        }
        this.currentPage++;
      },
      error: (err: any) => this.messageService.handleHttpError(err),
    });
  }

  eventFromGrid(event: any): void {
    if (event.type === 'cellClicked') {
      const id = event.row?._id;
      if (id) this.router.navigate([id], { relativeTo: this.route });
    }
    if (event.type === 'reachedBottom') {
      if (!this.isLoading() && this.data().length < this.totalCount) {
        this.getData(false);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
