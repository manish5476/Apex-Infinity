import { ChangeDetectorRef, Component, OnInit, inject, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { GridApi } from 'ag-grid-community';

// PrimeNG
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ToastModule } from "primeng/toast";

// App Core & Shared
import { CustomerService } from '../../services/customer-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { DynamicDialogServices } from '../../../../core/services/dynamic-dialog-services';
import { CommonMethodService } from '@core/utils/common-method.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    SelectModule,
    AutoCompleteModule,
    FormsModule,
    ButtonModule,
    ConfirmDialogModule,
    RouterModule,
    InputTextModule,
    ToastModule,
    AgShareGrid,
    HasPermissionDirective,
    MasterDropdownComponent
],
  providers: [CustomerService, ConfirmationService],
  template: `
    <p-toast position="bottom-right"></p-toast>
    <p-confirmDialog [style]="{width: '450px'}"></p-confirmDialog>

    <div class="page-layout">
      
      <header class="list-header elevation-card">
        <div class="header-left">
          <div class="icon-box">
            <i class="pi pi-users"></i>
          </div>
          <div class="header-titles">
            <h1>Customer Management</h1>
            <p>Manage customer profiles, contact info, and history.</p>
          </div>
        </div>

        <div class="header-actions">
          @if (selectedRows && selectedRows.length === 1) {
            <p-button *hasPermission="PERMISSIONS.CUSTOMER.UPDATE" 
              label="Upload Photo" icon="pi pi-camera" 
              styleClass="p-button-outlined theme-btn-secondary" 
              (onClick)="openPhotoUpload()">
            </p-button>
          }
          <p-button label="Bulk Import" icon="pi pi-upload" 
            styleClass="p-button-outlined theme-btn-secondary" 
            (onClick)="openBulkImport()">
          </p-button>
          <p-button *hasPermission="PERMISSIONS.CUSTOMER.CREATE" 
            label="New Customer" icon="pi pi-plus" 
            routerLink="create"
            styleClass="p-button-primary">
          </p-button>
        </div>
      </header>

      <div class="filter-panel elevation-card">
        <div class="filter-grid">
          
          <div class="filter-field">
            <label for="customer">Customer</label>
            <app-master-dropdown 
              endpoint="customers" 
              [(ngModel)]="customerFilter._id" 
              (onSelect)="applyFilters()" 
              placeholder="Select Customer">
            </app-master-dropdown>
          </div>

          <div class="filter-field">
            <label for="email">Email</label>
            <p-autoComplete id="email" 
              [(ngModel)]="customerFilter.email"
              [suggestions]="emailSuggestions" 
              (completeMethod)="filterEmails($event)" 
              (onChange)="applyFilters()"
              (keyup.enter)="applyFilters()"
              [forceSelection]="false" 
              placeholder="Enter email" 
              styleClass="w-full" 
              inputStyleClass="w-full theme-control">
            </p-autoComplete>
          </div>

          <div class="filter-field">
            <label for="phone">Phone</label>
            <input id="phone" type="text" pInputText
              [(ngModel)]="customerFilter.phone" 
              (keydown.enter)="applyFilters()" 
              (blur)="applyFilters()" 
              placeholder="Phone number" 
              class="w-full theme-control" />
          </div>

          <div class="filter-field">
            <label for="search">Smart Search</label>
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <input id="search" type="text" pInputText
                [(ngModel)]="customerFilter.search" 
                (keydown.enter)="applyFilters()" 
                (blur)="applyFilters()" 
                placeholder="Name, contact, GST..." 
                class="w-full theme-control" />
            </span>
          </div>

        </div>
        
        <div class="filter-actions">
          <p-button label="Reset" icon="pi pi-refresh" 
            styleClass="p-button-text theme-btn-secondary"
            (onClick)="resetFilters()">
          </p-button>
        </div>
      </div>

      <div class="grid-wrapper elevation-card">
        <app-ag-share-grid 
          class="full-size-grid"
          [columns]="column" 
          [data]="data" 
          [actionColumn]="customerActionColumn" 
          selectionMode="multiple"
          (gridEvent)="eventFromGrid($event)">
        </app-ag-share-grid>
      </div>

    </div>
  `,
  styles: [`
    /* =========================================================
       CUSTOMER LIST - SINGLE FILE COMPONENT STYLES
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
          }
          p {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            margin: 0;
          }
        }
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-md);
      }
    }

    /* ── FILTER PANEL ── */
    .filter-panel {
      flex-shrink: 0;
      padding: var(--spacing-lg) var(--spacing-2xl);
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: var(--spacing-xl);
      flex-wrap: wrap;

      .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--spacing-lg);
        flex: 1;
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
        }
      }

      .filter-actions {
        display: flex;
        align-items: center;
      }
    }

    /* ── AG GRID WRAPPER ── */
    .grid-wrapper {
      flex: 1;           /* Take all remaining space */
      min-height: 0;     /* CRITICAL: Prevent grid blowout */
      display: flex;
      flex-direction: column;
      overflow: hidden;

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

    /* ── GLOBAL INJECTED STYLES FOR CELL RENDERERS ── */
    ::ng-deep {
      .tag-container {
        display: flex; align-items: center; gap: 4px; width: 100%; height: 100%;
      }
      .tag-chip {
        background: var(--bg-ternary);
        border: var(--ui-border-width) solid var(--border-secondary);
        padding: 3px 8px;
        border-radius: var(--ui-border-radius-sm);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--text-secondary);
        white-space: nowrap;
        display: inline-flex; align-items: center; justify-content: center;
      }
      .tag-more { font-size: var(--font-size-xs); color: var(--text-tertiary); font-weight: var(--font-weight-bold); margin-left: 2px; }
      .tag-empty { color: var(--text-tertiary); font-size: var(--font-size-xs); }

      /* Buttons & Utilities */
      .theme-btn-secondary {
        color: var(--text-secondary) !important;
        border-color: var(--border-secondary) !important;
        &:hover { background: var(--bg-ternary) !important; color: var(--text-primary) !important; }
      }
    }
  `]
})
export class CustomerList implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  private customerService = inject(CustomerService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private dialogServices = inject(DynamicDialogServices);
  private confirmationService = inject(ConfirmationService);
  public common = inject(CommonMethodService); // Changed to public so template could use it if needed

  PERMISSIONS = PERMISSIONS;

  readonly customerActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: true,
    showDelete: true,
    viewPermission: PERMISSIONS.CUSTOMER.READ,
    editPermission: PERMISSIONS.CUSTOMER.UPDATE,
    deletePermission: PERMISSIONS.CUSTOMER.DELETE,
  };

  private gridApi!: GridApi;
  selectedRows: any[] = [];
  private currentPage = 1;
  private pageSize = 50;
  private isLoading = false;
  private totalCount = 0;
  private hasNextPage = true;

  data: any[] = [];
  column: any[] = [];
  rowSelectionMode: any = 'single';

  customerFilter = {
    _id: null,
    email: null,
    phone: null,
    search: null,
  };

  emailSuggestions: string[] = [];
  private readonly domains: string[] = ['@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com'];

  ngOnInit(): void {
    this.getColumn();
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
      this.data = [];
      this.totalCount = 0;
      this.hasNextPage = true;
    }

    if (this.isLoading || (!isReset && !this.hasNextPage)) return;
    this.isLoading = true;

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
          this.data = newData;
        } else {
          this.data = [...this.data, ...newData];
        }

        if (this.gridApi && !isReset && newData.length > 0) {
          this.gridApi.applyTransaction({ add: newData });
        }

        if (this.hasNextPage) {
          this.currentPage++;
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.messageService.handleHttpError(err);
        this.cdr.markForCheck();
      }
    });
  }

  onScrolledToBottom(_?: any) {
    if (!this.isLoading && this.hasNextPage) {
      this.getData(false);
    }
  }

  eventFromGrid(event: any) {
    if (event.type === 'init') {
      this.gridApi = event.api;
      return;
    }
    if (event.type === 'cellClicked' || event.type === 'view') {
      const customerId = event.row?._id;
      if (customerId) {
        this.router.navigate(['/customer', customerId]);
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom();
    }
    if (event.type === 'selectionChanged') {
      this.selectedRows = event.rows || [];
    }
    if (event.type === 'save') {
      const limitVal = Number(event.row.creditLimit) || 0;
      this.customerService.updateCreditLimit(event.row._id, { creditLimit: limitVal })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.messageService.showSuccess('Credit limit updated successfully'),
          error: (err: any) => this.messageService.handleHttpError(err)
        });
    }
    if (event.type === 'delete') {
      this.confirmDelete(event.row);
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

  // --- Inline Cell Renderers using Theme Tokens ---

  private badge(label: string, bgVar: string, colorVar: string, borderVar: string): string {
    return `<span style="background: var(${bgVar}); color: var(${colorVar}); border: 1px solid var(${borderVar}); padding: 2px 8px; border-radius: var(--ui-border-radius-sm); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap; line-height: 1.4; display: inline-flex; align-items: center;">${label}</span>`;
  }

  private twoLine(top: string, bottom: string, topStyle = 'font-size: var(--font-size-sm); color: var(--text-primary); font-weight: var(--font-weight-semibold);', bottomStyle = 'font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 2px;'): string {
    return `<div style="display:flex; flex-direction:column; justify-content:center; line-height: 1.2; overflow:hidden;"><span style="${topStyle} white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${top}</span><span style="${bottomStyle} white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${bottom}</span></div>`;
  }

  getColumn(): void {
    this.column = [
      {
        headerName: 'Customer Identity',
        children: [
          {
            field: 'name',
            headerName: 'Name & Type',
            pinned: 'left',
            minWidth: 240,
            flex: 2,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 16px' },
            cellRenderer: (params: any) => {
              if (!params.value) return '';
              const d = params.data;
              const initials = this.common.getInitials(d.name);
              const avatar = this.common.getAvatarStyle(d.name);
              const isIndiv = d.type === 'individual';
              const icon = isIndiv ? 'pi-user' : 'pi-building';
              const sub = d.contactPerson && d.contactPerson !== d.name ? d.contactPerson : this.common.toTitleCase(d.type || '');
              
              return `<div style="display:flex; align-items:center; gap: 12px; width:100%; overflow:hidden;">
                        <span style="width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; background: ${avatar.background}; color: ${avatar.color}; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: var(--font-weight-bold); border: 1px solid rgba(0,0,0,0.05);">${initials}</span>
                        ${this.twoLine(d.name, `<i class="pi ${icon}" style="font-size: 9px; margin-right: 4px;"></i>${sub}`)}
                      </div>`;
            }
          },
          {
            field: 'isActive',
            headerName: 'Status',
            width: 110,
            cellStyle: { display: 'flex', alignItems: 'center' },
            cellRenderer: (params: any) => {
              if (params.data.isDeleted) return this.badge('Deleted', '--color-error-bg', '--color-error-dark', '--color-error-border');
              return params.value 
                ? this.badge('Active', '--color-success-bg', '--color-success-dark', '--color-success-border') 
                : this.badge('Inactive', '--bg-ternary', '--text-secondary', '--border-primary');
            }
          },
          {
            field: 'tags',
            headerName: 'Tags',
            width: 160,
            cellRenderer: (params: any) => {
              const tags: string[] = (params.value || []).filter((t: string) => t?.trim());
              if (!tags.length) return `<span class="tag-empty">—</span>`;
              const chips = tags.slice(0, 2).map(tag => `<span class="tag-chip">${this.common.toTitleCase(tag)}</span>`).join('');
              const more = tags.length > 2 ? `<span class="tag-more">+${tags.length - 2}</span>` : '';
              return `<div class="tag-container">${chips}${more}</div>`;
            }
          }
        ]
      },
      {
        headerName: 'Contact Details',
        children: [
          { 
            headerName: 'Email', 
            field: 'email', 
            width: 220, 
            cellStyle: { display: 'flex', alignItems: 'center' }, 
            cellRenderer: (params: any) => params.value 
              ? `<div style="display:flex; align-items:center; gap: 8px; overflow:hidden; width:100%;"><i class="pi pi-envelope" style="font-size: 11px; color: var(--text-tertiary); flex-shrink:0;"></i><span style="font-size: var(--font-size-sm); color: var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${params.value}</span></div>` 
              : `<span style="color:var(--text-tertiary); font-size: var(--font-size-xs);">—</span>` 
          },
          { 
            headerName: 'Phone', 
            field: 'phone', 
            width: 160, 
            cellStyle: { display: 'flex', alignItems: 'center' }, 
            cellRenderer: (params: any) => {
              const phone = params.value;
              const alt = params.data?.altPhone;
              if (!phone) return `<span style="color:var(--text-tertiary); font-size: var(--font-size-xs);">—</span>`;
              const top = `<i class="pi pi-phone" style="font-size: 10px; margin-right: 4px;"></i>${this.common.formatPhone(phone)}`;
              const bot = alt ? `Alt: ${this.common.formatPhone(alt)}` : '';
              return bot 
                ? this.twoLine(top, bot) 
                : `<div style="display:flex; align-items:center; gap: 6px;"><i class="pi pi-phone" style="font-size: 11px; color: var(--text-tertiary);"></i><span style="font-size: var(--font-size-sm); color: var(--text-secondary);">${this.common.formatPhone(phone)}</span></div>`;
            }
          },
          { 
            headerName: 'Location', 
            field: 'billingAddress.city', 
            width: 160, 
            cellStyle: { display: 'flex', alignItems: 'center' }, 
            valueGetter: (p: any) => { const a = p.data?.billingAddress; return a?.city ? `${a.city}, ${a.state}` : ''; }, 
            tooltipValueGetter: (p: any) => { const a = p.data?.billingAddress; return a ? this.common.formatAddress(a) : ''; }, 
            cellRenderer: (params: any) => params.value 
              ? `<div style="display:flex; align-items:center; gap: 6px; overflow:hidden;"><i class="pi pi-map-marker" style="font-size: 11px; color: var(--text-tertiary); flex-shrink:0;"></i><span style="font-size: var(--font-size-sm); color: var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${params.value}</span></div>` 
              : `<span style="color:var(--text-tertiary); font-size: var(--font-size-xs);">—</span>` 
          }
        ]
      },
      {
        headerName: 'Financial Overview',
        children: [
          { 
            field: 'outstandingBalance', 
            headerName: 'Outstanding', 
            width: 140, 
            type: 'rightAligned', 
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '16px' }, 
            cellRenderer: (params: any) => { 
              const val = params.value || 0; 
              return val <= 0 
                ? this.badge('✓ Clear', '--color-success-bg', '--color-success-dark', '--color-success-border') 
                : `<span style="color: var(--color-error); font-weight: var(--font-weight-bold); font-family: var(--font-mono); font-size: var(--font-size-sm);">${this.common.formatCurrency(val)}</span>`; 
            } 
          },
          { 
            field: 'creditLimit', 
            headerName: 'Credit Limit', 
            width: 130, 
            type: 'rightAligned', 
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '16px' }, 
            cellRenderer: (params: any) => { 
              const val = params.value || 0; 
              return val 
                ? `<span style="color: var(--text-secondary); font-family: var(--font-mono); font-size: var(--font-size-sm);">${this.common.formatCurrency(val)}</span>` 
                : `<span style="color: var(--text-tertiary); font-size: var(--font-size-xs);">—</span>`; 
            } 
          },
          { 
            field: 'invoiceCount', 
            headerName: 'Invoices', 
            width: 100, 
            type: 'rightAligned', 
            cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '16px' }, 
            cellRenderer: (params: any) => `<span style="font-weight: var(--font-weight-bold); font-size: var(--font-size-md); font-family: var(--font-mono); color: ${(params.value || 0) > 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)'};">${params.value || 0}</span>` 
          }
        ]
      },
      {
        headerName: 'Compliance',
        children: [
          { 
            field: 'gstNumber', 
            headerName: 'GST / PAN', 
            width: 170, 
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 16px' }, 
            cellRenderer: (params: any) => {
              const gst = params.value;
              const pan = params.data?.panNumber;
              if (!gst && !pan) return `<span style="color:var(--text-tertiary); font-size: var(--font-size-xs);">—</span>`;
              const top = gst ? `<span style="font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); font-family: var(--font-mono); color: var(--text-primary);">${this.common.formatGSTIN(gst)}</span>` : '';
              const bot = pan ? `<i class="pi pi-id-card" style="font-size: 9px; margin-right: 4px;"></i>${this.common.formatPAN(pan)}` : '';
              if (top && bot) return this.twoLine(gst, bot, 'font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); font-family: var(--font-mono); color: var(--text-primary);', 'font-size: 10px; color: var(--text-tertiary); margin-top: 2px;');
              return top || `<span style="font-size: var(--font-size-xs); color: var(--text-secondary);">${bot}</span>`;
            }
          }
        ]
      },
      {
        headerName: 'System',
        children: [
          { 
            field: 'createdAt', 
            headerName: 'Since', 
            width: 130, 
            sortable: true, 
            cellStyle: { display: 'flex', alignItems: 'center', padding: '0 16px' }, 
            cellRenderer: (params: any) => params.value ? this.twoLine(this.common.formatDate(params.value), this.common.timeAgoText(params.value)) : '-' 
          }
        ]
      }
    ];
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}// import { ChangeDetectorRef, Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
// import { GridApi } from 'ag-grid-community';
// import { FormsModule } from '@angular/forms';
// import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { Router, RouterModule } from '@angular/router';
// import { ConfirmationService } from 'primeng/api';
// import { CustomerService } from '../../services/customer-service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
// import { Toast } from "primeng/toast";
// import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
// import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
// import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
// import { DynamicDialogServices } from '../../../../core/services/dynamic-dialog-services';
// import { CommonMethodService } from '@core/utils/common-method.service';
// import { Subject } from "rxjs";
// import { takeUntil } from "rxjs/operators";

