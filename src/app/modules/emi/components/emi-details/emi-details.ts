import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

// Services
import { EmiService } from '../../services/emi-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';

@Component({
  selector: 'app-emi-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    TagModule,
    CardModule,
    TableModule,
    DividerModule,
    ProgressBarModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './emi-details.html',
  styleUrl: './emi-details.scss'
})
export class EmiDetailsComponent implements OnInit {
  // --- Injections ---
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private emiService = inject(EmiService);
  private messageService = inject(AppMessageService);
  private fb = inject(FormBuilder);
  
  // Inject your CommonMethodService publically for the template
  public common = inject(CommonMethodService);

  // --- State ---
  emiData = signal<any | null>(null);
  isLoading = signal(true);
  
  // Payment Dialog State
  showPaymentDialog = false;
  paymentForm!: FormGroup;
  selectedInstallment: any = null;
  isSubmittingPayment = signal(false);

  // --- Computed Stats ---
  progress = computed(() => {
    const data = this.emiData();
    if (!data) return 0;
    const totalPaid = data.installments.reduce((acc: number, curr: any) => acc + (curr.paidAmount || 0), 0);
    const totalCollected = totalPaid + (data.downPayment || 0);
    const percentage = (totalCollected / data.totalAmount) * 100;
    return Math.min(100, Math.round(percentage));
  });

  paymentModes = [
    { label: 'Cash', value: 'cash' },
    { label: 'Bank Transfer', value: 'bank_transfer' },
    { label: 'UPI', value: 'upi' },
    { label: 'Cheque', value: 'cheque' }
  ];

  constructor() {
    this.initPaymentForm();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchEmiDetails(id);
      } else {
        this.router.navigate(['/emis']);
      }
    });
  }

  private fetchEmiDetails(id: string) {
    this.isLoading.set(true);
    this.common.apiCall(
      this.emiService.getEmiById(id),
      (res: any) => {
        // Handle both wrapped {data: {emi: ...}} and direct {data: ...} responses
        if (res.data && res.data.emi) {
          this.emiData.set(res.data.emi);
        } else if (res.data) {
           this.emiData.set(res.data);
        }
        this.isLoading.set(false);
      },
      'Fetch EMI Details'
    );
  }

  // --- Payment Logic ---

  initPaymentForm() {
    this.paymentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      paymentId: ['', Validators.required],
      // paymentMethod: "cash",
      paymentMode: ['cash', Validators.required],
      notes: ['']
    });
  }

  openPaymentDialog(installment: any) {
    if (installment.paymentStatus === 'paid') return;
    this.selectedInstallment = installment;
    const dueAmount = installment.totalAmount - installment.paidAmount;
    this.paymentForm.patchValue({
      amount: dueAmount,
      paymentId: '',
      paymentMode: 'cash',
      notes: ''
    });

    this.showPaymentDialog = true;
  }

  submitPayment() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const emiId = this.emiData()._id;
    const { amount, paymentId, paymentMode } = this.paymentForm.value;

    this.isSubmittingPayment.set(true);

    const payload = {
      emiId: emiId,
      installmentNumber: this.selectedInstallment.installmentNumber,
      amount: amount,
      paymentMethod:paymentMode,
      referenceNumber: `${paymentMode.toUpperCase()}-${paymentId}`
    };

    this.common.apiCall(
      this.emiService.payEmiInstallment(payload),
      (res: any) => {
        this.messageService.showSuccess('Payment Recorded', `Installment #${this.selectedInstallment.installmentNumber} updated.`);
        this.showPaymentDialog = false;
        this.isSubmittingPayment.set(false);
        this.fetchEmiDetails(emiId);
      },
      'Record Payment'
    );
  }

  // --- Helpers ---

  /**
   * Check if an installment is overdue
   * Returns true if status is NOT paid and due date is in the past
   */
  isOverdue(installment: any): boolean {
    if (!installment || installment.paymentStatus === 'paid') {
      return false;
    }
    
    const dueDate = new Date(installment.dueDate);
    const today = new Date();
    
    // Reset hours to ensure we compare dates only (start of day)
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    return dueDate < today;
  }
}
