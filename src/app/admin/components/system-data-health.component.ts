import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminAnalyticsService } from '../admin-analytics.service';

@Component({
  selector: 'app-system-data-health',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, ProgressSpinnerModule],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <div class="mb-8 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 class="font-bold tracking-tight mb-1" 
              [style.color]="'var(--theme-text-primary)'"
              [style.font-family]="'var(--font-heading)'"
              [style.font-size]="'var(--font-size-2xl)'">Data Health Diagnostics</h2>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
            Real-time monitoring of database consistency and synchronization integrity
          </p>
        </div>
        <p-button label="Run Full Audit" icon="pi pi-shield" severity="secondary" [outlined]="true" size="small" (onClick)="loadData()"></p-button>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-4 space-y-6">
            <div class="p-8 border flex flex-col items-center justify-center text-center" 
                 [style.background]="'var(--theme-bg-secondary)'" 
                 [style.border-color]="'var(--theme-border-primary)'" 
                 [style.border-radius]="'var(--ui-border-radius-xl)'">
              
              <p class="uppercase font-bold tracking-widest mb-6" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Overall Integrity</p>
              
              <div class="relative flex items-center justify-center mb-6">
                 <svg class="w-40 h-40 transform -rotate-90">
                   <circle cx="80" cy="80" r="72" stroke="currentColor" stroke-width="10" fill="transparent" [style.color]="'var(--theme-bg-ternary)'" />
                   <circle cx="80" cy="80" r="72" stroke="currentColor" stroke-width="10" fill="transparent"
                     [style.color]="getScoreColor()"
                     stroke-dasharray="452.3"
                     [attr.stroke-dashoffset]="452.3 - (452.3 * healthData()?.score / 100)"
                     stroke-linecap="round"
                     class="transition-all duration-1000" />
                 </svg>
                 <div class="absolute flex flex-col items-center">
                    <span class="text-4xl font-black text-white tabular-nums">{{ healthData()?.score }}%</span>
                    <span class="text-[10px] font-bold uppercase" [style.color]="getScoreColor()">{{ getScoreStatus() }}</span>
                 </div>
              </div>

              <div class="w-full p-4 rounded-lg" [style.background]="'var(--theme-bg-ternary)'">
                 <div class="flex justify-between items-center mb-2">
                    <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Checks Passed</span>
                    <span class="font-bold text-white tabular-nums">1/{{ healthData()?.checks?.length }}</span>
                 </div>
                 <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full bg-amber-500" [style.width]="'50%'"></div>
                 </div>
              </div>
            </div>

            <div class="p-5 border transition-colors shadow-inner" 
                 [style.background]="'var(--theme-accent-gradient)'" 
                 [style.border-radius]="'var(--ui-border-radius-xl)'">
               <div class="text-white">
                 <p class="font-black uppercase tracking-tighter opacity-80" [style.font-size]="'var(--font-size-xs)'">Last Log Audit</p>
                 <h3 class="font-bold mt-1">{{ meta()?.timestamp | date:'medium' }}</h3>
                 <p class="mt-4 text-[10px] leading-relaxed opacity-90">
                   System response time optimized at <strong>{{ meta()?.responseTime }}</strong>.
                 </p>
               </div>
            </div>
          </div>

          <div class="lg:col-span-8 space-y-6">
            
            <div class="p-6 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
               <h3 class="font-bold uppercase tracking-tight mb-6" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">Consistency Diagnostics</h3>
               
               <div class="space-y-4">
                 @for (item of healthData()?.checks; track item.check) {
                   <div class="p-4 border transition-all flex items-start justify-between" 
                        [style.background]="'var(--theme-bg-ternary)'" 
                        [style.border-color]="'var(--theme-border-secondary)'"
                        [style.border-radius]="'var(--ui-border-radius-lg)'">
                      <div class="flex gap-4">
                        <div class="w-10 h-10 rounded flex items-center justify-center shrink-0"
                             [style.background]="item.status === 'healthy' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 191, 36, 0.1)'">
                          <i class="pi" [ngClass]="item.status === 'healthy' ? 'pi-check-circle text-emerald-500' : 'pi-exclamation-circle text-amber-500'"></i>
                        </div>
                        <div>
                          <p class="font-bold text-white mb-1" [style.font-size]="'var(--font-size-sm)'">{{ item.check }}</p>
                          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">{{ item.details }}</p>
                        </div>
                      </div>
                      <span class="font-black uppercase text-[9px] px-2 py-1 rounded"
                            [style.background]="item.status === 'healthy' ? 'var(--theme-success)' : 'var(--theme-warning)'"
                            [style.color]="'#000'">
                        {{ item.status }}
                      </span>
                   </div>
                 }
               </div>
            </div>

            <div class="p-6 border border-dashed" 
                 [style.background]="'rgba(139, 92, 246, 0.03)'" 
                 [style.border-color]="'var(--theme-accent-primary)'" 
                 [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="flex items-center gap-2 mb-6">
                <i class="pi pi-sparkles text-indigo-400"></i>
                <h4 class="font-bold uppercase tracking-widest text-indigo-300" [style.font-size]="'var(--font-size-xs)'">Optimization Roadmap</h4>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @for (rec of healthData()?.recommendations; track rec) {
                  <div class="p-3 border rounded-lg hover:bg-white/5 cursor-default transition-colors" 
                       [style.border-color]="'var(--theme-border-primary)'"
                       [style.background]="'var(--theme-bg-secondary)'">
                    <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'" class="leading-relaxed">
                      {{ rec }}
                    </p>
                  </div>
                }
              </div>
            </div>

          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Running System Diagnostics...</p>
        </div>
      </ng-template>

    </div>
  `
})
export class SystemDataHealthComponent implements OnInit {
  healthData = signal<any>(null);
  meta = signal<any>(null);
  loading = signal<boolean>(true);

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getDataHealth().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.healthData.set(res.data);
          this.meta.set(res.meta);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // Visual Helpers
  getScoreColor(): string {
    const score = this.healthData()?.score || 0;
    if (score >= 90) return 'var(--theme-success)';
    if (score >= 50) return 'var(--theme-warning)';
    return 'var(--theme-error)';
  }

  getScoreStatus(): string {
    const score = this.healthData()?.score || 0;
    if (score >= 90) return 'Optimized';
    if (score >= 50) return 'Attention Needed';
    return 'Critical Failure';
  }
}