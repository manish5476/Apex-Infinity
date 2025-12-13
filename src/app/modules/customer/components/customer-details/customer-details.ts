import { Component, OnInit, inject, signal, computed } from '@angular/core';
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

// Shared Grid
// Services & Components
import { CustomerService } from '../../services/customer-service';
import { InvoiceService } from '../../../invoice/services/invoice-service';
import { PaymentService } from '../../../payment/services/payment-service';
import { FinancialService } from '../../../Ledger/financial.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { CustomerTransactions } from '../../../transactions/customer-transactions/customer-transactions';
import { ImageViewerDirective } from '../../../shared/directives/image-viewer.directive';
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";

type TabType = 'ledger' | 'invoices' | 'payments';

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

  // --- State Signals ---
  loadingProfile = signal(true);
  isError = signal(false);
  customerId = signal<string | null>(null);
  customer = signal<any | null>(null);

  // Tab State
  activeTab = signal<TabType>('ledger');
  tabStatus = {
    ledger:   { loaded: false, loading: false, error: false },
    invoices: { loaded: false, loading: false, error: false },
    payments: { loaded: false, loading: false, error: false }
  };

  // Data Signals (For Grid)
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

  initColumns() {
    // 1. Ledger Columns
    this.ledgerColumns = [
      { 
        field: 'date', headerName: 'Date', sortable: true, width: 120,
        valueFormatter: (p: any) => this.common.formatDate(p.value) 
      },
      { field: 'description', headerName: 'Description', sortable: true, flex: 2 },
      { 
        field: 'type', headerName: 'Type', width: 100,
        cellClass: (p: any) => p.value === 'credit' ? 'text-green-600 font-bold uppercase text-xs' : 'text-red-600 font-bold uppercase text-xs'
      },
      { 
        field: 'amount', headerName: 'Amount', type: 'rightAligned', width: 130,
        valueFormatter: (p: any) => this.common.formatCurrency(p.value),
        cellStyle: { fontWeight: 'bold' }
      },
      { 
        field: 'balance', headerName: 'Balance', type: 'rightAligned', width: 130,
        valueFormatter: (p: any) => this.common.formatCurrency(p.value),
        cellStyle: { color: 'var(--text-secondary)' }
      }
    ];

    // 2. Invoice Columns
    this.invoiceColumns = [
      { 
        field: 'invoiceNumber', headerName: 'Invoice #', sortable: true, width: 150,
        cellStyle: { color: 'var(--accent-primary)', fontWeight: 'bold', cursor: 'pointer' }
      },
      { 
        field: 'invoiceDate', headerName: 'Date', sortable: true, width: 120,
        valueFormatter: (p: any) => this.common.formatDate(p.value) 
      },
      { 
        field: 'paymentStatus', headerName: 'Status', width: 120,
        cellClass: (p: any) => this.getStatusClass(p.value)
      },
      { 
        field: 'grandTotal', headerName: 'Total', type: 'rightAligned', width: 130,
        valueFormatter: (p: any) => this.common.formatCurrency(p.value)
      },
      { 
        field: 'balanceAmount', headerName: 'Due', type: 'rightAligned', width: 130,
        valueFormatter: (p: any) => this.common.formatCurrency(p.value),
        cellStyle: (p: any) => p.value > 0 ? { color: 'var(--color-error)', fontWeight: 'bold' } : { color: 'var(--color-success)' }
      }
    ];

    // 3. Payment Columns
    this.paymentColumns = [
      { 
        field: 'paymentDate', headerName: 'Date', sortable: true, width: 120,
        valueFormatter: (p: any) => this.common.formatDate(p.value) 
      },
      { field: 'paymentMethod', headerName: 'Mode', width: 120, valueFormatter: (p:any) => (p.value || '').toUpperCase() },
      { field: 'transactionId', headerName: 'Reference ID', width: 150 },
      { 
        field: 'amount', headerName: 'Amount', type: 'rightAligned', width: 130,
        valueFormatter: (p: any) => this.common.formatCurrency(p.value),
        cellStyle: { color: 'var(--color-success)', fontWeight: 'bold' }
      }
    ];
  }

  loadProfile(id: string): void {
    // this.loadingProfile.set(true);
    this.isError.set(false);

    this.customerService.getCustomerDataWithId(id)
      .pipe(
        catchError(err => {
          // this.isError.set(true);
          this.messageService.showError('Error', 'Could not load customer profile');
          return of(null);
        }),
        finalize(() => this.loadingProfile.set(false))
      )
      .subscribe((res: any) => {
        if (res?.data) {
          const data = res.data.data || res.data;
          this.customer.set(data);
          this.closingBalance.set(data.outstandingBalance || 0);

          if (this.customer()?._id) {
             this.switchTab('ledger');
          }
        } else if (!this.isError()) {
          //  this.isError.set(true);
        }
      });
  }

  switchTab(tab: TabType) {
    this.activeTab.set(tab);
    if (this.tabStatus[tab].loaded || this.tabStatus[tab].loading) return;
    const id = this.customerId();
    if (!id) return;

    this.tabStatus[tab].loading = true;

    if (tab === 'ledger') this.fetchLedger(id);
    else if (tab === 'invoices') this.fetchInvoices(id);
    else if (tab === 'payments') this.fetchPayments(id);
  }

  private fetchLedger(id: string) {
    this.financialService.getCustomerLedger(id).pipe(
      catchError(() => of({ data: { history: [], closingBalance: 0 } })),
      finalize(() => this.tabStatus.ledger.loading = false)
    ).subscribe((res: any) => {
      const data = res?.data || {};
      this.ledgerHistory.set(data.history || []);
      if (data.closingBalance !== undefined) this.closingBalance.set(data.closingBalance);
      this.tabStatus.ledger.loaded = true;
    });
  }

  private fetchInvoices(id: string) {
    this.invoiceService.getInvoicesByCustomer(id).pipe(
      catchError(() => of({ data: [] })),
      finalize(() => this.tabStatus.invoices.loading = false)
    ).subscribe((res: any) => {
      this.invoices.set(res?.data?.invoices || res?.data || []);
      this.tabStatus.invoices.loaded = true;
    });
  }

  private fetchPayments(id: string) {
    this.paymentService.getPaymentsByCustomer(id).pipe(
      catchError(() => of({ data: [] })),
      finalize(() => this.tabStatus.payments.loading = false)
    ).subscribe((res: any) => {
      this.payments.set(res?.data?.payments || res?.data || []);
      this.tabStatus.payments.loaded = true;
    });
  }

  // --- Grid Events ---
  onGridEvent(event: any, type: TabType) {
    if (event.type=== 'cellClicked' && type === 'invoices') {
       const invoiceId = event.row._id;
       this.router.navigate(['/invoices', invoiceId]);
    }
    if (event.type=== 'cellClicked' && type === 'payments') {
       const paymentid = event.row._id;
       this.router.navigate(['/payments', paymentid]);
    }
  }


  
  // Helper for styling
  getStatusClass(status: string) {
    switch(status?.toLowerCase()) {
      case 'paid': return 'text-green-600 bg-green-50 px-2 py-1 rounded uppercase text-xs font-bold';
      case 'partial': return 'text-orange-600 bg-orange-50 px-2 py-1 rounded uppercase text-xs font-bold';
      default: return 'text-red-600 bg-red-50 px-2 py-1 rounded uppercase text-xs font-bold';
    }
  }

  // --- File Upload & Actions ---
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.customer()?._id) {
      // const formData = new FormData();
      // formData.append('photo', file);
      
      this.common.apiCall(
        this.customerService.uploadCustomerPhoto(this.customer()._id,file ),
        (res: any) => {
          if(res.data?.customer?.photo) {
             this.customer.update(c => ({...c, avatar: res.data.customer.photo}));
             this.messageService.showSuccess('Success', 'Photo updated');
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
        }, 'Upload Photo'
      );
    }
  }

  retryLoad() {
    if(this.customerId()) this.loadProfile(this.customerId()!);
  }
}

