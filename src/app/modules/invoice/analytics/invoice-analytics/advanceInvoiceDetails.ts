import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Custom Services & Components
import { InvoiceService } from '../../services/invoice-service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { FilterField } from '../../../shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../../shared/components/universal-filter/universal-filter';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface FinancialSummary {
  totalRevenue: number;
  totalCost: number;
  totalTax: number;
  totalDiscount: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  markup: number;
}

export interface GrowthMetrics {
  revenueGrowth: number;
  profitGrowth: number;
  marginChange: number;
}

export interface TrendPoint {
  period: string;          // normalized ISO string after mapping
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  invoiceCount: number;
  itemCount: number;
  averageOrderValue: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  markup: number;
  averageSellingPrice: number;
  averageCostPrice: number;
  profitPerUnit: number;
}

export interface TopCustomer {
  customerId: string;
  totalInvoices: number;
  totalQuantity: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  averageOrderValue: number;
}

export interface CategoryData {
  _id: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  uniqueProducts: number;
}

export interface ProfitAnalysisReport {
  summary: {
    financials: FinancialSummary;
    metrics: {
      averageRevenuePerInvoice: number;
      averageProfitPerInvoice: number;
      averageItemsPerInvoice: number;
      totalInvoices: number;
      totalItems: number;
      uniqueProducts: number;
    };
  };
  comparison: {
    period: string;
    growth: GrowthMetrics;
    summary: FinancialSummary;
  } | null;
  trends: {
    data: TrendPoint[];
    summary: {
      bestPeriod: TrendPoint | null;
      worstPeriod: TrendPoint | null;
      averageDailyProfit: number;
      trendDirection: 'up' | 'down' | 'stable';
    } | null;
  };
  analysis: {
    productAnalysis: {
      topPerforming: TopProduct[];
      worstPerforming: TopProduct[];
      byCategory: CategoryData[];
      summary: {
        totalProducts: number;
        productsWithProfit: number;
        productsWithLoss: number;
        averageProfitMargin: number;
      };
    };
    customerAnalysis: {
      mostProfitable: TopCustomer[];
      summary: {
        totalCustomers: number;
        customersWithProfit: number;
        averageCustomerValue: number;
      };
    };
  };
  kpis: {
    grossProfitMargin: number;
    netProfitMargin: number;
    revenuePerInvoice: number;
    profitPerInvoice: number;
  };
  metadata: {
    period: { groupBy: string };
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-advanced-profit-analysis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TabsModule,
    ButtonModule,
    TooltipModule,
    ProgressSpinnerModule,
    UniversalFilterComponent,
  ],
  templateUrl: './advanced-profit-analysis.component.html',
  styleUrls: ['./advanced-profit-analysis.component.scss']
})
export class AdvancedProfitAnalysisComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  public commonService = inject(CommonMethodService);
  private invoiceService = inject(InvoiceService);

  data = signal<ProfitAnalysisReport | null>(null);
  loading = signal(false);
  activeTab = signal<any>('0');

  currentFilters: any = {
    groupBy: 'day',
    compareWith: 'previous_period',
  };

  // ── Filter Configuration ─────────────────────────────────────────────────

  filterConfig: FilterField[] = [
    {
      key: 'date',
      label: 'Analysis Period',
      type: 'date-range',
    },
    {
      key: 'groupBy',
      label: 'Group By',
      type: 'select',
      optionLabel: 'label',
      optionValue: 'value',
      staticOptions: [
        { label: 'Daily', value: 'day' },
        { label: 'Weekly', value: 'week' },
        { label: 'Monthly', value: 'month' },
      ],
      defaultValue: 'day',
    },
    {
      key: 'compareWith',
      label: 'Compare',
      type: 'select',
      optionLabel: 'label',
      optionValue: 'value',
      staticOptions: [
        { label: 'Previous Period', value: 'previous_period' },
        { label: 'Last Year', value: 'same_period_last_year' },
        { label: 'None', value: 'none' },
      ],
      defaultValue: 'previous_period',
    },
    {
      key: 'status',
      label: 'Invoice Status',
      type: 'multiselect',
      optionLabel: 'label',
      optionValue: 'value',
      staticOptions: [
        { label: 'Draft', value: 'draft' },
        { label: 'Issued', value: 'issued' },
        { label: 'Paid', value: 'paid' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      placeholder: 'All Statuses',
    },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      type: 'select',
      optionLabel: 'label',
      optionValue: 'value',
      staticOptions: [
        { label: 'All', value: 'all' },
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Partial', value: 'partial' },
        { label: 'Paid', value: 'paid' },
      ],
      defaultValue: 'all',
    },
  ];

  ngOnInit(): void {
    // Triggered by universal filter on init via (filterChange) emit
  }

  // ── Filter Handler ───────────────────────────────────────────────────────

  onFilterUpdate(filters: any): void {
    this.currentFilters = filters;
    this.fetchReport();
  }

  fetchReport(): void {
    this.loading.set(true);

    const payload: any = { ...this.currentFilters };

    if (payload.date && Array.isArray(payload.date)) {
      if (payload.date[0]) payload.startDate = new Date(payload.date[0]).toISOString().split('T')[0];
      if (payload.date[1]) payload.endDate = new Date(payload.date[1]).toISOString().split('T')[0];
      delete payload.date;
    }

    if (Array.isArray(payload.status) && payload.status.length > 0) {
      payload.status = payload.status.join(',');
    } else {
      delete payload.status;
    }

    ['paymentStatus', 'branchId', 'customerId', 'productId'].forEach(key => {
      if (payload[key] === 'all') delete payload[key];
    });

    this.invoiceService.getAdvancedProfitAnalysis(payload)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.data.set(this.normalizeResponse(res.data));
          }
        },
        error: (err) => console.error('Profit Report Error:', err),
      });
  }

  private normalizeResponse(raw: any): ProfitAnalysisReport {
    const normalizedTrends: TrendPoint[] = (raw.trends?.data ?? []).map((pt: any) => ({
      ...pt,
      period: this.normalizeTrendPeriod(pt.period),
    }));

    const rawBest = raw.trends?.summary?.bestPeriod;
    const rawWorst = raw.trends?.summary?.worstPeriod;

    const trendsSummary = raw.trends?.summary
      ? {
        bestPeriod: rawBest ? { ...rawBest, period: this.normalizeTrendPeriod(rawBest.period) } : null,
        worstPeriod: rawWorst ? { ...rawWorst, period: this.normalizeTrendPeriod(rawWorst.period) } : null,
        averageDailyProfit: raw.trends.summary.averageDailyProfit ?? 0,
        trendDirection: raw.trends.summary.trendDirection ?? 'stable',
      }
      : null;

    return {
      ...raw,
      trends: {
        data: normalizedTrends,
        summary: trendsSummary,
      },
      comparison: raw.comparison ?? null,
    } as ProfitAnalysisReport;
  }

  private normalizeTrendPeriod(period: any): string {
    if (!period) return '';
    if (typeof period === 'string') return period;

    if (period.date) return period.date;

    if (period.year && period.month) {
      const m = String(period.month).padStart(2, '0');
      return `${period.year}-${m}-01`;
    }

    if (period.year && period.week != null) {
      return this.isoWeekToDate(period.year, period.week);
    }

    if (period.year && period.quarter) {
      const m = String((period.quarter - 1) * 3 + 1).padStart(2, '0');
      return `${period.year}-${m}-01`;
    }

    return String(period.year ?? '');
  }

  private isoWeekToDate(year: number, week: number): string {
    const jan4 = new Date(year, 0, 4);
    const day = jan4.getDay() || 7;
    const w1Mon = new Date(jan4.getTime() - (day - 1) * 86400000);
    const target = new Date(w1Mon.getTime() + (week - 1) * 7 * 86400000);
    return target.toISOString().split('T')[0];
  }

  // ── Computed helpers ─────────────────────────────────────────────────────

  groupByLabel(): string {
    switch (this.currentFilters.groupBy) {
      case 'month': return 'Monthly';
      case 'week': return 'Weekly';
      default: return 'Daily';
    }
  }

  maxTrendRevenue(points: TrendPoint[]): number {
    if (!points?.length) return 1;
    return Math.max(...points.map(p => p.revenue), 1);
  }

  getBarHeight(val: number, max: number): number {
    if (!max || max === 0) return 0;
    return Math.max(2, Math.min((val / max) * 90, 90));
  }

  getGrowthClass(value: number): string {
    return value >= 0 ? 'bg-success' : 'bg-error';
  }

  getMarginClass(margin: number): string {
    if (margin >= 25) return 'margin-high';
    if (margin >= 15) return 'margin-medium';
    return 'margin-low';
  }

  getCompareLabel(): string {
    switch (this.currentFilters.compareWith) {
      case 'previous_period': return 'prev. period';
      case 'same_period_last_year': return 'last year';
      default: return 'baseline';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}