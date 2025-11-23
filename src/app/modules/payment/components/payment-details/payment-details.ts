import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, UpperCasePipe, DecimalPipe } from '@angular/common'; // Added Pipes
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { LoadingService } from '../../../../core/services/loading.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { PaymentService } from '../../services/payment-service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
type Severity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';
import { TooltipModule } from 'primeng/tooltip'; // Added for hover info
@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    DividerModule,TooltipModule,
    TagModule,
    UpperCasePipe,
    DecimalPipe
  ],
  templateUrl: './payment-details.html',
  styleUrls: ['./payment-details.scss']
})
export class PaymentDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);
  private loadingService = inject(LoadingService);
  private messageService = inject(AppMessageService);
  // Inject Common Service (Public for HTML access)
  public common = inject(CommonMethodService);
  payment = signal<any | null>(null);

  ngOnInit(): void {this.loadPaymentData()}
  private loadPaymentData(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) return of(null);
        this.loadingService.show();
        return this.paymentService.getPaymentById(id).pipe(finalize(() => this.loadingService.hide()) ); })
    ).subscribe({
      next: (res: any) => {
        if (res?.data) {
           this.payment.set(res.data.data || res.data); 
        } else {
           this.messageService.showError('Error', 'Payment not found');
        }
      },
      error: (err) => this.messageService.showError('Error', err.error?.message || 'Load failed')
    });
  }

downloadReceipt(): void {
    const p = this.payment();
    if (!p) return;
    const ref = p.referenceNumber || 'receipt';
    this.common.apiCall(
      this.paymentService.downloadReceipt(p._id),
      (res: any) => {
        if (res.body) {
          this.common.downloadBlob(res.body, `payment-${ref}.pdf`);
          this.messageService.showSuccess('Downloaded', 'Receipt saved successfully.');
        }
      },
      'Download Receipt'
    );
  }

  sendEmail(): void {
    const id = this.payment()?._id;
    if (!id) return;
    this.common.apiCall(
      this.paymentService.emailReceipt(id),
      () => {
        this.messageService.showSuccess('Sent', 'Receipt emailed to customer.');
      },
      'Email Receipt'
    );
  }



  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { 
        year: 'numeric', month: 'short', day: 'numeric' 
    });
  }

  getStatusSeverity(status: string): Severity {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warn';
      case 'failed': return 'danger';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  }
}