// import { Component, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule, Router } from '@angular/router';
// import { of } from 'rxjs'; 
// import { catchError, finalize, delay } from 'rxjs/operators';

// // PrimeNG Imports
// import { ButtonModule } from 'primeng/button';
// import { AvatarModule } from 'primeng/avatar';
// import { TagModule } from 'primeng/tag';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TableModule } from 'primeng/table';
// import { TooltipModule } from 'primeng/tooltip';
// import { DialogModule } from 'primeng/dialog';
// import { ToastModule } from 'primeng/toast';

// // Services & Components
// import { CustomerService } from '../../services/customer-service';
// import { InvoiceService } from '../../../invoice/services/invoice-service';
// import { PaymentService } from '../../../payment/services/payment-service';
// import { FinancialService } from '../../../Ledger/financial.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { CommonMethodService } from '../../../../core/utils/common-method.service';
// import { CustomerTransactions } from '../../../transactions/customer-transactions/customer-transactions';
// import { ImageViewerDirective } from '../../../shared/directives/image-viewer.directive';

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
//     TableModule,
//     TooltipModule,
//     DialogModule,
//     ToastModule,
//     CustomerTransactions
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

//   // --- State Signals ---
  
//   // 1. Profile State (Critical)
//   loadingProfile = signal(true);
//   isError = signal(false); // New: Tracks critical load failures
//   customerId = signal<string | null>(null);
//   customer = signal<any | null>(null);

