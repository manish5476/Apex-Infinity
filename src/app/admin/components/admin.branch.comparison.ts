import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';

@Component({
  selector: 'app-branch-comparison',
  standalone: true,
  imports: [
    CommonModule, ButtonModule, TableModule, 
    TooltipModule, ProgressBarModule, ProgressSpinnerModule
  ],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="p-5 border relative overflow-hidden" 
             [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
          <div class="absolute top-[-10px] right-[-10px] opacity-10">
            <i class="pi pi-trophy text-7xl text-emerald-500"></i>
          </div>
          <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Market Leader</p>
          <h3 class="font-bold mb-2" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-lg)'">
            {{ comparison()?.topPerformer?.branchName }}
          </h3>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-emerald-500 tabular-nums">₹{{ comparison()?.topPerformer?.revenue | number }}</span>
            <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Revenue</span>
          </div>
        </div>

        <div class="p-5 border" 
             [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
          <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Highest Basket Value</p>
          <h3 class="font-bold mb-2" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-lg)'">
            {{ comparison()?.topPerformer?.branchName }}
          </h3>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-indigo-500 tabular-nums">₹{{ comparison()?.topPerformer?.avgBasketValue | number }}</span>
            <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">/ Invoice</span>
          </div>
        </div>

        <div class="p-5 border" 
             [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
          <div class="flex justify-between items-center mb-4">
            <span class="font-bold uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Network Reach</span>
            <p-button icon="pi pi-map" [text]="true" size="small"></p-button>
          </div>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-sm)'">Total Active Branches</span>
              <span class="font-bold" [style.color]="'var(--theme-text-primary)'">{{ comparison()?.total }}</span>
            </div>
            <div class="flex justify-between pt-2 border-t" [style.border-color]="'var(--theme-border-primary)'">
              <span [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-sm)'">Total Network Revenue</span>
              <span class="font-bold tabular-nums text-emerald-500">₹{{ comparison()?.topPerformer?.revenue | number }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="border overflow-hidden" 
           [style.background]="'var(--theme-bg-secondary)'" 
           [style.border-color]="'var(--theme-border-primary)'" 
           [style.border-radius]="'var(--ui-border-radius-xl)'">
        
        <div class="p-4 border-b flex justify-between items-center" 
             [style.border-color]="'var(--theme-border-primary)'" 
             [style.background]="'var(--theme-bg-ternary)'">
          <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Branch-wise Performance Breakdown</h3>
          <div class="flex gap-2">
            <p-button icon="pi pi-download" size="small" [text]="true" severity="secondary"></p-button>
          </div>
        </div>

        <p-table [value]="comparison()?.branches" styleClass="p-datatable-sm" [loading]="loading()">
          <ng-template pTemplate="header">
            <tr [style.background]="'transparent'">
              <th [style.color]="'var(--theme-text-label)'" class="w-12 text-center">Rank</th>
              <th [style.color]="'var(--theme-text-label)'">Branch Name</th>
              <th [style.color]="'var(--theme-text-label)'">Revenue Share</th>
              <th [style.color]="'var(--theme-text-label)'" class="text-right">Invoices</th>
              <th [style.color]="'var(--theme-text-label)'" class="text-right">Avg Basket</th>
              <th [style.color]="'var(--theme-text-label)'" class="text-right">Net Revenue</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-branch let-i="rowIndex">
            <tr [style.color]="'var(--theme-text-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
              <td class="text-center">
                <span class="font-bold tabular-nums" [style.color]="i === 0 ? 'var(--theme-warning)' : 'var(--theme-text-tertiary)'">#{{ i + 1 }}</span>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" [style.background]="i === 0 ? 'var(--theme-success)' : 'var(--theme-info)'"></div>
                  <span class="font-bold" [style.color]="'var(--theme-text-primary)'">{{ branch.branchName }}</span>
                </div>
              </td>
              <td>
                <div class="flex items-center gap-3">
                  <div class="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div class="h-full bg-indigo-500" [style.width]="'100%'"></div>
                  </div>
                  <span class="text-[10px] font-bold">100%</span>
                </div>
              </td>
              <td class="text-right font-mono">{{ branch.invoiceCount }}</td>
              <td class="text-right font-bold tabular-nums text-indigo-400">₹{{ branch.avgBasketValue | number }}</td>
              <td class="text-right">
                <span class="font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">₹{{ branch.revenue | number }}</span>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr {
      background: transparent !important;
      border-bottom: 1px solid var(--theme-border-primary) !important;
      transition: background 0.2s;
    }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr:hover {
      background: rgba(255,255,255,0.02) !important;
    }
    :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
      padding: 0.75rem 1rem;
      font-size: var(--font-size-xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border: none !important;
    }
  `]
})
export class BranchComparisonComponent implements OnInit {
  comparison = signal<any>(null);
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
    this.analyticsService.getBranchComparison().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.comparison.set(res.data.comparison);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}