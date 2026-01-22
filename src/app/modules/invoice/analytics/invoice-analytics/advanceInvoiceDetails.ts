import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

// PrimeNG Imports
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DrawerModule } from 'primeng/drawer';
import { AccordionModule } from 'primeng/accordion';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';

// Custom Services & Components
import { DateFilterComponent } from '../date-filter/date-filter.component';
import { InvoiceService } from '../../services/invoice-service';

// --- Interfaces ---
export interface FinancialSummary {
  totalRevenue: number;
  grossProfit: number;
  profitMargin: number;
  markup: number;
}

export interface GrowthMetrics {
  revenueGrowth: number;
  profitGrowth: number;
}

export interface TrendPoint {
  period: string;
  revenue: number;
  profit: number;
  margin: number;
}

export interface TopProduct {
  productName: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
}

export interface ProfitAnalysisReport {
  summary: {
    financials: FinancialSummary;
    metrics: {
      averageRevenuePerInvoice: number;
      totalInvoices: number;
    };
  };
  comparison: {
    growth: GrowthMetrics;
  };
  trends: {
    data: TrendPoint[];
    summary: {
      bestDay: { period: string; profit: number };
    };
  };
  analysis: {
    productAnalysis: {
      topPerforming: TopProduct[];
    };
  };
}

