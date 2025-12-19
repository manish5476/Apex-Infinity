import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker'; 
import { AnalyticsFacadeService } from '../../../../core/services/analytics-facade.service';

// Import Reusable Components
import { BranchComparisonComponent } from '../../reusable/branch-comparison';
import { RiskPanelComponent } from '../../reusable/risk-panel';
import { SegmentationChartComponent } from '../../reusable/segmentation-chart';
import { DashboardAnalyticsOverview } from '../dashboard-analytics-overview/dashboard-analytics-overview';
import { FinanceOverviewComponent } from '../finance-overview/finance-overview';


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
    FinanceOverviewComponent 
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  // 1. Dependency Injection
  public facade = inject(AnalyticsFacadeService);

  // 2. State Management
  public activePreset = signal<'all' | 'month' | 'custom'>('all');
  public activeTab = signal<'overview' | 'finance'>('overview'); // New Tab State
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

// import { Component, inject, signal, effect, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { DatePicker } from 'primeng/datepicker'; 
// import { AnalyticsFacadeService } from '../../../../core/services/analytics-facade.service';

// // Import Reusable Components
// import { BranchComparisonComponent } from '../../reusable/branch-comparison';
// import { RiskPanelComponent } from '../../reusable/risk-panel';
// import { SegmentationChartComponent } from '../../reusable/segmentation-chart';
// import { DashboardAnalyticsOverview } from '../dashboard-analytics-overview/dashboard-analytics-overview';
// import { FinanceOverviewComponent } from '../finance-overview/finance-overview';

// // Import New Overview Component

// @Component({
//   selector: 'admin-dashboard',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,FinanceOverviewComponent,
//     DatePicker,
//     BranchComparisonComponent,
//     RiskPanelComponent,
//     SegmentationChartComponent,
//     DashboardAnalyticsOverview 
//   ],
//   templateUrl: './admin-dashboard.component.html',
//   styleUrls: ['./admin-dashboard.component.scss']
// })
// export class AdminDashboardComponent implements OnInit {
//   // 1. Dependency Injection
//   public facade = inject(AnalyticsFacadeService);

//   // 2. State Management
//   public activePreset = signal<'all' | 'month' | 'custom'>('all');
//   public dateRangeModel: Date[] | null = null;

//   constructor() {
//     effect(() => {
//       if (this.facade.error()) {
//         console.error('Dashboard Error:', this.facade.error());
//       }
//     });
//   }

//   ngOnInit() {
//     this.facade.load();
//   }

//   applyPreset(type: 'all' | 'month') {
//     this.activePreset.set(type);
//     this.dateRangeModel = null; 

//     if (type === 'all') {
//       this.facade.load();
//     } else if (type === 'month') {
//       const now = new Date();
//       const start = new Date(now.getFullYear(), now.getMonth(), 1);
//       this.facade.load(start, now);
//     }
//   }

//   onDateChange() {
//     if (this.dateRangeModel && this.dateRangeModel.length === 2 && this.dateRangeModel[1]) {
//       this.activePreset.set('custom');
//       const [start, end] = this.dateRangeModel;
//       this.facade.load(start, end);
//     }
//   }
// }

// // import { Component, inject, signal, effect, OnInit } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { DatePicker } from 'primeng/datepicker'; // Assuming PrimeNG v18+ import structure
// // import { AnalyticsFacadeService } from '../../../../core/services/analytics-facade.service';

// // // Import Reusable Components
// // import { KpiCardComponent } from '../../reusable/kpi-card';
// // import { RevenueChartComponent } from '../../reusable/revenue-chart';
// // import { PaymentDonutComponent } from '../../reusable/payment-donut';
// // import { TopProductsComponent } from '../../reusable/top-products';
// // import { TopCustomersComponent } from '../../reusable/top-customer';
// // import { BranchComparisonComponent } from '../../reusable/branch-comparison';
// // import { RiskPanelComponent } from '../../reusable/risk-panel';
// // import { SegmentationChartComponent } from '../../reusable/segmentation-chart';
// // import { InventoryStatusComponent } from '../../reusable/inventory-status';

// // @Component({
// //   selector: 'admin-dashboard',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     FormsModule,
// //     DatePicker,
// //     KpiCardComponent,
// //     RevenueChartComponent,
// //     PaymentDonutComponent,
// //     TopProductsComponent,
// //     TopCustomersComponent,
// //     BranchComparisonComponent,
// //     RiskPanelComponent,
// //     SegmentationChartComponent,
// //     InventoryStatusComponent
// //   ],
// //   templateUrl: './admin-dashboard.component.html',
// //   styleUrls: ['./admin-dashboard.component.scss']
// // })
// // export class AdminDashboardComponent implements OnInit {
// //   // 1. Dependency Injection
// //   public facade = inject(AnalyticsFacadeService);

