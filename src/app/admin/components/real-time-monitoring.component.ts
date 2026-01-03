import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AdminAnalyticsService } from '../admin-analytics.service';

interface SystemAlert {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

interface SecurityEvent {
  _id: string;
  userId: { name: string; email: string };
  action: string;
  entityType: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

@Component({
  selector: 'app-real-time-monitoring',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, ProgressSpinnerModule, TooltipModule],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <div class="mb-8 flex flex-wrap justify-between items-center gap-4">
        <div class="flex items-center gap-3">
          <div class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" [style.background]="'var(--theme-success)'"></span>
            <span class="relative inline-flex rounded-full h-3 w-3" [style.background]="'var(--theme-success)'"></span>
          </div>
          <div>
            <h2 class="font-bold tracking-tight" 
                [style.color]="'var(--theme-text-primary)'"
                [style.font-family]="'var(--font-heading)'"
                [style.font-size]="'var(--font-size-2xl)'">Live System Monitor</h2>
            <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="uppercase font-bold tracking-widest">
              Last Pulse: {{ monitorData()?.monitoring?.lastUpdated | date:'mediumTime' }}
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <p-button label="Audit Logs" icon="pi pi-shield" [text]="true" severity="secondary" size="small"></p-button>
          <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="loadData()"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="p-4 border transition-all" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold text-[10px] mb-1" [style.color]="'var(--theme-text-label)'">Total Alerts</p>
            <h3 class="text-2xl font-bold text-white tabular-nums">{{ monitorData()?.alerts?.total }}</h3>
          </div>
          <div class="p-4 border transition-all border-l-4" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-left-color]="'var(--theme-error)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold text-[10px] mb-1" [style.color]="'var(--theme-text-label)'">Critical Risk</p>
            <h3 class="text-2xl font-bold tabular-nums text-rose-500">{{ monitorData()?.alerts?.critical?.length }}</h3>
          </div>
          <div class="p-4 border transition-all border-l-4" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-left-color]="'var(--theme-warning)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold text-[10px] mb-1" [style.color]="'var(--theme-text-label)'">Warnings</p>
            <h3 class="text-2xl font-bold tabular-nums text-amber-500">{{ monitorData()?.alerts?.warning?.length }}</h3>
          </div>
          <div class="p-4 border transition-all" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold text-[10px] mb-1" [style.color]="'var(--theme-text-label)'">Risky Actions</p>
            <h3 class="text-2xl font-bold tabular-nums" [style.color]="monitorData()?.security?.riskyActions > 0 ? 'var(--theme-error)' : 'var(--theme-success)'">
              {{ monitorData()?.security?.riskyActions }}
            </h3>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-5 space-y-6">
            <div class="p-6 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
               <h3 class="font-bold uppercase tracking-tight mb-6" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">Priority Intervention</h3>
               
               <div class="space-y-3">
                 @for (alert of allAlerts(); track alert.timestamp) {
                   <div class="p-3 border flex items-start gap-3 transition-colors hover:bg-white/5" 
                        [style.background]="'var(--theme-bg-ternary)'" 
                        [style.border-color]="'var(--theme-border-secondary)'"
                        [style.border-radius]="'var(--ui-border-radius-lg)'">
                     <i class="pi mt-1" 
                        [ngClass]="alert.severity === 'critical' ? 'pi-exclamation-triangle' : 'pi-info-circle'"
                        [style.color]="alert.severity === 'critical' ? 'var(--theme-error)' : 'var(--theme-warning)'"></i>
                     <div class="flex-1">
                        <p class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">{{ alert.message }}</p>
                        <p class="text-[10px] uppercase font-bold mt-1" [style.color]="'var(--theme-text-label)'">{{ alert.type }} • {{ alert.timestamp | date:'shortTime' }}</p>
                     </div>
                     <p-button icon="pi pi-arrow-right" [text]="true" size="small"></p-button>
                   </div>
                 }
               </div>
            </div>

            <div class="p-5 border border-dashed flex items-start gap-4"
                 [style.border-color]="'var(--theme-border-secondary)'"
                 [style.background]="'rgba(16, 185, 129, 0.03)'"
                 [style.border-radius]="'var(--ui-border-radius-lg)'">
               <div class="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 shrink-0">
                 <i class="pi pi-lock"></i>
               </div>
               <div>
                 <p class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">Security Posture: Secure</p>
                 <p class="mt-1 leading-relaxed" [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
                   No risky actions detected in current session. All customer and supplier data access aligns with role-based permissions.
                 </p>
               </div>
            </div>
          </div>

          <div class="lg:col-span-7">
            <div class="border overflow-hidden shadow-sm" 
                 [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
                <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Real-time Access Logs</h3>
                <span class="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold text-[10px]">LIVE STREAM</span>
              </div>

              <p-table [value]="monitorData()?.security?.recentEvents" [scrollable]="true" scrollHeight="450px" styleClass="p-datatable-sm no-border-table">
                <ng-template pTemplate="header">
                  <tr>
                    <th [style.color]="'var(--theme-text-label)'">Admin Associate</th>
                    <th [style.color]="'var(--theme-text-label)'">Action performed</th>
                    <th [style.color]="'var(--theme-text-label)'">Network Details</th>
                    <th [style.color]="'var(--theme-text-label)'" class="text-right">Time</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-event>
                  <tr [style.color]="'var(--theme-text-secondary)'">
                    <td>
                      <div class="flex flex-col">
                        <span class="font-bold text-white">{{ event.userId?.name }}</span>
                        <span class="text-[9px] truncate w-32" [style.color]="'var(--theme-text-label)'">{{ event.userId?.email }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="flex flex-col gap-1">
                        <span class="px-2 py-0.5 w-fit rounded font-bold text-[9px] bg-white/5 border border-white/10 uppercase text-indigo-300">
                          {{ event.action.split(':')[1] || event.action }}
                        </span>
                        <span class="text-[9px] opacity-60 italic">{{ event.action.split(':')[0] }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="flex flex-col text-[10px]">
                        <span class="font-mono">{{ event.ip }}</span>
                        <span class="truncate w-32 opacity-40">{{ event.userAgent }}</span>
                      </div>
                    </td>
                    <td class="text-right font-mono text-[11px] font-bold text-white tabular-nums">
                      {{ event.createdAt | date:'HH:mm:ss' }}
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Scanning System Integrity...</p>
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
  `]
})
export class RealTimeMonitoringComponent implements OnInit {
  monitorData = signal<any>(null);
  loading = signal<boolean>(true);

  // Combine critical and warning alerts for a unified list
  allAlerts = computed(() => {
    const data = this.monitorData();
    if (!data) return [];
    return [...data.alerts.critical, ...data.alerts.warning].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
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
    this.analyticsService.getRealTimeMonitoring().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.monitorData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}