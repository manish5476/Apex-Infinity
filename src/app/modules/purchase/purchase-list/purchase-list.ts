import { ChangeDetectorRef, Component, OnInit, inject, signal, OnDestroy } from '@angular/core';

import { GridApi } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { PurchaseService } from '../purchase.service';
import { AgShareGrid, ActionColumnConfig } from "../../shared/components/ag-shared-grid";
import { MasterDropdownComponent } from '../../shared/components/masterFilterDropdown/master-dropdown.component';
import { AppMessageService } from '../../../core/services/message.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { finalize, Subject } from 'rxjs';
import { HasPermissionDirective } from '../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../core/auth/permissions.constants';
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-purchase-list',
  standalone: true,
  imports: [SelectModule, FormsModule, ButtonModule, InputTextModule, DatePickerModule, RouterModule, AgShareGrid, HasPermissionDirective, ToastModule, MasterDropdownComponent],
  templateUrl: './purchase-list.html',
  styleUrl: './purchase-list.scss',
})
export class PurchaseListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  private purchaseService = inject(PurchaseService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private common = inject(CommonMethodService);

  PERMISSIONS = PERMISSIONS;

  readonly purchaseActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: false,
    showDelete: false,
    viewPermission: PERMISSIONS.PURCHASE.READ,
  };

  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 50;

  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';

  statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Received', value: 'received' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  paymentStatusOptions = [
    { label: 'Paid', value: 'paid' },
    { label: 'Partial', value: 'partial' },
    { label: 'Unpaid', value: 'unpaid' }
  ];

  purchaseFilter = {
    invoiceNumber: null,
    supplierId: null,
    branchId: null,
    status: null,
    paymentStatus: null,
    dateRange: null
  };

  constructor() {}

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.purchaseFilter = {
      invoiceNumber: null,
      supplierId: null,
      branchId: null,
      status: null,
      paymentStatus: null,
      dateRange: null
    };
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
      if (this.gridApi) {
        this.gridApi.setGridOption('rowData', []);
      }
    }

    const { dateRange, ...baseFilters } = this.purchaseFilter;

    let startDate, endDate;
    if (dateRange && Array.isArray(dateRange)) {
      if (dateRange[0]) startDate = (dateRange[0] as Date).toISOString();
      if (dateRange[1]) endDate = (dateRange[1] as Date).toISOString();
    }

    const filterParams = {
      ...baseFilters,
      startDate,
      endDate,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.purchaseService.getAllPurchases(filterParams)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }), takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          let newData: any[] = [];

          if (res.data && Array.isArray(res.data.data)) {
            newData = res.data.data;
          }

          if (res.pagination) {
            this.totalCount = res.pagination.totalResults;
          } else {
            this.totalCount = 0;
          }

          this.data = [...this.data, ...newData];

          if (this.gridApi) {
            if (isReset) {
              this.gridApi.setGridOption('rowData', this.data);
            } else {
              this.gridApi.applyTransaction({ add: newData });
            }
          }

          this.currentPage++;
        },
        error: (err: any) => {
          this.messageService.handleHttpError(err);
        }
      });
  }

  onScrolledToBottom(_: any) {
    if (!this.isLoading && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

  eventFromGrid(event: any) {
    if (event.type === 'init') {
      this.gridApi = event.api;
      return;
    }
    if (event.type === 'cellClicked') {
      const purchaseId = event.row._id;
      if (purchaseId) {
        this.router.navigate([purchaseId], { relativeTo: this.route });
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event)
    }
  }

  getColumn(): void {
    this.column = [
      {
        field: 'invoiceNumber',
        headerName: 'Invoice #',
        width: 140,
        pinned: 'left',
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          const val = params.value || 'N/A';
          return `<span style="font-weight: 700; color: var(--color-primary); cursor: pointer; letter-spacing: 0.5px;">${val}</span>`;
        }
      },
      {
        field: 'purchaseDate',
        headerName: 'Date',
        width: 120,
        filter: 'agDateColumnFilter',
        valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '-',
        cellStyle: { color: 'var(--text-secondary)' }
      },
      {
        field: 'supplierId.companyName',
        headerName: 'Supplier Name',
        width: 200,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          const name = params.value || 'Unknown';
          const char = name.charAt(0).toUpperCase();
          return `
            <div style="display:flex; align-items:center; gap:8px; height:100%;">
              <div style="width:24px; height:24px; border-radius:4px; background:var(--bg-ternary); color:var(--text-secondary); display:grid; place-items:center; font-size:10px; font-weight:700; border:1px solid var(--border-secondary);">${char}</div>
              <span style="font-weight:600; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden;">${name}</span>
            </div>
          `;
        }
      },
      {
        field: 'supplierId.contactPerson',
        headerName: 'Contact Person',
        width: 150,
        valueGetter: (p: any) => p.data.supplierId?.contactPerson || '-',
        cellStyle: { color: 'var(--text-secondary)' }
      },
      {
        field: 'supplierId.email',
        headerName: 'Email',
        width: 200,
        cellRenderer: (params: any) => {
          const email = params.data.supplierId?.email;
          if (!email) return '-';
          return `<a href="mailto:${email}" style="color:var(--text-secondary); text-decoration:none; display:flex; align-items:center; gap:6px;"><i class="pi pi-envelope" style="font-size:10px"></i> ${email}</a>`;
        }
      },
      {
        field: 'supplierId.phone',
        headerName: 'Phone',
        width: 130,
        cellRenderer: (params: any) => {
          const phone = params.data.supplierId?.phone;
          if (!phone) return '-';
          return `<a href="tel:${phone}" style="color:var(--text-secondary); text-decoration:none; display:flex; align-items:center; gap:6px;"><i class="pi pi-phone" style="font-size:10px"></i> ${phone}</a>`;
        }
      },
      {
        field: 'branchId.name',
        headerName: 'Branch',
        width: 130,
        filter: true,
        cellRenderer: (params: any) => {
          const branch = params.data.branchId?.name || 'Main';
          return `<span style="background:var(--bg-ternary); padding:2px 8px; border-radius:4px; font-size:11px; color:var(--text-secondary); border:1px solid var(--border-secondary);">${branch}</span>`;
        }
      },
      {
        headerName: 'Items',
        field: 'items',
        width: 100,
        cellRenderer: (params: any) => {
          const count = params.data.items?.length || 0;
          return `<span style="font-weight:600; color:var(--text-primary);"><i class="pi pi-box" style="font-size:10px; color:var(--text-tertiary); margin-right:4px;"></i> ${count}</span>`;
        }
      },
      {
        field: 'subTotal',
        headerName: 'Sub Total',
        width: 120,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.formatCurrency(p.value),
        cellStyle: { color: 'var(--text-tertiary)' }
      },
      {
        field: 'totalTax',
        headerName: 'Tax',
        width: 100,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.formatCurrency(p.value),
        cellStyle: { color: 'var(--text-tertiary)' }
      },
      {
        field: 'grandTotal',
        headerName: 'Grand Total',
        width: 130,
        type: 'rightAligned',
        cellStyle: { fontWeight: '700', color: 'var(--text-primary)' },
        valueFormatter: (p: any) => this.formatCurrency(p.value)
      },
      {
        field: 'paidAmount',
        headerName: 'Paid',
        width: 120,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.formatCurrency(p.value),
        cellStyle: { color: 'var(--color-success)' }
      },
      {
        field: 'balanceAmount',
        headerName: 'Balance',
        width: 120,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.formatCurrency(p.value),
        cellStyle: (params: any) => {
          return params.value > 0 
            ? { color: 'var(--color-error)', fontWeight: '700' }
            : { color: 'var(--text-tertiary)', opacity: 0.7 };
        }
      },
      {
        field: 'status',
        headerName: 'Order Status',
        width: 130,
        cellRenderer: (params: any) => {
          const status = params.value || 'draft';
          const colors: any = {
            received: { bg: '#ecfdf5', text: '#059669' },
            draft: { bg: '#f3f4f6', text: '#4b5563' },
            cancelled: { bg: '#fef2f2', text: '#dc2626' }
          };
          const c = colors[status] || colors.draft;
          return `<span style="background:${c.bg}; color:${c.text}; padding:4px 10px; border-radius:12px; font-size:10px; font-weight:700; text-transform:uppercase;">${status}</span>`;
        }
      },
      {
        field: 'paymentStatus',
        headerName: 'Payment Status',
        width: 140,
        cellRenderer: (params: any) => {
          const status = params.value || 'unpaid';
          const icons: any = { paid: 'pi-check-circle', unpaid: 'pi-times-circle', partial: 'pi-exclamation-circle' };
          const colors: any = {
            paid: { color: '#10b981' },
            unpaid: { color: '#ef4444' },
            partial: { color: '#f59e0b' }
          };
          const c = colors[status] || colors.unpaid;
          return `
            <div style="display:flex; align-items:center; gap:6px; color:${c.color}; font-weight:600; font-size:11px; text-transform:uppercase;">
              <i class="pi ${icons[status] || 'pi-info-circle'}"></i> ${status}
            </div>
          `;
        }
      },
      {
        field: 'paymentMethod',
        headerName: 'Method',
        width: 110,
        valueFormatter: (p: any) => p.value ? p.value.toUpperCase() : '-',
        cellStyle: { color: 'var(--text-secondary)', fontSize: '11px' }
      },
      {
        field: 'createdBy.name',
        headerName: 'Created By',
        width: 140,
        cellRenderer: (params: any) => {
          const name = params.data.createdBy?.name || 'System';
          return `<span style="font-size:11px; color:var(--text-secondary);"><i class="pi pi-user" style="font-size:9px; margin-right:4px;"></i>${name}</span>`;
        }
      }
    ];
    this.cdr.detectChanges();
  }

  private formatCurrency(value: number): string {
    return value !== undefined && value !== null
      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value)
      : '₹ 0.00';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
