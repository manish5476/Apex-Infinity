import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker'; 
import { AnalyticsFacadeService } from '../../../../core/services/analytics-facade.service';

// Import Reusable Components
import { BranchComparisonComponent } from '../../reusable/branch-comparison';
import { RiskPanelComponent } from '../../reusable/risk-panel';
import { SegmentationChartComponent } from '../../reusable/segmentation-chart';
import { CustomerOverviewComponent } from '../customer-overview/customer-overview';
import { FinanceOverviewComponent } from '../finance-overview/finance-overview';
import { DashboardAnalyticsOverview } from '../dashboard-analytics-overview/dashboard-analytics-overview';


@Component({
  selector: 'admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePicker,
    BranchComparisonComponent,
    RiskPanelComponent,
    SegmentationChartComponent,
    DashboardAnalyticsOverview,
    FinanceOverviewComponent,
    CustomerOverviewComponent // Add to imports
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  // 1. Dependency Injection
  public facade = inject(AnalyticsFacadeService);

  // 2. State Management
  public activePreset = signal<'all' | 'month' | 'custom'>('all');
  public activeTab = signal<'overview' | 'finance' | 'customers'>('overview'); // Added 'customers'
  public dateRangeModel: Date[] | null = null;

  constructor() {
    effect(() => {
      if (this.facade.error()) {
        console.error('Dashboard Error:', this.facade.error());
      }
    });
  }

  ngOnInit() {
    this.facade.load();
  }

  applyPreset(type: 'all' | 'month') {
    this.activePreset.set(type);
    this.dateRangeModel = null; 

    if (type === 'all') {
      this.facade.load();
    } else if (type === 'month') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      this.facade.load(start, now);
    }
  }

  onDateChange() {
    if (this.dateRangeModel && this.dateRangeModel.length === 2 && this.dateRangeModel[1]) {
      this.activePreset.set('custom');
      const [start, end] = this.dateRangeModel;
      this.facade.load(start, end);
    }
  }
}