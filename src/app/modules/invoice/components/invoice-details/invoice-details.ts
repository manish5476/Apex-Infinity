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
import { DynamicDialogServices } from '../../../../core/services/dynamic-dialog-services';

import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';

@Component({
  selector: 'app-invoice-details',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    ButtonModule, TagModule, ConfirmDialogModule, TooltipModule,
    TableModule, ToastModule, SkeletonModule, DialogModule,
    InputNumberModule, InputTextModule, SelectModule, TextareaModule,
    CheckboxModule, HasPermissionDirective
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
  private dialogServices = inject(DynamicDialogServices);
  public common = inject(CommonMethodService);


  PERMISSIONS = PERMISSIONS;

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

   // === Actions: Cancel ===
  openCancelModal(): void {
    this.showCancelModal.set(true);
    this.cancelForm.reset({ restock: true });
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
        }
        // Removed the redundant 'Fetch Invoice' context string here
      );
    });
  }

  private loadPaymentHistory(id: string): void {
    this.invoiceService.getInvoicePayments(id).subscribe({
      next: (res: any) => {
        this.payments.set(res.data?.payments || res.data || []);
      },
      error: (err) => {
        // Caught the silent failure so the user knows if payment history fails to load!
        this.messageService.handleHttpError(err);
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
      // Left this silent error alone, assuming a 404 (No EMI found) is expected behavior here!
      error: () => this.existingEmiId.set(null) 
    });
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) {
      // Added user feedback for invalid forms
      this.messageService.showWarn('Invalid Form: Please check your payment details.');
      return;
    }

    this.isProcessing.set(true);
    const payload = this.paymentForm.value;
    const id = this.invoice()._id;

    this.common.apiCall(
      this.invoiceService.addPayment(id, payload).pipe(
        finalize(() => this.isProcessing.set(false))
      ),
      () => {
        // Simplified to a single string
        this.messageService.showSuccess('Payment balance updated successfully.');
        this.showPaymentModal.set(false);
        
        // Refresh data to reflect new status
        this.loadInvoiceData(); 
      }
      // Removed the redundant 'Add Payment' string
    );
  }

  submitCancel(): void {
    if (this.cancelForm.invalid) {
      // Added user feedback for invalid forms
      this.messageService.showWarn('Invalid Form: Please provide a cancellation reason.');
      return;
    }

    this.isProcessing.set(true);
    const { reason, restock } = this.cancelForm.value;
    const id = this.invoice()._id;

    this.common.apiCall(
      this.invoiceService.cancelInvoice(id, reason, restock).pipe(
        finalize(() => this.isProcessing.set(false))
      ),
      () => {
        // Simplified to a single string
        this.messageService.showSuccess('Invoice cancelled and stock restored.');
        this.showCancelModal.set(false);
        this.loadInvoiceData();
      }
      // Removed the redundant 'Cancel Invoice' string
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
      error: (err) => {
        // Replaced manual error extraction with your global HTTP handler
        this.messageService.handleHttpError(err);
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
        // Simplified to a single string
        this.messageService.showSuccess('Invoice emailed to customer successfully.');
      }
      // Removed the redundant 'Email Invoice' string
    );
  }

  onReturn(): void {
    const inv = this.invoice();
    if (!inv) return;
    
    this.dialogServices.openSalesReturn({ invoice: inv })?.onClose.subscribe(res => {
      if (res) {
        // Refresh data if return was successful
        this.loadInvoiceData();
      }
    });
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