// @Component({
//   selector: 'app-customer-list',
//   standalone: true,
//   imports: [
//     SelectModule,
//     AutoCompleteModule,
//     FormsModule,
//     ButtonModule,
//     ConfirmDialogModule,
//     RouterModule,
//     InputTextModule,
//     Toast,
//     AgShareGrid,
//     HasPermissionDirective,
//     MasterDropdownComponent
//   ],
//   providers: [CustomerService, ConfirmationService],
//   templateUrl: './customer-list.html',
//   styleUrl: './customer-list.scss',
// })
// export class CustomerList implements OnInit, OnDestroy {
//   private readonly destroy$ = new Subject<void>();
//   private cdr = inject(ChangeDetectorRef);
//   private customerService = inject(CustomerService);
//   private messageService = inject(AppMessageService);
//   private router = inject(Router);
//   private dialogServices = inject(DynamicDialogServices);
//   private confirmationService = inject(ConfirmationService);
//   private common = inject(CommonMethodService);

//   PERMISSIONS = PERMISSIONS;

//   readonly customerActionColumn: ActionColumnConfig = {
//     showView: true,
//     showEdit: true,
//     showDelete: true,
//     viewPermission: PERMISSIONS.CUSTOMER.READ,
//     editPermission: PERMISSIONS.CUSTOMER.UPDATE,
//     deletePermission: PERMISSIONS.CUSTOMER.DELETE,
//   };

