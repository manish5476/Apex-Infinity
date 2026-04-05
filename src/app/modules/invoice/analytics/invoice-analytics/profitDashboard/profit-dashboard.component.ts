import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InvoiceService } from '../../../services/invoice-service';


// ── Typed exactly to match your API response ──────────────────────────────
export interface PeriodInfo {
  name: string;
  start: string;
  end: string;
  days: number;
}

export interface PeriodMetrics {
  totalInvoices: number;
  totalRevenue: number;
  totalCost: number;
  totalTax: number;
  totalDiscount: number;
  totalQuantity: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  markup: number;
  averageRevenuePerInvoice: number;
  averageProfitPerInvoice: number;
  averageItemsPerInvoice: number;
  averageDailyProfit: number;
}

export interface DailyEntry {
  invoiceCount: number;
  itemCount: number;
  period: { date: string };
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  averageOrderValue: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  sku: string | null;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  totalTax: number;
  totalDiscount: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  markup: number;
  averageSellingPrice: number;
  averageCostPrice: number;
  profitPerUnit: number;
  totalProfit: number;
}

export interface TopCustomer {
  _id: string;
  customerId: string;
  totalInvoices: number;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  averageOrderValue: number;
}

export interface ComparisonSummary {
  totalInvoices: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  markup: number;
  averageRevenuePerInvoice: number;
  averageProfitPerInvoice: number;
  averageItemsPerInvoice: number;
}

export interface DashboardData {
  period: PeriodInfo;
  overview: {
    today: { revenue: number; profit: number; invoices: number };
    period: PeriodMetrics;
  };
  trends: {
    daily: DailyEntry[];
    status: string;
  };
  topPerformers: {
    products: TopProduct[];
    customers: TopCustomer[];
    categories: any[];
  };
  comparison: {
    summary: ComparisonSummary;
    growth: { revenue: number; profit: number; margin: number };
  };
  insights: { highMargin: any[]; issues: any[] };
}

@Component({
  selector: 'app-profit-dashboard-new',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, ButtonModule, TooltipModule, ProgressSpinnerModule],
  templateUrl: './profit-dashboard.component.html',
  styleUrls: ['./profit-dashboard.component.scss'],
})
export class ProfitDashboardComponentNew implements OnInit {
  private invoiceService = inject(InvoiceService);

  // ── State ─────────────────────────────────────────────────────────────────
  data = signal<DashboardData | null>(null);
  loading = signal(false);

  selectedPeriod = 'this_quarter';
  selectedCompare = 'previous_period';
  customDates = { startDate: '', endDate: '' };

  // ── Computed helpers ──────────────────────────────────────────────────────
  periodMetrics = computed(() => this.data()?.overview?.period ?? null);
  growth = computed(() => this.data()?.comparison?.growth ?? null);
  compSummary = computed(() => this.data()?.comparison?.summary ?? null);

  /** Max profit across daily entries — for bar-height normalisation */
  maxDailyProfit = computed(() => {
    const days = this.data()?.trends?.daily ?? [];
    return Math.max(...days.map(d => d.profit), 1);
  });

  // ── Options ───────────────────────────────────────────────────────────────
  periodOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This week', value: 'this_week' },
    { label: 'Last week', value: 'last_week' },
    { label: 'This month', value: 'this_month' },
    { label: 'Last month', value: 'last_month' },
    { label: 'This quarter', value: 'this_quarter' },
    { label: 'Last quarter', value: 'last_quarter' },
    { label: 'This year', value: 'this_year' },
    { label: 'Last year', value: 'last_year' },
    { label: 'Custom range', value: 'custom' },
  ];

  compareOptions = [
    { label: 'Previous period', value: 'previous_period' },
    { label: 'Previous year', value: 'previous_year' },
  ];

  ngOnInit(): void {
    this.fetchDashboard();
  }

  onPeriodChange(): void {
    if (this.selectedPeriod === 'custom') { this.data.set(null); return; }
    this.fetchDashboard();
  }

  onCustomDateChange(event: { startDate: string; endDate: string }): void {
    this.customDates = event;
    if (event.startDate && event.endDate) this.fetchDashboard();
  }

  fetchDashboard(): void {
    this.loading.set(true);
    const filters: Record<string, string> = { compareWith: this.selectedCompare };

    if (this.selectedPeriod === 'custom') {
      filters['startDate'] = this.customDates.startDate;
      filters['endDate'] = this.customDates.endDate;
      filters['period'] = 'custom';
    }

    this.invoiceService
      .getProfitDashboard(this.selectedPeriod, filters)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res: any) => {
          if (res.status === 'success') this.data.set(res.data as DashboardData);
        },
        error: err => console.error('Dashboard fetch failed', err),
      });
  }

  // ── Template helpers ──────────────────────────────────────────────────────
  barHeight(profit: number): number {
    const max = this.maxDailyProfit();
    return Math.max(4, Math.round((profit / max) * 100));
  }

  badgeClass(growth: number): string {
    return growth >= 0 ? 'badge-up' : 'badge-dn';
  }

  badgeIcon(growth: number): string {
    return growth >= 0 ? 'pi-arrow-up' : 'pi-arrow-down';
  }

  formatGrowth(v: number): string {
    return (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  formatPeriodLabel(p: PeriodInfo): string {
    const s = new Date(p.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const e = new Date(p.end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${s} – ${e} · ${p.days} days`;
  }
}
