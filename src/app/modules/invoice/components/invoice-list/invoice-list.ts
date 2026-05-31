import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation, inject, signal, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { GridApi } from 'ag-grid-community';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';

// Services & Shared
import { AppMessageService } from '../../../../core/services/message.service';
import { InvoiceService } from '../../services/invoice-service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { DynamicDialogServices } from '../../../../core/services/dynamic-dialog-services';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
import { AgShareGrid, ActionColumnConfig } from "../../../shared/components/ag-shared-grid";
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    RouterModule,
    ToastModule,
    DatePickerModule,
    AgShareGrid,
    HasPermissionDirective,
    MasterDropdownComponent
],
  template: `
    <p-toast position="bottom-right"></p-toast>

    <div class="page-layout">
      
      <header class="list-header elevation-card">
        <div class="header-left">
          <div class="icon-box">
            <i class="pi pi-receipt"></i>
          </div>
          <div class="header-titles">
            <h1>Invoices</h1>
            <p>Manage billing, track payments, and export reports.</p>
          </div>
        </div>

        <div class="header-actions">
          <p-button *hasPermission="PERMISSIONS.INVOICE.EXPORT" 
            label="Export CSV" icon="pi pi-download" size="small"
            styleClass="p-button-outlined theme-btn-secondary" 
            [loading]="isExporting" 
            (onClick)="exportReport()">
          </p-button>

          <p-button *hasPermission="PERMISSIONS.INVOICE.CREATE" 
            label="New Invoice" icon="pi pi-plus" size="small"
            routerLink="create"
            styleClass="p-button-primary">
          </p-button>
        </div>
      </header>

      <div class="filter-panel elevation-card">
        <div class="filter-grid">
          
          <div class="filter-field">
            <label for="dateRange">Date Range</label>
            <p-datepicker 
              inputId="dateRange" 
              [(ngModel)]="dateRange" 
              selectionMode="range" 
              [readonlyInput]="true" 
              placeholder="Start - End"
              [showIcon]="true" 
              appendTo="body" 
              (onClose)="applyFilters()" 
              styleClass="w-full"
              inputStyleClass="w-full theme-control">
            </p-datepicker>
          </div>

          <div class="filter-field">
            <label for="invoiceNumber">Invoice No.</label>
            <input id="invoiceNumber" type="text" pInputText 
              [(ngModel)]="invoiceFilter.invoiceNumber"
              placeholder="Search..." 
              (keydown.enter)="applyFilters()" 
              class="w-full theme-control" />
          </div>

          <div class="filter-field">
            <label for="customer">Customer</label>
            <app-master-dropdown 
              endpoint="customers" 
              [(ngModel)]="invoiceFilter.customerId" 
              (onSelect)="applyFilters()" 
              placeholder="All Customers">
            </app-master-dropdown>
          </div>

          <div class="filter-field">
            <label for="status">Status</label>
            <p-select 
              id="status" 
              appendTo="body" 
              [options]="statusOptions" 
              [(ngModel)]="invoiceFilter.status"
              [showClear]="true" 
              placeholder="All Status" 
              (onChange)="applyFilters()" 
              styleClass="w-full theme-control" 
              [filter]="true"
              filterBy="label">
            </p-select>
          </div>

          <div class="filter-field">
            <label for="paymentStatus">Payment</label>
            <p-select 
              id="paymentStatus" 
              appendTo="body" 
              [options]="paymentStatusOptions"
              [(ngModel)]="invoiceFilter.paymentStatus" 
              [showClear]="true" 
              placeholder="All Payments"
              (onChange)="applyFilters()" 
              styleClass="w-full theme-control" 
              [filter]="true" 
              filterBy="label">
            </p-select>
          </div>

        </div>
        
        <div class="filter-actions">
          <p-button label="Apply" icon="pi pi-check" size="small"
            styleClass="p-button-primary"
            (onClick)="applyFilters()">
          </p-button>
          <p-button label="Reset" icon="pi pi-refresh" size="small"
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
          [actionColumn]="invoiceActionColumn" 
          selectionMode="multiple"
          (gridEvent)="eventFromGrid($event)">
        </app-ag-share-grid>
      </div>

    </div>
  `,
  styles: [`
    /* =========================================================
       INVOICE LIST - COMPACT, HIGH-DENSITY UI
       ========================================================= */

    :host {
      display: block;
      width: 100%;
      height: 100%;
      font-family: var(--font-body);
    }

    /* Layout Skeleton - Tighter Padding */
    .page-layout {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      padding: var(--spacing-lg) var(--spacing-xl); /* Reduced from 2xl */
      gap: var(--spacing-md); /* Reduced from xl */
      overflow: hidden;
    }

    /* Shared Card Styles */
    .elevation-card {
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      box-shadow: var(--shadow-sm);
    }

    /* ── COMPACT HEADER ── */
    .list-header {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md) var(--spacing-lg); /* Tightened */
      flex-wrap: wrap;
      gap: var(--spacing-md);

      .header-left {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);

        .icon-box {
          width: 2.25rem;
          height: 2.25rem;
          background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
          color: var(--accent-primary);
          border-radius: var(--ui-border-radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-md);
        }

        .header-titles {
          h1 {
            font-family: var(--font-heading);
            font-size: var(--font-size-lg); /* Scaled down for compact look */
            font-weight: var(--font-weight-bold);
            color: var(--text-primary);
            margin: 0 0 2px 0;
            line-height: var(--line-height-tight);
          }
          p {
            font-size: var(--font-size-xs);
            color: var(--text-secondary);
            margin: 0;
          }
        }
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-sm);
      }
    }

    /* ── STREAMLINED FILTER PANEL ── */
    .filter-panel {
      flex-shrink: 0;
      padding: var(--spacing-md) var(--spacing-lg);
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: var(--spacing-lg);
      flex-wrap: wrap;

      .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--spacing-md);
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
          letter-spacing: 0.04em;
          color: var(--text-tertiary);
        }
      }

      .filter-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
      }
    }

    /* ── AG GRID WRAPPER (HIGH DENSITY OVERRIDES) ── */
    .grid-wrapper {
      flex: 1;           
      min-height: 0;     
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
          
          /* AG-GRID CSS VAR OVERRIDES FOR COMPACT HEADERS */
          --ag-header-height: 38px;
          --ag-row-height: 44px;
          --ag-font-size: var(--font-size-sm);
          --ag-font-family: var(--font-body);
          --ag-header-background-color: var(--bg-secondary);
          --ag-header-foreground-color: var(--text-tertiary);
          --ag-border-color: var(--border-primary);
          --ag-row-border-color: var(--component-divider);
          --ag-row-hover-color: var(--bg-hover);
        }

        ::ng-deep .ag-root-wrapper {
          border: none !important;
          border-radius: var(--ui-border-radius);
        }

        ::ng-deep .ag-header-cell-label {
          font-weight: var(--font-weight-bold);
          font-size: calc(var(--font-size-xs) * 0.95);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      }
    }

    /* ==========================================================================
       GLOBAL INJECTED STYLES FOR CELL RENDERERS
       ========================================================================== */
    ::ng-deep {
      
      /* Layout & Alignments */
      .cell-flex-center { display: flex; align-items: center; height: 100%; }
      .cell-flex-end { display: flex; align-items: center; justify-content: flex-end; height: 100%; }
      .cell-stack { display: flex; flex-direction: column; justify-content: center; height: 100%; }
      .align-end { align-items: flex-end; }

      /* Spacing & Utilities */
      .gap-xs { gap: var(--spacing-xs); }
      .gap-sm { gap: var(--spacing-sm); }
      .px-sm { padding: 0 var(--spacing-sm) !important; }
      .w-full { width: 100%; }

      /* Typography */
      .font-mono { font-family: var(--font-mono); }
      .font-semibold { font-weight: var(--font-weight-semibold); }
      .font-bold { font-weight: var(--font-weight-bold); }
      .line-tight { line-height: var(--line-height-tight); }
      .tracking-tight { letter-spacing: 0.2px; }
      
      .cursor-pointer { cursor: pointer; }
      .hover-underline:hover { text-decoration: underline; }

      .text-xxs { font-size: calc(var(--font-size-xs) * 0.85); }
      .text-xs { font-size: var(--font-size-xs); }
      .text-sm { font-size: var(--font-size-sm); }

      .text-primary { color: var(--text-primary); }
      .text-secondary { color: var(--text-secondary); }
      .text-tertiary { color: var(--text-tertiary); }
      .text-accent { color: var(--accent-primary); }
      .text-success { color: var(--color-success); }
      .text-warning { color: var(--color-warning); }
      .text-error { color: var(--color-error); }
      .text-info { color: var(--color-info); }

      .ellipsis {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: inline-block;
        max-width: 100%;
      }

      /* Icons */
      .icon-xxs { font-size: 0.5rem; flex-shrink: 0; }
      .icon-xs { font-size: 0.65rem; }
      .icon-accent-muted { font-size: 0.75rem; color: var(--accent-primary); opacity: 0.7; }
      .icon-overdue { font-size: 0.65rem; color: var(--color-error); margin-left: var(--spacing-xs); }

      /* Avatars */
      .avatar-xs, .avatar-sm {
        border-radius: var(--ui-border-radius-pill);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: var(--font-weight-bold);
        text-transform: uppercase;
        flex-shrink: 0;
      }
      .avatar-xs { width: 1.25rem; height: 1.25rem; font-size: 0.55rem; }
      .avatar-sm { width: 1.5rem; height: 1.5rem; font-size: 0.65rem; }

      /* Customer Block */
      .cell-customer {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        width: 100%;
        overflow: hidden;
      }

      .customer-info { display: flex; flex-direction: column; justify-content: center; min-width: 0; gap: 1px; }
      .customer-name { font-weight: var(--font-weight-semibold); color: var(--text-primary); font-size: var(--font-size-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .customer-contact { font-size: var(--font-size-xs); color: var(--text-tertiary); display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      /* Tags & Badges - Scaled down for density */
      .grid-badge {
        padding: 2px 6px;
        border-radius: var(--ui-border-radius-sm);
        font-size: calc(var(--font-size-xs) * 0.9);
        font-weight: var(--font-weight-bold);
        letter-spacing: 0.05em;
        white-space: nowrap;
        text-transform: uppercase;
        border: var(--ui-border-width) solid transparent;
        display: inline-flex;
        align-items: center;
        height: fit-content;
      }

      .badge-dynamic { border-color: rgba(0,0,0,0.05); }
      .badge-info-soft { background: var(--color-info-bg); color: var(--color-info-dark); border-color: var(--color-info-border); }
      .badge-warning-soft { background: var(--color-warning-bg); color: var(--color-warning-dark); border-color: var(--color-warning-border); }

      .badge-success-solid {
        color: var(--color-success-dark);
        font-weight: var(--font-weight-bold);
        font-size: calc(var(--font-size-xs) * 0.9);
        background: var(--color-success-bg);
        border: var(--ui-border-width) solid var(--color-success-border);
        padding: 2px 6px;
        border-radius: var(--ui-border-radius-sm);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        display: inline-flex;
        align-items: center;
      }

      .tag-alert {
        font-size: calc(var(--font-size-xs) * 0.85);
        font-weight: var(--font-weight-bold);
        line-height: var(--line-height-tight);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      /* Progress Bar */
      .progress-track {
        width: 60px;
        height: 4px;
        background: var(--border-primary);
        border-radius: var(--ui-border-radius-pill);
        overflow: hidden;
        margin-top: 2px;
      }
      .progress-fill {
        height: 100%;
        background: var(--color-success);
        border-radius: var(--ui-border-radius-pill);
        transition: width var(--transition-base);
      }

      .theme-btn-secondary {
        color: var(--text-secondary) !important;
        border-color: var(--border-secondary) !important;
        &:hover { background: var(--bg-ternary) !important; color: var(--text-primary) !important; }
      }
    }
  `],
  encapsulation: ViewEncapsulation.None
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  private invoiceService = inject(InvoiceService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public common = inject(CommonMethodService); 
  private dialogServices = inject(DynamicDialogServices);

  PERMISSIONS = PERMISSIONS;

  readonly invoiceActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: false,
    showDelete: false,
    showReturn: true,
    viewPermission: PERMISSIONS.INVOICE.READ,
    returnPermission: PERMISSIONS.SALES_RETURN.MANAGE
  };

  private gridApi!: GridApi;
  private currentPage = 1;
  private pageSize = 50;
  hasNextPage = true;
  isLoading = false;
  isExporting = false;
  totalCount = 0;

  data: any[] = [];
  column: any[] = [];
  rowSelectionMode: any = 'single';

  statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Issued', value: 'issued' },
    { label: 'Paid', value: 'paid' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  paymentStatusOptions = [
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Partial', value: 'partial' },
    { label: 'Paid', value: 'paid' },
  ];

  invoiceFilter = {
    invoiceNumber: null,
    customerId: null,
    status: null,
    paymentStatus: null,
  };

  dateRange: Date[] | undefined;

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.invoiceFilter = {
      invoiceNumber: null,
      customerId: null,
      status: null,
      paymentStatus: null,
    };
    this.dateRange = undefined;
    this.getData(true);
  }

  onScrolledToBottom(_: any) {
    if (!this.isLoading && this.hasNextPage) {
      this.getData(false);
    }
  }

  eventFromGrid(event: any) {
    if (event.type === 'init') {
      this.gridApi = event.api;
      return;
    }
    if (event.type === 'cellClicked') {
      const invoiceId = event.row._id;
      this.router.navigate([invoiceId], { relativeTo: this.route });
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event)
    }
    if (event.type === 'return') {
      this.dialogServices.openSalesReturn({ invoice: event.row })?.onClose.pipe(takeUntil(this.destroy$)).subscribe(res => {
        if (res) this.getData(true);
      });
    }
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

    this.invoiceService.getAllInvoices(filterParams).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        let newData = res.data?.data || [];
        if (res.pagination) {
          this.hasNextPage = res.pagination.hasNextPage;
          this.totalCount = res.pagination.totalResults;
        }
        if (isReset) {
          this.data = newData;
        } else {
          this.data = [...this.data, ...newData];
        }
        if (this.gridApi && !isReset && newData.length > 0) {
          this.gridApi.applyTransaction({ add: newData });
        }
        if (this.hasNextPage) this.currentPage++;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.handleHttpError(err);
        this.cdr.markForCheck();
      }
    });
  }

  exportReport() {
    if (this.isExporting) return;
    this.isExporting = true;
    const filters = { ...this.invoiceFilter };
    
    this.invoiceService.exportInvoices(filters)
      .pipe(
        finalize(() => {
          this.isExporting = false;
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoices_export_${new Date().getTime()}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.messageService.showSuccess('Report exported successfully.');
        },
        error: (err) => this.messageService.handleHttpError(err)
      });
  }

  getColumn(): void {
    this.column = [
      {
        headerName: 'Identity',
        children: [
          {
            field: 'invoiceNumber',
            headerName: 'Invoice #',
            pinned: 'left',
            width: 175,
            filter: 'agTextColumnFilter',
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              const isOverdue = params.data?.dueDate && this.common.isPast(params.data.dueDate) && params.data?.paymentStatus !== 'paid';
              const overdueIcon = isOverdue ? `<i class="pi pi-exclamation-circle icon-overdue" title="Overdue"></i>` : '';
              return `<div class="cell-flex-center gap-xs"><i class="pi pi-file-text icon-accent-muted"></i><span class="text-accent font-mono font-bold cursor-pointer hover-underline">${params.value}</span>${overdueIcon}</div>`;
            }
          },
          {
            field: 'branchId.name',
            headerName: 'Branch',
            width: 130,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => params.value ? `<div class="cell-flex-center gap-xs"><i class="pi pi-building text-tertiary icon-xs"></i><span class="text-secondary font-semibold ellipsis">${params.value}</span></div>` : '-'
          },
          {
            field: 'createdBy.name',
            headerName: 'Created By',
            width: 140,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              const name = params.value || params.data?.createdBy?.name;
              if (!name) return '-';
              const initials = this.common.getInitials(name);
              const avatarStyle = this.common.getAvatarStyle(name);
              return `<div class="cell-flex-center gap-sm"><span class="avatar-xs" style="background: ${avatarStyle.background}; color: ${avatarStyle.color}; border: 1px solid var(--border-primary);">${initials}</span><span class="text-secondary font-semibold ellipsis">${name}</span></div>`;
            }
          }
        ]
      },
      {
        headerName: 'Customer',
        children: [
          {
            headerName: 'Name',
            field: 'customerId.name',
            width: 190,
            cellClass: 'cell-flex-center px-sm',
            cellRenderer: (params: any) => {
              const customer = params.data?.customerId;
              if (!customer) return '-';
              const name = customer.name || '-';
              const contact = customer.phone ? this.common.formatPhone(customer.phone) : customer.email || '';
              const contactIcon = customer.phone ? 'pi-phone' : 'pi-envelope';
              const initials = this.common.getInitials(name);
              const avatarStyle = this.common.getAvatarStyle(name);
              return `<div class="cell-customer"><span class="avatar-sm" style="background: ${avatarStyle.background}; color: ${avatarStyle.color}; border: 1px solid var(--border-primary);">${initials}</span><div class="customer-info"><span class="customer-name">${name}</span>${contact ? `<span class="customer-contact"><i class="pi ${contactIcon} icon-xxs"></i> ${contact}</span>` : ''}</div></div>`;
            }
          },
          {
            field: 'placeOfSupply',
            headerName: 'Supply State',
            width: 125,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => params.value ? `<div class="cell-flex-center gap-xs"><i class="pi pi-map-marker text-tertiary icon-xs"></i><span class="text-secondary text-sm">${params.value}</span></div>` : `<span class="text-tertiary">—</span>`
          },
          {
            field: 'gstType',
            headerName: 'GST Type',
            width: 125,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              const label = this.common.toTitleCase(params.value.replace(/-/g, ' '));
              const badgeClass = params.value?.toLowerCase().includes('intra') ? 'badge-info-soft' : 'badge-warning-soft';
              return `<span class="grid-badge ${badgeClass}">${label}</span>`;
            }
          }
        ]
      },
      {
        headerName: 'Status & Timeline',
        children: [
          {
            field: 'invoiceDate',
            headerName: 'Invoice Date',
            width: 130,
            sort: 'desc',
            valueGetter: (p: any) => p.data?.invoiceDate ? new Date(p.data.invoiceDate) : null,
            cellClass: 'cell-flex-center px-sm',
            cellRenderer: (params: any) => params.value ? `<div class="cell-stack"><span class="text-secondary text-sm font-semibold line-tight">${this.common.formatDate(params.value)}</span><span class="text-tertiary text-xs line-tight">${this.common.timeAgoText(params.value)}</span></div>` : '-'
          },
          {
            field: 'dueDate',
            headerName: 'Due Date',
            width: 130,
            valueGetter: (p: any) => p.data?.dueDate ? new Date(p.data.dueDate) : null,
            cellClass: 'cell-flex-center px-sm',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              const isPaid = params.data?.paymentStatus === 'paid';
              const isOverdue = this.common.isPast(params.value) && !isPaid;
              const isNear = !isOverdue && this.common.isWithinDays(params.value, 3) && !isPaid;
              const colorClass = isOverdue ? 'text-error' : isNear ? 'text-warning' : 'text-secondary';
              const weightClass = isOverdue ? 'font-bold' : 'font-semibold';
              const tag = isOverdue ? `<span class="tag-alert text-error">⚠ Overdue</span>` : isNear ? `<span class="tag-alert text-warning">Due soon</span>` : '';
              return `<div class="cell-stack"><span class="text-sm line-tight ${colorClass} ${weightClass}">${this.common.formatDate(params.value)}</span>${tag}</div>`;
            }
          },
          {
            field: 'status',
            headerName: 'Status',
            width: 110,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              const theme = (this.common as any)['_resolveBadgeTheme'](params.value);
              return `<span class="grid-badge badge-dynamic" style="background: ${theme.bg}; color: ${theme.text};">${params.value}</span>`;
            }
          },
          {
            field: 'paymentStatus',
            headerName: 'Payment',
            width: 110,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              const theme = (this.common as any)['_resolveBadgeTheme'](params.value);
              return `<span class="grid-badge badge-dynamic" style="background: ${theme.bg}; color: ${theme.text};">${params.value}</span>`;
            }
          },
          {
            field: 'paymentMethod',
            headerName: 'Method',
            width: 110,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              const iconMap: Record<string, string> = { cash: 'pi-wallet', cheque: 'pi-file', neft: 'pi-send', rtgs: 'pi-send', imps: 'pi-send', upi: 'pi-mobile', card: 'pi-credit-card', bank_transfer: 'pi-building', dd: 'pi-file' };
              const icon = iconMap[params.value?.toLowerCase()] || 'pi-credit-card';
              return `<div class="cell-flex-center gap-xs"><i class="pi ${icon} icon-accent-muted icon-xs"></i><span class="text-secondary text-sm font-semibold">${this.common.toTitleCase(params.value)}</span></div>`;
            }
          }
        ]
      },
      {
        headerName: 'Financials',
        children: [
          { field: 'subTotal', headerName: 'Subtotal', width: 120, type: 'rightAligned', cellClass: 'cell-flex-end text-secondary font-mono text-sm', valueFormatter: (p: any) => this.common.formatCurrency(p.value) },
          { field: 'totalTax', headerName: 'GST', width: 105, type: 'rightAligned', cellClass: 'cell-flex-end', cellRenderer: (params: any) => `<span class="font-mono text-sm font-semibold ${(params.value || 0) > 0 ? 'text-info' : 'text-tertiary'}">${(params.value || 0) > 0 ? this.common.formatCurrency(params.value) : '—'}</span>` },
          { field: 'totalDiscount', headerName: 'Discount', width: 105, type: 'rightAligned', cellClass: 'cell-flex-end', cellRenderer: (params: any) => (params.value || 0) <= 0 ? `<span class="text-tertiary text-sm">—</span>` : `<span class="text-success font-mono font-bold text-sm">-${this.common.formatCurrency(params.value)}</span>` },
          { field: 'grandTotal', headerName: 'Grand Total', width: 130, type: 'rightAligned', cellClass: 'cell-flex-end', cellRenderer: (params: any) => `<span class="text-primary font-mono font-bold text-sm tracking-tight">${this.common.formatCurrency(params.value || 0)}</span>` },
          { field: 'paidAmount', headerName: 'Paid', width: 115, type: 'rightAligned', cellClass: 'cell-flex-end', cellRenderer: (params: any) => (params.value || 0) <= 0 ? `<span class="text-tertiary text-sm">—</span>` : `<span class="text-success font-mono font-bold text-sm">${this.common.formatCurrency(params.value)}</span>` },
          { field: 'balanceAmount', headerName: 'Balance Due', width: 135, type: 'rightAligned', cellClass: 'cell-flex-end', cellRenderer: (params: any) => {
            const balance = params.value || 0;
            const grandTotal = params.data?.grandTotal || 0;
            if (balance <= 0) return `<span class="badge-success-solid">✓ Paid</span>`;
            const pct = grandTotal > 0 ? this.common.percent(grandTotal - balance, grandTotal, 0) : 0;
            const isOverdue = params.data?.dueDate && this.common.isPast(params.data.dueDate);
            const colorClass = isOverdue ? 'text-error' : 'text-warning';
            return `<div class="cell-stack align-end w-full gap-xs"><span class="${colorClass} font-mono font-bold text-sm">${this.common.formatCurrency(balance)}</span>${pct > 0 ? `<div class="progress-track"><div class="progress-fill" style="width: ${pct}%;"></div></div>` : ''}</div>`;
          }}
        ]
      }
    ];
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
// import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation, inject, signal, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, ActivatedRoute, RouterModule } from '@angular/router';
// import { Subject } from "rxjs";
// import { finalize, takeUntil } from 'rxjs/operators';
// import { GridApi } from 'ag-grid-community';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { DatePickerModule } from 'primeng/datepicker';
// import { ToastModule } from 'primeng/toast';