// //   // 2. State Management
// //   public activePreset = signal<'all' | 'month' | 'custom'>('all');
// //   public dateRangeModel: Date[] | null = null;
// //   public currentDate = signal<Date>(new Date());

// //   constructor() {
// //     // Optional: React to facade state changes for logging or side effects
// //     effect(() => {
// //       if (this.facade.error()) {
// //         console.error('Dashboard Error:', this.facade.error());
// //       }
// //     });
// //   }

// //   ngOnInit() {
// //     this.facade.load();
// //   }

// //   /**
// //    * Applies a date preset filter (All Time vs This Month)
// //    */
// //   applyPreset(type: 'all' | 'month') {
// //     this.activePreset.set(type);
// //     this.dateRangeModel = null; // Clear custom picker

// //     if (type === 'all') {
// //       this.facade.load();
// //     } else if (type === 'month') {
// //       const now = new Date();
// //       const start = new Date(now.getFullYear(), now.getMonth(), 1);
// //       this.facade.load(start, now);
// //     }
// //   }

// //   /**
// //    * Handles custom date range selection from PrimeNG DatePicker
// //    */
// //   onDateChange() {
// //     if (this.dateRangeModel && this.dateRangeModel.length === 2 && this.dateRangeModel[1]) {
// //       this.activePreset.set('custom');
// //       const [start, end] = this.dateRangeModel;
// //       this.facade.load(start, end);
// //     }
// //   }

// //   /**
// //    * Export handler mapping to the facade logic
// //    */
// //   onExport(type: 'sales' | 'inventory' | 'tax') {
// //     // Implementation for export trigger would go here
// //     // e.g. this.facade.exportData(type, ...);
// //     console.log(`Exporting ${type}...`);
// //   }
// // }

// // // import { Component, inject, signal, effect } from '@angular/core';
// // // import { AnalyticsFacadeService } from '../../../../core/services/analytics-facade.service';
// // // import { DatePicker } from "primeng/datepicker";
// // // import { FormsModule } from '@angular/forms';
// // // import { CommonModule } from '@angular/common';
// // // import { RevenueChartComponent } from "../../reusable/revenue-chart";
// // // import { ActivityLogComponent } from '../../reusable/activity-log';
// // // import { BranchComparisonComponent } from '../../reusable/branch-comparison';
// // // import { InventoryStatusComponent } from '../../reusable/inventory-status';
// // // import { KpiCardComponent } from '../../reusable/kpi-card';
// // // import { PaymentDonutComponent } from '../../reusable/payment-donut';
// // // import { RiskPanelComponent } from '../../reusable/risk-panel';
// // // import { SegmentationChartComponent } from '../../reusable/segmentation-chart';
// // // import { TopCustomersComponent } from '../../reusable/top-customer';
// // // import { TopProductsComponent } from '../../reusable/top-products';
// // // // ... other imports

// // // @Component({
// // //   standalone: true,
// // //   selector: 'admin-dashboard',
// // //   templateUrl: './admin-dashboard.component.html',
// // //   styleUrls: ['./admin-dashboard.component.scss'],
// // //   imports: [DatePicker, FormsModule, CommonModule, KpiCardComponent, RevenueChartComponent, PaymentDonutComponent, TopProductsComponent, TopCustomersComponent, BranchComparisonComponent, RiskPanelComponent, SegmentationChartComponent, InventoryStatusComponent]
// // // })
// // // export class AdminDashboardComponent {

// // //   facade = inject(AnalyticsFacadeService);

// // //   activePreset = signal<'all' | 'month' | 'custom'>('all');
// // //     dateRangeModel: Date[] | null = null; 
// // //   ngOnInit() {
// // //     this.facade.load();
// // //   }

// // //   applyPreset(type: 'all' | 'month') {
// // //     this.activePreset.set(type);
// // //     this.dateRangeModel = null; // Reset picker UI

// // //     if (type === 'all') return this.facade.load();

// // //     if (type === 'month') {
// // //       const now = new Date();
// // //       const start = new Date(now.getFullYear(), now.getMonth(), 1);
// // //       this.facade.load(start, now);
// // //     }
// // //   }

// // //   onDateChange() {
// // //     // PrimeNG updates 'dateRangeModel' automatically via ngModel
// // //     if (!this.dateRangeModel || this.dateRangeModel.length !== 2) return;
    
// // //     this.activePreset.set('custom');
// // //     const [start, end] = this.dateRangeModel;
    
// // //     // Pass to facade
// // //     this.facade.load(start, end);
// // //   }
// // // }