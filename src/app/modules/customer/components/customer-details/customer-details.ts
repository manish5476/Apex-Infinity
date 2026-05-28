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
import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';

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
    AgShareGrid,
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

  readonly invoiceActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: false,
    showDelete: false,
    showReturn: true,
    viewPermission: PERMISSIONS.INVOICE.READ,
    returnPermission: PERMISSIONS.SALES_RETURN.MANAGE
  };

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

  ledgerColumns: any[] = [];
  invoiceColumns: any[] = [];
  paymentColumns: any[] = [];

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
      { field: 'date', headerName: 'Date', width: 120, valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('en-IN') : '' },
      {
        headerName: 'Reference', field: 'description', width: 220,
        cellClass: 'text-primary font-bold'
      },
      {
        field: 'referenceType', headerName: 'Type', width: 110,
        cellRenderer: (p: any) => {
          const type = (p.value || '').toLowerCase();
          return `<div class="status-pill status-${type === 'invoice' ? 'info' : 'success'}"><span class="dot"></span>${type}</div>`;
        }
      },
      { field: 'accountName', headerName: 'Account', flex: 1, minWidth: 150 },
      { field: 'debit', headerName: 'Debit', width: 130, type: 'rightAligned', valueFormatter: (p: any) => p.value > 0 ? this.common.formatCurrency(p.value) : '', cellClass: 'text-error font-bold font-mono text-right' },
      { field: 'credit', headerName: 'Credit', width: 130, type: 'rightAligned', valueFormatter: (p: any) => p.value > 0 ? this.common.formatCurrency(p.value) : '', cellClass: 'text-success font-bold font-mono text-right' },
      { field: 'balance', headerName: 'Balance', width: 150, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value), cellClass: 'font-bold font-mono bg-ternary text-right' }
    ];

    this.invoiceColumns = [
      { field: 'invoiceNumber', headerName: 'Invoice #', width: 160, cellStyle: { color: 'var(--accent-primary)', fontWeight: '700', cursor: 'pointer' } },
      { field: 'invoiceDate', headerName: 'Date', width: 120, valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('en-IN') : '' },
      { field: 'status', headerName: 'Status', width: 130, cellRenderer: (p: any) => this.statusBadgeRenderer(p.value) },
      { field: 'paymentStatus', headerName: 'Payment', width: 130, cellRenderer: (p: any) => this.statusBadgeRenderer(p.value) },
      { field: 'grandTotal', headerName: 'Total', width: 140, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value), cellClass: 'font-bold font-mono text-right' },
      { field: 'balanceAmount', headerName: 'Due', width: 140, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value), cellClass: (p: any) => p.value > 0 ? 'text-error font-bold font-mono text-right' : 'text-success font-bold font-mono text-right' }
    ];

    this.paymentColumns = [
      { 
        field: 'paymentDate', 
        headerName: 'Date', 
        width: 130, 
        pinned: 'left',
        valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
        cellClass: 'text-secondary font-bold'
      },
      {
        headerName: 'Reference & Source',
        children: [
          { 
            field: 'invoiceId.invoiceNumber', 
            headerName: 'Invoice No.', 
            width: 160,
            valueGetter: (p: any) => p.data.invoiceId?.invoiceNumber || 'Advance Payment',
            cellRenderer: (p: any) => `
              <div style="display: flex; align-items: center; gap: 8px;">
                <i class="pi ${p.value === 'Advance Payment' ? 'pi-star-fill text-warning' : 'pi-file-text text-info'}" style="font-size: 10px"></i>
                <span class="font-bold text-primary">${p.value}</span>
              </div>
            `
          },
          { 
            field: 'referenceNumber', 
            headerName: 'Ref #', 
            width: 140,
            cellClass: 'font-mono text-xs text-tertiary',
            valueFormatter: (p: any) => p.value || p.data._id.slice(-8).toUpperCase()
          }
        ]
      },
      { 
        field: 'paymentMethod', 
        headerName: 'Method', 
        width: 130,
        cellRenderer: (p: any) => {
          const method = (p.value || 'other').toLowerCase();
          const icons: any = { cash: 'pi-money-bill', cheque: 'pi-id-card', upi: 'pi-mobile', card: 'pi-credit-card' };
          return `
            <div class="method-badge badge-${method}">
              <i class="pi ${icons[method] || 'pi-wallet'}"></i>
              <span>${method.toUpperCase()}</span>
            </div>
          `;
        }
      },
      { 
        field: 'allocationStatus', 
        headerName: 'Allocation', 
        width: 160,
        cellRenderer: (p: any) => {
          const status = p.value || 'unallocated';
          const isFull = status === 'fully_allocated';
          return `
            <div class="status-pill status-${isFull ? 'success' : 'warning'}">
              <span class="dot"></span>
              ${status.replace('_', ' ')}
            </div>
          `;
        }
      },
      { 
        field: 'amount', 
        headerName: 'Amount', 
        width: 150, 
        pinned: 'right',
        type: 'rightAligned', 
        cellClass: 'font-mono font-bold text-success text-right',
        valueFormatter: (p: any) => this.common.formatCurrency(p.value)
      }
    ];
  }

  private statusBadgeRenderer(val: string): string {
    if (!val) return '';
    const formattedVal = val.toLowerCase();
    return `<div class="status-pill status-${formattedVal}"><span class="dot"></span>${val}</div>`;
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
