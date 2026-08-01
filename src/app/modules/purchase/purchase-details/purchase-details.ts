import { Component, OnInit, inject, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { finalize, takeUntil } from 'rxjs/operators';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { Toast } from "primeng/toast";
import { TabsModule } from 'primeng/tabs';
import { DataGridComponent, GridColumn } from '@shared/ui/grid';
// Services
import { AppMessageService } from '../../../core/services/message.service';
import { PurchaseService } from '../purchase.service';
import { FileUpload } from "primeng/fileupload";
import { ImageViewerDirective } from '../../shared/directives/image-viewer.directive';
import { Badge } from "primeng/badge";
import { forkJoin, Subject } from 'rxjs';
import { HasPermissionDirective } from '../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../core/auth/permissions.constants';

@Component({
  selector: 'app-purchase-details',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, CurrencyPipe, TitleCasePipe, TabsModule, ButtonModule, TagModule, DividerModule, DialogModule, InputNumberModule, DatePicker, FormsModule, Select, InputTextModule, Toast, DataGridComponent, FileUpload, ImageViewerDirective, Badge, HasPermissionDirective],
  templateUrl: './purchase-details.html',
  styleUrl: './purchase-details.scss',
})
export class PurchaseDetailsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly PERMISSIONS = PERMISSIONS;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private purchaseService = inject(PurchaseService);
  private messageService = inject(AppMessageService);

  // Signals
  purchase = signal<any>(null);
  isLoading = signal<boolean>(true);

  // Data for Grids
  itemsData = signal<any[]>([]);
  paymentHistoryData = signal<any[]>([]);

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
    { label: 'Bank Transfer', value: 'bank' },
    { label: 'UPI', value: 'upi' },
    { label: 'Card', value: 'card' },
    { label: 'Cheque', value: 'cheque' },
    { label: 'Other', value: 'other' }
  ];

  purchaseId: string | null = null;

  isImage(file: any): boolean {
    if (!file) return false;
    const format = file.format || file.url?.split('.').pop();
    const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'];
    return imageFormats.includes(format?.toLowerCase());
  }
  itemColumns: GridColumn[] = [
    {
      header: 'Product',
      field: 'name',
      width: '250px',
      formatter: (val: any, row: any) => row.productId?.sku ? `${row.productId?.name || val} (SKU: ${row.productId?.sku})` : (row.productId?.name || val)
    },
    {
      header: 'Qty',
      field: 'quantity',
      width: '80px',
      align: 'right'
    },
    {
      header: 'Catalog Price',
      field: 'productId.purchasePrice',
      width: '140px',
      type: 'currency',
      align: 'right'
    },
    {
      header: 'Unit Price',
      field: 'purchasePrice',
      width: '120px',
      type: 'currency',
      align: 'right'
    },
    {
      header: 'Tax',
      field: 'taxRate',
      width: '80px',
      align: 'right',
      formatter: (val: any) => (val || 0) + '%'
    },
    {
      header: 'Discount',
      field: 'discount',
      width: '100px',
      type: 'currency',
      align: 'right'
    },
    {
      header: 'Total',
      field: 'total',
      width: '130px',
      type: 'currency',
      align: 'right',
      formatter: (val: any, row: any) => {
        const item = row;
        return (((item.purchasePrice * item.quantity) - (item.discount || 0)) * (1 + ((item.taxRate || 0) / 100))).toString();
      }
    }
  ];

  // 2. Payment History Columns
  paymentColumns: GridColumn[] = [
    {
      header: 'Date',
      field: 'paymentDate',
      width: '120px',
      type: 'date',
      dateFormat: 'dd MMM yyyy'
    },
    {
      header: 'Reference',
      field: 'referenceNumber',
      width: '150px'
    },
    {
      header: 'Method',
      field: 'paymentMethod',
      width: '120px',
      type: 'chip'
    },
    {
      header: 'Amount',
      field: 'amount',
      width: '130px',
      type: 'currency',
      align: 'right'
    }
  ];

  ngOnInit() {
    this.purchaseId = this.route.snapshot.paramMap.get('id');
    if (this.purchaseId) {
      this.loadData();
    } else {
      this.router.navigate(['/purchase']);
    }
  }


  // --- Payment Logic ---

  openPaymentModal() {
    const p = this.purchase();
    if (!p) return;
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




  formatCurrency(val: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(val);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (status?.toLowerCase()) {
      case 'received': return 'success';
      case 'approved': return 'success';
      case 'draft': return 'secondary';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  }

  getPaymentSeverity(status: string): any {
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'partial': return 'warn';
      case 'unpaid': return 'danger';
      default: return 'info';
    }
  }

  downloadAttachment(url: string) {
    if (url) window.open(url, '_blank');
  }


  loadData() {
    if (!this.purchaseId) {
      this.messageService.showError('Invalid purchase ID.');
      this.router.navigate(['/purchase']);
      return;
    }

    this.isLoading.set(true);
    forkJoin({ purchase: this.purchaseService.getPurchaseById(this.purchaseId), payments: this.purchaseService.getPaymentHistory(this.purchaseId) })
      .pipe(finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const data = res.purchase.data?.data || res.purchase.data;
          this.purchase.set(data);
          this.itemsData.set(data.items || []);
          this.paymentHistoryData.set(res.payments.data?.payments || []);
        },
        error: (err) => {
          this.messageService.handleHttpError(err);
          this.router.navigate(['/purchase']);
        }
      });
  }

  submitPayment() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.messageService.showWarn('Validation Error: Please fill in all required payment fields.');
      return;
    }

    const p = this.purchase();
    const formVal = this.paymentForm.getRawValue();
    const balance = p.balanceAmount;

    // Use epsilon for float comparison safety
    if (formVal.amount > (balance + 0.01)) {
      this.messageService.showWarn(`Validation Error: Amount exceeds the remaining balance of ${this.formatCurrency(balance)}.`);
      return;
    }

    this.isSubmittingPayment.set(true);
    this.purchaseService.recordPayment(this.purchaseId!, formVal)
      .pipe(finalize(() => this.isSubmittingPayment.set(false)), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.showSuccess('Payment recorded successfully.');
          this.showPaymentDialog.set(false);
          this.loadData();
        },
        error: (err) => this.messageService.handleHttpError(err)
      });
  }

  deletePayment(paymentId: string, amount: number) {
    if (!confirm(`Delete payment of ${this.formatCurrency(amount)}? This will restore the balance.`)) return;

    this.purchaseService.deletePayment(this.purchaseId!, paymentId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.messageService.showSuccess('Payment removed successfully.');
        this.loadData();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  // --- Status Workflow ---
  updateStatus(newStatus: string) {
    this.purchaseService.updateStatus(this.purchaseId!, newStatus, 'Status updated via UI').pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.showSuccess(`Purchase status changed to ${newStatus}.`);
          this.loadData();
        },
        error: (err) => this.messageService.handleHttpError(err)
      });
  }

  // --- Cancellation Logic ---
  showCancelDialog = signal(false);
  cancelReason = '';

  confirmCancel() {
    if (!this.cancelReason.trim()) {
      this.messageService.showWarn('Validation Error: A cancellation reason is required.');
      return;
    }

    this.purchaseService.cancelPurchase(this.purchaseId!, this.cancelReason).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.showSuccess('Purchase cancelled successfully.');
          this.showCancelDialog.set(false);
          this.loadData();
        },
        error: (err) => this.messageService.handleHttpError(err)
      });
  }

  // --- Attachment Logic ---
  isUploading = signal(false);

  onFileSelect(event: any, fileUpload: any) {
    const files = event.files;
    if (!files || files.length === 0) return;

    this.isUploading.set(true);

    this.purchaseService.addAttachments(this.purchaseId!, files)
      .pipe(finalize(() => {
        this.isUploading.set(false);
        fileUpload.clear();
      }), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.showSuccess('Files attached successfully.');
          this.loadData();
        },
        error: (err) => this.messageService.handleHttpError(err)
      });
  }

  deleteAttachment(index: number) {
    if (!confirm('Delete this attachment?')) return;

    this.purchaseService.deleteAttachment(this.purchaseId!, index).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.messageService.showSuccess('Attachment removed successfully.');
        this.loadData();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
