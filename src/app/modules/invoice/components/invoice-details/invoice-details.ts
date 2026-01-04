import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators'; // Import finalize

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';

// Services
import { InvoiceService } from '../../services/invoice-service';
import { EmiService } from '../../../emi/services/emi-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';

@Component({
  selector: 'app-invoice-details',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    ButtonModule, TagModule, ConfirmDialogModule, TooltipModule,
    TableModule, ToastModule, SkeletonModule, DialogModule,
    InputNumberModule, InputTextModule, SelectModule, TextareaModule,
    CheckboxModule
  ],
  providers: [ConfirmationService],
  templateUrl: './invoice-details.html',
  styleUrls: ['./invoice-details.scss'],
})
export class InvoiceDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private invoiceService = inject(InvoiceService);
  private emiService = inject(EmiService);
  private confirmService = inject(ConfirmationService);
  private messageService = inject(AppMessageService);
  public common = inject(CommonMethodService);

  // === Signals ===
  invoice = signal<any | null>(null);
  payments = signal<any[]>([]);
  isLoading = signal(true);
  isProcessing = signal(false);
  existingEmiId = signal<string | null>(null);

  // === Modals ===
  showPaymentModal = signal(false);
  showCancelModal = signal(false);

  // === Forms ===
  paymentForm: FormGroup;
  cancelForm: FormGroup;

  // === Constants ===
  paymentMethods = [
    { label: 'Cash', value: 'cash' },
    { label: 'Bank Transfer', value: 'bank' },
    { label: 'UPI', value: 'upi' },
    { label: 'Credit Card', value: 'card' },
    { label: 'Cheque', value: 'cheque' },
    { label: 'Other', value: 'other' }
  ];

  constructor() {
    this.paymentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      paymentMethod: ['cash', Validators.required],
      referenceNumber: [''],
      notes: ['']
    });

    this.cancelForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(5)]],
      restock: [true]
    });
  }

  ngOnInit(): void {
    this.loadInvoiceData();
  }

  private loadInvoiceData(): void {
    this.route.paramMap.subscribe(params => {
      const invoiceId = params.get('id');
      if (!invoiceId) {
        this.router.navigate(['/invoices']);
        return;
      }

      this.isLoading.set(true);

      // 1. Get Invoice Details
      this.common.apiCall(
        this.invoiceService.getInvoiceById(invoiceId),
        (res: any) => {
          // Robust data extraction
          const data = res.data?.data || res.data?.invoice || res.data;
          this.invoice.set(data);
          
          // Setup dependent data
          this.checkEmiStatus(invoiceId);
          this.loadPaymentHistory(invoiceId);
          
          // Pre-fill payment form with balance
          this.paymentForm.patchValue({ amount: data.balanceAmount });
          
          this.isLoading.set(false);
        },
        'Fetch Invoice'
      );
    });
  }

  private loadPaymentHistory(id: string): void {
    this.invoiceService.getInvoicePayments(id).subscribe({
      next: (res: any) => {
        this.payments.set(res.data?.payments || res.data || []);
      }
    });
  }

  private checkEmiStatus(invoiceId: string) {
    this.emiService.getEmiByInvoice(invoiceId).subscribe({
      next: (res: any) => {
        if (res.data?.emi) {
          this.existingEmiId.set(res.data.emi._id);
        }
      },
      error: () => this.existingEmiId.set(null)
    });
  }

  // === Actions: Payment ===
  openPaymentModal(): void {
    this.showPaymentModal.set(true);
    this.paymentForm.patchValue({ 
      amount: this.invoice().balanceAmount,
      paymentMethod: 'cash',
      notes: ''
    });
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) return;

    this.isProcessing.set(true);
    const payload = this.paymentForm.value;
    const id = this.invoice()._id;

    this.common.apiCall(
      this.invoiceService.addPayment(id, payload).pipe(
        finalize(() => this.isProcessing.set(false))
      ),
      () => {
        this.messageService.showSuccess('Payment Recorded', 'Balance updated successfully.');
        this.showPaymentModal.set(false);
        // Refresh data to reflect new status
        this.loadInvoiceData(); 
      },
      'Add Payment'
    );
  }

  // === Actions: Cancel ===
  openCancelModal(): void {
    this.showCancelModal.set(true);
    this.cancelForm.reset({ restock: true });
  }

  submitCancel(): void {
    if (this.cancelForm.invalid) return;

    this.isProcessing.set(true);
    const { reason, restock } = this.cancelForm.value;
    const id = this.invoice()._id;

    this.common.apiCall(
      this.invoiceService.cancelInvoice(id, reason, restock).pipe(
        finalize(() => this.isProcessing.set(false))
      ),
      () => {
        this.messageService.showSuccess('Cancelled', 'Invoice cancelled and stock restored.');
        this.showCancelModal.set(false);
        this.loadInvoiceData();
      },
      'Cancel Invoice'
    );
  }

  // === Actions: Standard ===
  onDownload(): void {
    const id = this.invoice()?._id;
    if (!id) return;
    this.isProcessing.set(true);
    this.invoiceService.downloadInvoicePDF(id).subscribe({
      next: (blob) => {
        this.common.downloadBlob(blob, `INV-${this.invoice().invoiceNumber}.pdf`);
        this.isProcessing.set(false);
      },
      error: () => {
        this.messageService.showError('Download Failed', 'Could not generate PDF.');
        this.isProcessing.set(false);
      }
    });
  }

  onEmail(): void {
    const id = this.invoice()?._id;
    if (!id) return;
    this.isProcessing.set(true);
    this.common.apiCall(
      this.invoiceService.emailInvoice(id).pipe(
        finalize(() => this.isProcessing.set(false))
      ),
      () => {
        this.messageService.showSuccess('Sent', 'Invoice emailed to customer.');
      },
      'Email Invoice'
    );
  }

  // Helper for Status Severity
  getPaymentSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'partial': return 'warn';
      case 'unpaid': return 'danger';
      default: return 'info';
    }
  }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ConfirmationService } from 'primeng/api';
