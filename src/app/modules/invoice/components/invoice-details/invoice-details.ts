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

// import { Component, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { finalize, switchMap } from 'rxjs/operators';
// import { of } from 'rxjs';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { DividerModule } from 'primeng/divider';
// import { TagModule } from 'primeng/tag';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ConfirmationService } from 'primeng/api';
// import { TooltipModule } from 'primeng/tooltip';
// import { TableModule } from 'primeng/table';
// import { ToastModule } from 'primeng/toast';

// // Services
// import { InvoiceService } from '../../services/invoice-service';
// import { LoadingService } from '../../../../core/services/loading.service';
// import { AppMessageService } from '../../../../core/services/message.service'; // Your wrapper

// type Severity = 'success' | 'secondary' | 'info' | 'warn' | 'danger';

// @Component({
//   selector: 'app-invoice-details',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ButtonModule,
//     DividerModule,
//     TagModule,
//     ConfirmDialogModule,
//     TooltipModule,
//     TableModule,
//     ToastModule
//   ],
//   // 🛑 REMOVED MessageService & InvoiceService from here.
//   // We want the global singletons, not local instances.
//   providers: [ConfirmationService],
//   templateUrl: './invoice-details.html',
//   styleUrls: ['./invoice-details.scss'],
// })
// export class InvoiceDetailsComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private invoiceService = inject(InvoiceService);
//   private loadingService = inject(LoadingService);
//   private messageService = inject(AppMessageService); // Use your wrapper
//   private confirmService = inject(ConfirmationService);

//   // === Signals ===
//   invoice = signal<any | null>(null);
//   isProcessing = signal(false);

//   // 🚀 ENHANCEMENT: Computed Signal for Item Calculations
//   // This calculates totals automatically whenever 'invoice' signal changes.
//   // No need to loop manually inside the subscribe block.
//   invoiceItems = computed(() => {
//     const data = this.invoice();
//     if (!data?.items) return [];

//     return data.items.map((item: any) => {
//       const baseTotal = item.price * item.quantity;
//       const afterDiscount = baseTotal - (item.discount || 0);
//       const taxAmount = (item.taxRate || 0) / 100 * afterDiscount;
//       return {
//         ...item,
//         calculatedTotal: afterDiscount + taxAmount
//       };
//     });
//   });

//   ngOnInit(): void {
//     this.loadInvoiceData();
//   }

//   // === Data Loading ===
//   private loadInvoiceData(): void {
//     this.route.paramMap.pipe(
//       switchMap(params => {
//         const invoiceId = params.get('id');
//         if (!invoiceId) {
//           this.messageService.showError('Navigation Error', 'No invoice ID found in URL');
//           this.router.navigate(['/invoices']);
//           return of(null);
//         }
//         this.loadingService.show();
//         return this.invoiceService.getInvoiceById(invoiceId).pipe(
//           finalize(() => this.loadingService.hide())
//         );
//       })
//     ).subscribe({
//       next: (response: any) => {
//         if (response?.data) {
//           // Just set the raw data. The 'invoiceItems' computed signal handles the math.
//           this.invoice.set(response.data.invoice || response.data.data);
//         }
//       },
//       error: (err) => {
//         this.messageService.handleHttpError(err, 'Fetch Invoice');
//       }
//     });
//   }

//   // === Formatting & Helpers ===
//   formatCurrency(value: number | undefined | null): string {
//     if (value === undefined || value === null) value = 0;
//     return `₹ ${value.toFixed(2)}`;
//   }

//     formatDate(dateString: string | undefined): string {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
//   }
//   // === Actions ===

//   onEmail(): void {
//     const id = this.invoice()?._id;
//     if (!id) return;

//     this.isProcessing.set(true);
//     this.invoiceService.emailInvoice(id).pipe(
//       finalize(() => this.isProcessing.set(false))
//     ).subscribe({
//       next: () => this.messageService.showSuccess('Email Sent', 'Invoice has been emailed to the customer.'),
//       error: (err) => this.messageService.handleHttpError(err, 'Email Invoice')
//     });
//   }



//   onDownload(): void {
//     const id = this.invoice()?._id;
//     if (!id) return;

