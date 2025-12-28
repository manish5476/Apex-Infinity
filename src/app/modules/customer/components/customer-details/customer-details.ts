
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
  private pageSize = 20;

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
  
  private fetchLedger(id: string, params: any, isReset: boolean) {
    this.financialService.getCustomerLedger(id, params).pipe(
      catchError(() => of({ history: [], closingBalance: 0, total: 0 })),
      finalize(() => this.tabStatus.ledger.loading = false)
    ).subscribe((res: any) => {
      const history = res.history || res.data?.history || [];
      this.ledgerHistory.update(old => isReset ? history : [...old, ...history]);
      
      this.tabStatus.ledger.total = res.total || res.results || 0;
      this.closingBalance.set(res.closingBalance || res.data?.closingBalance || 0);
      
      this.finishTabLoad('ledger');
    });
  }

  private fetchInvoices(id: string, params: any, isReset: boolean) {
    this.invoiceService.getInvoicesByCustomer(id).pipe(
      catchError(() => of({ data: { invoices: [] }, total: 0 })),
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
      catchError(() => of({ data: { payments: [] }, total: 0 })),
      finalize(() => this.tabStatus.payments.loading = false)
    ).subscribe((res: any) => {
      let data = res.payments || res.data?.payments || (Array.isArray(res) ? res : []);
      this.payments.update(old => isReset ? data : [...old, ...data]);
      
      this.tabStatus.payments.total = res.total || res.results || 0;
      this.finishTabLoad('payments');
    });
  }

  private finishTabLoad(tab: TabType) {
    this.tabStatus[tab].page++;
    this.tabStatus[tab].loaded = true;
    this.cdr.detectChanges();
  }

  // --- Initialization & Renderers ---

  loadProfile(id: string): void {
    this.isError.set(false);
    this.customerService.getCustomerDataWithId(id)
      .pipe(
        catchError(err => {
          this.messageService.showError('Error', 'Could not load customer profile');
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

  initColumns() {
    this.ledgerColumns = [
      { field: 'date', headerName: 'Date', width: 120, valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('en-IN') : '' },
      { 
        headerName: 'Reference', field: 'referenceNumber', width: 180, 
        cellRenderer: (p: any) => p.value ? `<span style="color:var(--accent-primary);font-weight:600;cursor:pointer;font-family:monospace;">${p.value}</span>` : '' 
      },
      {
        field: 'referenceType', headerName: 'Type', width: 110,
        cellRenderer: (p: any) => {
          const map: any = { invoice: { bg: '#e0f2fe', text: '#0369a1' }, payment: { bg: '#dcfce7', text: '#15803d' } };
          const theme = map[p.value?.toLowerCase()] || map.invoice;
          return `<span style="background:${theme.bg};color:${theme.text};padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;">${p.value}</span>`;
        }
      },
      { field: 'description', headerName: 'Description', flex: 1, minWidth: 220 },
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
            this.messageService.showSuccess('Success', 'Photo updated');
          }
        }, 'Upload Photo'
      );
    }
  }

  retryLoad() {
    if (this.customerId()) this.loadProfile(this.customerId()!);
  }
}

// import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule, Router } from '@angular/router';
// import { of } from 'rxjs';
// import { catchError, finalize } from 'rxjs/operators';

// // PrimeNG Imports
// import { ButtonModule } from 'primeng/button';
// import { AvatarModule } from 'primeng/avatar';
// import { TagModule } from 'primeng/tag';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TooltipModule } from 'primeng/tooltip';
// import { DialogModule } from 'primeng/dialog';
// import { ToastModule } from 'primeng/toast';

// // Shared Grid
// // Services & Components
// import { CustomerService } from '../../services/customer-service';
// import { InvoiceService } from '../../../invoice/services/invoice-service';
// import { PaymentService } from '../../../payment/services/payment-service';
// import { FinancialService } from '../../../Ledger/financial.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { CommonMethodService } from '../../../../core/utils/common-method.service';
// import { CustomerTransactions } from '../../../transactions/customer-transactions/customer-transactions';
// import { ImageViewerDirective } from '../../../shared/directives/image-viewer.directive';
// import { AgShareGrid } from '../../../shared/components/ag-shared-grid';

