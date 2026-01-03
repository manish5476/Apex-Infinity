import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AdminAnalyticsService } from '../admin-analytics.service';

@Component({
  selector: 'app-customer-intelligence',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, TooltipModule, TagModule, ProgressSpinnerModule],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div class="p-5 border transition-all" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Total Network LTV</p>
            <h2 class="text-3xl font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">₹{{ intelligenceData()?.valueAnalysis?.totalLTV | number }}</h2>
            <div class="flex items-center gap-2 mt-2">
              <span [style.color]="'var(--theme-success)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold">AVG: ₹{{ intelligenceData()?.valueAnalysis?.avgLTV | number:'1.0-0' }}</span>
            </div>
          </div>

          <div class="lg:col-span-3 p-5 border flex items-center justify-around gap-4" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            @for (segment of intelligenceData()?.segmentation | keyvalue; track segment.key) {
              <div class="text-center px-4">
               <p class="font-bold tabular-nums" [style.font-size]="'var(--font-size-xl)'" 
   [style.color]="$any(segment.value) > 0 ? 'var(--theme-accent-primary)' : 'var(--theme-text-tertiary)'">
  {{ segment.value }}
</p>
                <p class="uppercase font-bold tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">
                  {{ segment.key }}
                </p>
              </div>
            }
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-8 space-y-6">
            <div class="border overflow-hidden" 
                 [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
                <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Top Value Performers (LTV)</h3>
                <p-button icon="pi pi-star" [text]="true" severity="warn" size="small"></p-button>
              </div>
              
              <p-table [value]="intelligenceData()?.valueAnalysis?.topLTV" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'">Customer</th>
                    <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'">Tier</th>
                    <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Orders</th>
                    <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Total Spent</th>
                    <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right w-32">Value Score</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-customer>
                  <tr [style.color]="'var(--theme-text-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
                    <td>
                      <div class="flex flex-col">
                        <span class="font-bold text-white">{{ customer.name }}</span>
                        <span class="text-[10px]" [style.color]="'var(--theme-text-label)'">{{ customer.email }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400">
                        {{ customer.tier }}
                      </span>
                    </td>
                    <td class="text-right font-mono">{{ customer.transactionCount }}</td>
                    <td class="text-right font-bold tabular-nums">₹{{ customer.totalSpent | number }}</td>
                    <td>
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                          <div class="h-full bg-emerald-500" [style.width]="customer.valueScore + '%'"></div>
                        </div>
                        <span class="text-[10px] font-mono">{{ customer.valueScore | number:'1.0-0' }}</span>
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>

          <div class="lg:col-span-4 space-y-6">
            <div class="p-5 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="flex justify-between items-center mb-6">
                <h4 class="font-bold uppercase tracking-tighter" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-md)'">Credit Risk Monitor</h4>
                <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold text-[10px]">FLAGGED: {{ intelligenceData()?.riskAnalysis?.creditRisk?.length }}</span>
              </div>
              
              <div class="space-y-4">
                @for (risk of intelligenceData()?.riskAnalysis?.creditRisk; track risk._id) {
                  <div class="p-3 border transition-colors hover:bg-white/5" 
                       [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
                    <div class="flex justify-between items-start mb-2">
                      <p class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">{{ risk.name }}</p>
                      <i class="pi pi-exclamation-triangle text-rose-500 text-xs"></i>
                    </div>
                    <div class="flex justify-between text-[11px] mb-1">
                      <span [style.color]="'var(--theme-text-tertiary)'">Outstanding Balance</span>
                      <span class="font-bold text-rose-400">₹{{ risk.outstandingBalance | number }}</span>
                    </div>
                    <div class="flex justify-between text-[11px]">
                      <span [style.color]="'var(--theme-text-tertiary)'">Limit Restricted To</span>
                      <span [style.color]="'var(--theme-text-secondary)'">₹{{ risk.creditLimit | number }}</span>
                    </div>
                    <div class="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                       <div class="h-full bg-rose-600" [style.width]="'100%'"></div>
                    </div>
                  </div>
                }
              </div>

              <p-button label="Freeze High Risk Accounts" severity="danger" [text]="true" size="small" class="w-full mt-4"></p-button>
            </div>

            <div class="p-5 border transition-colors border-dashed" [style.background]="'rgba(139, 92, 246, 0.05)'" [style.border-color]="'var(--theme-accent-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-accent-primary)'" [style.font-size]="'var(--font-size-xs)'">Loyalty Strategy</h4>
              <div class="space-y-3">
                <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
                  <i class="pi pi-info-circle mr-2 text-indigo-400"></i>
                  {{ intelligenceData()?.valueAnalysis?.topLTV[0]?.name }} has a Value Score of 100. Consider offering an exclusive service plan.
                </p>
              </div>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[50vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">Computing behavioral patterns...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr {
      background: transparent !important;
      border-bottom: 1px solid var(--theme-border-primary) !important;
    }
    :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
      padding: 0.75rem 1rem;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      border: none !important;
    }
  `]
})
export class CustomerIntelligenceComponent implements OnInit {
  intelligenceData = signal<any>(null);
  loading = signal<boolean>(true);

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getCustomerIntelligence().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.intelligenceData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}