import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';

interface LTVCustomer {
  _id: string;
  name: string;
  email: string;
  totalSpent: number;
  transactionCount: number;
  avgOrderValue: number;
  tier: string;
  valueScore: number;
  lifespanDays: number;
}

@Component({
  selector: 'app-customer-ltv-analysis',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, ProgressSpinnerModule, TooltipModule],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="p-5 border transition-all hover:shadow-md" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Total Network LTV</p>
            <h2 class="text-3xl font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">₹{{ ltvData()?.summary?.totalLTV | number }}</h2>
          </div>

          <div class="p-5 border transition-all" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Avg Customer Value</p>
            <h2 class="text-3xl font-bold tabular-nums text-indigo-400">₹{{ ltvData()?.summary?.avgLTV | number:'1.0-0' }}</h2>
          </div>

          <div class="p-5 border flex items-center justify-between" 
               [style.background]="'var(--theme-accent-gradient)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <div class="text-white">
              <p class="uppercase font-black tracking-tighter opacity-80" [style.font-size]="'var(--font-size-xs)'">Top Performer</p>
              <h3 class="font-bold text-lg truncate w-40">{{ ltvData()?.summary?.topCustomer?.name }}</h3>
            </div>
            <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white shadow-lg">
              <i class="pi pi-star-fill text-xl"></i>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-8">
            <div class="border overflow-hidden" 
                 [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
                <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Lifetime Value Ranking</h3>
                <p-button icon="pi pi-download" [text]="true" size="small"></p-button>
              </div>

              <p-table [value]="ltvData()?.customers" styleClass="p-datatable-sm" [responsiveLayout]="'scroll'">
                <ng-template pTemplate="header">
                  <tr>
                    <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'">Rank</th>
                    <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'">Customer</th>
                    <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">AOV</th>
                    <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Total Spent</th>
                    <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-center">Score</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-customer let-i="rowIndex">
                  <tr [style.color]="'var(--theme-text-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
                    <td class="text-center font-bold tabular-nums opacity-50">#{{ i + 1 }}</td>
                    <td>
                      <div class="flex flex-col">
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-white">{{ customer.name }}</span>
                          <span class="px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase">
                            {{ customer.tier }}
                          </span>
                        </div>
                        <span class="text-[10px]" [style.color]="'var(--theme-text-label)'">{{ customer.email }}</span>
                      </div>
                    </td>
                    <td class="text-right font-mono" [style.font-size]="'var(--font-size-xs)'">₹{{ customer.avgOrderValue | number:'1.0-0' }}</td>
                    <td class="text-right font-bold tabular-nums text-emerald-500">₹{{ customer.totalSpent | number }}</td>
                    <td>
                      <div class="flex flex-col items-center gap-1">
                        <span class="text-[10px] font-bold" [style.color]="'var(--theme-text-primary)'">{{ customer.valueScore | number:'1.0-0' }}%</span>
                        <div class="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div class="h-full bg-indigo-500" [style.width]="customer.valueScore + '%'"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>

          <div class="lg:col-span-4 space-y-6">
            <div class="p-6 border relative overflow-hidden" 
                 [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <h4 class="font-bold mb-6 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Top Contributor Details</h4>
              
              <div class="flex flex-col items-center mb-6">
                <div class="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-xl" 
                     [style.background]="'var(--theme-accent-gradient)'">
                  {{ ltvData()?.summary?.topCustomer?.name.charAt(0) }}
                </div>
                <p class="font-bold text-white">{{ ltvData()?.summary?.topCustomer?.name }}</p>
                <p class="text-[10px] uppercase font-bold text-indigo-400">High-Ticket Buyer</p>
              </div>

              <div class="space-y-4 pt-4 border-t" [style.border-color]="'var(--theme-border-primary)'">
                <div class="flex justify-between">
                  <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Avg Ticket Size</span>
                  <span class="font-bold text-white">₹{{ ltvData()?.summary?.topCustomer?.avgOrderValue | number }}</span>
                </div>
                <div class="flex justify-between">
                  <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Frequency</span>
                  <span class="font-bold text-white">{{ ltvData()?.summary?.topCustomer?.transactionCount }} Orders</span>
                </div>
                <div class="flex justify-between">
                  <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Account Lifespan</span>
                  <span class="font-bold text-white">{{ ltvData()?.summary?.topCustomer?.lifespanDays | number:'1.1-1' }} Days</span>
                </div>
              </div>
            </div>

            <div class="p-5 border transition-colors border-dashed" 
                 [style.background]="'rgba(16, 185, 129, 0.05)'" [style.border-color]="'var(--theme-success)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <h4 class="font-bold mb-3 uppercase tracking-tighter" [style.color]="'var(--theme-success)'" [style.font-size]="'var(--font-size-xs)'">Retention Trigger</h4>
              <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
                <i class="pi pi-bolt mr-1"></i>
                High AOV detected for <span class="text-white font-bold">{{ ltvData()?.customers[0]?.name }}</span>. 
                Triggering a VIP concierge invite could increase retention by 15%.
              </p>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[50vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">Reconstructing customer lifecycles...</p>
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
      padding: 0.85rem 1rem;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      border: none !important;
    }
  `]
})
export class CustomerLtvAnalysisComponent implements OnInit {
  ltvData = signal<any>(null);
  loading = signal<boolean>(true);

  constructor(private analyticsService: AdminAnalyticsService) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getCustomerLifetimeValue().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.ltvData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}