// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-invoice-details',
//   imports: [],
//   templateUrl: './invoice-details.html',
//   styleUrl: './invoice-details.scss',
// })
// export class InvoiceDetails {

// }
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';

import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { LoadingService } from '../../../../core/services/loading.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { InvoiceService } from '../../services/invoice-service';

// Simple model based on schema
interface IInvoice {
  _id: string;
  invoiceNumber: string;
  customer: any; // Populated customer
  billingAddress: string;
  shippingAddress: string;
  invoiceDate: string;
  dueDate: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  items: any[];
  subTotal: number;
  totalTax: number;
  totalDiscount: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  notes?: string;
}

@Component({
  selector: 'app-invoice-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    DividerModule,
    TagModule,
    TableModule,
    TooltipModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './invoice-details.html',
  styleUrl: './invoice-details.scss',
})
export class InvoiceDetailsComponent implements OnInit {
  // Injected services
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);
  private loadingService = inject(LoadingService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);

  invoice = signal<IInvoice | any>(null);
  invoiceId: string | null = null;
  isProcessing = signal(false); // For email/download buttons

  ngOnInit(): void {
    this.loadInvoiceData();
  }

  private loadInvoiceData(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.invoiceId = params.get('id');
        if (!this.invoiceId) {
          this.messageService.showError('Error', 'No invoice ID provided');
          return of(null);
        }
        this.loadingService.show();
        return this.invoiceService.getInvoiceById(this.invoiceId).pipe(
          finalize(() => this.loadingService.hide())
        );
      })
    ).subscribe({
      next: (response: any) => {
        if (response && response.data && response.data.data) {
          // Assuming customer is populated by the backend
          this.invoice.set(response.data.data);
        } else if (response !== null) {
          this.messageService.showError('Error', 'Failed to load invoice details');
        }
      },
      error: (err) => {
        console.error('Failed to fetch invoice:', err);
        this.messageService.showError('Error', err.error?.message || 'Could not fetch invoice');
      }
    });
  }

  onDownload(): void {
    if (!this.invoiceId) return;
    this.isProcessing.set(true);
    this.invoiceService.downloadInvoice(this.invoiceId).pipe(
      finalize(() => this.isProcessing.set(false))
    ).subscribe({
      next: (blob) => {
        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${this.invoice()?.invoiceNumber || this.invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        this.messageService.showSuccess('Success', 'PDF Download started.');
      },
      error: () => this.messageService.showError('Error', 'Failed to download PDF.')
    });
  }
  
  onEmail(): void {
    if (!this.invoiceId) return;
    this.isProcessing.set(true);
    this.invoiceService.emailInvoice(this.invoiceId).pipe(
      finalize(() => this.isProcessing.set(false))
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Success', 'Invoice has been queued for sending.');
      },
      error: () => this.messageService.showError('Error', 'Failed to send email.')
    });
  }

  onDelete(): void {
     if (!this.invoiceId) return;
     this.confirmationService.confirm({
        message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
        header: 'Delete Invoice',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Delete',
        rejectLabel: 'Cancel',
        accept: () => {
          this.loadingService.show();
          this.invoiceService.deleteInvoiceById(this.invoiceId!).pipe(
            finalize(() => this.loadingService.hide())
          ).subscribe({
            next: () => {
              this.messageService.showSuccess('Deleted', 'Invoice has been deleted.');
              this.router.navigate(['/invoices']); // Navigate back to list
            },
            error: (err) => this.messageService.showError('Error', err.error?.message || 'Failed to delete invoice.')
          });
        }
    });
  }

  formatCurrency(value: number | undefined | null): string {
    if (value === undefined || value === null) value = 0;
    return `₹ ${value.toFixed(2)}`;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

// In your InvoiceDetailsComponent class (invoice-details.ts)

getSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
  switch (status) {
    case 'paid': return 'success';
    case 'partial': return 'warn'; // <-- Changed from 'warning' to 'warn'
    case 'unpaid': return 'danger';
    case 'issued': return 'info';
    case 'draft': return 'secondary';
    case 'cancelled': return 'danger';
    default: return 'info';
  }
}
}