// type TabType = 'ledger' | 'invoices' | 'payments';

// @Component({
//   selector: 'app-customer-details',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ImageViewerDirective,
//     RouterModule,
//     ButtonModule,
//     AvatarModule,
//     TagModule,
//     SkeletonModule,
//     TooltipModule,
//     DialogModule,
//     ToastModule,
//     CustomerTransactions,
//     AgShareGrid
//   ],
//   providers: [CustomerService, InvoiceService, PaymentService, FinancialService],
//   templateUrl: './customer-details.html',
//   styleUrl: './customer-details.scss',
// })
// export class CustomerDetails implements OnInit {
//   // --- Dependencies ---
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private customerService = inject(CustomerService);
//   private invoiceService = inject(InvoiceService);
//   private paymentService = inject(PaymentService);
//   private financialService = inject(FinancialService);
//   private messageService = inject(AppMessageService);
//   public common = inject(CommonMethodService);
//   private cdr = inject(ChangeDetectorRef)
//   // --- State Signals ---
//   loadingProfile = signal(true);
//   isError = signal(false);
//   customerId = signal<string | null>(null);
//   customer = signal<any | null>(null);

//   // Tab State
//   activeTab = signal<TabType>('ledger');
//   tabStatus = {
//     ledger: { loaded: false, loading: false, error: false },
//     invoices: { loaded: false, loading: false, error: false },
//     payments: { loaded: false, loading: false, error: false }
//   };

//   // Data Signals (For Grid)
//   invoices = signal<any[]>([]);
//   payments = signal<any[]>([]);
//   ledgerHistory = signal<any[]>([]);

//   // Column Definitions
//   ledgerColumns: any[] = [];
//   invoiceColumns: any[] = [];
//   paymentColumns: any[] = [];

//   // Dialogs
//   showTransactionsDialog = false;

//   // Stats
//   closingBalance = signal(0);
//   totalInvoiced = computed(() => this.invoices().reduce((acc, inv) => acc + (inv.grandTotal || 0), 0));
//   totalPaid = computed(() => this.payments().reduce((acc, pay) => acc + (pay.amount || 0), 0));

//   ngOnInit(): void {
//     this.initColumns();
//     this.route.paramMap.subscribe(params => {
//       const id = params.get('id');
//       if (!id) {
//         this.router.navigate(['/customer']);
//         return;
//       }
//       this.customerId.set(id);
//       this.loadProfile(id);
//     });
//     this.initColumns();
//   }

//   eventFromGrid(event: any) {

//   }

//   initColumns() {
//     this.ledgerColumns = [
//       {
//         field: 'date',
//         headerName: 'Date',
//         width: 120,
//         valueFormatter: (p: any) =>
//           p.value ? new Date(p.value).toLocaleDateString('en-IN') : '',
//       },
//       {
//         headerName: 'Reference',
//         field: 'referenceNumber',
//         width: 180,
//         cellRenderer: (p: any) => {
//           if (!p.value) return '';
//           return `<span style="
//         color: var(--accent-primary);
//         font-weight: 600;
//         cursor: pointer;
//         font-family: monospace;">
//         ${p.value}
//       </span>`;
//         }
//       },
//       {
//         field: 'referenceType',
//         headerName: 'Type',
//         width: 110,
//         cellRenderer: (p: any) => {
//           const map: any = {
//             invoice: { bg: '#e0f2fe', text: '#0369a1' },
//             payment: { bg: '#dcfce7', text: '#15803d' }
//           };
//           const theme = map[p.value?.toLowerCase()] || map.invoice;
//           return `<span style="
//         background:${theme.bg};
//         color:${theme.text};
//         padding:4px 10px;
//         border-radius:6px;
//         font-size:11px;
//         font-weight:700;
//         text-transform:uppercase;">
//         ${p.value}
//       </span>`;
//         }
//       },
//       {
//         field: 'description',
//         headerName: 'Description',
//         flex: 1,
//         minWidth: 220,
//       },
//       {
//         field: 'debit',
//         headerName: 'Debit',
//         width: 130,
//         type: 'rightAligned',
//         valueFormatter: (p: any) =>
//           p.value > 0 ? this.common.formatCurrency(p.value) : '',
//         cellStyle: { color: '#dc2626', fontWeight: '700' }
//       },
//       {
//         field: 'credit',
//         headerName: 'Credit',
//         width: 130,
//         type: 'rightAligned',
//         valueFormatter: (p: any) =>
//           p.value > 0 ? this.common.formatCurrency(p.value) : '',
//         cellStyle: { color: '#059669', fontWeight: '700' }
//       },
//       {
//         field: 'balance',
//         headerName: 'Balance',
//         width: 150,
//         type: 'rightAligned',
//         valueFormatter: (p: any) => this.common.formatCurrency(p.value),
//         cellStyle: {
//           fontWeight: '800',
//           fontFamily: 'monospace',
//           background: 'var(--bg-ternary)'
//         }
//       }
//     ];

