import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';
import { InvoiceService } from '../modules/invoice/services/invoice-service';
import { TabsModule } from 'primeng/tabs';
@Component({
  selector: 'app-product-analytics-dialog',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TabsModule],
  template: `
    <div class="analytics-modal">
      
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Analyzing Product Performance...</p>
        </div>
      } 
      @else if (data(); as d) {
        
        <div class="modal-header">
          <div class="product-info">
            <span class="badge-sku">Product Analysis</span>
            <h2 class="product-name">{{ d.product.name }}</h2>
          </div>
          <div class="price-tags">
            <div class="price-pill cost">
              <span class="label">Buy</span>
              <span class="value">{{ d.product.purchasePrice | currency:'INR':'symbol':'1.0-0' }}</span>
            </div>
            <div class="arrow">→</div>
            <div class="price-pill sell">
              <span class="label">Sell</span>
              <span class="value">{{ d.product.sellingPrice | currency:'INR':'symbol':'1.0-0' }}</span>
            </div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card revenue">
            <div class="kpi-label">Total Revenue</div>
            <div class="kpi-value">{{ d.summary.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</div>
          </div>
          
          <div class="kpi-card profit">
            <div class="kpi-label">Total Profit</div>
            <div class="kpi-value">{{ d.summary.totalProfit | currency:'INR':'symbol':'1.0-0' }}</div>
            <div class="kpi-sub">Margin: {{ d.summary.profitMargin }}%</div>
          </div>

          <div class="kpi-card qty">
            <div class="kpi-label">Units Sold</div>
            <div class="kpi-value">{{ d.summary.totalQuantity }}</div>
            <div class="kpi-sub">{{ d.summary.totalInvoices }} Invoices</div>
          </div>

          <div class="kpi-card avg">
            <div class="kpi-label">Avg. Profit/Unit</div>
            <div class="kpi-value text-slate-700">{{ d.summary.profitPerUnit | currency:'INR':'symbol':'1.0-0' }}</div>
          </div>
        </div>

        <div class="details-section">
          <p-tabs styleClass="custom-tabs">
              <p-tablist>
        <p-tab value="0">Header I</p-tab>
        <p-tab value="1">Header II</p-tab>
        <p-tab value="2">Header III</p-tab>
    </p-tablist>
<p-tabpanels>
            <p-tabpanel value="0"  header="Recent Sales">
              <p-table [value]="d.recentSales" [scrollable]="true" scrollHeight="250px" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Profit</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-sale>
                  <tr>
                    <td>
                      <span class="font-mono text-xs">{{ sale.invoiceNumber }}</span>
                    </td>
                    <td class="text-sm text-slate-500">{{ sale.invoiceDate | date:'dd MMM yyyy' }}</td>
                    <td class="text-right font-medium">{{ sale.quantity }}</td>
                    <td class="text-right text-green-600 font-medium">{{ sale.profit | currency:'INR':'symbol':'1.0-0' }}</td>
                  </tr>
                </ng-template>
              </p-table>
            </p-tabpanel >

            <p-tabpanel value="1"  header="Top Customers">
              <p-table [value]="d.customerAnalysis" [scrollable]="true" scrollHeight="250px" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Customer</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Revenue</th>
                    <th class="text-right">Profit</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-cust>
                  <tr>
                    <td class="font-medium text-slate-700">{{ cust.customerName }}</td>
                    <td class="text-right">{{ cust.quantity }}</td>
                    <td class="text-right">{{ cust.revenue | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td class="text-right text-green-600 font-medium">{{ cust.profit | currency:'INR':'symbol':'1.0-0' }}</td>
                  </tr>
                </ng-template>
              </p-table>
            </p-tabpanel >

            <p-tabpanel value="2"  header="Monthly Trend">
              <div class="chart-container">
                @for(month of d.timeAnalysis; track month.month) {
                  <div class="chart-row">
                    <div class="month-label">{{ month.month }}</div>
                    <div class="bar-area">
                      <div class="bar-revenue" [style.width.%]="100">
                        <span class="bar-text">{{ month.revenue | currency:'INR':'symbol':'1.0-0' }}</span>
                      </div>
                      <div class="bar-profit" [style.width.%]="(month.profit / month.revenue) * 100">
                        <span class="bar-text-inner">{{ month.profit | currency:'INR':'symbol':'1.0-0' }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </p-tabpanel >
            </p-tabpanels>
          </p-tabs>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      --c-rev: #0ea5e9;
      --c-prof: #22c55e;
      --c-bg: #f8fafc;
    }

    .analytics-modal {
      font-family: var(--font-body);
      min-width: 300px;
    }

    /* Header */
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-xl);
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid #e2e8f0;
    }

    .product-name {
      font-family: var(--font-heading);
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: #0f172a;
      margin: 4px 0 0 0;
    }

    .badge-sku {
      font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;
      background: #e2e8f0; padding: 2px 6px; border-radius: 4px; color: #64748b; font-weight: 600;
    }

    .price-tags { display: flex; align-items: center; gap: 8px; }
    .price-pill {
      display: flex; flex-direction: column; align-items: flex-end;
      padding: 4px 10px; border-radius: 6px; border: 1px solid transparent;
    }
    .price-pill.cost { background: #fff1f2; border-color: #fecdd3; }
    .price-pill.cost .value { color: #be123c; }
    .price-pill.sell { background: #eff6ff; border-color: #bfdbfe; }
    .price-pill.sell .value { color: #1d4ed8; }
    
    .price-pill .label { font-size: 9px; text-transform: uppercase; color: #64748b; }
    .price-pill .value { font-family: var(--font-mono); font-weight: 700; font-size: var(--font-size-base); }
    .arrow { color: #94a3b8; }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }
    @media(min-width: 600px) { .kpi-grid { grid-template-columns: repeat(4, 1fr); } }

    .kpi-card {
      background: #ffffff; border: 1px solid #e2e8f0;
      padding: var(--spacing-md); border-radius: var(--ui-border-radius);
      box-shadow: var(--shadow-xs);
    }
    .kpi-card.profit { background: #f0fdf4; border-color: #bbf7d0; }
    .kpi-card.revenue { background: #f0f9ff; border-color: #bae6fd; }

    .kpi-label { font-size: 11px; color: #64748b; margin-bottom: 4px; }
    .kpi-value { font-family: var(--font-heading); font-weight: 700; font-size: var(--font-size-lg); color: #0f172a; }
    .kpi-sub { font-size: 10px; margin-top: 4px; font-weight: 600; color: #15803d; }

    // /* Tables */
    // ::ng-deep .p-datatable-sm .p-datatable-thead > tr > th {
    //   background: #f8fafc; font-size: 11px; padding: 0.5rem; color: #64748b;
    // }
    // ::ng-deep .p-datatable-sm .p-datatable-tbody > tr > td {
    //   padding: 0.5rem; font-size: 12px; border-bottom: 1px solid #f1f5f9;
    // }

    /* Chart */
    .chart-container { display: flex; flex-direction: column; gap: 12px; padding: 10px; }
    .chart-row { display: flex; align-items: center; gap: 10px; }
    .month-label { width: 60px; font-size: 11px; font-weight: 600; color: #64748b; }
    .bar-area { flex: 1; height: 24px; position: relative; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    
    .bar-revenue {
      height: 100%; background: #bae6fd; position: absolute; left: 0; top: 0;
      display: flex; align-items: center; justify-content: flex-end; padding-right: 8px;
    }
    .bar-profit {
      height: 100%; background: #22c55e; position: absolute; left: 0; top: 0; opacity: 0.8;
      display: flex; align-items: center; padding-left: 8px;
    }
    .bar-text { font-size: 10px; color: #0369a1; z-index: 2; font-weight: 600;}
    .bar-text-inner { font-size: 10px; color: #fff; font-weight: 600; white-space: nowrap;}

    /* Loading */
    .loading-state { text-align: center; padding: 40px; color: #94a3b8; }
    .spinner { width: 30px; height: 30px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s infinite linear; margin: 0 auto 10px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ProductAnalyticsDialogComponent implements OnInit {
  private config = inject(DynamicDialogConfig);
  private invoiceService = inject(InvoiceService);

  data = signal<any>(null);
  loading = signal(true);

  ngOnInit() {
    const productId = this.config.data?.productId;
    if (productId) {
      this.loadData(productId);
    }
  }

  loadData(id: string) {
    this.invoiceService.getProductProfitAnalysis(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.data.set(res.data);
          }
        }
      });
  }
}