//     this.loadingService.show();
//     this.invoiceService.downloadInvoice(id).pipe(
//       finalize(() => this.loadingService.hide())
//     ).subscribe({
//       next: (res: any) => {
//         if (!res || !res.body) {
//           this.messageService.showError('Download Failed', 'File content was empty.');
//           return;
//         }
//         this.downloadFile(res.body, `invoice-${this.invoice()?.invoiceNumber}.pdf`);
//         this.messageService.showSuccess('Download Complete', 'Invoice saved to your device.');
//       },
//       error: (err) => this.messageService.handleHttpError(err, 'Download Invoice')
//     });
//   }

//   onDelete(): void {
//     this.confirmService.confirm({
//       message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
//       header: 'Delete Confirmation',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger p-button-text',
//       rejectButtonStyleClass: 'p-button-text p-button-text',
//       accept: () => {
//         const id = this.invoice()?._id;
//         if (!id) return;

//         this.isProcessing.set(true);
//         this.invoiceService.deleteInvoiceById(id).pipe(
//           finalize(() => this.isProcessing.set(false))
//         ).subscribe({
//           next: () => {
//             this.messageService.showSuccess('Deleted', 'Invoice removed successfully.');
//             this.router.navigate(['/invoices']);
//           },
//           error: (err) => this.messageService.handleHttpError(err, 'Delete Invoice')
//         });
//       }
//     });
//   }

//   // === Helpers ===

//   private downloadFile(blobData: Blob, fileName: string) {
//     const blob = new Blob([blobData], { type: 'application/pdf' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = fileName;
//     a.click();
//     window.URL.revokeObjectURL(url);
//   }

//   getSeverity(status: string): Severity {
//     switch (status?.toLowerCase()) {
//       case 'paid': return 'success';
//       case 'pending': return 'warn';
//       case 'partial': return 'info';
//       case 'overdue':
//       case 'cancelled': return 'danger';
//       default: return 'secondary';
//     }
//   }
// }

// // import { Component, OnInit, inject, signal, computed } from '@angular/core';
// // import { CommonModule, DatePipe } from '@angular/common';
// // import { ActivatedRoute, RouterModule, Router } from '@angular/router';

// // import { finalize, switchMap } from 'rxjs/operators';
// // import { of } from 'rxjs';

// // // PrimeNG
// // import { ButtonModule } from 'primeng/button';
// // import { DividerModule } from 'primeng/divider';
// // import { TagModule } from 'primeng/tag';
// // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { TableModule } from 'primeng/table';

// // // Services (Assuming these exist in your structure)
// // import { InvoiceService } from '../../services/invoice-service';
// // import { LoadingService } from '../../../../core/services/loading.service';
// // import { AppMessageService } from '../../../../core/services/message.service';
// // import { Toast } from "primeng/toast";

// // type Severity = 'success' | 'secondary' | 'info' | 'warn' | 'danger';

// // @Component({
// //   selector: 'app-invoice-details',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     RouterModule,
// //     ButtonModule,
// //     DividerModule,
// //     TagModule,
// //     ConfirmDialogModule,
// //     TooltipModule,
// //     TableModule,
// //     Toast
// //   ],
// //   providers: [ConfirmationService, MessageService, InvoiceService], // Added providers
// //   templateUrl: './invoice-details.html',
// //   styleUrls: ['./invoice-details.scss'],
// // })
// // export class InvoiceDetailsComponent implements OnInit {
// //   // Injected services
// //   private route = inject(ActivatedRoute);
// //   private router = inject(Router);
// //   private invoiceService = inject(InvoiceService);
// //   private loadingService = inject(LoadingService);
// //   private messageService = inject(MessageService); // PrimeNG MessageService for Toast
// //   private confirmService = inject(ConfirmationService);

// //   // State Signals
// //   invoice = signal<any | null>(null);
// //   isProcessing = signal(false);

// //   ngOnInit(): void {
// //     this.loadInvoiceData();
// //   }

// //   // === Data Loading ===
// //   private loadInvoiceData(): void {
// //     this.route.paramMap.pipe(
// //       switchMap(params => {
// //         const invoiceId = params.get('id');
// //         if (!invoiceId) {
// //           this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No invoice ID provided' });
// //           return of(null);
// //         }
// //         this.loadingService.show();
// //         // Assume API response structure is { data: { invoice: {...} } } or similar
// //         return this.invoiceService.getInvoiceById(invoiceId).pipe(
// //           finalize(() => this.loadingService.hide())
// //         );
// //       })
// //     ).subscribe({
// //       next: (response: any) => {
// //         if (response?.data) {
// //           // Calculate total for table display if necessary (assuming totalAmount is calculated in backend/service)
// //           const invoiceData = response.data.invoice || response.data.data;