// // Services & Shared
// import { AppMessageService } from '../../../../core/services/message.service';
// import { InvoiceService } from '../../services/invoice-service';
// import { CommonMethodService } from '../../../../core/utils/common-method.service';
// import { DynamicDialogServices } from '../../../../core/services/dynamic-dialog-services';
// import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
// import { AgShareGrid, ActionColumnConfig } from "../../../shared/components/ag-shared-grid";
// import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
// import { PERMISSIONS } from '../../../../core/auth/permissions.constants';

// @Component({
//   selector: 'app-invoice-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     SelectModule,
//     FormsModule,
//     ButtonModule,
//     InputTextModule,
//     RouterModule,
//     ToastModule,
//     DatePickerModule,
//     AgShareGrid,
//     HasPermissionDirective,
//     MasterDropdownComponent
//   ],
//   template: `
//     <p-toast position="bottom-right"></p-toast>

//     <div class="page-layout">
      
//       <header class="list-header elevation-card">
//         <div class="header-left">
//           <div class="icon-box">
//             <i class="pi pi-receipt"></i>
//           </div>
//           <div class="header-titles">
//             <h1>Invoices</h1>
//             <p>Manage billing, track payments, and export reports.</p>
//           </div>
//         </div>

//         <div class="header-actions">
//           <p-button *hasPermission="PERMISSIONS.INVOICE.EXPORT" 
//             label="Export CSV" icon="pi pi-download"
//             styleClass="p-button-outlined theme-btn-secondary" 
//             [loading]="isExporting" 
//             (onClick)="exportReport()">
//           </p-button>

