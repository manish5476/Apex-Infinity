import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SegmentationChartComponent } from '../../reusable/segmentation-chart';

@Component({
  selector: 'customer-overview',
  standalone: true,
  imports: [CommonModule, SegmentationChartComponent],
  templateUrl: './customer-overview.html',
  styleUrls: ['./customer-overview.scss']
})
export class CustomerOverviewComponent {
  // Input: Data from /analytics/customer-insights (creditRisk array, churnCount)
  @Input() insights: any;

  // Input: Data from /analytics/customer-segmentation (Champion, Loyal, etc.)
  @Input() segmentation: any;

  // Input: Data from /analytics/customer-retention (LTV list)
  @Input() retention: any[] = [];

  get creditRiskCount(): number {
    return this.insights?.creditRisk?.length || 0;
  }
}