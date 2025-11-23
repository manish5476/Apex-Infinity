import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs'; // Import 'of'
import { catchError } from 'rxjs/operators'; // Import 'catchError'

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';

// Services
import { CustomerService } from '../../services/customer-service';
import { InvoiceService } from '../../../invoice/services/invoice-service';
import { PaymentService } from '../../../payment/services/payment-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { CustomerTransactions } from '../../../transactions/customer-transactions/customer-transactions';
import { ImageViewerDirective } from '../../../shared/directives/image-viewer.directive';
import { FinancialService } from '../../../Ledger/financial.service';
@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [
    CommonModule,ImageViewerDirective,
    RouterModule,
    ButtonModule,
    DividerModule,
    AvatarModule,
    TagModule,
    SkeletonModule,
    TabsModule,
    TableModule,
    CardModule,
    TooltipModule,
    DialogModule,
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

  // --- State ---
  loading = signal(true);
  showTransactionsDialog = false;
  
  // Data Signals
  customer = signal<any | null>(null);
  invoices = signal<any[]>([]);
  payments = signal<any[]>([]);
  ledgerHistory = signal<any[]>([]);
  
  // Derived Stats
  closingBalance = signal(0);
  totalInvoiced = computed(() => this.invoices().reduce((acc, inv) => acc + (inv.grandTotal || 0), 0));
  totalPaid = computed(() => this.payments().reduce((acc, pay) => acc + (pay.amount || 0), 0));

  ngOnInit(): void {
    this.loadCustomerDashboard();
  }

  private loadCustomerDashboard(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.messageService.showError('Navigation Error', 'No customer ID provided');
        this.router.navigate(['/customer']);
        return;
      }

      this.loading.set(true);

      // Use catchError on individual streams so one failure doesn't break the whole page
      this.common.apiCall(
        forkJoin({
          // Profile is critical. If this fails, we let it bubble up (page error).
          profile: this.customerService.getCustomerDataWithId(id),

          // Invoices: If fails, return empty list
          invoices: this.invoiceService.getInvoicesByCustomer(id).pipe(
            catchError(() => of({ data: [] }))
          ),

          // Payments: If fails, return empty list
          payments: this.paymentService.getPaymentsByCustomer(id).pipe(
            catchError(() => of({ data: [] }))
          ),

          // Ledger: If fails, return safe default object
          ledger: this.financialService.getCustomerLedger(id).pipe(
            catchError((err) => {
              console.warn('Ledger API failed, showing dashboard with partial data.', err);
              // Return a structure that matches a successful response to prevent null checks later
              return of({ data: { history: [], closingBalance: 0 } });
            })
          )
        }),
        (res: any) => {
          // 1. Set Profile
          const profile = res.profile?.data?.data || res.profile?.data || {};
          this.customer.set(profile);

          // 2. Set Invoices (Safe fallback handled in pipe above)
          const invList = res.invoices?.data?.invoices || res.invoices?.data || [];
          this.invoices.set(invList);

          // 3. Set Payments (Safe fallback handled in pipe above)
          const payList = res.payments?.data?.payments || res.payments?.data || [];
          this.payments.set(payList);

          // 4. Set Ledger (Safe fallback handled in pipe above)
          // Even if API failed, res.ledger will be { data: { history: [], closingBalance: 0 } }
          const ledgerData = res.ledger?.data || {};
          this.ledgerHistory.set(ledgerData.history || []);
          
          // Use ledger balance if available, otherwise fall back to profile balance
          this.closingBalance.set(ledgerData.closingBalance ?? profile.outstandingBalance ?? 0);

          this.loading.set(false);
        },
        'Fetch Customer Dashboard'
      );
    });
  }

  // --- Actions (Downloads) ---

  downloadInvoice(inv: any): void {
    if (!inv?._id) return;
    
    this.common.apiCall(
      this.invoiceService.downloadInvoice(inv._id),
      (res: any) => {
        if (!res || !res.body) {
          this.messageService.showError('Download Failed', 'File empty.');
          return;
        }
        const filename = `invoice-${inv.invoiceNumber || inv._id}.pdf`;
        this.common.downloadBlob(res.body, filename);
        this.messageService.showSuccess('Success', 'Invoice downloaded.');
      },
      'Download Invoice'
    );
  }

  downloadReceipt(pay: any): void {
    if (!pay?._id) return;

    this.common.apiCall(
      this.paymentService.downloadReceipt(pay._id),
      (res: any) => {
        if (!res || !res.body) {
           this.messageService.showError('Download Failed', 'File empty.');
           return;
        }
        const ref = pay.referenceNumber || pay.transactionId || 'receipt';
        this.common.downloadBlob(res.body, `payment-${ref}.pdf`);
        this.messageService.showSuccess('Success', 'Receipt downloaded.');
      },
      'Download Receipt'
    );
  }

  // --- UI Helpers ---
  getLedgerSeverity(type: string): 'success' | 'danger' | 'info' {
    return type === 'credit' ? 'success' : 'danger';
  }

  isSameAddress(): boolean {
    const c = this.customer();
    if (!c?.billingAddress || !c?.shippingAddress) return false;
    const { _id: bId, ...bill } = c.billingAddress;
    const { _id: sId, ...ship } = c.shippingAddress;
    return JSON.stringify(bill) === JSON.stringify(ship);
  }

  /**
   * HANDLER: Triggered when user selects a file from the hidden input
   */
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];

    if (file) {
      // 1. Basic Validation (Optional: check size/type)
      if (!file.type.startsWith('image/')) {
        this.messageService.showError('Invalid File', 'Please select an image file.');
        return;
      }

      // 2. Prepare FormData
      const formData = new FormData();
      // IMPORTANT: 'photo' must match the field name in your Node router (e.g., upload.single('photo'))
      formData.append('photo', file); 

      this.uploadPhoto(formData);
    }
  }

  /**
   * API CALL: Upload the image
   */
  private uploadPhoto(formData: FormData): void {
    const customerId = this.customer()?._id;
    if (!customerId) return;

    this.loading.set(true);

    this.common.apiCall(
      this.customerService.uploadProfileImage(formData, customerId),
      (res: any) => {
        const updatedCustomer = res.data?.customer;
        if (updatedCustomer) {
          // Update the signal locally to reflect changes immediately
          this.customer.update(current => ({
            ...current,
            avatar: updatedCustomer.photo // assuming backend maps 'photo' to the URL
          }));
          
              this.loadCustomerDashboard();
          this.messageService.showSuccess('Success', 'Profile photo updated successfully');
        }
        this.loading.set(false);
      },
      'Upload Profile Photo'
    );
  }
}

// import { Component, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule, Router } from '@angular/router';
// import { forkJoin } from 'rxjs';

// // PrimeNG Imports
// import { ButtonModule } from 'primeng/button';
// import { DividerModule } from 'primeng/divider';
// import { AvatarModule } from 'primeng/avatar';
// import { TagModule } from 'primeng/tag';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TableModule } from 'primeng/table';
// import { CardModule } from 'primeng/card';
// import { TooltipModule } from 'primeng/tooltip';
// import { TabsModule } from 'primeng/tabs';

// // Services
// import { CustomerService } from '../../services/customer-service';
// import { InvoiceService } from '../../../invoice/services/invoice-service';
// import { PaymentService } from '../../../payment/services/payment-service';
// import { FinancialService } from '../../../../core/services/financial.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { CommonMethodService } from '../../../../core/utils/common-method.service';

// @Component({
//   selector: 'app-customer-details',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ButtonModule,
//     DividerModule,
//     AvatarModule,
//     TagModule,
//     SkeletonModule,
//     TabsModule,
//     TableModule,
//     CardModule,
//     TooltipModule
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

//   // --- State ---
//   loading = signal(true);
  
//   // Data Signals
//   customer = signal<any | null>(null);
//   invoices = signal<any[]>([]);
//   payments = signal<any[]>([]);
//   ledgerHistory = signal<any[]>([]);
  
//   // Derived Stats
//   closingBalance = signal(0);
//   totalInvoiced = computed(() => this.invoices().reduce((acc, inv) => acc + (inv.grandTotal || 0), 0));
//   totalPaid = computed(() => this.payments().reduce((acc, pay) => acc + (pay.amount || 0), 0));

//   ngOnInit(): void {
//     this.loadCustomerDashboard();
//   }

//   private loadCustomerDashboard(): void {
//     this.route.paramMap.subscribe(params => {
//       const id = params.get('id');
//       if (!id) {
//         this.messageService.showError('Navigation Error', 'No customer ID provided');
//         this.router.navigate(['/customer']);
//         return;
//       }

//       this.loading.set(true);

//       this.common.apiCall(
//         forkJoin({
//           profile: this.customerService.getCustomerDataWithId(id),
//           invoices: this.invoiceService.getInvoicesByCustomer(id),
//           payments: this.paymentService.getPaymentsByCustomer(id),
//           ledger: this.financialService.getCustomerLedger(id)
//         }),
//         (res: any) => {
//           const profile = res.profile?.data?.data || res.profile?.data || {};
//           this.customer.set(profile);

//           const invList = res.invoices?.data?.invoices || res.invoices?.data || [];
//           this.invoices.set(invList);

//           const payList = res.payments?.data?.payments || res.payments?.data || [];
//           this.payments.set(payList);

//           const ledgerData = res.ledger?.data || {};
//           this.ledgerHistory.set(ledgerData.history || []);
//           this.closingBalance.set(ledgerData.closingBalance ?? profile.outstandingBalance ?? 0);

//           this.loading.set(false);
//         },
//         'Fetch Customer Dashboard'
//       );
//     });
//   }

//   // --- Actions (Downloads) ---

//   downloadInvoice(inv: any): void {
//     if (!inv?._id) return;
    
//     this.common.apiCall(
//       this.invoiceService.downloadInvoice(inv._id),
//       (res: any) => {
//         if (!res || !res.body) {
//           this.messageService.showError('Download Failed', 'File empty.');
//           return;
//         }
//         // Use invoice number or ID for filename
//         const filename = `invoice-${inv.invoiceNumber || inv._id}.pdf`;
//         this.common.downloadBlob(res.body, filename);
//         this.messageService.showSuccess('Success', 'Invoice downloaded.');
//       },
//       'Download Invoice'
//     );
//   }

//   downloadReceipt(pay: any): void {
//     if (!pay?._id) return;

//     this.common.apiCall(
//       this.paymentService.downloadReceipt(pay._id),
//       (res: any) => {
//         if (!res || !res.body) {
//            this.messageService.showError('Download Failed', 'File empty.');
//            return;
//         }
//         const ref = pay.referenceNumber || pay.transactionId || 'receipt';
//         this.common.downloadBlob(res.body, `payment-${ref}.pdf`);
//         this.messageService.showSuccess('Success', 'Receipt downloaded.');
//       },
//       'Download Receipt'
//     );
//   }

//   // --- UI Helpers ---
//   getLedgerSeverity(type: string): 'success' | 'danger' | 'info' {
//     return type === 'credit' ? 'success' : 'danger';
//   }

//   isSameAddress(): boolean {
//     const c = this.customer();
//     if (!c?.billingAddress || !c?.shippingAddress) return false;
//     const { _id: bId, ...bill } = c.billingAddress;
//     const { _id: sId, ...ship } = c.shippingAddress;
//     return JSON.stringify(bill) === JSON.stringify(ship);
//   }
// }

// // import { Component, OnInit, inject, signal, computed } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ActivatedRoute, RouterModule, Router } from '@angular/router';
// // import { forkJoin } from 'rxjs';

// // // PrimeNG Imports
// // import { ButtonModule } from 'primeng/button';
// // import { DividerModule } from 'primeng/divider';
// // import { AvatarModule } from 'primeng/avatar';
// // import { TagModule } from 'primeng/tag';
// // import { SkeletonModule } from 'primeng/skeleton';
// // import { TableModule } from 'primeng/table';
// // import { CardModule } from 'primeng/card';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { TabsModule } from 'primeng/tabs';
// // // Services
// // import { CustomerService } from '../../services/customer-service';
// // import { InvoiceService } from '../../../invoice/services/invoice-service';
// // import { PaymentService } from '../../../payment/services/payment-service';
// // import { FinancialService } from '../../../../core/services/financial.service';
// // import { AppMessageService } from '../../../../core/services/message.service';
// // import { CommonMethodService } from '../../../../core/utils/common-method.service';

// // @Component({
// //   selector: 'app-customer-details',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     RouterModule,
// //     ButtonModule,
// //     DividerModule,
// //     AvatarModule,
// //     TagModule,
// //     SkeletonModule,
// //     TabsModule,
// //     TableModule,
// //     CardModule,
// //     TooltipModule
// //   ],
// //   providers: [CustomerService, InvoiceService, PaymentService, FinancialService],
// //   templateUrl: './customer-details.html',
// //   styleUrl: './customer-details.scss',
// // })
// // export class CustomerDetails implements OnInit {
// //   // --- Dependencies ---
// //   private route = inject(ActivatedRoute);
// //   private router = inject(Router);
// //   private customerService = inject(CustomerService);
// //   private invoiceService = inject(InvoiceService);
// //   private paymentService = inject(PaymentService);
// //   private financialService = inject(FinancialService);
// //   private messageService = inject(AppMessageService);
  
// //   public common = inject(CommonMethodService);

// //   // --- State & Data Signals ---
// //   loading = signal(true);
  
// //   // Primary Data
// //   customer = signal<any | null>(null);
// //   invoices = signal<any[]>([]);
// //   payments = signal<any[]>([]);
// //   ledgerHistory = signal<any[]>([]);
  
// //   // Derived Stats
// //   closingBalance = signal(0);
// //   totalInvoiced = computed(() => this.invoices().reduce((acc, inv) => acc + (inv.grandTotal || 0), 0));
// //   totalPaid = computed(() => this.payments().reduce((acc, pay) => acc + (pay.amount || 0), 0));

// //   ngOnInit(): void {
// //     this.loadCustomerDashboard();
// //   }

// //   private loadCustomerDashboard(): void {
// //     this.route.paramMap.subscribe(params => {
// //       const id = params.get('id');
// //       if (!id) {
// //         this.messageService.showError('Navigation Error', 'No customer ID provided');
// //         this.router.navigate(['/customer']);
// //         return;
// //       }

// //       this.loading.set(true);

// //       // 🚀 ForkJoin: Execute all 4 API calls in parallel
// //       this.common.apiCall(
// //         forkJoin({
// //           profile: this.customerService.getCustomerDataWithId(id),
// //           invoices: this.invoiceService.getInvoicesByCustomer(id),
// //           payments: this.paymentService.getPaymentsByCustomer(id),
// //           ledger: this.financialService.getCustomerLedger(id)
// //         }),
// //         (res: any) => {
// //           // 1. Handle Profile (API structure: data.data)
// //           const profile = res.profile?.data?.data || res.profile?.data || {};
// //           this.customer.set(profile);

// //           // 2. Handle Invoices (API structure: data.invoices array)
// //           const invList = res.invoices?.data?.invoices || res.invoices?.data || [];
// //           this.invoices.set(invList);

// //           // 3. Handle Payments (API structure: data.payments array)
// //           const payList = res.payments?.data?.payments || res.payments?.data || [];
// //           this.payments.set(payList);

// //           // 4. Handle Ledger (API structure: data.history array + closingBalance)
// //           const ledgerData = res.ledger?.data || {};
// //           this.ledgerHistory.set(ledgerData.history || []);
// //           // Use ledger closing balance if available, else fallback to profile's outstanding
// //           this.closingBalance.set(ledgerData.closingBalance ?? profile.outstandingBalance ?? 0);

// //           this.loading.set(false);
// //         },
// //         'Fetch Customer Dashboard'
// //       );
// //     });
// //   }

// //   // --- UI Helpers ---

// //   /**
// //    * Returns severity for ledger transaction types (credit = green, debit = red)
// //    */
// //   getLedgerSeverity(type: string): 'success' | 'danger' | 'info' {
// //     return type === 'credit' ? 'success' : 'danger';
// //   }

// //   /**
// //    * Checks if billing and shipping addresses are identical
// //    */
// //   isSameAddress(): boolean {
// //     const c = this.customer();
// //     if (!c?.billingAddress || !c?.shippingAddress) return false;
    
// //     // Compare properties excluding ID
// //     const { _id: bId, ...bill } = c.billingAddress;
// //     const { _id: sId, ...ship } = c.shippingAddress;
// //     return JSON.stringify(bill) === JSON.stringify(ship);
// //   }
// // }
