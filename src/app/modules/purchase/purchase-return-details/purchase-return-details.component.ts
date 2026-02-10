import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

import { PurchaseService } from '../purchase.service';

@Component({
  selector: 'app-purchase-return-details',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TableModule, 
    DividerModule, 
    TooltipModule,
    CurrencyPipe, 
    DatePipe
  ],
  templateUrl: './purchase-return-details.html',
  styleUrl: './purchase-return-details.scss'
})
export class PurchaseReturnDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private purchaseService = inject(PurchaseService);

  loading = signal(true);
  ret = signal<any>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.purchaseService.getReturnById(id).subscribe({
        next: (res: any) => {
          this.ret.set(res.data.data || res.data);
          this.loading.set(false);
        },
        error: () => this.router.navigate(['/purchase/returns'])
      });
    }
  }

  // ✅ FIX: Helper to prevent template type errors
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