import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AvatarModule } from 'primeng/avatar';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';

interface StaffPerformance {
  _id: string;
  name: string;
  email: string;
  totalSales: number;
  invoiceCount: number;
  totalDiscountGiven: number;
  avgTicketSize: number;
}

@Component({
  selector: 'app-staff-performance-analysis',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TooltipModule, ProgressSpinnerModule, AvatarModule],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <div class="mb-8 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 class="font-bold tracking-tight mb-1" 
              [style.color]="'var(--theme-text-primary)'"
              [style.font-family]="'var(--font-heading)'"
              [style.font-size]="'var(--font-size-2xl)'">Staff Performance</h2>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
            Detailed revenue contribution and sales efficiency metrics per associate
          </p>
        </div>
        <div class="flex items-center gap-2">
           <p-button label="Filters" icon="pi pi-filter" severity="secondary" [outlined]="true" size="small"></p-button>
           <p-button label="Download CSV" icon="pi pi-download" [text]="true" size="small"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="p-6 border transition-all" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Total Team Sales</p>
            <h2 class="text-3xl font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">₹{{ totalRevenue() | number }}</h2>
            <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Across {{ staffData().length }} sales associates</p>
          </div>

          <div class="p-6 border relative overflow-hidden transition-all border-l-4" 
               [style.background]="'var(--theme-bg-secondary)'" 
               [style.border-color]="'var(--theme-border-primary)'"
               [style.border-left-color]="'var(--theme-accent-primary)'"
               [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-3" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">MVP of the Period</p>
            <div class="flex items-center gap-4">
               <div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" [style.background]="'var(--theme-accent-gradient)'">
                 {{ commonService.getInitials(staffData()[0]?.name || 'U') }}
               </div>
               <div>
                 <h3 class="font-bold text-white leading-tight">{{ staffData()[0]?.name }}</h3>
                 <p class="text-emerald-500 font-bold tabular-nums" [style.font-size]="'var(--font-size-md)'">₹{{ staffData()[0]?.totalSales | number }}</p>
               </div>
            </div>
            <i class="pi pi-bolt absolute right-2 bottom-2 text-4xl opacity-5 text-white"></i>
          </div>

          <div class="p-6 border transition-all" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Avg Ticket Size</p>
            <h2 class="text-3xl font-bold tabular-nums" [style.color]="'var(--theme-info)'">₹{{ avgTicketSize() | number:'1.0-0' }}</h2>
            <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Network-wide average per invoice</p>
          </div>
        </div>

        <div class="border overflow-hidden shadow-sm" 
             [style.background]="'var(--theme-bg-secondary)'" 
             [style.border-color]="'var(--theme-border-primary)'" 
             [style.border-radius]="'var(--ui-border-radius-xl)'">
          
          <div class="p-4 border-b flex justify-between items-center" 
               [style.border-color]="'var(--theme-border-primary)'" 
               [style.background]="'var(--theme-bg-ternary)'">
            <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Performance Breakdown</h3>
            <span class="text-[10px] font-bold" [style.color]="'var(--theme-text-label)'">SYNCED: {{ meta()?.timestamp | date:'shortTime' }}</span>
          </div>

          <p-table [value]="staffData()" styleClass="p-datatable-sm" [responsiveLayout]="'scroll'">
            <ng-template pTemplate="header">
              <tr>
                <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'">Associate</th>
                <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Invoices</th>
                <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Total Discount</th>
                <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Avg Ticket</th>
                <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Revenue</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-staff let-i="rowIndex">
              <tr [style.color]="'var(--theme-text-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[10px]" 
                         [style.background]="'var(--theme-bg-ternary)'"
                         [style.border]="'1px solid var(--theme-border-secondary)'">
                      <span [style.color]="'var(--theme-accent-primary)'">{{ commonService.getInitials(staff.name) }}</span>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold text-white">{{ staff.name }}</span>
                      <span class="text-[10px]" [style.color]="'var(--theme-text-label)'">{{ staff.email }}</span>
                    </div>
                  </div>
                </td>
                <td class="text-right font-mono font-bold">{{ staff.invoiceCount }}</td>
                <td class="text-right">
                   <span class="tabular-nums" [style.color]="staff.totalDiscountGiven > 0 ? 'var(--theme-error)' : 'var(--theme-text-tertiary)'">
                     ₹{{ staff.totalDiscountGiven | number }}
                   </span>
                </td>
                <td class="text-right font-bold tabular-nums" [style.color]="'var(--theme-info)'">₹{{ staff.avgTicketSize | number }}</td>
                <td class="text-right">
                  <span class="font-bold tabular-nums text-emerald-500" [style.font-size]="'var(--font-size-md)'">₹{{ staff.totalSales | number }}</span>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <div class="mt-6 p-4 border border-dashed rounded-lg flex items-start gap-4"
             [style.border-color]="'var(--theme-accent-primary)'"
             [style.background]="'rgba(139, 92, 246, 0.03)'">
          <i class="pi pi-chart-line text-indigo-400 mt-1"></i>
          <div>
            <p class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">Associate Optimization</p>
            <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
              <span class="text-white font-bold">{{ staffData()[0]?.name }}</span> is maintaining an Average Ticket Size of 
              <span class="text-indigo-400 font-bold">₹{{ staffData()[0]?.avgTicketSize | number }}</span>. 
              Review their cross-selling techniques to implement across the rest of the team.
            </p>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Aggregating Sales Force Data...</p>
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
export class StaffPerformanceAnalysisComponent implements OnInit {
  staffData = signal<StaffPerformance[]>([]);
  meta = signal<any>(null);
  loading = signal<boolean>(true);

  // Computed Totals
  totalRevenue = computed(() => this.staffData().reduce((acc, s) => acc + s.totalSales, 0));
  avgTicketSize = computed(() => {
    const total = this.staffData().reduce((acc, s) => acc + s.avgTicketSize, 0);
    return this.staffData().length ? total / this.staffData().length : 0;
  });

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getStaffPerformance().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.staffData.set(res.data);
          this.meta.set(res.meta);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}