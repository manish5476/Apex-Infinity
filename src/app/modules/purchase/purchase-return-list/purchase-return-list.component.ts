import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Components
import { AgShareGrid } from "../../shared/components/ag-shared-grid";
import { PurchaseService } from '../purchase.service';
import { AppMessageService } from '../../../core/services/message.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-purchase-return-list',
  standalone: true,
  imports: [CommonModule, AgShareGrid],
  template: `
    <div class="list-page-container">
      <div class="themed-card mb-4 p-4 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold text-[var(--text-primary)]">Debit Notes (Purchase Returns)</h2>
          <p class="text-sm text-[var(--text-secondary)]">History of items returned to suppliers</p>
        </div>
      </div>

      <div class="list-grid-area themed-card grow-grid">
        <app-ag-share-grid 
          [columns]="columns" 
          [data]="data()" 
          [showActions]="false"
          (gridEvent)="onGridEvent($event)">
        </app-ag-share-grid>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .list-page-container { height: 100%; display: flex; flex-direction: column; background: var(--bg-primary); padding: var(--spacing-lg); }
    .grow-grid { flex: 1; min-height: 0; border: 1px solid var(--border-primary); border-radius: 12px; overflow: hidden; }
    .themed-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 12px; }
  `]
})
export class PurchaseReturnListComponent implements OnInit {
  private purchaseService = inject(PurchaseService);
  private router = inject(Router);
  private messageService = inject(AppMessageService);
  
  data = signal<any[]>([]);

  columns:any = [
    { 
      headerName: 'Date', 
      field: 'returnDate', 
      width: 120,
      valueFormatter: (p: any) => new Date(p.value).toLocaleDateString('en-IN')
    },
    { 
      headerName: 'Ref Invoice', 
      field: 'purchaseId.invoiceNumber', 
      width: 150,
      cellRenderer: (p: any) => `<span style="font-weight:700; color:var(--accent-primary); cursor:pointer;">${p.value || 'N/A'}</span>`,
      onCellClicked: (p: any) => this.router.navigate(['/purchase', p.data.purchaseId._id])
    },
    { 
      headerName: 'Supplier', 
      field: 'supplierId.companyName', 
      width: 220,
      cellRenderer: (p: any) => `<span style="font-weight:600; color:var(--text-primary)">${p.value}</span>`
    },
    { 
      headerName: 'Reason', 
      field: 'reason', 
      flex: 1,
      cellStyle: { color: 'var(--text-secondary)', fontStyle: 'italic' }
    },
    { 
      headerName: 'Refund Amount', 
      field: 'totalAmount', 
      width: 150, 
      type: 'rightAligned',
      cellStyle: { color: 'var(--color-error)', fontWeight: 'bold' },
      valueFormatter: (p: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(p.value)
    },
    {
      headerName: 'View',
      width: 80,
      cellRenderer: () => `<i class="pi pi-eye" style="color:var(--text-secondary); cursor:pointer;"></i>`,
      onCellClicked: (p: any) => this.router.navigate(['/purchase/returns', p.data._id])
    }
  ];
  isLoading: any;

ngOnInit() {
    this.isLoading.set(true);

    this.purchaseService.getAllReturns()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: any) => {
          // Safely extract the returns payload
          this.data.set(res.data?.returns || []);
        },
        error: (err) => {
          // Routed to your global HTTP error parser
          this.messageService.handleHttpError(err);
        }
      });
  }

  onGridEvent(event: any) {
    // Handle row clicks if not using specific column click handlers
  }
}