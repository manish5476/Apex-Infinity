import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { of } from 'rxjs'; 
import { catchError, finalize, delay } from 'rxjs/operators';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
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
    TableModule,
    TooltipModule,
    DialogModule,
    ToastModule,
    CustomerTransactions
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
  
  // 1. Profile State (Critical)
  loadingProfile = signal(true);
  isError = signal(false); // New: Tracks critical load failures
  customerId = signal<string | null>(null);
  customer = signal<any | null>(null);

  // 2. Tab State (Lazy Loaded)
  activeTab = signal<TabType>('ledger');
  
  // Track loading/loaded status for each tab to prevent re-fetching
  tabStatus = {
    ledger:   { loaded: false, loading: false, error: false },
    invoices: { loaded: false, loading: false, error: false },
    payments: { loaded: false, loading: false, error: false }
  };

  // 3. Data Signals
  invoices = signal<any[]>([]);
  payments = signal<any[]>([]);
  ledgerHistory = signal<any[]>([]);

  // 4. Dialogs
  showTransactionsDialog = false;

  // 5. Derived Stats
  closingBalance = signal(0);
  totalInvoiced = computed(() => this.invoices().reduce((acc, inv) => acc + (inv.grandTotal || 0), 0));
  totalPaid = computed(() => this.payments().reduce((acc, pay) => acc + (pay.amount || 0), 0));

  ngOnInit(): void {
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

  // --- Step 1: Load Critical Profile Data ---
  loadProfile(id: string): void {
    this.loadingProfile.set(true);
    this.isError.set(false);

    this.customerService.getCustomerDataWithId(id)
      .pipe(
        catchError(err => {
          console.error('Profile Load Error:', err);
          this.isError.set(true); // Set error state so UI can show retry button
          this.messageService.showError('Error', 'Could not load customer profile');
          return of(null);
        }),
        finalize(() => this.loadingProfile.set(false))
      )
      .subscribe((res: any) => {
        if (res?.data) {
          const data = res.data.data || res.data;
          this.customer.set(data);
          // Set initial balance from profile as fallback
          this.closingBalance.set(data.outstandingBalance || 0);

          // 2. Once profile is safe, load default tab (Ledger)
          // We verify customer ID exists before triggering tabs
          if (this.customer()?._id) {
             this.switchTab('ledger');
          }
        } else if (!this.isError()) {
           // If response is success but data is missing
           this.isError.set(true);
        }
      });
  }

  // --- Step 2: Lazy Load Tabs ---
  switchTab(tab: TabType) {
    this.activeTab.set(tab);

    // If data is already loaded or currently loading, stop here.
    if (this.tabStatus[tab].loaded || this.tabStatus[tab].loading) {
      return;
    }

    const id = this.customerId();
    if (!id) return;

    this.tabStatus[tab].loading = true;
    this.tabStatus[tab].error = false;

    switch (tab) {
      case 'ledger':
        this.fetchLedger(id);
        break;
      case 'invoices':
        this.fetchInvoices(id);
        break;
      case 'payments':
        this.fetchPayments(id);
        break;
    }
  }

  // --- Individual API Calls (Isolated Errors) ---

  private fetchLedger(id: string) {
    this.financialService.getCustomerLedger(id).pipe(
      catchError(err => {
        console.warn('Ledger Load Error', err);
        this.tabStatus.ledger.error = true;
        // Return safe default so the subscription doesn't crash
        return of({ data: { history: [], closingBalance: 0 } });
      }),
      finalize(() => this.tabStatus.ledger.loading = false)
    ).subscribe((res: any) => {
      const data = res?.data || {};
      this.ledgerHistory.set(data.history || []);
      
      if (data.closingBalance !== undefined && data.closingBalance !== null) {
        this.closingBalance.set(data.closingBalance);
      }
      this.tabStatus.ledger.loaded = true;
    });
  }

  private fetchInvoices(id: string) {
    this.invoiceService.getInvoicesByCustomer(id).pipe(
      catchError(err => {
        console.warn('Invoice Load Error', err);
        this.tabStatus.invoices.error = true;
        return of({ data: [] });
      }),
      finalize(() => this.tabStatus.invoices.loading = false)
    ).subscribe((res: any) => {
      const list = res?.data?.invoices || res?.data || [];
      this.invoices.set(list);
      this.tabStatus.invoices.loaded = true;
    });
  }

  private fetchPayments(id: string) {
    this.paymentService.getPaymentsByCustomer(id).pipe(
      catchError(err => {
        console.warn('Payment Load Error', err);
        this.tabStatus.payments.error = true;
        return of({ data: [] });
      }),
      finalize(() => this.tabStatus.payments.loading = false)
    ).subscribe((res: any) => {
      const list = res?.data?.payments || res?.data || [];
      this.payments.set(list);
      this.tabStatus.payments.loaded = true;
    });
  }


  // --- Actions ---

  downloadInvoice(inv: any): void {
    if (!inv?._id) return;
    this.common.apiCall(
      this.invoiceService.downloadInvoice(inv._id),
      (res: any) => {
        if (res?.body) this.common.downloadBlob(res.body, `invoice-${inv.invoiceNumber}.pdf`);
      }, 'Download Invoice'
    );
  }

  downloadReceipt(pay: any): void {
    if (!pay?._id) return;
    this.common.apiCall(
      this.paymentService.downloadReceipt(pay._id),
      (res: any) => {
        if (res?.body) this.common.downloadBlob(res.body, `receipt-${pay.transactionId}.pdf`);
      }, 'Download Receipt'
    );
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.customer()?._id) {
      const formData = new FormData();
      formData.append('photo', file);
      
      this.common.apiCall(
        this.customerService.uploadProfileImage(formData, this.customer()._id),
        (res: any) => {
          if(res.data?.customer?.photo) {
             this.customer.update(c => ({...c, avatar: res.data.customer.photo}));
             this.messageService.showSuccess('Success', 'Photo updated');
          }
        }, 'Upload Photo'
      );
    }
  }
  
  // Helper to manually retry loading profile
  retryLoad() {
    if(this.customerId()) {
      this.loadProfile(this.customerId()!);
    }
  }
}
// import { Component, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule, Router } from '@angular/router';
// import { of } from 'rxjs'; 
// import { catchError, finalize } from 'rxjs/operators';

// // PrimeNG Imports
// import { ButtonModule } from 'primeng/button';
// import { AvatarModule } from 'primeng/avatar';
// import { TagModule } from 'primeng/tag';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TableModule } from 'primeng/table';
// import { TooltipModule } from 'primeng/tooltip';
// import { DialogModule } from 'primeng/dialog';

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
//   customer = signal<any | null>(null);

//   // 2. Tab State (Lazy Loaded)
//   activeTab = signal<TabType>('ledger');
  
//   // Track loading/loaded status for each tab to prevent re-fetching
//   tabStatus = {
//     ledger:   { loaded: false, loading: false },
//     invoices: { loaded: false, loading: false },
//     payments: { loaded: false, loading: false }
//   };

//   // 3. Data Signals
//   invoices = signal<any[]>([]);
//   payments = signal<any[]>([]);
//   ledgerHistory = signal<any[]>([]);

//   // 4. Dialogs
//   showTransactionsDialog = false;

//   // 5. Derived Stats
//   // We use the ledger's closing balance if available, otherwise 0
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
//       // 1. Load Profile Immediately
//       this.loadProfile(id);
//     });
//   }

//   // --- Step 1: Load Critical Profile Data ---
//   private loadProfile(id: string): void {
//     this.loadingProfile.set(true);

//     this.customerService.getCustomerDataWithId(id)
//       .pipe(
//         catchError(err => {
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
//           this.switchTab('ledger'); 
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

//     const customerId = this.customer()?._id;
//     if (!customerId) return;

//     // Trigger specific fetch
//     this.tabStatus[tab].loading = true;

//     switch (tab) {
//       case 'ledger':
//         this.fetchLedger(customerId);
//         break;
//       case 'invoices':
//         this.fetchInvoices(customerId);
//         break;
//       case 'payments':
//         this.fetchPayments(customerId);
//         break;
//     }
//   }

//   // --- Individual API Calls (Isolated Errors) ---

//   private fetchLedger(id: string) {
//     this.financialService.getCustomerLedger(id).pipe(
//       catchError(() => {
//         // Silent fail - just show empty table
//         return of({ data: { history: [], closingBalance: 0 } });
//       }),
//       finalize(() => this.tabStatus.ledger.loading = false)
//     ).subscribe((res: any) => {
//       const data = res.data || {};
//       this.ledgerHistory.set(data.history || []);
//       // Update balance with accurate ledger data
//       if (data.closingBalance !== undefined) {
//         this.closingBalance.set(data.closingBalance);
//       }
//       this.tabStatus.ledger.loaded = true;
//     });
//   }

//   private fetchInvoices(id: string) {
//     this.invoiceService.getInvoicesByCustomer(id).pipe(
//       catchError(() => of({ data: [] })),
//       finalize(() => this.tabStatus.invoices.loading = false)
//     ).subscribe((res: any) => {
//       const list = res.data?.invoices || res.data || [];
//       this.invoices.set(list);
//       this.tabStatus.invoices.loaded = true;
//     });
//   }

//   private fetchPayments(id: string) {
//     this.paymentService.getPaymentsByCustomer(id).pipe(
//       catchError(() => of({ data: [] })),
//       finalize(() => this.tabStatus.payments.loading = false)
//     ).subscribe((res: any) => {
//       const list = res.data?.payments || res.data || [];
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
// }