//     // 2. Invoice Columns
//     this.invoiceColumns = [
//       {
//         field: 'invoiceNumber',
//         headerName: 'Invoice #',
//         width: 160,
//         cellStyle: {
//           color: 'var(--accent-primary)',
//           fontWeight: '700',
//           cursor: 'pointer'
//         }
//       },
//       {
//         field: 'invoiceDate',
//         headerName: 'Date',
//         width: 120,
//         valueFormatter: (p: any) =>
//           p.value ? new Date(p.value).toLocaleDateString('en-IN') : ''
//       },
//       {
//         field: 'status',
//         headerName: 'Status',
//         width: 110,
//         cellRenderer: (p: any) =>
//           this.statusBadgeRenderer(p.value, 'status')
//       },
//       {
//         field: 'paymentStatus',
//         headerName: 'Payment',
//         width: 110,
//         cellRenderer: (p: any) =>
//           this.statusBadgeRenderer(p.value, 'payment')
//       },
//       {
//         field: 'grandTotal',
//         headerName: 'Total',
//         width: 140,
//         type: 'rightAligned',
//         valueFormatter: (p: any) => this.common.formatCurrency(p.value),
//         cellStyle: {
//           fontWeight: '700',
//           fontFamily: 'monospace'
//         }
//       },
//       {
//         field: 'balanceAmount',
//         headerName: 'Due',
//         width: 140,
//         type: 'rightAligned',
//         valueFormatter: (p: any) => this.common.formatCurrency(p.value),
//         cellStyle: (p: any) => ({
//           color: p.value > 0 ? '#dc2626' : '#059669',
//           fontWeight: '700',
//           fontFamily: 'monospace'
//         })
//       }
//     ];

//     // 3. Payment Columns
//     this.paymentColumns = [
//       {
//         field: 'paymentDate',
//         headerName: 'Date',
//         width: 120,
//         valueFormatter: (p: any) =>
//           p.value ? new Date(p.value).toLocaleDateString('en-IN') : ''
//       },
//       {
//         field: 'paymentMethod',
//         headerName: 'Method',
//         width: 120,
//         valueFormatter: (p: any) => (p.value || '').toUpperCase()
//       },
//       {
//         field: 'transactionId',
//         headerName: 'Reference',
//         width: 160,
//         cellStyle: {
//           fontFamily: 'monospace',
//           color: 'var(--text-secondary)'
//         }
//       },
//       {
//         field: 'amount',
//         headerName: 'Amount',
//         width: 140,
//         type: 'rightAligned',
//         valueFormatter: (p: any) => this.common.formatCurrency(p.value),
//         cellStyle: {
//           color: '#059669',
//           fontWeight: '800',
//           fontFamily: 'monospace'
//         }
//       }
//     ];
//   }

//   loadProfile(id: string): void {
//     // this.loadingProfile.set(true);
//     this.isError.set(false);