//   private gridApi!: GridApi;
//   selectedRows: any[] = [];
//   private currentPage = 1;
//   private pageSize = 50;
//   private isLoading = false;
//   private totalCount = 0;
//   private hasNextPage = true;

//   data: any[] = [];
//   column: any = [];
//   rowSelectionMode: any = 'single';

//   customerFilter = {
//     _id: null,
//     email: null,
//     phone: null,
//     search: null,
//   };

//   emailSuggestions: string[] = [];
//   private readonly domains: string[] = ['@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com'];

//   constructor() {}

//   ngOnInit(): void {
//     this.getColumn();
//     this.getData(true);
//   }

//   applyFilters() {
//     this.getData(true);
//   }

//   resetFilters() {
//     this.customerFilter = { _id: null, email: null, phone: null, search: null };
//     this.getData(true);
//   }

//   filterEmails(event: AutoCompleteCompleteEvent) {
//     const query = event.query;
//     if (!query) {
//       this.emailSuggestions = [];
//       return;
//     }
//     this.emailSuggestions = query.includes('@') ? [] : this.domains.map(domain => query + domain);
//   }

//   getData(isReset: boolean = false) {
//     if (isReset) {
//       this.currentPage = 1;
//       this.data = [];
//       this.totalCount = 0;
//       this.hasNextPage = true;
//     }

