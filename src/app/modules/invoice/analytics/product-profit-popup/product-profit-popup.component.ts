import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice-service';

// --- Interfaces ---
export interface ProductSummary {
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  totalQuantity: number;
  averageSellingPrice: number;
  averageCostPrice: number;
  profitPerUnit: number;
  totalInvoices: number;
}

export interface SaleRecord {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface CustomerMetric {
  customerId: string;
  customerName: string;
  revenue: number;
  quantity: number;
  profit: number;
}

export interface MonthlyMetric {
  month: string;
  revenue: number;
  profit: number;
  quantity: number;
}

export interface ProductAnalyticsData {
  product: {
    name: string;
    sku: string;
    purchasePrice: number;
    sellingPrice: number;
  };
  summary: ProductSummary;
  recentSales: SaleRecord[];
  customerAnalysis: CustomerMetric[];
  timeAnalysis: MonthlyMetric[];
}

@Component({
  selector: 'app-product-profit-popup',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="popup-backdrop" (click)="closePopup()">
      
      <div class="product-profit-popup" (click)="$event.stopPropagation()">
        
        <div class="popup-header">
          <div class="header-content">
            <h2 class="popup-title">{{ productData()?.product?.name || 'Product Analytics' }}</h2>
            <span class="popup-sku">{{ productData()?.product?.sku || 'Loading...' }}</span>
          </div>
          <button class="close-btn" (click)="closePopup()">
            <i class="pi pi-times"></i>
          </button>
        </div>

        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Analyzing product performance...</p>
          </div>
        } 
        
        @else if (productData(); as data) {
          <div class="popup-content custom-scrollbar">
            
            <div class="price-info-row">
              <div class="price-pill cost">
                <span class="label">Purchase Price</span>
                <span class="value">{{ data.product.purchasePrice | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
              <div class="arrow-icon">→</div>
              <div class="price-pill selling">
                <span class="label">Selling Price</span>
                <span class="value">{{ data.product.sellingPrice | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
            </div>

            <div class="summary-grid">
              
              <div class="stat-card">
                <div class="stat-icon-wrapper revenue">
                  <span class="currency-symbol">₹</span>
                </div>
                <div class="stat-details">
                  <span class="stat-label">Total Revenue</span>
                  <span class="stat-value">{{ data.summary.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon-wrapper profit">
                  <i class="pi pi-chart-line"></i>
                </div>
                <div class="stat-details">
                  <span class="stat-label">Total Profit</span>
                  <span class="stat-value text-success">{{ data.summary.totalProfit | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon-wrapper margin">
                  <i class="pi pi-percentage"></i>
                </div>
                <div class="stat-details">
                  <span class="stat-label">Profit Margin</span>
                  <span class="stat-value">{{ data.summary.profitMargin }}%</span>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon-wrapper quantity">
                  <i class="pi pi-box"></i>
                </div>
                <div class="stat-details">
                  <span class="stat-label">Total Sold</span>
                  <span class="stat-value">{{ data.summary.totalQuantity }} <span class="unit">units</span></span>
                </div>
              </div>
            </div>

            <div class="metrics-section">
              <h3 class="section-heading">Efficiency Metrics</h3>
              <div class="metrics-grid">
                <div class="metric-item">
                  <span class="metric-label">Avg. Selling Price</span>
                  <span class="metric-value">{{ data.summary.averageSellingPrice | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Avg. Cost Price</span>
                  <span class="metric-value">{{ data.summary.averageCostPrice | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                <div class="metric-item highlight">
                  <span class="metric-label">Profit per Unit</span>
                  <span class="metric-value text-success">{{ data.summary.profitPerUnit | currency:'INR':'symbol':'1.0-0' }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Total Invoices</span>
                  <span class="metric-value">{{ data.summary.totalInvoices }}</span>
                </div>
              </div>
            </div>

            <div class="chart-section">
              <h3 class="section-heading">Monthly Profit Trend</h3>
              <div class="time-chart-container">
                @for (month of data.timeAnalysis; track month.month) {
                  <div class="month-column group">
                    <div class="chart-tooltip">
                      <div class="tooltip-header">{{ month.month }}</div>
                      <div class="tooltip-row"><span>Rev:</span> {{ month.revenue | currency:'INR':'symbol':'1.0-0' }}</div>
                      <div class="tooltip-row text-success"><span>Prof:</span> {{ month.profit | currency:'INR':'symbol':'1.0-0' }}</div>
                      <div class="tooltip-row"><span>Qty:</span> {{ month.quantity }}</div>
                    </div>
                    
                    <div class="bar-wrapper">
                      <div class="bar-fill" [style.height.%]="getBarHeight(month.profit)"></div>
                    </div>
                    
                    <span class="x-axis-label">{{ month.month | slice:0:3 }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="details-split">
              
              <div class="detail-column">
                <h3 class="section-heading">Recent Transactions</h3>
                <div class="table-container custom-scrollbar">
                  <table class="simple-table">
                    <thead>
                      <tr>
                        <th>Inv #</th>
                        <th>Date</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (sale of data.recentSales; track sale.invoiceId) {
                        <tr>
                          <td class="font-mono text-xs">{{ sale.invoiceNumber }}</td>
                          <td class="text-xs text-tertiary">{{ sale.invoiceDate | date:'shortDate' }}</td>
                          <td class="text-right text-xs">{{ sale.quantity }}</td>
                          <td class="text-right text-xs font-bold text-success">{{ sale.profit | currency:'INR':'symbol':'1.0-0' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="detail-column">
                <h3 class="section-heading">Top Customers</h3>
                <div class="customers-list custom-scrollbar">
                  @for (customer of data.customerAnalysis; track customer.customerId) {
                    <div class="customer-item">
                      <div class="customer-info">
                        <span class="customer-name">{{ customer.customerName }}</span>
                        <span class="customer-units">{{ customer.quantity }} units</span>
                      </div>
                      <div class="customer-financials">
                        <span class="customer-revenue">{{ customer.revenue | currency:'INR':'symbol':'1.0-0' }}</span>
                        <span class="customer-profit">+{{ customer.profit | currency:'INR':'symbol':'1.0-0' }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>

            </div>

          </div>
        }

        <div class="popup-footer">
          <button class="footer-btn secondary" (click)="closePopup()">Close</button>
          <button class="footer-btn primary" (click)="exportReport()">
            <i class="pi pi-download"></i> Export Report
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* --- OVERLAY & CONTAINER --- */
    .popup-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: 1100; /* Above everything */
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }

    .product-profit-popup {
      width: 800px;
      max-width: 90vw;
      height: 85vh;
      max-height: 900px;
      background: var(--bg-primary); /* Theme Token */
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--shadow-2xl);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--border-primary);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* --- HEADER --- */
    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg) var(--spacing-xl);
      border-bottom: 1px solid var(--border-secondary);
      background: var(--bg-secondary);
    }

    .header-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .popup-title {
      margin: 0;
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .popup-sku {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      font-family: var(--font-mono);
      background: var(--bg-ternary);
      padding: 2px 6px;
      border-radius: 4px;
      width: fit-content;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 1.2rem;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: var(--color-error-bg);
        color: var(--color-error);
      }
    }

    /* --- CONTENT AREA --- */
    .popup-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-xl);
      background: var(--bg-primary);
    }

    /* Price Info */
    .price-info-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
      padding: var(--spacing-md);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius);
      border: 1px solid var(--border-secondary);
    }

    .price-pill {
      text-align: center;
      
      .label {
        display: block;
        font-size: 10px;
        text-transform: uppercase;
        color: var(--text-tertiary);
        margin-bottom: 2px;
        font-weight: 600;
      }
      .value {
        font-size: var(--font-size-lg);
        font-weight: 700;
        color: var(--text-primary);
      }
    }

    .arrow-icon {
      color: var(--text-tertiary);
      font-size: 1.2rem;
    }

    /* Summary Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    .stat-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-md);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .stat-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;

      &.revenue { background: var(--bg-ternary); color: var(--accent-primary); }
      &.profit { background: var(--color-success-bg); color: var(--color-success); }
      &.margin { background: var(--color-warning-bg); color: var(--color-warning); }
      &.quantity { background: var(--accent-focus); color: var(--accent-secondary); }
    }

    .stat-details {
      display: flex;
      flex-direction: column;
      
      .stat-label { font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; font-weight: 600; }
      .stat-value { font-size: 16px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
      .unit { font-size: 10px; font-weight: 400; color: var(--text-secondary); }
      .text-success { color: var(--color-success); }
    }

    /* Metrics Grid */
    .section-heading {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-bottom: var(--spacing-md);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding-bottom: var(--spacing-xs);
      border-bottom: 1px solid var(--border-secondary);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    .metric-item {
      background: var(--bg-ternary);
      padding: var(--spacing-md);
      border-radius: var(--ui-border-radius);
      text-align: center;
      
      &.highlight { background: var(--color-success-bg); border: 1px solid var(--color-success-border); }

      .metric-label { display: block; font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; }
      .metric-value { font-size: 14px; font-weight: 700; color: var(--text-primary); }
      .text-success { color: var(--color-success); }
    }

    /* Chart Section */
    .chart-section { margin-bottom: var(--spacing-xl); }

    .time-chart-container {
      height: 160px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 4px;
      padding-top: 30px; /* Space for tooltips */
    }

    .month-column {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      cursor: pointer;

      &:hover {
        .bar-fill { opacity: 1; transform: scaleX(1.1); }
        .chart-tooltip { opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto; }
      }
    }

    .bar-wrapper {
      flex: 1;
      width: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      border-bottom: 1px solid var(--border-secondary);
      padding-bottom: 4px;
    }

    .bar-fill {
      width: 60%;
      background: var(--accent-primary);
      border-radius: 2px 2px 0 0;
      transition: all 0.2s;
      opacity: 0.7;
      min-height: 4px;
    }

    .x-axis-label {
      font-size: 10px;
      color: var(--text-tertiary);
      margin-top: 4px;
    }

    /* Tooltip */
    .chart-tooltip {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%) translateY(5px);
      background: var(--bg-ternary);
      border: 1px solid var(--border-primary);
      color: var(--text-primary);
      padding: 8px;
      border-radius: 6px;
      font-size: 10px;
      white-space: nowrap;
      opacity: 0;
      transition: all 0.2s;
      pointer-events: none;
      z-index: 10;
      box-shadow: var(--shadow-md);

      .tooltip-header { font-weight: bold; margin-bottom: 2px; border-bottom: 1px solid var(--border-secondary); padding-bottom: 2px; }
      .tooltip-row { display: flex; justify-content: space-between; gap: 8px; }
      .text-success { color: var(--color-success); font-weight: bold; }
    }

    /* Split Details */
    .details-split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-xl);
    }

    .detail-column {
      display: flex;
      flex-direction: column;
      height: 300px;
    }

    /* Tables & Lists */
    .table-container {
      overflow-y: auto;
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
    }

    .simple-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;

      th {
        text-align: left;
        padding: 8px 12px;
        background: var(--bg-ternary);
        color: var(--text-secondary);
        font-weight: 600;
        position: sticky; top: 0;
      }
      
      td {
        padding: 8px 12px;
        border-bottom: 1px solid var(--border-secondary);
        color: var(--text-primary);
      }
      
      .text-right { text-align: right; }
      .text-success { color: var(--color-success); }
      .text-tertiary { color: var(--text-tertiary); }
      .font-mono { font-family: var(--font-mono); }
    }

    .customers-list {
      overflow-y: auto;
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      background: var(--bg-secondary);
    }

    .customer-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-secondary);
      
      &:last-child { border-bottom: none; }

      .customer-info {
        display: flex;
        flex-direction: column;
        .customer-name { font-weight: 600; font-size: 12px; color: var(--text-primary); }
        .customer-units { font-size: 10px; color: var(--text-tertiary); }
      }

      .customer-financials {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        .customer-revenue { font-size: 12px; color: var(--text-primary); }
        .customer-profit { font-size: 10px; color: var(--color-success); font-weight: 600; }
      }
    }

    /* Footer */
    .popup-footer {
      padding: var(--spacing-md) var(--spacing-xl);
      border-top: 1px solid var(--border-secondary);
      background: var(--bg-secondary);
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
    }

    .footer-btn {
      padding: 8px 16px;
      border-radius: var(--ui-border-radius);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
      display: flex; align-items: center; gap: 6px;

      &.secondary {
        background: transparent;
        border-color: var(--border-primary);
        color: var(--text-secondary);
        &:hover { background: var(--bg-ternary); color: var(--text-primary); }
      }

      &.primary {
        background: var(--accent-primary);
        color: white;
        &:hover { background: var(--accent-hover); }
      }
    }

    /* Loading */
    .loading-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);
      
      .spinner {
        width: 32px; height: 32px;
        border: 3px solid var(--border-secondary);
        border-top-color: var(--accent-primary);
        border-radius: 50%;
        animation: spin 1s infinite linear;
        margin-bottom: 12px;
      }
    }

    /* Scrollbar Utility */
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 2px; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Responsive */
    @media(max-width: 768px) {
      .summary-grid, .metrics-grid { grid-template-columns: 1fr 1fr; }
      .details-split { grid-template-columns: 1fr; }
      .product-profit-popup { height: 100vh; width: 100vw; max-width: none; max-height: none; border-radius: 0; }
    }
  `]
})
export class ProductProfitPopupComponent implements OnInit {
  @Input() productId!: string;
  @Output() close = new EventEmitter<void>(); // Event to notify parent to close

  private invoiceService = inject(InvoiceService);
  
  loading = signal(false);
  productData = signal<ProductAnalyticsData | null>(null);
  maxMonthlyProfit = 0;

  ngOnInit(): void {
    if(this.productId) {
      this.loadProductAnalytics();
    }
  }

  loadProductAnalytics(): void {
    this.loading.set(true);
    this.invoiceService.getProductProfitAnalysis(this.productId).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          this.productData.set(response.data);
          this.calculateMaxMonthlyProfit(response.data.timeAnalysis);
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading analytics:', error);
        this.loading.set(false);
      }
    });
  }

  calculateMaxMonthlyProfit(data: MonthlyMetric[]): void {
    if (data && data.length) {
      this.maxMonthlyProfit = Math.max(...data.map(m => m.profit || 0));
    }
  }

  getBarHeight(profit: number): number {
    if (!this.maxMonthlyProfit) return 0;
    const pct = (profit / this.maxMonthlyProfit) * 100;
    return Math.max(5, Math.min(pct, 100)); // Min 5% height
  }

  closePopup(): void {
    this.close.emit();
  }

  exportReport(): void {
    console.log('Exporting report for:', this.productId);
    // Implement actual export logic here
  }
}


// // components/product-profit-popup/product-profit-popup.component.ts
// import { Component, Input, OnInit, inject } from '@angular/core';
// import { CommonModule, CurrencyPipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { InvoiceService } from '../../services/invoice-service';

// @Component({
//   selector: 'app-product-profit-popup',
//   standalone: true,
//   imports: [CommonModule,CurrencyPipe, FormsModule],
//   template: `
//     <div class="product-profit-popup">
//       <div class="popup-header">
//         <h2>{{ productData.product.name || 'Product Analytics' }}</h2>
//         <button class="close-btn" (click)="close()">&times;</button>
//       </div>

//       @if (loading) {
//         <div class="loading">
//           <div class="spinner"></div>
//           <p>Loading product analytics...</p>
//         </div>
//       } @else if (productData) {
//         <div class="popup-content">
//           <!-- Product Info -->
//           <div class="product-info">
//             <div class="info-row">
//               <span class="label">SKU:</span>
//               <span class="value">{{ productData.product.sku || 'N/A' }}</span>
//             </div>
//             <div class="info-row">
//               <span class="label">Purchase Price:</span>
//               <span class="value">{{ productData.product.purchasePrice | currency:'INR':'symbol':'1.0-0' }}</span>
//             </div>
//             <div class="info-row">
//               <span class="label">Selling Price:</span>
//               <span class="value">{{ productData.product.sellingPrice | currency:'INR':'symbol':'1.0-0' }}</span>
//             </div>
//           </div>

//           <!-- Summary Stats -->
//           <div class="summary-grid">
//             <div class="stat-card">
//               <div class="stat-icon revenue">₹</div>
//               <div class="stat-content">
//                 <span class="stat-label">Total Revenue</span>
//                 <span class="stat-value">{{ productData.summary.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</span>
//               </div>
//             </div>

//             <div class="stat-card">
//               <div class="stat-icon profit">↑</div>
//               <div class="stat-content">
//                 <span class="stat-label">Total Profit</span>
//                 <span class="stat-value">{{ productData.summary.totalProfit | currency:'INR':'symbol':'1.0-0' }}</span>
//               </div>
//             </div>

//             <div class="stat-card">
//               <div class="stat-icon margin">%</div>
//               <div class="stat-content">
//                 <span class="stat-label">Profit Margin</span>
//                 <span class="stat-value">{{ productData.summary.profitMargin }}%</span>
//               </div>
//             </div>

//             <div class="stat-card">
//               <div class="stat-icon quantity">#</div>
//               <div class="stat-content">
//                 <span class="stat-label">Quantity Sold</span>
//                 <span class="stat-value">{{ productData.summary.totalQuantity }}</span>
//               </div>
//             </div>
//           </div>

//           <!-- Detailed Metrics -->
//           <div class="metrics-section">
//             <h3>Performance Metrics</h3>
//             <div class="metrics-grid">
//               <div class="metric">
//                 <span class="metric-label">Avg. Selling Price</span>
//                 <span class="metric-value">{{ productData.summary.averageSellingPrice | currency:'INR':'symbol':'1.0-0' }}</span>
//               </div>
//               <div class="metric">
//                 <span class="metric-label">Avg. Cost Price</span>
//                 <span class="metric-value">{{ productData.summary.averageCostPrice | currency:'INR':'symbol':'1.0-0' }}</span>
//               </div>
//               <div class="metric">
//                 <span class="metric-label">Profit per Unit</span>
//                 <span class="metric-value">{{ productData.summary.profitPerUnit | currency:'INR':'symbol':'1.0-0' }}</span>
//               </div>
//               <div class="metric">
//                 <span class="metric-label">Total Invoices</span>
//                 <span class="metric-value">{{ productData.summary.totalInvoices }}</span>
//               </div>
//             </div>
//           </div>

//           <!-- Recent Sales -->
//           <div class="recent-sales">
//             <h3>Recent Sales</h3>
//             <table>
//               <thead>
//                 <tr>
//                   <th>Invoice #</th>
//                   <th>Date</th>
//                   <th>Quantity</th>
//                   <th>Revenue</th>
//                   <th>Profit</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 @for (sale of productData.recentSales; track sale.invoiceId) {
//                   <tr>
//                     <td>{{ sale.invoiceNumber }}</td>
//                     <td>{{ sale.invoiceDate | date:'shortDate' }}</td>
//                     <td>{{ sale.quantity }}</td>
//                     <td>{{ sale.revenue | currency:'INR':'symbol':'1.0-0' }}</td>
//                     <td>{{ sale.profit | currency:'INR':'symbol':'1.0-0' }}</td>
//                   </tr>
//                 }
//               </tbody>
//             </table>
//           </div>

//           <!-- Customer Analysis -->
//           <div class="customer-analysis">
//             <h3>Top Customers</h3>
//             <div class="customers-list">
//               @for (customer of productData.customerAnalysis; track customer.customerId) {
//                 <div class="customer-item">
//                   <span class="customer-name">{{ customer.customerName }}</span>
//                   <div class="customer-stats">
//                     <span class="stat">₹{{ customer.revenue | currency:'INR':'symbol':'1.0-0' }}</span>
//                     <span class="stat">{{ customer.quantity }} units</span>
//                     <span class="stat profit">₹{{ customer.profit | currency:'INR':'symbol':'1.0-0' }}</span>
//                   </div>
//                 </div>
//               }
//             </div>
//           </div>

//           <!-- Time Analysis -->
//           <div class="time-analysis">
//             <h3>Monthly Performance</h3>
//             <div class="time-chart">
//               @for (month of productData.timeAnalysis; track month.month) {
//                 <div class="month-bar">
//                   <div class="bar-label">{{ month.month }}</div>
//                   <div class="bar-container">
//                     <div class="bar-fill" [style.width.%]="(month.profit / maxMonthlyProfit) * 100">
//                       <span class="bar-value">₹{{ month.profit | currency:'INR':'symbol':'1.0-0' }}</span>
//                     </div>
//                   </div>
//                   <div class="bar-stats">
//                     <span>Revenue: ₹{{ month.revenue | currency:'INR':'symbol':'1.0-0' }}</span>
//                     <span>Qty: {{ month.quantity }}</span>
//                   </div>
//                 </div>
//               }
//             </div>
//           </div>
//         </div>
//       }

//       <div class="popup-footer">
//         <button class="btn btn-secondary" (click)="close()">Close</button>
//         <button class="btn btn-primary" (click)="exportReport()">
//           <i class="icon-download"></i> Export Report
//         </button>
//       </div>
//     </div>
//   `,
//   styles: [`
//     .product-profit-popup {
//       width: 900px;
//       max-width: 95vw;
//       max-height: 90vh;
//       background: white;
//       border-radius: var(--ui-border-radius-lg);
//       box-shadow: var(--shadow-3xl);
//       display: flex;
//       flex-direction: column;
//     }

//     .popup-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: var(--spacing-xl);
//       border-bottom: 1px solid #e2e8f0;
//       background: #f8fafc;
//       border-radius: var(--ui-border-radius-lg) var(--ui-border-radius-lg) 0 0;
//     }

//     .popup-header h2 {
//       margin: 0;
//       font-size: var(--font-size-2xl);
//       color: #1e293b;
//     }

//     .close-btn {
//       background: none;
//       border: none;
//       font-size: 24px;
//       color: #64748b;
//       cursor: pointer;
//       padding: var(--spacing-xs);
//       line-height: 1;
//       transition: var(--transition-base);
//     }

//     .close-btn:hover {
//       color: #ef4444;
//       transform: scale(1.1);
//     }

//     .loading {
//       padding: var(--spacing-3xl);
//       text-align: center;
//       color: #64748b;
//     }

//     .spinner {
//       width: 40px;
//       height: 40px;
//       border: 3px solid #e2e8f0;
//       border-top-color: #3b82f6;
//       border-radius: 50%;
//       animation: spin 1s linear infinite;
//       margin: 0 auto var(--spacing-lg);
//     }

//     .popup-content {
//       flex: 1;
//       overflow-y: auto;
//       padding: var(--spacing-xl);
//     }

//     /* Product Info */
//     .product-info {
//       display: grid;
//       grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
//       gap: var(--spacing-lg);
//       margin-bottom: var(--spacing-2xl);
//       padding-bottom: var(--spacing-xl);
//       border-bottom: 1px solid #e2e8f0;
//     }

//     .info-row {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xs);
//     }

//     .label {
//       font-size: var(--font-size-xs);
//       color: #64748b;
//       text-transform: uppercase;
//       letter-spacing: 0.5px;
//     }

//     .value {
//       font-size: var(--font-size-md);
//       font-weight: var(--font-weight-medium);
//       color: #334155;
//     }

//     /* Summary Grid */
//     .summary-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
//       gap: var(--spacing-lg);
//       margin-bottom: var(--spacing-2xl);
//     }

//     .stat-card {
//       background: #f8fafc;
//       border-radius: var(--ui-border-radius);
//       padding: var(--spacing-lg);
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-lg);
//       border: 1px solid #e2e8f0;
//       transition: var(--transition-base);
//     }

//     .stat-card:hover {
//       border-color: #cbd5e1;
//       box-shadow: var(--shadow-sm);
//     }

//     .stat-icon {
//       width: 48px;
//       height: 48px;
//       border-radius: 50%;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: var(--font-size-xl);
//       font-weight: var(--font-weight-bold);
//     }

//     .stat-icon.revenue {
//       background: #dbeafe;
//       color: #1e40af;
//     }

//     .stat-icon.profit {
//       background: #dcfce7;
//       color: #166534;
//     }

//     .stat-icon.margin {
//       background: #fef3c7;
//       color: #92400e;
//     }

//     .stat-icon.quantity {
//       background: #f3e8ff;
//       color: #6b21a8;
//     }

//     .stat-content {
//       flex: 1;
//     }

//     .stat-label {
//       display: block;
//       font-size: var(--font-size-xs);
//       color: #64748b;
//       margin-bottom: var(--spacing-xs);
//     }

//     .stat-value {
//       display: block;
//       font-size: var(--font-size-xl);
//       font-weight: var(--font-weight-bold);
//       color: #334155;
//     }

//     /* Metrics Section */
//     .metrics-section {
//       margin-bottom: var(--spacing-2xl);
//     }

//     .metrics-section h3 {
//       font-size: var(--font-size-lg);
//       color: #1e293b;
//       margin-bottom: var(--spacing-lg);
//     }

//     .metrics-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
//       gap: var(--spacing-lg);
//     }

//     .metric {
//       background: white;
//       border: 1px solid #e2e8f0;
//       border-radius: var(--ui-border-radius);
//       padding: var(--spacing-lg);
//     }

//     .metric-label {
//       display: block;
//       font-size: var(--font-size-sm);
//       color: #64748b;
//       margin-bottom: var(--spacing-sm);
//     }

//     .metric-value {
//       display: block;
//       font-size: var(--font-size-lg);
//       font-weight: var(--font-weight-semibold);
//       color: #334155;
//     }

//     /* Recent Sales */
//     .recent-sales {
//       margin-bottom: var(--spacing-2xl);
//     }

//     .recent-sales h3 {
//       font-size: var(--font-size-lg);
//       color: #1e293b;
//       margin-bottom: var(--spacing-lg);
//     }

//     table {
//       width: 100%;
//       border-collapse: collapse;
//       font-size: var(--font-size-sm);
//     }

//     thead {
//       background: #f8fafc;
//       border-bottom: 2px solid #e2e8f0;
//     }

//     th {
//       padding: var(--spacing-md);
//       text-align: left;
//       font-weight: var(--font-weight-semibold);
//       color: #475569;
//       white-space: nowrap;
//     }

//     td {
//       padding: var(--spacing-md);
//       border-bottom: 1px solid #e2e8f0;
//       color: #334155;
//     }

//     tr:hover {
//       background: #f8fafc;
//     }

//     /* Customer Analysis */
//     .customer-analysis {
//       margin-bottom: var(--spacing-2xl);
//     }

//     .customer-analysis h3 {
//       font-size: var(--font-size-lg);
//       color: #1e293b;
//       margin-bottom: var(--spacing-lg);
//     }

//     .customers-list {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-md);
//     }

//     .customer-item {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: var(--spacing-lg);
//       background: #f8fafc;
//       border-radius: var(--ui-border-radius);
//       border: 1px solid #e2e8f0;
//     }

//     .customer-name {
//       font-weight: var(--font-weight-medium);
//       color: #334155;
//     }

//     .customer-stats {
//       display: flex;
//       gap: var(--spacing-lg);
//       align-items: center;
//     }

//     .customer-stats .stat {
//       padding: var(--spacing-xs) var(--spacing-md);
//       background: white;
//       border-radius: var(--ui-border-radius-sm);
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-medium);
//     }

//     .customer-stats .stat.profit {
//       background: #dcfce7;
//       color: #166534;
//     }

//     /* Time Analysis */
//     .time-analysis {
//       margin-bottom: var(--spacing-xl);
//     }

//     .time-analysis h3 {
//       font-size: var(--font-size-lg);
//       color: #1e293b;
//       margin-bottom: var(--spacing-lg);
//     }

//     .time-chart {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-lg);
//     }

//     .month-bar {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-lg);
//     }

//     .bar-label {
//       width: 80px;
//       font-size: var(--font-size-sm);
//       color: #64748b;
//     }

//     .bar-container {
//       flex: 1;
//       height: 30px;
//       background: #f1f5f9;
//       border-radius: var(--ui-border-radius-sm);
//       overflow: hidden;
//       position: relative;
//     }

//     .bar-fill {
//       height: 100%;
//       background: linear-gradient(90deg, #3b82f6, #8b5cf6);
//       border-radius: var(--ui-border-radius-sm);
//       position: relative;
//       transition: width 0.5s ease;
//     }

//     .bar-value {
//       position: absolute;
//       right: var(--spacing-sm);
//       top: 50%;
//       transform: translateY(-50%);
//       font-size: var(--font-size-xs);
//       color: white;
//       font-weight: var(--font-weight-medium);
//       text-shadow: 0 1px 2px rgba(0,0,0,0.2);
//     }

//     .bar-stats {
//       display: flex;
//       gap: var(--spacing-lg);
//       font-size: var(--font-size-xs);
//       color: #64748b;
//     }

//     /* Popup Footer */
//     .popup-footer {
//       padding: var(--spacing-xl);
//       border-top: 1px solid #e2e8f0;
//       display: flex;
//       justify-content: flex-end;
//       gap: var(--spacing-lg);
//       background: #f8fafc;
//       border-radius: 0 0 var(--ui-border-radius-lg) var(--ui-border-radius-lg);
//     }

//     .btn {
//       padding: var(--spacing-md) var(--spacing-xl);
//       border-radius: var(--ui-border-radius);
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-medium);
//       cursor: pointer;
//       transition: var(--transition-base);
//       border: 1px solid transparent;
//       display: inline-flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//     }

//     .btn-secondary {
//       background: white;
//       border-color: #cbd5e1;
//       color: #334155;
//     }

//     .btn-secondary:hover {
//       background: #f8fafc;
//       border-color: #94a3b8;
//       box-shadow: var(--shadow-sm);
//     }

//     .btn-primary {
//       background: #3b82f6;
//       border-color: #3b82f6;
//       color: white;
//     }

//     .btn-primary:hover {
//       background: #2563eb;
//       border-color: #2563eb;
//       box-shadow: var(--shadow-md);
//     }

//     @keyframes spin {
//       to { transform: rotate(360deg); }
//     }
//   `]
// })
// export class ProductProfitPopupComponent implements OnInit {
//   @Input() productId!: string;
//   private invoiceService = inject(InvoiceService);
//   loading = false;
//   productData: any = null;
//   maxMonthlyProfit = 0;

//   ngOnInit(): void {
//     this.loadProductAnalytics();
//   }

//   loadProductAnalytics(): void {
//     this.loading = true;
//     this.invoiceService.getProductProfitAnalysis(this.productId).subscribe({
//       next: (response: any) => {
//         if (response.status === 'success') {
//           this.productData = response.data;
//           this.calculateMaxMonthlyProfit();
//         }
//         this.loading = false;
//       },
//       error: (error: any) => {
//         console.error('Error loading product analytics:', error);
//         this.loading = false;
//       }
//     });
//   }

//   calculateMaxMonthlyProfit(): void {
//     if (this.productData.timeAnalysis) {
//       this.maxMonthlyProfit = Math.max(
//         ...this.productData.timeAnalysis.map((month: any) => month.profit || 0)
//       );
//     }
//   }

//   close(): void {
//     // Implement close logic (emit event or use modal service)
//   }

//   exportReport(): void {
//     // Implement export logic
//   }
// }