// //           if (invoiceData.items && invoiceData.items.length > 0) {
// //             invoiceData.items = invoiceData.items.map((item: any) => ({
// //               ...item,
// //               // Calculate item total for display based on item fields
// //               totalAmount: (item.price * item.quantity) - item.discount + ((item.taxRate / 100) * (item.price * item.quantity - item.discount))
// //             }));
// //           }

// //           this.invoice.set(invoiceData);
// //         }
// //       },
// //       error: (err) => {
// //         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Could not fetch invoice details' });
// //       }
// //     });
// //   }

// //   // === Formatting & Helpers ===
// //   formatCurrency(value: number | undefined | null): string {
// //     if (value === undefined || value === null) value = 0;
// //     return `₹ ${value.toFixed(2)}`;
// //   }

// //   formatDate(dateString: string | undefined): string {
// //     if (!dateString) return 'N/A';
// //     return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
// //   }

// //   getSeverity(status: string): Severity {
// //     switch (status?.toLowerCase()) {
// //       case 'paid':
// //       case 'completed': return 'success';
// //       case 'pending': return 'warn';
// //       case 'partial': return 'info';
// //       case 'overdue':
// //       case 'failed':
// //       case 'deleted': return 'danger';
// //       case 'draft': return 'secondary';
// //       default: return 'secondary';
// //     }
// //   }

// //   // === Action Handlers ===
// //   onEmail(): void {
// //     this.isProcessing.set(true);
// //     setTimeout(() => {
// //       this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Invoice emailed successfully.' });
// //       this.isProcessing.set(false);
// //     }, 1500);
// //   }

// //   onDownload(): void {
// //     this.downloadInvoice()
// //   }

// //   downloadInvoice(): void {
// //     this.route.paramMap.pipe(
// //       switchMap(params => {
// //         const invoiceId = params.get('id');
// //         if (!invoiceId) {
// //           this.messageService.add({
// //             severity: 'error',
// //             summary: 'Error',
// //             detail: 'No invoice ID provided'
// //           });
// //           return of(null);
// //         }
// //         this.loadingService.show();
// //         return this.invoiceService.downloadInvoice(invoiceId).pipe(
// //           finalize(() => this.loadingService.hide())
// //         );
// //       })
// //     ).subscribe({
// //       next: (res: any) => {
// //         if (!res || !res.body) {
// //           this.messageService.add({
// //             severity: 'error',
// //             summary: 'Error',
// //             detail: 'Invalid PDF response'
// //           });
// //           return;
// //         }

// //         const blob = new Blob([res.body], { type: 'application/pdf' });
// //         const url = window.URL.createObjectURL(blob);
// //         const a = document.createElement('a');

// //         a.href = url;
// //         a.download = `invoice-${Date.now()}.pdf`;
// //         a.click();

// //         window.URL.revokeObjectURL(url);

// //         this.messageService.add({
// //           severity: 'success',
// //           summary: 'Success',
// //           detail: 'Invoice downloaded.'
// //         });
// //       },

// //       error: (err) => {
// //         this.messageService.add({
// //           severity: 'error',
// //           summary: 'Error',
// //           detail: err.error?.message || 'Could not download invoice'
// //         });
// //       }
// //     });
// //   }

// //   onDelete(): void {
// //     this.confirmService.confirm({
// //       message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
// //       header: 'Confirmation',
// //       icon: 'pi pi-exclamation-triangle',
// //       accept: () => {
// //         this.isProcessing.set(true);
// //         const id = this.invoice()?._id;
// //         if (id) {
// //           this.invoiceService.deleteInvoiceById(id).pipe(
// //             finalize(() => this.isProcessing.set(false))
// //           ).subscribe({
// //             next: () => {
// //               this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Invoice deleted successfully.' });
// //               this.router.navigate(['/invoices']);
// //             },
// //             error: (err) => {
// //               this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Deletion failed.' });
// //             }
// //           });
// //         }
// //       }
// //     });
// //   }
// // }