import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { AdminAnalyticsService } from '../../services/admin-analytics.service';
// import { CommonService } from '../../services/common.service';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AdminAnalyticsService } from '../admin-analytics.service';

@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, ProgressSpinnerModule, TableModule],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div class="lg:col-span-2 p-6 border transition-all" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <div class="flex justify-between items-center mb-6">
              <h3 class="font-bold uppercase tracking-widest" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Profitability Engine</h3>
              <span class="px-3 py-1 rounded-full font-bold tabular-nums" 
                    [style.background]="'var(--theme-bg-ternary)'" [style.color]="'var(--theme-success)'" [style.font-size]="'var(--font-size-md)'">
                {{ financialData()?.profitability?.marginPercent | number:'1.1-1' }}% Margin
              </span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="mb-1">Revenue</p>
                <p class="text-2xl font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">₹{{ financialData()?.profitability?.totalRevenue | number }}</p>
              </div>
              <div>
                <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="mb-1">Cost of Goods (COGS)</p>
                <p class="text-2xl font-bold tabular-nums text-rose-400">₹{{ financialData()?.profitability?.totalCOGS | number }}</p>
              </div>
              <div class="p-3 rounded-lg" [style.background]="'var(--theme-bg-ternary)'">
                <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="mb-1">Gross Profit</p>
                <p class="text-2xl font-bold tabular-nums text-emerald-500">₹{{ financialData()?.profitability?.grossProfit | number }}</p>
              </div>
            </div>

            <div class="mt-6 p-3 flex items-center gap-3 border border-dashed" 
                 [style.border-color]="'var(--theme-warning)'" [style.border-radius]="'var(--ui-border-radius)'" [style.background]="'rgba(251, 191, 36, 0.05)'">
              <i class="pi pi-exclamation-circle text-amber-500"></i>
              <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
                <strong>Action:</strong> {{ financialData()?.recommendations?.recommendations[1]?.action }} - {{ financialData()?.recommendations?.recommendations[1]?.reason }}
              </p>
            </div>
          </div>

          <div class="p-6 border flex flex-col justify-between" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <div>
              <h3 class="font-bold uppercase tracking-widest mb-4" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Receivables Aging</h3>
              @for (age of financialData()?.receivables?.aging; track age.range) {
                <div class="mb-4">
                  <div class="flex justify-between mb-1">
                    <span [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">{{ age.range }}</span>
                    <span class="font-bold" [style.color]="'var(--theme-error)'">₹{{ age.amount | number }}</span>
                  </div>
                  <div class="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div class="h-full bg-rose-500" [style.width]="'75%'"></div>
                  </div>
                  <p class="text-[10px] mt-1 text-right" [style.color]="'var(--theme-text-tertiary)'">{{ age.count }} Overdue Invoices</p>
                </div>
              }
            </div>
            <p-button label="View Detailed Aging" icon="pi pi-external-link" [text]="true" size="small" class="w-full"></p-button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-8 p-6 border transition-colors" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <div class="flex items-center gap-2 mb-6">
              <i class="pi pi-credit-card text-blue-400"></i>
              <h3 class="font-bold uppercase tracking-tighter" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-md)'">EMI Credit Monitoring</h3>
            </div>

            @for (emi of financialData()?.credit?.emiAnalytics; track emi._id) {
              <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="md:col-span-1 flex flex-col items-center justify-center border-r" [style.border-color]="'var(--theme-border-primary)'">
                  <p class="text-3xl font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">{{ emi.activeEMIs }}</p>
                  <p class="uppercase font-bold" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Active EMIs</p>
                </div>
                
                <div class="md:col-span-3 space-y-4">
                  <div class="flex justify-between items-end">
                    <div>
                      <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Total Credit Exposure</p>
                      <p class="text-2xl font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">₹{{ emi.totalAmount | number }}</p>
                    </div>
                    <div class="text-right">
                      <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Interest Earned</p>
                      <p class="text-lg font-bold text-emerald-500 tabular-nums">+₹{{ emi.totalInterestEarned | number }}</p>
                    </div>
                  </div>

                  <div>
                    <div class="flex justify-between text-[11px] font-bold uppercase mb-2">
                      <span [style.color]="'var(--theme-text-label)'">Repayment Progress</span>
                      <span [style.color]="'var(--theme-text-primary)'">{{ emi.paidInstallments }} / {{ emi.totalInstallments }} Paid</span>
                    </div>
                    <div class="w-full h-3 rounded-lg bg-white/5 border overflow-hidden p-0.5" [style.border-color]="'var(--theme-border-primary)'">
                      <div class="h-full rounded-md transition-all duration-1000" 
                           [style.background]="'var(--theme-accent-gradient)'" [style.width]="emi.completionRate + '%'"></div>
                    </div>
                  </div>

                  <div class="flex gap-6">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">Default Rate: {{ emi.defaultRate }}%</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">Overdue: {{ emi.overdueInstallments }}</span>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="lg:col-span-4 space-y-6">
            <div class="p-5 border" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Tax Summary</h4>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Input GST</span>
                  <span class="font-bold" [style.color]="'var(--theme-text-primary)'">₹{{ financialData()?.tax?.inputTax | number }}</span>
                </div>
                <div class="flex justify-between">
                  <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Output GST</span>
                  <span class="font-bold" [style.color]="'var(--theme-text-primary)'">₹{{ financialData()?.tax?.outputTax | number }}</span>
                </div>
                <div class="flex justify-between pt-2 border-t" [style.border-color]="'var(--theme-border-primary)'">
                  <span class="font-bold" [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">Net Payable</span>
                  <span class="font-bold tabular-nums text-rose-400">₹{{ financialData()?.tax?.netPayable | number }}</span>
                </div>
              </div>
            </div>

            <div class="p-5 border transition-colors shadow-inner" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Priority Actions</h4>
              <div class="space-y-3">
                @for (rec of financialData()?.recommendations?.recommendations; track rec.action) {
                  <div class="p-2 border border-white/5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-bold text-indigo-400 uppercase text-[9px]">{{ rec.timeframe }} Term</span>
                      <span class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-rose-500/10 text-rose-500">Impact: {{ rec.impact }}</span>
                    </div>
                    <p class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">{{ rec.action }}</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[50vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">Reconciling financial statements...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    :host ::ng-deep .p-button.p-button-text {
      color: var(--theme-accent-primary);
      padding: 0;
      font-size: var(--font-size-xs);
      font-weight: 700;
      text-transform: uppercase;
    }
  `]
})
export class FinancialDashboardComponent implements OnInit {
  financialData = signal<any>(null);
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
    this.analyticsService.getFinancialDashboard().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.financialData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}