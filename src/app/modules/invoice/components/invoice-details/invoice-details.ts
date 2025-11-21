import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';

// Services
import { InvoiceService } from '../../services/invoice-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';

type Severity = 'success' | 'secondary' | 'info' | 'warn' | 'danger';

@Component({
  selector: 'app-invoice-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    DividerModule,
    TagModule,
    ConfirmDialogModule,
    TooltipModule,
    TableModule,
    ToastModule
  ],
  providers: [ConfirmationService], 
  templateUrl: './invoice-details.html',
  styleUrls: ['./invoice-details.scss'],
})
export class InvoiceDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);
  private confirmService = inject(ConfirmationService);
  private messageService = inject(AppMessageService);

  // Inject common service
  public common = inject(CommonMethodService);

  // === Signals ===
  invoice = signal<any | null>(null);
  isProcessing = signal(false);

  // Computed Total
  invoiceItems = computed(() => {
    const data = this.invoice();
    if (!data?.items) return [];

    return data.items.map((item: any) => {
      const baseTotal = item.price * item.quantity;
      const afterDiscount = baseTotal - (item.discount || 0);
      const taxAmount = (item.taxRate || 0) / 100 * afterDiscount;
      return {
        ...item,
        calculatedTotal: afterDiscount + taxAmount
      };
    });
  });

  ngOnInit(): void {
    this.loadInvoiceData();
  }

  // 🚀 NEW CLEANER METHOD
  private loadInvoiceData(): void {
    this.route.paramMap.subscribe(params => {
      const invoiceId = params.get('id');

      if (!invoiceId) {
        this.messageService.showError('Navigation Error', 'No invoice ID found');
        this.router.navigate(['/invoices']);
        return;
      }

      // 🔥 ONE LINE API CALL
      this.common.apiCall(
        this.invoiceService.getInvoiceById(invoiceId),
        (response: any) => {
          if (response?.data) {
            this.invoice.set(response.data.invoice || response.data.data);
          }
        },
        'Fetch Invoice'
      );
    });
  }

  // === Actions ===
  
  onEmail(): void {
    const id = this.invoice()?._id;
    if (!id) return;
    
    this.isProcessing.set(true);
    // You can even use common.apiCall here if you want automatic loading/error handling!
    // But we need isProcessing signal, so maybe keep custom logic or update helper to accept signal.
    this.common.apiCall(
        this.invoiceService.emailInvoice(id),
        () => {
            this.messageService.showSuccess('Email Sent', 'Invoice emailed successfully.');
            this.isProcessing.set(false);
        },
        'Email Invoice'
    );
  }

  onDownload(): void {
    const id = this.invoice()?._id;
    if (!id) return;

    this.common.apiCall(
      this.invoiceService.downloadInvoice(id),
      (res: any) => {
        if (!res || !res.body) {
          this.messageService.showError('Download Failed', 'File empty.');
          return;
        }
        this.common.downloadBlob(res.body, `invoice-${this.invoice()?.invoiceNumber}.pdf`);
        this.messageService.showSuccess('Success', 'Invoice downloaded.');
      },
      'Download Invoice'
    );
  }

  onDelete(): void {
    this.confirmService.confirm({
      message: 'Are you sure you want to delete this invoice?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      accept: () => {
        const id = this.invoice()?._id;
        if (!id) return;

        this.common.apiCall(
            this.invoiceService.deleteInvoiceById(id),
            () => {
                this.messageService.showSuccess('Deleted', 'Invoice removed.');
                this.router.navigate(['/invoices']);
            },
            'Delete Invoice'
        );
      }
    });
  }
}