//     this.customerService.getCustomerDataWithId(id)
//       .pipe(
//         catchError(err => {
//           // this.isError.set(true);
//           this.messageService.showError('Error', 'Could not load customer profile');
//           return of(null);
//         }),
//         finalize(() => this.loadingProfile.set(false))
//       )
//       .subscribe((res: any) => {
//         if (res?.data) {
//           const data = res.data.data || res.data;
//           this.customer.set(data);
//           this.closingBalance.set(data.outstandingBalance || 0);

//           if (this.customer()?._id) {
//             this.switchTab('ledger');
//           }
//         } else if (!this.isError()) {
//           //  this.isError.set(true);
//         }
//       });
//   }

//   switchTab(tab: TabType) {
//     this.activeTab.set(tab);
//     if (this.tabStatus[tab].loaded || this.tabStatus[tab].loading) return;
//     const id = this.customerId();
//     if (!id) return;

//     this.tabStatus[tab].loading = true;

//     if (tab === 'ledger') this.fetchLedger(id);
//     else if (tab === 'invoices') this.fetchInvoices(id);
//     else if (tab === 'payments') this.fetchPayments(id);
//   }

//   // private fetchLedger(id: string) {
//   //   this.tabStatus.ledger.loading = true;
//   //   this.financialService.getCustomerLedger(id).pipe(
//   //     catchError(() =>
//   //       of({ history: [], closingBalance: 0, openingBalance: 0 })
//   //     ),
//   //     finalize(() => (this.tabStatus.ledger.loading = false))
//   //   ).subscribe((res: any) => {
//   //     console.log(res);
//   //     this.ledgerHistory.set(res.history ?? []);
//   //     this.closingBalance.set(res.closingBalance ?? 0);
//   //     this.tabStatus.ledger.loaded = true;
//   //   });
//   //   this.cdr.detectChanges()
//   // }

//   // private fetchInvoices(id: string) {
//   //   this.tabStatus.invoices.loading = true;
//   //   this.invoiceService.getInvoicesByCustomer(id).pipe(
//   //     catchError(() => of({ data: { invoices: [] } })),
//   //     finalize(() => (this.tabStatus.invoices.loading = false))
//   //   ).subscribe((res: any) => {
//   //     console.log(res);
//   //     this.invoices.set(res?.data?.invoices ?? []);
//   //     this.tabStatus.invoices.loaded = true;
//   //   });
//   // }

//   // private fetchPayments(id: string) {
//   //   this.tabStatus.payments.loading = true;

//   //   this.paymentService.getPaymentsByCustomer(id).pipe(
//   //     catchError(() => of({ data: { payments: [] } })),
//   //     finalize(() => (this.tabStatus.payments.loading = false))
//   //   ).subscribe((res: any) => {
//   //     console.log(res);
//   //     this.payments.set(res?.data?.payments ?? []);
//   //     this.tabStatus.payments.loaded = true;
//   //   });
//   // }
// private fetchLedger(id: string) {
//     this.tabStatus.ledger.loading = true;
//     this.financialService.getCustomerLedger(id).pipe(
//       catchError(() => of({ history: [], closingBalance: 0 })),
//       finalize(() => this.tabStatus.ledger.loading = false)
//     ).subscribe((res: any) => {
//       // JSON: { "history": [...], "closingBalance": ... }
//       // OR { "data": { "history": [...] } } depending on service
//       const history = res.history || res.data?.history || []; 
//       const closing = res.closingBalance || res.data?.closingBalance || 0;

//       this.ledgerHistory.set(history);
//       this.closingBalance.set(closing);
//       this.tabStatus.ledger.loaded = true;
//       this.cdr.detectChanges(); // Ensure UI updates
//     });
//   }

//   private fetchInvoices(id: string) {
//     this.tabStatus.invoices.loading = true;
//     this.invoiceService.getInvoicesByCustomer(id).pipe(
//       catchError(() => of({ data: { invoices: [] } })),
//       finalize(() => this.tabStatus.invoices.loading = false)
//     ).subscribe((res: any) => {
//       // JSON: { "data": { "invoices": [...] } }
//       // Robust check:
//       let data = [];
//       if (Array.isArray(res)) data = res;
//       else if (Array.isArray(res.invoices)) data = res.invoices;
//       else if (Array.isArray(res.data?.invoices)) data = res.data.invoices;
      
