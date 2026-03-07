import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker'; 
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog'; // 🟢 Added DynamicDialogRef
import { finalize } from 'rxjs';
import { ProductService } from '../../services/product-service';
import { AppMessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-product-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DatePickerModule,
    TagModule,
    TooltipModule
  ],
  templateUrl: './product-history.html',
  styleUrls: ['./product-history.scss'] // Assuming you will add SCSS next
})
export class ProductHistoryComponent implements OnInit {
  // Signals
  history = signal<any[]>([]);
  loading = signal(false);
  
  // Injections
  private productService = inject(ProductService);
  public config = inject(DynamicDialogConfig);
  public messageService = inject(AppMessageService);
  public ref = inject(DynamicDialogRef); // 🟢 For closing the dialog
  
  // State
  productId!: string;
  dateRange: Date[] | undefined;

  ngOnInit() {
    // 🟢 Read ID from config.data.productId (which we set in the dynamic-dialog.service.ts)
    if (this.config?.data?.productId) {
      this.productId = this.config.data.productId;
      this.loadHistory();
    }
  }

  loadHistory() {
    if (!this.productId) return;

    this.loading.set(true);
    
    // Defensive coding for dates
    const start = this.dateRange?.[0] ? this.formatDateForApi(this.dateRange[0]) : undefined;
    const end = this.dateRange?.[1] ? this.formatDateForApi(this.dateRange[1]) : undefined;

    this.productService.getProductHistory(this.productId, start, end)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: any) => {
          if (res.status === 'success') {
            this.history.set(res.data.history);
          } else {
            // Added fallback warning if the payload structure is unexpected
            this.messageService.showWarn('Could not retrieve complete product history.');
          }
        },
        error: (err) => {
          // Replaced console.error with the global HTTP handler
          this.messageService.handleHttpError(err);
        }
      });
  }

  // 🟢 Helper to format dates correctly for the backend
  private formatDateForApi(date: Date): string {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }

  getSeverity(type: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (type?.toUpperCase()) {
      case 'SALE': return 'warn';          // Yellow for outbound
      case 'OPENING STOCK': return 'info';  // Blue for initial
      case 'PURCHASE': return 'success';    // Green for inbound
      case 'PURCHASE_RETURN': return 'danger'; // Red for outbound return
      case 'ADJUSTMENT': return 'secondary';// Grey for manual edits
      default: return 'secondary';
    }
  }

  getTypeLabel(type: string): string {
    return type ? type.replace(/_/g, ' ') : 'UNKNOWN';
  }
}
// export class ProductHistoryComponent implements OnInit {
//   // Signals
//   history = signal<any[]>([]);
//   loading = signal(false);
  
//   // Injections
//   private productService = inject(ProductService);
//   public config = inject(DynamicDialogConfig);
//   public messageService = inject(AppMessageService);
//   public ref = inject(DynamicDialogRef); // 🟢 For closing the dialog
  
//   // State
//   productId!: string;
//   dateRange: Date[] | undefined;

//   ngOnInit() {
//     // 🟢 Read ID from config.data.productId (which we set in the dynamic-dialog.service.ts)
//     if (this.config?.data?.productId) {
//       this.productId = this.config.data.productId;
//       this.loadHistory();
//     }
//   }

//   loadHistory() {
//     if (!this.productId) return;

//     this.loading.set(true);
    
//     // Defensive coding for dates
//     const start = this.dateRange?.[0] ? this.formatDateForApi(this.dateRange[0]) : undefined;
//     const end = this.dateRange?.[1] ? this.formatDateForApi(this.dateRange[1]) : undefined;

//     this.productService.getProductHistory(this.productId, start, end)
//       .pipe(finalize(() => this.loading.set(false)))
//       .subscribe({
//         next: (res: any) => {
//           if (res.status === 'success') {
//             this.history.set(res.data.history);
//           }
//         },
//         error: (err) => console.error('History load failed', err)
//       });
//   }

//   // 🟢 Helper to format dates correctly for the backend
//   private formatDateForApi(date: Date): string {
//     const offset = date.getTimezoneOffset();
//     const localDate = new Date(date.getTime() - (offset * 60 * 1000));
//     return localDate.toISOString().split('T')[0];
//   }

//   getSeverity(type: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
//     switch (type?.toUpperCase()) {
//       case 'SALE': return 'warn';           // Yellow for outbound
//       case 'OPENING STOCK': return 'info';  // Blue for initial
//       case 'PURCHASE': return 'success';    // Green for inbound
//       case 'PURCHASE_RETURN': return 'danger'; // Red for outbound return
//       case 'ADJUSTMENT': return 'secondary';// Grey for manual edits
//       default: return 'secondary';
//     }
//   }

//   getTypeLabel(type: string): string {
//     return type ? type.replace(/_/g, ' ') : 'UNKNOWN';
//   }
// }