//     if (this.isLoading || (!isReset && !this.hasNextPage)) return;
//     this.isLoading = true;

//     const filterParams = { ...this.customerFilter, page: this.currentPage, limit: this.pageSize };

//     this.customerService.getAllCustomerData(filterParams).pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res: any) => {
//         let newData: any[] = [];
//         if (res.data && Array.isArray(res.data.data)) {
//           newData = res.data.data;
//         }
//         if (res.pagination) {
//           this.hasNextPage = res.pagination.hasNextPage;
//           this.totalCount = res.pagination.totalResults;
//         } else {
//           this.hasNextPage = newData.length >= this.pageSize;
//           this.totalCount = res.results || 0;
//         }

//         if (isReset) {
//           this.data = newData;
//         } else {
//           this.data = [...this.data, ...newData];
//         }

//         if (this.gridApi && !isReset && newData.length > 0) {
//           this.gridApi.applyTransaction({ add: newData });
//         }

//         if (this.hasNextPage) {
//           this.currentPage++;
//         }

//         this.isLoading = false;
//         this.cdr.markForCheck();
//       },
//       error: (err: any) => {
//         this.isLoading = false;
//         this.messageService.handleHttpError(err);
//         this.cdr.markForCheck();
//       }
//     });
//   }

//   onScrolledToBottom(_?: any) {
//     if (!this.isLoading && this.hasNextPage) {
//       this.getData(false);
//     }
//   }

