import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';

// Services & Components
import { CustomerService } from '../../services/customer-service';
import { InvoiceService } from '../../../invoice/services/invoice-service';
import { PaymentService } from '../../../payment/services/payment-service';
import { FinancialService } from '../../../Ledger/financial.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { CustomerTransactions } from '../../../transactions/customer-transactions/customer-transactions';
import { ImageViewerDirective } from '../../../shared/directives/image-viewer.directive';
import { AgShareGrid } from '../../../shared/components/ag-shared-grid';

type TabType = 'ledger' | 'invoices' | 'payments';

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
    AgShareGrid
  ],
  providers: [CustomerService, InvoiceService, PaymentService, FinancialService],
  templateUrl: './customer-details.html',
  styleUrl: './customer-details.scss',
})
export class CustomerDetails implements OnInit {
  // --- Dependencies ---
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);
  private invoiceService = inject(InvoiceService);
  private paymentService = inject(PaymentService);
  private financialService = inject(FinancialService);
  private messageService = inject(AppMessageService);
  public common = inject(CommonMethodService);
  private cdr = inject(ChangeDetectorRef);

  // --- State Signals ---
  loadingProfile = signal(true);
  isError = signal(false);
  customerId = signal<string | null>(null);
  customer = signal<any | null>(null);

  // --- Pagination & Tab State ---
  activeTab = signal<TabType>('ledger');
  private pageSize = 50;

  tabStatus: Record<TabType, TabState> = {
    ledger: { loaded: false, loading: false, page: 1, total: 0 },
    invoices: { loaded: false, loading: false, page: 1, total: 0 },
    payments: { loaded: false, loading: false, page: 1, total: 0 }
  };

  // Data Signals
  invoices = signal<any[]>([]);
  payments = signal<any[]>([]);
  ledgerHistory = signal<any[]>([]);

  // Column Definitions
  ledgerColumns: any[] = [];
  invoiceColumns: any[] = [];
  paymentColumns: any[] = [];

  // Dialogs
  showTransactionsDialog = false;

  // Stats
  closingBalance = signal(0);
  totalInvoiced = computed(() => this.invoices().reduce((acc, inv) => acc + (inv.grandTotal || 0), 0));
  totalPaid = computed(() => this.payments().reduce((acc, pay) => acc + (pay.amount || 0), 0));

  ngOnInit(): void {
    this.initColumns();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.router.navigate(['/customer']);
        return;
      }
      this.customerId.set(id);
      this.loadProfile(id);
    });
  }

  // --- Grid Event Central ---
  eventFromGrid(event: any) {
    const tab = this.activeTab();

    // 1. Handle Infinite Scroll
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(tab);
    }

    // 2. Handle Navigation
    if (event.type === 'cellClicked') {
      if (tab === 'invoices') this.router.navigate(['/invoices', event.row._id]);
      if (tab === 'payments') this.router.navigate(['/payments', event.row._id]);
    }
  }

  onScrolledToBottom(tab: TabType) {
    const currentDataLength = this.getTabData(tab).length;
    if (!this.tabStatus[tab].loading && currentDataLength < this.tabStatus[tab].total) {
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
    // Initial load for the tab if not already loaded
    if (!this.tabStatus[tab].loaded && !this.tabStatus[tab].loading) {
      this.fetchDataForTab(tab, true);
    }
  }

  private fetchDataForTab(tab: TabType, isReset: boolean) {
    const id = this.customerId();
    if (!id) return;

    if (isReset) {
      this.tabStatus[tab].page = 1;
      this.tabStatus[tab].loaded = false;
    }

    const params = {
      page: this.tabStatus[tab].page,
      limit: this.pageSize
    };

    this.tabStatus[tab].loading = true;

    if (tab === 'ledger') this.fetchLedger(id, params, isReset);
    else if (tab === 'invoices') this.fetchInvoices(id, params, isReset);
    else if (tab === 'payments') this.fetchPayments(id, params, isReset);
  }

  // --- Data Fetching Methods ---
  onGridEvent(event: any, type: TabType) {
    if (event.type === 'cellClicked' && type === 'invoices') {
      const invoiceId = event.row._id;
      this.router.navigate(['/invoices', invoiceId]);
    }
    if (event.type === 'cellClicked' && type === 'payments') {
      const paymentid = event.row._id;
      this.router.navigate(['/payments', paymentid]);
    }
  }
  

  private finishTabLoad(tab: TabType) {
    this.tabStatus[tab].page++;
    this.tabStatus[tab].loaded = true;
    this.cdr.detectChanges();
  }

  // --- Initialization & Renderers ---



  initColumns() {
    this.ledgerColumns = [
      { field: 'date', headerName: 'Date', width: 120, valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('en-IN') : '' },
      { 
        // No direct reference number in history, potentially construct from invoiceId/paymentId or use description
        headerName: 'Reference', field: 'description', width: 220, 
        cellRenderer: (p: any) => p.value ? `<span style="color:var(--text-primary);font-weight:500;">${p.value}</span>` : '' 
      },
      {
        field: 'referenceType', headerName: 'Type', width: 110,
        cellRenderer: (p: any) => {
          const map: any = { invoice: { bg: '#e0f2fe', text: '#0369a1' }, payment: { bg: '#dcfce7', text: '#15803d' } };
          const theme = map[p.value?.toLowerCase()] || map.invoice;
          return `<span style="background:${theme.bg};color:${theme.text};padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;">${p.value}</span>`;
        }
      },
      { field: 'accountName', headerName: 'Account', flex: 1, minWidth: 150 },
      { field: 'debit', headerName: 'Debit', width: 130, type: 'rightAligned', valueFormatter: (p: any) => p.value > 0 ? this.common.formatCurrency(p.value) : '', cellStyle: { color: '#dc2626', fontWeight: '700' } },
      { field: 'credit', headerName: 'Credit', width: 130, type: 'rightAligned', valueFormatter: (p: any) => p.value > 0 ? this.common.formatCurrency(p.value) : '', cellStyle: { color: '#059669', fontWeight: '700' } },
      { field: 'balance', headerName: 'Balance', width: 150, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value), cellStyle: { fontWeight: '800', fontFamily: 'monospace', background: 'var(--bg-ternary)' } }
    ];

    this.invoiceColumns = [
      { field: 'invoiceNumber', headerName: 'Invoice #', width: 160, cellStyle: { color: 'var(--accent-primary)', fontWeight: '700', cursor: 'pointer' } },
      { field: 'invoiceDate', headerName: 'Date', width: 120, valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('en-IN') : '' },
      { field: 'status', headerName: 'Status', width: 110, cellRenderer: (p: any) => this.statusBadgeRenderer(p.value) },
      { field: 'paymentStatus', headerName: 'Payment', width: 110, cellRenderer: (p: any) => this.statusBadgeRenderer(p.value) },
      { field: 'grandTotal', headerName: 'Total', width: 140, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value), cellStyle: { fontWeight: '700', fontFamily: 'monospace' } },
      { field: 'balanceAmount', headerName: 'Due', width: 140, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value), cellStyle: (p: any) => ({ color: p.value > 0 ? '#dc2626' : '#059669', fontWeight: '700', fontFamily: 'monospace' }) }
    ];

    this.paymentColumns = [
      { field: 'paymentDate', headerName: 'Date', width: 120, valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('en-IN') : '' },
      { field: 'paymentMethod', headerName: 'Method', width: 120, valueFormatter: (p: any) => (p.value || '').toUpperCase() },
      { field: 'transactionId', headerName: 'Reference', width: 160, cellStyle: { fontFamily: 'monospace', color: 'var(--text-secondary)' } },
      { field: 'amount', headerName: 'Amount', width: 140, type: 'rightAligned', valueFormatter: (p: any) => this.common.formatCurrency(p.value), cellStyle: { color: '#059669', fontWeight: '800', fontFamily: 'monospace' } }
    ];
  }

  private statusBadgeRenderer(val: string): string {
    if (!val) return '';
    const colors: any = {
      draft: { bg: '#f3f4f6', text: '#374151' },
      issued: { bg: '#e0f2fe', text: '#0369a1' },
      paid: { bg: '#dcfce7', text: '#15803d' },
      unpaid: { bg: '#fee2e2', text: '#b91c1c' },
      partial: { bg: '#fef9c3', text: '#854d0e' },
      cancelled: { bg: '#f1f5f9', text: '#64748b' }
    };
    const theme = colors[val.toLowerCase()] || colors.draft;
    return `<span style="background:${theme.bg};color:${theme.text};padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${val}</span>`;
  }

onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.customer()?._id) {
      this.common.apiCall(
        this.customerService.uploadCustomerPhoto(this.customer()._id, file),
        (res: any) => {
          if (res.data?.customer?.photo) {
            this.customer.update(c => ({ ...c, avatar: res.data.customer.photo }));
            
            // Simplified to your new single-string method!
            this.messageService.showSuccess('Photo updated successfully.');
          }
        }
        // I removed the redundant 'Upload Photo' context string here, assuming your 
        // common.apiCall wrapper has been updated to use the new handleHttpError signature!
      );
    }
  }
  
  loadProfile(id: string): void {
    this.isError.set(false);
    this.customerService.getCustomerDataWithId(id)
      .pipe(
        catchError(err => {
          // Passed the actual HTTP error to your global handler!
          this.messageService.handleHttpError(err);
          
          // Added this so your UI can display a fallback state if the profile fails
          this.isError.set(true); 
          return of(null);
        }),
        finalize(() => this.loadingProfile.set(false))
      )
      .subscribe((res: any) => {
        if (res?.data) {
          const data = res.data.data || res.data;
          this.customer.set(data);
          this.switchTab('ledger'); // Auto-load first tab
        }
      });
  }

  private fetchLedger(id: string, params: any, isReset: boolean) {
    this.financialService.getCustomerLedger(id, params).pipe(
      catchError((err) => {
        // Stop the silent failure! Let the user know the ledger couldn't be loaded.
        this.messageService.handleHttpError(err);
        return of({ history: [], closingBalance: 0, count: 0 });
      }),
      finalize(() => this.tabStatus.ledger.loading = false)
    ).subscribe((res: any) => {
      // Use the history array directly as per the JSON structure
      const history = res.history || []; 
      this.ledgerHistory.update(old => isReset ? history : [...old, ...history]);
      
      this.tabStatus.ledger.total = res.count || 0; // Use count for total
      this.closingBalance.set(res.closingBalance || 0); // Use closingBalance directly
      
      this.finishTabLoad('ledger');
    });
  }

  private fetchInvoices(id: string, params: any, isReset: boolean) {
    this.invoiceService.getInvoicesByCustomer(id).pipe(
      catchError((err) => {
        // Alert the user if the invoice tab fails to populate
        this.messageService.handleHttpError(err);
        return of({ data: { invoices: [] }, total: 0 });
      }),
      finalize(() => this.tabStatus.invoices.loading = false)
    ).subscribe((res: any) => {
      let data = res.invoices || res.data?.invoices || (Array.isArray(res) ? res : []);
      this.invoices.update(old => isReset ? data : [...old, ...data]);
      
      this.tabStatus.invoices.total = res.total || res.results || 0;
      this.finishTabLoad('invoices');
    });
  }

  private fetchPayments(id: string, params: any, isReset: boolean) {
    this.paymentService.getPaymentsByCustomer(id).pipe(
      catchError((err) => {
        // Alert the user if the payment tab fails to populate
        this.messageService.handleHttpError(err);
        return of({ data: { payments: [] }, total: 0 });
      }),
      finalize(() => this.tabStatus.payments.loading = false)
    ).subscribe((res: any) => {
      let data = res.payments || res.data?.payments || (Array.isArray(res) ? res : []);
      this.payments.update(old => isReset ? data : [...old, ...data]);
      
      this.tabStatus.payments.total = res.total || res.results || 0;
      this.finishTabLoad('payments');
    });
  }


  retryLoad() {
    if (this.customerId()) this.loadProfile(this.customerId()!);
  }
}