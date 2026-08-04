import {
  Component, OnInit, signal, computed,
  ChangeDetectorRef, inject, ChangeDetectionStrategy, OnDestroy
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';

import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { MasterListService } from '../../core/services/master-list.service';
import { DataGridComponent, GridColumn } from '../../shared/ui/grid';
import { MasterDropdownComponent } from '../../modules/shared/components/masterFilterDropdown/master-dropdown.component';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

// Shared UI Components
import { PageComponent } from '../../shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '../../shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '../../shared/ui/layout/page-content/page-content.component';
import { PageToolbarComponent } from '../../shared/ui/layout/page-toolbar/page-toolbar.component';
import { SectionComponent } from '../../shared/ui/layout/section/section.component';
import { BentoGridComponent, BentoItemComponent } from '../../shared/ui/layout/bento-grid.component';
import { StatCardComponent } from '../../shared/ui/data/stat-card.component';
import { GlassCardComponent } from '../../shared/ui/data/glass-card.component';
import { CardComponent } from '../../shared/ui/data/card/card.component';
import { GradientBannerComponent } from '../../shared/ui/data/gradient-banner.component';
import { StatusBadgeComponent } from '../../shared/ui/badge/status-badge.component';
import { ButtonComponent } from '../../shared/ui/form/button.component';
import { LoadingComponent } from '../../shared/ui/feedback/loading/loading.component';
import { AvatarComponent } from '../../shared/ui/media/avatar.component';
import { WidgetRailComponent } from '@shared/ui/layout/widget-rail.component';
import { DataListComponent } from '../../shared/ui/data/list/data-list.component';
import { DataListRowComponent } from '../../shared/ui/data/list/data-list-row.component';
import { DataListCardComponent } from '../../shared/ui/data/list/data-list-card.component';

@Component({
  selector: 'app-admin-dashboard-ui',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    TooltipModule, SelectModule, DatePicker,
    DataGridComponent, MasterDropdownComponent,
    PageComponent, PageHeaderComponent, PageContentComponent,
    WidgetRailComponent,
    StatCardComponent, CardComponent,
    DataListComponent, DataListRowComponent, DataListCardComponent,
    StatusBadgeComponent, ButtonComponent, LoadingComponent, AvatarComponent,
    BentoGridComponent, BentoItemComponent
  ],
  template: `
<app-page>
  <app-page-header title="Executive Dashboard" density="compact">
    <div class="flex items-end gap-4 compact-toolbar">
      
      <!-- Branch Selector -->
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">Branch</label>
        <app-master-dropdown
          endpoint="branches"
          [(ngModel)]="selectedBranch"
          (onChange)="onFilterChange()"
          placeholder="All branches"
          class="w-[220px]">
        </app-master-dropdown>
      </div>

      <!-- Period Selector -->
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">Period</label>
        <p-datepicker
          [(ngModel)]="dateRange"
          selectionMode="range"
          [showIcon]="true"
          (onSelect)="onFilterChange()"
          placeholder="Start – End"
          styleClass="w-[260px]">
        </p-datepicker>
      </div>
      
      <!-- Refresh Button -->
      <div class="flex items-center h-[36px]">
         <app-button 
            variant="secondary" 
            size="sm" 
            [icon]="loading() ? 'pi pi-refresh spin' : 'pi pi-refresh'" 
            (onClick)="loadDashboard()" 
            [disabled]="loading()" 
            pTooltip="Refresh data">
         </app-button>
      </div>
    </div>
  </app-page-header>

  <app-page-content density="compact">
    @if (loading()) {
      <div class="py-16 flex justify-center">
        <app-loading text="Synchronising dashboard data..."></app-loading>
      </div>
    }

    @if (!loading() && dashboard()) {
      <!-- Reduced the massive 3xl gap to a more professional spacing-lg/xl -->
      <div class="flex flex-col gap-[var(--spacing-xl)] pb-10 mt-2">
        
        <!-- Alerts Ribbon (Made it full width and sleeker) -->
        @if ((dashboard()!.alerts.lowStockCount ?? 0) > 0) {
          <div class="flex items-center gap-4 p-4 rounded-[var(--ui-border-radius-md)] bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] text-[var(--color-warning-dark)] shadow-sm w-full">
            <i class="pi pi-exclamation-triangle text-xl"></i>
            <span class="text-[length:var(--font-size-sm)]">
              <strong class="font-bold">{{ dashboard()!.alerts.lowStockCount }} items</strong> below reorder level — action required to prevent stockouts.
            </span>
          </div>
        }

        <!-- Top KPIs -->
        <app-widget-rail gap="var(--spacing-md)" cardWidth="min(280px, 85vw)">
            <app-stat-card 
              label="Gross Revenue" 
              density="compact" [accent]="true" shadow="sm" variant="primary"
              [value]="'₹' + (dashboard()!.financial.totalRevenue.value | number)"
              [change]="dashboard()!.financial.totalRevenue.growth != null ? dashboard()!.financial.totalRevenue.growth + '%' : undefined"
              trend="up"
              [description]="(dashboard()!.financial.totalRevenue.count | number) + ' transaction(s)'">
            </app-stat-card>
          
            <app-stat-card 
              label="Net Profit" 
              density="compact" [accent]="true" shadow="sm"
              [value]="'₹' + (dashboard()!.financial.netProfit.value | number)"
              [change]="dashboard()!.financial.netProfit.status"
              [trend]="dashboard()!.financial.netProfit.status === 'profitable' ? 'up' : 'down'"
              [variant]="dashboard()!.financial.netProfit.status === 'profitable' ? 'success' : 'error'"
              [description]="'Margin: ' + dashboard()!.financial.netProfit.margin + '%'">
              <div sparkline class="w-full h-1.5 bg-[var(--border-secondary)] rounded-full mt-3 overflow-hidden">
                <div class="h-full bg-[var(--color-success)]" [style.width.%]="dashboard()!.financial.netProfit.margin"></div>
              </div>
            </app-stat-card>

            <app-stat-card 
              label="Inventory Value" 
              icon="pi pi-box"
              density="compact" [accent]="true" shadow="sm" variant="info"
              [value]="'₹' + (dashboard()!.inventory.summary.valuation | number:'1.0-0')"
              [description]="(dashboard()!.inventory.inventoryValuation.totalItems | number) + ' items · ' + (dashboard()!.inventory.inventoryValuation.productCount | number) + ' SKUs'">
               <div sparkline class="w-full h-1.5 bg-[var(--border-secondary)] rounded-full mt-3 overflow-hidden">
                 <div class="h-full bg-[var(--color-info)]" [style.width.%]="dashboard()!.inventory.healthScore"></div>
               </div>
            </app-stat-card>

             <app-stat-card 
              label="Outstanding Debt" 
              icon="pi pi-exclamation-circle"
              variant="error"
              density="compact" [accent]="true" shadow="sm"
              [value]="'₹' + (dashboard()!.financial.outstanding.receivables | number)"
              [description]="dashboard()!.alerts.highRiskDebtCount + ' high-risk account(s)'">
            </app-stat-card>

          @if (dashboard()!.inventory.healthScore != null) {
               <app-stat-card 
                label="System Health" 
                icon="pi pi-heart"
                density="compact" [accent]="true" shadow="sm" variant="success"
                [value]="dashboard()!.inventory.healthScore + '%'"
                [description]="dashboard()!.inventory.summary.criticalAlerts + ' critical alerts'">
               </app-stat-card>
          }
        </app-widget-rail>

        <!-- Bento Grid Dashboard -->
        <app-bento-grid layout="analytics" density="comfortable">
          
          <!-- AI Insights (Changed size to lg to take up 2/3 of the row) -->
          <app-bento-item size="lg" priority="high">
            <app-card class="h-full flex flex-col block">
              <div class="flex flex-col lg:flex-row gap-6 h-full p-2">
                <!-- Left: Title & Badge -->
                <div class="flex flex-col gap-3 lg:w-1/3 shrink-0 lg:border-r lg:border-[var(--border-secondary)] pr-4">
                  <h3 class="text-[length:var(--font-size-lg)] font-bold text-[var(--text-primary)] m-0 tracking-tight">
                    AI Business Insights
                  </h3>
                  <div>
                    <app-status-badge status="info" variant="subtle" size="sm" [label]="dashboard()!.insights.count + ' insights generated'"></app-status-badge>
                  </div>
                  <p class="text-[length:var(--font-size-sm)] text-[var(--text-tertiary)] mt-2 hidden lg:block">
                    Automated analysis of your inventory, margins, and sales velocity.
                  </p>
                </div>
                
                <!-- Right: Insights Message -->
                <div class="flex-1 w-full flex flex-col gap-3 justify-center">
                  @for (insight of dashboard()!.insights.insights; track insight.title) {
                    <div class="p-4 rounded-[var(--ui-border-radius-md)] flex items-start gap-4 border border-black/5"
                      [class.bg-[var(--color-success-bg)]]="insight.type === 'positive'"
                      [class.bg-[var(--color-warning-bg)]]="insight.type === 'warning'"
                      [class.bg-[var(--color-info-bg)]]="insight.type === 'info'">
                      
                      <i class="pi text-xl mt-0.5"
                         [class.pi-check-circle]="insight.type === 'positive'"
                         [class.pi-exclamation-triangle]="insight.type === 'warning'"
                         [class.pi-info-circle]="insight.type === 'info'"
                         [class.text-[var(--color-success)]]="insight.type === 'positive'"
                         [class.text-[var(--color-warning)]]="insight.type === 'warning'"
                         [class.text-[var(--color-info)]]="insight.type === 'info'"></i>
                         
                      <div class="flex-1 flex flex-col gap-1.5">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-[var(--text-primary)] text-[length:var(--font-size-md)] tracking-tight">{{ insight.title }}</span>
                          <app-status-badge [status]="insight.priority === 'high' ? 'error' : 'neutral'" size="sm" [label]="insight.priority | uppercase"></app-status-badge>
                        </div>
                        <span class="text-[var(--text-secondary)] text-[length:var(--font-size-sm)] leading-relaxed">{{ insight.message }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </app-card>
          </app-bento-item>

          <!-- Operations (Takes up remaining 1/3 of the row) -->
          <app-bento-item size="sm">
            <app-data-list title="Operations Margin" icon="pi pi-cog" maxHeight="100%" class="h-full block">
                @for (cat of dashboard()!.topCategories; track cat.name) {
                  <div class="py-4 first:pt-2 last:pb-2 flex flex-col justify-between gap-4 border-b border-[var(--border-secondary)] last:border-0">
                    
                    <!-- Category Name & Margin -->
                    <div class="w-full flex justify-between items-end">
                      <div class="font-bold text-[length:var(--font-size-md)] text-[var(--text-primary)] tracking-tight">{{ cat.name }}</div>
                      <div class="text-[length:var(--font-size-xs)] text-[var(--text-tertiary)] font-semibold bg-[var(--bg-secondary)] px-2 py-0.5 rounded">{{ cat.margin | number:'1.1-1' }}% margin</div>
                    </div>
                    
                    <!-- Progress Bars (Stacked cleanly for small widget) -->
                    <div class="w-full flex flex-col gap-3">
                       <!-- Revenue Bar -->
                       <div class="flex-1 flex flex-col gap-1">
                         <div class="flex justify-between items-end text-[length:var(--font-size-xs)]">
                           <span class="text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-[10px]">Revenue</span>
                           <span class="font-bold text-[var(--text-primary)]">₹{{ cat.revenue | number:'1.0-0' }}</span>
                         </div>
                         <div class="w-full h-1.5 bg-[var(--bg-ternary)] rounded-full overflow-hidden">
                            <div class="h-full bg-[var(--accent-primary)] rounded-full" style="width:100%"></div>
                         </div>
                       </div>
                       
                       <!-- Profit Bar -->
                       <div class="flex-1 flex flex-col gap-1">
                         <div class="flex justify-between items-end text-[length:var(--font-size-xs)]">
                           <span class="text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-[10px]">Profit</span>
                           <span class="font-bold text-[var(--color-success)]">₹{{ cat.profit | number:'1.0-0' }}</span>
                         </div>
                         <div class="w-full h-1.5 bg-[var(--bg-ternary)] rounded-full overflow-hidden">
                            <div class="h-full bg-[var(--color-success)] rounded-full transition-all duration-500" [style.width.%]="(cat.profit / cat.revenue) * 100"></div>
                         </div>
                       </div>
                    </div>
                  </div>
                }
            </app-data-list>
          </app-bento-item>

          <!-- Stock Urgency Grid (Full width xl) -->
          <app-bento-item size="xl">
            <app-card title="Stock Urgency Monitor">
                 <ng-container ngProjectAs="[card-actions]">
                    <div class="flex items-center gap-3">
                      <app-status-badge status="error" variant="solid" [label]="dashboard()!.inventory.lowStockAlerts.length + ' Critical'"></app-status-badge>
                      <app-button variant="secondary" size="sm" icon="pi pi-file-excel" label="Export"></app-button>
                    </div>
                 </ng-container>
                 <div class="rounded-[var(--ui-border-radius-md)] border border-[var(--border-secondary)] overflow-hidden relative h-[380px] flex flex-col mt-2">
                   <app-data-grid [viewOnly]="true" [pagination]="true" [toolbar]="false" 
                    [columns]="alertColumns"
                    [data]="dashboard()!.inventory.lowStockAlerts">
                   </app-data-grid>
                 </div>
            </app-card>
          </app-bento-item>

          <!-- Bottom Row: 3 Equal Columns (sm + sm + sm) -->
          
          <!-- Top Products -->
          @if (dashboard()!.leaders.topProducts?.length) {
            <app-bento-item size="sm">
              <app-data-list title="Top Products" icon="pi pi-star" variant="spaced" maxHeight="100%">
                  @for (prod of dashboard()!.leaders.topProducts; track prod._id; let i = $index) {
                    <app-data-list-card [title]="prod.name" [subtitle]="(prod.soldQty | number) + ' sold · ₹' + (prod.profit | number:'1.0-0') + ' profit'">
                       <div leading class="font-bold text-[var(--text-tertiary)] text-[length:var(--font-size-md)] w-6 text-center">#{{ i + 1 }}</div>
                       <div trailing class="font-bold text-[var(--text-primary)]">₹{{ prod.revenue | number:'1.0-0' }}</div>
                    </app-data-list-card>
                  }
              </app-data-list>
            </app-bento-item>
          }

          <!-- Top Customers -->
          @if (dashboard()!.leaders.topCustomers?.length) {
            <app-bento-item size="sm">
              <app-data-list title="Top Customers" icon="pi pi-users" variant="spaced" maxHeight="100%">
                  @for (cust of dashboard()!.leaders.topCustomers; track cust._id; let i = $index) {
                    <app-data-list-card [title]="cust.name" [subtitle]="(cust.transactions | number) + ' transaction(s)'">
                       <div leading><app-avatar [name]="cust.name" size="sm"></app-avatar></div>
                       <div trailing class="font-bold text-[var(--color-success)]">₹{{ cust.totalSpent | number:'1.0-0' }}</div>
                    </app-data-list-card>
                  }
              </app-data-list>
            </app-bento-item>
          }
          
          <!-- Top Staff -->
          @if (dashboard()!.operations.topStaff?.length) {
             <app-bento-item size="sm">
                <app-data-list title="Top Staff" icon="pi pi-id-card" variant="spaced" maxHeight="100%">
                    @for (staff of dashboard()!.operations.topStaff; track staff._id) {
                      <app-data-list-card [title]="staff.name" [subtitle]="(staff.count | number) + ' order(s)'">
                         <div leading><app-avatar [name]="staff.name" size="sm"></app-avatar></div>
                         <div trailing class="font-bold text-[var(--color-success)]">₹{{ staff.revenue | number:'1.0-0' }}</div>
                      </app-data-list-card>
                    }
                </app-data-list>
             </app-bento-item>
          }
          
        </app-bento-grid>
      </div>
    }
  </app-page-content>
</app-page>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    
    .spin { animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    /* Toolbar Alignment & Sizes */
    .compact-toolbar {
      ::ng-deep .master-dropdown__control.p-select,
      ::ng-deep .master-dropdown__control.p-multiselect {
        min-height: 36px;
        height: 36px;
        border-radius: var(--ui-border-radius-md);
      }
      ::ng-deep .master-dropdown__control .p-select-label {
        padding: 0.35rem 0.75rem;
        font-size: 0.875rem;
      }
      ::ng-deep .p-datepicker-input {
        padding: 0.35rem 0.75rem;
        font-size: 0.875rem;
        height: 36px;
        border-radius: var(--ui-border-radius-md);
      }
      ::ng-deep .p-datepicker-trigger {
        width: 36px;
        height: 36px;
        border-top-right-radius: var(--ui-border-radius-md);
        border-bottom-right-radius: var(--ui-border-radius-md);
      }
      ::ng-deep .p-button.p-button-icon-only {
        width: 36px;
        height: 36px;
        padding: 0;
      }
    }
  `]
})
export class AdminDashboardUiComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  dashboard = signal<any>(null);
  loading = signal(true);

  masterList = inject(MasterListService);

  selectedBranch = '';
  dateRange: Date[] | null = null;
  alertColumns: any[] = [];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.setupColumns();
    this.loadDashboard();
  }

  setupColumns(): void {
    this.alertColumns = [
      {
        field: 'name',
        headerName: 'Item',
        flex: 2,
        cellStyle: { 'font-weight': '600', 'font-size': 'var(--font-size-sm)' }
      },
      {
        field: 'sku',
        headerName: 'SKU',
        flex: 1,
        cellStyle: { 'font-family': 'var(--font-mono)', 'font-size': 'var(--font-size-xs)', 'color': 'var(--text-tertiary)' }
      },
      {
        field: 'currentStock',
        headerName: 'Stock',
        flex: 1,
        cellStyle: (p: any) => ({
          'color': p.value === 0 ? 'var(--color-error)' : 'var(--color-warning-dark)',
          'font-weight': '700',
          'font-family': 'var(--font-mono)',
          'font-size': 'var(--font-size-sm)'
        })
      },
      {
        field: 'reorderLevel',
        headerName: 'Reorder',
        flex: 1,
        cellStyle: { 'color': 'var(--text-tertiary)', 'font-size': 'var(--font-size-sm)' }
      },
      {
        field: 'urgency',
        headerName: 'Urgency',
        flex: 1,
        cellRenderer: (p: any) =>
          `<span style="
            display:inline-flex; align-items:center;
            font-size: 0.65rem; font-weight: 700;
            text-transform:uppercase; letter-spacing:0.05em;
            padding:3px 8px; border-radius: 9999px;
            background:var(--color-error-bg); color:var(--color-error);
            border:1px solid var(--color-error-border);
          ">${p.value}</span>`
      }
    ];
    this.cdr.detectChanges();
  }

  loadDashboard(): void {
    this.loading.set(true);

    let start: string | undefined;
    let end: string | undefined;

    if (this.dateRange?.length === 2) {
      start = this.dateRange[0]?.toISOString();
      end = this.dateRange[1]?.toISOString();
    }

    this.analyticsService.getDashboardOverview(start, end, this.selectedBranch)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.dashboard.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  onFilterChange(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}// import {
//   Component, OnInit, signal, computed,
//   ChangeDetectorRef, inject, ChangeDetectionStrategy, OnDestroy
// } from '@angular/core';
// import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { TooltipModule } from 'primeng/tooltip';
// import { SelectModule } from 'primeng/select';
// import { DatePicker } from 'primeng/datepicker';

// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { MasterListService } from '../../core/services/master-list.service';
// import { DataGridComponent, GridColumn } from '../../shared/ui/grid';
// import { MasterDropdownComponent } from '../../modules/shared/components/masterFilterDropdown/master-dropdown.component';
// import { Subject } from "rxjs";
// import { takeUntil } from "rxjs/operators";

// // Shared UI Components
// import { PageComponent } from '../../shared/ui/layout/page/page.component';
// import { PageHeaderComponent } from '../../shared/ui/layout/page-header/page-header.component';
// import { PageContentComponent } from '../../shared/ui/layout/page-content/page-content.component';
// import { PageToolbarComponent } from '../../shared/ui/layout/page-toolbar/page-toolbar.component';
// import { SectionComponent } from '../../shared/ui/layout/section/section.component';
// import { BentoGridComponent, BentoItemComponent } from '../../shared/ui/layout/bento-grid.component';
// import { StatCardComponent } from '../../shared/ui/data/stat-card.component';
// import { GlassCardComponent } from '../../shared/ui/data/glass-card.component';
// import { CardComponent } from '../../shared/ui/data/card/card.component';
// import { GradientBannerComponent } from '../../shared/ui/data/gradient-banner.component';
// import { StatusBadgeComponent } from '../../shared/ui/badge/status-badge.component';
// import { ButtonComponent } from '../../shared/ui/form/button.component';
// import { LoadingComponent } from '../../shared/ui/feedback/loading/loading.component';
// import { AvatarComponent } from '../../shared/ui/media/avatar.component';
// import { WidgetRailComponent } from '@shared/ui/layout/widget-rail.component';
// import { DataListComponent } from '../../shared/ui/data/list/data-list.component';
// import { DataListRowComponent } from '../../shared/ui/data/list/data-list-row.component';
// import { DataListCardComponent } from '../../shared/ui/data/list/data-list-card.component';

// @Component({
//   selector: 'app-admin-dashboard-ui',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   imports: [
//     CommonModule, FormsModule,
//     TooltipModule, SelectModule, DatePicker,
//     DataGridComponent, MasterDropdownComponent,
//     PageComponent, PageHeaderComponent, PageContentComponent,
//     WidgetRailComponent,
//     StatCardComponent, CardComponent,
//     DataListComponent, DataListRowComponent, DataListCardComponent,
//     StatusBadgeComponent, ButtonComponent, LoadingComponent, AvatarComponent,
//     BentoGridComponent, BentoItemComponent
//   ],
//   template: `
// <app-page>
//   <app-page-header title="Executive Dashboard" density="compact">
//     <div class="flex items-end gap-4 compact-toolbar">
//       <!-- Branch Selector -->
//       <div class="flex flex-col gap-1.5">
//         <label class="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Branch</label>
//         <app-master-dropdown
//           endpoint="branches"
//           [(ngModel)]="selectedBranch"
//           (onChange)="onFilterChange()"
//           placeholder="All branches"
//           class="w-[200px]">
//         </app-master-dropdown>
//       </div>

//       <!-- Period Selector -->
//       <div class="flex flex-col gap-1.5">
//         <label class="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Period</label>
//         <p-datepicker
//           [(ngModel)]="dateRange"
//           selectionMode="range"
//           [showIcon]="true"
//           (onSelect)="onFilterChange()"
//           placeholder="Start – End"
//           styleClass="w-[240px]">
//         </p-datepicker>
//       </div>
      
//       <!-- Refresh Button -->
//       <div class="flex items-center h-[36px]">
//          <app-button 
//             variant="secondary" 
//             size="sm" 
//             [icon]="loading() ? 'pi pi-refresh spin' : 'pi pi-refresh'" 
//             (onClick)="loadDashboard()" 
//             [disabled]="loading()" 
//             pTooltip="Refresh data">
//          </app-button>
//       </div>
//     </div>
//   </app-page-header>

//   <app-page-content density="compact">
//     @if (loading()) {
//       <div class="py-12">
//         <app-loading text="Synchronising data..."></app-loading>
//       </div>
//     }

//     @if (!loading() && dashboard()) {
//       <div class="flex flex-col gap-[var(--spacing-3xl)] pb-8">
        
//         <!-- Alerts Ribbon -->
//         @if ((dashboard()!.alerts.lowStockCount ?? 0) > 0) {
//           <div class="flex items-center gap-3 p-[var(--spacing-md)] rounded-[var(--ui-border-radius-lg)] bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] text-[var(--color-warning)] text-[length:var(--font-size-sm)] shadow-sm">
//             <i class="pi pi-exclamation-triangle"></i>
//             <span><strong>{{ dashboard()!.alerts.lowStockCount }} items</strong> below reorder level — action required to prevent stockouts.</span>
//           </div>
//         }

//         <!-- Top KPIs -->
//         <app-widget-rail gap="var(--spacing-lg)" cardWidth="min(320px, 85vw)">
//             <app-stat-card 
//               label="Gross Revenue" 
//               density="compact" [accent]="true" shadow="md" variant="primary"
//               [value]="'₹' + (dashboard()!.financial.totalRevenue.value | number)"
//               [change]="dashboard()!.financial.totalRevenue.growth != null ? dashboard()!.financial.totalRevenue.growth + '%' : undefined"
//               trend="up"
//               [description]="(dashboard()!.financial.totalRevenue.count | number) + ' transaction(s)'">
//             </app-stat-card>
          
//             <app-stat-card 
//               label="Net Profit" 
//               density="compact" [accent]="true" shadow="md"
//               [value]="'₹' + (dashboard()!.financial.netProfit.value | number)"
//               [change]="dashboard()!.financial.netProfit.status"
//               [trend]="dashboard()!.financial.netProfit.status === 'profitable' ? 'up' : 'down'"
//               [variant]="dashboard()!.financial.netProfit.status === 'profitable' ? 'success' : 'error'"
//               [description]="'Margin: ' + dashboard()!.financial.netProfit.margin + '%'">
//               <div sparkline class="w-full h-1 bg-[var(--border-secondary)] rounded-full mt-4 overflow-hidden">
//                 <div class="h-full bg-[var(--color-success)]" [style.width.%]="dashboard()!.financial.netProfit.margin"></div>
//               </div>
//             </app-stat-card>

//             <app-stat-card 
//               label="Inventory Value" 
//               icon="pi pi-box"
//               density="compact" [accent]="true" shadow="md" variant="info"
//               [value]="'₹' + (dashboard()!.inventory.summary.valuation | number:'1.0-0')"
//               [description]="(dashboard()!.inventory.inventoryValuation.totalItems | number) + ' items · ' + (dashboard()!.inventory.inventoryValuation.productCount | number) + ' SKUs'">
//                <div sparkline class="w-full h-1 bg-[var(--border-secondary)] rounded-full mt-4 overflow-hidden">
//                  <div class="h-full bg-[var(--color-info)]" [style.width.%]="dashboard()!.inventory.healthScore"></div>
//                </div>
//             </app-stat-card>

//              <app-stat-card 
//               label="Outstanding Debt" 
//               icon="pi pi-exclamation-circle"
//               variant="error"
//               density="compact" [accent]="true" shadow="md"
//               [value]="'₹' + (dashboard()!.financial.outstanding.receivables | number)"
//               [description]="dashboard()!.alerts.highRiskDebtCount + ' high-risk account(s)'">
//             </app-stat-card>

//           @if (dashboard()!.inventory.healthScore != null) {
//                <app-stat-card 
//                 label="System Health" 
//                 icon="pi pi-heart"
//                 density="compact" [accent]="true" shadow="md" variant="success"
//                 [value]="dashboard()!.inventory.healthScore + '%'"
//                 [description]="dashboard()!.inventory.summary.criticalAlerts + ' critical alerts'">
//                </app-stat-card>
//           }
//         </app-widget-rail>

//         <!-- Bento Grid Dashboard -->
//         <app-bento-grid layout="analytics" density="comfortable">
          
//           <!-- AI Insights -->
//           <app-bento-item size="md" priority="high">
//             <app-card>
//               <div class="flex flex-col lg:flex-row lg:items-center gap-6 h-full">
//                 <!-- Left: Title & Badge -->
//                 <div class="flex flex-col gap-2 lg:w-1/3 shrink-0">
//                   <h3 class="text-[length:var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] m-0 tracking-tight">
//                     AI Business Insights
//                   </h3>
//                   <div>
//                     <app-status-badge status="info" variant="subtle" size="sm" [label]="dashboard()!.insights.count + ' insights'"></app-status-badge>
//                   </div>
//                 </div>
                
//                 <!-- Right: Insights Message -->
//                 <div class="flex-1 w-full">
//                   @for (insight of dashboard()!.insights.insights; track insight.title) {
//                     <div class="p-4 rounded-lg flex items-start gap-3 border border-black/5"
//                       [class.bg-[var(--color-success-bg)]]="insight.type === 'positive'"
//                       [class.bg-[var(--color-warning-bg)]]="insight.type === 'warning'"
//                       [class.bg-[var(--color-info-bg)]]="insight.type === 'info'">
                      
//                       <i class="pi text-lg mt-0.5"
//                          [class.pi-check-circle]="insight.type === 'positive'"
//                          [class.pi-exclamation-triangle]="insight.type === 'warning'"
//                          [class.pi-info-circle]="insight.type === 'info'"
//                          [class.text-[var(--color-success)]]="insight.type === 'positive'"
//                          [class.text-[var(--color-warning)]]="insight.type === 'warning'"
//                          [class.text-[var(--color-info)]]="insight.type === 'info'"></i>
                         
//                       <div class="flex-1 flex flex-col gap-1">
//                         <div class="flex items-center justify-between">
//                           <span class="font-bold text-[var(--text-primary)] text-sm tracking-tight">{{ insight.title }}</span>
//                           <app-status-badge [status]="insight.priority === 'high' ? 'error' : 'neutral'" size="sm" [label]="insight.priority | uppercase"></app-status-badge>
//                         </div>
//                         <span class="text-[var(--text-secondary)] text-xs">{{ insight.message }}</span>
//                       </div>
//                     </div>
//                   }
//                 </div>
//               </div>
//             </app-card>
//           </app-bento-item>

//           <!-- Operations -->
//           <app-bento-item size="sm">
//             <app-data-list title="Operations" icon="pi pi-cog" maxHeight="100%">
//                         @for (cat of dashboard()!.topCategories; track cat.name) {
//                           <div class="py-[var(--spacing-lg)] first:pt-2 last:pb-2 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            
//                             <!-- Category Name & Margin -->
//                             <div class="w-full lg:w-1/3">
//                               <div class="font-bold text-[length:var(--font-size-md)] text-[var(--text-primary)] tracking-tight">{{ cat.name }}</div>
//                               <div class="text-[length:var(--font-size-xs)] text-[var(--text-tertiary)] font-medium mt-0.5">{{ cat.margin | number:'1.1-1' }}% margin</div>
//                             </div>
                            
//                             <!-- Progress Bars -->
//                             <div class="w-full lg:w-2/3 flex flex-col sm:flex-row gap-6">
                              
//                                <!-- Revenue Bar -->
//                                <div class="flex-1 flex flex-col gap-1.5">
//                                  <div class="flex justify-between items-end text-[length:var(--font-size-xs)]">
//                                    <span class="text-[var(--text-secondary)] font-semibold uppercase tracking-widest">Revenue</span>
//                                    <span class="font-bold text-[length:var(--font-size-sm)] text-[var(--text-primary)]">₹{{ cat.revenue | number:'1.0-0' }}</span>
//                                  </div>
//                                  <div class="w-full h-2 bg-[var(--bg-ternary)] rounded-full overflow-hidden shadow-inner">
//                                     <div class="h-full bg-[var(--accent-primary)] rounded-full" style="width:100%"></div>
//                                  </div>
//                                </div>
                               
//                                <!-- Profit Bar -->
//                                <div class="flex-1 flex flex-col gap-1.5">
//                                  <div class="flex justify-between items-end text-[length:var(--font-size-xs)]">
//                                    <span class="text-[var(--text-secondary)] font-semibold uppercase tracking-widest">Profit</span>
//                                    <span class="font-bold text-[length:var(--font-size-sm)] text-[var(--color-success)]">₹{{ cat.profit | number:'1.0-0' }}</span>
//                                  </div>
//                                  <div class="w-full h-2 bg-[var(--bg-ternary)] rounded-full overflow-hidden shadow-inner">
//                                     <div class="h-full bg-[var(--color-success)] rounded-full transition-all duration-500" [style.width.%]="(cat.profit / cat.revenue) * 100"></div>
//                                  </div>
//                                </div>
//                             </div>
//                           </div>
//                         }
//              </app-data-list>
//           </app-bento-item>

//           <!-- Category Performance -->
//           @if (dashboard()!.topCategories?.length) {
//             <app-bento-item size="lg">
//                <app-card title="Category Performance">
//                  <div class="flex flex-col divide-y divide-[var(--border-secondary)]">

//                  </div>
//                </app-card>
//             </app-bento-item>
//           }

//           <!-- Top Products -->
//           @if (dashboard()!.leaders.topProducts?.length) {
//             <app-bento-item size="md">
//               <app-data-list title="Top Products" icon="pi pi-star" variant="spaced" maxHeight="100%">
//                   @for (prod of dashboard()!.leaders.topProducts; track prod._id; let i = $index) {
//                     <app-data-list-card [title]="prod.name" [subtitle]="(prod.soldQty | number) + ' sold · ₹' + (prod.profit | number:'1.0-0') + ' profit'">
//                        <div leading class="font-bold text-[var(--text-tertiary)] text-[length:var(--font-size-md)] w-6 text-center">#{{ i + 1 }}</div>
//                        <div trailing class="font-bold text-[var(--text-primary)]">₹{{ prod.revenue | number:'1.0-0' }}</div>
//                     </app-data-list-card>
//                   }
//               </app-data-list>
//             </app-bento-item>
//           }

//           <!-- Stock Urgency Grid -->
//           <app-bento-item size="xl">
//             <app-card title="Stock Urgency Monitor">
//                  <ng-container ngProjectAs="[card-actions]">
//                     <div class="flex items-center gap-2">
//                       <app-status-badge status="error" variant="solid" [label]="dashboard()!.inventory.lowStockAlerts.length + ' Critical'"></app-status-badge>
//                       <app-button variant="success" size="sm" icon="pi pi-file-excel" [label]="'Export Excel ' + dashboard()!.inventory.lowStockAlerts.length"></app-button>
//                     </div>
//                  </ng-container>
//                  <div class="rounded-[var(--ui-border-radius-lg)] overflow-hidden relative h-[320px] flex flex-col">
//                    <app-data-grid [viewOnly]="true" [pagination]="true" [toolbar]="false" 
//                     [columns]="alertColumns"
//                     [data]="dashboard()!.inventory.lowStockAlerts">
//                    </app-data-grid>
//                  </div>
//             </app-card>
//           </app-bento-item>

//           <!-- Top Customers -->
//           @if (dashboard()!.leaders.topCustomers?.length) {
//             <app-bento-item size="sm">
//               <app-data-list title="Top Customers" icon="pi pi-users" variant="spaced" maxHeight="100%">
//                   @for (cust of dashboard()!.leaders.topCustomers; track cust._id; let i = $index) {
//                     <app-data-list-card [title]="cust.name" [subtitle]="(cust.transactions | number) + ' transaction(s)'">
//                        <div leading><app-avatar [name]="cust.name" size="sm"></app-avatar></div>
//                        <div trailing class="font-bold text-[var(--color-success)]">₹{{ cust.totalSpent | number:'1.0-0' }}</div>
//                     </app-data-list-card>
//                   }
//               </app-data-list>
//             </app-bento-item>
//           }
          
//           <!-- Top Staff -->
//           @if (dashboard()!.operations.topStaff?.length) {
//              <app-bento-item size="sm">
//                 <app-data-list title="Top Staff" icon="pi pi-id-card" variant="spaced" maxHeight="100%">
//                     @for (staff of dashboard()!.operations.topStaff; track staff._id) {
//                       <app-data-list-card [title]="staff.name" [subtitle]="(staff.count | number) + ' order(s)'">
//                          <div leading><app-avatar [name]="staff.name" size="sm"></app-avatar></div>
//                          <div trailing class="font-bold text-[var(--color-success)]">₹{{ staff.revenue | number:'1.0-0' }}</div>
//                       </app-data-list-card>
//                     }
//                 </app-data-list>
//              </app-bento-item>
//           }

//           <!-- Segments -->
//           @if (dashboard()!.customers?.segmentation?.length) {
//             <app-bento-item size="sm">
//               <app-data-list title="Segments" icon="pi pi-chart-pie" maxHeight="100%">
//                   @for (seg of dashboard()!.customers.segmentation; track seg._id) {
//                     <app-data-list-row [label]="seg._id">
//                       <span class="font-mono text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)]">{{ seg.count | number }}</span>
//                     </app-data-list-row>
//                   }
//               </app-data-list>
//             </app-bento-item>
//           }
          
//         </app-bento-grid>
//       </div>
//     }
//   </app-page-content>
// </app-page>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; }
    
//     .spin { animation: spin 0.7s linear infinite; }
//     @keyframes spin { to { transform: rotate(360deg); } }
    
//     /* Toolbar Alignment & Sizes */
//     .compact-toolbar {
//       ::ng-deep .master-dropdown__control.p-select,
//       ::ng-deep .master-dropdown__control.p-multiselect {
//         min-height: 36px;
//         height: 36px;
//         border-radius: var(--ui-border-radius);
//       }
//       ::ng-deep .master-dropdown__control .p-select-label {
//         padding: 0.35rem 0.75rem;
//         font-size: 0.875rem;
//       }
//       ::ng-deep .p-datepicker-input {
//         padding: 0.35rem 0.75rem;
//         font-size: 0.875rem;
//         height: 36px;
//         border-radius: var(--ui-border-radius);
//       }
//       ::ng-deep .p-datepicker-trigger {
//         width: 36px;
//         height: 36px;
//         border-top-right-radius: var(--ui-border-radius);
//         border-bottom-right-radius: var(--ui-border-radius);
//       }
//       ::ng-deep .p-button.p-button-icon-only {
//         width: 36px;
//         height: 36px;
//         padding: 0;
//       }
//     }
//   `]
// })
// export class AdminDashboardUiComponent implements OnInit, OnDestroy {
//   private readonly destroy$ = new Subject<void>();
//   dashboard = signal<any>(null);
//   loading = signal(true);

//   masterList = inject(MasterListService);

//   selectedBranch = '';
//   dateRange: Date[] | null = null;
//   alertColumns: any[] = [];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) { }

//   ngOnInit(): void {
//     this.setupColumns();
//     this.loadDashboard();
//   }

//   setupColumns(): void {
//     this.alertColumns = [
//       {
//         field: 'name',
//         headerName: 'Item',
//         flex: 2,
//         cellStyle: { 'font-weight': 'var(--font-weight-semibold)', 'font-size': 'var(--font-size-sm)' }
//       },
//       {
//         field: 'sku',
//         headerName: 'SKU',
//         flex: 1,
//         cellStyle: { 'font-family': 'var(--font-mono)', 'font-size': 'var(--font-size-xs)', 'color': 'var(--text-tertiary)' }
//       },
//       {
//         field: 'currentStock',
//         headerName: 'Stock',
//         flex: 1,
//         cellStyle: (p: any) => ({
//           'color': p.value === 0 ? 'var(--color-error)' : 'var(--color-warning)',
//           'font-weight': 'var(--font-weight-bold)',
//           'font-family': 'var(--font-mono)',
//           'font-size': 'var(--font-size-sm)'
//         })
//       },
//       {
//         field: 'reorderLevel',
//         headerName: 'Reorder',
//         flex: 1,
//         cellStyle: { 'color': 'var(--text-tertiary)', 'font-size': 'var(--font-size-sm)' }
//       },
//       {
//         field: 'urgency',
//         headerName: 'Urgency',
//         flex: 1,
//         cellRenderer: (p: any) =>
//           `<span style="
//             display:inline-flex; align-items:center;
//             font-size:var(--font-size-xs); font-weight:var(--font-weight-bold);
//             text-transform:uppercase; letter-spacing:0.05em;
//             padding:2px 8px; border-radius:var(--ui-border-radius-pill);
//             background:var(--color-error-bg); color:var(--color-error);
//             border:1px solid var(--color-error-border);
//           ">${p.value}</span>`
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//   loadDashboard(): void {
//     this.loading.set(true);

//     let start: string | undefined;
//     let end: string | undefined;

//     if (this.dateRange?.length === 2) {
//       start = this.dateRange[0]?.toISOString();
//       end = this.dateRange[1]?.toISOString();
//     }

//     this.analyticsService.getDashboardOverview(start, end, this.selectedBranch)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (res) => {
//           this.dashboard.set(res.data);
//           this.loading.set(false);
//         },
//         error: () => this.loading.set(false)
//       });
//   }

//   onFilterChange(): void {
//     this.loadDashboard();
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }


