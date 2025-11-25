import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { finalize, switchMap, tap, startWith, debounceTime } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { DatePicker } from 'primeng/datepicker';
import { LoadingService } from '../../../../core/services/loading.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { InvoiceService } from '../../../invoice/services/invoice-service';
import { EmiService } from '../../services/emi-service';

@Component({
  selector: 'app-emi-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePicker,
    DividerModule
  ],
  templateUrl: './emi-form.html',
  styleUrls: ['./emi-form.scss']
})
export class EmiFormComponent implements OnInit, OnDestroy {
  // --- Injected Services ---
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private emiService = inject(EmiService);
  private invoiceService = inject(InvoiceService); // To get invoice details
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService);

  // --- Form & State ---
  emiForm!: FormGroup;
  isSubmitting = signal(false);
  invoiceId: string | null = null;
  formTitle = signal('Create EMI Plan');
  private balanceSub!: Subscription;

  // Store fetched invoice data
  public invoice: any = null;

  constructor() { }

  ngOnInit(): void {
    this.buildForm();
    this.setupBalanceCalculation();
    this.loadInvoiceData();
  }

  ngOnDestroy(): void {
    if (this.balanceSub) {
      this.balanceSub.unsubscribe();
    }
  }

  private loadInvoiceData(): void {
    this.route.queryParamMap.pipe(
      switchMap(params => {
        this.invoiceId = params.get('invoiceId');
        if (!this.invoiceId) {
          this.invoiceId = this.route.snapshot.paramMap.get('invoiceId');
        }
        if (!this.invoiceId) {
          this.messageService.showError('Error', 'No Invoice ID provided.');
          this.router.navigate(['/invoices']);
          return of(null);
        }

        this.loadingService.show();
        return this.invoiceService.getInvoiceById(this.invoiceId);
      }),
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (response) => {
        if (response && response.data && response.data.data) {
          this.invoice = response.data.data;
          this.patchFormWithInvoiceData();
        } else if (response) {
          this.messageService.showError('Error', 'Failed to load invoice data');
          this.router.navigate(['/invoices']);
        }
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Could not load invoice');
        this.router.navigate(['/invoices']);
      }
    });
  }

  private buildForm(): void {
    this.emiForm = this.fb.group({
      invoiceId: [null, Validators.required],
      customerId: [null, Validators.required],
      branchId: [null, Validators.required],
      totalAmount: [{ value: 0, disabled: true }, Validators.required],
      downPayment: [0, [Validators.required, Validators.min(0)]],
      balanceAmount: [{ value: 0, disabled: true }, Validators.required],
      numberOfInstallments: [null, [Validators.required, Validators.min(1)]],
      interestRate: [0, [Validators.required, Validators.min(0)]],
      emiStartDate: [new Date(), Validators.required],
    });
  }

  private patchFormWithInvoiceData(): void {
    if (!this.invoice) return;
    this.emiForm.patchValue({
      invoiceId: this.invoice._id,
      customerId: this.invoice.customerId, // Or invoice.customer._id
      branchId: this.invoice.branchId,
      totalAmount: this.invoice.grandTotal,
      balanceAmount: this.invoice.grandTotal // Will be recalculated
    });
  }

  private setupBalanceCalculation(): void {
    const totalControl = this.emiForm.get('totalAmount');
    const downPaymentControl = this.emiForm.get('downPayment');
    const balanceControl = this.emiForm.get('balanceAmount');

    if (!totalControl || !downPaymentControl || !balanceControl) return;

    this.balanceSub = downPaymentControl.valueChanges
      .pipe(startWith(downPaymentControl.value))
      .subscribe(downPayment => {
        const total = totalControl.value;
        const balance = total - (downPayment || 0);
        balanceControl.setValue(balance, { emitEvent: false });
      });
  }

  onSubmit(): void {
    if (this.emiForm.invalid) {
      this.emiForm.markAllAsTouched();
      this.messageService.showError('Invalid Form', 'Please check all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    // Get raw value to include disabled fields
    const payload = this.emiForm.getRawValue();

    this.emiService.createEmiPlan(payload).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (res) => {
        this.messageService.showSuccess('Success', 'EMI Plan created successfully.');
        // Navigate to the details page for this invoice's EMI
        this.router.navigate(['/emi/invoice', this.invoiceId]);
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Failed to create EMI plan.');
      }
    });
  }
}