//           <p-button *hasPermission="PERMISSIONS.INVOICE.CREATE" 
//             label="New Invoice" icon="pi pi-plus" 
//             routerLink="create"
//             styleClass="p-button-primary">
//           </p-button>
//         </div>
//       </header>

//       <div class="filter-panel elevation-card">
//         <div class="filter-grid">
          
//           <div class="filter-field">
//             <label for="dateRange">Date Range</label>
//             <p-datepicker 
//               inputId="dateRange" 
//               [(ngModel)]="dateRange" 
//               selectionMode="range" 
//               [readonlyInput]="true" 
//               placeholder="Start - End"
//               [showIcon]="true" 
//               appendTo="body" 
//               (onClose)="applyFilters()" 
//               styleClass="w-full"
//               inputStyleClass="w-full theme-control">
//             </p-datepicker>
//           </div>

//           <div class="filter-field">
//             <label for="invoiceNumber">Invoice Number</label>
//             <input id="invoiceNumber" type="text" pInputText 
//               [(ngModel)]="invoiceFilter.invoiceNumber"
//               placeholder="Search number" 
//               (keydown.enter)="applyFilters()" 
//               class="w-full theme-control" />
//           </div>

//           <div class="filter-field">
//             <label for="customer">Customer</label>
//             <app-master-dropdown 
//               endpoint="customers" 
//               [(ngModel)]="invoiceFilter.customerId" 
//               (onSelect)="applyFilters()" 
//               placeholder="All Customers">
//             </app-master-dropdown>
//           </div>

