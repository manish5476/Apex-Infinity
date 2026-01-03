import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';

@Component({
  selector: 'app-cash-flow-analysis',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, ProgressSpinnerModule],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="p-5 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Available Liquidity</p>
            <h2 class="text-3xl font-bold tabular-nums" [style.color]="'var(--theme-success)'">₹{{ cashData()?.summary?.profit?.value | number }}</h2>
            <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Net Cash Position</p>
          </div>

          <div class="p-5 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Receivables (0-30d)</p>
            <h2 class="text-3xl font-bold tabular-nums" [style.color]="'var(--theme-warning)'">₹{{ cashData()?.receivables?.aging[0]?.amount | number }}</h2>
            <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Inbound flow pending</p>
          </div>

          <div class="p-5 border" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Cash-to-Debt Ratio</p>
            <h2 class="text-3xl font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">1:2.4</h2>
            <div class="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
               <div class="h-full bg-indigo-500" [style.width]="'40%'"></div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-7 space-y-6">
            <div class="p-6 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="flex justify-between items-center mb-6">
                <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-md)'">Inbound Aging Report</h3>
                <p-button icon="pi pi-print" [text]="true" size="small"></p-button>
              </div>

              @for (aging of cashData()?.receivables?.aging; track aging.range) {
                <div class="p-4 border mb-3 flex items-center justify-between" 
                     [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-rose-500/10 text-rose-500">
                       <i class="pi pi-history"></i>
                    </div>
                    <div>
                      <p class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">{{ aging.range }}</p>
                      <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">{{ aging.count }} Pending Invoices</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-bold tabular-nums" [style.color]="'var(--theme-error)'">₹{{ aging.amount | number }}</p>
                    <span class="text-[10px] font-bold uppercase p-1 rounded bg-rose-500/10 text-rose-500">High Priority</span>
                  </div>
                </div>
              }

              <div class="mt-6 p-4 border border-dashed rounded-lg" [style.border-color]="'var(--theme-accent-primary)'" [style.background]="'rgba(139, 92, 246, 0.05)'">
                <div class="flex gap-3">
                  <i class="pi pi-lightbulb text-indigo-400 mt-1"></i>
                  <div>
                    <p class="font-bold" [style.color]="'var(--theme-accent-primary)'" [style.font-size]="'var(--font-size-sm)'">Cash Flow Advisory</p>
                    <p class="mt-1" [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
                      {{ cashData()?.recommendations?.recommendations[0]?.reason }}. Target action: <strong>{{ cashData()?.recommendations?.recommendations[0]?.action }}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-5 space-y-6">
            <div class="p-6 border h-full" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <h3 class="font-bold uppercase tracking-tight mb-6" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-md)'">Active Credit Exposure</h3>

              @for (emi of cashData()?.credit?.emiAnalytics; track emi._id) {
                <div class="space-y-6">
                  <div class="flex justify-between items-end">
                    <div>
                      <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase mb-1">Total Outstanding Credit</p>
                      <p class="text-2xl font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">₹{{ emi.totalAmount | number }}</p>
                    </div>
                    <div class="text-right">
                      <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Active EMIs</p>
                      <p class="font-bold tabular-nums" [style.color]="'var(--theme-info)'">{{ emi.activeEMIs }} Plans</p>
                    </div>
                  </div>

                  <div class="p-4 border" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
                    <div class="flex justify-between items-center mb-3">
                      <span class="font-bold uppercase text-[10px]" [style.color]="'var(--theme-text-label)'">Repayment Health</span>
                      <span class="font-bold" [style.color]="'var(--theme-success)'" [style.font-size]="'var(--font-size-sm)'">{{ emi.completionRate | number:'1.0-0' }}%</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div class="h-full bg-emerald-500 transition-all duration-1000" [style.width]="emi.completionRate + '%'"></div>
                    </div>
                    <div class="flex justify-between mt-3 text-[10px] font-bold uppercase">
                      <span [style.color]="'var(--theme-text-tertiary)'">Paid: {{ emi.paidInstallments }}</span>
                      <span [style.color]="'var(--theme-text-tertiary)'">Total: {{ emi.totalInstallments }}</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 border text-center" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius)'">
                      <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold mb-1">DEFAULTS</p>
                      <p class="font-bold" [style.color]="emi.defaultedEMIs > 0 ? 'var(--theme-error)' : 'var(--theme-text-tertiary)'">{{ emi.defaultedEMIs }}</p>
                    </div>
                    <div class="p-3 border text-center" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius)'">
                      <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold mb-1">INTEREST</p>
                      <p class="font-bold text-emerald-500">₹{{ emi.totalInterestEarned | number }}</p>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[50vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" styleClass="w-10 h-10"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">Generating cash flow statement...</p>
        </div>
      </ng-template>

    </div>
  `
})
export class CashFlowAnalysisComponent implements OnInit {
  cashData = signal<any>(null);
  loading = signal<boolean>(true);

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getCashFlowAnalysis().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.cashData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}