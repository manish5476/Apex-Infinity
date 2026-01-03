import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';

@Component({
  selector: 'app-time-analytics',
  standalone: true,
  imports: [CommonModule, TableModule, TabsModule, ButtonModule, ProgressSpinnerModule, TooltipModule],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <div class="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 class="font-bold tracking-tight mb-1" 
              [style.color]="'var(--theme-text-primary)'"
              [style.font-family]="'var(--font-heading)'"
              [style.font-size]="'var(--font-size-2xl)'">Revenue Chronology</h2>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
            Multi-dimensional time analysis of sales volume and ticket sizes
          </p>
        </div>
        <p-button label="Refresh Timeline" icon="pi pi-history" [outlined]="true" size="small" (onClick)="loadData()"></p-button>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
           <div class="p-4 border transition-all" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
              <p class="uppercase font-bold text-[10px] mb-1" [style.color]="'var(--theme-text-label)'">Peak Hour</p>
              <p class="font-bold text-white tabular-nums">{{ topHour()?.hourLabel }}</p>
              <p class="text-[10px] text-emerald-500 font-bold mt-1">₹{{ topHour()?.totalRevenue | number }}</p>
           </div>
           <div class="p-4 border transition-all" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
              <p class="uppercase font-bold text-[10px] mb-1" [style.color]="'var(--theme-text-label)'">Strongest Day</p>
              <p class="font-bold text-white">{{ topDay()?.dayLabel }}</p>
              <p class="text-[10px] text-indigo-400 font-bold mt-1">{{ topDay()?.transactionCount }} Transactions</p>
           </div>
           <div class="p-4 border transition-all" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
              <p class="uppercase font-bold text-[10px] mb-1" [style.color]="'var(--theme-text-label)'">Avg Ticket (Monthly)</p>
              <p class="font-bold text-white">₹{{ (timeData()?.monthly[0]?.totalRevenue / timeData()?.monthly[0]?.transactionCount) | number:'1.0-0' }}</p>
              <p class="text-[10px] text-amber-500 font-bold mt-1">Jan 2026 Basis</p>
           </div>
           <div class="p-4 border flex items-center justify-center" [style.background]="'var(--theme-accent-gradient)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
              <div class="text-center">
                 <p class="text-white font-black text-xs uppercase tracking-tighter">Total Period Rev</p>
                 <p class="text-xl font-bold text-white tabular-nums">₹{{ totalPeriodRevenue() | number }}</p>
              </div>
           </div>
        </div>

        <div class="card overflow-hidden transition-all" 
             [style.background]="'var(--theme-bg-secondary)'" 
             [style.border-color]="'var(--theme-border-primary)'" 
             [style.border-radius]="'var(--ui-border-radius-xl)'"
             [style.box-shadow]="'var(--shadow-lg)'">
             
          <p-tabs [value]="'0'">
            <p-tablist [style.background]="'var(--theme-bg-ternary)'">
              <p-tab value="0"><i class="pi pi-clock mr-2"></i> Hourly</p-tab>
              <p-tab value="1"><i class="pi pi-calendar mr-2"></i> Daily</p-tab>
              <p-tab value="2"><i class="pi pi-calendar-plus mr-2"></i> Weekly</p-tab>
              <p-tab value="3"><i class="pi pi-chart-line mr-2"></i> Monthly</p-tab>
            </p-tablist>

            <p-tabpanels [style.background]="'transparent'" class="p-0">
              
              <p-tabpanel value="0">
                <p-table [value]="timeData()?.hourly" styleClass="p-datatable-sm no-border-table">
                  <ng-template pTemplate="header">
                    <tr>
                      <th [style.color]="'var(--theme-text-label)'">Time Slot</th>
                      <th [style.color]="'var(--theme-text-label)'" class="text-right">Transactions</th>
                      <th [style.color]="'var(--theme-text-label)'" class="text-right">Avg Ticket</th>
                      <th [style.color]="'var(--theme-text-label)'" class="text-right">Total Revenue</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-h>
                    <tr [style.color]="'var(--theme-text-secondary)'">
                      <td class="font-bold">{{ h.hourLabel }}</td>
                      <td class="text-right font-mono">{{ h.transactionCount }}</td>
                      <td class="text-right tabular-nums text-indigo-400">₹{{ h.avgTicketSize | number }}</td>
                      <td class="text-right font-bold tabular-nums text-white">₹{{ h.totalRevenue | number }}</td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-tabpanel>

              <p-tabpanel value="1">
                <p-table [value]="timeData()?.daily" styleClass="p-datatable-sm no-border-table">
                  <ng-template pTemplate="header">
                    <tr>
                      <th [style.color]="'var(--theme-text-label)'">Day</th>
                      <th [style.color]="'var(--theme-text-label)'" class="text-right">Transactions</th>
                      <th [style.color]="'var(--theme-text-label)'" class="text-right">Daily Revenue</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-d>
                    <tr [style.color]="'var(--theme-text-secondary)'">
                      <td class="font-bold text-white">{{ d.dayLabel }}</td>
                      <td class="text-right font-mono">{{ d.transactionCount }}</td>
                      <td class="text-right font-bold tabular-nums text-emerald-500">₹{{ d.totalRevenue | number }}</td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-tabpanel>

              <p-tabpanel value="2">
                <p-table [value]="timeData()?.weekly" styleClass="p-datatable-sm no-border-table">
                  <ng-template pTemplate="header">
                    <tr>
                      <th [style.color]="'var(--theme-text-label)'">Week Number</th>
                      <th [style.color]="'var(--theme-text-label)'" class="text-right">Transactions</th>
                      <th [style.color]="'var(--theme-text-label)'" class="text-right">Weekly Revenue</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-w>
                    <tr [style.color]="'var(--theme-text-secondary)'">
                      <td class="font-bold">Week {{ w.week }}</td>
                      <td class="text-right font-mono">{{ w.transactionCount }}</td>
                      <td class="text-right font-bold tabular-nums text-indigo-400">₹{{ w.totalRevenue | number }}</td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-tabpanel>

              <p-tabpanel value="3">
                <p-table [value]="timeData()?.monthly" styleClass="p-datatable-sm no-border-table">
                  <ng-template pTemplate="header">
                    <tr>
                      <th [style.color]="'var(--theme-text-label)'">Period</th>
                      <th [style.color]="'var(--theme-text-label)'" class="text-right">Transactions</th>
                      <th [style.color]="'var(--theme-text-label)'" class="text-right">Monthly Revenue</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-m>
                    <tr [style.color]="'var(--theme-text-secondary)'">
                      <td class="font-bold text-white">{{ m.monthLabel }}</td>
                      <td class="text-right font-mono">{{ m.transactionCount }}</td>
                      <td class="text-right font-bold tabular-nums text-emerald-500">₹{{ m.totalRevenue | number }}</td>
                    </tr>
                  </ng-template>
                </p-table>
              </p-tabpanel>

            </p-tabpanels>
          </p-tabs>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Compiling Time Series...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    :host ::ng-deep .no-border-table .p-datatable-tbody > tr {
      background: transparent !important;
      border-bottom: 1px solid var(--theme-border-primary) !important;
    }
    :host ::ng-deep .no-border-table .p-datatable-thead > tr > th {
      background: transparent !important;
      padding: 1rem;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      border: none !important;
    }
    :host ::ng-deep .p-tablist-tab-list {
      border-bottom: 1px solid var(--theme-border-primary) !important;
    }
  `]
})
export class TimeAnalyticsComponent implements OnInit {
  timeData = signal<any>(null);
  loading = signal<boolean>(true);

  // Computed insights
  totalPeriodRevenue = computed(() => {
    return this.timeData()?.monthly.reduce((acc: number, m: any) => acc + m.totalRevenue, 0) || 0;
  });

  topHour = computed(() => {
    if (!this.timeData()?.hourly.length) return null;
    return [...this.timeData().hourly].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
  });

  topDay = computed(() => {
    if (!this.timeData()?.daily.length) return null;
    return [...this.timeData().daily].sort((a, b) => b.transactionCount - a.transactionCount)[0];
  });

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getTimeBasedAnalytics().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.timeData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}