//           <div class="filter-field">
//             <label for="status">Status</label>
//             <p-select 
//               id="status" 
//               appendTo="body" 
//               [options]="statusOptions" 
//               [(ngModel)]="invoiceFilter.status"
//               [showClear]="true" 
//               placeholder="All Status" 
//               (onChange)="applyFilters()" 
//               styleClass="w-full theme-control" 
//               [filter]="true"
//               filterBy="label">
//             </p-select>
//           </div>

//           <div class="filter-field">
//             <label for="paymentStatus">Payment</label>
//             <p-select 
//               id="paymentStatus" 
//               appendTo="body" 
//               [options]="paymentStatusOptions"
//               [(ngModel)]="invoiceFilter.paymentStatus" 
//               [showClear]="true" 
//               placeholder="All Payments"
//               (onChange)="applyFilters()" 
//               styleClass="w-full theme-control" 
//               [filter]="true" 
//               filterBy="label">
//             </p-select>
//           </div>

//         </div>
        
//         <div class="filter-actions">
//           <p-button label="Apply" icon="pi pi-check" 
//             styleClass="p-button-primary"
//             (onClick)="applyFilters()">
//           </p-button>
//           <p-button label="Reset" icon="pi pi-refresh" 
//             styleClass="p-button-text theme-btn-secondary"
//             (onClick)="resetFilters()">
//           </p-button>
//         </div>
//       </div>