//   // 2. Tab State (Lazy Loaded)
//   activeTab = signal<TabType>('ledger');
  
//   // Track loading/loaded status for each tab to prevent re-fetching
//   tabStatus = {
//     ledger:   { loaded: false, loading: false, error: false },
//     invoices: { loaded: false, loading: false, error: false },
//     payments: { loaded: false, loading: false, error: false }
//   };

//   // 3. Data Signals
//   invoices = signal<any[]>([]);
//   payments = signal<any[]>([]);
//   ledgerHistory = signal<any[]>([]);

//   // 4. Dialogs
//   showTransactionsDialog = false;

//   // 5. Derived Stats
//   closingBalance = signal(0);
//   totalInvoiced = computed(() => this.invoices().reduce((acc, inv) => acc + (inv.grandTotal || 0), 0));
//   totalPaid = computed(() => this.payments().reduce((acc, pay) => acc + (pay.amount || 0), 0));

//   ngOnInit(): void {
//     this.route.paramMap.subscribe(params => {
//       const id = params.get('id');
//       if (!id) {
//         this.router.navigate(['/customer']);
//         return;
//       }
//       this.customerId.set(id);
//       this.loadProfile(id);
//     });
//   }

//   // --- Step 1: Load Critical Profile Data ---
//   loadProfile(id: string): void {
//     this.loadingProfile.set(true);
//     this.isError.set(false);

//     this.customerService.getCustomerDataWithId(id)
//       .pipe(
//         catchError(err => {
//           console.error('Profile Load Error:', err);
//           this.isError.set(true); // Set error state so UI can show retry button
//           this.messageService.showError('Error', 'Could not load customer profile');
//           return of(null);
//         }),
//         finalize(() => this.loadingProfile.set(false))
//       )
//       .subscribe((res: any) => {
//         if (res?.data) {
//           const data = res.data.data || res.data;
//           this.customer.set(data);
//           // Set initial balance from profile as fallback
//           this.closingBalance.set(data.outstandingBalance || 0);

//           // 2. Once profile is safe, load default tab (Ledger)
//           // We verify customer ID exists before triggering tabs
//           if (this.customer()?._id) {
//              this.switchTab('ledger');
//           }
//         } else if (!this.isError()) {
//            // If response is success but data is missing
//            this.isError.set(true);
//         }
//       });
//   }

//   // --- Step 2: Lazy Load Tabs ---
//   switchTab(tab: TabType) {
//     this.activeTab.set(tab);

