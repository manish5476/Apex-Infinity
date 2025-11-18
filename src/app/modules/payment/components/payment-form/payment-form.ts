import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { finalize, switchMap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker'; // Corrected import
import { LoadingService } from '../../../../core/services/loading.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { PaymentService } from '../../services/payment-service';
import { text } from 'stream/consumers';
import { Textarea } from 'primeng/textarea';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule, // Corrected import
    Textarea, // Corrected import
    SelectModule,
    DividerModule
  ],
  templateUrl: './payment-form.html',
  styleUrls: ['./payment-form.scss']
})
export class PaymentFormComponent implements OnInit, OnDestroy {
  // --- Injected Services ---
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService);
  private masterList = inject(MasterListService);

  // --- Form & State ---
  paymentForm!: FormGroup;
  isSubmitting = signal(false);
  editMode = signal(false);
  paymentId: string | null = null;
  formTitle = signal('Record New Payment');
  private typeSub!: Subscription;

  // --- Master Data Signals ---
  customerOptions = signal<any[]>([]);
  supplierOptions = signal<any[]>([]);
  invoiceOptions = signal<any[]>([]); // We'll need a way to fetch these
  purchaseOptions = signal<any[]>([]); // We'll need a way to fetch these
  branchOptions = signal<any[]>([]);

  // --- Enums for Selects ---
  typeOptions = [
    { label: 'Inflow (Payment Received)', value: 'inflow' },
    { label: 'Outflow (Payment Made)', value: 'outflow' },
  ];
  paymentMethodOptions = [
    { label: 'Cash', value: 'cash' },
    { label: 'Bank', value: 'bank' },
    { label: 'Credit', value: 'credit' },
    { label: 'UPI', value: 'upi' },
    { label: 'Cheque', value: 'cheque' },
    { label: 'Other', value: 'other' },
  ];
  statusOptions = [
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];
  
  constructor() {
    this.customerOptions.set(this.masterList.customers());
    this.supplierOptions.set(this.masterList.suppliers());
    this.branchOptions.set(this.masterList.branches());
    // Note: invoice/purchase options would likely be fetched dynamically
  }

  ngOnInit(): void {
    this.buildForm();
    this.setupDynamicFields();
    this.checkRouteForEditMode();
  }

  ngOnDestroy(): void {
    if (this.typeSub) {
      this.typeSub.unsubscribe();
    }
  }

  private checkRouteForEditMode(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.paymentId = params.get('id');
        if (this.paymentId) {
          this.editMode.set(true);
          this.formTitle.set('Edit Payment');
          this.loadingService.show();
          return this.paymentService.getPaymentById(this.paymentId);
        }
        return of(null); // Create mode
      }),
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (response) => {
        if (response && response.data && response.data.data) {
          this.patchForm(response.data.data);
        } else if (response) {
          this.messageService.showError('Error', 'Failed to load payment data');
        }
      },
      error: (err) => this.messageService.showError('Error', err.error?.message)
    });
  }

  private buildForm(): void {
    this.paymentForm = this.fb.group({
      type: ['inflow', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      paymentDate: [new Date(), Validators.required],
      paymentMethod: ['cash', Validators.required],
      status: ['completed', Validators.required],
      referenceNumber: [''],
      
      // Dynamic fields
      customerId: [null],
      invoiceId: [null],
      supplierId: [null],
      purchaseId: [null],
      
      branchId: [null],
      bankName: [''],
      transactionId: [''],
      remarks: [''],
    });
  }

  /**
   * Dynamically add/remove validators based on Payment Type
   */
  private setupDynamicFields(): void {
    const typeControl = this.paymentForm.get('type');
    const customerControl = this.paymentForm.get('customerId');
    const supplierControl = this.paymentForm.get('supplierId');

    if (!typeControl || !customerControl || !supplierControl) return;

    this.typeSub = typeControl.valueChanges.subscribe(type => {
      if (type === 'inflow') {
        customerControl.setValidators([Validators.required]);
        supplierControl.clearValidators();
        supplierControl.setValue(null);
      } else if (type === 'outflow') {
        supplierControl.setValidators([Validators.required]);
        customerControl.clearValidators();
        customerControl.setValue(null);
      }
      customerControl.updateValueAndValidity();
      supplierControl.updateValueAndValidity();
    });
    
    // Set initial state
    typeControl.setValue('inflow');
  }

  private patchForm(payment: any): void {
    this.paymentForm.patchValue({
      type: payment.type,
      amount: payment.amount,
      paymentDate: new Date(payment.paymentDate),
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      referenceNumber: payment.referenceNumber,
      customerId: payment.customerId,
      invoiceId: payment.invoiceId,
      supplierId: payment.supplierId,
      purchaseId: payment.purchaseId,
      branchId: payment.branchId,
      bankName: payment.bankName,
      transactionId: payment.transactionId,
      remarks: payment.remarks,
    });
  }

  onSubmit(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.messageService.showError('Invalid Form', 'Please check all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.paymentForm.getRawValue();

    const saveObservable = this.editMode()
      ? this.paymentService.updatePayment(this.paymentId!, payload)
      : this.paymentService.createPayment(payload);

    saveObservable.pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (res) => {
        this.messageService.showSuccess('Success', `Payment ${this.editMode() ? 'updated' : 'recorded'} successfully.`);
        this.router.navigate(['/payments']); // Navigate back to list
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Failed to save payment.');
      }
    });
  }
}
