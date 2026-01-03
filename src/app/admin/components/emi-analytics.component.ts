import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AdminAnalyticsService } from '../admin-analytics.service';

interface EMIData {
  _id: string;
  totalAmount: number;
  activeEMIs: number;
  completedEMIs: number;
  defaultedEMIs: number;
  totalInstallments: number;
  paidInstallments: number;
  overdueInstallments: number;
  totalInterestEarned: number;
  status: string;
  completionRate: number;
  defaultRate: number;
}

@Component({
  selector: 'app-emi-analytics',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, ProgressSpinnerModule, TooltipModule],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <div class="mb-8 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 class="font-bold tracking-tight mb-1" 
              [style.color]="'var(--theme-text-primary)'"
              [style.font-family]="'var(--font-heading)'"
              [style.font-size]="'var(--font-size-2xl)'">Credit & EMI Intelligence</h2>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
            Monitoring credit exposure, repayment health, and interest yield
          </p>
        </div>
        <div class="flex items-center gap-2">
           <p-button label="Credit Limits" icon="pi pi-shield" [text]="true" severity="secondary" size="small"></p-button>
           <p-button label="Sync Portfolio" icon="pi pi-refresh" severity="info" size="small" (onClick)="loadData()"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="p-6 border relative overflow-hidden" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Total Credit Exposure</p>
            <h2 class="text-3xl font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">₹{{ emiSummary()?.totalAmount | number }}</h2>
            <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Across {{ emiSummary()?.activeEMIs }} active plans</p>
            <i class="pi pi-credit-card absolute right-[-10px] bottom-[-10px] text-6xl opacity-5"></i>
          </div>

          <div class="p-6 border" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Interest Revenue</p>
            <h2 class="text-3xl font-bold tabular-nums text-emerald-500">₹{{ emiSummary()?.totalInterestEarned | number }}</h2>
            <div class="flex items-center gap-2 mt-2">
               <span class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">Realized Gain</span>
            </div>
          </div>

          <div class="p-6 border text-white" 
               [style.background]="'var(--theme-accent-gradient)'" [style.border-radius]="'var(--ui-border-radius-xl)'" [style.box-shadow]="'var(--shadow-lg)'">
            <p class="uppercase font-black tracking-tighter opacity-80 mb-1" [style.font-size]="'var(--font-size-xs)'">Portfolio Health</p>
            <h2 class="text-3xl font-bold tabular-nums">{{ 100 - (emiSummary()?.defaultRate || 0) }}%</h2>
            <p class="mt-2 font-bold opacity-90" [style.font-size]="'var(--font-size-xs)'">Default Rate: {{ emiSummary()?.defaultRate }}%</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-7 space-y-6">
            <div class="p-6 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
               <div class="flex justify-between items-center mb-8">
                 <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">Repayment Pipeline</h3>
                 <span class="text-[10px] font-bold" [style.color]="'var(--theme-text-label)'">SYNCED: LIVE</span>
               </div>

               <div class="mb-10">
                 <div class="flex justify-between items-end mb-3">
                   <div>
                     <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase mb-1">Cycle Completion</p>
                     <p class="text-4xl font-black tabular-nums text-indigo-400">{{ emiSummary()?.completionRate | number:'1.1-1' }}%</p>
                   </div>
                   <div class="text-right">
                     <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase mb-1">Installments Paid</p>
                     <p class="font-bold tabular-nums text-white">{{ emiSummary()?.paidInstallments }} / {{ emiSummary()?.totalInstallments }}</p>
                   </div>
                 </div>
                 <div class="w-full h-4 rounded-full bg-white/5 border overflow-hidden p-1" [style.border-color]="'var(--theme-border-primary)'">
                   <div class="h-full rounded-full transition-all duration-1000" 
                        [style.background]="'var(--theme-accent-gradient)'" 
                        [style.width]="emiSummary()?.completionRate + '%'"></div>
                 </div>
               </div>

               <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div class="p-3 border text-center" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
                   <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold mb-1 uppercase">Active</p>
                   <p class="font-bold text-white tabular-nums">{{ emiSummary()?.activeEMIs }}</p>
                 </div>
                 <div class="p-3 border text-center" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
                   <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold mb-1 uppercase">Overdue</p>
                   <p class="font-bold tabular-nums" [style.color]="emiSummary()?.overdueInstallments > 0 ? 'var(--theme-error)' : 'var(--theme-text-label)'">{{ emiSummary()?.overdueInstallments }}</p>
                 </div>
                 <div class="p-3 border text-center" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
                   <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold mb-1 uppercase">Done</p>
                   <p class="font-bold text-white tabular-nums">{{ emiSummary()?.completedEMIs }}</p>
                 </div>
                 <div class="p-3 border text-center" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
                   <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold mb-1 uppercase">Defaults</p>
                   <p class="font-bold tabular-nums text-rose-500">{{ emiSummary()?.defaultedEMIs }}</p>
                 </div>
               </div>
            </div>
          </div>

          <div class="lg:col-span-5 space-y-6">
            <div class="p-6 border h-full flex flex-col" 
                 [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <h4 class="font-bold mb-6 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Portfolio Management</h4>
              
              <div class="space-y-3 mb-8">
                <button class="w-full p-4 border flex items-center justify-between transition-colors hover:bg-white/5" 
                        [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
                  <div class="flex items-center gap-3">
                    <i class="pi pi-bell text-amber-400"></i>
                    <span class="font-bold text-white" [style.font-size]="'var(--font-size-sm)'">Send Payment Reminders</span>
                  </div>
                  <i class="pi pi-chevron-right text-[10px] text-slate-500"></i>
                </button>
                <button class="w-full p-4 border flex items-center justify-between transition-colors hover:bg-white/5" 
                        [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
                  <div class="flex items-center gap-3">
                    <i class="pi pi-file-edit text-indigo-400"></i>
                    <span class="font-bold text-white" [style.font-size]="'var(--font-size-sm)'">Restructure Active Plans</span>
                  </div>
                  <i class="pi pi-chevron-right text-[10px] text-slate-500"></i>
                </button>
              </div>

              <div class="mt-auto p-4 border border-dashed rounded-lg" [style.border-color]="'var(--theme-success)'" [style.background]="'rgba(16, 185, 129, 0.05)'">
                 <div class="flex gap-3">
                   <i class="pi pi-shield-check text-emerald-500 mt-1"></i>
                   <div>
                     <p class="font-bold text-emerald-500" [style.font-size]="'var(--font-size-xs)'">Credit Risk Observation</p>
                     <p class="mt-1 leading-relaxed" [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
                       Default rate is maintaining a healthy <span class="text-white font-bold">0%</span>. 
                       Current cycle completion is at <span class="text-white font-bold">27%</span>. Consider increasing high-ticket credit limits for "Platinum" customers.
                     </p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Auditing Credit Portfolio...</p>
        </div>
      </ng-template>

    </div>
  `
})
export class EmiAnalyticsComponent implements OnInit {
  emiRawData = signal<EMIData[]>([]);
  loading = signal<boolean>(true);

  // Computed helper for the single active plan summary
  emiSummary:any = computed(() => this.emiRawData().length ? this.emiRawData()[0] : null);

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getEMIAnalytics().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.emiRawData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}