import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentDonutComponent } from '../../reusable/payment-donut';

@Component({
  selector: 'finance-overview',
  standalone: true,
  imports: [CommonModule, PaymentDonutComponent],
  templateUrl: './finance-overview.html',
  styleUrls: ['./finance-overview.scss']
})
export class FinanceOverviewComponent {
  // Input: Data from Branch Comparison API (Revenue, COGS, Gross Profit)
  @Input() profitability: any; 
  
  // Input: Payment Modes formatted for Chart { labels: [], values: [] }
  @Input() paymentChartData: any;      
  
  // Input: Aging Report List
  @Input() agingReport: any[] = [];

  // Input: Data from Tax API
  @Input() tax: any;           

  // Helper to format large numbers
  get marginPercent() {
    return this.profitability?.marginPercent || 0;
  }
}