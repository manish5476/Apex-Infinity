import {
  Component, OnInit, OnDestroy, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { CommonMethodService } from '@core/utils/common-method.service';
import { CustomerAnalyticsService } from '../../customer-analytics.service';

interface OverviewData { overview: any; recentCustomers: any[] }
interface FinancialData { salesAnalysis: any[]; paymentPatterns: any[]; overdueInvoices: any[]; outstandingAging: any[] }

@Component({
  selector: 'app-customer-analytics',
  standalone: true,
  imports: [CommonModule, TooltipModule, SkeletonModule],
  template: `
  <div class="ca-page">

    <!-- ══ HEADER ══ -->
    <header class="ca-header">
      <div class="ca-header-left">
        <div class="ca-header-icon">
          <i class="pi pi-users"></i>
          <span class="ca-header-icon-ring"></span>
        </div>
        <div>
          <h1 class="ca-header-title">Customer Analytics</h1>
          <p class="ca-header-sub">360° view · behaviour · lifetime value · financials</p>
        </div>
      </div>
      <div class="ca-header-actions">
        <button class="ca-action-btn ghost" (click)="loadAll()" [class.spinning]="anyLoading()"
          pTooltip="Refresh all data" tooltipPosition="bottom">
          <i class="pi pi-refresh"></i>
        </button>
      </div>
    </header>

    <!-- ══ TABS ══ -->
    <nav class="ca-tabs">
      <div class="ca-tabs-track">
        @for (tab of tabs; track tab.key; let i = $index) {
          <button class="ca-tab" [class.active]="activeTab() === tab.key"
            [style.--ti]="i" (click)="activeTab.set(tab.key)">
            <span class="ca-tab-icon"><i [class]="tab.icon"></i></span>
            <span class="ca-tab-label">{{ tab.label }}</span>
            @if (isLoading[tab.key]) { <span class="tab-dot"></span> }
          </button>
        }
      </div>
    </nav>

    <!-- ══════════════════ OVERVIEW ══════════════════ -->
    @if (activeTab() === 'overview') {
      <div class="ca-section">

        <!-- KPI Strip -->
        <div class="kpi-strip">
          @for (kpi of overviewKpis(); track kpi.label; let i = $index) {
            <div class="kpi-card" [style.--i]="i">
              <div class="kpi-icon-wrap" [style.--kc]="kpi.iconColor" [style.background]="kpi.iconBg">
                <i [class]="kpi.icon"></i>
              </div>
              <div class="kpi-content">
                <div class="kpi-label">{{ kpi.label }}</div>
                @if (isLoading['overview']) {
                  <p-skeleton height="22px" width="72px" styleClass="kpi-skel"></p-skeleton>
                } @else {
                  <div class="kpi-value">{{ kpi.value }}</div>
                }
                @if (kpi.sub) { <div class="kpi-sub">{{ kpi.sub }}</div> }
              </div>
              @if (kpi.trend) {
                <div class="kpi-badge" [class.pos]="kpi.trend > 0" [class.neg]="kpi.trend < 0">
                  <i [class]="kpi.trend > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
                </div>
              }
              <div class="kpi-glow" [style.background]="kpi.iconColor"></div>
            </div>
          }
        </div>

        <div class="grid-2">
          <!-- Customer type split -->
          <div class="ca-card">
            <div class="ca-card-hd">
              <div class="ca-card-title"><i class="pi pi-chart-pie"></i>Customer Breakdown</div>
            </div>
            <div class="ca-card-body">
              @if (isLoading['overview']) {
                @for (s of [1,2]; track s) {
                  <div class="skel-row">
                    <p-skeleton shape="circle" size="30px"></p-skeleton>
                    <p-skeleton height="12px" styleClass="flex-1"></p-skeleton>
                  </div>
                }
              } @else if (!overviewData()?.overview?.customerStats?.length) {
                <div class="empty-state">
                  <i class="pi pi-chart-pie"></i><span>No customer data</span>
                </div>
              } @else {
                @for (seg of overviewData()?.overview?.customerStats ?? []; track seg._id) {
                  <div class="split-item">
                    <div class="split-avatar"
                      [style.background]="seg._id === 'individual' ? 'var(--color-info-bg)' : 'var(--color-success-bg)'"
                      [style.color]="seg._id === 'individual' ? 'var(--color-info)' : 'var(--color-success)'">
                      <i [class]="seg._id === 'individual' ? 'pi pi-user' : 'pi pi-building'"></i>
                    </div>
                    <div class="split-body">
                      <div class="split-top">
                        <span class="split-name">{{ common.toTitleCase(seg._id) }}</span>
                        <span class="split-count">{{ seg.count }}</span>
                        @if (seg.totalOutstanding > 0) {
                          <span class="pill warn">{{ common.formatCurrency(seg.totalOutstanding) }}</span>
                        } @else {
                          <span class="pill ok">Clear</span>
                        }
                      </div>
                      <div class="mini-track">
                        <div class="mini-fill"
                          [style.width]="barPct(seg.count, totalCustomers()) + '%'"
                          [style.background]="seg._id === 'individual' ? 'var(--color-info)' : 'var(--color-success)'">
                        </div>
                      </div>
                    </div>
                  </div>
                }
              }
            </div>
          </div>

          <!-- Monthly acquisition bars -->
          <div class="ca-card">
            <div class="ca-card-hd">
              <div class="ca-card-title"><i class="pi pi-chart-line"></i>Monthly Acquisition</div>
            </div>
            <div class="ca-card-body">
              @if (isLoading['overview']) {
                <p-skeleton height="110px"></p-skeleton>
              } @else if (!overviewData()?.overview?.monthlyGrowth?.length) {
                <div class="empty-state">
                  <i class="pi pi-chart-line"></i><span>No acquisition data</span>
                </div>
              } @else {
                <div class="acq-chart">
                  @for (m of overviewData()?.overview?.monthlyGrowth ?? []; track m._id.month; let i = $index) {
                    <div class="acq-col" [style.--ci]="i"
                      [pTooltip]="monthLabel(m._id.month) + ' · ' + m.newCustomers + ' new'"
                      tooltipPosition="top">
                      <span class="acq-val">{{ m.newCustomers }}</span>
                      <div class="acq-bar" [style.height]="barPct(m.newCustomers, maxMonthlyGrowth()) + '%'"></div>
                      <span class="acq-lbl">{{ monthLabel(m._id.month) }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <div class="grid-2">
          <!-- Top outstanding -->
          <div class="ca-card">
            <div class="ca-card-hd">
              <div class="ca-card-title"><i class="pi pi-star"></i>Top Outstanding</div>
            </div>
            <div class="ca-card-body gap-sm">
              @if (isLoading['overview']) {
                @for (s of [1,2,3]; track s) { <p-skeleton height="42px" styleClass="mb-1"></p-skeleton> }
              } @else if (!overviewData()?.overview?.topCustomers?.length) {
                <div class="empty-state success">
                  <i class="pi pi-check-circle"></i><span>No outstanding balances</span>
                </div>
              } @else {
                @for (c of overviewData()?.overview?.topCustomers ?? []; track c._id; let i = $index) {
                  <div class="list-row" [style.--ri]="i">
                    <div class="list-rank">#{{ i + 1 }}</div>
                    <div class="list-av"
                      [style.background]="common.getAvatarStyle(c.name).background"
                      [style.color]="common.getAvatarStyle(c.name).color">
                      {{ common.getInitials(c.name) }}
                    </div>
                    <div class="list-info">
                      <span class="list-name">{{ c.name }}</span>
                      <span class="list-sub"><i class="pi pi-phone"></i>{{ common.formatPhone(c.phone) }}</span>
                    </div>
                    <div class="list-amt"
                      [style.color]="c.outstandingBalance > 0 ? 'var(--color-warning)' : 'var(--color-success)'">
                      {{ c.outstandingBalance > 0 ? common.formatCurrency(c.outstandingBalance) : '✓ Clear' }}
                    </div>
                  </div>
                }
              }
            </div>
          </div>

          <!-- Recent customers -->
          <div class="ca-card">
            <div class="ca-card-hd">
              <div class="ca-card-title"><i class="pi pi-clock"></i>Recent Customers</div>
            </div>
            <div class="ca-card-body gap-sm">
              @if (isLoading['overview']) {
                @for (s of [1,2,3,4,5]; track s) { <p-skeleton height="34px" styleClass="mb-1"></p-skeleton> }
              } @else if (!overviewData()?.recentCustomers?.length) {
                <div class="empty-state">
                  <i class="pi pi-users"></i><span>No recent customers</span>
                </div>
              } @else {
                @for (c of overviewData()?.recentCustomers ?? []; track c._id; let i = $index) {
                  <div class="list-row compact" [style.--ri]="i">
                    <div class="list-av sm"
                      [style.background]="common.getAvatarStyle(c.name).background"
                      [style.color]="common.getAvatarStyle(c.name).color">
                      {{ common.getInitials(c.name) }}
                    </div>
                    <div class="list-info">
                      <span class="list-name">{{ c.name }}</span>
                      <span class="list-sub">
                        <span class="type-pill" [class.ind]="c.type === 'individual'" [class.biz]="c.type === 'business'">
                          {{ c.type }}
                        </span>
                        · {{ common.timeAgoText(c.createdAt) }}
                      </span>
                    </div>
                    @if (c.outstandingBalance > 0) {
                      <span class="warn-amt">{{ common.formatCurrency(c.outstandingBalance) }}</span>
                    }
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════ FINANCIALS ══════════════════ -->
    @if (activeTab() === 'financials') {
      <div class="ca-section">
        @if ((financialData()?.overdueInvoices?.length ?? 0) > 0) {
          <div class="alert-strip">
            <i class="pi pi-exclamation-triangle"></i>
            <strong>{{ financialData()!.overdueInvoices.length }} overdue invoice(s)</strong>
            — immediate attention required
          </div>
        }

        <div class="grid-2">
          <!-- Monthly sales vertical bar chart -->
          <div class="ca-card">
            <div class="ca-card-hd">
              <div class="ca-card-title"><i class="pi pi-chart-bar"></i>Monthly Sales</div>
              <span class="ca-badge">{{ common.formatCurrency(totalSales()) }} YTD</span>
            </div>
            <div class="ca-card-body chart-body">
              @if (isLoading['financials']) {
                <p-skeleton height="180px"></p-skeleton>
              } @else {
                <div class="v-chart">
                  @for (m of financialData()?.salesAnalysis ?? []; track m._id.month; let i = $index) {
                    <div class="vc-col" [style.--ci]="i"
                      [pTooltip]="monthName(m._id.month) + ': ' + common.formatCurrency(m.totalSales)"
                      tooltipPosition="top">
                      @if (m.totalSales > 0) {
                        <span class="vc-val">{{ common.formatCompactIndian(m.totalSales) }}</span>
                      }
                      <div class="vc-track">
                        <div class="vc-fill" [class.active]="m.totalSales > 0"
                          [style.height]="barPct(m.totalSales, maxSales()) + '%'"></div>
                      </div>
                      <span class="vc-lbl">{{ monthShort(m._id.month) }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Aging + Overdue stacked -->
          <div class="ca-card stacked">
            <!-- Aging -->
            <div class="ca-card-hd">
              <div class="ca-card-title"><i class="pi pi-wallet"></i>Outstanding Aging</div>
            </div>
            <div class="ca-card-body gap-sm">
              @if (isLoading['financials']) {
                @for (s of [1,2]; track s) { <p-skeleton height="40px"></p-skeleton> }
              } @else if (!financialData()?.outstandingAging?.length) {
                <div class="empty-state">
                  <i class="pi pi-check-circle"></i><span>No outstanding aging</span>
                </div>
              } @else {
                @for (a of financialData()?.outstandingAging ?? []; track a._id; let i = $index) {
                  <div class="aging-row" [style.--ri]="i">
                    <div class="aging-days">
                      <span class="aging-n">{{ a._id }}</span>
                      <span class="aging-u">days</span>
                    </div>
                    <div class="aging-mid">
                      <span class="aging-ct">{{ a.count }} invoice(s)</span>
                      <div class="bar-track"><div class="bar-fill warn" [style.width]="barPct(a.totalAmount, maxAging()) + '%'"></div></div>
                    </div>
                    <span class="aging-total">{{ common.formatCurrency(a.totalAmount) }}</span>
                  </div>
                }
              }
            </div>

            <!-- Overdue -->
            <div class="ca-card-hd inner-hd">
              <div class="ca-card-title">
                <i class="pi pi-exclamation-circle" style="color:var(--color-error)"></i>Overdue Invoices
              </div>
            </div>
            <div class="ca-card-body gap-sm">
              @if (!financialData()?.overdueInvoices?.length) {
                <div class="empty-state success"><i class="pi pi-check-circle"></i><span>All invoices on time</span></div>
              } @else {
                @for (inv of financialData()?.overdueInvoices ?? []; track inv._id; let i = $index) {
                  <div class="overdue-row" [style.--ri]="i">
                    <div class="list-av sm"
                      [style.background]="common.getAvatarStyle(inv.customerId.name).background"
                      [style.color]="common.getAvatarStyle(inv.customerId.name).color">
                      {{ common.getInitials(inv.customerId.name) }}
                    </div>
                    <div class="list-info">
                      <span class="list-name">{{ inv.customerId.name }}</span>
                      <span class="list-sub mono">{{ inv.invoiceNumber }}</span>
                    </div>
                    <div class="overdue-right">
                      <span class="due-label">Due {{ common.timeAgoText(inv.dueDate) }}</span>
                      <span class="due-amt">{{ common.formatCurrency(inv.balanceAmount) }}</span>
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════ PAYMENT BEHAVIOUR ══════════════════ -->
    @if (activeTab() === 'payment') {
      <div class="ca-section">
        <div class="ca-card">
          <div class="ca-card-hd">
            <div class="ca-card-title"><i class="pi pi-credit-card"></i>Payment Behaviour by Customer</div>
            <span class="ca-badge">{{ paymentData().length }} customers</span>
          </div>
          <div class="ca-card-body gap-sm">
            @if (isLoading['payment']) {
              @for (s of [1,2,3,4,5]; track s) { <p-skeleton height="52px" styleClass="mb-1"></p-skeleton> }
            } @else {
              @for (p of paymentData(); track p._id; let i = $index) {
                <div class="pb-row" [style.--ri]="i">
                  <span class="pb-rank">{{ i + 1 }}</span>
                  <div class="list-av"
                    [style.background]="common.getAvatarStyle(p.customerName).background"
                    [style.color]="common.getAvatarStyle(p.customerName).color">
                    {{ common.getInitials(p.customerName) }}
                  </div>
                  <div class="list-info">
                    <span class="list-name">{{ p.customerName }}</span>
                    <div class="chip-row">
                      <span class="tag method"><i class="pi pi-wallet"></i>{{ p.paymentMethods?.join(', ') || '—' }}</span>
                      <span class="tag">{{ p.paymentCount }} payment{{ p.paymentCount !== 1 ? 's' : '' }}</span>
                    </div>
                  </div>
                  <div class="pb-right">
                    <span class="pb-total">{{ common.formatCurrency(p.totalPaid) }}</span>
                    <span class="pb-delay"
                      [style.color]="p.avgPaymentDelay < 0 ? 'var(--color-success)' : p.avgPaymentDelay > 5 ? 'var(--color-error)' : 'var(--color-warning)'">
                      @if (p.avgPaymentDelay < 0) {
                        <i class="pi pi-check-circle"></i>{{ Math.abs(p.avgPaymentDelay) | number:'1.1-1' }}d early
                      } @else if (p.avgPaymentDelay === 0) {
                        <i class="pi pi-check"></i>On time
                      } @else {
                        <i class="pi pi-clock"></i>{{ p.avgPaymentDelay | number:'1.1-1' }}d late
                      }
                    </span>
                  </div>
                  <div class="row-bar-track">
                    <div class="row-bar-fill" [style.width]="barPct(p.totalPaid, maxPayment()) + '%'"></div>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════ LIFETIME VALUE ══════════════════ -->
    @if (activeTab() === 'ltv') {
      <div class="ca-section">
        <div class="kpi-strip">
          @for (kpi of ltvKpis(); track kpi.label; let i = $index) {
            <div class="kpi-card" [style.--i]="i">
              <div class="kpi-icon-wrap" [style.--kc]="kpi.iconColor" [style.background]="kpi.iconBg">
                <i [class]="kpi.icon"></i>
              </div>
              <div class="kpi-content">
                <div class="kpi-label">{{ kpi.label }}</div>
                <div class="kpi-value">{{ kpi.value }}</div>
              </div>
              <div class="kpi-glow" [style.background]="kpi.iconColor"></div>
            </div>
          }
        </div>

        <div class="ca-card">
          <div class="ca-card-hd">
            <div class="ca-card-title">
              <i class="pi pi-star-fill" style="color:var(--color-warning)"></i>Customer Lifetime Value Ranking
            </div>
          </div>
          <div class="ca-card-body gap-sm">
            @if (isLoading['ltv']) {
              @for (s of [1,2,3,4,5,6]; track s) { <p-skeleton height="60px" styleClass="mb-1"></p-skeleton> }
            } @else {
              @for (c of ltvData(); track c._id; let i = $index) {
                <div class="ltv-row" [style.--ri]="i">
                  <div class="ltv-medal" [class.gold]="i===0" [class.silver]="i===1" [class.bronze]="i===2">
                    @if (i < 3) { <i class="pi pi-star-fill"></i> } @else { {{ i + 1 }} }
                  </div>
                  <div class="list-av"
                    [style.background]="common.getAvatarStyle(c.customerName).background"
                    [style.color]="common.getAvatarStyle(c.customerName).color">
                    {{ common.getInitials(c.customerName) }}
                  </div>
                  <div class="list-info">
                    <div class="list-name-row">
                      <span class="list-name">{{ c.customerName }}</span>
                      <span class="type-pill" [class.ind]="c.type === 'individual'" [class.biz]="c.type === 'business'">
                        {{ c.type }}
                      </span>
                    </div>
                    <div class="ltv-meta">
                      <span><i class="pi pi-file-text"></i>{{ c.invoiceCount }} inv</span>
                      <span>·</span>
                      <span>AOV {{ common.formatCurrency(c.avgOrderValue) }}</span>
                      <span>·</span>
                      <span>{{ c.ageDays }}d</span>
                    </div>
                  </div>
                  <div class="ltv-vals">
                    <span class="ltv-rev">{{ common.formatCurrency(c.totalRevenue) }}</span>
                    <span class="ltv-paid" [style.color]="c.totalPaid >= c.totalRevenue ? 'var(--color-success)' : 'var(--color-warning)'">
                      Paid {{ common.formatCurrency(c.totalPaid) }}
                    </span>
                  </div>
                  <div class="row-bar-track dual">
                    <div class="row-bar-fill" [style.width]="barPct(c.totalRevenue, maxLTV()) + '%'"></div>
                    @if (c.totalPaid < c.totalRevenue) {
                      <div class="row-bar-fill unpaid" [style.width]="barPct(c.totalRevenue - c.totalPaid, maxLTV()) + '%'"></div>
                    }
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════ SEGMENTATION ══════════════════ -->
    @if (activeTab() === 'segmentation') {
      <div class="ca-section">
        <div class="seg-grid">
          @if (isLoading['segmentation']) {
            @for (s of [1,2,3,4,5,6]; track s) { <p-skeleton height="170px"></p-skeleton> }
          } @else {
            @for (seg of segmentData(); track seg._id; let i = $index) {
              <div class="seg-card" [style.--sc]="segColor(seg.segment)" [style.--i]="i">
                <div class="seg-card-top">
                  <div class="seg-icon"><i [class]="segIcon(seg.segment)"></i></div>
                  <span class="seg-pill">{{ seg.segment }}</span>
                </div>
                <div class="seg-count">{{ seg.count }}</div>
                <div class="seg-ct-lbl">customer{{ seg.count !== 1 ? 's' : '' }}</div>
                <div class="seg-revenue">
                  {{ common.formatCurrency(seg.totalRevenue) }}
                  <span class="seg-rev-lbl">total revenue</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill seg" [style.width]="barPct(seg.totalRevenue, maxSegRevenue()) + '%'"></div>
                </div>
                <div class="seg-pct">{{ barPct(seg.count, totalSegCustomers()) | number:'1.0-0' }}% of base</div>
              </div>
            }
          }
        </div>

        <div class="ca-card">
          <div class="ca-card-hd">
            <div class="ca-card-title"><i class="pi pi-info-circle"></i>Segment Guide</div>
          </div>
          <div class="ca-card-body">
            <div class="guide-grid">
              @for (g of segGuide; track g.name) {
                <div class="guide-item" [style.--sc]="g.color">
                  <div class="guide-dot"></div>
                  <div>
                    <div class="guide-name">{{ g.name }}</div>
                    <div class="guide-desc">{{ g.desc }}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════ GEOSPATIAL ══════════════════ -->
    @if (activeTab() === 'geo') {
      <div class="ca-section">
        <div class="ca-card">
          <div class="ca-card-hd">
            <div class="ca-card-title"><i class="pi pi-map"></i>Geographic Distribution</div>
            <span class="ca-badge">{{ geoData().length }} locations</span>
          </div>
          <div class="ca-card-body gap-sm">
            @if (isLoading['geo']) {
              @for (s of [1,2,3,4]; track s) { <p-skeleton height="56px" styleClass="mb-1"></p-skeleton> }
            } @else {
              @for (loc of geoData(); track loc.location; let i = $index) {
                <div class="geo-row" [style.--ri]="i">
                  <span class="geo-rank">{{ i + 1 }}</span>
                  <div class="geo-pin"><i class="pi pi-map-marker"></i></div>
                  <div class="list-info">
                    <span class="list-name">
                      {{ common.toTitleCase(loc.city) }}, <span class="geo-state">{{ common.toTitleCase(loc.state) }}</span>
                    </span>
                    <div class="bar-track sm"><div class="bar-fill" [style.width]="barPct(loc.count, maxGeoCount()) + '%'"></div></div>
                  </div>
                  <div class="geo-right">
                    <span class="geo-count">{{ loc.count }} customers</span>
                    <span class="geo-out" [style.color]="loc.outstanding > 0 ? 'var(--color-warning)' : 'var(--color-success)'">
                      @if (loc.outstanding > 0) {
                        ₹{{ common.formatCompactIndian(loc.outstanding) }} pending
                      } @else {
                        <i class="pi pi-check-circle"></i> Clear
                      }
                    </span>
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
    /* ───────────────────────────────────────────────────
       HOST + PAGE SHELL
    ─────────────────────────────────────────────────── */
    :host { display: block; background: var(--bg-secondary); min-height: 100%; }

    .ca-page {
      width: 100%;
      padding: var(--spacing-xl);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    /* ───────────────────────────────────────────────────
       HEADER
    ─────────────────────────────────────────────────── */
    .ca-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg) var(--spacing-xl);
      box-shadow: var(--elevation-1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--accent-gradient);
        opacity: 0.02;
        pointer-events: none;
      }
    }

    .ca-header-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .ca-header-icon {
      position: relative;
      width: 44px; height: 44px;
      border-radius: var(--ui-border-radius);
      background: var(--accent-gradient);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
      box-shadow: 0 4px 14px color-mix(in srgb, var(--accent-primary) 40%, transparent 60%);
    }

    .ca-header-icon-ring {
      position: absolute;
      inset: -3px;
      border-radius: calc(var(--ui-border-radius) + 3px);
      border: 1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent 70%);
      pointer-events: none;
      animation: ring-pulse 3s ease infinite;
    }
    @keyframes ring-pulse {
      0%,100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 0.2; transform: scale(1.06); }
    }

    .ca-header-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0; line-height: 1.2;
      letter-spacing: -0.01em;
    }

    .ca-header-sub {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      margin: 2px 0 0;
      letter-spacing: 0.01em;
    }

    .ca-header-actions { display: flex; gap: var(--spacing-sm); }

    .ca-action-btn {
      width: 34px; height: 34px;
      border-radius: var(--ui-border-radius-sm);
      border: 1px solid var(--border-primary);
      cursor: pointer; font-size: 12px;
      display: flex; align-items: center; justify-content: center;
      transition: var(--transition-base);

      &.ghost {
        background: var(--bg-secondary);
        color: var(--text-secondary);
        &:hover { background: var(--accent-focus); color: var(--accent-primary); border-color: var(--accent-primary); }
      }
      &.spinning i { animation: spin 0.8s linear infinite; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ───────────────────────────────────────────────────
       TABS
    ─────────────────────────────────────────────────── */
    .ca-tabs {
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      padding: 4px;
      box-shadow: var(--elevation-1);
    }

    .ca-tabs-track {
      display: flex;
      gap: 2px;
      flex-wrap: wrap;
    }

    .ca-tab {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 7px;
      border: none;
      background: transparent;
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: var(--transition-fast);
      white-space: nowrap;
      position: relative;
      animation: tabIn 0.25s ease calc(var(--ti, 0) * 30ms) both;

      &:hover { background: var(--bg-secondary); color: var(--text-secondary); }

      &.active {
        background: var(--accent-gradient);
        color: #fff;
        font-weight: var(--font-weight-semibold);
        box-shadow: 0 2px 10px color-mix(in srgb, var(--accent-primary) 35%, transparent 65%);
      }
    }
    @keyframes tabIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; } }

    .ca-tab-icon { display: flex; align-items: center; i { font-size: 11px; } }
    .ca-tab-label { font-size: 11px; }

    .tab-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: currentColor; opacity: 0.7;
      animation: dot-blink 1.1s ease infinite;
    }
    @keyframes dot-blink { 0%,100%{opacity:0.2} 50%{opacity:0.9} }

    /* ───────────────────────────────────────────────────
       SECTION
    ─────────────────────────────────────────────────── */
    .ca-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      animation: sectionIn 0.22s cubic-bezier(0.2,0.9,0.2,1) both;
    }
    @keyframes sectionIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }

    /* ───────────────────────────────────────────────────
       GRIDS
    ─────────────────────────────────────────────────── */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
    }

    /* ───────────────────────────────────────────────────
       KPI STRIP
    ─────────────────────────────────────────────────── */
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: var(--spacing-md);
    }

    .kpi-card {
      position: relative;
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-lg);
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      box-shadow: var(--elevation-1);
      overflow: hidden;
      animation: kpiIn 0.3s ease calc(var(--i, 0) * 55ms) both;
      transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
      cursor: default;

      &:hover {
        box-shadow: var(--elevation-2);
        transform: translateY(-2px);
        border-color: color-mix(in srgb, var(--accent-primary) 25%, var(--border-primary) 75%);
      }
    }
    @keyframes kpiIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }

    .kpi-glow {
      position: absolute;
      right: -20px; top: -20px;
      width: 80px; height: 80px;
      border-radius: 50%;
      opacity: 0.06;
      filter: blur(20px);
      pointer-events: none;
      transition: opacity 0.3s;
    }
    .kpi-card:hover .kpi-glow { opacity: 0.12; }

    .kpi-icon-wrap {
      width: 36px; height: 36px;
      border-radius: var(--ui-border-radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
      color: var(--kc);
    }

    .kpi-content { flex: 1; min-width: 0; }
    .kpi-label {
      font-size: 9px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--text-tertiary); margin-bottom: 5px;
    }
    .kpi-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary); line-height: 1.1;
      font-variant-numeric: tabular-nums;
    }
    .kpi-sub { font-size: 9px; color: var(--text-tertiary); margin-top: 3px; }
    .kpi-skel { margin-top: 4px; }

    .kpi-badge {
      width: 20px; height: 20px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 8px; flex-shrink: 0;
      &.pos { background: var(--color-success-bg); color: var(--color-success); }
      &.neg { background: var(--color-error-bg); color: var(--color-error); }
    }

    /* ───────────────────────────────────────────────────
       CARD BASE
    ─────────────────────────────────────────────────── */
    .ca-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--elevation-1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: box-shadow 0.2s;

      &:hover { box-shadow: var(--elevation-2); }
      &.stacked { }
    }

    .ca-card-hd {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-md) var(--spacing-lg);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-secondary);
      flex-shrink: 0;
    }

    .inner-hd {
      border-top: 1px solid var(--border-primary);
    }

    .ca-card-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      i { font-size: 11px; color: var(--accent-primary); }
    }

    .ca-badge {
      font-size: 9px; font-weight: 700;
      background: var(--accent-focus);
      color: var(--accent-primary);
      border: 1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent 80%);
      padding: 2px 7px;
      border-radius: 99px;
      letter-spacing: 0.02em;
    }

    .ca-card-body {
      flex: 1;
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      &.gap-sm { gap: 6px; }
      &.chart-body { padding-bottom: var(--spacing-md); }
    }

    /* ───────────────────────────────────────────────────
       ALERT STRIP
    ─────────────────────────────────────────────────── */
    .alert-strip {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--ui-border-radius);
      border: 1px solid var(--color-error-border);
      background: var(--color-error-bg);
      color: var(--color-error);
      font-size: var(--font-size-sm);
      animation: stripIn 0.3s ease both;
      i { flex-shrink: 0; }
    }
    @keyframes stripIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }

    /* ───────────────────────────────────────────────────
       OVERVIEW: SPLIT ROWS
    ─────────────────────────────────────────────────── */
    .split-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--border-primary);
      &:last-child { border-bottom: none; }
    }

    .split-avatar {
      width: 30px; height: 30px;
      border-radius: var(--ui-border-radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; flex-shrink: 0;
    }

    .split-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }

    .split-top {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .split-name { font-size: 12px; font-weight: 600; color: var(--text-primary); flex: 1; }
    .split-count { font-size: 11px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }

    .pill {
      font-size: 9px; font-weight: 700;
      padding: 2px 6px; border-radius: 99px;
      &.warn { background: var(--color-warning-bg); color: var(--color-warning); }
      &.ok   { background: var(--color-success-bg); color: var(--color-success); }
    }

    /* ───────────────────────────────────────────────────
       BARS (shared utilities)
    ─────────────────────────────────────────────────── */
    .mini-track {
      height: 3px; background: var(--border-primary);
      border-radius: 99px; overflow: hidden;
    }
    .mini-fill {
      height: 100%; border-radius: 99px;
      transition: width 0.65s cubic-bezier(0.2,0.9,0.2,1);
    }

    .bar-track {
      height: 4px; background: var(--border-primary);
      border-radius: 99px; overflow: hidden;
      &.sm { height: 3px; }
    }
    .bar-fill {
      height: 100%;
      background: var(--accent-gradient,
        linear-gradient(90deg, var(--accent-primary), var(--accent-secondary)));
      border-radius: 99px;
      transition: width 0.65s cubic-bezier(0.2,0.9,0.2,1);

      &.warn { background: var(--color-warning); }
      &.seg  { background: var(--sc); }
    }

    .row-bar-track {
      height: 3px; background: var(--border-primary);
      border-radius: 99px; overflow: hidden;
      position: relative; display: flex;
      &.dual { }
    }
    .row-bar-fill {
      height: 100%;
      background: var(--accent-gradient,
        linear-gradient(90deg, var(--accent-primary), var(--accent-secondary)));
      border-radius: 99px;
      transition: width 0.7s cubic-bezier(0.2,0.9,0.2,1);
      &.unpaid { background: var(--color-warning); opacity: 0.45; }
    }

    /* ───────────────────────────────────────────────────
       ACQUISITION CHART (monthly bar)
    ─────────────────────────────────────────────────── */
    .acq-chart {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 110px;
    }

    .acq-col {
      flex: 1;
      display: flex; flex-direction: column;
      align-items: center; justify-content: flex-end;
      gap: 3px; height: 100%; cursor: default;
      animation: barGrow 0.5s ease calc(var(--ci, 0) * 40ms) both;
    }
    @keyframes barGrow { from{opacity:0;transform:scaleY(0);transform-origin:bottom} to{opacity:1;transform:none} }

    .acq-val { font-size: 8px; font-weight: 700; color: var(--accent-primary); }
    .acq-bar {
      width: 100%;
      background: var(--accent-gradient,
        linear-gradient(to top, var(--accent-primary), var(--accent-secondary)));
      border-radius: 3px 3px 0 0;
      min-height: 3px;
      opacity: 0.8;
      transition: height 0.6s cubic-bezier(0.2,0.9,0.2,1);
    }
    .acq-lbl { font-size: 8px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; }

    /* ───────────────────────────────────────────────────
       VERTICAL SALES CHART
    ─────────────────────────────────────────────────── */
    .v-chart {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 165px;
    }

    .vc-col {
      flex: 1;
      display: flex; flex-direction: column;
      align-items: center; justify-content: flex-end;
      gap: 3px; height: 100%; cursor: default;
      animation: barGrow 0.5s ease calc(var(--ci, 0) * 40ms) both;
    }

    .vc-val { font-size: 7px; font-weight: 700; color: var(--accent-primary); white-space: nowrap; }

    .vc-track {
      width: 100%; flex: 1; display: flex; align-items: flex-end;
    }

    .vc-fill {
      width: 100%;
      background: var(--border-primary);
      border-radius: 3px 3px 0 0;
      min-height: 3px;
      transition: height 0.6s cubic-bezier(0.2,0.9,0.2,1);
      &.active {
        background: var(--accent-gradient,
          linear-gradient(to top, var(--accent-primary), var(--accent-secondary)));
      }
    }

    .vc-lbl { font-size: 7px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; }

    /* ───────────────────────────────────────────────────
       LIST ROWS (shared)
    ─────────────────────────────────────────────────── */
    .list-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--border-primary);
      animation: rowIn 0.25s ease calc(var(--ri, 0) * 35ms) both;
      transition: background 0.15s;

      &:last-child { border-bottom: none; }
      &:hover { background: var(--bg-secondary); margin: 0 calc(-1 * var(--spacing-lg)); padding-left: var(--spacing-lg); padding-right: var(--spacing-lg); border-radius: var(--ui-border-radius-sm); }
      &.compact { padding: 5px 0; }
    }
    @keyframes rowIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }

    .list-rank { width: 22px; font-size: 10px; font-weight: 700; color: var(--text-tertiary); text-align: center; flex-shrink: 0; }

    .list-av {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 700; text-transform: uppercase;
      flex-shrink: 0;
      &.sm { width: 24px; height: 24px; font-size: 8px; }
    }

    .list-info { flex: 1; min-width: 0; }
    .list-name  { font-size: 12px; font-weight: 600; color: var(--text-primary); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .list-name-row { display: flex; align-items: center; gap: 5px; margin-bottom: 2px; }
    .list-sub   {
      font-size: 10px; color: var(--text-tertiary); display: flex; align-items: center; gap: 3px;
      i { font-size: 8px; }
      &.mono { font-family: var(--font-mono); }
    }

    .list-amt { font-size: 11px; font-weight: 700; font-family: var(--font-mono); flex-shrink: 0; }

    .warn-amt { font-size: 10px; font-weight: 700; color: var(--color-warning); font-family: var(--font-mono); flex-shrink: 0; }

    /* type pill */
    .type-pill {
      display: inline-flex; align-items: center;
      padding: 1px 5px; border-radius: 3px;
      font-size: 8px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.04em;
      flex-shrink: 0;
      &.ind { background: var(--color-info-bg); color: var(--color-info); }
      &.biz { background: var(--color-success-bg); color: var(--color-success); }
    }

    /* ───────────────────────────────────────────────────
       AGING ROWS
    ─────────────────────────────────────────────────── */
    .aging-row {
      display: grid;
      grid-template-columns: 52px 1fr auto;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--border-primary);
      animation: rowIn 0.25s ease calc(var(--ri, 0) * 40ms) both;
      &:last-child { border-bottom: none; }
    }

    .aging-days { display: flex; flex-direction: column; align-items: center; line-height: 1; }
    .aging-n    { font-size: 18px; font-weight: 700; color: var(--color-warning); }
    .aging-u    { font-size: 8px; color: var(--text-tertiary); text-transform: uppercase; }

    .aging-mid  { display: flex; flex-direction: column; gap: 4px; }
    .aging-ct   { font-size: 10px; color: var(--text-secondary); }
    .aging-total { font-size: 11px; font-weight: 700; font-family: var(--font-mono); color: var(--color-warning); }

    /* ───────────────────────────────────────────────────
       OVERDUE ROWS
    ─────────────────────────────────────────────────── */
    .overdue-row {
      display: flex; align-items: center; gap: var(--spacing-sm);
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--border-primary);
      animation: rowIn 0.25s ease calc(var(--ri, 0) * 40ms) both;
      &:last-child { border-bottom: none; }
    }

    .overdue-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; margin-left: auto; flex-shrink: 0; }
    .due-label { font-size: 9px; color: var(--color-error); font-weight: 600; }
    .due-amt   { font-size: 12px; font-weight: 700; color: var(--color-error); font-family: var(--font-mono); }

    /* ───────────────────────────────────────────────────
       PAYMENT BEHAVIOUR
    ─────────────────────────────────────────────────── */
    .pb-row {
      display: grid;
      grid-template-columns: 18px 28px 1fr auto;
      grid-template-rows: auto 3px;
      align-items: center;
      gap: 0 var(--spacing-sm);
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--border-primary);
      animation: rowIn 0.25s ease calc(var(--ri, 0) * 35ms) both;
      &:last-child { border-bottom: none; }
    }

    .pb-rank { font-size: 10px; font-weight: 700; color: var(--text-tertiary); text-align: center; }

    .pb-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .pb-total { font-size: 12px; font-weight: 700; font-family: var(--font-mono); color: var(--text-primary); }
    .pb-delay { display: flex; align-items: center; gap: 3px; font-size: 9px; font-weight: 600; i { font-size: 8px; } }

    .chip-row { display: flex; align-items: center; gap: 3px; margin-top: 2px; }
    .tag {
      display: inline-flex; align-items: center; gap: 3px;
      padding: 1px 5px; border-radius: 3px;
      font-size: 8px; font-weight: 600;
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      color: var(--text-secondary);
      i { font-size: 7px; }
      &.method { color: var(--accent-primary); }
    }

    /* ───────────────────────────────────────────────────
       LTV
    ─────────────────────────────────────────────────── */
    .ltv-row {
      display: grid;
      grid-template-columns: 28px 28px 1fr auto;
      grid-template-rows: auto 3px;
      align-items: center;
      gap: 0 var(--spacing-sm);
      padding: var(--spacing-md) 0;
      border-bottom: 1px solid var(--border-primary);
      animation: rowIn 0.25s ease calc(var(--ri, 0) * 40ms) both;
      &:last-child { border-bottom: none; }
    }

    .ltv-medal {
      width: 26px; height: 26px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 700;
      background: var(--bg-secondary); color: var(--text-tertiary);
      border: 1px solid var(--border-primary); flex-shrink: 0;
      &.gold   { background: #fef3c7; color: #d97706; border-color: #fbbf24; i { font-size: 10px; } }
      &.silver { background: #f1f5f9; color: #64748b; border-color: #cbd5e1; i { font-size: 10px; } }
      &.bronze { background: #fef2e4; color: #b45309; border-color: #f59e0b; i { font-size: 10px; } }
    }

    .ltv-meta {
      display: flex; align-items: center; gap: 5px;
      font-size: 9px; color: var(--text-tertiary);
      i { font-size: 8px; }
    }

    .ltv-vals { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .ltv-rev  { font-size: 12px; font-weight: 700; font-family: var(--font-mono); color: var(--text-primary); }
    .ltv-paid { font-size: 9px; font-weight: 600; font-family: var(--font-mono); }

    /* ───────────────────────────────────────────────────
       SEGMENTATION
    ─────────────────────────────────────────────────── */
    .seg-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: var(--spacing-lg);
    }

    .seg-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-top: 3px solid var(--sc);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg);
      display: flex; flex-direction: column; gap: var(--spacing-sm);
      box-shadow: var(--elevation-1);
      animation: kpiIn 0.3s ease calc(var(--i, 0) * 55ms) both;
      transition: box-shadow 0.2s, transform 0.2s;
      position: relative; overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: var(--sc);
        opacity: 0;
        transition: opacity 0.2s;
      }

      &:hover {
        box-shadow: var(--elevation-2);
        transform: translateY(-2px);
      }
    }

    .seg-card-top { display: flex; align-items: center; justify-content: space-between; }

    .seg-icon {
      width: 30px; height: 30px;
      border-radius: var(--ui-border-radius-sm);
      background: color-mix(in srgb, var(--sc) 12%, transparent 88%);
      color: var(--sc);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px;
    }

    .seg-pill {
      font-size: 8px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--sc);
      background: color-mix(in srgb, var(--sc) 10%, transparent 90%);
      border: 1px solid color-mix(in srgb, var(--sc) 22%, transparent 78%);
      padding: 2px 6px; border-radius: 99px;
    }

    .seg-count { font-size: 32px; font-weight: 700; color: var(--text-primary); line-height: 1; }
    .seg-ct-lbl { font-size: 10px; color: var(--text-tertiary); }

    .seg-revenue {
      font-size: 13px; font-weight: 700; font-family: var(--font-mono);
      color: var(--text-primary); display: flex; flex-direction: column; gap: 1px;
    }
    .seg-rev-lbl { font-size: 9px; color: var(--text-tertiary); font-family: inherit; font-weight: 400; }
    .seg-pct { font-size: 9px; color: var(--text-tertiary); }

    /* Segment guide */
    .guide-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: var(--spacing-md);
    }

    .guide-item { display: flex; align-items: flex-start; gap: 8px; }
    .guide-dot  { width: 9px; height: 9px; border-radius: 50%; background: var(--sc); flex-shrink: 0; margin-top: 3px; }
    .guide-name { font-size: 11px; font-weight: 600; color: var(--text-primary); }
    .guide-desc { font-size: 10px; color: var(--text-tertiary); margin-top: 1px; line-height: 1.4; }

    /* ───────────────────────────────────────────────────
       GEO
    ─────────────────────────────────────────────────── */
    .geo-row {
      display: grid;
      grid-template-columns: 22px 26px 1fr auto;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--border-primary);
      animation: rowIn 0.25s ease calc(var(--ri, 0) * 35ms) both;
      &:last-child { border-bottom: none; }
    }

    .geo-rank { font-size: 10px; font-weight: 700; color: var(--text-tertiary); text-align: center; }
    .geo-pin {
      width: 26px; height: 26px;
      border-radius: var(--ui-border-radius-sm);
      background: var(--color-info-bg); color: var(--color-info);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px;
    }
    .geo-state { color: var(--text-secondary); }
    .geo-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .geo-count { font-size: 11px; font-weight: 700; color: var(--text-primary); }
    .geo-out   { font-size: 9px; font-weight: 600; display: flex; align-items: center; gap: 2px; i { font-size: 8px; } }

    /* ───────────────────────────────────────────────────
       EMPTY + SKELETON
    ─────────────────────────────────────────────────── */
    .empty-state {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-2xl);
      color: var(--text-tertiary);
      font-size: 11px;
      i { font-size: 22px; opacity: 0.35; }
      &.success { color: var(--color-success); i { opacity: 0.65; } }
    }

    .skel-row {
      display: flex; align-items: center; gap: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
      .flex-1 { flex: 1; }
    }

    /* ───────────────────────────────────────────────────
       RESPONSIVE
    ─────────────────────────────────────────────────── */
    @media (max-width: 960px) {
      .grid-2 { grid-template-columns: 1fr; }
      .kpi-strip { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 580px) {
      .ca-page { padding: var(--spacing-md); }
      .kpi-strip { grid-template-columns: 1fr; }
      .ca-tabs-track { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 2px; }
      .ca-tab-label { display: none; }
    }
  `]
})
export class CustomerAnalyticsComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private svc = inject(CustomerAnalyticsService);
  public common = inject(CommonMethodService);

  protected Math = Math;

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

  tabs = [
    { key: 'overview', label: 'Overview', icon: 'pi pi-home' },
    { key: 'financials', label: 'Financials', icon: 'pi pi-wallet' },
    { key: 'payment', label: 'Payment Behaviour', icon: 'pi pi-credit-card' },
    { key: 'ltv', label: 'Lifetime Value', icon: 'pi pi-star' },
    { key: 'segmentation', label: 'Segmentation', icon: 'pi pi-chart-pie' },
    { key: 'geo', label: 'Geospatial', icon: 'pi pi-map' },
  ];

  segGuide = [
    { name: 'Champions', color: '#10b981', desc: 'Bought recently, often & spent the most' },
    { name: 'Loyal', color: '#6366f1', desc: 'Regular buyers with high frequency' },
    { name: 'Need Attention', color: '#f59e0b', desc: "Above-average but haven't bought recently" },
    { name: 'Recent', color: '#3b82f6', desc: 'Bought recently but infrequently' },
    { name: 'At Risk', color: '#ef4444', desc: 'Was engaged but gone quiet' },
    { name: 'Lost', color: '#94a3b8', desc: 'Lowest recency, frequency & value' },
  ];

  // ── Overview KPIs ─────────────────────────────────────────────────────────
  overviewKpis = computed(() => {
    const d = this.overviewData();
    const totalCust = d?.overview?.customerStats?.reduce((s: number, c: any) => s + c.count, 0) ?? 0;
    const activeCount = d?.overview?.activeStats?.[0]?.count ?? 0;
    const totalOut = d?.overview?.customerStats?.reduce((s: number, c: any) => s + (c.totalOutstanding || 0), 0) ?? 0;
    const growthCount = d?.overview?.monthlyGrowth?.reduce((s: number, m: any) => s + m.newCustomers, 0) ?? 0;
    return [
      {
        label: 'Total Customers', value: totalCust, icon: 'pi pi-users',
        iconBg: 'var(--color-info-bg)', iconColor: 'var(--color-info)', sub: `${activeCount} active`
      },
      {
        label: 'Total Outstanding', value: this.common.formatCurrency(totalOut), icon: 'pi pi-wallet',
        iconBg: totalOut > 0 ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
        iconColor: totalOut > 0 ? 'var(--color-warning)' : 'var(--color-success)',
        sub: totalOut > 0 ? 'Needs collection' : 'All clear'
      },
      {
        label: 'New This Period', value: growthCount, icon: 'pi pi-user-plus',
        iconBg: 'var(--color-success-bg)', iconColor: 'var(--color-success)',
        sub: 'This month',
        trend: growthCount > 0 ? 1 : 0
      },
      {
        label: 'Individual', value: d?.overview?.customerStats?.find((c: any) => c._id === 'individual')?.count ?? 0,
        icon: 'pi pi-user', iconBg: 'var(--accent-focus)', iconColor: 'var(--accent-primary)', sub: 'Retail'
      },
      {
        label: 'Business', value: d?.overview?.customerStats?.find((c: any) => c._id === 'business')?.count ?? 0,
        icon: 'pi pi-building', iconBg: 'var(--color-warning-bg)', iconColor: 'var(--color-warning)', sub: 'B2B'
      },
    ];
  });

  totalCustomers = computed(() =>
    this.overviewData()?.overview?.customerStats?.reduce((s: number, c: any) => s + c.count, 0) ?? 0
  );
  maxMonthlyGrowth = computed(() =>
    Math.max(...(this.overviewData()?.overview?.monthlyGrowth?.map((m: any) => m.newCustomers) ?? [1]), 1)
  );

  // ── Financials ────────────────────────────────────────────────────────────
  totalSales = computed(() =>
    this.financialData()?.salesAnalysis?.reduce((s: number, m: any) => s + m.totalSales, 0) ?? 0
  );
  maxSales = computed(() =>
    Math.max(...(this.financialData()?.salesAnalysis?.map((m: any) => m.totalSales) ?? [1]), 1)
  );
  maxAging = computed(() =>
    Math.max(...(this.financialData()?.outstandingAging?.map((a: any) => a.totalAmount) ?? [1]), 1)
  );

  // ── LTV KPIs ──────────────────────────────────────────────────────────────
  ltvKpis = computed(() => {
    const d = this.ltvData();
    const total = d.reduce((s, c) => s + c.totalRevenue, 0);
    const avgAOV = d.length ? d.reduce((s, c) => s + c.avgOrderValue, 0) / d.length : 0;
    const paid = d.reduce((s, c) => s + c.totalPaid, 0);
    return [
      { label: 'Total LTV', value: this.common.formatCurrency(total), icon: 'pi pi-dollar', iconBg: 'var(--color-success-bg)', iconColor: 'var(--color-success)' },
      { label: 'Avg Order Value', value: this.common.formatCurrency(avgAOV), icon: 'pi pi-shopping-cart', iconBg: 'var(--color-info-bg)', iconColor: 'var(--color-info)' },
      { label: 'Total Collected', value: this.common.formatCurrency(paid), icon: 'pi pi-check-circle', iconBg: 'var(--accent-focus)', iconColor: 'var(--accent-primary)' },
      { label: 'Active Accounts', value: d.length, icon: 'pi pi-users', iconBg: 'var(--color-warning-bg)', iconColor: 'var(--color-warning)' },
    ];
  });

  maxLTV = computed(() => Math.max(...this.ltvData().map(c => c.totalRevenue), 1));
  maxPayment = computed(() => Math.max(...this.paymentData().map(p => p.totalPaid), 1));

  // ── Segmentation ──────────────────────────────────────────────────────────
  maxSegRevenue = computed(() => Math.max(...this.segmentData().map(s => s.totalRevenue), 1));
  totalSegCustomers = computed(() => this.segmentData().reduce((s, seg) => s + seg.count, 0));

  // ── Geo ───────────────────────────────────────────────────────────────────
  maxGeoCount = computed(() => Math.max(...this.geoData().map(g => g.count), 1));

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void { this.loadAll(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadAll(): void {
    this.loadOverview(); this.loadFinancials(); this.loadPaymentBehaviour();
    this.loadLTV(); this.loadSegmentation(); this.loadGeo();
  }

  private load<T>(
    key: string,
    obs: any,
    setter: (res: any) => void
  ): void {
    this.isLoading[key] = true;
    this.common.apiCall(obs, (res: any) => {
      setter(res);
      this.isLoading[key] = false;
    }, key, { destroy$: this.destroy$, skipLoading: true });
    setTimeout(() => this.isLoading[key] = false, 800);
  }

  private loadOverview(): void { this.load('overview', this.svc.getCustomerOverview(), (r) => this.overviewData.set(r.data)); }
  private loadFinancials(): void { this.load('financials', this.svc.getFinancials(), (r) => this.financialData.set(r.data)); }
  private loadPaymentBehaviour(): void { this.load('payment', this.svc.getPaymentBehavior(), (r) => this.paymentData.set(r.data ?? [])); }
  private loadLTV(): void { this.load('ltv', this.svc.getLTV(), (r) => this.ltvData.set(r.data ?? [])); }
  private loadSegmentation(): void { this.load('segmentation', this.svc.getSegmentation(), (r) => this.segmentData.set(r.data ?? [])); }
  private loadGeo(): void { this.load('geo', this.svc.getGeospatial(), (r) => this.geoData.set(r.data ?? [])); }

  // ── Helpers ───────────────────────────────────────────────────────────────
  barPct(val: number, max: number): number {
    if (!max) return 0;
    return this.common.clamp(this.common.round((val / max) * 100, 1), 0, 100);
  }

  monthLabel(m: number): string {
    return ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m] ?? '';
  }
  monthShort(m: number): string { return this.monthLabel(m); }
  monthName(m: number): string { return this.monthLabel(m); }

  segColor(seg: string): string {
    const map: Record<string, string> = {
      'Champions': '#10b981', 'Loyal': '#6366f1', 'Need Attention': '#f59e0b',
      'Recent': '#3b82f6', 'At Risk': '#ef4444', 'Lost': '#94a3b8',
    };
    return map[seg] ?? 'var(--accent-primary)';
  }

  segIcon(seg: string): string {
    const map: Record<string, string> = {
      'Champions': 'pi pi-star-fill', 'Loyal': 'pi pi-heart',
      'Need Attention': 'pi pi-exclamation-triangle', 'Recent': 'pi pi-clock',
      'At Risk': 'pi pi-shield', 'Lost': 'pi pi-times-circle',
    };
    return map[seg] ?? 'pi pi-users';
  }
}