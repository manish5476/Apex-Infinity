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
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';

// Shared UI
import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { SearchFilterComponent } from '@shared/ui/filters/search-filter.component';

// Core
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { SupplierService } from '../../services/supplier-service';
import { ButtonComponent } from '@shared/ui/form/button.component';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    HasPermissionDirective,
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    SearchFilterComponent  ],
  template: `
    <p-toast position="bottom-right" appendTo="body"></p-toast>

    <app-page>
      <app-page-header
        title="Suppliers"
        subtitle="Manage supplier profiles, contacts, and financial terms">
        <div header-right class="flex items-center gap-3">
          <app-search-filter
            [value]="supplierFilter.phone"
            placeholder="Phone..."
            (valueChange)="supplierFilter.phone = $event; applyFilters()">
          </app-search-filter>

          <app-search-filter
            [value]="supplierFilter.search"
            (valueChange)="supplierFilter.search = $event; applyFilters()">
          </app-search-filter>

          <p-button
            icon="pi pi-times"
            [text]="true"
            severity="secondary"
            pTooltip="Reset Filters"
            (onClick)="resetFilters()">
          </p-button>

          <p-button
            icon="pi pi-refresh"
            [text]="true"
            [rounded]="true"
            severity="secondary"
            [loading]="isLoading()"
            (onClick)="getData(true)"
            pTooltip="Refresh">
          </p-button>
          <p-button
            *hasPermission="PERMISSIONS.SUPPLIER.CREATE"
            label="New Supplier"
            icon="pi pi-plus"
            routerLink="create">
          </p-button>
        </div>
      </app-page-header>

      <app-page-content [padded]="false">

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
  styles: []
})
export class SupplierListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly PERMISSIONS = PERMISSIONS;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly supplierService = inject(SupplierService);
  private readonly messageService = inject(AppMessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly common = inject(CommonMethodService);

  private currentPage = 1;
  private readonly pageSize = 50;
  private totalCount = 0;

  readonly isLoading = signal(false);
  readonly data = signal<any[]>([]);

  supplierFilter = {
    companyName: null as string | null,
    phone: null as string | null,
    search: null as string | null,
  };

  readonly columns: GridColumn[] = [
    {
      field: 'companyName',
      header: 'Company',
      minWidth: '220px',
      sticky: 'left',
      sortable: true,
      type: 'user',
      formatter: (val: any) => val || '—',
    },
    {
      field: 'contacts',
      header: 'Primary Contact',
      minWidth: '180px',
      formatter: (val: any) => {
        const primary = val?.find((c: any) => c.isPrimary) || val?.[0];
        return primary ? `${primary.name} — ${primary.email || ''}` : '—';
      },
    },
    {
      field: 'phone',
      header: 'Phone',
      width: '140px',
      type: 'phone',
      formatter: (val: any) => val || '—',
    },
    {
      field: 'outstandingBalance',
      header: 'Outstanding',
      width: '140px',
      type: 'currency',
      align: 'right',
      sortable: true,
    },
    {
      field: 'paymentTerms',
      header: 'Terms',
      width: '100px',
      formatter: (val: any) => val || 'Net 0',
    },
    {
      field: 'gstNumber',
      header: 'GST / PAN',
      width: '160px',
      formatter: (val: any, row: any) => {
        const parts: string[] = [];
        if (val) parts.push(`GST: ${val}`);
        if (row?.panNumber) parts.push(`PAN: ${row.panNumber}`);
        return parts.join(' | ') || '—';
      },
    },
    {
      field: 'address',
      header: 'Location',
      width: '160px',
      formatter: (val: any) => {
        if (!val) return '—';
        const { city, state } = val;
        return city ? `${city}, ${state || ''}` : '—';
      },
    },
    {
      field: 'bankDetails',
      header: 'Bank',
      width: '150px',
      formatter: (val: any) =>
        val ? `${val.bankName} | ${val.ifscCode || ''}` : '—',
    },
    {
      field: 'isActive',
      header: 'Status',
      width: '100px',
      type: 'badge',
      formatter: (val: any) => (val ? 'Active' : 'Inactive'),
    },
    {
      field: 'updatedAt',
      header: 'Updated',
      width: '110px',
      formatter: (val: any) => val ? this.common.formatDate(val) : '—',
    },
  ];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'view',
      icon: 'pi pi-eye',
      tooltip: 'View Supplier',
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
    this.supplierFilter = { companyName: null, phone: null, search: null };
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

    this.supplierService.getAllSuppliers({
      ...this.supplierFilter,
      page: this.currentPage,
      limit: this.pageSize,
    }).pipe(takeUntil(this.destroy$)).subscribe({
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
        if (newData.length > 0) this.currentPage++;
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
