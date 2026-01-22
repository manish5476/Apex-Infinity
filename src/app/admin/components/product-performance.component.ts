import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

@Component({
  selector: 'app-product-performance',
  standalone: true,
  imports: [
    CommonModule, ButtonModule, 
    TooltipModule, ProgressSpinnerModule, TagModule,
    AgShareGrid
  ],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="mb-8">
          <div class="flex justify-between items-end mb-4">
            <div>
              <h2 class="font-bold tracking-tight mb-1" 
                  [style.color]="'var(--theme-text-primary)'"
                  [style.font-family]="'var(--font-heading)'"
                  [style.font-size]="'var(--font-size-xl)'">Profitability Champions</h2>
              <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
                Products delivering the highest net margin per unit
              </p>
            </div>
            <div class="flex gap-2">
               <span class="text-[10px] opacity-50 self-center hidden md:block">SCROLL FOR MORE &rarr;</span>
               <p-button label="Export CSV" icon="pi pi-file-excel" [text]="true" size="small"></p-button>
            </div>
          </div>

          <div class="flex overflow-x-auto gap-4 pb-4 snap-x custom-scrollbar">
            @for (prod of performanceData()?.highMargin; track prod._id) {
              <div class="min-w-[280px] p-4 border transition-all hover:translate-y-[-2px] snap-start" 
                   [style.background]="'var(--theme-bg-secondary)'" 
                   [style.border-color]="'var(--theme-border-primary)'" 
                   [style.border-radius]="'var(--ui-border-radius-xl)'">
                <div class="flex justify-between items-start mb-3">
                  <span class="px-2 py-0.5 rounded font-black text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                    High Margin
                  </span>
                  <i class="pi pi-arrow-up-right text-emerald-500 text-xs"></i>
                </div>
                
                <h3 class="font-bold truncate mb-1 w-full" 
                    [style.color]="'var(--theme-text-primary)'" 
                    [style.font-size]="'var(--font-size-sm)'"
                    [title]="prod.name">
                    {{ prod.name }}
                </h3>
                <p class="mb-4 tabular-nums" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">{{ prod.sku }}</p>
                
                <div class="flex justify-between items-end">
                  <div>
                    <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Margin/Unit</p>
                    <p class="text-lg font-bold tabular-nums text-emerald-500">₹{{ prod.margin | number }}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">{{ prod.marginPercent | number:'1.1-1' }}%</p>
                    <div class="w-12 h-1 rounded-full bg-white/5 mt-1 overflow-hidden">
                       <div class="h-full bg-emerald-500" [style.width]="(prod.marginPercent > 100 ? 100 : prod.marginPercent) + '%'"></div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-8">
            <div class="border overflow-hidden shadow-sm h-full flex flex-col" 
                 [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="p-4 border-b flex justify-between items-center shrink-0" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
                <div>
                   <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Dead Stock Inventory</h3>
                   <p class="text-[10px]" [style.color]="'var(--theme-text-tertiary)'">Items with zero movement in the last 30+ days</p>
                </div>
                <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold text-[10px]">LIQUIDATION CANDIDATES</span>
              </div>
              
              <div class="grid-wrapper flex-1 relative min-h-[400px]">
                 <app-ag-share-grid 
                   [columns]="deadStockColumns" 
                   [data]="performanceData()?.deadStock || []" 
                   [showActions]="true" 
                   (gridEvent)="handleGridAction($event)"
                   style="width: 100%; height: 100%; display: block; position: absolute; inset: 0;">
                 </app-ag-share-grid>
              </div>
            </div>
          </div>

          <div class="lg:col-span-4 space-y-6">
            <div class="p-6 border" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
               <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Asset Efficiency</h4>
               <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="mb-4">Total capital locked in non-moving stock:</p>
               <div class="mb-6">
                 <p class="text-3xl font-bold tabular-nums text-rose-500">₹2.8M</p>
                 <p class="text-[10px] font-bold text-rose-400/60 uppercase">High Risk Exposure</p>
               </div>
               <p-button label="Liquidate Strategy" severity="danger" [fluid]="true" size="small"></p-button>
            </div>

            <div class="p-5 border border-dashed" 
                 [style.background]="'rgba(96, 165, 250, 0.05)'" [style.border-color]="'var(--theme-info)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="flex gap-3">
                <i class="pi pi-info-circle text-blue-400 mt-1"></i>
                <div>
                  <p class="font-bold" [style.color]="'var(--theme-info)'" [style.font-size]="'var(--font-size-sm)'">Stock Rotation Tip</p>
                  <p class="mt-1 leading-relaxed" [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
                    <span class="text-white font-bold">MI Smart TV 32 Inch</span> has 150 units in dead stock. Consider a bundle offer with high-margin Soundbars to clear space.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[50vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">Auditing product performance...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    /* Horizontal Scrollbar Styling */
    .custom-scrollbar::-webkit-scrollbar {
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: var(--bg-secondary);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: var(--theme-border-primary); 
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: var(--theme-text-tertiary);
    }
  `]
})
export class ProductPerformanceComponent implements OnInit {
  performanceData = signal<any>(null);
  loading = signal<boolean>(true);
  
  deadStockColumns: any[] = [];

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
    this.deadStockColumns = [
      {
        field: 'name', 
        headerName: 'Product Detail', 
        sortable: true, 
        flex: 1,
        minWidth: 200,
        cellRenderer: (params: any) => {
          return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
                    <span style="font-weight: 700; color: var(--theme-text-primary);">${params.value}</span>
                    <span style="font-size: 10px; color: var(--theme-text-label);">${params.data.sku}</span>
                  </div>`;
        }
      },
      {
        field: 'stockQuantity', 
        headerName: 'Qty', 
        sortable: true, 
        width: 100,
        type: 'rightAligned',
        cellStyle: { 'font-family': 'monospace', 'font-weight': '700', 'text-align': 'right' }
      },
      {
        field: 'value', 
        headerName: 'Tied Capital', 
        sortable: true, 
        width: 140,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': '#fb7185', 'text-align': 'right' }
      },
     {
        headerName: 'Action',
        width: 100,
        cellRenderer: (params: any) => {
           // Reduced padding and added line-height:1 to fit compact rows
           return `<button style="background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2); color: #fb7185; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; cursor: pointer; line-height: 1; display: inline-flex; align-items: center; height: 20px;">LIQUIDATE</button>`;
        },
        cellStyle: { 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' }
      }
    ];
    this.cdr.detectChanges();
  }

  handleGridAction(event: any) {
    console.log('Grid Action:', event);
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getProductPerformance().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.performanceData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
// import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TagModule } from 'primeng/tag';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service'; // Added CommonMethodService
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

// @Component({
//   selector: 'app-product-performance',
//   standalone: true,
//   imports: [
//     CommonModule, ButtonModule, 
//     TooltipModule, ProgressSpinnerModule, TagModule,
//     AgShareGrid // Added Custom Grid
//   ],
//   template: `
//     <div class="p-4 md:p-6 transition-colors duration-300" 
//          [style.background]="'var(--theme-bg-primary)'"
//          [style.font-family]="'var(--font-body)'">

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="mb-8">
//           <div class="flex justify-between items-end mb-6">
//             <div>
//               <h2 class="font-bold tracking-tight mb-1" 
//                   [style.color]="'var(--theme-text-primary)'"
//                   [style.font-family]="'var(--font-heading)'"
//                   [style.font-size]="'var(--font-size-xl)'">Profitability Champions</h2>
//               <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
//                 Products delivering the highest net margin per unit
//               </p>
//             </div>
//             <p-button label="Export CSV" icon="pi pi-file-excel" [text]="true" size="small"></p-button>
//           </div>

//           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//             @for (prod of performanceData()?.highMargin?.slice(0, 4); track prod._id) {
//               <div class="p-4 border transition-all hover:translate-y-[-2px]" 
//                    [style.background]="'var(--theme-bg-secondary)'" 
//                    [style.border-color]="'var(--theme-border-primary)'" 
//                    [style.border-radius]="'var(--ui-border-radius-xl)'">
//                 <div class="flex justify-between items-start mb-3">
//                   <span class="px-2 py-0.5 rounded font-black text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
//                     High Margin
//                   </span>
//                   <i class="pi pi-arrow-up-right text-emerald-500 text-xs"></i>
//                 </div>
//                 <h3 class="font-bold truncate mb-1" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">{{ prod.name }}</h3>
//                 <p class="mb-4 tabular-nums" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">{{ prod.sku }}</p>
                
//                 <div class="flex justify-between items-end">
//                   <div>
//                     <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Margin/Unit</p>
//                     <p class="text-lg font-bold tabular-nums text-emerald-500">₹{{ prod.margin | number }}</p>
//                   </div>
//                   <div class="text-right">
//                     <p class="font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">{{ prod.marginPercent | number:'1.1-1' }}%</p>
//                     <div class="w-12 h-1 rounded-full bg-white/5 mt-1 overflow-hidden">
//                        <div class="h-full bg-emerald-500" [style.width]="prod.marginPercent + '%'"></div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             }
//           </div>
//         </div>

//         <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
//           <div class="lg:col-span-8">
//             <div class="border overflow-hidden shadow-sm h-full flex flex-col" 
//                  [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//               <div class="p-4 border-b flex justify-between items-center shrink-0" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
//                 <div>
//                    <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Dead Stock Inventory</h3>
//                    <p class="text-[10px]" [style.color]="'var(--theme-text-tertiary)'">Items with zero movement in the last 30+ days</p>
//                 </div>
//                 <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold text-[10px]">LIQUIDATION CANDIDATES</span>
//               </div>
              
//               <div class="grid-wrapper flex-1 relative min-h-[400px]">
//                  <app-ag-share-grid 
//                    [columns]="deadStockColumns" 
//                    [data]="performanceData()?.deadStock || []" 
//                    [showActions]="true" 
//                    (gridEvent)="handleGridAction($event)"
//                    style="width: 100%; height: 100%; display: block; position: absolute; inset: 0;">
//                  </app-ag-share-grid>
//               </div>
//             </div>
//           </div>

//           <div class="lg:col-span-4 space-y-6">
//             <div class="p-6 border" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//                <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Asset Efficiency 

// [Image of pareto chart inventory analysis]
// </h4>
//                <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="mb-4">Total capital locked in non-moving stock:</p>
//                <div class="mb-6">
//                  <p class="text-3xl font-bold tabular-nums text-rose-500">₹2.8M</p>
//                  <p class="text-[10px] font-bold text-rose-400/60 uppercase">High Risk Exposure</p>
//                </div>
//                <p-button label="Liquidate Strategy" severity="danger" [fluid]="true" size="small"></p-button>
//             </div>

//             <div class="p-5 border border-dashed" 
//                  [style.background]="'rgba(96, 165, 250, 0.05)'" [style.border-color]="'var(--theme-info)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//               <div class="flex gap-3">
//                 <i class="pi pi-info-circle text-blue-400 mt-1"></i>
//                 <div>
//                   <p class="font-bold" [style.color]="'var(--theme-info)'" [style.font-size]="'var(--font-size-sm)'">Stock Rotation Tip</p>
//                   <p class="mt-1 leading-relaxed" [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
//                     <span class="text-white font-bold">MI Smart TV 32 Inch</span> has 150 units in dead stock. Consider a bundle offer with high-margin Soundbars to clear space.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="h-[50vh] flex flex-col items-center justify-center gap-4">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
//           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">Auditing product performance...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: []
// })
// export class ProductPerformanceComponent implements OnInit {
//   performanceData = signal<any>(null);
//   loading = signal<boolean>(true);
  
//   deadStockColumns: any[] = [];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService, // Injected for currency formatting
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit() {
//     this.setupColumns();
//     this.loadData();
//   }

//   setupColumns(): void {
//     this.deadStockColumns = [
//       {
//         field: 'name', 
//         headerName: 'Product Detail', 
//         sortable: true, 
//         flex: 1,
//         minWidth: 200,
//         cellRenderer: (params: any) => {
//           return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
//                     <span style="font-weight: 700; color: var(--theme-text-primary);">${params.value}</span>
//                     <span style="font-size: 10px; color: var(--theme-text-label);">${params.data.sku}</span>
//                   </div>`;
//         }
//       },
//       {
//         field: 'stockQuantity', 
//         headerName: 'Qty', 
//         sortable: true, 
//         width: 100,
//         type: 'rightAligned',
//         cellStyle: { 'font-family': 'monospace', 'font-weight': '700', 'text-align': 'right' }
//       },
//       {
//         field: 'value', 
//         headerName: 'Tied Capital', 
//         sortable: true, 
//         width: 140,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//         cellStyle: { 'font-weight': '700', 'color': '#fb7185', 'text-align': 'right' } // Rose-400
//       },
//       {
//         headerName: 'Action',
//         width: 100,
//         cellRenderer: (params: any) => {
//            return `<button class="p-button-text p-button-sm p-button-danger" style="background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2); color: #fb7185; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; cursor: pointer;">LIQUIDATE</button>`;
//         },
//         cellStyle: { 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' }
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//   handleGridAction(event: any) {
//     // Handle action button clicks if needed
//     console.log('Grid Action:', event);
//   }

//   loadData() {
//     this.loading.set(true);
//     this.analyticsService.getProductPerformance().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.performanceData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }
// // import { Component, OnInit, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { TableModule } from 'primeng/table';
// // import { ButtonModule } from 'primeng/button';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { ProgressSpinnerModule } from 'primeng/progressspinner';
// // import { TagModule } from 'primeng/tag';
// // import { AdminAnalyticsService } from '../admin-analytics.service';

// // @Component({
// //   selector: 'app-product-performance',
// //   standalone: true,
// //   imports: [CommonModule, TableModule, ButtonModule, TooltipModule, ProgressSpinnerModule, TagModule],
// //   template: `
// //     <div class="p-4 md:p-6 transition-colors duration-300" 
// //          [style.background]="'var(--theme-bg-primary)'"
// //          [style.font-family]="'var(--font-body)'">

// //       <ng-container *ngIf="!loading(); else loader">
        
// //         <div class="mb-8">
// //           <div class="flex justify-between items-end mb-6">
// //             <div>
// //               <h2 class="font-bold tracking-tight mb-1" 
// //                   [style.color]="'var(--theme-text-primary)'"
// //                   [style.font-family]="'var(--font-heading)'"
// //                   [style.font-size]="'var(--font-size-xl)'">Profitability Champions</h2>
// //               <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
// //                 Products delivering the highest net margin per unit
// //               </p>
// //             </div>
// //             <p-button label="Export CSV" icon="pi pi-file-excel" [text]="true" size="small"></p-button>
// //           </div>

// //           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
// //             @for (prod of performanceData()?.highMargin?.slice(0, 4); track prod._id) {
// //               <div class="p-4 border transition-all hover:translate-y-[-2px]" 
// //                    [style.background]="'var(--theme-bg-secondary)'" 
// //                    [style.border-color]="'var(--theme-border-primary)'" 
// //                    [style.border-radius]="'var(--ui-border-radius-xl)'">
// //                 <div class="flex justify-between items-start mb-3">
// //                   <span class="px-2 py-0.5 rounded font-black text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
// //                     High Margin
// //                   </span>
// //                   <i class="pi pi-arrow-up-right text-emerald-500 text-xs"></i>
// //                 </div>
// //                 <h3 class="font-bold truncate mb-1" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">{{ prod.name }}</h3>
// //                 <p class="mb-4 tabular-nums" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">{{ prod.sku }}</p>
                
// //                 <div class="flex justify-between items-end">
// //                   <div>
// //                     <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Margin/Unit</p>
// //                     <p class="text-lg font-bold tabular-nums text-emerald-500">₹{{ prod.margin | number }}</p>
// //                   </div>
// //                   <div class="text-right">
// //                     <p class="font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">{{ prod.marginPercent | number:'1.1-1' }}%</p>
// //                     <div class="w-12 h-1 rounded-full bg-white/5 mt-1 overflow-hidden">
// //                        <div class="h-full bg-emerald-500" [style.width]="prod.marginPercent + '%'"></div>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>
// //             }
// //           </div>
// //         </div>

// //         <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
// //           <div class="lg:col-span-8">
// //             <div class="border overflow-hidden shadow-sm" 
// //                  [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //               <div class="p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
// //                 <div>
// //                    <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Dead Stock Inventory</h3>
// //                    <p class="text-[10px]" [style.color]="'var(--theme-text-tertiary)'">Items with zero movement in the last 30+ days</p>
// //                 </div>
// //                 <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold text-[10px]">LIQUIDATION CANDIDATES</span>
// //               </div>
              
// //               <p-table [value]="performanceData()?.deadStock" [paginator]="true" [rows]="5" styleClass="p-datatable-sm">
// //                 <ng-template pTemplate="header">
// //                   <tr>
// //                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'">Product Detail</th>
// //                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Qty</th>
// //                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Tied Capital</th>
// //                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-center">Action</th>
// //                   </tr>
// //                 </ng-template>
// //                 <ng-template pTemplate="body" let-stock>
// //                   <tr [style.color]="'var(--theme-text-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
// //                     <td>
// //                       <div class="flex flex-col">
// //                         <span class="font-bold" [style.color]="'var(--theme-text-primary)'">{{ stock.name }}</span>
// //                         <span class="text-[10px]" [style.color]="'var(--theme-text-label)'">{{ stock.sku }}</span>
// //                       </div>
// //                     </td>
// //                     <td class="text-right font-mono font-bold">{{ stock.stockQuantity }}</td>
// //                     <td class="text-right font-bold tabular-nums text-rose-400">₹{{ stock.value | number }}</td>
// //                     <td class="text-center">
// //                       <p-button icon="pi pi-percentage" [text]="true" severity="danger" pTooltip="Mark for Sale" size="small"></p-button>
// //                     </td>
// //                   </tr>
// //                 </ng-template>
// //               </p-table>
// //             </div>
// //           </div>

// //           <div class="lg:col-span-4 space-y-6">
// //             <div class="p-6 border" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //                <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Asset Efficiency</h4>
// //                <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="mb-4">Total capital locked in non-moving stock:</p>
// //                <div class="mb-6">
// //                  <p class="text-3xl font-bold tabular-nums text-rose-500">₹2.8M</p>
// //                  <p class="text-[10px] font-bold text-rose-400/60 uppercase">High Risk Exposure</p>
// //                </div>
// //                <p-button label="Liquidate Strategy" severity="danger" [fluid]="true" size="small"></p-button>
// //             </div>

// //             <div class="p-5 border border-dashed" 
// //                  [style.background]="'rgba(96, 165, 250, 0.05)'" [style.border-color]="'var(--theme-info)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //               <div class="flex gap-3">
// //                 <i class="pi pi-info-circle text-blue-400 mt-1"></i>
// //                 <div>
// //                   <p class="font-bold" [style.color]="'var(--theme-info)'" [style.font-size]="'var(--font-size-sm)'">Stock Rotation Tip</p>
// //                   <p class="mt-1 leading-relaxed" [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
// //                     <span class="text-white font-bold">MI Smart TV 32 Inch</span> has 150 units in dead stock. Consider a bundle offer with high-margin Soundbars to clear space.
// //                   </p>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>

// //       </ng-container>

// //       <ng-template #loader>
// //         <div class="h-[50vh] flex flex-col items-center justify-center gap-4">
// //           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
// //           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">Auditing product performance...</p>
// //         </div>
// //       </ng-template>

// //     </div>
// //   `,
// //   styles: [`
// //     :host ::ng-deep .p-datatable .p-datatable-tbody > tr {
// //       background: transparent !important;
// //       border-bottom: 1px solid var(--theme-border-primary) !important;
// //     }
// //     :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
// //       padding: 0.85rem 1rem;
// //       font-size: 10px;
// //       font-weight: 700;
// //       text-transform: uppercase;
// //       border: none !important;
// //     }
// //   `]
// // })
// // export class ProductPerformanceComponent implements OnInit {
// //   performanceData = signal<any>(null);
// //   loading = signal<boolean>(true);

// //   constructor(private analyticsService: AdminAnalyticsService) {}

// //   ngOnInit() {
// //     this.loadData();
// //   }

// //   loadData() {
// //     this.loading.set(true);
// //     this.analyticsService.getProductPerformance().subscribe({
// //       next: (res) => {
// //         if (res.status === 'success') {
// //           this.performanceData.set(res.data);
// //         }
// //         this.loading.set(false);
// //       },
// //       error: () => this.loading.set(false)
// //     });
// //   }
// // }