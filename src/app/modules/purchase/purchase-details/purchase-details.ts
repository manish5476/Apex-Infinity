import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';

// Services
import { AppMessageService } from '../../../core/services/message.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { PurchaseService } from '../purchase.service';
import { Toast } from "primeng/toast";

@Component({
  selector: 'app-purchase-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    CurrencyPipe,
    TitleCasePipe,
    // PrimeNG UI
    ButtonModule,
    TagModule,
    TableModule,
    DividerModule,
    TooltipModule,
    CardModule,
    DialogModule,
    InputNumberModule,
    DatePicker,
    Select,
    InputTextModule,
    Toast
],
  templateUrl: './purchase-details.html',
  styleUrl: './purchase-details.scss',
})
export class PurchaseDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private purchaseService = inject(PurchaseService);
  private messageService = inject(AppMessageService);
  public common = inject(CommonMethodService);

  // Signals
  purchase = signal<any>(null);
  isLoading = signal<boolean>(true);
  
  // Payment Dialog State
  showPaymentDialog = signal<boolean>(false);
  isSubmittingPayment = signal<boolean>(false);

  paymentForm: FormGroup = this.fb.group({
    amount: [null, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['cash', Validators.required],
    date: [new Date(), Validators.required],
    reference: [''],
    notes: ['']
  });

  paymentMethods = [
    { label: 'Cash', value: 'cash' },
    { label: 'Bank Transfer', value: 'bank' }, // Mapped to 'bank_transfer' in backend if needed
    { label: 'UPI', value: 'upi' },
    { label: 'Card', value: 'card' },
    { label: 'Cheque', value: 'cheque' },
    { label: 'Other', value: 'other' }
  ];

  purchaseId: string | null = null;

  ngOnInit() {
    this.purchaseId = this.route.snapshot.paramMap.get('id');
    if (this.purchaseId) {
      this.loadPurchaseDetails(this.purchaseId);
    } else {
      this.router.navigate(['/purchase']);
    }
  }

  loadPurchaseDetails(id: string) {
    this.isLoading.set(true);
    this.purchaseService.getPurchaseById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: any) => {
          // Access nested data.data structure from your JSON
          if (res && res.data && res.data.data) {
            this.purchase.set(res.data.data);
          } else if (res && res.data) {
             // Fallback if structure varies
             this.purchase.set(res.data);
          }
        },
        error: () => {
          this.messageService.showError('Error', 'Could not load purchase details.');
          this.router.navigate(['/purchase']);
        }
      });
  }

  // --- Payment Actions ---

  openPaymentModal() {
    const p = this.purchase();
    if (!p) return;

    // Reset form and set default amount to remaining balance. 
    // If balanceAmount is missing in JSON, calculate it or default to 0.
    const balance = p.balanceAmount !== undefined ? p.balanceAmount : (p.grandTotal - (p.paidAmount || 0));

    this.paymentForm.reset({
      amount: balance > 0 ? balance : 0,
      paymentMethod: 'cash',
      date: new Date(),
      reference: '',
      notes: ''
    });
    
    this.showPaymentDialog.set(true);
  }

  submitPayment() {
    if (this.paymentForm.invalid || !this.purchaseId) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const p = this.purchase();
    const formVal = this.paymentForm.value;
    const balance = p.balanceAmount !== undefined ? p.balanceAmount : (p.grandTotal - (p.paidAmount || 0));

    if (formVal.amount > balance) {
      this.messageService.showError('Invalid Amount', `Payment cannot exceed balance due (${balance})`);
      return;
    }

    this.isSubmittingPayment.set(true);

    const payload = {
      amount: formVal.amount,
      paymentMethod: formVal.paymentMethod,
      date: formVal.date,
      reference: formVal.reference,
      notes: formVal.notes
    };

    this.purchaseService.recordPayment(this.purchaseId, payload)
      .pipe(finalize(() => this.isSubmittingPayment.set(false)))
      .subscribe({
        next: (res) => {
          this.messageService.showSuccess('Success', 'Payment recorded successfully');
          this.showPaymentDialog.set(false);
          this.loadPurchaseDetails(this.purchaseId!); // Refresh data
        },
        error: (err) => {
          this.messageService.showError('Failed', err.error?.message || 'Could not record payment');
        }
      });
  }

  // --- Helpers ---
  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (status?.toLowerCase()) {
      case 'received': return 'success';
      case 'approved': return 'success';
      case 'draft': return 'secondary';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  }

  getPaymentSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'partial': return 'warn';
      case 'unpaid': return 'danger';
      default: return 'info';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  }

  downloadAttachment(url: string) {
    if(url) window.open(url, '_blank');
  }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
// import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { finalize } from 'rxjs/operators';

// // PrimeNG Imports
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { TableModule } from 'primeng/table';
// import { DividerModule } from 'primeng/divider';
// import { TooltipModule } from 'primeng/tooltip';
// import { CardModule } from 'primeng/card';
// import { DialogModule } from 'primeng/dialog';
// import { InputNumberModule } from 'primeng/inputnumber';