//       this.invoices.set(data);
//       this.tabStatus.invoices.loaded = true;
//       this.cdr.detectChanges();
//     });
//   }

//   private fetchPayments(id: string) {
//     this.tabStatus.payments.loading = true;
//     this.paymentService.getPaymentsByCustomer(id).pipe(
//       catchError(() => of({ data: { payments: [] } })),
//       finalize(() => this.tabStatus.payments.loading = false)
//     ).subscribe((res: any) => {
//       // JSON: { "data": { "payments": [...] } }
//       let data = [];
//       if (Array.isArray(res)) data = res;
//       else if (Array.isArray(res.payments)) data = res.payments;
//       else if (Array.isArray(res.data?.payments)) data = res.data.payments;

//       this.payments.set(data);
//       this.tabStatus.payments.loaded = true;
//       this.cdr.detectChanges();
//     });
//   }

//   private statusBadgeRenderer(
//     val: string,
//     type: 'status' | 'payment'
//   ): string {
//     if (!val) return '';

//     const colors: any = {
//       draft: { bg: '#f3f4f6', text: '#374151' },
//       issued: { bg: '#e0f2fe', text: '#0369a1' },
//       paid: { bg: '#dcfce7', text: '#15803d' },
//       unpaid: { bg: '#fee2e2', text: '#b91c1c' },
//       partial: { bg: '#fef9c3', text: '#854d0e' },
//       cancelled: { bg: '#f1f5f9', text: '#64748b' }
//     };

//     const theme = colors[val.toLowerCase()] || colors.draft;

//     return `
//     <span style="
//       background:${theme.bg};
//       color:${theme.text};
//       padding:4px 10px;
//       border-radius:6px;
//       font-size:11px;
//       font-weight:700;
//       text-transform:uppercase;
//       letter-spacing:0.5px;">
//       ${val}
//     </span>
//   `;
//   }
//   // --- Grid Events ---
//   onGridEvent(event: any, type: TabType) {
//     if (event.type === 'cellClicked' && type === 'invoices') {
//       const invoiceId = event.row._id;
//       this.router.navigate(['/invoices', invoiceId]);
//     }
//     if (event.type === 'cellClicked' && type === 'payments') {
//       const paymentid = event.row._id;
//       this.router.navigate(['/payments', paymentid]);
//     }
//   }

//   // Helper for styling
//   getStatusClass(status: string) {
//     switch (status?.toLowerCase()) {
//       case 'paid': return 'text-green-600 bg-green-50 px-2 py-1 rounded uppercase text-xs font-bold';
//       case 'partial': return 'text-orange-600 bg-orange-50 px-2 py-1 rounded uppercase text-xs font-bold';
//       default: return 'text-red-600 bg-red-50 px-2 py-1 rounded uppercase text-xs font-bold';
//     }
//   }

//   // --- File Upload & Actions ---
//   onFileSelected(event: any): void {
//     const file: File = event.target.files[0];
//     if (file && this.customer()?._id) {
//       // const formData = new FormData();
//       // formData.append('photo', file);

//       this.common.apiCall(
//         this.customerService.uploadCustomerPhoto(this.customer()._id, file),
//         (res: any) => {
//           if (res.data?.customer?.photo) {
//             this.customer.update(c => ({ ...c, avatar: res.data.customer.photo }));
//             this.messageService.showSuccess('Success', 'Photo updated');
//             this.route.paramMap.subscribe(params => {
//               const id = params.get('id');
//               if (!id) {
//                 this.router.navigate(['/customer']);
//                 return;
//               }
//               this.customerId.set(id);
//               this.loadProfile(id);
//             });
//           }
//         }, 'Upload Photo'
//       );
//     }
//   }

//   retryLoad() {
//     if (this.customerId()) this.loadProfile(this.customerId()!);
//   }
// }
