// components/product-profit-popup/product-profit-popup.component.ts
import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice-service';

@Component({
  selector: 'app-product-profit-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="product-profit-popup">
      <div class="popup-header">
        <h2>{{ productData?.product?.name || 'Product Analytics' }}</h2>
        <button class="close-btn" (click)="close()">&times;</button>
      </div>

      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading product analytics...</p>
        </div>
      } @else if (productData) {
        <div class="popup-content">
          <!-- Product Info -->
          <div class="product-info">
            <div class="info-row">
              <span class="label">SKU:</span>
              <span class="value">{{ productData.product?.sku || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Purchase Price:</span>
              <span class="value">{{ productData.product?.purchasePrice | currency:'INR':'symbol':'1.0-0' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Selling Price:</span>
              <span class="value">{{ productData.product?.sellingPrice | currency:'INR':'symbol':'1.0-0' }}</span>
            </div>
          </div>

          <!-- Summary Stats -->
          <div class="summary-grid">
            <div class="stat-card">
              <div class="stat-icon revenue">₹</div>
              <div class="stat-content">
                <span class="stat-label">Total Revenue</span>
                <span class="stat-value">{{ productData.summary?.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon profit">↑</div>
              <div class="stat-content">
                <span class="stat-label">Total Profit</span>
                <span class="stat-value">{{ productData.summary?.totalProfit | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon margin">%</div>
              <div class="stat-content">
                <span class="stat-label">Profit Margin</span>
                <span class="stat-value">{{ productData.summary?.profitMargin }}%</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon quantity">#</div>
              <div class="stat-content">
                <span class="stat-label">Quantity Sold</span>
                <span class="stat-value">{{ productData.summary?.totalQuantity }}</span>
              </div>
            </div>
          </div>

          <!-- Detailed Metrics -->
          <div class="metrics-section">
            <h3>Performance Metrics</h3>
            <div class="metrics-grid">
              <div class="metric">
                <span class="metric-label">Avg. Selling Price</span>
                <span class="metric-value">{{ productData.summary?.averageSellingPrice | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Avg. Cost Price</span>
                <span class="metric-value">{{ productData.summary?.averageCostPrice | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Profit per Unit</span>
                <span class="metric-value">{{ productData.summary?.profitPerUnit | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Total Invoices</span>
                <span class="metric-value">{{ productData.summary?.totalInvoices }}</span>
              </div>
            </div>
          </div>

          <!-- Recent Sales -->
          <div class="recent-sales">
            <h3>Recent Sales</h3>
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Quantity</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                @for (sale of productData.recentSales; track sale.invoiceId) {
                  <tr>
                    <td>{{ sale.invoiceNumber }}</td>
                    <td>{{ sale.invoiceDate | date:'shortDate' }}</td>
                    <td>{{ sale.quantity }}</td>
                    <td>{{ sale.revenue | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td>{{ sale.profit | currency:'INR':'symbol':'1.0-0' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Customer Analysis -->
          <div class="customer-analysis">
            <h3>Top Customers</h3>
            <div class="customers-list">
              @for (customer of productData.customerAnalysis; track customer.customerId) {
                <div class="customer-item">
                  <span class="customer-name">{{ customer.customerName }}</span>
                  <div class="customer-stats">
                    <span class="stat">₹{{ customer.revenue | currency:'INR':'symbol':'1.0-0' }}</span>
                    <span class="stat">{{ customer.quantity }} units</span>
                    <span class="stat profit">₹{{ customer.profit | currency:'INR':'symbol':'1.0-0' }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Time Analysis -->
          <div class="time-analysis">
            <h3>Monthly Performance</h3>
            <div class="time-chart">
              @for (month of productData.timeAnalysis; track month.month) {
                <div class="month-bar">
                  <div class="bar-label">{{ month.month }}</div>
                  <div class="bar-container">
                    <div class="bar-fill" [style.width.%]="(month.profit / maxMonthlyProfit) * 100">
                      <span class="bar-value">₹{{ month.profit | currency:'INR':'symbol':'1.0-0' }}</span>
                    </div>
                  </div>
                  <div class="bar-stats">
                    <span>Revenue: ₹{{ month.revenue | currency:'INR':'symbol':'1.0-0' }}</span>
                    <span>Qty: {{ month.quantity }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <div class="popup-footer">
        <button class="btn btn-secondary" (click)="close()">Close</button>
        <button class="btn btn-primary" (click)="exportReport()">
          <i class="icon-download"></i> Export Report
        </button>
      </div>
    </div>
  `,
  styles: [`
    .product-profit-popup {
      width: 900px;
      max-width: 95vw;
      max-height: 90vh;
      background: white;
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--shadow-3xl);
      display: flex;
      flex-direction: column;
    }

    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-xl);
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: var(--ui-border-radius-lg) var(--ui-border-radius-lg) 0 0;
    }

    .popup-header h2 {
      margin: 0;
      font-size: var(--font-size-2xl);
      color: #1e293b;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: #64748b;
      cursor: pointer;
      padding: var(--spacing-xs);
      line-height: 1;
      transition: var(--transition-base);
    }

    .close-btn:hover {
      color: #ef4444;
      transform: scale(1.1);
    }

    .loading {
      padding: var(--spacing-3xl);
      text-align: center;
      color: #64748b;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto var(--spacing-lg);
    }

    .popup-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-xl);
    }

    /* Product Info */
    .product-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-2xl);
      padding-bottom: var(--spacing-xl);
      border-bottom: 1px solid #e2e8f0;
    }

    .info-row {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .label {
      font-size: var(--font-size-xs);
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .value {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-medium);
      color: #334155;
    }

    /* Summary Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-2xl);
    }

    .stat-card {
      background: #f8fafc;
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      border: 1px solid #e2e8f0;
      transition: var(--transition-base);
    }

    .stat-card:hover {
      border-color: #cbd5e1;
      box-shadow: var(--shadow-sm);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
    }

    .stat-icon.revenue {
      background: #dbeafe;
      color: #1e40af;
    }

    .stat-icon.profit {
      background: #dcfce7;
      color: #166534;
    }

    .stat-icon.margin {
      background: #fef3c7;
      color: #92400e;
    }

    .stat-icon.quantity {
      background: #f3e8ff;
      color: #6b21a8;
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      display: block;
      font-size: var(--font-size-xs);
      color: #64748b;
      margin-bottom: var(--spacing-xs);
    }

    .stat-value {
      display: block;
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: #334155;
    }

    /* Metrics Section */
    .metrics-section {
      margin-bottom: var(--spacing-2xl);
    }

    .metrics-section h3 {
      font-size: var(--font-size-lg);
      color: #1e293b;
      margin-bottom: var(--spacing-lg);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-lg);
    }

    .metric {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-lg);
    }

    .metric-label {
      display: block;
      font-size: var(--font-size-sm);
      color: #64748b;
      margin-bottom: var(--spacing-sm);
    }

    .metric-value {
      display: block;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: #334155;
    }

    /* Recent Sales */
    .recent-sales {
      margin-bottom: var(--spacing-2xl);
    }

    .recent-sales h3 {
      font-size: var(--font-size-lg);
      color: #1e293b;
      margin-bottom: var(--spacing-lg);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-sm);
    }

    thead {
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
    }

    th {
      padding: var(--spacing-md);
      text-align: left;
      font-weight: var(--font-weight-semibold);
      color: #475569;
      white-space: nowrap;
    }

    td {
      padding: var(--spacing-md);
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }

    tr:hover {
      background: #f8fafc;
    }

    /* Customer Analysis */
    .customer-analysis {
      margin-bottom: var(--spacing-2xl);
    }

    .customer-analysis h3 {
      font-size: var(--font-size-lg);
      color: #1e293b;
      margin-bottom: var(--spacing-lg);
    }

    .customers-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .customer-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg);
      background: #f8fafc;
      border-radius: var(--ui-border-radius);
      border: 1px solid #e2e8f0;
    }

    .customer-name {
      font-weight: var(--font-weight-medium);
      color: #334155;
    }

    .customer-stats {
      display: flex;
      gap: var(--spacing-lg);
      align-items: center;
    }

    .customer-stats .stat {
      padding: var(--spacing-xs) var(--spacing-md);
      background: white;
      border-radius: var(--ui-border-radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
    }

    .customer-stats .stat.profit {
      background: #dcfce7;
      color: #166534;
    }

    /* Time Analysis */
    .time-analysis {
      margin-bottom: var(--spacing-xl);
    }

    .time-analysis h3 {
      font-size: var(--font-size-lg);
      color: #1e293b;
      margin-bottom: var(--spacing-lg);
    }

    .time-chart {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .month-bar {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
    }

    .bar-label {
      width: 80px;
      font-size: var(--font-size-sm);
      color: #64748b;
    }

    .bar-container {
      flex: 1;
      height: 30px;
      background: #f1f5f9;
      border-radius: var(--ui-border-radius-sm);
      overflow: hidden;
      position: relative;
    }

    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      border-radius: var(--ui-border-radius-sm);
      position: relative;
      transition: width 0.5s ease;
    }

    .bar-value {
      position: absolute;
      right: var(--spacing-sm);
      top: 50%;
      transform: translateY(-50%);
      font-size: var(--font-size-xs);
      color: white;
      font-weight: var(--font-weight-medium);
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }

    .bar-stats {
      display: flex;
      gap: var(--spacing-lg);
      font-size: var(--font-size-xs);
      color: #64748b;
    }

    /* Popup Footer */
    .popup-footer {
      padding: var(--spacing-xl);
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-lg);
      background: #f8fafc;
      border-radius: 0 0 var(--ui-border-radius-lg) var(--ui-border-radius-lg);
    }

    .btn {
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--ui-border-radius);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: var(--transition-base);
      border: 1px solid transparent;
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .btn-secondary {
      background: white;
      border-color: #cbd5e1;
      color: #334155;
    }

    .btn-secondary:hover {
      background: #f8fafc;
      border-color: #94a3b8;
      box-shadow: var(--shadow-sm);
    }

    .btn-primary {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
      border-color: #2563eb;
      box-shadow: var(--shadow-md);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ProductProfitPopupComponent implements OnInit {
  @Input() productId!: string;
  
  private invoiceService = inject(InvoiceService);
  
  loading = false;
  productData: any = null;
  maxMonthlyProfit = 0;

  ngOnInit(): void {
    this.loadProductAnalytics();
  }

  loadProductAnalytics(): void {
    this.loading = true;
    this.invoiceService.getProductProfitAnalysis(this.productId).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          this.productData = response.data;
          this.calculateMaxMonthlyProfit();
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading product analytics:', error);
        this.loading = false;
      }
    });
  }

  calculateMaxMonthlyProfit(): void {
    if (this.productData?.timeAnalysis) {
      this.maxMonthlyProfit = Math.max(
        ...this.productData.timeAnalysis.map((month: any) => month.profit || 0)
      );
    }
  }

  close(): void {
    // Implement close logic (emit event or use modal service)
  }

  exportReport(): void {
    // Implement export logic
  }
}