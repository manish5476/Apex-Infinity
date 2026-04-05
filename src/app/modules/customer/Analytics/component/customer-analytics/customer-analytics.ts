import {
  Component, OnInit, OnDestroy, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { CommonMethodService } from '@core/utils/common-method.service';
import { CustomerAnalyticsService } from '../../customer-analytics.service';

// ─── local shape interfaces ────────────────────────────────────────────────
interface OverviewData { overview: any; recentCustomers: any[] }
interface FinancialData { salesAnalysis: any[]; paymentPatterns: any[]; overdueInvoices: any[]; outstandingAging: any[] }

@Component({
  selector: 'app-customer-analytics',
  standalone: true,
  imports: [CommonModule, TooltipModule, SkeletonModule],
  template: `
  <div class="ca-page">

    <!-- ══════════════ PAGE HEADER ══════════════ -->
    <header class="ca-header">
      <div class="ca-header-left">
        <div class="ca-header-icon">
          <i class="pi pi-users"></i>
        </div>
        <div>
          <h1 class="ca-header-title">Customer Analytics</h1>
          <p class="ca-header-sub">
            360° view of customer behaviour, lifetime value &amp; financials
          </p>
        </div>
      </div>
      <div class="ca-header-right">
        <button class="ca-refresh-btn" (click)="loadAll()" [class.spinning]="anyLoading()"
          pTooltip="Refresh all data" tooltipPosition="bottom">
          <i class="pi pi-refresh"></i>
        </button>
      </div>
    </header>

    <!-- ══════════════ SECTION TABS ══════════════ -->
    <nav class="ca-tabs">
      @for (tab of tabs; track tab.key) {
        <button class="ca-tab" [class.active]="activeTab() === tab.key"
          (click)="activeTab.set(tab.key)">
          <i [class]="tab.icon"></i>
          <span>{{ tab.label }}</span>
          @if (isLoading[tab.key]) {
            <span class="tab-spinner"></span>
          }
        </button>
      }
    </nav>

    <!-- ══════════════════════════════════════════
         TAB: OVERVIEW
    ══════════════════════════════════════════ -->
    @if (activeTab() === 'overview') {
      <div class="ca-section" @fadeIn>

        <!-- KPI row -->
        <div class="kpi-row">
          @for (kpi of overviewKpis(); track kpi.label; let i = $index) {
            <div class="kpi-card" [style.--delay]="(i*50)+'ms'">
              <div class="kpi-icon" [style.background]="kpi.iconBg" [style.color]="kpi.iconColor">
                <i [class]="kpi.icon"></i>
              </div>
              <div class="kpi-body">
                <div class="kpi-label">{{ kpi.label }}</div>
                @if (isLoading['overview']) {
                  <p-skeleton height="24px" width="80px" styleClass="mt-1"></p-skeleton>
                } @else {
                  <div class="kpi-value">{{ kpi.value }}</div>
                }
                @if (kpi.sub) {
                  <div class="kpi-sub">{{ kpi.sub }}</div>
                }
              </div>
              @if (kpi.trend) {
                <div class="kpi-trend" [class.up]="kpi.trend > 0" [class.down]="kpi.trend < 0">
                  <i [class]="kpi.trend > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                </div>
              }
            </div>
          }
        </div>

        <div class="two-col-grid">
          <!-- Customer type split -->
          <div class="ca-card">
            <div class="ca-card-header">
              <span class="ca-card-title">
                <i class="pi pi-chart-pie"></i> Customer Breakdown
              </span>
            </div>
            <div class="ca-card-body">
              @if (isLoading['overview']) {
                @for (s of [1,2]; track s) {
                  <div class="skeleton-row">
                    <p-skeleton shape="circle" size="32px"></p-skeleton>
                    <p-skeleton height="14px" styleClass="flex-1"></p-skeleton>
                  </div>
                }
              } @else {
                @for (seg of overviewData()?.overview?.customerStats ?? []; track seg._id) {
                  <div class="split-row">
                    <div class="split-avatar" [style.background]="seg._id === 'individual'
                        ? 'var(--color-info-bg)' : 'var(--color-success-bg)'"
                      [style.color]="seg._id === 'individual'
                        ? 'var(--color-info)' : 'var(--color-success)'">
                      <i [class]="seg._id === 'individual' ? 'pi pi-user' : 'pi pi-building'"></i>
                    </div>
                    <div class="split-info">
                      <span class="split-label">{{ common.toTitleCase(seg._id) }}</span>
                      <span class="split-count">{{ seg.count }} customers</span>
                    </div>
                    <div class="split-right">
                      @if (seg.totalOutstanding > 0) {
                        <span class="split-amt warn">
                          {{ common.formatCurrency(seg.totalOutstanding) }}
                        </span>
                      } @else {
                        <span class="split-amt ok">Clear</span>
                      }
                    </div>
                    <!-- mini bar -->
                    <div class="split-bar-wrap">
                      <div class="split-bar"
                        [style.width]="barPct(seg.count, totalCustomers()) + '%'"
                        [style.background]="seg._id === 'individual'
                          ? 'var(--color-info)' : 'var(--color-success)'">
                      </div>
                    </div>
                  </div>
                }
              }
            </div>
          </div>

          <!-- Monthly growth -->
          <div class="ca-card">
            <div class="ca-card-header">
              <span class="ca-card-title">
                <i class="pi pi-chart-line"></i> Monthly Acquisition
              </span>
            </div>
            <div class="ca-card-body">
              @if (isLoading['overview']) {
                <p-skeleton height="120px"></p-skeleton>
              } @else {
                <div class="month-bars">
                  @for (m of overviewData()?.overview?.monthlyGrowth ?? []; track m._id.month) {
                    <div class="month-bar-wrap"
                      [pTooltip]="monthLabel(m._id.month) + ': ' + m.newCustomers + ' new'"
                      tooltipPosition="top">
                      <div class="month-bar-fill"
                        [style.height]="barPct(m.newCustomers, maxMonthlyGrowth()) + '%'">
                      </div>
                      <span class="month-bar-label">{{ monthLabel(m._id.month) }}</span>
                    </div>
                  }
                </div>
                <div class="month-bars-legend">
                  @for (m of overviewData()?.overview?.monthlyGrowth ?? []; track m._id.month) {
                    <div class="legend-item">
                      <span class="legend-dot"></span>
                      {{ monthLabel(m._id.month) }} · {{ m.newCustomers }}
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Top customers + Recent side by side -->
        <div class="two-col-grid">

          <!-- Top by outstanding -->
          <div class="ca-card">
            <div class="ca-card-header">
              <span class="ca-card-title">
                <i class="pi pi-star"></i> Top Outstanding
              </span>
            </div>
            <div class="ca-card-body gap-sm">
              @if (isLoading['overview']) {
                @for (s of [1,2,3]; track s) {
                  <p-skeleton height="44px" styleClass="mb-1"></p-skeleton>
                }
              } @else {
                @for (c of overviewData()?.overview?.topCustomers ?? []; track c._id; let i = $index) {
                  <div class="rank-row">
                    <div class="rank-num">#{{ i + 1 }}</div>
                    <div class="rank-avatar"
                      [style.background]="common.getAvatarStyle(c.name).background"
                      [style.color]="common.getAvatarStyle(c.name).color">
                      {{ common.getInitials(c.name) }}
                    </div>
                    <div class="rank-info">
                      <span class="rank-name">{{ c.name }}</span>
                      <span class="rank-sub">
                        <i class="pi pi-phone" style="font-size:9px"></i>
                        {{ common.formatPhone(c.phone) }}
                      </span>
                    </div>
                    <div class="rank-amt"
                      [style.color]="c.outstandingBalance > 0 ? 'var(--color-warning)' : 'var(--color-success)'">
                      {{ c.outstandingBalance > 0
                          ? common.formatCurrency(c.outstandingBalance)
                          : '✓ Clear' }}
                    </div>
                  </div>
                }
              }
            </div>
          </div>

          <!-- Recent customers -->
          <div class="ca-card">
            <div class="ca-card-header">
              <span class="ca-card-title">
                <i class="pi pi-clock"></i> Recent Customers
              </span>
            </div>
            <div class="ca-card-body gap-sm">
              @if (isLoading['overview']) {
                @for (s of [1,2,3,4,5]; track s) {
                  <p-skeleton height="36px" styleClass="mb-1"></p-skeleton>
                }
              } @else {
                @for (c of overviewData()?.recentCustomers ?? []; track c._id) {
                  <div class="recent-row">
                    <div class="recent-avatar"
                      [style.background]="common.getAvatarStyle(c.name).background"
                      [style.color]="common.getAvatarStyle(c.name).color">
                      {{ common.getInitials(c.name) }}
                    </div>
                    <div class="recent-info">
                      <span class="recent-name">{{ c.name }}</span>
                      <span class="recent-meta">
                        <span class="type-chip"
                          [class.individual]="c.type === 'individual'"
                          [class.business]="c.type === 'business'">
                          {{ c.type }}
                        </span>
                        · {{ common.timeAgoText(c.createdAt) }}
                      </span>
                    </div>
                    @if (c.outstandingBalance > 0) {
                      <span class="recent-outstanding">
                        {{ common.formatCurrency(c.outstandingBalance) }}
                      </span>
                    }
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════════════════════════════
         TAB: FINANCIALS
    ══════════════════════════════════════════ -->
    @if (activeTab() === 'financials') {
      <div class="ca-section">

        <!-- Overdue alert banner -->
        @if ((financialData()?.overdueInvoices?.length ?? 0) > 0) {
          <div class="alert-banner danger">
            <i class="pi pi-exclamation-triangle"></i>
            <strong>{{ financialData()!.overdueInvoices.length }} overdue invoice(s)</strong>
            — immediate attention required
          </div>
        }

        <div class="two-col-grid">

          <!-- Sales by month -->
          <div class="ca-card full-height">
            <div class="ca-card-header">
              <span class="ca-card-title">
                <i class="pi pi-chart-bar"></i> Monthly Sales
              </span>
              <span class="ca-card-badge">
                {{ common.formatCurrency(totalSales()) }} YTD
              </span>
            </div>
            <div class="ca-card-body">
              @if (isLoading['financials']) {
                <p-skeleton height="200px"></p-skeleton>
              } @else {
                <div class="bar-chart-v">
                  @for (m of financialData()?.salesAnalysis ?? []; track m._id.month) {
                    <div class="bv-col"
                      [pTooltip]="monthName(m._id.month) + ': ' + common.formatCurrency(m.totalSales)"
                      tooltipPosition="top">
                      <div class="bv-val" *ngIf="m.totalSales > 0">
                        {{ common.formatCompactIndian(m.totalSales) }}
                      </div>
                      <div class="bv-bar-track">
                        <div class="bv-bar-fill"
                          [style.height]="barPct(m.totalSales, maxSales()) + '%'"
                          [class.has-value]="m.totalSales > 0">
                        </div>
                      </div>
                      <div class="bv-label">{{ monthShort(m._id.month) }}</div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Outstanding aging -->
          <div class="ca-card">
            <div class="ca-card-header">
              <span class="ca-card-title">
                <i class="pi pi-wallet"></i> Outstanding Aging
              </span>
            </div>
            <div class="ca-card-body gap-sm">
              @if (isLoading['financials']) {
                @for (s of [1,2]; track s) {
                  <p-skeleton height="44px"></p-skeleton>
                }
              } @else if (!financialData()?.outstandingAging?.length) {
                <div class="empty-panel">
                  <i class="pi pi-check-circle"></i>
                  <span>No outstanding aging</span>
                </div>
              } @else {
                @for (a of financialData()?.outstandingAging ?? []; track a._id) {
                  <div class="aging-row">
                    <div class="aging-days">
                      <span class="aging-num">{{ a._id }}</span>
                      <span class="aging-unit">days</span>
                    </div>
                    <div class="aging-info">
                      <span class="aging-count">{{ a.count }} invoice(s)</span>
                      <div class="aging-bar-track">
                        <div class="aging-bar-fill"
                          [style.width]="barPct(a.totalAmount, maxAging()) + '%'">
                        </div>
                      </div>
                    </div>
                    <div class="aging-total">
                      {{ common.formatCurrency(a.totalAmount) }}
                    </div>
                  </div>
                }
              }
            </div>

            <!-- Overdue invoices -->
            <div class="ca-card-header mt-section">
              <span class="ca-card-title">
                <i class="pi pi-exclamation-circle" style="color:var(--color-error)"></i>
                Overdue Invoices
              </span>
            </div>
            <div class="ca-card-body gap-sm">
              @if (!financialData()?.overdueInvoices?.length) {
                <div class="empty-panel success">
                  <i class="pi pi-check-circle"></i>
                  <span>All invoices are on time</span>
                </div>
              } @else {
                @for (inv of financialData()?.overdueInvoices ?? []; track inv._id) {
                  <div class="overdue-row">
                    <div class="overdue-left">
                      <div class="overdue-avatar"
                        [style.background]="common.getAvatarStyle(inv.customerId.name).background"
                        [style.color]="common.getAvatarStyle(inv.customerId.name).color">
                        {{ common.getInitials(inv.customerId.name) }}
                      </div>
                      <div class="overdue-info">
                        <span class="overdue-customer">{{ inv.customerId.name }}</span>
                        <span class="overdue-inv">{{ inv.invoiceNumber }}</span>
                      </div>
                    </div>
                    <div class="overdue-right">
                      <span class="overdue-due">
                        Due {{ common.timeAgoText(inv.dueDate) }}
                      </span>
                      <span class="overdue-amt">
                        {{ common.formatCurrency(inv.balanceAmount) }}
                      </span>
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════════════════════════════
         TAB: PAYMENT BEHAVIOUR
    ══════════════════════════════════════════ -->
    @if (activeTab() === 'payment') {
      <div class="ca-section">
        <div class="ca-card">
          <div class="ca-card-header">
            <span class="ca-card-title">
              <i class="pi pi-credit-card"></i> Payment Behaviour by Customer
            </span>
            <span class="ca-card-badge">{{ paymentData().length }} customers</span>
          </div>
          <div class="ca-card-body gap-sm">
            @if (isLoading['payment']) {
              @for (s of [1,2,3,4,5]; track s) {
                <p-skeleton height="56px" styleClass="mb-1"></p-skeleton>
              }
            } @else {
              @for (p of paymentData(); track p._id; let i = $index) {
                <div class="pb-row" [style.--delay]="(i*40)+'ms'">
                  <div class="pb-rank">{{ i + 1 }}</div>
                  <div class="pb-avatar"
                    [style.background]="common.getAvatarStyle(p.customerName).background"
                    [style.color]="common.getAvatarStyle(p.customerName).color">
                    {{ common.getInitials(p.customerName) }}
                  </div>
                  <div class="pb-info">
                    <span class="pb-name">{{ p.customerName }}</span>
                    <div class="pb-meta">
                      <span class="pb-chip method">
                        <i class="pi pi-wallet" style="font-size:8px"></i>
                        {{ p.paymentMethods?.join(', ') || '—' }}
                      </span>
                      <span class="pb-chip">
                        {{ p.paymentCount }} payment{{ p.paymentCount !== 1 ? 's' : '' }}
                      </span>
                    </div>
                  </div>
                  <div class="pb-right">
                    <div class="pb-total">{{ common.formatCurrency(p.totalPaid) }}</div>
                    <div class="pb-delay"
                      [style.color]="p.avgPaymentDelay < 0
                        ? 'var(--color-success)' : p.avgPaymentDelay > 5
                        ? 'var(--color-error)' : 'var(--color-warning)'">
                      @if (p.avgPaymentDelay < 0) {
                        <i class="pi pi-check-circle"></i>
                        {{ Math.abs(p.avgPaymentDelay) | number:'1.1-1' }}d early
                      } @else if (p.avgPaymentDelay === 0) {
                        <i class="pi pi-check"></i> On time
                      } @else {
                        <i class="pi pi-clock"></i>
                        {{ p.avgPaymentDelay | number:'1.1-1' }}d late
                      }
                    </div>
                  </div>
                  <!-- payment bar -->
                  <div class="pb-bar-track">
                    <div class="pb-bar-fill"
                      [style.width]="barPct(p.totalPaid, maxPayment()) + '%'">
                    </div>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════════════════════════════
         TAB: LIFETIME VALUE
    ══════════════════════════════════════════ -->
    @if (activeTab() === 'ltv') {
      <div class="ca-section">

        <!-- LTV summary KPIs -->
        <div class="kpi-row">
          @for (kpi of ltvKpis(); track kpi.label; let i = $index) {
            <div class="kpi-card" [style.--delay]="(i*50)+'ms'">
              <div class="kpi-icon" [style.background]="kpi.iconBg" [style.color]="kpi.iconColor">
                <i [class]="kpi.icon"></i>
              </div>
              <div class="kpi-body">
                <div class="kpi-label">{{ kpi.label }}</div>
                <div class="kpi-value">{{ kpi.value }}</div>
              </div>
            </div>
          }
        </div>

        <div class="ca-card">
          <div class="ca-card-header">
            <span class="ca-card-title">
              <i class="pi pi-star-fill" style="color:var(--color-warning)"></i>
              Customer Lifetime Value Ranking
            </span>
          </div>
          <div class="ca-card-body gap-sm">
            @if (isLoading['ltv']) {
              @for (s of [1,2,3,4,5,6]; track s) {
                <p-skeleton height="64px" styleClass="mb-1"></p-skeleton>
              }
            } @else {
              @for (c of ltvData(); track c._id; let i = $index) {
                <div class="ltv-row" [style.--delay]="(i*40)+'ms'">

                  <!-- rank medal -->
                  <div class="ltv-medal" [class.gold]="i===0" [class.silver]="i===1" [class.bronze]="i===2">
                    @if (i < 3) { <i class="pi pi-star-fill"></i> }
                    @else { {{ i + 1 }} }
                  </div>

                  <div class="ltv-avatar"
                    [style.background]="common.getAvatarStyle(c.customerName).background"
                    [style.color]="common.getAvatarStyle(c.customerName).color">
                    {{ common.getInitials(c.customerName) }}
                  </div>

                  <div class="ltv-info">
                    <div class="ltv-name-row">
                      <span class="ltv-name">{{ c.customerName }}</span>
                      <span class="type-chip"
                        [class.individual]="c.type === 'individual'"
                        [class.business]="c.type === 'business'">
                        {{ c.type }}
                      </span>
                    </div>
                    <div class="ltv-meta">
                      <span>
                        <i class="pi pi-file-text" style="font-size:9px"></i>
                        {{ c.invoiceCount }} invoice{{ c.invoiceCount !== 1 ? 's' : '' }}
                      </span>
                      <span>·</span>
                      <span>AOV {{ common.formatCurrency(c.avgOrderValue) }}</span>
                      <span>·</span>
                      <span>{{ c.ageDays }}d tenure</span>
                    </div>
                  </div>

                  <div class="ltv-financials">
                    <div class="ltv-revenue">{{ common.formatCurrency(c.totalRevenue) }}</div>
                    <div class="ltv-paid-row">
                      <span class="ltv-paid-label">Paid</span>
                      <span class="ltv-paid-val"
                        [style.color]="c.totalPaid >= c.totalRevenue
                          ? 'var(--color-success)' : 'var(--color-warning)'">
                        {{ common.formatCurrency(c.totalPaid) }}
                      </span>
                    </div>
                  </div>

                  <!-- revenue bar -->
                  <div class="ltv-bar-wrap">
                    <div class="ltv-bar-fill"
                      [style.width]="barPct(c.totalRevenue, maxLTV()) + '%'">
                    </div>
                    @if (c.totalPaid < c.totalRevenue) {
                      <div class="ltv-bar-unpaid"
                        [style.width]="barPct(c.totalRevenue - c.totalPaid, maxLTV()) + '%'">
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════════════════════════════
         TAB: SEGMENTATION
    ══════════════════════════════════════════ -->
    @if (activeTab() === 'segmentation') {
      <div class="ca-section">
        <div class="seg-grid">
          @if (isLoading['segmentation']) {
            @for (s of [1,2,3]; track s) {
              <p-skeleton height="180px"></p-skeleton>
            }
          } @else {
            @for (seg of segmentData(); track seg._id; let i = $index) {
              <div class="seg-card" [style.--sc]="segColor(seg.segment)" [style.--delay]="(i*60)+'ms'">
                <div class="seg-card-top">
                  <div class="seg-icon">
                    <i [class]="segIcon(seg.segment)"></i>
                  </div>
                  <div class="seg-badge">{{ seg.segment }}</div>
                </div>
                <div class="seg-count">{{ seg.count }}</div>
                <div class="seg-count-label">customer{{ seg.count !== 1 ? 's' : '' }}</div>
                <div class="seg-revenue">
                  {{ common.formatCurrency(seg.totalRevenue) }}
                  <span class="seg-revenue-label">total revenue</span>
                </div>
                <div class="seg-bar-track">
                  <div class="seg-bar-fill"
                    [style.width]="barPct(seg.totalRevenue, maxSegRevenue()) + '%'">
                  </div>
                </div>
                <div class="seg-pct">
                  {{ barPct(seg.count, totalSegCustomers()) | number:'1.0-0' }}% of base
                </div>
              </div>
            }
          }
        </div>

        <!-- Segment descriptions -->
        <div class="ca-card">
          <div class="ca-card-header">
            <span class="ca-card-title">
              <i class="pi pi-info-circle"></i> Segment Guide
            </span>
          </div>
          <div class="ca-card-body">
            <div class="seg-guide-grid">
              @for (g of segGuide; track g.name) {
                <div class="seg-guide-item" [style.--sc]="g.color">
                  <div class="seg-guide-dot"></div>
                  <div>
                    <div class="seg-guide-name">{{ g.name }}</div>
                    <div class="seg-guide-desc">{{ g.desc }}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════════════════════════════
         TAB: GEOSPATIAL
    ══════════════════════════════════════════ -->
    @if (activeTab() === 'geo') {
      <div class="ca-section">
        <div class="ca-card">
          <div class="ca-card-header">
            <span class="ca-card-title">
              <i class="pi pi-map"></i> Geographic Distribution
            </span>
            <span class="ca-card-badge">{{ geoData().length }} locations</span>
          </div>
          <div class="ca-card-body gap-sm">
            @if (isLoading['geo']) {
              @for (s of [1,2,3]; track s) {
                <p-skeleton height="60px" styleClass="mb-1"></p-skeleton>
              }
            } @else {
              @for (loc of geoData(); track loc.location; let i = $index) {
                <div class="geo-row" [style.--delay]="(i*40)+'ms'">
                  <div class="geo-rank">{{ i + 1 }}</div>
                  <div class="geo-flag">
                    <i class="pi pi-map-marker"></i>
                  </div>
                  <div class="geo-info">
                    <div class="geo-location">
                      {{ common.toTitleCase(loc.city) }},
                      <span class="geo-state">{{ common.toTitleCase(loc.state) }}</span>
                    </div>
                    <div class="geo-bar-track">
                      <div class="geo-bar-fill"
                        [style.width]="barPct(loc.count, maxGeoCount()) + '%'">
                      </div>
                    </div>
                  </div>
                  <div class="geo-right">
                    <div class="geo-count">{{ loc.count }} customers</div>
                    <div class="geo-outstanding"
                      [style.color]="loc.outstanding > 0
                        ? 'var(--color-warning)' : 'var(--color-success)'">
                      @if (loc.outstanding > 0) {
                        ₹{{ common.formatCompactIndian(loc.outstanding) }} pending
                      } @else {
                        <i class="pi pi-check-circle"></i> Clear
                      }
                    </div>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    }

  </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════
       PAGE SHELL
    ═══════════════════════════════════════════ */
    :host { display: block; background: var(--bg-secondary); min-height: 100%; }

    .ca-page {
      max-width: 1600px;
      margin: 0 auto;
      padding: var(--spacing-xl);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    /* ═══════════════════════════════════════════
       HEADER
    ═══════════════════════════════════════════ */
    .ca-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg) var(--spacing-xl);
      box-shadow: var(--elevation-1);
    }

    .ca-header-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .ca-header-icon {
      width: 42px; height: 42px;
      border-radius: var(--ui-border-radius);
      background: var(--accent-gradient, linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)));
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .ca-header-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0; line-height: 1.2;
    }

    .ca-header-sub {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      margin: 2px 0 0;
    }

    .ca-refresh-btn {
      width: 36px; height: 36px;
      border-radius: var(--ui-border-radius-sm);
      border: 1px solid var(--border-primary);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 13px;
      transition: var(--transition-base);
      &:hover { background: var(--accent-focus); color: var(--accent-primary); border-color: var(--accent-primary); }
      &.spinning i { animation: spin 0.9s linear infinite; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ═══════════════════════════════════════════
       TABS
    ═══════════════════════════════════════════ */
    .ca-tabs {
      display: flex;
      gap: var(--spacing-xs);
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-xs);
      box-shadow: var(--elevation-1);
      flex-wrap: wrap;
    }

    .ca-tab {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: var(--transition-fast);
      position: relative;
      white-space: nowrap;

      i { font-size: 12px; opacity: 0.7; }

      &:hover { background: var(--bg-secondary); color: var(--text-primary); }

      &.active {
        background: var(--accent-primary);
        color: #fff;
        font-weight: var(--font-weight-semibold);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--accent-primary) 30%, transparent 70%);
        i { opacity: 1; }
      }
    }

    .tab-spinner {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.6;
      animation: pulse 1s ease infinite;
    }
    @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }

    /* ═══════════════════════════════════════════
       SECTION WRAPPER
    ═══════════════════════════════════════════ */
    .ca-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      animation: fadeUp 0.25s ease both;
    }
    @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

    /* ═══════════════════════════════════════════
       KPI ROW
    ═══════════════════════════════════════════ */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--spacing-md);
    }

    .kpi-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-lg);
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      box-shadow: var(--elevation-1);
      animation: cardReveal 0.3s ease both;
      animation-delay: var(--delay, 0ms);
      transition: box-shadow 0.2s ease, transform 0.2s ease;
      &:hover { box-shadow: var(--elevation-2); transform: translateY(-2px); }
    }
    @keyframes cardReveal { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

    .kpi-icon {
      width: 36px; height: 36px;
      border-radius: var(--ui-border-radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; flex-shrink: 0;
    }

    .kpi-body { flex: 1; min-width: 0; }
    .kpi-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-tertiary);
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      line-height: 1.1;
    }
    .kpi-sub {
      font-size: 10px;
      color: var(--text-tertiary);
      margin-top: 3px;
    }

    .kpi-trend {
      width: 22px; height: 22px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; flex-shrink: 0;
      &.up   { background: var(--color-success-bg); color: var(--color-success); }
      &.down { background: var(--color-error-bg);   color: var(--color-error); }
    }

    /* ═══════════════════════════════════════════
       TWO-COL GRID
    ═══════════════════════════════════════════ */
    .two-col-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
    }

    /* ═══════════════════════════════════════════
       CARD BASE
    ═══════════════════════════════════════════ */
    .ca-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--elevation-1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .ca-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-md) var(--spacing-lg);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-secondary);
      flex-shrink: 0;
    }

    .mt-section {
      margin-top: 0;
      border-top: 1px solid var(--border-primary);
    }

    .ca-card-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      i { font-size: 12px; color: var(--accent-primary); }
    }

    .ca-card-badge {
      font-size: 10px;
      font-weight: 700;
      background: var(--accent-focus);
      color: var(--accent-primary);
      border: 1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent 80%);
      padding: 2px 8px;
      border-radius: 99px;
    }

    .ca-card-body {
      flex: 1;
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      &.gap-sm { gap: var(--spacing-sm); }
    }

    /* ═══════════════════════════════════════════
       ALERT BANNER
    ═══════════════════════════════════════════ */
    .alert-banner {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--ui-border-radius);
      font-size: var(--font-size-sm);
      &.danger {
        background: var(--color-error-bg);
        border: 1px solid var(--color-error-border);
        color: var(--color-error);
        i { color: var(--color-error); }
      }
    }

    /* ═══════════════════════════════════════════
       SPLIT ROWS (overview breakdown)
    ═══════════════════════════════════════════ */
    .split-row {
      display: grid;
      grid-template-columns: 32px 1fr auto;
      grid-template-rows: auto 4px;
      align-items: center;
      gap: 0 var(--spacing-md);
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--border-primary);
      &:last-child { border-bottom: none; }
    }

    .split-avatar {
      width: 32px; height: 32px;
      border-radius: var(--ui-border-radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px;
    }

    .split-info { display: flex; flex-direction: column; gap: 1px; }
    .split-label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
    .split-count { font-size: 10px; color: var(--text-tertiary); }
    .split-amt {
      font-size: 11px; font-weight: 700; font-family: var(--font-mono);
      &.warn { color: var(--color-warning); }
      &.ok   { color: var(--color-success); font-size: 10px; }
    }

    .split-bar-wrap {
      grid-column: 1 / -1;
      height: 3px;
      background: var(--border-primary);
      border-radius: 99px;
      overflow: hidden;
      margin-top: 6px;
    }
    .split-bar {
      height: 100%;
      border-radius: 99px;
      transition: width 0.6s cubic-bezier(0.2,0.9,0.2,1);
    }

    /* ═══════════════════════════════════════════
       MONTH BAR CHART (horizontal)
    ═══════════════════════════════════════════ */
    .month-bars {
      display: flex;
      align-items: flex-end;
      gap: var(--spacing-xs);
      height: 100px;
      padding-bottom: var(--spacing-xs);
    }

    .month-bar-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      height: 100%;
      cursor: default;
    }

    .month-bar-fill {
      width: 100%;
      background: var(--accent-primary);
      border-radius: 3px 3px 0 0;
      min-height: 3px;
      transition: height 0.6s cubic-bezier(0.2,0.9,0.2,1);
      opacity: 0.85;
    }

    .month-bar-label {
      font-size: 9px;
      color: var(--text-tertiary);
      text-transform: uppercase;
    }

    .month-bars-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 4px var(--spacing-md);
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-sm);
      border-top: 1px solid var(--border-primary);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 10px;
      color: var(--text-secondary);
    }
    .legend-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--accent-primary);
    }

    /* ═══════════════════════════════════════════
       RANK ROWS
    ═══════════════════════════════════════════ */
    .rank-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--border-primary);
      &:last-child { border-bottom: none; }
    }

    .rank-num {
      width: 24px;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-tertiary);
      flex-shrink: 0;
      text-align: center;
    }

    .rank-avatar {
      width: 28px; height: 28px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 700;
      flex-shrink: 0;
      text-transform: uppercase;
    }

    .rank-info { flex: 1; min-width: 0; }
    .rank-name  { font-size: 12px; font-weight: 600; color: var(--text-primary); display: block; }
    .rank-sub   { font-size: 10px; color: var(--text-tertiary); display: flex; align-items: center; gap: 3px; }
    .rank-amt   { font-size: 11px; font-weight: 700; font-family: var(--font-mono); flex-shrink: 0; }

    /* ═══════════════════════════════════════════
       RECENT ROWS
    ═══════════════════════════════════════════ */
    .recent-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: 6px 0;
      border-bottom: 1px solid var(--border-primary);
      &:last-child { border-bottom: none; }
    }

    .recent-avatar {
      width: 26px; height: 26px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 700;
      flex-shrink: 0; text-transform: uppercase;
    }

    .recent-info { flex: 1; min-width: 0; }
    .recent-name { font-size: 12px; font-weight: 600; color: var(--text-primary); display: block; }
    .recent-meta {
      display: flex; align-items: center; gap: 4px;
      font-size: 10px; color: var(--text-tertiary);
    }

    .recent-outstanding {
      font-size: 11px; font-weight: 700;
      color: var(--color-warning);
      font-family: var(--font-mono);
      flex-shrink: 0;
    }

    /* Type chip */
    .type-chip {
      display: inline-flex;
      align-items: center;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      &.individual { background: var(--color-info-bg); color: var(--color-info); }
      &.business   { background: var(--color-success-bg); color: var(--color-success); }
    }

    /* ═══════════════════════════════════════════
       VERTICAL BAR CHART (financials)
    ═══════════════════════════════════════════ */
    .bar-chart-v {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 160px;
      padding-bottom: var(--spacing-md);
    }

    .bv-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 3px;
      height: 100%;
      cursor: default;
    }

    .bv-val {
      font-size: 8px;
      color: var(--accent-primary);
      font-weight: 700;
      white-space: nowrap;
    }

    .bv-bar-track {
      width: 100%;
      flex: 1;
      display: flex;
      align-items: flex-end;
    }

    .bv-bar-fill {
      width: 100%;
      background: var(--border-primary);
      border-radius: 3px 3px 0 0;
      min-height: 3px;
      transition: height 0.6s cubic-bezier(0.2,0.9,0.2,1);
      &.has-value {
        background: var(--accent-gradient,
          linear-gradient(to top, var(--accent-primary), var(--accent-secondary)));
      }
    }

    .bv-label {
      font-size: 8px;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* ═══════════════════════════════════════════
       AGING
    ═══════════════════════════════════════════ */
    .aging-row {
      display: grid;
      grid-template-columns: 60px 1fr auto;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--border-primary);
      &:last-child { border-bottom: none; }
    }

    .aging-days {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .aging-num  { font-size: 18px; font-weight: 700; color: var(--color-warning); line-height: 1; }
    .aging-unit { font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; }

    .aging-info { display: flex; flex-direction: column; gap: 4px; }
    .aging-count { font-size: 11px; color: var(--text-secondary); }

    .aging-bar-track {
      height: 4px; background: var(--border-primary);
      border-radius: 99px; overflow: hidden;
    }
    .aging-bar-fill {
      height: 100%; background: var(--color-warning);
      border-radius: 99px;
      transition: width 0.6s cubic-bezier(0.2,0.9,0.2,1);
    }

    .aging-total {
      font-size: 12px; font-weight: 700;
      font-family: var(--font-mono); color: var(--color-warning);
    }

    /* Overdue rows */
    .overdue-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--border-primary);
      &:last-child { border-bottom: none; }
    }

    .overdue-left { display: flex; align-items: center; gap: var(--spacing-sm); }
    .overdue-avatar {
      width: 28px; height: 28px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 700; flex-shrink: 0;
    }
    .overdue-customer { font-size: 12px; font-weight: 600; color: var(--text-primary); display: block; }
    .overdue-inv      { font-size: 10px; color: var(--text-tertiary); font-family: var(--font-mono); }

    .overdue-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
    .overdue-due { font-size: 10px; color: var(--color-error); font-weight: 600; }
    .overdue-amt { font-size: 12px; font-weight: 700; color: var(--color-error); font-family: var(--font-mono); }

    /* ═══════════════════════════════════════════
       PAYMENT BEHAVIOUR ROWS
    ═══════════════════════════════════════════ */
    .pb-row {
      display: grid;
      grid-template-columns: 20px 30px 1fr auto;
      grid-template-rows: auto 3px;
      align-items: center;
      gap: 0 var(--spacing-sm);
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--border-primary);
      animation: cardReveal 0.3s ease both;
      animation-delay: var(--delay, 0ms);
      &:last-child { border-bottom: none; }
    }

    .pb-rank {
      font-size: 11px; font-weight: 700;
      color: var(--text-tertiary); text-align: center;
    }

    .pb-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 700; text-transform: uppercase;
    }

    .pb-info { min-width: 0; }
    .pb-name {
      font-size: 12px; font-weight: 600;
      color: var(--text-primary); display: block;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .pb-meta { display: flex; align-items: center; gap: 4px; margin-top: 2px; }

    .pb-chip {
      display: inline-flex; align-items: center; gap: 3px;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 9px; font-weight: 600;
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      color: var(--text-secondary);
      &.method { color: var(--accent-primary); }
    }

    .pb-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
    .pb-total {
      font-size: 12px; font-weight: 700;
      font-family: var(--font-mono); color: var(--text-primary);
    }
    .pb-delay {
      display: flex; align-items: center; gap: 3px;
      font-size: 10px; font-weight: 600;
      i { font-size: 9px; }
    }

    .pb-bar-track {
      grid-column: 1 / -1;
      height: 3px;
      background: var(--border-primary);
      border-radius: 99px; overflow: hidden;
      margin-top: 6px;
    }
    .pb-bar-fill {
      height: 100%;
      background: var(--accent-gradient,
        linear-gradient(90deg, var(--accent-primary), var(--accent-secondary)));
      border-radius: 99px;
      transition: width 0.7s cubic-bezier(0.2,0.9,0.2,1);
    }

    /* ═══════════════════════════════════════════
       LTV ROWS
    ═══════════════════════════════════════════ */
    .ltv-row {
      display: grid;
      grid-template-columns: 32px 32px 1fr auto;
      grid-template-rows: auto 3px;
      align-items: center;
      gap: 0 var(--spacing-sm);
      padding: var(--spacing-md) 0;
      border-bottom: 1px solid var(--border-primary);
      animation: cardReveal 0.3s ease both;
      animation-delay: var(--delay, 0ms);
      &:last-child { border-bottom: none; }
    }

    .ltv-medal {
      width: 28px; height: 28px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700;
      background: var(--bg-secondary);
      color: var(--text-tertiary);
      border: 1px solid var(--border-primary);
      flex-shrink: 0;
      &.gold   { background: #fef3c7; color: #d97706; border-color: #fbbf24; i { font-size: 11px; } }
      &.silver { background: #f1f5f9; color: #64748b; border-color: #cbd5e1; i { font-size: 11px; } }
      &.bronze { background: #fef2e4; color: #b45309; border-color: #f59e0b; i { font-size: 11px; } }
    }

    .ltv-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 700; text-transform: uppercase;
      flex-shrink: 0;
    }

    .ltv-info { min-width: 0; }
    .ltv-name-row {
      display: flex; align-items: center; gap: 5px;
      margin-bottom: 2px;
    }
    .ltv-name {
      font-size: 12px; font-weight: 600; color: var(--text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ltv-meta {
      display: flex; align-items: center; gap: 5px;
      font-size: 10px; color: var(--text-tertiary);
    }

    .ltv-financials { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .ltv-revenue {
      font-size: 13px; font-weight: 700;
      font-family: var(--font-mono); color: var(--text-primary);
    }
    .ltv-paid-row { display: flex; align-items: center; gap: 4px; }
    .ltv-paid-label { font-size: 9px; color: var(--text-tertiary); }
    .ltv-paid-val   { font-size: 10px; font-weight: 600; font-family: var(--font-mono); }

    .ltv-bar-wrap {
      grid-column: 1 / -1;
      height: 3px;
      background: var(--border-primary);
      border-radius: 99px; overflow: hidden;
      margin-top: 8px;
      position: relative;
      display: flex;
    }
    .ltv-bar-fill {
      height: 100%;
      background: var(--accent-gradient,
        linear-gradient(90deg, var(--accent-primary), var(--accent-secondary)));
      border-radius: 99px;
      transition: width 0.7s cubic-bezier(0.2,0.9,0.2,1);
    }
    .ltv-bar-unpaid {
      height: 100%;
      background: var(--color-warning);
      opacity: 0.4;
      border-radius: 99px;
    }

    /* ═══════════════════════════════════════════
       SEGMENTATION
    ═══════════════════════════════════════════ */
    .seg-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--spacing-lg);
    }

    .seg-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-top: 3px solid var(--sc);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      box-shadow: var(--elevation-1);
      animation: cardReveal 0.3s ease both;
      animation-delay: var(--delay, 0ms);
      transition: box-shadow 0.2s, transform 0.2s;
      &:hover { box-shadow: var(--elevation-2); transform: translateY(-2px); }
    }

    .seg-card-top { display: flex; align-items: center; justify-content: space-between; }

    .seg-icon {
      width: 32px; height: 32px;
      border-radius: var(--ui-border-radius-sm);
      background: color-mix(in srgb, var(--sc) 12%, transparent 88%);
      color: var(--sc);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
    }

    .seg-badge {
      font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.05em;
      color: var(--sc);
      background: color-mix(in srgb, var(--sc) 10%, transparent 90%);
      border: 1px solid color-mix(in srgb, var(--sc) 25%, transparent 75%);
      padding: 2px 7px; border-radius: 99px;
    }

    .seg-count {
      font-size: 36px; font-weight: 700;
      color: var(--text-primary); line-height: 1;
    }
    .seg-count-label { font-size: 11px; color: var(--text-tertiary); }

    .seg-revenue {
      font-size: 14px; font-weight: 700;
      font-family: var(--font-mono); color: var(--text-primary);
      display: flex; flex-direction: column; gap: 1px;
    }
    .seg-revenue-label { font-size: 10px; color: var(--text-tertiary); font-family: inherit; font-weight: 400; }

    .seg-bar-track {
      height: 4px; background: var(--border-primary);
      border-radius: 99px; overflow: hidden;
    }
    .seg-bar-fill {
      height: 100%; background: var(--sc);
      border-radius: 99px;
      transition: width 0.7s cubic-bezier(0.2,0.9,0.2,1);
    }

    .seg-pct { font-size: 10px; color: var(--text-tertiary); }

    /* Segment guide */
    .seg-guide-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--spacing-md);
    }

    .seg-guide-item {
      display: flex; align-items: flex-start; gap: 10px;
    }
    .seg-guide-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: var(--sc); flex-shrink: 0; margin-top: 3px;
    }
    .seg-guide-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
    .seg-guide-desc { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }

    /* ═══════════════════════════════════════════
       GEOSPATIAL
    ═══════════════════════════════════════════ */
    .geo-row {
      display: grid;
      grid-template-columns: 24px 28px 1fr auto;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--border-primary);
      animation: cardReveal 0.3s ease both;
      animation-delay: var(--delay, 0ms);
      &:last-child { border-bottom: none; }
    }

    .geo-rank { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-align: center; }

    .geo-flag {
      width: 28px; height: 28px;
      border-radius: var(--ui-border-radius-sm);
      background: var(--color-info-bg);
      color: var(--color-info);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px;
    }

    .geo-info { min-width: 0; }
    .geo-location {
      font-size: 12px; font-weight: 600; color: var(--text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: 4px;
    }
    .geo-state { color: var(--text-secondary); }

    .geo-bar-track {
      height: 3px; background: var(--border-primary);
      border-radius: 99px; overflow: hidden;
    }
    .geo-bar-fill {
      height: 100%;
      background: var(--accent-gradient,
        linear-gradient(90deg, var(--accent-primary), var(--accent-secondary)));
      border-radius: 99px;
      transition: width 0.7s cubic-bezier(0.2,0.9,0.2,1);
    }

    .geo-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .geo-count { font-size: 12px; font-weight: 700; color: var(--text-primary); }
    .geo-outstanding {
      font-size: 10px; font-weight: 600;
      display: flex; align-items: center; gap: 3px;
      i { font-size: 9px; }
    }

    /* ═══════════════════════════════════════════
       EMPTY + SKELETON
    ═══════════════════════════════════════════ */
    .empty-panel {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-2xl);
      color: var(--text-tertiary);
      font-size: 12px;
      i { font-size: 24px; opacity: 0.4; }
      &.success { color: var(--color-success); i { opacity: 0.7; } }
    }

    .skeleton-row {
      display: flex; align-items: center; gap: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
      .flex-1 { flex: 1; }
    }

    /* ═══════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════ */
    @media (max-width: 900px) {
      .two-col-grid { grid-template-columns: 1fr; }
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 560px) {
      .ca-page { padding: var(--spacing-md); }
      .kpi-row { grid-template-columns: 1fr; }
      .ca-tabs { overflow-x: auto; flex-wrap: nowrap; }
    }
  `]
})
export class CustomerAnalyticsComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private svc = inject(CustomerAnalyticsService);
  public common = inject(CommonMethodService);

  protected Math = Math; // expose to template

  // ── signals ───────────────────────────────────────────────────────────────
  activeTab = signal<string>('overview');
  overviewData = signal<OverviewData | null>(null);
  financialData = signal<FinancialData | null>(null);
  paymentData = signal<any[]>([]);
  ltvData = signal<any[]>([]);
  segmentData = signal<any[]>([]);
  geoData = signal<any[]>([]);

  isLoading: Record<string, boolean> = {
    overview: false, financials: false, payment: false,
    ltv: false, segmentation: false, geo: false
  };

  anyLoading = computed(() => Object.values(this.isLoading).some(Boolean));

  // ── tabs ──────────────────────────────────────────────────────────────────
  tabs = [
    { key: 'overview', label: 'Overview', icon: 'pi pi-home' },
    { key: 'financials', label: 'Financials', icon: 'pi pi-wallet' },
    { key: 'payment', label: 'Payment Behaviour', icon: 'pi pi-credit-card' },
    { key: 'ltv', label: 'Lifetime Value', icon: 'pi pi-star' },
    { key: 'segmentation', label: 'Segmentation', icon: 'pi pi-chart-pie' },
    { key: 'geo', label: 'Geospatial', icon: 'pi pi-map' },
  ];

  // ── segment metadata ──────────────────────────────────────────────────────
  segGuide = [
    { name: 'Champions', color: '#10b981', desc: 'Bought recently, often & spent the most' },
    { name: 'Loyal', color: '#6366f1', desc: 'Regular buyers with high frequency' },
    { name: 'Need Attention', color: '#f59e0b', desc: 'Above-average but haven\'t bought recently' },
    { name: 'Recent', color: '#3b82f6', desc: 'Bought recently but infrequently' },
    { name: 'At Risk', color: '#ef4444', desc: 'Was engaged but gone quiet' },
    { name: 'Lost', color: '#94a3b8', desc: 'Lowest recency, frequency & value' },
  ];

  // ── computed: overview KPIs ───────────────────────────────────────────────
  overviewKpis = computed(() => {
    const d = this.overviewData();
    const totalCust = d?.overview?.customerStats?.reduce((s: number, c: any) => s + c.count, 0) ?? 0;
    const activeCount = d?.overview?.activeStats?.[0]?.count ?? 0;
    const totalOutstanding = d?.overview?.customerStats
      ?.reduce((s: number, c: any) => s + (c.totalOutstanding || 0), 0) ?? 0;
    const growthCount = d?.overview?.monthlyGrowth
      ?.reduce((s: number, m: any) => s + m.newCustomers, 0) ?? 0;

    return [
      {
        label: 'Total Customers',
        value: totalCust,
        icon: 'pi pi-users',
        iconBg: 'var(--color-info-bg)', iconColor: 'var(--color-info)',
        sub: `${activeCount} active`
      },
      {
        label: 'Total Outstanding',
        value: this.common.formatCurrency(totalOutstanding),
        icon: 'pi pi-wallet',
        iconBg: totalOutstanding > 0 ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
        iconColor: totalOutstanding > 0 ? 'var(--color-warning)' : 'var(--color-success)',
        sub: totalOutstanding > 0 ? 'Needs collection' : 'All clear'
      },
      {
        label: 'New This Period',
        value: growthCount,
        icon: 'pi pi-user-plus',
        iconBg: 'var(--color-success-bg)', iconColor: 'var(--color-success)',
        trend: growthCount > 0 ? 1 : 0
      },
      {
        label: 'Individual',
        value: d?.overview?.customerStats?.find((c: any) => c._id === 'individual')?.count ?? 0,
        icon: 'pi pi-user',
        iconBg: 'var(--accent-focus)', iconColor: 'var(--accent-primary)',
        sub: 'Retail customers'
      },
      {
        label: 'Business',
        value: d?.overview?.customerStats?.find((c: any) => c._id === 'business')?.count ?? 0,
        icon: 'pi pi-building',
        iconBg: 'var(--color-warning-bg)', iconColor: 'var(--color-warning)',
        sub: 'B2B accounts'
      },
    ];
  });

  totalCustomers = computed(() =>
    this.overviewData()?.overview?.customerStats
      ?.reduce((s: number, c: any) => s + c.count, 0) ?? 0
  );

  maxMonthlyGrowth = computed(() =>
    Math.max(...(this.overviewData()?.overview?.monthlyGrowth?.map((m: any) => m.newCustomers) ?? [1]))
  );

  // ── computed: financial ───────────────────────────────────────────────────
  totalSales = computed(() =>
    this.financialData()?.salesAnalysis?.reduce((s: number, m: any) => s + m.totalSales, 0) ?? 0
  );
  maxSales = computed(() =>
    Math.max(...(this.financialData()?.salesAnalysis?.map((m: any) => m.totalSales) ?? [1]), 1)
  );
  maxAging = computed(() =>
    Math.max(...(this.financialData()?.outstandingAging?.map((a: any) => a.totalAmount) ?? [1]), 1)
  );

  // ── computed: LTV KPIs ────────────────────────────────────────────────────
  ltvKpis = computed(() => {
    const d = this.ltvData();
    const total = d.reduce((s, c) => s + c.totalRevenue, 0);
    const avgAOV = d.length ? d.reduce((s, c) => s + c.avgOrderValue, 0) / d.length : 0;
    const topPaid = d.reduce((s, c) => s + c.totalPaid, 0);
    return [
      { label: 'Total LTV', value: this.common.formatCurrency(total), icon: 'pi pi-dollar', iconBg: 'var(--color-success-bg)', iconColor: 'var(--color-success)' },
      { label: 'Avg Order Value', value: this.common.formatCurrency(avgAOV), icon: 'pi pi-shopping-cart', iconBg: 'var(--color-info-bg)', iconColor: 'var(--color-info)' },
      { label: 'Total Collected', value: this.common.formatCurrency(topPaid), icon: 'pi pi-check-circle', iconBg: 'var(--accent-focus)', iconColor: 'var(--accent-primary)' },
      { label: 'Active Accounts', value: d.length, icon: 'pi pi-users', iconBg: 'var(--color-warning-bg)', iconColor: 'var(--color-warning)' },
    ];
  });

  maxLTV = computed(() => Math.max(...this.ltvData().map(c => c.totalRevenue), 1));
  maxPayment = computed(() => Math.max(...this.paymentData().map(p => p.totalPaid), 1));

  // ── computed: segmentation ────────────────────────────────────────────────
  maxSegRevenue = computed(() => Math.max(...this.segmentData().map(s => s.totalRevenue), 1));
  totalSegCustomers = computed(() => this.segmentData().reduce((s, seg) => s + seg.count, 0));

  // ── computed: geo ─────────────────────────────────────────────────────────
  maxGeoCount = computed(() => Math.max(...this.geoData().map(g => g.count), 1));

  // ── lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void { this.loadAll(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadAll(): void {
    this.loadOverview();
    this.loadFinancials();
    this.loadPaymentBehaviour();
    this.loadLTV();
    this.loadSegmentation();
    this.loadGeo();
  }

  private loadOverview(): void {
    this.isLoading['overview'] = true;
    this.common.apiCall(
      this.svc.getCustomerOverview(),
      (res: any) => this.overviewData.set(res.data),
      'CustomerOverview',
      { destroy$: this.destroy$, skipLoading: true }
    );
    // turn off spinner after subscribe completes — finalize handles this via apiCall
    // We reset manually because apiCall doesn't give us a hook post-finalize per tab
    setTimeout(() => this.isLoading['overview'] = false, 800);
  }

  private loadFinancials(): void {
    this.isLoading['financials'] = true;
    this.common.apiCall(
      this.svc.getFinancials(),
      (res: any) => {
        this.financialData.set(res.data);
        this.isLoading['financials'] = false;
      },
      'CustomerFinancials',
      { destroy$: this.destroy$, skipLoading: true }
    );
    setTimeout(() => this.isLoading['financials'] = false, 800);
  }

  private loadPaymentBehaviour(): void {
    this.isLoading['payment'] = true;
    this.common.apiCall(
      this.svc.getPaymentBehavior(),
      (res: any) => {
        this.paymentData.set(res.data ?? []);
        this.isLoading['payment'] = false;
      },
      'PaymentBehaviour',
      { destroy$: this.destroy$, skipLoading: true }
    );
    setTimeout(() => this.isLoading['payment'] = false, 800);
  }

  private loadLTV(): void {
    this.isLoading['ltv'] = true;
    this.common.apiCall(
      this.svc.getLTV(),
      (res: any) => {
        this.ltvData.set(res.data ?? []);
        this.isLoading['ltv'] = false;
      },
      'CustomerLTV',
      { destroy$: this.destroy$, skipLoading: true }
    );
    setTimeout(() => this.isLoading['ltv'] = false, 800);
  }

  private loadSegmentation(): void {
    this.isLoading['segmentation'] = true;
    this.common.apiCall(
      this.svc.getSegmentation(),
      (res: any) => {
        this.segmentData.set(res.data ?? []);
        this.isLoading['segmentation'] = false;
      },
      'Segmentation',
      { destroy$: this.destroy$, skipLoading: true }
    );
    setTimeout(() => this.isLoading['segmentation'] = false, 800);
  }

  private loadGeo(): void {
    this.isLoading['geo'] = true;
    this.common.apiCall(
      this.svc.getGeospatial(),
      (res: any) => {
        this.geoData.set(res.data ?? []);
        this.isLoading['geo'] = false;
      },
      'Geospatial',
      { destroy$: this.destroy$, skipLoading: true }
    );
    setTimeout(() => this.isLoading['geo'] = false, 800);
  }

  // ── helpers ───────────────────────────────────────────────────────────────
  barPct(val: number, max: number): number {
    if (!max || max === 0) return 0;
    return this.common.clamp(this.common.round((val / max) * 100, 1), 0, 100);
  }

  monthLabel(m: number): string {
    return ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m] ?? '';
  }
  monthShort(m: number): string { return this.monthLabel(m); }
  monthName(m: number): string { return this.monthLabel(m); }

  segColor(seg: string): string {
    const map: Record<string, string> = {
      'Champions': '#10b981',
      'Loyal': '#6366f1',
      'Need Attention': '#f59e0b',
      'Recent': '#3b82f6',
      'At Risk': '#ef4444',
      'Lost': '#94a3b8',
    };
    return map[seg] ?? 'var(--accent-primary)';
  }

  segIcon(seg: string): string {
    const map: Record<string, string> = {
      'Champions': 'pi pi-star-fill',
      'Loyal': 'pi pi-heart',
      'Need Attention': 'pi pi-exclamation-triangle',
      'Recent': 'pi pi-clock',
      'At Risk': 'pi pi-shield',
      'Lost': 'pi pi-times-circle',
    };
    return map[seg] ?? 'pi pi-users';
  }
}
// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-customer-analytics',
//   imports: [],
//   templateUrl: './customer-analytics.html',
//   styleUrl: './customer-analytics.scss',
// })
// export class CustomerAnalytics {

// }
