import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap, finalize } from 'rxjs/operators';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { AppMessageService } from '../../../core/services/message.service';
import { PurchaseService } from '../purchase.service';
import { CommonMethodService } from '../../../core/utils/common-method.service';
@Component({
  selector: 'app-purchase-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    TagModule,
    TableModule,
    DividerModule,
    TooltipModule,
    CardModule
  ],
  providers: [CurrencyPipe, DatePipe],
  templateUrl: './purchase-details.html',
  styleUrl: './purchase-details.scss',
})
export class PurchaseDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private purchaseService = inject(PurchaseService);
  private messageService = inject(AppMessageService);
  private common = inject(CommonMethodService);

  // Signals
  purchase = signal<any>(null);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.isLoading.set(true);
          return this.purchaseService.getPurchaseById(id);
        }
        return [];
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res: any) => {
        if (res && res.data.purchase) {
          this.purchase.set(res.data.purchase);
        }
      },
      error: (err) => {
        this.messageService.showError('Error', 'Could not load purchase details.');
        this.router.navigate(['/purchaseu']);
      }
    });
  }

  // --- Helpers ---
  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (status) {
      case 'received': return 'success';
      case 'draft': return 'secondary';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  }

  getPaymentSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warn';
      case 'unpaid': return 'danger';
      default: return 'info';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  }

  downloadAttachment(url: string) {
    window.open(url, '_blank');
  }
}