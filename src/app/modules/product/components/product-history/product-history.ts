import { Component, Input, OnInit, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { finalize } from 'rxjs';
import { ProductService } from '../../services/product-service'; // Adjust path
import { DatePicker } from 'primeng/datepicker';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-product-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DatePicker,
    TagModule,
    TooltipModule
  ],
  templateUrl: './product-history.html',
  styleUrls: ['./product-history.scss']
})
export class ProductHistoryComponent implements OnInit, OnChanges {
   productId!: string;

  private productService = inject(ProductService);
  public config = inject(DynamicDialogConfig);

  history = signal<any[]>([]);
  loading = signal(false);

  // Filters
  dateRange: Date[] | undefined;

  ngOnInit() {
    this.productId = this.config.data?.id;

    if (this.productId) {
      this.loadHistory();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['productId'] && !changes['productId'].firstChange) {
      this.loadHistory();
    }
  }

  loadHistory() {
    this.loading.set(true);

    let start, end;
    if (this.dateRange && this.dateRange[0]) start = this.dateRange[0];
    if (this.dateRange && this.dateRange[1]) end = this.dateRange[1];

    this.productService.getProductHistory(this.productId, start, end)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: any) => {
          if (res.status === 'success') {
            this.history.set(res.data.history);
          }
        },
        error: (err) => console.error(err)
      });
  }

  getSeverity(type: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (type) {
      case 'SALE': return 'info'; // Blue
      case 'OPENING STOCK': return 'success'; // Green
      case 'ADJUSTMENT': return 'warn'; // Orange
      default: return 'secondary'; // Gray
    }
  }

  getTypeLabel(type: string): string {
    return type.replace('_', ' ');
  }
}