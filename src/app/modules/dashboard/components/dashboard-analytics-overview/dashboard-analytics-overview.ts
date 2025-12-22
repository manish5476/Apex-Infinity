import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from '../../reusable/kpi-card';
import { RevenueChartComponent } from '../../reusable/revenue-chart';
import { PaymentDonutComponent } from '../../reusable/payment-donut';
import { TopProductsComponent } from '../../reusable/top-products';
import { TopCustomersComponent } from '../../reusable/top-customer';
import { InventoryStatusComponent } from '../../reusable/inventory-status';

/**
 * PURE COMPONENT: Dashboard Overview
 * * Responsibilities:
 * - Visualizes the specific "Dashboard Overview" API data structure.
 * - Handles Layout for KPIs, Charts, Leaders, and Inventory Snapshot.
 * - Stateless (receives data via Inputs).
 */
@Component({
  selector: 'dashboard-overview',
 imports: [
    CommonModule,
    KpiCardComponent,
    RevenueChartComponent,
    PaymentDonutComponent,
    TopProductsComponent,
    TopCustomersComponent,
    InventoryStatusComponent
  ],
    templateUrl: './dashboard-analytics-overview.html',
  styleUrl: './dashboard-analytics-overview.scss',
})
export class DashboardAnalyticsOverview {
// === Data Inputs ===
  @Input() kpi: any;
  @Input() timeline: any;
  @Input() paymentModes: any;
  @Input() leaders: any;
  @Input() inventory: any;

  // Helpers
  get products() { return this.leaders?.topProducts ?? []; }
  get customers() { return this.leaders?.topCustomers ?? []; }
}