import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

interface SegmentationData {
  Champion: number;
  'At Risk': number;
  Loyal: number;
  'New Customer': number;
  Standard: number;
}

@Component({
  selector: 'app-customer-segmentation',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, TooltipModule, UniversalFilterComponent],
  template: `
<div class="seg-root">

  <!-- Header -->
  <div class="page-header">
    <h2 class="page-title">RFM Segmentation</h2>
    <p class="page-sub">Behavioural classification based on purchase recency and frequency</p>
  </div>

  <!-- Filter Bar -->
  <div class="filter-bar">
    <app-universal-filter
      entityType="customer-segmentation"
      [config]="filterConfig"
      (filterChange)="onFilterUpdate($event)">
    </app-universal-filter>
    <button class="refresh-btn" (click)="loadSegmentation()" [disabled]="loading()" pTooltip="Refresh" tooltipPosition="bottom">
      <i class="pi pi-refresh" [class.spinning]="loading()"></i>
    </button>
  </div>

  <!-- Loading -->
  @if (loading()) {
    <div class="loader-state">
      <p-progressSpinner strokeWidth="3" styleClass="w-10 h-10"></p-progressSpinner>
      <span class="loader-text">Profiling customers…</span>
    </div>
  }

  <!-- Content -->
  @if (!loading()) {

    <div class="segment-grid">
      @for (seg of segments(); track seg.key) {
        <div class="seg-card"
             [class]="'seg-card seg-card--' + getSegmentClass(seg.key)"
             [pTooltip]="getSegmentDescription(seg.key)"
             tooltipPosition="top">

          <div class="seg-icon-wrap">
            <i class="pi" [class]="getSegmentIcon(seg.key)"></i>
          </div>

          <p class="seg-count" [class.seg-count--muted]="seg.value === 0">
            {{ seg.value | number }}
          </p>

          <p class="seg-label">{{ seg.key }}</p>

          <div class="seg-bar" [class.seg-bar--visible]="seg.value > 0">
            <div class="seg-bar-fill"></div>
          </div>

        </div>
      }
    </div>

    @if (totalCustomers() > 0) {
      <div class="insight-panel">
        <span class="insight-icon-wrap"><i class="pi pi-lightbulb"></i></span>
        <div>
          <p class="insight-title">Growth Opportunity</p>
          <p class="insight-body">
            You have
            <span class="insight-highlight">{{ getNewCustomerCount() | number }} new customers</span>
            this period. Focus on follow-up campaigns to convert them into Loyal or Champion segments.
          </p>
        </div>
      </div>
    }

  }

</div>
  `,
  styles: [`
/* ============================================================
   CUSTOMER SEGMENTATION — TOKEN-DRIVEN
   EXCEPTION — type-loyal uses a hardcoded pink (#ec4899).
   Pink is not in the semantic token set (success/warning/error/
   info/accent). It's a categorical data-encoding color for the
   "Loyal" segment. All other segment colors use semantic tokens.
   ============================================================ */

:host { display: block; width: 100%; }

.seg-root {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  font-family: var(--font-body);
  color: var(--text-primary);
  min-height: 100%;
}

/* ── Header ── */
.page-header { flex-shrink: 0; }

.page-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: var(--line-height-tight);
  letter-spacing: -0.01em;
}

.page-sub {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  margin: 0;
}

/* ── Filter bar ── */
.filter-bar {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.refresh-btn {
  width: 32px;
  height: 32px;
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-base);
  flex-shrink: 0;
  margin-top: 28px;
  transition: var(--transition-base);

  &:hover:not(:disabled) { background: var(--component-bg-hover); color: var(--accent-primary); }
  &:disabled { opacity: var(--state-loading-opacity); cursor: not-allowed; }
}

.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Loader ── */
.loader-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-5xl);
  min-height: 200px;
}

.loader-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-tertiary);
}

/* ══════════════════════════════════════════════════════════
   SEGMENT GRID
   ══════════════════════════════════════════════════════════ */
.segment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--spacing-lg);
}

/* ── Base card ── */
.seg-card {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-sm);
  cursor: default;
  position: relative;
  overflow: hidden;
  transition: var(--transition-base);

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
  }
}

/* ── Icon wrap ── */
.seg-icon-wrap {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: var(--ui-border-radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  flex-shrink: 0;
  transition: var(--transition-base);
}

/* ── Count + label ── */
.seg-count {
  font-family: var(--font-heading);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  font-variant-numeric: tabular-nums;

  &--muted { color: var(--text-tertiary); }
}

.seg-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0;
}

/* ── Progress bar ── */
.seg-bar {
  width: 100%;
  height: 4px;
  background: var(--bg-ternary);
  border-radius: var(--ui-border-radius-pill);
  overflow: hidden;
  opacity: 0;
  transition: opacity var(--transition-base);

  &--visible { opacity: 1; }
}

.seg-bar-fill {
  width: 100%;
  height: 100%;
  border-radius: var(--ui-border-radius-pill);
}

/* ══════════════════════════════════════════════════════════
   SEGMENT THEME VARIANTS
   ══════════════════════════════════════════════════════════ */

/* Champion — success green */
.seg-card--champion {
  .seg-icon-wrap { background: var(--color-success-bg); color: var(--color-success); }
  .seg-label     { color: var(--color-success); }
  .seg-bar-fill  { background: var(--color-success); }
  &:hover        { border-color: var(--color-success-border); }
}

.seg-card--loyal {
  .seg-icon-wrap { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
  .seg-label     { color: #ec4899; }
  .seg-bar-fill  { background: #ec4899; }
  &:hover        { border-color: rgba(236, 72, 153, 0.4); }
}

/* New customer — accent */
.seg-card--new {
  .seg-icon-wrap { background: var(--accent-focus); color: var(--accent-primary); }
  .seg-label     { color: var(--accent-primary); }
  .seg-bar-fill  { background: var(--accent-primary); }
  &:hover        { border-color: var(--accent-primary); }
}

/* At Risk — error red */
.seg-card--risk {
  .seg-icon-wrap { background: var(--color-error-bg); color: var(--color-error); }
  .seg-label     { color: var(--color-error); }
  .seg-bar-fill  { background: var(--color-error); }
  &:hover        { border-color: var(--color-error-border); }
}

/* Standard — muted gray */
.seg-card--standard {
  .seg-icon-wrap { background: var(--bg-ternary); color: var(--text-secondary); }
  .seg-label     { color: var(--text-secondary); }
  .seg-bar-fill  { background: var(--text-secondary); }
}

/* ══════════════════════════════════════════════════════════
   INSIGHT PANEL
   ══════════════════════════════════════════════════════════ */
.insight-panel {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
  padding: var(--spacing-lg);
  border: var(--ui-border-width) dashed var(--border-secondary);
  background: var(--bg-ternary);
  border-radius: var(--ui-border-radius-lg);
  flex-shrink: 0;
}

.insight-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--ui-border-radius-sm);
  background: var(--accent-focus);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-base);
  flex-shrink: 0;
}

.insight-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.insight-body {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

.insight-highlight {
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
}
  `]
})
export class CustomerSegmentationComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  segments = signal<{ key: string; value: number }[]>([]);
  totalCustomers = signal(0);
  loading = signal(true);

  public currentFilters: Record<string, any> = {};

  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'All Branches'
    },
    { key: 'date', label: 'Analysis Period', type: 'date-range' }
  ];

  constructor(private analyticsService: AdminAnalyticsService, private commonService: CommonMethodService) { }

  ngOnInit(): void { this.loadSegmentation(); }

  onFilterUpdate(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.loadSegmentation();
  }

  private resolveDateRange(): [string | undefined, string | undefined] {
    const start = this.currentFilters['startDate'] ?? this.currentFilters['date']?.[0];
    const end = this.currentFilters['endDate'] ?? this.currentFilters['date']?.[1];
    return [this.toIsoDate(start), this.toIsoDate(end)];
  }

  private toIsoDate(value: any): string | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  loadSegmentation(): void {
    this.loading.set(true);
    const [startDate, endDate] = this.resolveDateRange();

    // Passing parameters to AdminAnalyticsService if it accepts them
    // Assuming we use standard params. Wait, does getCustomerSegmentation accept params? Let me check admin-analytics.service.ts
    // In admin-analytics.service.ts we need to see if it accepts args. Usually they do.
    this.analyticsService.getCustomerSegmentation(startDate, endDate, this.currentFilters['branchId']).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          const data = res.data as SegmentationData;
          this.segments.set(Object.entries(data).map(([key, value]) => ({ key, value })));
          this.totalCustomers.set(Object.values(data).reduce((a, b) => a + b, 0));
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getSegmentClass(key: string): string {
    const map: Record<string, string> = {
      'Champion': 'champion',
      'Loyal': 'loyal',
      'New Customer': 'new',
      'At Risk': 'risk',
      'Standard': 'standard',
    };
    return map[key] ?? 'standard';
  }

  getSegmentIcon(key: string): string {
    const map: Record<string, string> = {
      'Champion': 'pi-trophy',
      'Loyal': 'pi-heart-fill',
      'New Customer': 'pi-user-plus',
      'At Risk': 'pi-exclamation-triangle',
      'Standard': 'pi-user',
    };
    return map[key] ?? 'pi-user';
  }

  getSegmentDescription(key: string): string {
    const map: Record<string, string> = {
      'Champion': 'Best customers who buy often and spend the most.',
      'Loyal': 'Frequent buyers who respond well to promotions.',
      'New Customer': 'First-time buyers with high potential.',
      'At Risk': 'Customers who haven\'t purchased in a while.',
      'Standard': 'Average customers with moderate engagement.',
    };
    return map[key] ?? '';
  }

  getNewCustomerCount(): number {
    return this.segments().find(s => s.key === 'New Customer')?.value ?? 0;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

//   }

//   getSegmentDescription(key: string): string {
//     const desc: Record<string, string> = {
//       'Champion': 'Best customers who buy often and spend the most.',
//       'Loyal': 'Frequent buyers who respond well to promotions.',
//       'New Customer': 'First-time buyers with high potential.',
//       'At Risk': 'Customers who haven’t purchased in a while.',
//       'Standard': 'Average customers with moderate engagement.'
//     };
//     return desc[key] || '';
//   }

//   getNewCustomerCount(): number {
//     return this.segments().find(s => s.key === 'New Customer')?.value || 0;
//   }
// }