// import { TooltipModule } from 'primeng/tooltip';
// import { TableModule } from 'primeng/table';
// import { ToastModule } from 'primeng/toast';
// import { SkeletonModule } from 'primeng/skeleton';

// // Services (Your existing services)
// import { InvoiceService } from '../../services/invoice-service';
// import { EmiService } from '../../../emi/services/emi-service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { CommonMethodService } from '../../../../core/utils/common-method.service';

// @Component({
//   selector: 'app-invoice-details',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ButtonModule,
//     TagModule,
//     ConfirmDialogModule,
//     TooltipModule,
//     TableModule,
//     ToastModule,
//     SkeletonModule
//   ],
//   providers: [ConfirmationService], 
//   templateUrl: './invoice-details.html',
//   styleUrls: ['./invoice-details.scss'],
// })
// export class InvoiceDetailsComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private invoiceService = inject(InvoiceService);
//   private emiService = inject(EmiService);
//   private confirmService = inject(ConfirmationService);
//   private messageService = inject(AppMessageService);
//   public common = inject(CommonMethodService);

//   // === Signals ===
//   invoice = signal<any | null>(null);
//   isLoading = signal(true); 
//   isProcessing = signal(false);
//   existingEmiId = signal<string | null>(null);

//   ngOnInit(): void {
//     this.loadInvoiceData();
//   }

//   private loadInvoiceData(): void {
//     this.route.paramMap.subscribe(params => {
//       const invoiceId = params.get('id');

//       if (!invoiceId) {
//         this.messageService.showError('Navigation Error', 'No invoice ID found');
//         this.router.navigate(['/invoices']);
//         return;
//       }

//       this.isLoading.set(true); // Start loading

//       this.common.apiCall(
//         this.invoiceService.getInvoiceById(invoiceId),
//         (response: any) => {
//           if (response?.data) {
//             // Handle different API structures safely
//             const data = response.data.invoice || response.data.data || response.data;
//             this.invoice.set(data);
//             this.checkEmiStatus(invoiceId);
//           }
//           this.isLoading.set(false); // Stop loading
//         },
//         'Fetch Invoice'
//       );
//     });
//   }

//   private checkEmiStatus(invoiceId: string) {
//     this.emiService.getEmiByInvoice(invoiceId).subscribe({
//       next: (res: any) => {
//         if (res.data && res.data.emi) {
//           this.existingEmiId.set(res.data.emi._id);
//         }
//       },
//       error: () => this.existingEmiId.set(null)
//     });
//   }

//   // === Actions ===
//   onCreateEmi(): void {
//     const invoiceId = this.invoice()?._id;
//     if (!invoiceId) return;
//     this.router.navigate(['/emis/create'], { queryParams: { invoiceId } });
//   }
  
//   onEmail(): void {
//     const id = this.invoice()?._id;
//     if (!id) return;
    
//     this.isProcessing.set(true); // Show spinner
//     this.common.apiCall(
//         this.invoiceService.emailInvoice(id),
//         () => {
//             this.messageService.showSuccess('Email Sent', 'Invoice emailed successfully.');
//             this.isProcessing.set(false);
//         },
//         'Email Invoice'
//     );
//   }

//   onDownload(): void {
//     const id = this.invoice()?._id;
//     if (!id) return;

//     this.isProcessing.set(true); 
//     this.common.apiCall(
//       this.invoiceService.downloadInvoicePDF(id),
//       (res: any) => {
//         if (!res || !res.body) {
//           this.messageService.showError('Download Failed', 'File empty.');
//           this.isProcessing.set(false);
//           return;
//         }
//         this.common.downloadBlob(res.body, `invoice-${this.invoice()?.invoiceNumber}.pdf`);
//         this.messageService.showSuccess('Success', 'Invoice downloaded.');
//         this.isProcessing.set(false);
//       },
//       'Download Invoice'
//     );
//   }

//   onDelete(): void {
//     this.confirmService.confirm({
//       message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
//       header: 'Delete Confirmation',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger p-button-text',
//       rejectButtonStyleClass: 'p-button-text',
//       accept: () => {
//         const id = this.invoice()?._id;
//         if (!id) return;

//         this.common.apiCall(
//             this.invoiceService.deleteInvoice(id),
//             () => {
//                 this.messageService.showSuccess('Deleted', 'Invoice removed.');
//                 this.router.navigate(['/invoices']);
//             },
//             'Delete Invoice'
//         );
//       }
//     });
//   }
// }