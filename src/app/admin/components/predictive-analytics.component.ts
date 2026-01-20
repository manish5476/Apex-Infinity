import { Component, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

@Component({
  selector: 'app-predictive-analytics',
  standalone: true,
  imports: [
    CommonModule, ButtonModule, 
    ProgressSpinnerModule, TooltipModule,
    AgShareGrid // Added Custom Grid
  ],
  template: `
    <div class="relative w-full p-1 md:p-2 overflow-hidden rounded-2xl transition-all duration-500" 
         [style.font-family]="'var(--font-body)'">

      <div class="absolute top-[-20%] left-[20%] w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-[100px] animate-pulse-slow pointer-events-none"></div>

      <div class="relative z-10 p-6 border rounded-2xl transition-all"
           style="background: rgba(15, 23, 42, 0.6); 
                  backdrop-filter: blur(16px); 
                  -webkit-backdrop-filter: blur(16px);
                  border: 1px solid rgba(255, 255, 255, 0.08);
                  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);">

        <div class="mb-8 flex flex-wrap justify-between items-end gap-4">
          <div>
            <h2 class="font-bold tracking-tight mb-1 text-xl text-white flex items-center gap-2">
              <i class="pi pi-chart-line text-violet-400"></i>
              Predictive Intelligence 
            </h2>
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">
              Future-state modeling for Sales, Inventory, and Liquidity
            </p>
          </div>
          <div class="flex items-center gap-2">
             <div class="px-3 py-1 rounded-full border border-dashed flex items-center gap-2 border-violet-500/30 bg-violet-500/10">
               <i class="pi pi-verified text-violet-400"></i>
               <span class="font-bold uppercase tracking-widest text-[10px] text-violet-300">95% Confidence Level</span>
             </div>
             <p-button icon="pi pi-sync" [text]="true" [rounded]="true" severity="info" (onClick)="loadData()" [loading]="loading()"></p-button>
          </div>
        </div>

        <ng-container *ngIf="!loading(); else loader">
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="p-6 border transition-all hover:scale-[1.01]" 
                 style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.1); border-radius: 12px;">
              <p class="uppercase font-bold tracking-widest mb-2 text-slate-400 text-xs">Revenue Forecast</p>
              <h2 class="text-3xl font-bold tabular-nums text-white">₹{{ predictData()?.sales?.forecast[0]?.predictedRevenue | number }}</h2>
              <div class="flex items-center gap-2 mt-2" 
                   [ngClass]="predictData()?.sales?.forecast[0]?.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                 <i class="pi" [ngClass]="predictData()?.sales?.forecast[0]?.growth >= 0 ? 'pi-arrow-up-right' : 'pi-arrow-down-right'"></i>
                 <span class="font-bold text-xs">{{ predictData()?.sales?.forecast[0]?.growth }}% Growth</span>
              </div>
            </div>

            <div class="p-6 border transition-all" 
                 style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.1); border-radius: 12px;">
              <p class="uppercase font-bold tracking-widest mb-2 text-slate-400 text-xs">Projected Cash On Hand</p>
              <h2 class="text-3xl font-bold tabular-nums text-emerald-400">₹{{ predictData()?.cashFlow?.projectedCash | number }}</h2>
              <p class="mt-2 text-slate-500 text-xs">End-Of-Month Estimate</p>
            </div>

            <div class="p-6 border flex flex-col justify-center relative overflow-hidden" 
                 style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.05) 100%); border-color: rgba(139, 92, 246, 0.3); border-radius: 12px;">
                <p class="text-white font-black uppercase tracking-tighter opacity-80 text-xs">Model Reliability</p>
                <h3 class="text-white font-bold text-2xl uppercase italic tracking-widest">{{ predictData()?.sales?.accuracy }}</h3>
                <div class="mt-2 w-full h-1 bg-white/20 rounded-full overflow-hidden">
                   <div class="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" [style.width]="'85%'"></div>
                </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div class="lg:col-span-8">
              <div class="border overflow-hidden h-full flex flex-col" 
                   style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.1); border-radius: 12px;">
                
                <div class="p-4 border-b flex justify-between items-center shrink-0" 
                     style="border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.02);">
                  <h3 class="font-bold uppercase tracking-tight text-white text-xs">30-Day Liquidity Projection</h3>
                  <div class="flex gap-4 items-center">
                    <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-emerald-500"></div><span class="text-[10px] font-bold text-slate-400">INFLOW</span></div>
                    <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-rose-500"></div><span class="text-[10px] font-bold text-slate-400">OUTFLOW</span></div>
                  </div>
                </div>

                <div class="grid-wrapper flex-1 relative min-h-[400px]">
                   <app-ag-share-grid 
                     [columns]="projectionColumns" 
                     [data]="predictData()?.cashFlow?.dailyProjections || []" 
                     [showActions]="false" 
                     style="width: 100%; height: 100%; display: block; position: absolute; inset: 0;">
                   </app-ag-share-grid>
                </div>
              </div>
            </div>

            <div class="lg:col-span-4 space-y-6">
              <div class="p-6 border h-full flex flex-col" 
                   style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.1); border-radius: 12px;">
                <h4 class="font-bold mb-6 uppercase tracking-tighter text-slate-400 text-xs">Stock-out Risk Engine</h4>
                
                @if (predictData()?.inventory?.predictions?.length) {
                  <div class="space-y-4 flex-1">
                     @for (pred of predictData()?.inventory?.predictions; track pred._id) {
                       }
                  </div>
                } @else {
                  <div class="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
                     <i class="pi pi-box text-5xl mb-4 text-slate-500"></i>
                     <p class="text-slate-500 text-sm">No critical stock-out risks detected for the projected period.</p>
                  </div>
                }

                <div class="mt-auto p-4 border border-dashed rounded-lg flex gap-3" 
                     style="border-color: rgba(96, 165, 250, 0.3); background: rgba(96, 165, 250, 0.05);">
                    <i class="pi pi-info-circle text-blue-400 mt-1"></i>
                    <div>
                      <p class="font-bold text-blue-400 text-xs">AI Observation</p>
                      <p class="mt-1 text-slate-300 text-xs leading-tight">
                        Consistent daily net flow of <strong>₹2,000</strong> detected. Total projected liquidity is sufficient for planned overheads.
                      </p>
                    </div>
                </div>
              </div>
            </div>
          </div>

        </ng-container>

        <ng-template #loader>
          <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
            <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
            <p class="text-slate-500 text-sm font-bold uppercase tracking-widest">Training Neural Networks...</p>
          </div>
        </ng-template>

      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse-slow {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.1); }
    }
    .animate-pulse-slow {
      animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `]
})
export class PredictiveAnalyticsComponent implements OnInit {
  predictData = signal<any>(null);
  loading = signal<boolean>(true);
  