//       <div class="grid-wrapper elevation-card">
//         <app-ag-share-grid 
//           class="full-size-grid"
//           [columns]="column" 
//           [data]="data" 
//           [actionColumn]="invoiceActionColumn" 
//           selectionMode="multiple"
//           (gridEvent)="eventFromGrid($event)">
//         </app-ag-share-grid>
//       </div>

//     </div>
//   `,
//   styles: [`
//     /* =========================================================
//        INVOICE LIST - SINGLE FILE COMPONENT STYLES
//        ========================================================= */

//     :host {
//       display: block;
//       width: 100%;
//       height: 100%;
//       font-family: var(--font-body);
//     }

//     /* Layout Skeleton */
//     .page-layout {
//       height: 100%;
//       width: 100%;
//       display: flex;
//       flex-direction: column;
//       background: var(--bg-primary);
//       padding: var(--spacing-2xl);
//       gap: var(--spacing-xl);
//       overflow: hidden;
//     }

//     /* Shared Card Styles */
//     .elevation-card {
//       background: var(--bg-secondary);
//       border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       box-shadow: var(--shadow-sm);
//     }

//     /* ── HEADER ── */
//     .list-header {
//       flex-shrink: 0;
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: var(--spacing-lg) var(--spacing-2xl);
//       flex-wrap: wrap;
//       gap: var(--spacing-lg);

//       .header-left {
//         display: flex;
//         align-items: center;
//         gap: var(--spacing-lg);

//         .icon-box {
//           width: 3rem;
//           height: 3rem;
//           background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
//           color: var(--accent-primary);
//           border-radius: var(--ui-border-radius-md);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: var(--font-size-xl);
//         }

//         .header-titles {
//           h1 {
//             font-family: var(--font-heading);
//             font-size: var(--font-size-xl);
//             font-weight: var(--font-weight-bold);
//             color: var(--text-primary);
//             margin: 0 0 2px 0;
//           }
//           p {
//             font-size: var(--font-size-sm);
//             color: var(--text-secondary);
//             margin: 0;
//           }
//         }
//       }

//       .header-actions {
//         display: flex;
//         gap: var(--spacing-md);
//       }
//     }

//     /* ── FILTER PANEL ── */
//     .filter-panel {
//       flex-shrink: 0;
//       padding: var(--spacing-lg) var(--spacing-2xl);
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-end;
//       gap: var(--spacing-xl);
//       flex-wrap: wrap;

//       .filter-grid {
//         display: grid;
//         grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
//         gap: var(--spacing-lg);
//         flex: 1;
//       }

//       .filter-field {
//         display: flex;
//         flex-direction: column;
//         gap: var(--spacing-xs);

//         label {
//           font-size: var(--font-size-xs);
//           font-weight: var(--font-weight-bold);
//           text-transform: uppercase;
//           letter-spacing: 0.05em;
//           color: var(--text-tertiary);
//         }
//       }

//       .filter-actions {
//         display: flex;
//         align-items: center;
//         gap: var(--spacing-sm);
//       }
//     }

//     /* ── AG GRID WRAPPER ── */
//     .grid-wrapper {
//       flex: 1;           /* Take all remaining space */
//       min-height: 0;     /* CRITICAL: Prevent grid blowout */
//       display: flex;
//       flex-direction: column;
//       overflow: hidden;

//       .full-size-grid {
//         flex: 1;
//         width: 100%;
//         height: 100%;
//         display: flex;
//         flex-direction: column;

//         ::ng-deep ag-grid-angular {
//           width: 100%;
//           height: 100%;
//           flex: 1;
//         }

//         ::ng-deep .ag-root-wrapper {
//           border: none !important;
//           border-radius: var(--ui-border-radius-lg);
//         }
//       }
//     }

//     /* ==========================================================================
//        GLOBAL INJECTED STYLES FOR CELL RENDERERS
//        ========================================================================== */
//     ::ng-deep {
      
//       /* Layout & Alignments */
//       .cell-flex-center {
//         display: flex;
//         align-items: center;
//         height: 100%;
//       }

//       .cell-flex-end {
//         display: flex;
//         align-items: center;
//         justify-content: flex-end;
//         height: 100%;
//       }

//       .cell-stack {
//         display: flex;
//         flex-direction: column;
//         justify-content: center;
//         height: 100%;
//       }

//       .align-end {
//         align-items: flex-end;
//       }

//       /* Spacing & Utilities */
//       .gap-xs { gap: var(--spacing-xs); }
//       .gap-sm { gap: var(--spacing-sm); }
//       .px-sm { padding: 0 var(--spacing-sm) !important; }
//       .w-full { width: 100%; }

//       /* Typography */
//       .font-mono { font-family: var(--font-mono); }
//       .font-semibold { font-weight: var(--font-weight-semibold); }
//       .font-bold { font-weight: var(--font-weight-bold); }
//       .line-tight { line-height: var(--line-height-tight); }
//       .tracking-tight { letter-spacing: 0.2px; }
      
//       .cursor-pointer { cursor: pointer; }
//       .hover-underline:hover { text-decoration: underline; }

