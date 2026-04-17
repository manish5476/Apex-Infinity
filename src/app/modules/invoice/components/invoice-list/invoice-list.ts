import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation, effect, inject, signal, OnDestroy } from '@angular/core';
import { GridApi } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from "rxjs";

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';

// Services
// import { MasterListService } from '../../../../core/services/master-list.service';
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
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss',
  encapsulation: ViewEncapsulation.None
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  private invoiceService = inject(InvoiceService);
  private messageService = inject(AppMessageService);
  // public masterList = inject(MasterListService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private common = inject(CommonMethodService);
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
  column: any = [];
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

  constructor() {
    // effect(() => {
    //   this.customerOptions.set(this.masterList.customers());
    // });
  }

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

    const filterParams = {
      ...this.invoiceFilter,
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
            width: 120,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => params.value ? `<div class="cell-flex-center gap-xs"><i class="pi pi-building text-tertiary icon-xs"></i><span class="text-secondary ellipsis">${params.value}</span></div>` : '-'
          },
          {
            field: 'createdBy.name',
            headerName: 'Created By',
            width: 130,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              const name = params.value || params.data?.createdBy?.name;
              if (!name) return '-';
              const initials = this.common.getInitials(name);
              const avatarStyle = this.common.getAvatarStyle(name);
              return `<div class="cell-flex-center gap-sm"><span class="avatar-xs" style="background: ${avatarStyle.background}; color: ${avatarStyle.color};">${initials}</span><span class="text-secondary ellipsis">${name}</span></div>`;
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
            width: 185,
            cellClass: 'cell-flex-center px-sm',
            cellRenderer: (params: any) => {
              const customer = params.data?.customerId;
              if (!customer) return '-';
              const name = customer.name || '-';
              const contact = customer.phone ? this.common.formatPhone(customer.phone) : customer.email || '';
              const contactIcon = customer.phone ? 'pi-phone' : 'pi-envelope';
              const initials = this.common.getInitials(name);
              const avatarStyle = this.common.getAvatarStyle(name);
              return `<div class="cell-customer"><span class="avatar-sm" style="background: ${avatarStyle.background}; color: ${avatarStyle.color};">${initials}</span><div class="customer-info"><span class="customer-name">${name}</span>${contact ? `<span class="customer-contact"><i class="pi ${contactIcon} icon-xxs"></i> ${contact}</span>` : ''}</div></div>`;
            }
          },
          {
            field: 'placeOfSupply',
            headerName: 'Supply State',
            width: 120,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => params.value ? `<div class="cell-flex-center gap-xs"><i class="pi pi-map-marker text-tertiary icon-xs"></i><span class="text-secondary text-xs">${params.value}</span></div>` : `<span class="text-tertiary">—</span>`
          },
          {
            field: 'gstType',
            headerName: 'GST Type',
            width: 115,
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
            width: 125,
            sort: 'desc',
            valueGetter: (p: any) => p.data?.invoiceDate ? new Date(p.data.invoiceDate) : null,
            cellClass: 'cell-flex-center px-sm',
            cellRenderer: (params: any) => params.value ? `<div class="cell-stack"><span class="text-secondary text-xs line-tight">${this.common.formatDate(params.value)}</span><span class="text-tertiary text-xxs line-tight">${this.common.timeAgoText(params.value)}</span></div>` : '-'
          },
          {
            field: 'dueDate',
            headerName: 'Due Date',
            width: 125,
            valueGetter: (p: any) => p.data?.dueDate ? new Date(p.data.dueDate) : null,
            cellClass: 'cell-flex-center px-sm',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              const isPaid = params.data?.paymentStatus === 'paid';
              const isOverdue = this.common.isPast(params.value) && !isPaid;
              const isNear = !isOverdue && this.common.isWithinDays(params.value, 3) && !isPaid;
              const colorClass = isOverdue ? 'text-error' : isNear ? 'text-warning' : 'text-secondary';
              const weightClass = isOverdue ? 'font-bold' : '';
              const tag = isOverdue ? `<span class="tag-alert text-error">⚠ Overdue</span>` : isNear ? `<span class="tag-alert text-warning">Due soon</span>` : '';
              return `<div class="cell-stack"><span class="text-xs line-tight ${colorClass} ${weightClass}">${this.common.formatDate(params.value)}</span>${tag}</div>`;
            }
          },
          {
            field: 'status',
            headerName: 'Status',
            width: 105,
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
            width: 105,
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
            width: 105,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return '-';
              const iconMap: Record<string, string> = { cash: 'pi-wallet', cheque: 'pi-file', neft: 'pi-send', rtgs: 'pi-send', imps: 'pi-send', upi: 'pi-mobile', card: 'pi-credit-card', bank_transfer: 'pi-building', dd: 'pi-file' };
              const icon = iconMap[params.value?.toLowerCase()] || 'pi-credit-card';
              return `<div class="cell-flex-center gap-xs"><i class="pi ${icon} icon-accent-muted icon-xs"></i><span class="text-secondary text-xs">${this.common.toTitleCase(params.value)}</span></div>`;
            }
          }
        ]
      },
      {
        headerName: 'Financials',
        children: [
          { field: 'subTotal', headerName: 'Subtotal', width: 120, type: 'rightAligned', cellClass: 'cell-flex-end text-secondary font-mono text-xs', valueFormatter: (p: any) => this.common.formatCurrency(p.value) },
          { field: 'totalTax', headerName: 'GST', width: 105, type: 'rightAligned', cellClass: 'cell-flex-end', cellRenderer: (params: any) => `<span class="font-mono text-xs ${(params.value || 0) > 0 ? 'text-info' : 'text-tertiary'}">${(params.value || 0) > 0 ? this.common.formatCurrency(params.value) : '—'}</span>` },
          { field: 'totalDiscount', headerName: 'Discount', width: 105, type: 'rightAligned', cellClass: 'cell-flex-end', cellRenderer: (params: any) => (params.value || 0) <= 0 ? `<span class="text-tertiary text-xs">—</span>` : `<span class="text-success font-mono font-semibold text-xs">-${this.common.formatCurrency(params.value)}</span>` },
          { field: 'grandTotal', headerName: 'Grand Total', width: 130, type: 'rightAligned', cellClass: 'cell-flex-end', cellRenderer: (params: any) => `<span class="text-primary font-mono font-bold text-sm tracking-tight">${this.common.formatCurrency(params.value || 0)}</span>` },
          { field: 'paidAmount', headerName: 'Paid', width: 115, type: 'rightAligned', cellClass: 'cell-flex-end', cellRenderer: (params: any) => (params.value || 0) <= 0 ? `<span class="text-tertiary text-xs">—</span>` : `<span class="text-success font-mono font-semibold text-xs">${this.common.formatCurrency(params.value)}</span>` },
          { field: 'balanceAmount', headerName: 'Balance Due', width: 135, type: 'rightAligned', cellClass: 'cell-flex-end', cellRenderer: (params: any) => {
            const balance = params.value || 0;
            const grandTotal = params.data?.grandTotal || 0;
            if (balance <= 0) return `<span class="badge-success-solid">✓ Paid</span>`;
            const pct = grandTotal > 0 ? this.common.percent(grandTotal - balance, grandTotal, 0) : 0;
            const isOverdue = params.data?.dueDate && this.common.isPast(params.data.dueDate);
            const colorClass = isOverdue ? 'text-error' : 'text-warning';
            return `<div class="cell-stack align-end w-full gap-xs"><span class="${colorClass} font-mono font-bold text-xs">${this.common.formatCurrency(balance)}</span>${pct > 0 ? `<div class="progress-track"><div class="progress-fill" style="width: ${pct}%;"></div></div>` : ''}</div>`;
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