//     // If data is already loaded or currently loading, stop here.
//     if (this.tabStatus[tab].loaded || this.tabStatus[tab].loading) {
//       return;
//     }

//     const id = this.customerId();
//     if (!id) return;

//     this.tabStatus[tab].loading = true;
//     this.tabStatus[tab].error = false;

//     switch (tab) {
//       case 'ledger':
//         this.fetchLedger(id);
//         break;
//       case 'invoices':
//         this.fetchInvoices(id);
//         break;
//       case 'payments':
//         this.fetchPayments(id);
//         break;
//     }
//   }

//   // --- Individual API Calls (Isolated Errors) ---

//   private fetchLedger(id: string) {
//     this.financialService.getCustomerLedger(id).pipe(
//       catchError(err => {
//         console.warn('Ledger Load Error', err);
//         this.tabStatus.ledger.error = true;
//         // Return safe default so the subscription doesn't crash
//         return of({ data: { history: [], closingBalance: 0 } });
//       }),
//       finalize(() => this.tabStatus.ledger.loading = false)
//     ).subscribe((res: any) => {
//       const data = res?.data || {};
//       this.ledgerHistory.set(data.history || []);
      
//       if (data.closingBalance !== undefined && data.closingBalance !== null) {
//         this.closingBalance.set(data.closingBalance);
//       }
//       this.tabStatus.ledger.loaded = true;
//     });
//   }

//   private fetchInvoices(id: string) {
//     this.invoiceService.getInvoicesByCustomer(id).pipe(
//       catchError(err => {
//         console.warn('Invoice Load Error', err);
//         this.tabStatus.invoices.error = true;
//         return of({ data: [] });
//       }),
//       finalize(() => this.tabStatus.invoices.loading = false)
//     ).subscribe((res: any) => {
//       const list = res?.data?.invoices || res?.data || [];
//       this.invoices.set(list);
//       this.tabStatus.invoices.loaded = true;
//     });
//   }

//   private fetchPayments(id: string) {
//     this.paymentService.getPaymentsByCustomer(id).pipe(
//       catchError(err => {
//         console.warn('Payment Load Error', err);
//         this.tabStatus.payments.error = true;
//         return of({ data: [] });
//       }),
//       finalize(() => this.tabStatus.payments.loading = false)
//     ).subscribe((res: any) => {
//       const list = res?.data?.payments || res?.data || [];
//       this.payments.set(list);
//       this.tabStatus.payments.loaded = true;
//     });
//   }


//   // --- Actions ---

//   downloadInvoice(inv: any): void {
//     if (!inv?._id) return;
//     this.common.apiCall(
//       this.invoiceService.downloadInvoice(inv._id),
//       (res: any) => {
//         if (res?.body) this.common.downloadBlob(res.body, `invoice-${inv.invoiceNumber}.pdf`);
//       }, 'Download Invoice'
//     );
//   }

//   downloadReceipt(pay: any): void {
//     if (!pay?._id) return;
//     this.common.apiCall(
//       this.paymentService.downloadReceipt(pay._id),
//       (res: any) => {
//         if (res?.body) this.common.downloadBlob(res.body, `receipt-${pay.transactionId}.pdf`);
//       }, 'Download Receipt'
//     );
//   }

//   onFileSelected(event: any): void {
//     const file: File = event.target.files[0];
//     if (file && this.customer()?._id) {
//       const formData = new FormData();
//       formData.append('photo', file);
      
//       this.common.apiCall(
//         this.customerService.uploadProfileImage(formData, this.customer()._id),
//         (res: any) => {
//           if(res.data?.customer?.photo) {
//              this.customer.update(c => ({...c, avatar: res.data.customer.photo}));
//              this.messageService.showSuccess('Success', 'Photo updated');
//           }
//         }, 'Upload Photo'
//       );
//     }
//   }
  
//   // Helper to manually retry loading profile
//   retryLoad() {
//     if(this.customerId()) {
//       this.loadProfile(this.customerId()!);
//     }
//   }
// }