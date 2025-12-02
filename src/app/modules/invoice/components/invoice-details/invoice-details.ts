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
import { SkeletonModule } from 'primeng/skeleton';

// Services
import { InvoiceService } from '../../services/invoice-service';
import { EmiService } from '../../../emi/services/emi-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { finalize } from 'rxjs/operators';

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
    ToastModule,
    SkeletonModule
  ],
  providers: [ConfirmationService], 
  templateUrl: './invoice-details.html',
  styleUrls: ['./invoice-details.scss'],
})
export class InvoiceDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);
  private emiService = inject(EmiService);
  private confirmService = inject(ConfirmationService);
  private messageService = inject(AppMessageService);
  public common = inject(CommonMethodService);

  // === Signals ===
  invoice = signal<any | null>(null);
  isLoading = signal(true);      // New: Controls skeleton state
  isProcessing = signal(false);  // Controls action buttons (download/email)
  
  // Store the Linked EMI Plan ID if found
  existingEmiId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadInvoiceData();
  }

  private loadInvoiceData(): void {
    this.route.paramMap.subscribe(params => {
      const invoiceId = params.get('id');

      if (!invoiceId) {
        this.messageService.showError('Navigation Error', 'No invoice ID found');
        this.router.navigate(['/invoices']);
        return;
      }

       // this.isLoading.set(true);

      this.common.apiCall(
        this.invoiceService.getInvoiceById(invoiceId),
        (response: any) => {
          if (response?.data) {
            const data = response.data.invoice || response.data.data;
            this.invoice.set(data);
            
            // Check for related EMI plan
            this.checkEmiStatus(invoiceId);
          }
          this.isLoading.set(false);
        },
        'Fetch Invoice'
      );
    });
  }

  private checkEmiStatus(invoiceId: string) {
    this.emiService.getEmiByInvoice(invoiceId).subscribe({
      next: (res: any) => {
        if (res.data && res.data.emi) {
          this.existingEmiId.set(res.data.emi._id);
        }
      },
      error: () => this.existingEmiId.set(null)
    });
  }

  // === Actions ===

  onCreateEmi(): void {
    const invoiceId = this.invoice()?._id;
    if (!invoiceId) return;
    this.router.navigate(['/emis/create'], { queryParams: { invoiceId } });
  }
  
  onEmail(): void {
    const id = this.invoice()?._id;
    if (!id) return;
    
    // this.isProcessing.set(true);
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

    // this.isProcessing.set(true); // Show spinner on button
    this.common.apiCall(
      this.invoiceService.downloadInvoice(id),
      (res: any) => {
        if (!res || !res.body) {
          this.messageService.showError('Download Failed', 'File empty.');
          return;
        }
        this.common.downloadBlob(res.body, `invoice-${this.invoice()?.invoiceNumber}.pdf`);
        this.messageService.showSuccess('Success', 'Invoice downloaded.');
        this.isProcessing.set(false);
      },
      'Download Invoice'
    );
  }

  onDelete(): void {
    this.confirmService.confirm({
      message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
      header: 'Delete Confirmation',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
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

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { DividerModule } from 'primeng/divider';
// import { TagModule } from 'primeng/tag';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ConfirmationService } from 'primeng/api';
// import { TooltipModule } from 'primeng/tooltip';
// import { TableModule } from 'primeng/table';
// import { ToastModule } from 'primeng/toast';
// import { SkeletonModule } from 'primeng/skeleton';

// // Services
// import { InvoiceService } from '../../services/invoice-service';
// import { EmiService } from '../../../emi/services/emi-service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { CommonMethodService } from '../../../../core/utils/common-method.service';
// import { finalize } from 'rxjs/operators';

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
//     ToastModule,
//     SkeletonModule
//   ],
//   providers: [ConfirmationService], 
//   templateUrl: './invoice-details.html',
//   styleUrls: ['./invoice-details.scss'],
// })
// export class InvoiceDetailsComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private invoiceService = inject(InvoiceService);
//   private emiService = inject(EmiService);
//   private confirmService = inject(ConfirmationService);
//   private messageService = inject(AppMessageService);
//   public common = inject(CommonMethodService);

//   // === Signals ===
//   invoice = signal<any | null>(null);
//   isLoading = signal(true);      // New: Controls skeleton state
//   isProcessing = signal(false);  // Controls action buttons (download/email)
  
//   // Store the Linked EMI Plan ID if found
//   existingEmiId = signal<string | null>(null);

//   ngOnInit(): void {
//     this.loadInvoiceData();
//   }

//   private loadInvoiceData(): void {
//     this.route.paramMap.subscribe(params => {
//       const invoiceId = params.get('id');

//       if (!invoiceId) {
//         this.messageService.showError('Navigation Error', 'No invoice ID found');
//         this.router.navigate(['/invoices']);
//         return;
//       }

//        // this.isLoading.set(true);

//       this.common.apiCall(
//         this.invoiceService.getInvoiceById(invoiceId),
//         (response: any) => {
//           if (response?.data) {
//             const data = response.data.invoice || response.data.data;
//             this.invoice.set(data);
            
//             // Check for related EMI plan
//             this.checkEmiStatus(invoiceId);
//           }
//           this.isLoading.set(false);
//         },
//         'Fetch Invoice'
//       );
//     });
//   }

//   private checkEmiStatus(invoiceId: string) {
//     this.emiService.getEmiByInvoice(invoiceId).subscribe({
//       next: (res: any) => {
//         if (res.data && res.data.emi) {
//           this.existingEmiId.set(res.data.emi._id);
//         }
//       },
//       error: () => this.existingEmiId.set(null)
//     });
//   }

//   // === Actions ===

//   onCreateEmi(): void {
//     const invoiceId = this.invoice()?._id;
//     if (!invoiceId) return;
//     this.router.navigate(['/emis/create'], { queryParams: { invoiceId } });
//   }
  
//   onEmail(): void {
//     const id = this.invoice()?._id;
//     if (!id) return;
    
//     this.isProcessing.set(true);
//     this.common.apiCall(
//         this.invoiceService.emailInvoice(id),
//         () => {
//             this.messageService.showSuccess('Email Sent', 'Invoice emailed successfully.');
//             this.isProcessing.set(false);
//         },
//         'Email Invoice'
//     );
//   }

//   onDownload(): void {
//     const id = this.invoice()?._id;
//     if (!id) return;

//     this.isProcessing.set(true); // Show spinner on button
//     this.common.apiCall(
//       this.invoiceService.downloadInvoice(id),
//       (res: any) => {
//         if (!res || !res.body) {
//           this.messageService.showError('Download Failed', 'File empty.');
//           return;
//         }
//         this.common.downloadBlob(res.body, `invoice-${this.invoice()?.invoiceNumber}.pdf`);
//         this.messageService.showSuccess('Success', 'Invoice downloaded.');
//         this.isProcessing.set(false);
//       },
//       'Download Invoice'
//     );
//   }

//   onDelete(): void {
//     this.confirmService.confirm({
//       message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
//       header: 'Delete Confirmation',
//       icon: 'pi pi-trash',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         const id = this.invoice()?._id;
//         if (!id) return;

//         this.common.apiCall(
//             this.invoiceService.deleteInvoiceById(id),
//             () => {
//                 this.messageService.showSuccess('Deleted', 'Invoice removed.');
//                 this.router.navigate(['/invoices']);
//             },
//             'Delete Invoice'
//         );
//       }
//     });
//   }
// }

// // import { Component, OnInit, inject, signal, computed } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// // // PrimeNG
// // import { ButtonModule } from 'primeng/button';
// // import { DividerModule } from 'primeng/divider';
// // import { TagModule } from 'primeng/tag';
// // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // import { ConfirmationService } from 'primeng/api';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { TableModule } from 'primeng/table';
// // import { ToastModule } from 'primeng/toast';

// // // Services
// // import { InvoiceService } from '../../services/invoice-service';
// // import { EmiService } from '../../../emi/services/emi-service'; // Import EMI Service
// // import { AppMessageService } from '../../../../core/services/message.service';
// // import { CommonMethodService } from '../../../../core/utils/common-method.service';

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
// //     ToastModule
// //   ],
// //   providers: [ConfirmationService], 
// //   templateUrl: './invoice-details.html',
// //   styleUrls: ['./invoice-details.scss'],
// // })
// // export class InvoiceDetailsComponent implements OnInit {
// //   private route = inject(ActivatedRoute);
// //   private router = inject(Router);
// //   private invoiceService = inject(InvoiceService);
// //   private emiService = inject(EmiService); // Inject EMI Service
// //   private confirmService = inject(ConfirmationService);
// //   private messageService = inject(AppMessageService);

// //   // Inject common service
// //   public common = inject(CommonMethodService);

// //   // === Signals ===
// //   invoice = signal<any | null>(null);
// //   isProcessing = signal(false);
  
// //   // Store the Linked EMI Plan ID if found (This is the key change)
// //   existingEmiId = signal<string | null>(null);

// //   // Computed Total
// //   invoiceItems = computed(() => {
// //     const data = this.invoice();
// //     if (!data?.items) return [];

// //     return data.items.map((item: any) => {
// //       const baseTotal = item.price * item.quantity;
// //       const afterDiscount = baseTotal - (item.discount || 0);
// //       const taxAmount = (item.taxRate || 0) / 100 * afterDiscount;
// //       return {
// //         ...item,
// //         calculatedTotal: afterDiscount + taxAmount
// //       };
// //     });
// //   });

// //   ngOnInit(): void {
// //     this.loadInvoiceData();
// //   }

// //   private loadInvoiceData(): void {
// //     this.route.paramMap.subscribe(params => {
// //       const invoiceId = params.get('id');

// //       if (!invoiceId) {
// //         this.messageService.showError('Navigation Error', 'No invoice ID found');
// //         this.router.navigate(['/invoices']);
// //         return;
// //       }

// //       this.common.apiCall(
// //         this.invoiceService.getInvoiceById(invoiceId),
// //         (response: any) => {
// //           if (response?.data) {
// //             this.invoice.set(response.data.invoice || response.data.data);
            
// //             // 🔥 CHECK FOR EMI PLAN USING INVOICE ID 🔥
// //             this.checkEmiStatus(invoiceId);
// //           }
// //         },
// //         'Fetch Invoice'
// //       );
// //     });
// //   }

// //   /**
// //    * Silently checks if an EMI plan exists for this invoice.
// //    * Uses the API: GET /v1/emi/invoice/:invoiceId
// //    */
// //   private checkEmiStatus(invoiceId: string) {
// //     this.emiService.getEmiByInvoice(invoiceId).subscribe({
// //       next: (res: any) => {
// //         // If a plan is found, the backend returns { data: { emi: { _id: '...', ... } } }
// //         if (res.data && res.data.emi) {
// //           console.log('EMI Plan Found:', res.data.emi._id);
// //           this.existingEmiId.set(res.data.emi._id);
// //         }
// //       },
// //       error: (err) => {
// //         // 404 is expected if no plan exists yet. We just leave existingEmiId as null.
// //         console.log('No EMI Plan found for this invoice.');
// //         this.existingEmiId.set(null);
// //       }
// //     });
// //   }

// //   // === Actions ===

// //   onCreateEmi(): void {
// //     const invoiceId = this.invoice()?._id;
// //     if (!invoiceId) return;

// //     // Navigate to EMI Creation page with Invoice ID
// //     this.router.navigate(['/emis/create'], { 
// //       queryParams: { invoiceId: invoiceId } 
// //     });
// //   }
  
// //   onEmail(): void {
// //     const id = this.invoice()?._id;
// //     if (!id) return;
    
// //     this.isProcessing.set(true);
// //     this.common.apiCall(
// //         this.invoiceService.emailInvoice(id),
// //         () => {
// //             this.messageService.showSuccess('Email Sent', 'Invoice emailed successfully.');
// //             this.isProcessing.set(false);
// //         },
// //         'Email Invoice'
// //     );
// //   }

// //   onDownload(): void {
// //     const id = this.invoice()?._id;
// //     if (!id) return;

// //     this.common.apiCall(
// //       this.invoiceService.downloadInvoice(id),
// //       (res: any) => {
// //         if (!res || !res.body) {
// //           this.messageService.showError('Download Failed', 'File empty.');
// //           return;
// //         }
// //         this.common.downloadBlob(res.body, `invoice-${this.invoice()?.invoiceNumber}.pdf`);
// //         this.messageService.showSuccess('Success', 'Invoice downloaded.');
// //       },
// //       'Download Invoice'
// //     );
// //   }

// //   onDelete(): void {
// //     this.confirmService.confirm({
// //       message: 'Are you sure you want to delete this invoice?',
// //       header: 'Delete Confirmation',
// //       icon: 'pi pi-exclamation-triangle',
// //       acceptButtonStyleClass: 'p-button-danger p-button-text',
// //       rejectButtonStyleClass: 'p-button-text p-button-text',
// //       accept: () => {
// //         const id = this.invoice()?._id;
// //         if (!id) return;

// //         this.common.apiCall(
// //             this.invoiceService.deleteInvoiceById(id),
// //             () => {
// //                 this.messageService.showSuccess('Deleted', 'Invoice removed.');
// //                 this.router.navigate(['/invoices']);
// //             },
// //             'Delete Invoice'
// //         );
// //       }
// //     });
// //   }
// // }

// // // import { Component, OnInit, inject, signal, computed } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// // // // PrimeNG
// // // import { ButtonModule } from 'primeng/button';
// // // import { DividerModule } from 'primeng/divider';
// // // import { TagModule } from 'primeng/tag';
// // // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // // import { ConfirmationService } from 'primeng/api';
// // // import { TooltipModule } from 'primeng/tooltip';
// // // import { TableModule } from 'primeng/table';
// // // import { ToastModule } from 'primeng/toast';

// // // // Services
// // // import { InvoiceService } from '../../services/invoice-service';
// // // import { AppMessageService } from '../../../../core/services/message.service';
// // // import { CommonMethodService } from '../../../../core/utils/common-method.service';

// // // type Severity = 'success' | 'secondary' | 'info' | 'warn' | 'danger';

// // // @Component({
// // //   selector: 'app-invoice-details',
// // //   standalone: true,
// // //   imports: [
// // //     CommonModule,
// // //     RouterModule,
// // //     ButtonModule,
// // //     DividerModule,
// // //     TagModule,
// // //     ConfirmDialogModule,
// // //     TooltipModule,
// // //     TableModule,
// // //     ToastModule
// // //   ],
// // //   providers: [ConfirmationService], 
// // //   templateUrl: './invoice-details.html',
// // //   styleUrls: ['./invoice-details.scss'],
// // // })
// // // export class InvoiceDetailsComponent implements OnInit {
// // //   private route = inject(ActivatedRoute);
// // //   private router = inject(Router);
// // //   private invoiceService = inject(InvoiceService);
// // //   private confirmService = inject(ConfirmationService);
// // //   private messageService = inject(AppMessageService);

// // //   // Inject common service
// // //   public common = inject(CommonMethodService);

// // //   // === Signals ===
// // //   invoice = signal<any | null>(null);
// // //   isProcessing = signal(false);

// // //   // Computed Total
// // //   invoiceItems = computed(() => {
// // //     const data = this.invoice();
// // //     if (!data?.items) return [];

// // //     return data.items.map((item: any) => {
// // //       const baseTotal = item.price * item.quantity;
// // //       const afterDiscount = baseTotal - (item.discount || 0);
// // //       const taxAmount = (item.taxRate || 0) / 100 * afterDiscount;
// // //       return {
// // //         ...item,
// // //         calculatedTotal: afterDiscount + taxAmount
// // //       };
// // //     });
// // //   });

// // //   ngOnInit(): void {
// // //     this.loadInvoiceData();
// // //   }

// // //   // 🚀 NEW CLEANER METHOD
// // //   private loadInvoiceData(): void {
// // //     this.route.paramMap.subscribe(params => {
// // //       const invoiceId = params.get('id');

// // //       if (!invoiceId) {
// // //         this.messageService.showError('Navigation Error', 'No invoice ID found');
// // //         this.router.navigate(['/invoices']);
// // //         return;
// // //       }

// // //       // 🔥 ONE LINE API CALL
// // //       this.common.apiCall(
// // //         this.invoiceService.getInvoiceById(invoiceId),
// // //         (response: any) => {
// // //           if (response?.data) {
// // //             this.invoice.set(response.data.invoice || response.data.data);
// // //           }
// // //         },
// // //         'Fetch Invoice'
// // //       );
// // //     });
// // //   }

// // //   // === Actions ===
  
// // //   onEmail(): void {
// // //     const id = this.invoice()?._id;
// // //     if (!id) return;
    
// // //     this.isProcessing.set(true);
// // //     // You can even use common.apiCall here if you want automatic loading/error handling!
// // //     // But we need isProcessing signal, so maybe keep custom logic or update helper to accept signal.
// // //     this.common.apiCall(
// // //         this.invoiceService.emailInvoice(id),
// // //         () => {
// // //             this.messageService.showSuccess('Email Sent', 'Invoice emailed successfully.');
// // //             this.isProcessing.set(false);
// // //         },
// // //         'Email Invoice'
// // //     );
// // //   }

// // //   onDownload(): void {
// // //     const id = this.invoice()?._id;
// // //     if (!id) return;

// // //     this.common.apiCall(
// // //       this.invoiceService.downloadInvoice(id),
// // //       (res: any) => {
// // //         if (!res || !res.body) {
// // //           this.messageService.showError('Download Failed', 'File empty.');
// // //           return;
// // //         }
// // //         this.common.downloadBlob(res.body, `invoice-${this.invoice()?.invoiceNumber}.pdf`);
// // //         this.messageService.showSuccess('Success', 'Invoice downloaded.');
// // //       },
// // //       'Download Invoice'
// // //     );
// // //   }

// // //   onDelete(): void {
// // //     this.confirmService.confirm({
// // //       message: 'Are you sure you want to delete this invoice?',
// // //       header: 'Delete Confirmation',
// // //       icon: 'pi pi-exclamation-triangle',
// // //       acceptButtonStyleClass: 'p-button-danger p-button-text',
// // //       rejectButtonStyleClass: 'p-button-text p-button-text',
// // //       accept: () => {
// // //         const id = this.invoice()?._id;
// // //         if (!id) return;

// // //         this.common.apiCall(
// // //             this.invoiceService.deleteInvoiceById(id),
// // //             () => {
// // //                 this.messageService.showSuccess('Deleted', 'Invoice removed.');
// // //                 this.router.navigate(['/invoices']);
// // //             },
// // //             'Delete Invoice'
// // //         );
// // //       }
// // //     });
// // //   }

// // //   onCreateEmi(): void {
// // //     const invoiceId = this.invoice()?._id;
// // //     if (!invoiceId) return;
// // //     this.router.navigate(['/emis/create'], { 
// // //       queryParams: { invoiceId: invoiceId } 
// // //     });
// // //   }
// // // }