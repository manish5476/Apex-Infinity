import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { PurchaseService } from '../purchase.service';
import { AppMessageService } from '../../../core/services/message.service';
import { finalize } from 'rxjs';
@Component({
  selector: 'app-purchase-return-details',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, DividerModule, TooltipModule,CurrencyPipe, DatePipe  ],
  templateUrl: './purchase-return-details.html',
  styleUrl: './purchase-return-details.scss'
})
export class PurchaseReturnDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private purchaseService = inject(PurchaseService);
  private messageService = inject(AppMessageService);

  loading = signal(true);
  ret = signal<any>(null);
ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    
    // Fast exit with feedback if the URL is missing the ID
    if (!id) {
      this.messageService.showError('Invalid Route: Return ID is missing.');
      this.router.navigate(['/purchase/returns']);
      return;
    }

    this.loading.set(true);
    this.purchaseService.getReturnById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: any) => {
          // Safely extract the data payload
          const data = res.data?.data || res.data;
          this.ret.set(data);
        },
        error: (err) => {
          this.messageService.handleHttpError(err);
          this.router.navigate(['/purchase/returns']);
        }
      });
  }

  formatId(id: any): string {
    if (!id) return '';
    return String(id).slice(-8).toUpperCase();
  }

  goBack() {
    this.router.navigate(['/purchase/returns']);
  }

  goToInvoice(id: string) {
    if(id) this.router.navigate(['/purchase', id]);
  }

  print() {
    window.print();
  }
}