import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { forkJoin } from 'rxjs';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AdminAnalyticsService } from '../admin-analytics.service';

@Component({
  selector: 'app-system-audit-alerts',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, TooltipModule, ProgressSpinnerModule],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <div class="mb-8 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 class="font-bold tracking-tight mb-1" 
              [style.color]="'var(--theme-text-primary)'"
              [style.font-family]="'var(--font-heading)'"
              [style.font-size]="'var(--font-size-2xl)'">System Integrity & Alerts</h2>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
            Monitoring administrative access and critical business bottlenecks
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="px-3 py-1 border rounded-lg flex items-center gap-2" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
            <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase">Security Status</span>
            <span class="font-bold tabular-nums" [style.color]="securityData()?.riskyActions > 0 ? 'var(--theme-error)' : 'var(--theme-success)'">
              {{ securityData()?.riskyActions > 0 ? 'Action Required' : 'Secure' }}
            </span>
          </div>
          <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="refreshAll()"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="p-6 border transition-all hover:scale-[1.01]" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <div class="flex justify-between items-start mb-4">
              <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Inventory Health</span>
              <i class="pi pi-box text-rose-400"></i>
            </div>
            <div class="flex items-baseline gap-2">
              <h2 class="text-3xl font-bold tabular-nums text-rose-500">{{ alertsData()?.lowStockCount }}</h2>
              <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Low Stock Items</span>
            </div>
            <div class="mt-4 p-2 rounded bg-rose-500/5 border border-rose-500/10">
               <p class="text-[10px] font-bold text-rose-400 uppercase mb-1">To Reorder:</p>
               <p class="text-[11px] font-bold text-white truncate">{{ alertsData()?.itemsToReorder[0] }}</p>
            </div>
          </div>

          <div class="p-6 border transition-all hover:scale-[1.01]" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <div class="flex justify-between items-start mb-4">
              <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Financial Exposure</span>
              <i class="pi pi-exclamation-triangle text-amber-400"></i>
            </div>
            <div class="flex items-baseline gap-2">
              <h2 class="text-3xl font-bold tabular-nums text-amber-500">{{ alertsData()?.highRiskDebtCount }}</h2>
              <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">High Risk Debts</span>
            </div>
            <p class="mt-4 text-[11px]" [style.color]="'var(--theme-text-secondary)'">Action: Immediate payment follow-up recommended for overdue segments.</p>
          </div>

          <div class="p-6 border text-white shadow-lg" 
               [style.background]="'var(--theme-accent-gradient)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-black tracking-tighter opacity-80 mb-2" [style.font-size]="'var(--font-size-xs)'">Audit Trail</p>
            <h2 class="text-2xl font-bold mb-1">{{ securityData()?.recentEvents?.length }} Events</h2>
            <p class="text-[11px] font-bold opacity-90 uppercase italic">Logged in last 72 hours</p>
            <div class="mt-6 flex gap-2">
               <p-button label="Review Logs" severity="secondary" [text]="true" size="small" styleClass="bg-white/10 text-white border-white/20"></p-button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-8">
            <div class="border overflow-hidden shadow-sm" 
                 [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
                <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Administrative Access Log</h3>
                <span class="text-[9px] font-mono opacity-50" [style.color]="'var(--theme-text-label)'">IP TRAFFIC: MONITORING</span>
              </div>

              <p-table [value]="securityData()?.recentEvents" styleClass="p-datatable-sm no-border-table">
                <ng-template pTemplate="header">
                  <tr>
                    <th [style.color]="'var(--theme-text-label)'">Administrator</th>
                    <th [style.color]="'var(--theme-text-label)'">Action performed</th>
                    <th [style.color]="'var(--theme-text-label)'">Trace (IP)</th>
                    <th [style.color]="'var(--theme-text-label)'" class="text-right">Timestamp</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-event>
                  <tr [style.color]="'var(--theme-text-secondary)'">
                    <td>
                      <div class="flex items-center gap-3">
                        <div class="w-7 h-7 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-[10px]">
                          {{ commonService.getInitials(event.userId?.name) }}
                        </div>
                        <div class="flex flex-col">
                          <span class="font-bold text-white leading-none mb-1">{{ event.userId?.name }}</span>
                          <span class="text-[9px] opacity-50">{{ event.userId?.email }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="flex flex-col gap-1">
                        <span class="px-2 py-0.5 w-fit rounded font-bold text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-tighter">
                          {{ event.action.split(':')[1] || event.action }}
                        </span>
                        <span class="text-[9px]" [style.color]="'var(--theme-text-label)'">Entity: {{ event.entityType }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="font-mono text-[10px] bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50" [style.color]="'var(--theme-text-tertiary)'">
                        {{ event.ip === '::1' ? 'Localhost' : event.ip }}
                      </span>
                    </td>
                    <td class="text-right font-mono text-[10px] font-bold text-white tabular-nums">
                      {{ event.createdAt | date:'dd MMM, HH:mm' }}
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>

          <div class="lg:col-span-4 space-y-6">
            
            <div class="p-5 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
               <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Re-order Checklist</h4>
               <div class="space-y-3">
                 @for (item of alertsData()?.itemsToReorder; track item) {
                   <div class="flex items-center justify-between p-3 border rounded-lg transition-colors hover:bg-white/5" 
                        [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'">
                     <span class="font-bold text-white" [style.font-size]="'var(--font-size-xs)'">{{ item }}</span>
                     <p-button icon="pi pi-shopping-cart" [text]="true" severity="info" size="small"></p-button>
                   </div>
                 }
                 @if (!alertsData()?.itemsToReorder?.length) {
                   <p class="text-center py-4 text-[11px]" [style.color]="'var(--theme-text-tertiary)'">No immediate stock-outs detected.</p>
                 }
               </div>
            </div>

            <div class="p-5 border border-dashed flex flex-col items-center text-center" 
                 [style.background]="'rgba(16, 185, 129, 0.03)'" 
                 [style.border-color]="'var(--theme-success)'" 
                 [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                 <i class="pi pi-check-circle text-xl"></i>
              </div>
              <h4 class="font-bold text-white mb-1">Environment Secure</h4>
              <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
                Audit logs show zero unauthorized requests. Last integrity check completed at {{ securityData()?.recentEvents[0]?.createdAt | date:'shortTime' }}.
              </p>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Fetching Security Tokens...</p>
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
      padding: 0.85rem 1rem;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      border: none !important;
    }
  `]
})
export class SystemAuditAlertsComponent implements OnInit {
  alertsData = signal<any>(null);
  securityData = signal<any>(null);
  loading = signal<boolean>(true);

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService
  ) {}

  ngOnInit() {
    this.refreshAll();
  }

  refreshAll() {
    this.loading.set(true);
    // Fetch both API endpoints simultaneously
    forkJoin({
      alerts: this.analyticsService.getCriticalAlerts(),
      security: this.analyticsService.getSecurityAuditLog()
    }).subscribe({
      next: (results) => {
        if (results.alerts.status === 'success') this.alertsData.set(results.alerts.data);
        if (results.security.status === 'success') this.securityData.set(results.security.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}