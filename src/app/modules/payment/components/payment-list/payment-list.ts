import { ChangeDetectorRef, Component, OnInit, effect, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { Toast } from "primeng/toast";
import { AgShareGrid, ActionColumnConfig } from "../../../shared/components/ag-shared-grid";
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { PaymentService } from '../../services/payment-service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { finalize, Subject } from 'rxjs';
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    RouterModule,
    Toast,
    AgShareGrid,
    HasPermissionDirective
  ],
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss',
})
export class PaymentListComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  readonly PERMISSIONS = PERMISSIONS;

  readonly paymentActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: false,
    showDelete: false,
    viewPermission: PERMISSIONS.PAYMENT.READ,
  };

  private cdr = inject(ChangeDetectorRef);
  private paymentService = inject(PaymentService);
  private messageService = inject(AppMessageService);
  public masterList = inject(MasterListService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private common = inject(CommonMethodService); // Injected helper

  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 50;
  private totalPages = 1;
  data: any[] = [];
  column: any = [];
  rowSelectionMode: any = 'single';

  customerOptions = signal<any[]>([]);
  supplierOptions = signal<any[]>([]);

  typeOptions = [
    { label: 'Inflow (Received)', value: 'inflow' },
    { label: 'Outflow (Made)', value: 'outflow' },
  ];
  
  paymentMethodOptions = [
    { label: 'Cash', value: 'cash' },
    { label: 'Bank', value: 'bank' },
    { label: 'Credit', value: 'credit' },
    { label: 'UPI', value: 'upi' },
    { label: 'Cheque', value: 'cheque' },
    { label: 'Other', value: 'other' },
  ];
  
  statusOptions = [
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  paymentFilter = {
    type: null,
    customerId: null,
    supplierId: null,
    paymentMethod: null,
    status: null,
  };

  constructor() {
    effect(() => {
      this.customerOptions.set(this.masterList.customers());
      this.supplierOptions.set(this.masterList.suppliers());
    });
  }

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.paymentFilter = { type: null, customerId: null, supplierId: null, paymentMethod: null, status: null };
    this.getData(true);
  }

getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    const filterParams = {
      ...this.paymentFilter,
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.paymentService.getAllPayments(filterParams)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }), takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          // Correcting based on your new backend structure
          const newData = res.data?.data || [];
          const pagination = res.data?.pagination;

          // Update pagination states
          if (pagination) {
            this.totalCount = pagination.totalResults;
            this.totalPages = pagination.totalPages;
          }

          this.data = isReset ? newData : [...this.data, ...newData];

          // If using AG Grid Transactions for efficiency
          if (this.gridApi && !isReset) {
            this.gridApi.applyTransaction({ add: newData });
          }

          this.currentPage++;
        },
        error: (err: any) => {
          // Delegated to global HTTP error handler
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
      const paymentId = event.row._id;
      if (paymentId) {
        this.router.navigate([paymentId], { relativeTo: this.route });
      }
    }
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event)
    }
  }

  getColumn(): void {
  this.column = [
    {
      field: 'paymentDate',
      headerName: 'Date',
      width: 110,
      sortable: true,
      valueFormatter: (params: any) => this.common.formatDate(params.value),
      cellClass: 'font-mono text-xs'
    },
    {
      headerName: 'Entity Details',
      flex: 1,
      minWidth: 220,
      cellRenderer: (params: any) => {
        const isInflow = params.data.type === 'inflow';
        const name = isInflow ? params.data.customerId?.name : params.data.supplierId?.companyName;
        const subText = isInflow ? params.data.customerId?.phone : 'Supplier';
        const typeIcon = isInflow ? 'pi-user' : 'pi-truck';
        
        return `
          <div class="flex flex-col leading-tight py-1">
            <div class="flex items-center gap-1 font-semibold text-primary">
              <i class="pi ${typeIcon}" style="font-size: 0.7rem"></i>
              <span>${name || 'Walk-in Customer'}</span>
            </div>
            <div class="text-xs text-tertiary" style="font-size: var(--font-size-xs)">${subText || '-'}</div>
          </div>
        `;
      }
    },
    {
      field: 'invoiceId.invoiceNumber',
      headerName: 'Reference',
      width: 140,
      valueGetter: (params: any) => params.data.invoiceId?.invoiceNumber || params.data.referenceNumber || '-',
      cellClass: 'font-mono text-xs text-accent'
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 130,
      type: 'rightAligned',
      sortable: true,
      valueFormatter: (params: any) => this.common.formatCurrency(params.value),
      cellClassRules: {
        'text-success font-bold': "params.data.type === 'inflow'",
        'text-error font-bold': "params.data.type === 'outflow'"
      }
    },
    {
      field: 'paymentMethod',
      headerName: 'Method',
      width: 100,
      cellRenderer: (params: any) => {
        const method = params.value?.toLowerCase();
        // const icon = this.getMethodIcon(method);
        return `<span class="method-badge">${method}</span>`;
        // <i class="pi ${ca}"></i> 
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      cellRenderer: (params: any) => {
        const status = params.value?.toLowerCase();
        return `<span class="status-pill-compact status-${status}">${status}</span>`;
      }
    }
  ];
  this.cdr.detectChanges();
}

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}