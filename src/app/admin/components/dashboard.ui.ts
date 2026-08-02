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
    SectionComponent, WidgetRailComponent,
    StatCardComponent, CardComponent,
    DataListComponent, DataListRowComponent, DataListCardComponent,
    GradientBannerComponent, StatusBadgeComponent, ButtonComponent, LoadingComponent, AvatarComponent
  ],
  template: `
<app-page>
  <app-page-header title="Executive Dashboard" density="compact">
    <div class="flex items-end gap-4 compact-toolbar">
      <!-- Branch Selector -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Branch</label>
        <app-master-dropdown
          endpoint="branches"
          [(ngModel)]="selectedBranch"
          (onChange)="onFilterChange()"
          placeholder="All branches"
          class="w-[200px]">
        </app-master-dropdown>
      </div>

      <!-- Period Selector -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Period</label>
        <p-datepicker
          [(ngModel)]="dateRange"
          selectionMode="range"
          [showIcon]="true"
          (onSelect)="onFilterChange()"
          placeholder="Start – End"
          styleClass="w-[240px]">
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
      <div class="py-12">
        <app-loading text="Synchronising data..."></app-loading>
      </div>
    }

    @if (!loading() && dashboard()) {
      <div class="flex flex-col gap-[var(--spacing-3xl)] pb-8">
        
        <!-- Alerts Ribbon -->
        @if ((dashboard()!.alerts.lowStockCount ?? 0) > 0) {
          <app-gradient-banner variant="warning" icon="pi pi-exclamation-triangle" title="Action Required" size="sm">
            <strong>{{ dashboard()!.alerts.lowStockCount }} items</strong> below reorder level — action required to prevent stockouts.
          </app-gradient-banner>
        }

        <!-- Top KPIs -->
        <app-widget-rail gap="var(--spacing-lg)" cardWidth="min(320px, 85vw)">
            <app-stat-card 
              label="Gross Revenue" 
              density="compact" [accent]="true" shadow="md" variant="primary"
              [value]="'₹' + (dashboard()!.financial.totalRevenue.value | number)"
              [change]="dashboard()!.financial.totalRevenue.growth != null ? dashboard()!.financial.totalRevenue.growth + '%' : undefined"
              trend="up"
              [description]="(dashboard()!.financial.totalRevenue.count | number) + ' transaction(s)'">
            </app-stat-card>
          
            <app-stat-card 
              label="Net Profit" 
              density="compact" [accent]="true" shadow="md"
              [value]="'₹' + (dashboard()!.financial.netProfit.value | number)"
              [change]="dashboard()!.financial.netProfit.status"
              [trend]="dashboard()!.financial.netProfit.status === 'profitable' ? 'up' : 'down'"
              [variant]="dashboard()!.financial.netProfit.status === 'profitable' ? 'success' : 'error'"
              [description]="'Margin: ' + dashboard()!.financial.netProfit.margin + '%'">
              <div sparkline class="w-full h-1 bg-[var(--border-secondary)] rounded-full mt-4 overflow-hidden">
                <div class="h-full bg-[var(--color-success)]" [style.width.%]="dashboard()!.financial.netProfit.margin"></div>
              </div>
            </app-stat-card>

            <app-stat-card 
              label="Inventory Value" 
              icon="pi pi-box"
              density="compact" [accent]="true" shadow="md" variant="info"
              [value]="'₹' + (dashboard()!.inventory.summary.valuation | number:'1.0-0')"
              [description]="(dashboard()!.inventory.inventoryValuation.totalItems | number) + ' items · ' + (dashboard()!.inventory.inventoryValuation.productCount | number) + ' SKUs'">
               <div sparkline class="w-full h-1 bg-[var(--border-secondary)] rounded-full mt-4 overflow-hidden">
                 <div class="h-full bg-[var(--color-info)]" [style.width.%]="dashboard()!.inventory.healthScore"></div>
               </div>
            </app-stat-card>

             <app-stat-card 
              label="Outstanding Debt" 
              icon="pi pi-exclamation-circle"
              variant="error"
              density="compact" [accent]="true" shadow="md"
              [value]="'₹' + (dashboard()!.financial.outstanding.receivables | number)"
              [description]="dashboard()!.alerts.highRiskDebtCount + ' high-risk account(s)'">
            </app-stat-card>

          @if (dashboard()!.inventory.healthScore != null) {
               <app-stat-card 
                label="System Health" 
                icon="pi pi-heart"
                density="compact" [accent]="true" shadow="md" variant="success"
                [value]="dashboard()!.inventory.healthScore + '%'"
                [description]="dashboard()!.inventory.summary.criticalAlerts + ' critical alerts'">
               </app-stat-card>
          }
        </app-widget-rail>

        <!-- Main Dashboard Split (Synchronized Gaps) -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-[var(--spacing-3xl)]">
                      <div class="xl:col-span-2 flex flex-col gap-[var(--spacing-3xl)]">
                          <app-section title="AI Business Insights" spacing="compact">
                <ng-container ngProjectAs="[actions]">
                  <app-status-badge status="info" variant="subtle" size="sm" [label]="dashboard()!.insights.count + ' generated'"></app-status-badge>
                </ng-container>
                
                <div class="flex flex-col gap-[var(--spacing-md)]">
                  @for (insight of dashboard()!.insights.insights; track insight.title) {
                    <app-card padding="md" class="border-l-4 transition-transform hover:-translate-y-0.5" 
                      [class.border-l-[var(--color-success)]]="insight.type === 'positive'"
                      [class.border-l-[var(--color-warning)]]="insight.type === 'warning'"
                      [class.border-l-[var(--color-info)]]="insight.type === 'info'">
                      
                      <div class="flex items-start gap-4">
                         <!-- Polished Icon Wrapper -->
                         <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                              [class.bg-[var(--color-success-bg)]]="insight.type === 'positive'"
                              [class.bg-[var(--color-warning-bg)]]="insight.type === 'warning'"
                              [class.bg-[var(--color-info-bg)]]="insight.type === 'info'">
                           <i class="pi text-lg"
                              [class.pi-check-circle]="insight.type === 'positive'"
                              [class.pi-exclamation-triangle]="insight.type === 'warning'"
                              [class.pi-info-circle]="insight.type === 'info'"
                              [class.text-[var(--color-success)]]="insight.type === 'positive'"
                              [class.text-[var(--color-warning)]]="insight.type === 'warning'"
                              [class.text-[var(--color-info)]]="insight.type === 'info'"></i>
                         </div>
                         
                         <!-- Insight Content -->
                         <div class="flex-1 flex flex-col gap-1 pt-0.5">
                            <div class="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2 mb-0.5">
                              <h4 class="font-bold text-[length:var(--font-size-md)] text-[var(--text-primary)] tracking-tight m-0">{{ insight.title }}</h4>
                              <app-status-badge [status]="insight.priority === 'high' ? 'error' : 'neutral'" size="sm" [label]="insight.priority"></app-status-badge>
                            </div>
                            <p class="text-[length:var(--font-size-sm)] text-[var(--text-secondary)] m-0 leading-relaxed max-w-3xl">{{ insight.message }}</p>
                         </div>
                      </div>
                    </app-card>
                  }
                </div>
             </app-section>

             <!-- Category Performance -->
             @if (dashboard()!.topCategories?.length) {
                <app-section title="Category Performance" icon="pi pi-chart-bar" spacing="compact">
                   <app-card>
                     <div class="flex flex-col divide-y divide-[var(--border-secondary)]">
                        @for (cat of dashboard()!.topCategories; track cat.name) {
                          <div class="py-[var(--spacing-lg)] first:pt-2 last:pb-2 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            
                            <!-- Category Name & Margin -->
                            <div class="w-full lg:w-1/3">
                              <div class="font-bold text-[length:var(--font-size-md)] text-[var(--text-primary)] tracking-tight">{{ cat.name }}</div>
                              <div class="text-[length:var(--font-size-xs)] text-[var(--text-tertiary)] font-medium mt-0.5">{{ cat.margin | number:'1.1-1' }}% margin</div>
                            </div>
                            
                            <!-- Progress Bars -->
                            <div class="w-full lg:w-2/3 flex flex-col sm:flex-row gap-6">
                              
                               <!-- Revenue Bar -->
                               <div class="flex-1 flex flex-col gap-1.5">
                                 <div class="flex justify-between items-end text-[length:var(--font-size-xs)]">
                                   <span class="text-[var(--text-secondary)] font-semibold uppercase tracking-widest">Revenue</span>
                                   <span class="font-bold text-[length:var(--font-size-sm)] text-[var(--text-primary)]">₹{{ cat.revenue | number:'1.0-0' }}</span>
                                 </div>
                                 <div class="w-full h-2 bg-[var(--bg-ternary)] rounded-full overflow-hidden shadow-inner">
                                    <div class="h-full bg-[var(--accent-primary)] rounded-full" style="width:100%"></div>
                                 </div>
                               </div>
                               
                               <!-- Profit Bar -->
                               <div class="flex-1 flex flex-col gap-1.5">
                                 <div class="flex justify-between items-end text-[length:var(--font-size-xs)]">
                                   <span class="text-[var(--text-secondary)] font-semibold uppercase tracking-widest">Profit</span>
                                   <span class="font-bold text-[length:var(--font-size-sm)] text-[var(--color-success)]">₹{{ cat.profit | number:'1.0-0' }}</span>
                                 </div>
                                 <div class="w-full h-2 bg-[var(--bg-ternary)] rounded-full overflow-hidden shadow-inner">
                                    <div class="h-full bg-[var(--color-success)] rounded-full transition-all duration-500" [style.width.%]="(cat.profit / cat.revenue) * 100"></div>
                                 </div>
                               </div>
                            </div>
                          </div>
                        }
                     </div>
                   </app-card>
                </app-section>
             }

             <!-- Stock Urgency Grid -->
             <app-section title="Stock Urgency Monitor" spacing="compact">
                 <ng-container ngProjectAs="[actions]">
                    <app-status-badge status="error" variant="solid" [label]="dashboard()!.inventory.lowStockAlerts.length + ' Critical'"></app-status-badge>
                 </ng-container>
                 <!-- Wrapped in a border to match the cards -->
                 <div class="border border-[var(--border-secondary)] rounded-[var(--ui-border-radius-lg)] overflow-hidden">
                   <app-data-grid [viewOnly]="true" [pagination]="true" [enableExport]="true" class="full-size-grid"
                    [columns]="alertColumns"
                    [data]="dashboard()!.inventory.lowStockAlerts"
                    class="h-[320px] block">
                   </app-data-grid>
                 </div>
             </app-section>
           </div>
           
           <!-- Right Column: Lists & Quick Stats -->
           <div class="flex flex-col gap-[var(--spacing-3xl)]">
             
             <!-- Operations -->
             <app-data-list title="Operations" icon="pi pi-cog" maxHeight="320px">
                 <app-data-list-row label="Avg Order Value">
                   <span class="font-mono font-bold text-[var(--text-primary)]">₹{{ dashboard()!.operations.orderEfficiency.averageOrderValue | number:'1.0-0' }}</span>
                 </app-data-list-row>
                 <app-data-list-row label="Discount Rate">
                   <span class="font-mono font-bold text-[var(--text-primary)]">{{ dashboard()!.operations.discountMetrics.discountRate }}%</span>
                 </app-data-list-row>
                 <app-data-list-row label="Cancellation Rate">
                   <span class="font-mono font-bold text-[var(--color-error)]">{{ dashboard()!.operations.orderEfficiency.cancellationRate }}%</span>
                 </app-data-list-row>
                 <app-data-list-row label="Active Customers">
                   <span class="font-mono font-bold text-[var(--text-primary)]">{{ dashboard()!.financial.customers.active | number }}</span>
                 </app-data-list-row>
                 <app-data-list-row label="New Customers">
                   <span class="font-mono font-bold text-[var(--color-success)]">+{{ dashboard()!.financial.customers.new | number }}</span>
                 </app-data-list-row>
                 <app-data-list-row label="SKUs Sold">
                   <span class="font-mono font-bold text-[var(--text-primary)]">{{ dashboard()!.financial.products.unique | number }}</span>
                 </app-data-list-row>
             </app-data-list>

             <!-- Top Products -->
             @if (dashboard()!.leaders.topProducts?.length) {
               <app-data-list title="Top Products" icon="pi pi-star" variant="spaced" maxHeight="360px" [cardStyle]="false">
                   @for (prod of dashboard()!.leaders.topProducts; track prod._id; let i = $index) {
                     <app-data-list-card [title]="prod.name" [subtitle]="(prod.soldQty | number) + ' sold · ₹' + (prod.profit | number:'1.0-0') + ' profit'">
                        <div leading class="font-bold text-[var(--text-tertiary)] text-[length:var(--font-size-md)] w-6 text-center">#{{ i + 1 }}</div>
                        <div trailing class="font-bold text-[var(--text-primary)]">₹{{ prod.revenue | number:'1.0-0' }}</div>
                     </app-data-list-card>
                   }
               </app-data-list>
             }

             <!-- Top Customers -->
             @if (dashboard()!.leaders.topCustomers?.length) {
               <app-data-list title="Top Customers" icon="pi pi-users" variant="spaced" maxHeight="360px" [cardStyle]="false">
                   @for (cust of dashboard()!.leaders.topCustomers; track cust._id; let i = $index) {
                     <app-data-list-card [title]="cust.name" [subtitle]="(cust.transactions | number) + ' transaction(s)'">
                        <div leading><app-avatar [name]="cust.name" size="sm"></app-avatar></div>
                        <div trailing class="font-bold text-[var(--color-success)]">₹{{ cust.totalSpent | number:'1.0-0' }}</div>
                     </app-data-list-card>
                   }
               </app-data-list>
             }
             
             <!-- Segments -->
             @if (dashboard()!.customers?.segmentation?.length) {
               <app-data-list title="Segments" icon="pi pi-chart-pie" maxHeight="300px">
                   @for (seg of dashboard()!.customers.segmentation; track seg._id) {
                     <app-data-list-row [label]="seg._id">
                       <span class="font-mono text-[length:var(--font-size-sm)] font-bold text-[var(--text-primary)]">{{ seg.count | number }}</span>
                     </app-data-list-row>
                   }
               </app-data-list>
             }
             
             <!-- Top Staff -->
             @if (dashboard()!.operations.topStaff?.length) {
                <app-data-list title="Top Staff" icon="pi pi-id-card" variant="spaced" maxHeight="360px" [cardStyle]="false">
                    @for (staff of dashboard()!.operations.topStaff; track staff._id) {
                      <app-data-list-card [title]="staff.name" [subtitle]="(staff.count | number) + ' order(s)'">
                         <div leading><app-avatar [name]="staff.name" size="sm"></app-avatar></div>
                         <div trailing class="font-bold text-[var(--color-success)]">₹{{ staff.revenue | number:'1.0-0' }}</div>
                      </app-data-list-card>
                    }
                </app-data-list>
             }
           </div>
        </div>
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
        border-radius: var(--ui-border-radius);
      }
      ::ng-deep .master-dropdown__control .p-select-label {
        padding: 0.35rem 0.75rem;
        font-size: 0.875rem;
      }
      ::ng-deep .p-datepicker-input {
        padding: 0.35rem 0.75rem;
        font-size: 0.875rem;
        height: 36px;
        border-radius: var(--ui-border-radius);
      }
      ::ng-deep .p-datepicker-trigger {
        width: 36px;
        height: 36px;
        border-top-right-radius: var(--ui-border-radius);
        border-bottom-right-radius: var(--ui-border-radius);
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
        cellStyle: { 'font-weight': 'var(--font-weight-semibold)', 'font-size': 'var(--font-size-sm)' }
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
          'color': p.value === 0 ? 'var(--color-error)' : 'var(--color-warning)',
          'font-weight': 'var(--font-weight-bold)',
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
            font-size:var(--font-size-xs); font-weight:var(--font-weight-bold);
            text-transform:uppercase; letter-spacing:0.05em;
            padding:2px 8px; border-radius:var(--ui-border-radius-pill);
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
}


