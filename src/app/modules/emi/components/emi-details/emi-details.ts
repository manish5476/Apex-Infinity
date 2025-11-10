// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-emi-details',
//   imports: [],
  // templateUrl: './emi-details.html',
  // styleUrl: './emi-details.scss',
// })
// export class EmiDetails {

// }
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
// import { EmiService } from '../../services/emi.service';
// import { LoadingService } from '../../../../../core/services/loading.service';
// import { AppMessageService } from '../../../../../core/services/message.service';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { LoadingService } from '../../../../core/services/loading.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { EmiService } from '../../services/emi-service';

@Component({
  selector: 'app-emi-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    DividerModule,
    TagModule,
    TableModule,
    TooltipModule,
    DialogModule,
    InputNumberModule,
    SelectModule
  ],
  templateUrl: './emi-details.html',
  styleUrl: './emi-details.scss',
})
export class EmiDetailsComponent implements OnInit {
  // --- Injected Services ---
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private emiService = inject(EmiService);
  private loadingService = inject(LoadingService);
  private messageService = inject(AppMessageService);
  private fb = inject(FormBuilder);

  // --- State ---
  emiPlan = signal<any | null>(null);
  invoiceId: string | null = null;
  
  // --- Payment Modal ---
  displayPaymentModal = signal(false);
  selectedInstallment = signal<any | null>(null);
  paymentForm!: FormGroup;
  isSubmittingPayment = signal(false);
  
  paymentMethodOptions = [
    { label: 'Cash', value: 'cash' },
    { label: 'Bank', value: 'bank' },
    { label: 'UPI', value: 'upi' },
    { label: 'Other', value: 'other' },
  ];

  ngOnInit(): void {
    this.buildPaymentForm();
    this.loadEmiData();
  }

  private loadEmiData(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.invoiceId = params.get('invoiceId');
        if (!this.invoiceId) {
          this.messageService.showError('Error', 'No invoice ID provided');
          return of(null);
        }
        this.loadingService.show();
        return this.emiService.getEmiByInvoice(this.invoiceId).pipe(
          finalize(() => this.loadingService.hide())
        );
      })
    ).subscribe({
      next: (response: any) => {
        if (response && response.data && response.data.data) {
          this.emiPlan.set(response.data.data);
        } else if (response !== null) {
          // No EMI plan found for this invoice
          this.messageService.showInfo('Not Found', 'No EMI plan has been created for this invoice yet.');
          this.emiPlan.set(null);
        }
      },
      error: (err) => {
        this.emiPlan.set(null);
        this.messageService.showError('Error', err.error?.message || 'Could not fetch EMI plan');
      }
    });
  }

  private buildPaymentForm(): void {
    this.paymentForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['cash', Validators.required]
    });
  }

  // --- Payment Modal Actions ---

  onPayInstallmentClick(installment: any): void {
    this.selectedInstallment.set(installment);
    // Set default payment amount to remaining balance
    const remaining = installment.totalAmount - installment.paidAmount;
    this.paymentForm.patchValue({
      amount: remaining > 0 ? remaining : null
    });
    this.displayPaymentModal.set(true);
  }
  
  onClosePaymentModal(): void {
    this.displayPaymentModal.set(false);
    this.selectedInstallment.set(null);
    this.paymentForm.reset();
  }

  onSubmitPayment(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    
    this.isSubmittingPayment.set(true);
    const formValue = this.paymentForm.getRawValue();
    
    // Payload as guessed from your API
    const payload = {
      emiId: this.emiPlan()._id,
      installmentNumber: this.selectedInstallment().installmentNumber,
      amount: formValue.amount,
      paymentMethod: formValue.paymentMethod,
    };

    this.emiService.payEmiInstallment(payload).pipe(
      finalize(() => this.isSubmittingPayment.set(false))
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Success', 'Payment recorded.');
        this.onClosePaymentModal();
        this.loadEmiData(); // Refresh the EMI plan
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Payment failed.');
      }
    });
  }

  // --- Helpers ---

  formatCurrency(value: number | undefined | null): string {
    if (value === undefined || value === null) value = 0;
    return `₹ ${value.toFixed(2)}`;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }
  
  getPaymentStatusSeverity(status: string): string {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warn';
      case 'pending': return 'info';
      case 'overdue': return 'danger';
      default: return 'secondary';
    }
  }

  getEmiStatusSeverity(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'defaulted': return 'danger';
      default: return 'secondary';
    }
  }
}