//   eventFromGrid(event: any) {
//     if (event.type === 'init') {
//       this.gridApi = event.api;
//       return;
//     }
//     if (event.type === 'cellClicked' || event.type === 'view') {
//       const customerId = event.row?._id;
//       if (customerId) {
//         this.router.navigate(['/customer', customerId]);
//       }
//     }
//     if (event.type === 'reachedBottom') {
//       this.onScrolledToBottom();
//     }
//     if (event.type === 'selectionChanged') {
//       this.selectedRows = event.rows || [];
//     }
//     if (event.type === 'save') {
//       const limitVal = Number(event.row.creditLimit) || 0;
//       this.customerService.updateCreditLimit(event.row._id, { creditLimit: limitVal }).pipe(takeUntil(this.destroy$)).subscribe({
//         next: () => this.messageService.showSuccess('Credit limit updated successfully'),
//         error: (err: any) => this.messageService.handleHttpError(err)
//       });
//     }
//     if (event.type === 'delete') {
//       this.confirmDelete(event.row);
//     }
//   }

//   confirmDelete(customer: any) {
//     this.confirmationService.confirm({
//       message: `Are you sure you want to delete the customer "${customer.name}"? This action cannot be undone.`,
//       header: 'Confirm Deletion',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger',
//       rejectButtonStyleClass: 'p-button-text',
//       accept: () => {
//         this.customerService.deleteCustomer(customer._id).pipe(takeUntil(this.destroy$)).subscribe({
//           next: () => {
//             this.messageService.showSuccess('Customer deleted successfully');
//             this.getData(true);
//           },
//           error: (err: any) => {
//             this.messageService.handleHttpError(err);
//           }
//         });
//       }
//     });
//   }