  projectionColumns: any[] = [];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupColumns();
    this.loadData();
  }

  setupColumns(): void {
    this.projectionColumns = [
      {
        field: 'date', 
        headerName: 'Date', 
        sortable: true, 
        width: 120,
        valueFormatter: (params: any) => this.commonService.formatDate(params.value, 'dd MMM yyyy'),
        cellStyle: { 'color': '#f8fafc', 'font-weight': '700' }
      },
      {
        field: 'projectedInflow', 
        headerName: 'Projected In', 
        sortable: true, 
        flex: 1,
        type: 'rightAligned',
        valueFormatter: (params: any) => `+${this.commonService.formatCurrency(params.value)}`,
        cellStyle: { 'color': '#34d399', 'font-family': 'monospace', 'text-align': 'right' } // Emerald-400
      },
      {
        field: 'projectedOutflow', 
        headerName: 'Projected Out', 
        sortable: true, 
        flex: 1,
        type: 'rightAligned',
        valueFormatter: (params: any) => `-${this.commonService.formatCurrency(params.value)}`,
        cellStyle: { 'color': '#fb7185', 'font-family': 'monospace', 'text-align': 'right' } // Rose-400
      },
      {
        field: 'netCash', 
        headerName: 'Net Cash', 
        sortable: true, 
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: (params: any) => {
           return {
             'font-weight': '900',
             'text-align': 'right',
             'color': params.value >= 0 ? '#f8fafc' : '#f43f5e' // White or Red
           };
        }
      }
    ];
    this.cdr.detectChanges();
  }

  loadData() {
    this.loading.set(true);
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

// import { Component, OnInit, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TooltipModule } from 'primeng/tooltip';
// import { AdminAnalyticsService } from '../admin-analytics.service';

// interface CashProjection {
//   date: string;
//   projectedInflow: number;
//   projectedOutflow: number;
//   netCash: number;
// }

// @Component({
//   selector: 'app-predictive-analytics',
//   standalone: true,
//   imports: [CommonModule, TableModule, ButtonModule, ProgressSpinnerModule, TooltipModule],
//   template: `
//     <div class="p-4 md:p-6 transition-colors duration-300" 
//          [style.background]="'var(--theme-bg-primary)'"
//          [style.font-family]="'var(--font-body)'">

//       <div class="mb-8 flex flex-wrap justify-between items-end gap-4">
//         <div>
//           <h2 class="font-bold tracking-tight mb-1" 
//               [style.color]="'var(--theme-text-primary)'"
//               [style.font-family]="'var(--font-heading)'"
//               [style.font-size]="'var(--font-size-2xl)'">Predictive Intelligence</h2>
//           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
//             Future-state modeling for Sales, Inventory, and Liquidity
//           </p>
//         </div>
//         <div class="flex items-center gap-2">
//            <div class="px-3 py-1 rounded-full border border-dashed flex items-center gap-2" 
//                 [style.border-color]="'var(--theme-accent-primary)'" [style.background]="'rgba(139, 92, 246, 0.05)'">
//              <i class="pi pi-verified text-indigo-400"></i>
//              <span class="font-bold uppercase tracking-widest text-[10px]" [style.color]="'var(--theme-accent-primary)'">95% Confidence Level</span>
//            </div>
//            <p-button icon="pi pi-sync" [text]="true" severity="info" (onClick)="loadData()"></p-button>
//         </div>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//           <div class="p-6 border transition-all hover:shadow-lg" 
//                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//             <p class="uppercase font-bold tracking-widest mb-2" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Revenue Forecast</p>
//             <h2 class="text-3xl font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">₹{{ predictData()?.sales?.forecast[0]?.predictedRevenue | number }}</h2>
//             <div class="flex items-center gap-2 mt-2" [style.color]="predictData()?.sales?.forecast[0]?.growth >= 0 ? 'var(--theme-success)' : 'var(--theme-error)'">
//                <i class="pi" [ngClass]="predictData()?.sales?.forecast[0]?.growth >= 0 ? 'pi-arrow-up-right' : 'pi-arrow-down-right'"></i>
//                <span class="font-bold">{{ predictData()?.sales?.forecast[0]?.growth }}% Growth</span>
//             </div>
//           </div>

//           <div class="p-6 border transition-all" 
//                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//             <p class="uppercase font-bold tracking-widest mb-2" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Projected Cash On Hand</p>
//             <h2 class="text-3xl font-bold tabular-nums text-emerald-500">₹{{ predictData()?.cashFlow?.projectedCash | number }}</h2>
//             <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">EndOf Month Estimate</p>
//           </div>

//           <div class="p-6 border flex flex-col justify-center" [style.background]="'var(--theme-accent-gradient)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//              <p class="text-white font-black uppercase tracking-tighter opacity-80" [style.font-size]="'var(--font-size-xs)'">Model Reliability</p>
//              <h3 class="text-white font-bold text-2xl uppercase italic tracking-widest">{{ predictData()?.sales?.accuracy }}</h3>
//              <div class="mt-2 w-full h-1 bg-white/20 rounded-full overflow-hidden">
//                 <div class="h-full bg-white" [style.width]="'65%'"></div>
//              </div>
//           </div>
//         </div>

//         <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
//           <div class="lg:col-span-8">
//             <div class="border overflow-hidden shadow-sm" 
//                  [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//               <div class="p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
//                 <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">30-Day Liquidity Projection</h3>
//                 <div class="flex gap-4 items-center">
//                   <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-emerald-500"></div><span class="text-[10px] font-bold text-slate-400">INFLOW</span></div>
//                   <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-rose-500"></div><span class="text-[10px] font-bold text-slate-400">OUTFLOW</span></div>
//                 </div>
//               </div>

//               <p-table [value]="predictData()?.cashFlow?.dailyProjections" [scrollable]="true" scrollHeight="400px" styleClass="p-datatable-sm">
//                 <ng-template pTemplate="header">
//                   <tr>
//                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'">Date</th>
//                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Projected In</th>
//                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Projected Out</th>
//                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Net Cash</th>
//                   </tr>
//                 </ng-template>
//                 <ng-template pTemplate="body" let-day>
//                   <tr [style.color]="'var(--theme-text-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
//                     <td class="font-bold text-white">{{ day.date | date:'dd MMM yyyy' }}</td>
//                     <td class="text-right font-mono tabular-nums text-emerald-500">+₹{{ day.projectedInflow | number }}</td>
//                     <td class="text-right font-mono tabular-nums text-rose-400">-₹{{ day.projectedOutflow | number }}</td>
//                     <td class="text-right font-black tabular-nums" [style.color]="day.netCash >= 0 ? 'var(--theme-text-primary)' : 'var(--theme-error)'">
//                        ₹{{ day.netCash | number }}
//                     </td>
//                   </tr>
//                 </ng-template>
//               </p-table>
//             </div>
//           </div>

//           <div class="lg:col-span-4 space-y-6">
//             <div class="p-6 border h-full flex flex-col" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//               <h4 class="font-bold mb-6 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Stock-out Risk Engine</h4>
              
//               @if (predictData()?.inventory?.predictions?.length) {
//                 <div class="space-y-4 flex-1">
//                    @for (pred of predictData()?.inventory?.predictions; track pred._id) {
//                      }
//                 </div>
//               } @else {
//                 <div class="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
//                    <i class="pi pi-box text-5xl mb-4" [style.color]="'var(--theme-text-tertiary)'"></i>
//                    <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">No critical stock-out risks detected for the projected period.</p>
//                 </div>
//               }

//               <div class="mt-auto p-4 border border-dashed rounded-lg" [style.border-color]="'var(--theme-info)'" [style.background]="'rgba(59, 130, 246, 0.05)'">
//                  <div class="flex gap-3">
//                    <i class="pi pi-info-circle text-blue-400 mt-1"></i>
//                    <div>
//                      <p class="font-bold" [style.color]="'var(--theme-info)'" [style.font-size]="'var(--font-size-xs)'">AI Observation</p>
//                      <p class="mt-1" [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'" class="leading-tight">
//                        Consistent daily net flow of <strong>₹2,000</strong> detected. Total projected liquidity is sufficient for planned overheads.
//                      </p>
//                    </div>
//                  </div>
//               </div>
//             </div>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Training Neural Networks...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     :host ::ng-deep .p-datatable .p-datatable-tbody > tr {
//       background: transparent !important;
//       border-bottom: 1px solid var(--theme-border-primary) !important;
//     }
//     :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
//       padding: 0.85rem 1rem;
//       font-size: 10px;
//       font-weight: 700;
//       text-transform: uppercase;
//       border: none !important;
//     }
//   `]
// })
// export class PredictiveAnalyticsComponent implements OnInit {
//   predictData = signal<any>(null);
//   loading = signal<boolean>(true);

//   constructor(private analyticsService: AdminAnalyticsService) {}

//   ngOnInit() {
//     this.loadData();
//   }

//   loadData() {
//     this.loading.set(true);
//     // Requesting 3 periods and 0.95 confidence
//     this.analyticsService.getPredictiveAnalytics(undefined, 3, 0.95).subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.predictData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }