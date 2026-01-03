import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';

interface CashProjection {
  date: string;
  projectedInflow: number;
  projectedOutflow: number;
  netCash: number;
}

@Component({
  selector: 'app-predictive-analytics',
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
              [style.font-size]="'var(--font-size-2xl)'">Predictive Intelligence</h2>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
            Future-state modeling for Sales, Inventory, and Liquidity
          </p>
        </div>
        <div class="flex items-center gap-2">
           <div class="px-3 py-1 rounded-full border border-dashed flex items-center gap-2" 
                [style.border-color]="'var(--theme-accent-primary)'" [style.background]="'rgba(139, 92, 246, 0.05)'">
             <i class="pi pi-verified text-indigo-400"></i>
             <span class="font-bold uppercase tracking-widest text-[10px]" [style.color]="'var(--theme-accent-primary)'">95% Confidence Level</span>
           </div>
           <p-button icon="pi pi-sync" [text]="true" severity="info" (onClick)="loadData()"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="p-6 border transition-all hover:shadow-lg" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-2" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Revenue Forecast</p>
            <h2 class="text-3xl font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">₹{{ predictData()?.sales?.forecast[0]?.predictedRevenue | number }}</h2>
            <div class="flex items-center gap-2 mt-2" [style.color]="predictData()?.sales?.forecast[0]?.growth >= 0 ? 'var(--theme-success)' : 'var(--theme-error)'">
               <i class="pi" [ngClass]="predictData()?.sales?.forecast[0]?.growth >= 0 ? 'pi-arrow-up-right' : 'pi-arrow-down-right'"></i>
               <span class="font-bold">{{ predictData()?.sales?.forecast[0]?.growth }}% Growth</span>
            </div>
          </div>

          <div class="p-6 border transition-all" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-2" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Projected Cash On Hand</p>
            <h2 class="text-3xl font-bold tabular-nums text-emerald-500">₹{{ predictData()?.cashFlow?.projectedCash | number }}</h2>
            <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">EndOf Month Estimate</p>
          </div>

          <div class="p-6 border flex flex-col justify-center" [style.background]="'var(--theme-accent-gradient)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
             <p class="text-white font-black uppercase tracking-tighter opacity-80" [style.font-size]="'var(--font-size-xs)'">Model Reliability</p>
             <h3 class="text-white font-bold text-2xl uppercase italic tracking-widest">{{ predictData()?.sales?.accuracy }}</h3>
             <div class="mt-2 w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div class="h-full bg-white" [style.width]="'65%'"></div>
             </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-8">
            <div class="border overflow-hidden shadow-sm" 
                 [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
                <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">30-Day Liquidity Projection</h3>
                <div class="flex gap-4 items-center">
                  <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-emerald-500"></div><span class="text-[10px] font-bold text-slate-400">INFLOW</span></div>
                  <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-rose-500"></div><span class="text-[10px] font-bold text-slate-400">OUTFLOW</span></div>
                </div>
              </div>

              <p-table [value]="predictData()?.cashFlow?.dailyProjections" [scrollable]="true" scrollHeight="400px" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'">Date</th>
                    <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Projected In</th>
                    <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Projected Out</th>
                    <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Net Cash</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-day>
                  <tr [style.color]="'var(--theme-text-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
                    <td class="font-bold text-white">{{ day.date | date:'dd MMM yyyy' }}</td>
                    <td class="text-right font-mono tabular-nums text-emerald-500">+₹{{ day.projectedInflow | number }}</td>
                    <td class="text-right font-mono tabular-nums text-rose-400">-₹{{ day.projectedOutflow | number }}</td>
                    <td class="text-right font-black tabular-nums" [style.color]="day.netCash >= 0 ? 'var(--theme-text-primary)' : 'var(--theme-error)'">
                       ₹{{ day.netCash | number }}
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>

          <div class="lg:col-span-4 space-y-6">
            <div class="p-6 border h-full flex flex-col" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <h4 class="font-bold mb-6 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Stock-out Risk Engine</h4>
              
              @if (predictData()?.inventory?.predictions?.length) {
                <div class="space-y-4 flex-1">
                   @for (pred of predictData()?.inventory?.predictions; track pred._id) {
                     }
                </div>
              } @else {
                <div class="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
                   <i class="pi pi-box text-5xl mb-4" [style.color]="'var(--theme-text-tertiary)'"></i>
                   <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">No critical stock-out risks detected for the projected period.</p>
                </div>
              }

              <div class="mt-auto p-4 border border-dashed rounded-lg" [style.border-color]="'var(--theme-info)'" [style.background]="'rgba(59, 130, 246, 0.05)'">
                 <div class="flex gap-3">
                   <i class="pi pi-info-circle text-blue-400 mt-1"></i>
                   <div>
                     <p class="font-bold" [style.color]="'var(--theme-info)'" [style.font-size]="'var(--font-size-xs)'">AI Observation</p>
                     <p class="mt-1" [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'" class="leading-tight">
                       Consistent daily net flow of <strong>₹2,000</strong> detected. Total projected liquidity is sufficient for planned overheads.
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
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Training Neural Networks...</p>
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
export class PredictiveAnalyticsComponent implements OnInit {
  predictData = signal<any>(null);
  loading = signal<boolean>(true);

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    // Requesting 3 periods and 0.95 confidence
    this.analyticsService.getPredictiveAnalytics(undefined, 3, 0.95).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.predictData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}