//   openPhotoUpload() {
//     if (this.selectedRows.length !== 1) return;
//     const custId = this.selectedRows[0]._id;

//     this.dialogServices.openImageUpload({
//       header: 'Update Customer Photo',
//       description: `Upload a new avatar for ${this.selectedRows[0].name}.`,
//       uploadFn: (file: File) => this.customerService.uploadCustomerPhoto(custId, file)
//     })?.onClose.pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
//       if (res?.data?.customer?.photo) {
//         this.messageService.showSuccess('Photo updated successfully.');
//         this.getData(true);
//       }
//     });
//   }

//   openBulkImport() {
//     this.dialogServices.openBulkCustomer();
//   }

//   private badge(label: string, bg: string, color: string, border: string): string {
//     return `<span style="background:${bg}; color:${color}; border:1px solid ${border}; padding:1px 6px; border-radius:3px; font-size:10px; font-weight:700; letter-spacing:0.3px; text-transform:uppercase; white-space:nowrap; line-height:1.4; display:inline-block;">${label}</span>`;
//   }

//   private twoLine(top: string, bottom: string, topStyle = 'font-size:11px; color:var(--text-secondary);', bottomStyle = 'font-size:10px; color:var(--text-tertiary);'): string {
//     return `<div style="display:flex; flex-direction:column; justify-content:center; gap:0px; line-height:1.25; overflow:hidden;"><span style="${topStyle} white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${top}</span><span style="${bottomStyle} white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${bottom}</span></div>`;
//   }

