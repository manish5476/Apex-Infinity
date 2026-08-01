import { Component, OnInit, signal, computed, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';

import { PageComponent } from '../../shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '../../shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '../../shared/ui/layout/page-content/page-content.component';
import { CardComponent } from '../../shared/ui/data/card/card.component';
import { StatCardComponent } from '../../shared/ui/data/stat-card.component';
import { DataGridComponent } from '../../shared/ui/grid/dataGrid/data-grid.component';
import { GridColumn } from '../../shared/ui/grid/grid-types';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-real-time-monitoring',
  standalone: true,
  imports: [
    CommonModule, TagModule, ProgressSpinnerModule,
    TooltipModule, UniversalFilterComponent,
    PageComponent, PageHeaderComponent, PageContentComponent,
    CardComponent, StatCardComponent, DataGridComponent
  ],
  template: `
<app-page>
  
  <app-page-header title="Live System Integrity" [subtitle]="'Latency: ' + lastResponseTime() + ' · Pulse: ' + (monitorData()?.monitoring?.lastUpdated | date:'HH:mm:ss')">
    <div header-left class="flex items-center ml-2 mr-3 mb-1">
      <!-- Live pulse -->
      <div class="relative w-2.5 h-2.5 flex-shrink-0" aria-label="System live">
        <span class="absolute inset-0 rounded-full bg-[var(--color-success)] animate-[pulse-ping_1.5s_ease-out_infinite]"></span>
        <span class="absolute inset-0 rounded-full bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success)]"></span>
      </div>
    </div>

    <!-- Header Actions -->
    <button class="flex items-center justify-center gap-2 h-10 px-4 border border-[var(--border-secondary)] bg-transparent text-[var(--text-secondary)] rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]" pTooltip="Network Audit" tooltipPosition="bottom">
      <i class="pi pi-shield"></i>
      <span>Network Audit</span>
    </button>
    <app-universal-filter
      entityType="real-time-monitoring"
      [config]="filterConfig"
      (filterChange)="onFilterUpdate($event)">
    </app-universal-filter>

    <button class="flex items-center justify-center gap-2 h-10 px-4 bg-[var(--accent-primary)] text-white rounded-lg text-sm font-medium shadow-sm transition-all duration-200 hover:brightness-105 hover:-translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed" (click)="loadData()" [disabled]="loading()" pTooltip="Force re-scan" tooltipPosition="bottom">
      <i class="pi pi-refresh" [class.animate-spin]="loading()"></i>
    </button>
  </app-page-header>



  @if (loading()) {
    <div class="flex-1 flex flex-col items-center justify-center gap-4">
      <p-progressSpinner strokeWidth="3"></p-progressSpinner>
      <span class="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Analysing traffic patterns…</span>
    </div>
  }

  @if (!loading()) {
    <app-page-content class="flex flex-col gap-6 p-6">
      
      <!-- KPI Strip -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        <app-stat-card 
          label="Active Incidents" 
          [value]="monitorData()?.alerts?.total || 0"
          icon="pi pi-exclamation-triangle"
          variant="primary">
        </app-stat-card>

        <app-stat-card 
          label="Critical Risks" 
          [value]="monitorData()?.alerts?.critical?.length || 0"
          icon="pi pi-bolt"
          variant="error">
        </app-stat-card>

        <app-stat-card 
          label="System Warnings" 
          [value]="monitorData()?.alerts?.warning?.length || 0"
          icon="pi pi-info-circle"
          variant="warning">
        </app-stat-card>

        <app-stat-card 
          label="Risky Activity" 
          [value]="monitorData()?.security?.riskyActions || 0"
          icon="pi pi-shield"
          [variant]="(monitorData()?.security?.riskyActions || 0) === 0 ? 'success' : 'error'">
        </app-stat-card>
      </div>

      <!-- Body Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 flex-1 min-h-0">
        
        <!-- Sidebar Column -->
        <div class="flex flex-col gap-6 h-full min-h-0">
          
          <app-card title="Priority Interventions" class="flex flex-col min-h-0 shrink-0 lg:flex-1 lg:max-h-[500px]">
            <ng-container headerRight>
              <span class="text-xs font-bold bg-[var(--color-error-bg)] text-[var(--color-error)] px-2 py-0.5 rounded-full font-mono">{{ allAlerts().length }}</span>
            </ng-container>

            <div class="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0 pr-1">
              @if (allAlerts().length > 0) {
                @for (alert of allAlerts(); track alert.timestamp) {
                  <div class="flex gap-3 items-start p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-md transition-transform duration-150 hover:bg-[var(--bg-secondary)] hover:translate-x-[2px]"
                       [class]="alert.severity === 'critical' ? 'bg-[var(--color-error-bg)] border-red-500/20 hover:bg-red-500/10' : ''">
                    <span class="w-[3px] rounded-full self-stretch shrink-0"
                          [class]="alert.severity === 'critical' ? 'bg-[var(--color-error)]' : 'bg-[var(--color-warning)]'"></span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-[var(--text-primary)] m-0 mb-1 leading-tight">{{ alert.message }}</p>
                      <p class="text-[10px] text-[var(--text-tertiary)] m-0">
                        <span class="font-mono">{{ alert.type | uppercase }}</span>
                        &nbsp;·&nbsp;
                        {{ alert.timestamp | date:'shortTime' }}
                      </p>
                    </div>
                  </div>
                }
              } @else {
                <div class="flex-1 flex flex-col items-center justify-center gap-3 text-[var(--text-tertiary)] p-8">
                  <i class="pi pi-check-circle text-[28px] text-[var(--color-success)] opacity-60"></i>
                  <p class="text-sm m-0 font-medium">All subsystems nominal.</p>
                </div>
              }
            </div>
          </app-card>

          <!-- Posture Card -->
          <div class="flex items-center gap-4 p-6 bg-[var(--component-bg)] border border-[var(--border-secondary)] rounded-xl shadow-sm shrink-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
               [class]="(monitorData()?.security?.riskyActions || 0) === 0 ? 'bg-[var(--color-success-bg)] border-green-500/20' : 'bg-[var(--color-error-bg)] border-red-500/20'">
            
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 shadow-sm"
                 [class]="(monitorData()?.security?.riskyActions || 0) === 0 ? 'text-[var(--color-success)] bg-[var(--bg-primary)]' : 'text-[var(--color-error)] bg-[var(--bg-primary)]'">
              <i class="pi" [class.pi-lock]="(monitorData()?.security?.riskyActions || 0) === 0"
                            [class.pi-bolt]="(monitorData()?.security?.riskyActions || 0) > 0"></i>
            </div>
            
            <div>
              <p class="text-sm font-bold m-0 mb-0.5"
                 [class]="(monitorData()?.security?.riskyActions || 0) === 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'">
                {{ (monitorData()?.security?.riskyActions || 0) > 0 ? 'Vulnerable' : 'Hardened' }}
              </p>
              <p class="text-[11px] m-0 leading-relaxed"
                 [class]="(monitorData()?.security?.riskyActions || 0) === 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">
                {{ (monitorData()?.security?.riskyActions || 0) > 0
                    ? 'Unauthorised sequences detected.'
                    : 'No anomalous behavioural patterns detected.' }}
              </p>
            </div>
          </div>

        </div>

        <!-- Main Column (Grid) -->
        <div class="h-full min-h-[400px] flex flex-col">
          <app-card title="Behavioural Access Logs" class="flex flex-col flex-1 min-h-0">
            <ng-container headerRight>
              <span class="text-[9px] font-bold uppercase tracking-wider text-[var(--accent-primary)] bg-[var(--accent-focus)] border border-[var(--accent-primary)]/20 px-2 py-0.5 rounded-full">Real-time traffic</span>
            </ng-container>
            
            <div class="flex-1 relative min-h-0 w-full h-full">
              <app-data-grid
                [columns]="logColumns"
                [data]="monitorData()?.security?.recentEvents || []"
                class="absolute inset-0 w-full h-full">
              </app-data-grid>
            </div>
          </app-card>
        </div>

      </div>
    </app-page-content>
  }
</app-page>
  `,
  styles: [`
    @keyframes pulse-ping {
      0%    { transform: scale(1);   opacity: 0.8; }
      75%,
      100%  { transform: scale(3); opacity: 0; }
    }
  `]
})
export class RealTimeMonitoringComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private analyticsService = inject(AdminAnalyticsService);
  private commonService = inject(CommonMethodService);
  private cdr = inject(ChangeDetectorRef);

  monitorData = signal<any>(null);
  loading = signal(false);
  lastResponseTime = signal('0ms');
  logColumns: GridColumn[] = [];

  private currentFilters: Record<string, any> = {};

  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Domain',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'All Domains'
    },
    {
      key: 'severity',
      label: 'Threat Level',
      type: 'select',
      placeholder: 'All Levels',
      optionLabel: 'label',
      optionValue: 'value',
      staticOptions: [
        { label: 'Critical Only', value: 'critical' },
        { label: 'Active Alerts', value: 'warning' }
      ]
    }
  ];

  // Merge critical + warning alerts, newest first
  allAlerts = computed(() => {
    const d = this.monitorData();
    if (!d?.alerts) return [];
    return [
      ...(d.alerts.critical ?? []),
      ...(d.alerts.warning ?? [])
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  ngOnInit(): void {
    this.setupColumns();
    this.loadData();
  }

  onFilterUpdate(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.analyticsService
      .getRealTimeMonitoring(this.currentFilters['branchId'], this.currentFilters['severity']).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.monitorData.set(res.data);
          this.lastResponseTime.set(res.meta?.responseTime ?? '0ms');
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  setupColumns(): void {
    this.logColumns = [
      {
        field: 'userId.name',
        header: 'User',
        type: 'text',
        width: '150px'
      },
      {
        field: 'userId.email',
        header: 'Email',
        type: 'text',
        width: '100%'
      },
      {
        field: 'action',
        header: 'Action',
        type: 'text',
        width: '160px'
      },
      {
        field: 'ip',
        header: 'Source IP',
        type: 'text',
        width: '120px'
      },
      {
        field: 'createdAt',
        header: 'Time',
        type: 'text',
        width: '100px',
        formatter: (value: any) => this.commonService.formatDate(value, 'HH:mm:ss')
      }
    ];
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}