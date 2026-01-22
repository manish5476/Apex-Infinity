import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { AdminAnalyticsService } from '../admin-analytics.service';

interface PeakData {
  count: number;
  day: number;
  hour: number;
}

@Component({
  selector: 'app-peak-hours-analysis',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, TooltipModule, ButtonModule],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <div class="mb-8 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 class="font-bold tracking-tight mb-1" 
              [style.color]="'var(--theme-text-primary)'"
              [style.font-family]="'var(--font-heading)'"
              [style.font-size]="'var(--font-size-2xl)'">Store Traffic Patterns</h2>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
            Heatmap of transaction density by day and hour
          </p>
        </div>
        <p-button label="Sync Live" icon="pi pi-sync" [text]="true" severity="info" (onClick)="loadData()"></p-button>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div class="lg:col-span-5 p-6 border relative overflow-hidden flex flex-col justify-center" 
               [style.background]="'var(--theme-accent-gradient)'" [style.border-radius]="'var(--ui-border-radius-xl)'" [style.box-shadow]="'var(--shadow-lg)'">
            <div class="relative z-10 text-white">
              <p class="uppercase font-black tracking-widest opacity-80 mb-2" [style.font-size]="'var(--font-size-xs)'">Primary Peak Window</p>
              <h1 class="font-bold tracking-tighter mb-2" [style.font-size]="'3rem'">{{ formatHour(topPeak()?.hour || 0) }}</h1>
              <p class="text-xl font-medium mb-4">Every {{ getDayName(topPeak()?.day || 0) }}</p>
              
              <div class="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-lg w-fit border border-white/30">
                <i class="pi pi-users"></i>
                <span class="font-bold tabular-nums">{{ topPeak()?.count }} Consistent Transactions</span>
              </div>
            </div>
            <i class="pi pi-clock absolute right-[-20px] bottom-[-20px] text-[10rem] text-white opacity-10"></i>
          </div>

          <div class="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div class="p-5 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
                <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Peak Efficiency Tip</h4>
                <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-sm)'" class="leading-relaxed">
                  Your highest volume occurs on <span class="font-bold" [style.color]="'var(--theme-accent-primary)'">{{ getDayName(topPeak()?.day || 0) }}s</span>. 
                  Consider scheduling senior technicians for these windows to handle high-ticket TV consultations.
                </p>
             </div>
             
             <div class="p-5 border" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
                <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Staffing Impact</h4>
                <div class="flex items-center gap-4">
                   <div class="text-3xl font-bold tabular-nums text-indigo-400">2.5x</div>
                   <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Traffic surge compared to baseline morning hours.</p>
                </div>
                <div class="mt-4 w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                   <div class="h-full bg-indigo-500" [style.width]="'85%'"></div>
                </div>
             </div>
          </div>
        </div>

        <div class="p-6 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
          <h3 class="font-bold uppercase tracking-tight mb-6" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">High-Density Time Slots</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (slot of rawData(); track $index) {
              <div class="p-4 border transition-all hover:border-indigo-500/50 group" 
                   [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
                <div class="flex justify-between items-start mb-3">
                   <span class="font-bold text-white tabular-nums" [style.font-size]="'var(--font-size-md)'">{{ formatHour(slot.hour) }}</span>
                   <div class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                     {{ slot.count }} Orders
                   </div>
                </div>
                <p class="font-bold mb-1" [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">{{ getDayName(slot.day) }}</p>
                <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                   <div class="h-full transition-all duration-1000" 
                        [style.background]="slot.count > 1 ? 'var(--theme-success)' : 'var(--theme-info)'" 
                        [style.width]="(slot.count / (topPeak()?.count || 1) * 100) + '%'"></div>
                </div>
              </div>
            }
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Mapping traffic flow...</p>
        </div>
      </ng-template>

    </div>
  `
})
export class PeakHoursAnalysisComponent implements OnInit {
  rawData = signal<PeakData[]>([]);
  loading = signal<boolean>(true);

  // Computed: Identify the absolute busiest timeframe
  topPeak = computed(() => {
    const data = this.rawData();
    if (!data.length) return null;
    return [...data].sort((a, b) => b.count - a.count)[0];
  });

  constructor(private analyticsService: AdminAnalyticsService) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getPeakBusinessHours().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.rawData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // Helpers for formatting
  formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}:00 ${period}`;
  }

  getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    // Assuming API follows 1=Sun (or 0=Sun depending on your DB)
    // Adjusting for index:
    return days[day] || days[0];
  }
}