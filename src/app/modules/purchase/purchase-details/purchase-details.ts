import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

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

// Shared Grid
import { AgShareGrid } from "../../shared/components/ag-shared-grid";

// Services
import { AppMessageService } from '../../../core/services/message.service';
import { PurchaseService } from '../purchase.service';
import { ActionViewRenderer } from '../../shared/AgGrid/AgGridcomponents/DynamicDetailCard/ActionViewRenderer';
import { FileUpload } from "primeng/fileupload";
import { ImageViewerDirective } from '../../shared/directives/image-viewer.directive';
import { Badge } from "primeng/badge";

@Component({
  selector: 'app-purchase-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    CurrencyPipe,
    TitleCasePipe, TabsModule,
    ButtonModule,
    TagModule,
    DividerModule,
    DialogModule,
    InputNumberModule,
    DatePicker, FormsModule,
    Select,
    InputTextModule,
    Toast,
    AgShareGrid,
    FileUpload, ImageViewerDirective,
    Badge
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

  // --- GRID COLUMNS DEFINITIONS ---
  // Add this helper method inside your PurchaseDetailsComponent class
isImage(file: any): boolean {
  if (!file) return false;
  // Check explicit format from Cloudinary or file extension
  const format = file.format || file.url?.split('.').pop();
  const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'];
  return imageFormats.includes(format?.toLowerCase());
}
  // 1. Items Grid Columns
  itemColumns:any = [
    { 
      headerName: 'Product', 
      field: 'name', 
      width: 250,
      cellRenderer: (params: any) => {
         const name = params.data.productId?.name || params.value;
         const sku = params.data.productId?.sku;
         return `
           <div>
             <div style="font-weight:600; color:var(--text-primary)">${name}</div>
             ${sku ? `<div style="font-size:10px; color:var(--text-secondary)">SKU: ${sku}</div>` : ''}
           </div>
         `;
      }
    },
    { 
      headerName: 'Qty', 
      field: 'quantity', 
      width: 80, 
      type: 'rightAligned',
      cellStyle: { fontWeight: '700' }
    },
    { 
      headerName: 'Unit Price', 
      field: 'purchasePrice', 
      width: 120, 
      type: 'rightAligned',
      valueFormatter: (p: any) => this.formatCurrency(p.value)
    },
    { 
      headerName: 'Tax', 
      field: 'taxRate', 
      width: 80, 
      type: 'rightAligned',
      valueFormatter: (p: any) => (p.value || 0) + '%'
    },
    { 
      headerName: 'Discount', 
      field: 'discount', 
      width: 100, 
      type: 'rightAligned',
      cellStyle: { color: 'var(--color-error)' },
      valueFormatter: (p: any) => p.value ? '-' + this.formatCurrency(p.value) : '-'
    },
    { 
      headerName: 'Total', 
      field: 'total', 
      width: 130, 
      type: 'rightAligned',
      cellStyle: { fontWeight: '700', color: 'var(--text-primary)' },
      valueGetter: (params: any) => {
        const item = params.data;
        const total = ((item.purchasePrice * item.quantity) - (item.discount || 0)) * (1 + ((item.taxRate || 0)/100));
        return total;
      },
      valueFormatter: (p: any) => this.formatCurrency(p.value)
    }
  ];

  // 2. Payment History Columns
  paymentColumns = [
    { 
      headerName: 'Date', 
      field: 'paymentDate', 
      width: 120,
      valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('en-IN') : '-'
    },
    { 
      headerName: 'Reference', 
      field: 'referenceNumber', 
      width: 150,
      valueFormatter: (p: any) => p.value || '-'
    },
    { 
      headerName: 'Method', 
      field: 'paymentMethod', 
      width: 120,
      cellRenderer: (params: any) => {
        return `<span style="text-transform:uppercase; font-size:11px; font-weight:700; color:var(--text-secondary)">${params.value}</span>`;
      }
    },
    { 
      headerName: 'Amount', 
      field: 'amount', 
      width: 130, 
      type: 'rightAligned',
      cellStyle: { color: 'var(--color-success)', fontWeight: '700' },
      valueFormatter: (p: any) => this.formatCurrency(p.value)
    },
    {
      headerName: 'Action',
      field: '_id',
      width: 80,
      cellRenderer: (params: any) => {
         // We use a simple button here or you can use your ActionRenderer if it supports specific actions
         return `<button class="p-button-danger p-button-text" style="border:none; background:transparent; color:var(--color-error); cursor:pointer;">
                  <i class="pi pi-trash"></i>
                 </button>`;
      },
      onCellClicked: (params: any) => this.deletePayment(params.value, params.data.amount)
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

  loadData() {
    this.isLoading.set(true);
    
    // 1. Get Purchase
    this.purchaseService.getPurchaseById(this.purchaseId!).subscribe({
      next: (res: any) => {
        const data = res.data?.data || res.data;
        this.purchase.set(data);
        this.itemsData.set(data.items || []);
        
        // 2. Get Payments (Chained or Parallel)
        this.purchaseService.getPaymentHistory(this.purchaseId!).subscribe({
           next: (payRes: any) => {
              this.paymentHistoryData.set(payRes.data?.payments || []);
           },
           complete: () => this.isLoading.set(false)
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.showError('Error', 'Could not load details');
        this.router.navigate(['/purchase']);
      }
    });
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

  submitPayment() {
    if (this.paymentForm.invalid) return;

    const p = this.purchase();
    const formVal = this.paymentForm.value;
    const balance = p.balanceAmount;

    // Use epsilon for float comparison safety
    if (formVal.amount > (balance + 0.01)) {
      this.messageService.showError('Invalid Amount', `Exceeds balance (${this.formatCurrency(balance)})`);
      return;
    }

    this.isSubmittingPayment.set(true);
    this.purchaseService.recordPayment(this.purchaseId!, formVal)
      .pipe(finalize(() => this.isSubmittingPayment.set(false)))
      .subscribe({
        next: () => {
          this.messageService.showSuccess('Success', 'Payment Recorded');
          this.showPaymentDialog.set(false);
          this.loadData(); // Reload both purchase (for status) and history
        },
        error: (err) => this.messageService.showError('Error', err.error?.message || 'Failed')
      });
  }

  deletePayment(paymentId: string, amount: number) {
    if(!confirm(`Delete payment of ${this.formatCurrency(amount)}? This will restore the balance.`)) return;

    this.purchaseService.deletePayment(this.purchaseId!, paymentId).subscribe({
      next: () => {
        this.messageService.showSuccess('Deleted', 'Payment Removed');
        this.loadData();
      },
      error: () => this.messageService.showError('Error', 'Delete Failed')
    });
  }

  // --- Helpers ---
  
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
    if(url) window.open(url, '_blank');
  }


  // --- NEW: Status Workflow ---
  updateStatus(newStatus: string) {
    this.purchaseService.updateStatus(this.purchaseId!, newStatus, 'Status updated via UI')
      .subscribe({
        next: () => {
          this.messageService.showSuccess('Updated', `Status changed to ${newStatus}`);
          this.loadData();
        },
        error: () => this.messageService.showError('Error', 'Status update failed')
      });
  }
  // --- NEW: Cancellation Logic ---
  showCancelDialog = signal(false);
  cancelReason = '';

  confirmCancel() {
    if (!this.cancelReason.trim()) return;
    
    this.purchaseService.cancelPurchase(this.purchaseId!, this.cancelReason)
      .subscribe({
        next: () => {
          this.messageService.showSuccess('Cancelled', 'Purchase cancelled');
          this.showCancelDialog.set(false);
          this.loadData();
        },
        error: (err) => this.messageService.showError('Error', err.error?.message || 'Failed')
      });
  }

  // --- NEW: Attachment Logic ---
  isUploading = signal(false);

  onFileSelect(event: any, fileUpload: any) {
    this.isUploading.set(true);
    const files = event.files;
    
    this.purchaseService.addAttachments(this.purchaseId!, files).subscribe({
      next: () => {
        this.messageService.showSuccess('Uploaded', 'Files added successfully');
        fileUpload.clear();
        this.isUploading.set(false);
        this.loadData(); // Refresh list
      },
      error: () => {
        this.isUploading.set(false);
        this.messageService.showError('Error', 'Upload failed');
      }
    });
  }

  deleteAttachment(index: number) {
    if(!confirm('Delete this attachment?')) return;
    
    this.purchaseService.deleteAttachment(this.purchaseId!, index).subscribe({
      next: () => {
        this.messageService.showSuccess('Deleted', 'File removed');
        this.loadData();
      },
      error: () => this.messageService.showError('Error', 'Delete failed')
    });
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

// // Services
// import { AppMessageService } from '../../../core/services/message.service';
// import { CommonMethodService } from '../../../core/utils/common-method.service';
// import { PurchaseService } from '../purchase.service';
// import { Toast } from "primeng/toast";

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
//     Toast
// ],
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
//     { label: 'Bank Transfer', value: 'bank' }, // Mapped to 'bank_transfer' in backend if needed
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
//           if (res && res.data && res.data.data) {this.purchase.set(res.data.data);          } else if (res && res.data) {
//              this.purchase.set(res.data);
//           }
//         },
//         error: () => {
//           this.messageService.showError('Error', 'Could not load purchase details.');
//           this.router.navigate(['/purchase']);
//         }
//       });
//   }

//   // --- Payment Actions ---

//   openPaymentModal() {
//     const p = this.purchase();
//     if (!p) return;

//     // Reset form and set default amount to remaining balance. 
//     // If balanceAmount is missing in JSON, calculate it or default to 0.
//     const balance = p.balanceAmount !== undefined ? p.balanceAmount : (p.grandTotal - (p.paidAmount || 0));

//     this.paymentForm.reset({
//       amount: balance > 0 ? balance : 0,
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
//     const balance = p.balanceAmount !== undefined ? p.balanceAmount : (p.grandTotal - (p.paidAmount || 0));

//     if (formVal.amount > balance) {
//       this.messageService.showError('Invalid Amount', `Payment cannot exceed balance due (${balance})`);
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
//     switch (status?.toLowerCase()) {
//       case 'received': return 'success';
//       case 'approved': return 'success';
//       case 'draft': return 'secondary';
//       case 'cancelled': return 'danger';
//       default: return 'info';
//     }
//   }

//   getPaymentSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
//     switch (status?.toLowerCase()) {
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
//     if(url) window.open(url, '_blank');
//   }
// }