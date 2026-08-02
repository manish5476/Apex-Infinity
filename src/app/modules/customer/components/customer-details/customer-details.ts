import { Component, OnInit, inject, signal, computed, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { CustomerService } from '../../services/customer-service';
import { InvoiceService } from '../../../invoice/services/invoice-service';
import { PaymentService } from '../../../payment/services/payment-service';
import { FinancialService } from '../../../Ledger/financial.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { DynamicDialogServices } from '../../../../core/services/dynamic-dialog-services';
import { CustomerTransactions } from '../../../transactions/customer-transactions/customer-transactions';
import { ImageViewerDirective } from '../../../shared/directives/image-viewer.directive';
import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { CustomerFeedComponent } from '../customer-feed/customer-feed';

type TabType = 'ledger' | 'invoices' | 'payments' | 'feed';

interface TabState {
  loaded: boolean;
  loading: boolean;
  page: number;
  total: number;
}

@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [
    CommonModule,
    ImageViewerDirective,
    RouterModule,
    ButtonModule,
    AvatarModule,
    TagModule,
    SkeletonModule,
    TooltipModule,
    DialogModule,
    ToastModule,
    CustomerTransactions,
    DataGridComponent,
    HasPermissionDirective,
    ConfirmDialogModule,
    CustomerFeedComponent
  ],
  providers: [CustomerService, InvoiceService, PaymentService, FinancialService, ConfirmationService],
  templateUrl: './customer-details.html',
  styleUrl: './customer-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerDetails implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);
  private invoiceService = inject(InvoiceService);
  private paymentService = inject(PaymentService);
  private financialService = inject(FinancialService);
  private messageService = inject(AppMessageService);
  public common = inject(CommonMethodService);
  private cdr = inject(ChangeDetectorRef);
  private dialogServices = inject(DynamicDialogServices);
  private confirmationService = inject(ConfirmationService);
  private dialogConfig = inject(DynamicDialogConfig, { optional: true });
  private dialogRef = inject(DynamicDialogRef, { optional: true });

  PERMISSIONS = PERMISSIONS;

  readonly invoiceActions: GridRowAction[] = [
    {
      id: 'view',
      icon: 'pi pi-eye',
      tooltip: 'View Invoice',
      variant: 'primary',
      permission: PERMISSIONS.INVOICE.READ,
      callback: (row) => this.router.navigate(['/invoices', row._id])
    },
    {
      id: 'return',
      icon: 'pi pi-replay',
      tooltip: 'Sales Return',
      variant: 'danger',
      permission: PERMISSIONS.SALES_RETURN.MANAGE,
      callback: (row) => this.onGridEvent({ type: 'return', row }, 'invoices')
    }
  ];

  loadingProfile = signal(true);
  isError = signal(false);
  isDialog = signal(false);
  customerId = signal<string | null>(null);
  customer = signal<any | null>(null);

  activeTab = signal<TabType>('ledger');
  private pageSize = 50;

  tabStatus = signal<Record<TabType, TabState>>({
    ledger: { loaded: false, loading: false, page: 1, total: 0 },
    invoices: { loaded: false, loading: false, page: 1, total: 0 },
    payments: { loaded: false, loading: false, page: 1, total: 0 },
    feed: { loaded: false, loading: false, page: 1, total: 0 }
  });

  invoices = signal<any[]>([]);
  payments = signal<any[]>([]);
  ledgerHistory = signal<any[]>([]);

  ledgerColumns: GridColumn[] = [];
  invoiceColumns: GridColumn[] = [];
  paymentColumns: GridColumn[] = [];

  showTransactionsDialog = false;

  closingBalance = signal(0);
  totalInvoiced = computed(() => this.invoices().reduce((acc, inv) => acc + (inv.grandTotal || 0), 0));
  totalPaid = computed(() => this.payments().reduce((acc, pay) => acc + (pay.amount || 0), 0));

  ngOnInit(): void {
    this.initColumns();

    const dialogId = this.dialogConfig?.data?.id;
    if (dialogId) {
      this.isDialog.set(true);
      this.customerId.set(dialogId);
      this.loadProfile(dialogId);
      return;
    }

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.router.navigate(['/customer']);
        return;
      }
      this.customerId.set(id);
      this.loadProfile(id);
    });
  }

  confirmDelete() {
    const customer = this.customer();
    if (!customer) return;

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
            this.router.navigate(['/customer']);
          },
          error: (err: any) => {
            this.messageService.handleHttpError(err);
          }
        });
      }
    });
  }

  onScrolledToBottom(tab: TabType) {
    const currentDataLength = this.getTabData(tab).length;
    const status = this.tabStatus()[tab];
    if (!status.loading && currentDataLength < status.total) {
      this.fetchDataForTab(tab, false);
    }
  }

  private getTabData(tab: TabType): any[] {
    if (tab === 'ledger') return this.ledgerHistory();
    if (tab === 'invoices') return this.invoices();
    if (tab === 'payments') return this.payments();
    return [];
  }

  switchTab(tab: TabType) {
    this.activeTab.set(tab);
    const status = this.tabStatus()[tab];
    if (!status.loaded && !status.loading) {
      this.fetchDataForTab(tab, true);
    }
  }

  private fetchDataForTab(tab: TabType, isReset: boolean) {
    const id = this.customerId();
    if (!id) return;

    if (isReset) {
      this.tabStatus.update(s => ({ ...s, [tab]: { ...s[tab], page: 1, loaded: false } }));
    }

    const currentStatus = this.tabStatus()[tab];
    const params = {
      page: currentStatus.page,
      limit: this.pageSize
    };

    this.tabStatus.update(s => ({ ...s, [tab]: { ...s[tab], loading: true } }));

    if (tab === 'ledger') this.fetchLedger(id, params, isReset);
    else if (tab === 'invoices') this.fetchInvoices(id, params, isReset);
    else if (tab === 'payments') this.fetchPayments(id, params, isReset);
  }

  onGridEvent(event: any, tab: TabType) {
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(tab);
    }

    if (tab === 'invoices') {
      if (event.type === 'cellClicked' && event.field === 'invoiceNumber') {
        const invoiceId = event.row._id;
        this.router.navigate(['/invoices', invoiceId]);
      } else if (event.type === 'return') {
        this.dialogServices.openSalesReturn({ invoice: event.row })?.onClose.pipe(takeUntil(this.destroy$)).subscribe(res => {
          if (res) this.fetchDataForTab('invoices', true);
        });
      }
    } else if (tab === 'payments') {
      if (event.type === 'cellClicked') {
        this.router.navigate(['/payments', event.row._id]);
      }
    } else if (tab === 'ledger') {
      if (event.type === 'cellClicked') {
        // Handle ledger clicks if needed
      }
    }
  }

  private finishTabLoad(tab: TabType) {
    this.tabStatus.update(s => ({
      ...s,
      [tab]: { ...s[tab], page: s[tab].page + 1, loaded: true, loading: false }
    }));
  }

  initColumns() {
    this.ledgerColumns = [
      { field: 'date', header: 'Date', width: '120px', formatter: (val: any) => val ? new Date(val).toLocaleDateString('en-IN') : '—' },
      { field: 'description', header: 'Reference', minWidth: '220px' },
      {
        field: 'referenceType', header: 'Type', width: '110px',
        type: 'badge',
        formatter: (val: any) => val ? this.common.toTitleCase(val) : '—'
      },
      { field: 'accountName', header: 'Account', flex: 1, minWidth: '150px' },
      { field: 'debit', header: 'Debit', width: '130px', type: 'currency', align: 'right' },
      { field: 'credit', header: 'Credit', width: '130px', type: 'currency', align: 'right' },
      { field: 'balance', header: 'Balance', width: '150px', type: 'currency', align: 'right' }
    ];

    this.invoiceColumns = [
      { field: 'invoiceNumber', header: 'Invoice #', width: '160px' },
      { field: 'invoiceDate', header: 'Date', width: '120px', formatter: (val: any) => val ? new Date(val).toLocaleDateString('en-IN') : '—' },
      { field: 'status', header: 'Status', width: '130px', type: 'status' },
      { field: 'paymentStatus', header: 'Payment', width: '130px', type: 'status' },
      { field: 'grandTotal', header: 'Total', width: '140px', type: 'currency', align: 'right' },
      { field: 'balanceAmount', header: 'Due', width: '140px', type: 'currency', align: 'right' }
    ];

    this.paymentColumns = [
      {
        field: 'paymentDate',
        header: 'Date',
        width: '130px',
        pinned: 'left',
        formatter: (val: any) => val ? new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
      },
      {
        field: 'invoiceId.invoiceNumber',
        header: 'Invoice No.',
        width: '160px',
        formatter: (_val: any, row: any) => row?.invoiceId?.invoiceNumber || 'Advance Payment'
      },
      {
        field: 'referenceNumber',
        header: 'Ref #',
        width: '140px',
        formatter: (val: any, row: any) => val || row._id?.slice(-8).toUpperCase()
      },
      {
        field: 'paymentMethod',
        header: 'Method',
        width: '130px',
        formatter: (val: any) => val ? val.toUpperCase() : 'OTHER'
      },
      {
        field: 'allocationStatus',
        header: 'Allocation',
        width: '160px',
        type: 'badge',
        formatter: (val: any) => {
          const status = val || 'unallocated';
          return status.replace('_', ' ').toUpperCase();
        }
      },
      {
        field: 'amount',
        header: 'Amount',
        width: '150px',
        pinned: 'right',
        type: 'currency',
        align: 'right'
      }
    ];
  }



  openPhotoUpload() {
    const custId = this.customer()?._id;
    if (!custId) return;

    this.dialogServices.openImageUpload({
      header: 'Update Customer Photo',
      description: 'Upload a new avatar for this customer.',
      uploadFn: (file: File) => this.customerService.uploadCustomerPhoto(custId, file)
    })?.onClose.pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (res?.data?.customer?.photo) {
        this.customer.update(c => ({ ...c, avatar: res.data.customer.photo }));
        this.cdr.detectChanges();
      }
    });
  }

  loadProfile(id: string): void {
    this.isError.set(false);
    this.customerService.getCustomerDataWithId(id)
      .pipe(
        catchError(err => {
          this.messageService.handleHttpError(err);
          this.isError.set(true);
          return of(null);
        }),
        finalize(() => this.loadingProfile.set(false)), takeUntil(this.destroy$)
      )
      .subscribe((res: any) => {
        if (res?.data) {
          const data = res.data.data || res.data;
          this.customer.set(data);
          this.switchTab('ledger');
        }
      });
  }

  private fetchLedger(id: string, params: any, isReset: boolean) {
    this.financialService.getCustomerLedger(id, params).pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err);
        return of({ history: [], closingBalance: 0, count: 0 });
      }),
      finalize(() => this.tabStatus.update(s => ({ ...s, ledger: { ...s.ledger, loading: false } }))), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      const history = res.history || [];
      this.ledgerHistory.update(old => isReset ? history : [...old, ...history]);

      this.tabStatus.update(s => ({ ...s, ledger: { ...s.ledger, total: res.count || 0 } }));
      this.closingBalance.set(res.closingBalance || 0);

      this.finishTabLoad('ledger');
    });
  }

  private fetchInvoices(id: string, params: any, isReset: boolean) {
    this.invoiceService.getInvoicesByCustomer(id).pipe(
      catchError((err: any) => {
        this.messageService.handleHttpError(err);
        return of({ data: { invoices: [] }, total: 0 });
      }),
      finalize(() => this.tabStatus.update(s => ({ ...s, invoices: { ...s.invoices, loading: false } }))), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      let data = res.invoices || res.data?.invoices || (Array.isArray(res) ? res : []);
      this.invoices.update(old => isReset ? data : [...old, ...data]);

      this.tabStatus.update(s => ({ ...s, invoices: { ...s.invoices, total: res.total || res.results || 0 } }));
      this.finishTabLoad('invoices');
    });
  }

  private fetchPayments(id: string, params: any, isReset: boolean) {
    this.paymentService.getPaymentsByCustomer(id).pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err);
        return of({ data: { payments: [] }, total: 0 });
      }),
      finalize(() => this.tabStatus.update(s => ({ ...s, payments: { ...s.payments, loading: false } }))), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      let data = res.payments || res.data?.payments || (Array.isArray(res) ? res : []);
      this.payments.update(old => isReset ? data : [...old, ...data]);

      this.tabStatus.update(s => ({ ...s, payments: { ...s.payments, total: res.total || res.results || 0 } }));
      this.finishTabLoad('payments');
    });
  }

  retryLoad() {
    if (this.customerId()) this.loadProfile(this.customerId()!);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