//   getColumn(): void {
//     this.column = [
//       {
//         headerName: 'Customer Identity',
//         children: [
//           {
//             field: 'name',
//             headerName: 'Name & Type',
//             pinned: 'left',
//             minWidth: 210,
//             flex: 2,
//             cellStyle: { display: 'flex', alignItems: 'center', padding: '0 10px' },
//             cellRenderer: (params: any) => {
//               if (!params.value) return '';
//               const d = params.data;
//               const initials = this.common.getInitials(d.name);
//               const avatar = this.common.getAvatarStyle(d.name);
//               const isIndiv = d.type === 'individual';
//               const icon = isIndiv ? 'pi-user' : 'pi-building';
//               const sub = d.contactPerson && d.contactPerson !== d.name ? d.contactPerson : this.common.toTitleCase(d.type || '');
//               return `<div style="display:flex; align-items:center; gap:8px; width:100%; overflow:hidden;"><span style="width:26px; height:26px; border-radius:50%; flex-shrink:0; background:${avatar.background}; color:${avatar.color}; display:inline-flex; align-items:center; justify-content:center; font-size:9px; font-weight:700;">${initials}</span>${this.twoLine(d.name, `<i class="pi ${icon}" style="font-size:8px; margin-right:3px;"></i>${sub}`, 'font-size:12px; font-weight:600; color:var(--text-primary);', 'font-size:10px; color:var(--text-tertiary);')}</div>`;
//             }
//           },
//           {
//             field: 'isActive',
//             headerName: 'Status',
//             width: 90,
//             cellStyle: { display: 'flex', alignItems: 'center' },
//             cellRenderer: (params: any) => {
//               if (params.data.isDeleted) return this.badge('Deleted', 'var(--color-error-bg)', 'var(--color-error)', 'var(--color-error-border)');
//               return params.value ? this.badge('Active', 'var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)') : this.badge('Inactive', 'var(--bg-secondary)', 'var(--text-tertiary)', 'var(--border-primary)');
//             }
//           },
//           {
//             field: 'tags',
//             headerName: 'Tags',
//             width: 135,
//             cellRenderer: (params: any) => {
//               const tags: string[] = (params.value || []).filter((t: string) => t?.trim());
//               if (!tags.length) return `<span class="tag-empty">—</span>`;
//               const chips = tags.slice(0, 2).map(tag => `<span class="tag-chip">${this.common.toTitleCase(tag)}</span>`).join('');
//               const more = tags.length > 2 ? `<span class="tag-more">+${tags.length - 2}</span>` : '';
//               return `<div class="tag-container">${chips}${more}</div>`;
//             }
//           }
//         ]
//       },
//       {
//         headerName: 'Contact Details',
//         children: [
//           { headerName: 'Email', field: 'email', width: 195, cellStyle: { display: 'flex', alignItems: 'center' }, cellRenderer: (params: any) => params.value ? `<div style="display:flex; align-items:center; gap:5px; overflow:hidden; width:100%;"><i class="pi pi-envelope" style="font-size:9px; color:var(--text-tertiary); flex-shrink:0;"></i><span style="font-size:11px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${params.value}</span></div>` : `<span style="color:var(--text-tertiary);font-size:10px;">—</span>` },
//           { headerName: 'Phone', field: 'phone', width: 145, cellStyle: { display: 'flex', alignItems: 'center' }, cellRenderer: (params: any) => {
//             const phone = params.value;
//             const alt = params.data?.altPhone;
//             if (!phone) return `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`;
//             const top = `<i class="pi pi-phone" style="font-size:8px; margin-right:3px;"></i>${this.common.formatPhone(phone)}`;
//             const bot = alt ? `Alt: ${this.common.formatPhone(alt)}` : '';
//             return bot ? this.twoLine(top, bot) : `<div style="display:flex; align-items:center; gap:4px;"><i class="pi pi-phone" style="font-size:9px; color:var(--text-tertiary);"></i><span style="font-size:11px; color:var(--text-secondary);">${this.common.formatPhone(phone)}</span></div>`;
//           }},
//           { headerName: 'Location', field: 'billingAddress.city', width: 145, cellStyle: { display: 'flex', alignItems: 'center' }, valueGetter: (p: any) => { const a = p.data?.billingAddress; return a?.city ? `${a.city}, ${a.state}` : ''; }, tooltipValueGetter: (p: any) => { const a = p.data?.billingAddress; return a ? this.common.formatAddress(a) : ''; }, cellRenderer: (params: any) => params.value ? `<div style="display:flex; align-items:center; gap:4px; overflow:hidden;"><i class="pi pi-map-marker" style="font-size:9px; color:var(--text-tertiary); flex-shrink:0;"></i><span style="font-size:11px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${params.value}</span></div>` : `<span style="color:var(--text-tertiary);font-size:10px;">—</span>` }
//         ]
//       },
//       {
//         headerName: 'Financial Overview',
//         children: [
//           { field: 'outstandingBalance', headerName: 'Outstanding', width: 125, type: 'rightAligned', cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }, cellRenderer: (params: any) => { const val = params.value || 0; return val <= 0 ? this.badge('✓ Clear', 'var(--color-success-bg)', 'var(--color-success)', 'var(--color-success-border)') : `<span style="color:var(--color-warning); font-weight:700; font-family:var(--font-mono); font-size:11px;">${this.common.formatCurrency(val)}</span>`; } },
//           { field: 'creditLimit', headerName: 'Credit Limit', width: 115, type: 'rightAligned', cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }, cellRenderer: (params: any) => { const val = params.value || 0; return val ? `<span style="color:var(--text-secondary); font-family:var(--font-mono); font-size:11px;">${this.common.formatCurrency(val)}</span>` : `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`; } },
//           { field: 'invoiceCount', headerName: 'Invoices', width: 85, type: 'rightAligned', cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: '600', fontSize: '12px' }, cellRenderer: (params: any) => `<span style="font-weight:600; font-size:12px; color:${(params.value || 0) > 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)'};">${params.value || 0}</span>` },
//           { field: 'totalPurchases', headerName: 'Purchases', width: 125, type: 'rightAligned', cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }, cellRenderer: (params: any) => { const val = params.value || 0; return val ? `<span style="font-weight:700; color:var(--text-primary); font-family:var(--font-mono); font-size:11px;">${this.common.formatCurrency(val)}</span>` : `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`; } },
//           { field: 'paymentTerms', headerName: 'Terms', width: 90, cellStyle: { display: 'flex', alignItems: 'center' }, cellRenderer: (params: any) => `<span style="font-size:10px; color:var(--text-secondary); background:var(--bg-secondary); border:1px solid var(--border-primary); padding:1px 6px; border-radius:3px;">${params.value && params.value !== '0' ? params.value : 'Standard'}</span>` }
//         ]
//       },
//       {
//         headerName: 'Compliance',
//         children: [
//           { field: 'gstNumber', headerName: 'GST / PAN', width: 155, cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' }, cellRenderer: (params: any) => {
//             const gst = params.value;
//             const pan = params.data?.panNumber;
//             if (!gst && !pan) return `<span style="color:var(--text-tertiary);font-size:10px;">—</span>`;
//             const top = gst ? `<span style="font-size:11px; font-weight:600; font-family:var(--font-mono); color:var(--text-primary);">${this.common.formatGSTIN(gst)}</span>` : '';
//             const bot = pan ? `<i class="pi pi-id-card" style="font-size:8px; margin-right:2px;"></i>${this.common.formatPAN(pan)}` : '';
//             if (top && bot) return this.twoLine(gst, bot, 'font-size:11px; font-weight:600; font-family:var(--font-mono); color:var(--text-primary);', 'font-size:10px; color:var(--text-tertiary);');
//             return top || `<span style="font-size:11px; color:var(--text-secondary);">${bot}</span>`;
//           }}
//         ]
//       },
//       {
//         headerName: 'System',
//         children: [
//           { field: 'notes', headerName: 'Notes', width: 135, tooltipField: 'notes', cellStyle: { display: 'flex', alignItems: 'center' }, cellRenderer: (params: any) => params.value ? `<div style="display:flex; align-items:center; gap:5px; overflow:hidden;"><i class="pi pi-file-o" style="font-size:9px; color:var(--text-tertiary); flex-shrink:0;"></i><span style="font-size:11px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${this.common.truncateText(params.value, 25)}</span></div>` : `<span style="color:var(--text-tertiary);font-size:10px;">—</span>` },
//           { field: 'createdAt', headerName: 'Since', width: 110, sortable: true, cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' }, cellRenderer: (params: any) => params.value ? this.twoLine(this.common.formatDate(params.value), this.common.timeAgoText(params.value)) : '-' }
//         ]
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }
