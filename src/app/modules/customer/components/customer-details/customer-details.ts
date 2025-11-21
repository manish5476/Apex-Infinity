import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

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

// Services
import { CustomerService } from '../../services/customer-service';
import { InvoiceService } from '../../../invoice/services/invoice-service';
import { PaymentService } from '../../../payment/services/payment-service';
import { FinancialService } from '../../../../core/services/financial.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';

@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    DividerModule,
    AvatarModule,
    TagModule,
    SkeletonModule,
    TabsModule,
    TableModule,
    CardModule,
    TooltipModule
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

      this.common.apiCall(
        forkJoin({
          profile: this.customerService.getCustomerDataWithId(id),
          invoices: this.invoiceService.getInvoicesByCustomer(id),
          payments: this.paymentService.getPaymentsByCustomer(id),
          ledger: this.financialService.getCustomerLedger(id)
        }),
        (res: any) => {
          const profile = res.profile?.data?.data || res.profile?.data || {};
          this.customer.set(profile);

          const invList = res.invoices?.data?.invoices || res.invoices?.data || [];
          this.invoices.set(invList);

          const payList = res.payments?.data?.payments || res.payments?.data || [];
          this.payments.set(payList);

          const ledgerData = res.ledger?.data || {};
          this.ledgerHistory.set(ledgerData.history || []);
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
        // Use invoice number or ID for filename
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

//   // --- State & Data Signals ---
//   loading = signal(true);
  
//   // Primary Data
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

//       // 🚀 ForkJoin: Execute all 4 API calls in parallel
//       this.common.apiCall(
//         forkJoin({
//           profile: this.customerService.getCustomerDataWithId(id),
//           invoices: this.invoiceService.getInvoicesByCustomer(id),
//           payments: this.paymentService.getPaymentsByCustomer(id),
//           ledger: this.financialService.getCustomerLedger(id)
//         }),
//         (res: any) => {
//           // 1. Handle Profile (API structure: data.data)
//           const profile = res.profile?.data?.data || res.profile?.data || {};
//           this.customer.set(profile);

//           // 2. Handle Invoices (API structure: data.invoices array)
//           const invList = res.invoices?.data?.invoices || res.invoices?.data || [];
//           this.invoices.set(invList);

//           // 3. Handle Payments (API structure: data.payments array)
//           const payList = res.payments?.data?.payments || res.payments?.data || [];
//           this.payments.set(payList);

//           // 4. Handle Ledger (API structure: data.history array + closingBalance)
//           const ledgerData = res.ledger?.data || {};
//           this.ledgerHistory.set(ledgerData.history || []);
//           // Use ledger closing balance if available, else fallback to profile's outstanding
//           this.closingBalance.set(ledgerData.closingBalance ?? profile.outstandingBalance ?? 0);

//           this.loading.set(false);
//         },
//         'Fetch Customer Dashboard'
//       );
//     });
//   }

//   // --- UI Helpers ---

//   /**
//    * Returns severity for ledger transaction types (credit = green, debit = red)
//    */
//   getLedgerSeverity(type: string): 'success' | 'danger' | 'info' {
//     return type === 'credit' ? 'success' : 'danger';
//   }

//   /**
//    * Checks if billing and shipping addresses are identical
//    */
//   isSameAddress(): boolean {
//     const c = this.customer();
//     if (!c?.billingAddress || !c?.shippingAddress) return false;
    
//     // Compare properties excluding ID
//     const { _id: bId, ...bill } = c.billingAddress;
//     const { _id: sId, ...ship } = c.shippingAddress;
//     return JSON.stringify(bill) === JSON.stringify(ship);
//   }
// }
