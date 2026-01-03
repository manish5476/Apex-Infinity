import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { AdminAnalyticsService } from '../admin-analytics.service';

interface DeadStockItem {
  _id: string;
  name: string;
  sku: string;
  quantity: number;
  value: number;
  daysInactive: number;
}

@Component({
  selector: 'app-dead-stock-analysis',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, ProgressSpinnerModule, TooltipModule, TagModule],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <div class="mb-8 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 class="font-bold tracking-tight mb-1" 
              [style.color]="'var(--theme-text-primary)'"
              [style.font-family]="'var(--font-heading)'"
              [style.font-size]="'var(--font-size-2xl)'">Dead Stock Audit</h2>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
            Identifying inventory with zero movement for over 90 days
          </p>
        </div>
        <div class="flex items-center gap-2">
           <p-button label="Export Report" icon="pi pi-file-pdf" severity="secondary" [outlined]="true" size="small"></p-button>
           <p-button label="Clear Inventory" icon="pi pi-bolt" severity="danger" size="small"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="p-6 border relative overflow-hidden transition-all" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Capital Locked</p>
            <h2 class="text-3xl font-bold tabular-nums" [style.color]="'var(--theme-error)'">₹{{ totalValueLocked() | number }}</h2>
            <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Across {{ deadStock().length }} Unique SKUs</p>
            <div class="absolute bottom-0 right-0 p-2 opacity-10">
              <i class="pi pi-lock text-6xl"></i>
            </div>
          </div>

          <div class="p-6 border transition-all" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Non-Moving Units</p>
            <h2 class="text-3xl font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">{{ totalUnits() | number }}</h2>
            <p class="mt-2 text-amber-500 font-bold" [style.font-size]="'var(--font-size-xs)'">90+ Days of Inactivity</p>
          </div>

          <div class="p-6 border" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Highest Single Risk</p>
            <h3 class="font-bold truncate" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-md)'">{{ deadStock()[0]?.name }}</h3>
            <div class="flex justify-between items-end mt-2">
               <span class="font-bold text-rose-400 tabular-nums">₹{{ deadStock()[0]?.value | number }}</span>
               <span class="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20 uppercase">Critical</span>
            </div>
          </div>
        </div>

        <div class="border overflow-hidden shadow-sm" 
             [style.background]="'var(--theme-bg-secondary)'" 
             [style.border-color]="'var(--theme-border-primary)'" 
             [style.border-radius]="'var(--ui-border-radius-xl)'">
          
          <div class="p-4 border-b flex justify-between items-center" 
               [style.border-color]="'var(--theme-border-primary)'" 
               [style.background]="'var(--theme-bg-ternary)'">
            <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Inventory Liquidation Priority</h3>
            <span class="text-[10px] font-bold" [style.color]="'var(--theme-text-label)'">SORTED BY CAPITAL VALUE</span>
          </div>

          <p-table [value]="deadStock()" [paginator]="true" [rows]="10" styleClass="p-datatable-sm" [responsiveLayout]="'scroll'">
            <ng-template pTemplate="header">
              <tr>
                <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'">Product Detail</th>
                <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Qty</th>
                <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Value Locked</th>
                <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-center">Days Idle</th>
                <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-center">Strategy</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr [style.color]="'var(--theme-text-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
                <td>
                  <div class="flex flex-col">
                    <span class="font-bold text-white">{{ item.name }}</span>
                    <span class="text-[10px] font-mono" [style.color]="'var(--theme-text-label)'">{{ item.sku }}</span>
                  </div>
                </td>
                <td class="text-right font-mono font-bold">{{ item.quantity }}</td>
                <td class="text-right font-bold tabular-nums" [style.color]="item.value > 2000000 ? 'var(--theme-error)' : 'var(--theme-text-primary)'">
                  ₹{{ item.value | number }}
                </td>
                <td class="text-center font-bold tabular-nums" [style.color]="'var(--theme-warning)'">{{ item.daysInactive }}</td>
                <td class="text-center">
                  <div class="flex justify-center gap-1">
                    <p-button icon="pi pi-tag" [text]="true" severity="info" pTooltip="Flash Sale" size="small"></p-button>
                    <p-button icon="pi pi-arrow-right-arrow-left" [text]="true" severity="warn" pTooltip="Branch Transfer" size="small"></p-button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <div class="mt-6 p-4 border border-dashed rounded-lg flex items-start gap-4"
             [style.border-color]="'var(--theme-border-secondary)'"
             [style.background]="'rgba(244, 63, 94, 0.03)'">
          <i class="pi pi-exclamation-circle text-rose-500 mt-1"></i>
          <div>
            <p class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">Liquidation Notice</p>
            <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
              Inventory worth <span class="font-bold text-rose-400">₹{{ totalValueLocked() | number }}</span> has exceeded the 90-day threshold. 
              We recommend a 15% markdown or bundled promotion for the <span class="text-white font-bold">{{ deadStock()[0]?.name }}</span> and other high-value SKUs to free up warehouse space.
            </p>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Auditing Stock Lifecycle...</p>
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
export class DeadStockAnalysisComponent implements OnInit {
  deadStock = signal<DeadStockItem[]>([]);
  loading = signal<boolean>(true);

  // Computed totals for the KPI cards
  totalValueLocked = computed(() => this.deadStock().reduce((acc, item) => acc + item.value, 0));
  totalUnits = computed(() => this.deadStock().reduce((acc, item) => acc + item.quantity, 0));

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getDeadStockReport().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.deadStock.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}