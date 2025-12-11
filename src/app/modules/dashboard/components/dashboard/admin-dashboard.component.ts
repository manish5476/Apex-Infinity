import { Component, inject, signal, effect } from '@angular/core';
import { AnalyticsFacadeService } from '../../../../core/services/analytics-facade.service';
import { DatePicker } from "primeng/datepicker";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RevenueChartComponent } from "../../reusable/revenue-chart";
import { ActivityLogComponent } from '../../reusable/activity-log';
import { BranchComparisonComponent } from '../../reusable/branch-comparison';
import { InventoryStatusComponent } from '../../reusable/inventory-status';
import { KpiCardComponent } from '../../reusable/kpi-card';
import { PaymentDonutComponent } from '../../reusable/payment-donut';
import { RiskPanelComponent } from '../../reusable/risk-panel';
import { SegmentationChartComponent } from '../../reusable/segmentation-chart';
import { TopCustomersComponent } from '../../reusable/top-customer';
import { TopProductsComponent } from '../../reusable/top-products';
// ... other imports

@Component({
  standalone: true,
  selector: 'admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  imports: [DatePicker, FormsModule, CommonModule, KpiCardComponent, RevenueChartComponent, PaymentDonutComponent, TopProductsComponent, TopCustomersComponent, BranchComparisonComponent, RiskPanelComponent, SegmentationChartComponent, InventoryStatusComponent]
})
export class AdminDashboardComponent {

  facade = inject(AnalyticsFacadeService);

  activePreset = signal<'all' | 'month' | 'custom'>('all');
    dateRangeModel: Date[] | null = null; 
  ngOnInit() {
    this.facade.load();
  }

  applyPreset(type: 'all' | 'month') {
    this.activePreset.set(type);
    this.dateRangeModel = null; // Reset picker UI

    if (type === 'all') return this.facade.load();

    if (type === 'month') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      this.facade.load(start, now);
    }
  }

  onDateChange() {
    // PrimeNG updates 'dateRangeModel' automatically via ngModel
    if (!this.dateRangeModel || this.dateRangeModel.length !== 2) return;
    
    this.activePreset.set('custom');
    const [start, end] = this.dateRangeModel;
    
    // Pass to facade
    this.facade.load(start, end);
  }
}