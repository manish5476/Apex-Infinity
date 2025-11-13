import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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

// Define the specific severity type for PrimeNG
type Severity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    DividerModule,
    TagModule
  ],
   templateUrl: './payment-details.html',
   styleUrl: './payment-details.scss',
})
export class PaymentDetailsComponent implements OnInit {
  // Injected services
  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);
  private loadingService = inject(LoadingService);
  private messageService = inject(AppMessageService);

  payment = signal<any | null>(null);

  ngOnInit(): void {
    this.loadPaymentData();
  }

  private loadPaymentData(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const paymentId = params.get('id');
        if (!paymentId) {
          this.messageService.showError('Error', 'No payment ID provided');
          return of(null);
        }
        this.loadingService.show();
        return this.paymentService.getPaymentById(paymentId).pipe(
          finalize(() => this.loadingService.hide())
        );
      })
    ).subscribe({
      next: (response: any) => {
        if (response && response.data && response.data.data) {
          this.payment.set(response.data.data);
        } else if (response !== null) {
          this.messageService.showError('Error', 'Failed to load payment details');
        }
      },
      error: (err) => {
        console.error('Failed to fetch payment:', err);
        this.messageService.showError('Error', err.error?.message || 'Could not fetch payment');
      }
    });
  }

  formatCurrency(value: number | undefined | null): string {
    if (value === undefined || value === null) value = 0;
    return `₹ ${value.toFixed(2)}`;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }
  
  // CORRECTED: Return type is now the specific Severity
  getPaymentType(type: string): { label: string, severity: Severity } {
    if (type === 'inflow') {
      return { label: 'Inflow (Received)', severity: 'success' };
    }
    return { label: 'Outflow (Paid)', severity: 'danger' };
  }
  
  // CORRECTED: Return type is now the specific Severity
  getStatus(status: any): { label: string, severity: Severity } {
    switch (status) {
      case 'completed': return { label: 'Completed', severity: 'success' };
      case 'pending': return { label: 'Pending', severity: 'warn' };
      case 'failed': return { label: 'Failed', severity: 'danger' };
      case 'cancelled': return { label: 'Cancelled', severity: 'danger' };
      default: return { label: status, severity: 'info' };
    }
  }
}