@Component({
  selector: 'app-advanced-profit-analysis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    MultiSelectModule,
    InputNumberModule,
    ButtonModule,
    TableModule,
    TabsModule,
    DrawerModule,
    AccordionModule,
    TooltipModule,
    DateFilterComponent
  ],
  template: `
    <div class="min-h-screen w-full bg-surface-ternary p-4 md:p-6 transition-colors duration-300 font-sans">

      <div class="glass-surface mb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-xl">
        <div class="flex flex-col gap-1">
          <h1 class="font-heading text-xl font-bold text-primary m-0 leading-tight">
            Advanced Profit Report
          </h1>
          @if(filterCount() > 0) {
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-info text-info border border-info w-fit uppercase tracking-wider">
              {{ filterCount() }} Active Filters
            </span>
          }
        </div>
        
        <div class="flex flex-wrap items-end gap-2 w-full md:w-auto">
          <div class="flex flex-col gap-1">
            <label class="text-[10px] uppercase tracking-wider font-bold text-secondary">Group By</label>
            <p-select [options]="groupByOptions" [(ngModel)]="filters.groupBy" (onChange)="fetchReport()" 
              optionLabel="label" optionValue="value" styleClass="w-[110px] !bg-secondary !border-primary !text-xs !h-9 flex items-center">
            </p-select>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[10px] uppercase tracking-wider font-bold text-secondary">Comparison</label>
            <p-select [options]="compareOptions" [(ngModel)]="filters.compareWith" (onChange)="fetchReport()" 
              optionLabel="label" optionValue="value" styleClass="w-[130px] !bg-secondary !border-primary !text-xs !h-9 flex items-center">
            </p-select>
          </div>

          <button pButton icon="pi pi-filter" (click)="showFilters.set(true)" 
            class="!bg-transparent !text-secondary !border-secondary hover:!text-primary hover:!border-primary hover:!bg-[var(--accent-focus)] !p-2 !w-9 !h-9 rounded transition-colors mb-[1px]" pTooltip="More Filters" tooltipPosition="bottom"></button>
          
          <button pButton icon="pi pi-refresh" (click)="fetchReport()" [loading]="loading()"
            class="!text-secondary hover:!text-primary hover:!bg-[var(--accent-focus)] !p-2 !w-9 !h-9 rounded-full transition-colors mb-[1px]"></button>
        </div>
      </div>

      <div class="mb-6">
        <app-date-filter (dateChange)="onDateChange($event)"></app-date-filter>
      </div>

      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-20 text-secondary opacity-70">
          <div class="w-10 h-10 border-4 border-primary border-t-[var(--accent-primary)] rounded-full animate-spin mb-4"></div>
          <p class="text-sm font-medium tracking-wide">Crunching the numbers...</p>
        </div>
      } 
      @else if (data(); as r) {
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          <div class="glass-surface surface-interactive p-4 flex flex-col justify-between relative overflow-hidden rounded-lg min-h-[110px] group hover:-translate-y-1 transition-transform duration-300">
            <div class="absolute top-0 left-0 bottom-0 w-[4px] bg-primary transition-all group-hover:w-[6px]"></div>
            <div class="pl-3">
              <div class="flex justify-between items-start mb-2">
                <span class="text-[11px] font-bold uppercase text-secondary tracking-widest">Total Revenue</span>
                <div [class]="getGrowthClass(r.comparison.growth.revenueGrowth)" 
                     class="px-2 py-0.5 rounded text-[10px] font-bold border border-current flex items-center gap-1">
                  {{ r.comparison.growth.revenueGrowth > 0 ? '▲' : '▼' }} {{ r.comparison.growth.revenueGrowth | number:'1.0-1' }}%
                </div>
              </div>
              <div class="font-heading text-2xl font-bold text-primary truncate" [title]="r.summary.financials.totalRevenue">
                {{ r.summary.financials.totalRevenue | currency:'INR':'symbol':'1.0-0' }}
              </div>
              <div class="text-[10px] text-tertiary mt-1">vs {{ getCompareLabel() }}</div>
            </div>
          </div>

          <div class="glass-surface surface-interactive p-4 flex flex-col justify-between relative overflow-hidden rounded-lg min-h-[110px] group hover:-translate-y-1 transition-transform duration-300">
            <div class="absolute top-0 left-0 bottom-0 w-[4px] bg-success transition-all group-hover:w-[6px]"></div>
            <div class="pl-3">
              <div class="flex justify-between items-start mb-2">
                <span class="text-[11px] font-bold uppercase text-secondary tracking-widest">Gross Profit</span>
                <div [class]="getGrowthClass(r.comparison.growth.profitGrowth)" 
                     class="px-2 py-0.5 rounded text-[10px] font-bold border border-current flex items-center gap-1">
                  {{ r.comparison.growth.profitGrowth > 0 ? '▲' : '▼' }} {{ r.comparison.growth.profitGrowth | number:'1.0-1' }}%
                </div>
              </div>
              <div class="font-heading text-2xl font-bold text-success truncate">
                {{ r.summary.financials.grossProfit | currency:'INR':'symbol':'1.0-0' }}
              </div>
              <div class="text-[10px] text-tertiary mt-1">Net Income after COGS</div>
            </div>
          </div>

          <div class="glass-surface surface-interactive p-4 flex flex-col justify-between relative overflow-hidden rounded-lg min-h-[110px] bg-[var(--color-success-bg)] border border-[var(--color-success-border)]">
             <div class="pl-1">
              <div class="text-[11px] font-bold uppercase text-secondary tracking-widest mb-2">Profit Margin</div>
              <div class="font-heading text-3xl font-bold text-[var(--color-success-dark)] mb-2">
                {{ r.summary.financials.profitMargin }}%
              </div>
              <div class="text-[10px] font-semibold text-success bg-surface-secondary px-2 py-0.5 rounded-md w-fit border border-success/30">
                Markup: {{ r.summary.financials.markup }}%
              </div>
            </div>
          </div>

          <div class="glass-surface surface-interactive p-4 flex flex-col justify-between relative overflow-hidden rounded-lg min-h-[110px] hover:-translate-y-1 transition-transform duration-300">
            <div class="absolute top-0 left-0 bottom-0 w-[4px] bg-[var(--accent-secondary)]"></div>
            <div class="pl-3">
              <div class="text-[11px] font-bold uppercase text-secondary tracking-widest mb-2">Avg. Order Value</div>
              <div class="font-heading text-2xl font-bold text-secondary truncate">
                {{ r.summary.metrics.averageRevenuePerInvoice | currency:'INR':'symbol':'1.0-0' }}
              </div>
              <div class="text-[10px] text-tertiary mt-1 font-medium">
                Across {{ r.summary.metrics.totalInvoices }} Invoices
              </div>
            </div>
          </div>
        </div>

        <div class="glass-surface p-5 mb-6 rounded-xl relative group/graph border border-primary">
          
          <div class="flex flex-row justify-between items-center mb-10 relative z-10">
            <div>
              <h3 class="font-heading text-base font-semibold text-primary m-0">Performance Trend</h3>
              <div class="text-[10px] text-tertiary mt-0.5 font-medium">Daily revenue vs net profit analysis</div>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="hidden md:flex gap-3 text-[10px] text-secondary font-medium">
                <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-[var(--color-bg-revenue)]"></span> Revenue</div>
                <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-sm bg-gradient-to-b from-success to-[var(--color-success-bg)]"></span> Profit</div>
              </div>
              
              @if(r.trends.summary.bestDay) {
                <div class="text-[11px] text-secondary bg-surface-secondary px-3 py-1 rounded-full border border-primary flex items-center gap-2 shadow-sm">
                  <span class="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse"></span>
                  <span class="text-tertiary">Best:</span>
                  <span class="font-bold text-primary">{{ r.trends.summary.bestDay.period | date:'dd MMM' }}</span>
                  <span class="text-success font-mono font-bold">({{ r.trends.summary.bestDay.profit | currency:'INR':'symbol':'1.0-0' }})</span>
                </div>
              }
            </div>
          </div>
          
          <div class="relative h-[260px] w-full">
            
            <div class="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 select-none">
              <div class="border-t border-dashed border-primary w-full h-0"></div>
              <div class="border-t border-dashed border-primary w-full h-0"></div>
              <div class="border-t border-dashed border-primary w-full h-0"></div>
              <div class="border-t border-dashed border-primary w-full h-0"></div>
              <div class="border-t border-primary w-full h-0 opacity-50"></div> 
            </div>

            <div class="absolute inset-0 flex items-end justify-between gap-1 pl-1 pb-6 z-20">
              @for (point of r.trends.data; track point.period) {
                <div class="group/bar flex-1 h-full flex flex-col items-center justify-end relative cursor-pointer">
                  
                  <div class="absolute bottom-[115%] left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/bar:opacity-100 transition-all duration-200 pointer-events-none z-50 min-w-[180px] transform group-hover/bar:translate-y-0 translate-y-2">
                    <div class="bg-surface-secondary border border-[var(--accent-primary)] rounded-lg shadow-xl overflow-hidden backdrop-blur-md">
                      <div class="bg-[var(--component-bg-active)] px-3 py-2 border-b border-[var(--component-divider)] flex justify-between items-center">
                        <span class="text-[10px] font-bold text-primary tracking-wide uppercase">{{ point.period | date:'EEE, dd MMM' }}</span>
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-ternary)] text-secondary border border-[var(--border-primary)]">
                          {{ point.margin }}% Margin
                        </span>
                      </div>
                      <div class="p-3 space-y-2">
                        <div class="flex justify-between items-center gap-4">
                          <span class="text-[10px] text-secondary font-medium">Revenue</span>
                          <span class="text-xs font-mono font-bold text-primary tracking-tight">{{ point.revenue | currency:'INR':'symbol':'1.0-0' }}</span>
                        </div>
                        <div class="flex justify-between items-center gap-4">
                          <span class="text-[10px] text-success font-bold">Net Profit</span>
                          <span class="text-xs font-mono font-bold text-success tracking-tight">{{ point.profit | currency:'INR':'symbol':'1.0-0' }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="w-3 h-3 bg-surface-secondary border-r border-b border-[var(--accent-primary)] rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2"></div>
                  </div>

                  <div class="absolute top-0 bottom-0 w-[1px] bg-[var(--accent-primary)] opacity-0 group-hover/bar:opacity-40 transition-opacity duration-200 pointer-events-none dashed-line"></div>

                  <div class="w-full max-w-[32px] relative flex items-end justify-center h-full mx-auto px-0.5 transition-transform duration-200 group-hover/bar:scale-105">
                    
                    <div class="w-full absolute bottom-0 bg-[var(--component-bg-active)] rounded-t-[4px] border-t border-x border-transparent group-hover/bar:border-[var(--border-secondary)] transition-all duration-300"
                         [style.height.%]="getBarHeight(point.revenue, r.summary.financials.totalRevenue)">
                    </div>

                    <div class="w-[60%] absolute bottom-0 rounded-t-[3px] z-10 transition-all duration-500 ease-out shadow-sm"
                         [style.height.%]="getBarHeight(point.profit, r.summary.financials.totalRevenue)"
                         style="background: linear-gradient(180deg, var(--color-success) 0%, var(--color-success-bg) 100%);">
                         <div class="absolute top-0 left-0 right-0 h-[2px] bg-white opacity-40"></div>
                    </div>
                  </div>
                  
                  <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 w-max">
                    <div class="text-[9px] font-medium text-tertiary -rotate-45 origin-top group-hover/bar:text-primary group-hover/bar:font-bold transition-colors">
                      {{ point.period | date:(filters.groupBy === 'month' ? 'MMM' : 'dd MMM') }}
                    </div>
                  </div>

                </div>
              }
            </div>
          </div>
        </div>

        <div class="glass-surface overflow-hidden rounded-xl border border-primary">
          <p-tabs styleClass="report-tabs">
            <p-tablist>
              <p-tab value="0"><span class="text-xs font-bold tracking-wide">Top Products</span></p-tab>
              <p-tab value="1"><span class="text-xs font-bold tracking-wide">Top Customers</span></p-tab>
              <p-tab value="2"><span class="text-xs font-bold tracking-wide">Category Analysis</span></p-tab>
            </p-tablist>
            
            <p-tabpanels>
              <p-tabpanel value="0">
                <p-table [value]="r.analysis.productAnalysis.topPerforming" [rows]="10" [paginator]="true" 
                         styleClass="p-datatable-sm" responsiveLayout="scroll">
                  <ng-template pTemplate="header">
                    <tr class="text-xs uppercase tracking-wider text-secondary">
                      <th class="bg-surface-secondary font-semibold p-3 text-left pl-4">Product</th>
                      <th class="bg-surface-secondary font-semibold p-3 text-right">Qty</th>
                      <th class="bg-surface-secondary font-semibold p-3 text-right">Revenue</th>
                      <th class="bg-surface-secondary font-semibold p-3 text-right">Net Profit</th>
                      <th class="bg-surface-secondary font-semibold p-3 text-right pr-4">Margin</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-p>
                    <tr class="border-b border-secondary hover:bg-[var(--component-bg-hover)] transition-colors text-sm group">
                      <td class="p-3 pl-4">
                        <div class="font-bold text-primary text-xs group-hover:text-[var(--accent-primary)] transition-colors">{{ p.productName }}</div>
                        <div class="text-[10px] text-tertiary font-mono">{{ p.sku }}</div>
                      </td>
                      <td class="p-3 text-right text-secondary text-xs font-mono">{{ p.totalQuantity }}</td>
                      <td class="p-3 text-right text-primary text-xs font-mono font-semibold">{{ p.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td class="p-3 text-right font-bold text-success text-xs font-mono">{{ p.netProfit | currency:'INR':'symbol':'1.0-0' }}</td>
                      <td class="p-3 text-right pr-4">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--color-success-bg)] text-success border border-[var(--color-success-border)]">
                          {{ p.profitMargin }}%
                        </span>
                      </td>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="emptymessage">
                    <tr><td colspan="5" class="text-center p-4 text-sm text-tertiary">No product data available for this period.</td></tr>
                  </ng-template>
                </p-table>
              </p-tabpanel>
              
              <p-tabpanel value="1">
                 <div class="p-8 text-center text-sm text-tertiary">Customer analysis visualization coming soon...</div>
              </p-tabpanel>
              <p-tabpanel value="2">
                 <div class="p-8 text-center text-sm text-tertiary">Category breakdown visualization coming soon...</div>
              </p-tabpanel>
            </p-tabpanels>
          </p-tabs>
        </div>
      }
    </div>

    <p-drawer [(visible)]="showFilters" position="right" styleClass="!w-[340px] !bg-surface-secondary !border-l !border-primary shadow-2xl" [header]="'Refine Analysis'">
      <div class="flex flex-col gap-6 p-1 h-full">
        
        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-secondary uppercase tracking-wider">Invoice Status</label>
          <p-multiselect [options]="statusOptions" [(ngModel)]="filters.status" 
            optionLabel="label" optionValue="value" placeholder="Select Status" 
            styleClass="w-full !text-sm" display="chip" [showClear]="true">
          </p-multiselect>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs font-bold text-secondary uppercase tracking-wider">Revenue Range</label>
          <div class="flex gap-2">
            <p-inputNumber [(ngModel)]="filters.minAmount" placeholder="Min ₹" mode="currency" currency="INR" locale="en-IN" 
              styleClass="w-full" inputStyleCl