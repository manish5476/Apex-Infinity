import { ChangeDetectorRef, Component, OnInit, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ToastModule } from "primeng/toast";

import { CustomerService } from '../../services/customer-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { DynamicDialogServices } from '../../../../core/services/dynamic-dialog-services';
import { CommonMethodService } from '@core/utils/common-method.service';

import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { PageToolbarComponent } from '@shared/ui/layout/page-toolbar/page-toolbar.component';
import { SearchFilterComponent } from '@shared/ui/filters/search-filter.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    AutoCompleteModule,
    FormsModule,
    ButtonModule,
    ConfirmDialogModule,
    RouterModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    HasPermissionDirective,
    MasterDropdownComponent,
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    PageToolbarComponent,
    SearchFilterComponent
  ],
  providers: [CustomerService, ConfirmationService],
  template: `
    <p-toast position="bottom-right"></p-toast>
    <p-confirmDialog appendTo="body" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}"></p-confirmDialog>

    <app-page>
      <app-page-header
        title="Customer Management"
        subtitle="Manage customer profiles, contact info, and history.">
        <div header-left>
          <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] text-[var(--accent-primary)] mr-3">
            <i class="pi pi-users text-xl"></i>
          </div>
        </div>
        <div header-right class="flex items-center gap-3">
          @if (selectedRows && selectedRows.length === 1) {
            <p-button *hasPermission="PERMISSIONS.CUSTOMER.UPDATE" 
              label="Upload Photo" icon="pi pi-camera" 
              severity="secondary" [outlined]="true"
              (onClick)="openPhotoUpload()">
            </p-button>
          }
          <p-button label="Bulk Import" icon="pi pi-upload" 
            severity="secondary" [outlined]="true"
            (onClick)="openBulkImport()">
          </p-button>
          <p-button *hasPermission="PERMISSIONS.CUSTOMER.CREATE" 
            label="New Customer" icon="pi pi-plus" 
            routerLink="create">
          </p-button>
        </div>
      </app-page-header>

      <app-page-toolbar>
        <app-master-dropdown 
          endpoint="customers" 
          [(ngModel)]="customerFilter._id" 
          (onSelect)="applyFilters()" 
          placeholder="Select Customer"
          class="w-56">
        </app-master-dropdown>

        <p-autoComplete 
          [(ngModel)]="customerFilter.email"
          [suggestions]="emailSuggestions" 
          (completeMethod)="filterEmails($event)" 
          (onChange)="applyFilters()"
          (keyup.enter)="applyFilters()"
          [forceSelection]="false" 
          placeholder="Email" 
          styleClass="w-48">
        </p-autoComplete>

        <p-iconField iconPosition="left" class="w-44">
          <p-inputIcon styleClass="pi pi-phone text-[var(--text-tertiary)] text-xs"></p-inputIcon>
          <input type="text" pInputText
            [(ngModel)]="customerFilter.phone" 
            (keydown.enter)="applyFilters()" 
            (blur)="applyFilters()" 
            placeholder="Phone"
            class="w-full h-[38px] text-sm" />
        </p-iconField>

        <app-search-filter
          [value]="customerFilter.search"
          placeholder="Name, contact, GST..."
          (valueChange)="customerFilter.search = $event; applyFilters()">
        </app-search-filter>

        <p-button label="Reset" icon="pi pi-refresh" 
          severity="secondary" [text]="true"
          (onClick)="resetFilters()">
        </p-button>
      </app-page-toolbar>

      <app-page-content>
        <app-data-grid 
          [columns]="columns" 
          [data]="data()" 
          [loading]="isLoading()"
          [rowActions]="rowActions"
          selectionMode="multiple"
          [lazy]="true"
          paginationMode="infinite"
          [totalRecords]="totalCount"
          (rowClick)="onRowClick($event)"
          (selectionChange)="selectedRows = $event"
          (pageChange)="onPageChange()">
        </app-data-grid>
      </app-page-content>
    </app-page>
  `,
  styles: []
})
export class CustomerList implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  private customerService = inject(CustomerService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private dialogServices = inject(DynamicDialogServices);
  private confirmationService = inject(ConfirmationService);
  public common = inject(CommonMethodService);

  PERMISSIONS = PERMISSIONS;

  selectedRows: any[] = [];
  private currentPage = 1;
  private pageSize = 50;
  readonly isLoading = signal(false);
  totalCount = 0;
  private hasNextPage = true;

  readonly data = signal<any[]>([]);

  customerFilter: any = {
    _id: null,
    email: null,
    phone: null,
    search: null,
  };

  emailSuggestions: string[] = [];
  private readonly domains: string[] = ['@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com'];

  readonly rowActions: GridRowAction[] = [
    {
      id: 'view',
      icon: 'pi pi-eye',
      tooltip: 'View Profile',
      variant: 'primary',
      permission: PERMISSIONS.CUSTOMER.READ,
      callback: (row) => this.router.navigate(['/customer', row._id])
    },
    {
      id: 'delete',
      icon: 'pi pi-trash',
      tooltip: 'Delete Customer',
      variant: 'danger',
      permission: PERMISSIONS.CUSTOMER.DELETE,
      callback: (row) => this.confirmDelete(row)
    }
  ];

  readonly columns: GridColumn[] = [
    {
      field: 'name',
      header: 'Customer',
      type: 'user',
      pinned: 'left',
      minWidth: '240px',
      formatter: (_val: any, row: any) => row?.name || '—'
    },
    {
      field: 'isActive',
      header: 'Status',
      width: '110px',
      type: 'badge',
      formatter: (val: any, row: any) => {
        if (row.isDeleted) return 'Deleted';
        return val ? 'Active' : 'Inactive';
      }
    },
    {
      field: 'email',
      header: 'Email',
      type: 'email',
      width: '220px',
    },
    {
      field: 'phone',
      header: 'Phone',
      type: 'phone',
      width: '160px',
    },
    {
      field: 'billingAddress.city',
      header: 'Location',
      width: '160px',
      formatter: (_val: any, row: any) => {
        const a = row?.billingAddress;
        return a?.city ? `${a.city}, ${a.state}` : '—';
      }
    },
    {
      field: 'outstandingBalance',
      header: 'Outstanding',
      width: '140px',
      type: 'currency',
      align: 'right',
      formatter: (val: any) => (val <= 0 ? '✓ Clear' : undefined)
    },
    {
      field: 'creditLimit',
      header: 'Credit Limit',
      width: '130px',
      type: 'currency',
      align: 'right',
    },
    {
      field: 'invoiceCount',
      header: 'Invoices',
      width: '100px',
      align: 'right',
    },
    {
      field: 'gstNumber',
      header: 'GST',
      width: '160px',
    },
    {
      field: 'createdAt',
      header: 'Since',
      width: '130px',
      formatter: (val: any) => val ? this.common.formatDate(val) : '—'
    }
  ];

  ngOnInit(): void {
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.customerFilter = { _id: null, email: null, phone: null, search: null };
    this.getData(true);
  }

  filterEmails(event: AutoCompleteCompleteEvent) {
    const query = event.query;
    if (!query) {
      this.emailSuggestions = [];
      return;
    }
    this.emailSuggestions = query.includes('@') ? [] : this.domains.map(domain => query + domain);
  }

  getData(isReset: boolean = false) {
    if (isReset) {
      this.currentPage = 1;
      this.data.set([]);
      this.totalCount = 0;
      this.hasNextPage = true;
    }

    if (this.isLoading() || (!isReset && !this.hasNextPage)) return;
    this.isLoading.set(true);

    const filterParams = { ...this.customerFilter, page: this.currentPage, limit: this.pageSize };

    this.customerService.getAllCustomerData(filterParams).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        let newData: any[] = [];
        if (res.data && Array.isArray(res.data.data)) {
          newData = res.data.data;
        }
        if (res.pagination) {
          this.hasNextPage = res.pagination.hasNextPage;
          this.totalCount = res.pagination.totalResults;
        } else {
          this.hasNextPage = newData.length >= this.pageSize;
          this.totalCount = res.results || 0;
        }

        if (isReset) {
          this.data.set(newData);
        } else {
          this.data.update(prev => [...prev, ...newData]);
        }

        if (this.hasNextPage) {
          this.currentPage++;
        }

        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.messageService.handleHttpError(err);
        this.cdr.markForCheck();
      }
    });
  }

  onRowClick(row: any) {
    if (row?._id) {
      this.router.navigate(['/customer', row._id]);
    }
  }

  onPageChange() {
    if (!this.isLoading() && this.hasNextPage) {
      this.getData(false);
    }
  }

  confirmDelete(customer: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the customer "${customer.name}"? This action cannot be undone.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.customerService.deleteCustomer(customer._id).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.messageService.showSuccess('Customer deleted successfully');
            this.getData(true);
          },
          error: (err: any) => {
            this.messageService.handleHttpError(err);
          }
        });
      }
    });
  }

  openPhotoUpload() {
    if (this.selectedRows.length !== 1) return;
    const custId = this.selectedRows[0]._id;

    this.dialogServices.openImageUpload({
      header: 'Update Customer Photo',
      description: `Upload a new avatar for ${this.selectedRows[0].name}.`,
      uploadFn: (file: File) => this.customerService.uploadCustomerPhoto(custId, file)
    })?.onClose.pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (res?.data?.customer?.photo) {
        this.messageService.showSuccess('Photo updated successfully.');
        this.getData(true);
      }
    });
  }

  openBulkImport() {
    this.dialogServices.openBulkCustomer();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}