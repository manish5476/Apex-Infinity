import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

interface SegmentationData {
  Champion:        number;
  'At Risk':       number;
  Loyal:           number;
  'New Customer':  number;
  Standard:        number;
}

@Component({
  selector: 'app-customer-segmentation',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, TooltipModule],
  template: `
<div class="seg-root">

  <!-- Header -->
  <div class="page-header">
    <h2 class="page-title">RFM Segmentation</h2>
    <p class="page-sub">Behavioural classification based on purchase recency and frequency</p>
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
   Each variant controls: icon-wrap bg/color, label color,
   bar fill color, hover border color.
   ══════════════════════════════════════════════════════════ */

/* Champion — success green */
.seg-card--champion {
  .seg-icon-wrap { background: var(--color-success-bg); color: var(--color-success); }
  .seg-label     { color: var(--color-success); }
  .seg-bar-fill  { background: var(--color-success); }
  &:hover        { border-color: var(--color-success-border); }
}

/* Loyal — pink (categorical, no semantic token available) */
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
  segments       = signal<{ key: string; value: number }[]>([]);
  totalCustomers = signal(0);
  loading        = signal(true);

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit(): void { this.loadSegmentation(); }

  loadSegmentation(): void {
    this.loading.set(true);
    this.analyticsService.getCustomerSegmentation().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
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
      'Champion':     'champion',
      'Loyal':        'loyal',
      'New Customer': 'new',
      'At Risk':      'risk',
      'Standard':     'standard',
    };
    return map[key] ?? 'standard';
  }

  getSegmentIcon(key: string): string {
    const map: Record<string, string> = {
      'Champion':     'pi-trophy',
      'Loyal':        'pi-heart-fill',
      'New Customer': 'pi-user-plus',
      'At Risk':      'pi-exclamation-triangle',
      'Standard':     'pi-user',
    };
    return map[key] ?? 'pi-user';
  }

  getSegmentDescription(key: string): string {
    const map: Record<string, string> = {
      'Champion':     'Best customers who buy often and spend the most.',
      'Loyal':        'Frequent buyers who respond well to promotions.',
      'New Customer': 'First-time buyers with high potential.',
      'At Risk':      'Customers who haven\'t purchased in a while.',
      'Standard':     'Average customers with moderate engagement.',
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

// import { Component, OnInit, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TooltipModule } from 'primeng/tooltip';
// import { AdminAnalyticsService } from '../admin-analytics.service';

// interface SegmentationData {
//   Champion: number;
//   'At Risk': number;
//   Loyal: number;
//   'New Customer': number;
//   Standard: number;
// }

// @Component({
//   selector: 'app-customer-segmentation',
//   standalone: true,
//   imports: [CommonModule, ProgressSpinnerModule, TooltipModule],
//   template: `
//     <div class="segmentation-container">

//       <div class="header-section">
//         <h2 class="page-title">RFM Segmentation</h2>
//         <p class="page-subtitle">
//           Behavioral classification based on purchase recency and frequency
//         </p>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="segment-grid">
//           @for (segment of segments(); track segment.key) {
//             <div class="segment-card" 
//                  [ngClass]="getSegmentClass(segment.key)"
//                  [pTooltip]="getSegmentDescription(segment.key)"
//                  tooltipPosition="top">
              
//               <div class="icon-box">
//                 <i class="pi" [ngClass]="getSegmentIcon(segment.key)"></i>
//               </div>

//               <h3 class="segment-value" [class.muted]="segment.value === 0">
//                 {{ segment.value | number }}
//               </h3>

//               <p class="segment-label">{{ segment.key }}</p>

//               <div class="progress-track" [class.visible]="segment.value > 0">
//                 <div class="progress-fill"></div>
//               </div>

//             </div>
//           }
//         </div>

//         @if (totalCustomers() > 0) {
//           <div class="insight-box">
//             <div class="insight-content">
//               <div class="insight-icon-box">
//                 <i class="pi pi-lightbulb"></i>
//               </div>
//               <div>
//                 <p class="insight-title">Growth Opportunity</p>
//                 <p class="insight-text">
//                   You have <span class="highlight">{{ getNewCustomerCount() | number }} New Customers</span> this period. 
//                   Focus on follow-up campaigns to convert them into "Loyal" or "Champion" segments.
//                 </p>
//               </div>
//             </div>
//           </div>
//         }

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
//           <p class="loader-text">Profiling Customers...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     /* HOST & LAYOUT */
//     :host { display: block; width: 100%; }

//     .segmentation-container {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       font-family: var(--font-body);
//       min-height: 100%;
//     }

//     .header-section { margin-bottom: var(--spacing-xl); }

//     .page-title {
//       font-family: var(--font-heading);
//       font-size: var(--font-size-xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0 0 4px 0;
//       letter-spacing: -0.01em;
//     }

//     .page-subtitle {
//       color: var(--text-tertiary);
//       font-size: var(--font-size-sm);
//       margin: 0;
//     }

//     /* GRID LAYOUT */
//     .segment-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
//       gap: var(--spacing-lg);
//       margin-bottom: var(--spacing-xl);
//     }

//     /* CARD STYLES */
//     .segment-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--radius-2xl);
//       padding: var(--spacing-xl);
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       text-align: center;
//       transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
//       cursor: default;
//       position: relative;
//       overflow: hidden;
//     }

//     .segment-card:hover {
//       transform: translateY(-4px);
//       box-shadow: var(--shadow-lg);
//       border-color: var(--border-secondary);
//     }

//     /* ICON BOX */
//     .icon-box {
//       width: 3.5rem;
//       height: 3.5rem;
//       border-radius: 50%;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       margin-bottom: var(--spacing-md);
//       font-size: 1.5rem;
//       transition: background 0.2s;
//     }

//     /* TYPOGRAPHY */
//     .segment-value {
//       font-size: var(--font-size-3xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0 0 4px 0;
//       font-family: var(--font-heading);
//       font-variant-numeric: tabular-nums;
//     }
//     .segment-value.muted { color: var(--text-label); }

//     .segment-label {
//       font-size: var(--font-size-xs);
//       font-weight: 900;
//       text-transform: uppercase;
//       letter-spacing: 0.1em;
//       margin: 0;
//       transition: color 0.2s;
//     }

//     /* PROGRESS BAR */
//     .progress-track {
//       width: 100%;
//       height: 4px;
//       background: var(--bg-ternary);
//       border-radius: 99px;
//       margin-top: var(--spacing-lg);
//       overflow: hidden;
//       opacity: 0;
//       transition: opacity 0.3s;
//     }
//     .progress-track.visible { opacity: 1; }
    
//     .progress-fill {
//       width: 100%;
//       height: 100%;
//       border-radius: 99px;
//     }

//     /* --- THEME VARIANTS (Controlled by Class) --- */
    
//     /* 1. Champion (Success/Emerald) */
//     .segment-card.type-champion .icon-box { background: var(--color-success-bg); color: var(--color-success); }
//     .segment-card.type-champion .segment-label { color: var(--color-success); }
//     .segment-card.type-champion .progress-fill { background: var(--color-success); }
//     .segment-card.type-champion:hover { border-color: var(--color-success); }

//     /* 2. Loyal (Warning/Gold/Pink - Custom) */
//     /* Using a specific "Loyalty" color or falling back to Warning */
//     .segment-card.type-loyal .icon-box { 
//       background: rgba(236, 72, 153, 0.1); color: #ec4899; 
//     }
//     .segment-card.type-loyal .segment-label { color: #ec4899; }
//     .segment-card.type-loyal .progress-fill { background: #ec4899; }
//     .segment-card.type-loyal:hover { border-color: #ec4899; }

//     /* 3. New Customer (Accent/Indigo) */
//     .segment-card.type-new .icon-box { background: var(--accent-focus); color: var(--accent-primary); }
//     .segment-card.type-new .segment-label { color: var(--accent-primary); }
//     .segment-card.type-new .progress-fill { background: var(--accent-primary); }
//     .segment-card.type-new:hover { border-color: var(--accent-primary); }

//     /* 4. At Risk (Error/Rose) */
//     .segment-card.type-risk .icon-box { background: var(--color-error-bg); color: var(--color-error); }
//     .segment-card.type-risk .segment-label { color: var(--color-error); }
//     .segment-card.type-risk .progress-fill { background: var(--color-error); }
//     .segment-card.type-risk:hover { border-color: var(--color-error); }

//     /* 5. Standard (Slate/Gray) */
//     .segment-card.type-standard .icon-box { background: var(--bg-ternary); color: var(--text-secondary); }
//     .segment-card.type-standard .segment-label { color: var(--text-secondary); }
//     .segment-card.type-standard .progress-fill { background: var(--text-secondary); }

//     /* INSIGHT BOX */
//     .insight-box {
//       border: 1px dashed var(--border-secondary);
//       background: var(--bg-ternary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-lg);
//     }

//     .insight-content { display: flex; gap: var(--spacing-md); align-items: flex-start; }

//     .insight-icon-box {
//       width: 2.5rem;
//       height: 2.5rem;
//       border-radius: var(--ui-border-radius);
//       background: var(--accent-focus);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       color: var(--accent-primary);
//       flex-shrink: 0;
//     }

//     .insight-title {
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0 0 4px 0;
//     }

//     .insight-text {
//       font-size: var(--font-size-xs);
//       color: var(--text-secondary);
//       margin: 0;
//       line-height: 1.5;
//     }
    
//     .highlight { 
//       font-weight: var(--font-weight-bold); 
//       color: var(--accent-primary); 
//     }

//     /* LOADER */
//     .loader-container {
//       height: 200px;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-md);
//     }
//     .loader-text {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.1em;
//       color: var(--text-tertiary);
//     }
//   `]
// })
// export class CustomerSegmentationComponent implements OnInit {
//   segments = signal<{ key: string; value: number }[]>([]);
//   totalCustomers = signal<number>(0);
//   loading = signal<boolean>(true);

//   constructor(private analyticsService: AdminAnalyticsService) {}

//   ngOnInit() {
//     this.loadSegmentation();
//   }

//   loadSegmentation() {
//     this.loading.set(true);
//     this.analyticsService.getCustomerSegmentation().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           const data = res.data as SegmentationData;
//           const mapped = Object.entries(data).map(([key, value]) => ({ key, value }));
//           this.segments.set(mapped);
//           this.totalCustomers.set(Object.values(data).reduce((a, b) => a + b, 0));
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }

//   // Returns a CSS Class for styling
//   getSegmentClass(key: string): string {
//     const map: Record<string, string> = {
//       'Champion': 'type-champion',
//       'Loyal': 'type-loyal',
//       'New Customer': 'type-new',
//       'At Risk': 'type-risk',
//       'Standard': 'type-standard'
//     };
//     return map[key] || 'type-standard';
//   }

//   // Returns the icon name
//   getSegmentIcon(key: string): string {
//     const map: Record<string, string> = {
//       'Champion': 'pi-trophy',
//       'Loyal': 'pi-heart-fill',
//       'New Customer': 'pi-user-plus',
//       'At Risk': 'pi-exclamation-triangle',
//       'Standard': 'pi-user'
//     };
//     return map[key] || 'pi-user';
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
