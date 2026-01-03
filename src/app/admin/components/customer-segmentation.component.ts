import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';

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
  imports: [CommonModule, ProgressSpinnerModule, TooltipModule],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <div class="mb-6">
        <h2 class="font-bold tracking-tight mb-1" 
            [style.color]="'var(--theme-text-primary)'"
            [style.font-family]="'var(--font-heading)'"
            [style.font-size]="'var(--font-size-xl)'">RFM Segmentation</h2>
        <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
          Behavioral classification based on purchase recency and frequency
        </p>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          @for (segment of segments(); track segment.key) {
            <div class="p-5 border transition-all hover:scale-[1.02] cursor-default flex flex-col items-center text-center"
                 [style.background]="'var(--theme-bg-secondary)'"
                 [style.border-color]="'var(--theme-border-primary)'"
                 [style.border-radius]="'var(--ui-border-radius-xl)'"
                 [pTooltip]="getSegmentDescription(segment.key)"
                 tooltipPosition="bottom">
              
              <div class="w-12 h-12 rounded-full flex items-center justify-center mb-4 shadow-inner"
                   [style.background]="getSegmentStyle(segment.key).bg"
                   [style.color]="getSegmentStyle(segment.key).color">
                <i class="pi" [ngClass]="getSegmentStyle(segment.key).icon" [style.font-size]="'var(--font-size-xl)'"></i>
              </div>

              <h3 class="text-3xl font-bold tabular-nums mb-1" 
                  [style.color]="segment.value > 0 ? 'var(--theme-text-primary)' : 'var(--theme-text-label)'">
                {{ segment.value }}
              </h3>

              <p class="uppercase font-black tracking-widest leading-tight" 
                 [style.color]="segment.value > 0 ? getSegmentStyle(segment.key).color : 'var(--theme-text-label)'"
                 [style.font-size]="'var(--font-size-xs)'">
                {{ segment.key }}
              </p>

              @if (segment.value > 0) {
                <div class="mt-4 w-full h-1 rounded-full overflow-hidden bg-white/5">
                  <div class="h-full animate-pulse" [style.background]="getSegmentStyle(segment.key).color" [style.width]="'100%'"></div>
                </div>
              }
            </div>
          }
        </div>

        @if (totalCustomers() > 0) {
          <div class="mt-8 p-4 border border-dashed flex items-center gap-4"
               [style.border-color]="'var(--theme-border-secondary)'"
               [style.border-radius]="'var(--ui-border-radius-lg)'"
               [style.background]="'var(--theme-bg-ternary)'">
            <div class="w-10 h-10 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <i class="pi pi-lightbulb"></i>
            </div>
            <div>
              <p class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">Growth Opportunity</p>
              <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
                You have <span class="font-bold text-indigo-400">{{ segments()[3].value }} New Customers</span> this period. 
                Focus on follow-up campaigns to convert them into "Loyal" or "Champion" segments.
              </p>
            </div>
          </div>
        }
      </ng-container>

      <ng-template #loader>
        <div class="h-48 flex flex-col items-center justify-center gap-3">
          <p-progressSpinner strokeWidth="4" styleClass="w-8 h-8"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Profiling Customers...</p>
        </div>
      </ng-template>

    </div>
  `
})
export class CustomerSegmentationComponent implements OnInit {
  segments = signal<{ key: string; value: number }[]>([]);
  totalCustomers = signal<number>(0);
  loading = signal<boolean>(true);

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit() {
    this.loadSegmentation();
  }

  loadSegmentation() {
    this.loading.set(true);
    this.analyticsService.getCustomerSegmentation().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          // Mapping object to array for easier template iteration
          const data = res.data as SegmentationData;
          const mapped = Object.entries(data).map(([key, value]) => ({ key, value }));
          this.segments.set(mapped);
          this.totalCustomers.set(Object.values(data).reduce((a, b) => a + b, 0));
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getSegmentStyle(key: string) {
    const styles: Record<string, { icon: string; color: string; bg: string }> = {
      'Champion': { icon: 'pi-trophy', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
      'Loyal': { icon: 'pi-heart-fill', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
      'New Customer': { icon: 'pi-user-plus', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
      'At Risk': { icon: 'pi-exclamation-triangle', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
      'Standard': { icon: 'pi-user', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' }
    };
    return styles[key] || styles['Standard'];
  }

  getSegmentDescription(key: string): string {
    const desc: Record<string, string> = {
      'Champion': 'Best customers who buy often and spend the most.',
      'Loyal': 'Frequent buyers who respond well to promotions.',
      'New Customer': 'First-time buyers with high potential.',
      'At Risk': 'Customers who haven’t purchased in a while.',
      'Standard': 'Average customers with moderate engagement.'
    };
    return desc[key] || '';
  }
}