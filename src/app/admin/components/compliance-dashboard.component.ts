import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';

interface HealthIssue {
  check: string;
  status: 'healthy' | 'warning' | 'error';
  details: string;
}

@Component({
  selector: 'app-compliance-dashboard',
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
              [style.font-size]="'var(--font-size-2xl)'">Compliance & Governance</h2>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
            Audit logs, Tax compliance tracking, and Data integrity diagnostics
          </p>
        </div>
        <div class="flex gap-2">
           <p-button label="Validation Report" icon="pi pi-check-square" [outlined]="true" severity="secondary" size="small"></p-button>
           <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="loadData()"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          
          <div class="lg:col-span-4 p-6 border flex flex-col items-center justify-center text-center" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-6" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Data Integrity Score</p>
            
            <div class="relative flex items-center justify-center mb-4">
               <svg class="w-32 h-32 transform -rotate-90">
                 <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent" [style.color]="'var(--theme-bg-ternary)'" />
                 <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent"
                   [style.color]="'var(--theme-success)'"
                   stroke-dasharray="364.4"
                   [attr.stroke-dashoffset]="364.4 - (364.4 * complianceData()?.dataHealth?.score / 100)"
                   stroke-linecap="round" />
               </svg>
               <span class="absolute text-3xl font-black text-white tabular-nums">{{ complianceData()?.dataHealth?.score }}%</span>
            </div>
            <p class="font-bold text-emerald-500 uppercase tracking-tighter" [style.font-size]="'var(--font-size-xs)'">Overall Healthy</p>
          </div>

          <div class="lg:col-span-8 p-6 border" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <div class="flex justify-between items-center mb-8">
              <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">Tax Compliance Ledger</h3>
              <span class="px-2 py-0.5 rounded font-black text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                {{ complianceData()?.tax?.compliance }}
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="mb-1 uppercase font-bold">Input GST</p>
                <p class="text-2xl font-bold tabular-nums text-white">₹{{ complianceData()?.tax?.inputTax | number }}</p>
              </div>
              <div>
                <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="mb-1 uppercase font-bold">Output GST</p>
                <p class="text-2xl font-bold tabular-nums text-white">₹{{ complianceData()?.tax?.outputTax | number }}</p>
              </div>
              <div class="p-3 rounded-lg" [style.background]="'var(--theme-bg-ternary)'">
                <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="mb-1 uppercase font-bold">Net Payable</p>
                <p class="text-2xl font-bold tabular-nums text-emerald-500">₹{{ complianceData()?.tax?.netPayable | number }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-5 space-y-6">
            <div class="p-6 border h-full" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
               <h3 class="font-bold uppercase tracking-tighter mb-6" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">System Integrity Checks</h3>
               
               <div class="space-y-4">
                 @for (issue of complianceData()?.dataHealth?.issues; track issue.check) {
                   <div class="p-4 border transition-all" 
                        [style.background]="'var(--theme-bg-ternary)'" 
                        [style.border-color]="issue.status === 'healthy' ? 'var(--theme-border-secondary)' : 'rgba(251, 191, 36, 0.2)'"
                        [style.border-radius]="'var(--ui-border-radius-lg)'">
                      <div class="flex items-center gap-3 mb-2">
                        <i class="pi" 
                           [ngClass]="issue.status === 'healthy' ? 'pi-check-circle text-emerald-500' : 'pi-exclamation-triangle text-amber-500'"></i>
                        <span class="font-bold text-white" [style.font-size]="'var(--font-size-sm)'">{{ issue.check }}</span>
                      </div>
                      <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">{{ issue.details }}</p>
                   </div>
                 }
               </div>
            </div>
          </div>

          <div class="lg:col-span-7">
            <div class="border overflow-hidden shadow-sm" 
                 [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
                <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Audit Trail (Recent Events)</h3>
                <span class="text-[9px] font-mono opacity-50 uppercase" [style.color]="'var(--theme-text-label)'">Immutable Logs</span>
              </div>

              <p-table [value]="complianceData()?.audit?.recentEvents" styleClass="p-datatable-sm no-border-table">
                <ng-template pTemplate="header">
                  <tr>
                    <th [style.color]="'var(--theme-text-label)'">Administrator</th>
                    <th [style.color]="'var(--theme-text-label)'">Action</th>
                    <th [style.color]="'var(--theme-text-label)'" class="text-right">Time</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-event>
                  <tr [style.color]="'var(--theme-text-secondary)'">
                    <td>
                      <div class="flex flex-col">
                        <span class="font-bold text-white">{{ event.userId?.name }}</span>
                        <span class="text-[9px]" [style.color]="'var(--theme-text-label)'">{{ event.ip }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="flex flex-col">
                         <span class="px-2 py-0.5 w-fit rounded font-bold text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-tighter">
                           {{ event.action.split(':')[1] || event.action }}
                         </span>
                         <span class="text-[9px] mt-1 opacity-50">{{ event.entityType }}</span>
                      </div>
                    </td>
                    <td class="text-right font-mono text-[10px] font-bold text-white tabular-nums">
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
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Validating Governance Data...</p>
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
export class ComplianceDashboardComponent implements OnInit {
  complianceData = signal<any>(null);
  loading = signal<boolean>(true);

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getComplianceDashboard().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.complianceData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}