//       .text-xxs { font-size: calc(var(--font-size-xs) * 0.9); }
//       .text-xs { font-size: var(--font-size-xs); }
//       .text-sm { font-size: var(--font-size-sm); }

//       .text-primary { color: var(--text-primary); }
//       .text-secondary { color: var(--text-secondary); }
//       .text-tertiary { color: var(--text-tertiary); }
//       .text-accent { color: var(--accent-primary); }
//       .text-success { color: var(--color-success); }
//       .text-warning { color: var(--color-warning); }
//       .text-error { color: var(--color-error); }
//       .text-info { color: var(--color-info); }

//       .ellipsis {
//         white-space: nowrap;
//         overflow: hidden;
//         text-overflow: ellipsis;
//         display: inline-block;
//         max-width: 100%;
//       }

//       /* Icons */
//       .icon-xxs { font-size: 0.5rem; flex-shrink: 0; }
//       .icon-xs { font-size: 0.65rem; }
//       .icon-accent-muted { font-size: 0.65rem; color: var(--accent-primary); opacity: 0.6; }
//       .icon-overdue { font-size: 0.6rem; color: var(--color-error); margin-left: var(--spacing-xs); }

//       /* Avatars */
//       .avatar-xs, .avatar-sm {
//         border-radius: var(--ui-border-radius-pill);
//         display: inline-flex;
//         align-items: center;
//         justify-content: center;
//         font-weight: var(--font-weight-bold);
//         text-transform: uppercase;
//         flex-shrink: 0;
//       }
//       .avatar-xs { width: 1.25rem; height: 1.25rem; font-size: 0.5rem; }
//       .avatar-sm { width: 1.5rem; height: 1.5rem; font-size: 0.6rem; }

//       /* Customer Block */
//       .cell-customer {
//         display: flex;
//         align-items: center;
//         gap: var(--spacing-sm);
//         width: 100%;
//         overflow: hidden;
//       }

//       .customer-info {
//         display: flex;
//         flex-direction: column;
//         justify-content: center;
//         min-width: 0;
//         gap: 1px;
//       }

//       .customer-name {
//         font-weight: var(--font-weight-semibold);
//         color: var(--text-primary);
//         font-size: var(--font-size-sm);
//         white-space: nowrap;
//         overflow: hidden;
//         text-overflow: ellipsis;
//         line-height: var(--line-height-tight);
//       }

//       .customer-contact {
//         font-size: var(--font-size-xs);
//         color: var(--text-tertiary);
//         display: flex;
//         align-items: center;
//         gap: 3px;
//         line-height: var(--line-height-tight);
//         white-space: nowrap;
//         overflow: hidden;
//         text-overflow: ellipsis;
//       }

//       /* Tags & Badges */
//       .grid-badge {
//         padding: 2px 8px;
//         border-radius: var(--ui-border-radius-sm);
//         font-size: var(--font-size-xs);
//         font-weight: var(--font-weight-bold);
//         letter-spacing: 0.05em;
//         white-space: nowrap;
//         text-transform: uppercase;
//         border: var(--ui-border-width) solid transparent;
//         display: inline-flex;
//         align-items: center;
//         height: fit-content;
//       }

//       .badge-dynamic {
//         border-color: rgba(0,0,0,0.05); /* Soft border for dynamic colored badges */
//       }

//       .badge-info-soft {
//         background: var(--color-info-bg);
//         color: var(--color-info-dark);
//         border-color: var(--color-info-border);
//       }

//       .badge-warning-soft {
//         background: var(--color-warning-bg);
//         color: var(--color-warning-dark);
//         border-color: var(--color-warning-border);
//       }

//       .badge-success-solid {
//         color: var(--color-success-dark);
//         font-weight: var(--font-weight-bold);
//         font-size: var(--font-size-xs);
//         background: var(--color-success-bg);
//         border: var(--ui-border-width) solid var(--color-success-border);
//         padding: 2px 8px;
//         border-radius: var(--ui-border-radius-sm);
//         letter-spacing: 0.05em;
//         text-transform: uppercase;
//         display: inline-flex;
//         align-items: center;
//       }

//       .tag-alert {
//         font-size: 0.55rem;
//         font-weight: var(--font-weight-bold);
//         line-height: var(--line-height-tight);
//         text-transform: uppercase;
//         letter-spacing: 0.05em;
//       }

//       /* Progress Bar */
//       .progress-track {
//         width: 70px;
//         height: 3px;
//         background: var(--border-primary);
//         border-radius: var(--ui-border-radius-pill);
//         overflow: hidden;
//         margin-top: 2px;
//       }

//       .progress-fill {
//         height: 100%;
//         background: var(--color-success);
//         border-radius: var(--ui-border-radius-pill);
//         transition: width var(--transition-base);
//       }

//       .theme-btn-secondary {
//         color: var(--text-secondary) !important;
//         border-color: var(--border-secondary) !important;
//         &:hover { background: var(--bg-ternary) !important; color: var(--text-primary) !important; }
//       }
//     }
//   `],
//   encapsulation: ViewEncapsulation.None
// })
// export class InvoiceListComponent implements OnInit, OnDestroy {
//   private readonly destroy$ = new Subject<void>();
//   private cdr = inject(ChangeDetectorRef);
//   private invoiceService = inject(InvoiceService);
//   private messageService = inject(AppMessageService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);
//   public common = inject(CommonMethodService); // Exposed for the template inline renderers
//   private dialogServices = inject(DynamicDialogServices);

//   PERMISSIONS = PERMISSIONS;

//   readonly invoiceActionColumn: ActionColumnConfig = {
//     showView: true,
//     showEdit: false,
//     showDelete: false,
//     showReturn: true,
//     viewPermission: PERMISSIONS.INVOICE.READ,
//     returnPermission: PERMISSIONS.SALES_RETURN.MANAGE
//   };

//   private gridApi!: GridApi;
//   private currentPage = 1;
//   private pageSize = 50;
//   hasNextPage = true;
//   isLoading = false;
//   isExporting = false;
//   totalCount = 0;

//   data: any[] = [];
//   column: any[] = [];
//   rowSelectionMode: any = 'single';

//   statusOptions = [
//     { label: 'Draft', value: 'draft' },
//     { label: 'Issued', value: 'issued' },
//     { label: 'Paid', value: 'paid' },
//     { label: 'Cancelled', value: 'cancelled' },
//   ];

//   paymentStatusOptions = [
//     { label: 'Unpaid', value: 'unpaid' },
//     { label: 'Partial', value: 'partial' },
//     { label: 'Paid', value: 'paid' },
//   ];

//   invoiceFilter = {
//     invoiceNumber: null,
//     customerId: null,
//     status: null,
//     paymentStatus: null,
//   };

//   dateRange: Date[] | undefined;

//   ngOnInit(): void {
//     this.getColumn();
//     this.getData(true);
//   }

