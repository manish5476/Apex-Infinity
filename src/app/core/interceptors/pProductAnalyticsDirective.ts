import { Directive, HostListener, Input, inject } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { ProductAnalyticsDialogComponent } from '../../modules/invoice/analytics/invoice-analytics/productanalytics';

@Directive({
  selector: '[appProductAnalytics]',
  standalone: true,
  providers: [DialogService] // Provides service locally if not global
})
export class ProductAnalyticsDirective {
  @Input('appProductAnalytics') productId!: string;
  
  private dialogService = inject(DialogService);

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    event.stopPropagation(); // Prevent row selection if inside a table
    event.preventDefault();
    if (!this.productId) return;
    this.dialogService.open(ProductAnalyticsDialogComponent, {
      data: {
        productId: this.productId
      },
      header: ' ', 
      width: '700px',
      contentStyle: { "padding": "0" }, // Reset padding for edge-to-edge look
      styleClass: 'product-analytics-dialog-wrapper',
      baseZIndex: 10000,
      maximizable: true,
      dismissableMask: true
    });
  }
}