// import { InputTextModule } from 'primeng/inputtext';
// import { DatePicker } from 'primeng/datepicker';
// import { Select } from 'primeng/select';
// import { AppMessageService } from '../../../core/services/message.service';
// import { CommonMethodService } from '../../../core/utils/common-method.service';
// import { PurchaseService } from '../purchase.service';
// @Component({
//   selector: 'app-purchase-details',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterLink,
//     ReactiveFormsModule,
//     CurrencyPipe, 
//     TitleCasePipe,
//     // PrimeNG UI
//     ButtonModule,
//     TagModule,
//     TableModule,
//     DividerModule,
//     TooltipModule,
//     CardModule,
//     DialogModule,
//     InputNumberModule,
//     DatePicker,
//     Select,
//     InputTextModule,
//   ],
//   templateUrl: './purchase-details.html',
//   styleUrl: './purchase-details.scss',
// })
// export class PurchaseDetailsComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private fb = inject(FormBuilder);
//   private purchaseService = inject(PurchaseService);
//   private messageService = inject(AppMessageService);
//   public common = inject(CommonMethodService);

//   // Signals
//   purchase = signal<any>(null);
//   isLoading = signal<boolean>(true);
  
//   // Payment Dialog State
//   showPaymentDialog = signal<boolean>(false);
//   isSubmittingPayment = signal<boolean>(false);

//   paymentForm: FormGroup = this.fb.group({
//     amount: [null, [Validators.required, Validators.min(0.01)]],
//     paymentMethod: ['cash', Validators.required],
//     date: [new Date(), Validators.required],
//     reference: [''],
//     notes: ['']
//   });

//   paymentMethods = [
//     { label: 'Cash', value: 'cash' },
//     { label: 'Bank Transfer', value: 'bank' },
//     { label: 'UPI', value: 'upi' },
//     { label: 'Card', value: 'card' },
//     { label: 'Cheque', value: 'cheque' },
//     { label: 'Other', value: 'other' }
//   ];

//   purchaseId: string | null = null;

//   ngOnInit() {
//     this.purchaseId = this.route.snapshot.paramMap.get('id');
//     if (this.purchaseId) {
//       this.loadPurchaseDetails(this.purchaseId);
//     } else {
//       this.router.navigate(['/purchase']);
//     }
//   }

//   loadPurchaseDetails(id: string) {
//     this.isLoading.set(true);
//     this.purchaseService.getPurchaseById(id)
//       .pipe(finalize(() => this.isLoading.set(false)))
//       .subscribe({
//         next: (res: any) => {
//           if (res && res.data.data) {
//             this.purchase.set(res.data.data);
//           }
//         },
//         error: () => {
//           this.messageService.showError('Error', 'Could not load purchase details.');
//           this.router.navigate(['/purchase']);
//         }
//       });
//   }

//   // --- Payment Actions ---

//   openPaymentDialog() {
//     const p = this.purchase();
//     if (!p) return;

//     // Reset form and set default amount to remaining balance
//     this.paymentForm.reset({
//       amount: p.balanceAmount > 0 ? p.balanceAmount : 0,
//       paymentMethod: 'cash',
//       date: new Date(),
//       reference: '',
//       notes: ''
//     });
    
//     this.showPaymentDialog.set(true);
//   }

//   submitPayment() {
//     if (this.paymentForm.invalid || !this.purchaseId) {
//       this.paymentForm.markAllAsTouched();
//       return;
//     }

//     const p = this.purchase();
//     const formVal = this.paymentForm.value;

//     if (formVal.amount > p.balanceAmount) {
//       this.messageService.showError('Invalid Amount', `Payment cannot exceed balance due (${p.balanceAmount})`);
//       return;
//     }

//     this.isSubmittingPayment.set(true);

//     const payload = {
//       amount: formVal.amount,
//       paymentMethod: formVal.paymentMethod,
//       date: formVal.date,
//       reference: formVal.reference,
//       notes: formVal.notes
//     };

//     this.purchaseService.recordPayment(this.purchaseId, payload)
//       .pipe(finalize(() => this.isSubmittingPayment.set(false)))
//       .subscribe({
//         next: (res) => {
//           this.messageService.showSuccess('Success', 'Payment recorded successfully');
//           this.showPaymentDialog.set(false);
//           this.loadPurchaseDetails(this.purchaseId!); // Refresh data
//         },
//         error: (err) => {
//           this.messageService.showError('Failed', err.error?.message || 'Could not record payment');
//         }
//       });
//   }

//   // --- Helpers ---
//   getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
//     switch (status) {
//       case 'received': return 'success';
//       case 'approved': return 'success';
//       case 'draft': return 'secondary';
//       case 'cancelled': return 'danger';
//       default: return 'info';
//     }
//   }

//   getPaymentSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
//     switch (status) {
//       case 'paid': return 'success';
//       case 'partial': return 'warn';
//       case 'unpaid': return 'danger';
//       default: return 'info';
//     }
//   }

//   formatDate(dateStr: string): string {
//     if (!dateStr) return 'N/A';
//     return new Date(dateStr).toLocaleDateString('en-IN', { 
//       day: 'numeric', month: 'short', year: 'numeric' 
//     });
//   }

//   downloadAttachment(url: string) {
//     window.open(url, '_blank');
//   }
// }