//   applyFilters() {
//     this.getData(true);
//   }

//   resetFilters() {
//     this.invoiceFilter = {
//       invoiceNumber: null,
//       customerId: null,
//       status: null,
//       paymentStatus: null,
//     };
//     this.dateRange = undefined;
//     this.getData(true);
//   }

//   onScrolledToBottom(_: any) {
//     if (!this.isLoading && this.hasNextPage) {
//       this.getData(false);
//     }
//   }

//   eventFromGrid(event: any) {
//     if (event.type === 'init') {
//       this.gridApi = event.api;
//       return;
//     }
//     if (event.type === 'cellClicked') {
//       const invoiceId = event.row._id;
//       this.router.navigate([invoiceId], { relativeTo: this.route });
//     }
//     if (event.type === 'reachedBottom') {
//       this.onScrolledToBottom(event)
//     }
//     if (event.type === 'return') {
//       this.dialogServices.openSalesReturn({ invoice: event.row })?.onClose.pipe(takeUntil(this.destroy$)).subscribe(res => {
//         if (res) this.getData(true);
//       });
//     }
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

//     let startDate: string | undefined;
//     let endDate: string | undefined;
//     if (Array.isArray(this.dateRange)) {
//       if (this.dateRange[0]) startDate = this.dateRange[0].toISOString();
//       if (this.dateRange[1]) endDate = this.dateRange[1].toISOString();
//     }

//     const filterParams = {
//       ...this.invoiceFilter,
//       startDate,
//       endDate,
//       page: this.currentPage,
//       limit: this.pageSize,
//     };

//     this.invoiceService.getAllInvoices(filterParams).pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res: any) => {
//         let newData = res.data?.data || [];
//         if (res.pagination) {
//           this.hasNextPage = res.pagination.hasNextPage;
//           this.totalCount = res.pagination.totalResults;
//         }
//         if (isReset) {
//           this.data = newData;
//         } else {
//           this.data = [...this.data, ...newData];
//         }
//         if (this.gridApi && !isReset && newData.length > 0) {
//           this.gridApi.applyTransaction({ add: newData });
//         }
//         if (this.hasNextPage) this.currentPage++;
//         this.isLoading = false;
//         this.cdr.markForCheck();
//       },
//       error: (err) => {
//         this.isLoading = false;
//         this.messageService.handleHttpError(err);
//         this.cdr.markForCheck();
//       }
//     });
//   }

//   exportReport() {
//     if (this.isExporting) return;
//     this.isExporting = true;
//     const filters = { ...this.invoiceFilter };

//     this.invoiceService.exportInvoices(filters)
//       .pipe(
//         finalize(() => {
//           this.isExporting = false;
//           this.cdr.markForCheck();
//         }),
//         takeUntil(this.destroy$)
//       )
//       .subscribe({
//         next: (blob: Blob) => {
//           const url = window.URL.createObjectURL(blob);
//           const link = document.createElement('a');
//           link.href = url;
//           link.download = `invoices_export_${new Date().getTime()}.csv`;
//           link.click();
//           window.URL.revokeObjectURL(url);
//           this.messageService.showSuccess('Report exported successfully.');
//         },
//         error: (err) => this.messageService.handleHttpError(err)
//       });
//   }

//   getColumn(): void {
//     this.column = [
//       {
//         headerName: 'Identity',
//         children: [
//           {
//             field: 'invoiceNumber',
//             headerName: 'Invoice #',
//             pinned: 'left',
//             width: 185,
//             filter: 'agTextColumnFilter',
//             cellClass: 'cell-flex-center',
//             cellRenderer: (params: any) => {
//               if (!params.value) return '-';
//               const isOverdue = params.data?.dueDate && this.common.isPast(params.data.dueDate) && params.data?.paymentStatus !== 'paid';
//               const overdueIcon = isOverdue ? `<i class="pi pi-exclamation-circle icon-overdue" title="Overdue"></i>` : '';
//               return `<div class="cell-flex-center gap-xs"><i class="pi pi-file-text icon-accent-muted"></i><span class="text-accent font-mono font-bold cursor-pointer hover-underline">${params.value}</span>${overdueIcon}</div>`;
//             }
//           },
//           {
//             field: 'branchId.name',
//             headerName: 'Branch',
//             width: 140,
//             cellClass: 'cell-flex-center',
//             cellRenderer: (params: any) => params.value ? `<div class="cell-flex-center gap-xs"><i class="pi pi-building text-tertiary icon-xs"></i><span class="text-secondary font-semibold ellipsis">${params.value}</span></div>` : '-'
//           },
//           {
//             field: 'createdBy.name',
//             headerName: 'Created By',
//             width: 150,
//             cellClass: 'cell-flex-center',
//             cellRenderer: (params: any) => {
//               const name = params.value || params.data?.createdBy?.name;
//               if (!name) return '-';
//               const initials = this.common.getInitials(name);
//               const avatarStyle = this.common.getAvatarStyle(name);
//               return `<div class="cell-flex-center gap-sm"><span class="avatar-xs" style="background: ${avatarStyle.background}; color: ${avatarStyle.color}; border: 1px solid var(--border-primary);">${initials}</span><span class="text-secondary font-semibold ellipsis">${name}</span></div>`;
//             }
//           }
//         ]
//       },
//       {
//         headerName: 'Customer',
//         children: [
//           {
//             headerName: 'Name',
//             field: 'customerId.name',
//             width: 200,
//             cellClass: 'cell-flex-center px-sm',
//             cellRenderer: (params: any) => {
//               const customer = params.data?.customerId;
//               if (!customer) return '-';
//               const name = customer.name || '-';
//               const contact = customer.phone ? this.common.formatPhone(customer.phone) : customer.email || '';
//               const contactIcon = customer.phone ? 'pi-phone' : 'pi-envelope';
//               const initials = this.common.getInitials(name);
//               const avatarStyle = this.common.getAvatarStyle(name);
//               return `<div class="cell-customer"><span class="avatar-sm" style="background: ${avatarStyle.background}; color: ${avatarStyle.color}; border: 1px solid var(--border-primary);">${initials}</span><div class="customer-info"><span class="customer-name">${name}</span>${contact ? `<span class="customer-contact"><i class="pi ${contactIcon} icon-xxs"></i> ${contact}</span>` : ''}</div></div>`;
//             }
//           },
//           {
//             field: 'placeOfSupply',
//             headerName: 'Supply State',
//             width: 130,
//             cellClass: 'cell-flex-center',
//             cellRenderer: (params: any) => params.value ? `<div class="cell-flex-center gap-xs"><i class="pi pi-map-marker text-tertiary icon-xs"></i><span class="text-secondary text-sm">${params.value}</span></div>` : `<span class="text-tertiary">—</span>`
//           },
//           {
//             field: 'gstType',
//             headerName: 'GST Type',
//             width: 130,
//             cellClass: 'cell-flex-center',
//             cellRenderer: (params: any) => {
//               if (!params.value) return '-';
//               const label = this.common.toTitleCase(params.value.replace(/-/g, ' '));
//               const badgeClass = params.value?.toLowerCase().includes('intra') ? 'badge-info-soft' : 'badge-warning-soft';
//               return `<span class="grid-badge ${badgeClass}">${label}</span>`;
//             }
//           }
//         ]
//       },
//       {
//         headerName: 'Status & Timeline',
//         children: [
//           {
//             field: 'invoiceDate',
//             headerName: 'Invoice Date',
//             width: 140,
//             sort: 'desc',
//             valueGetter: (p: any) => p.data?.invoiceDate ? new Date(p.data.invoiceDate) : null,
//             cellClass: 'cell-flex-center px-sm',
//             cellRenderer: (params: any) => params.value ? `<div class="cell-stack"><span class="text-secondary text-sm font-semibold line-tight">${this.common.formatDate(params.value)}</span><span class="text-tertiary text-xs line-tight">${this.common.timeAgoText(params.value)}</span></div>` : '-'
//           },
//           {
//             field: 'dueDate',
//             headerName: 'Due Date',
//             width: 140,
//             valueGetter: (p: any) => p.data?.dueDate ? new Date(p.data.dueDate) : null,
//             cellClass: 'cell-flex-center px-sm',
//             cellRenderer: (params: any) => {
//               if (!params.value) return '-';
//               const isPaid = params.data?.paymentStatus === 'paid';
//               const isOverdue = this.common.isPast(params.value) && !isPaid;
//               const isNear = !isOverdue && this.common.isWithinDays(params.value, 3) && !isPaid;
//               const colorClass = isOverdue ? 'text-error' : isNear ? 'text-warning' : 'text-secondary';
//               const weightClass = isOverdue ? 'font-bold' : 'font-semibold';
//               const tag = isOverdue ? `<span class="tag-alert text-error">⚠ Overdue</span>` : isNear ? `<span class="tag-alert text-warning">Due soon</span>` : '';
//               return `<div class="cell-stack"><span class="text-sm line-tight ${colorClass} ${weightClass}">${this.common.formatDate(params.value)}</span>${tag}</div>`;
//             }
//           },
//           {
//             field: 'status',
//             headerName: 'Status',
//             width: 120,
//             cellClass: 'cell-flex-center',
//             cellRenderer: (params: any) => {
//               if (!params.value) return '-';
//               const theme = (this.common as any)['_resolveBadgeTheme'](params.value);
//               return `<span class="grid-badge badge-dynamic" style="background: ${theme.bg}; color: ${theme.text};">${params.value}</span>`;
//             }
//           },
//           {
//             field: 'paymentStatus',
//             headerName: 'Payment',
//             width: 120,
//             cellClass: 'cell-flex-center',
//             cellRenderer: (params: any) => {
//               if (!params.value) return '-';
//               const theme = (this.common as any)['_resolveBadgeTheme'](params.value);
//               return `<span class="grid-badge badge-dynamic" style="background: ${theme.bg}; color: ${theme.text};">${params.value}</span>`;
//             }
//           },
//           {
//             field: 'paymentMethod',
//             headerName: 'Method',
//             width: 120,
//             cellClass: 'cell-flex-center',
//             cellRenderer: (params: any) => {
//               if (!params.value) return '-';
//               const iconMap: Record<string, string> = { cash: 'pi-wallet', cheque: 'pi-file', neft: 'pi-send', rtgs: 'pi-send', imps: 'pi-send', upi: 'pi-mobile', card: 'pi-credit-card', bank_transfer: 'pi-building', dd: 'pi-file' };
//               const icon = iconMap[params.value?.toLowerCase()] || 'pi-credit-card';
//               return `<div class="cell-flex-center gap-xs"><i class="pi ${icon} icon-accent-muted icon-xs"></i><span class="text-secondary text-sm font-semibold">${this.common.toTitleCase(params.value)}</span></div>`;
//             }
//           }
//         ]
//       },
//       {
//         headerName: 'Financials',
//         children: [
//           { field: 'subTotal', headerName: 'Subtotal', width: 130, type: 'rightAligned', cellClass: 'cell-flex-end text-secondary font-mono text-sm', valueFormatter: (p: any) => this.common.formatCurrency(p.value) },
//           { field: 'totalTax', headerName: 'GST', width: 115, type: 'rightAligned', cellClass: 'cell-flex-end', cellRenderer: (params: any) => `<span class="font-mono text-sm font-semibold ${(params.value || 0) > 0 ? 'text-info' : 'text-tertiary'}">${(params.value || 0) > 0 ? this.common.formatCurrency(params.value) : '—'}</span>` },
//           { field: 'totalDiscount', headerName: 'Discount', width: 115, type: 'rightAligned', cellClass: 'cell-flex-end', cellRenderer: (params: any) => (params.value || 0) <= 0 ? `<span class="text-tertiary text-sm">—</span>` : `<span class="text-success font-mono font-bold text-sm">-${this.common.formatCurrency(params.value)}</span>` },
//           { field: 'grandTotal', headerName: 'Grand Total', width: 140, type: 'rightAligned', cellClass: 'cell-flex-end', cellRenderer: (params: any) => `<span class="text-primary font-mono font-bold text-sm tracking-tight">${this.common.formatCurrency(params.value || 0)}</span>` },
//           { field: 'paidAmount', headerName: 'Paid', width: 125, type: 'rightAligned', cellClass: 'cell-flex-end', cellRenderer: (params: any) => (params.value || 0) <= 0 ? `<span class="text-tertiary text-sm">—</span>` : `<span class="text-success font-mono font-bold text-sm">${this.common.formatCurrency(params.value)}</span>` },
//           {
//             field: 'balanceAmount', headerName: 'Balance Due', width: 145, type: 'rightAligned', cellClass: 'cell-flex-end', cellRenderer: (params: any) => {
//               const balance = params.value || 0;
//               const grandTotal = params.data?.grandTotal || 0;
//               if (balance <= 0) return `<span class="badge-success-solid">✓ Paid</span>`;
//               const pct = grandTotal > 0 ? this.common.percent(grandTotal - balance, grandTotal, 0) : 0;
//               const isOverdue = params.data?.dueDate && this.common.isPast(params.data.dueDate);
//               const colorClass = isOverdue ? 'text-error' : 'text-warning';
//               return `<div class="cell-stack align-end w-full gap-xs"><span class="${colorClass} font-mono font-bold text-sm">${this.common.formatCurrency(balance)}</span>${pct > 0 ? `<div class="progress-track"><div class="progress-fill" style="width: ${pct}%;"></div></div>` : ''}</div>`;
//             }
//           }
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