import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { DataGridComponent, GridColumn } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';

import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-machine-logs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ButtonModule,
    TooltipModule,
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
  ],
  template: `
    <app-page>
      <app-page-header
        title="Device Transaction Logs"
        [subtitle]="subtitle()">
        <div header-left class="mr-3">
          <p-button
            icon="pi pi-arrow-left"
            [text]="true"
            severity="secondary"
            pTooltip="Back to Machines"
            (onClick)="goBack()">
          </p-button>
        </div>
        <div header-right class="flex items-center gap-3">
          @if (machineStatus()) {
            <span class="status-indicator" [class.online]="machineStatus().connectionStatus === 'online'">
              {{ machineStatus().connectionStatus | titlecase }}
            </span>
          }
          <p-button
            icon="pi pi-refresh"
            [text]="true"
            severity="secondary"
            pTooltip="Refresh Logs"
            [loading]="isLoading()"
            (onClick)="getData()">
          </p-button>
        </div>
      </app-page-header>

      <app-page-content [padded]="true">
        <app-data-grid
          [columns]="columns"
          [data]="data()"
          [loading]="isLoading()">
        </app-data-grid>
      </app-page-content>
    </app-page>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; width: 100%; height: 100%; }
    .status-indicator {
      padding: 4px 12px;
      border-radius: var(--ui-border-radius-pill);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      background: var(--color-error-bg);
      color: var(--color-error-text);
      border: 1px solid var(--color-error-border);
    }
    .status-indicator.online {
      background: var(--color-success-bg);
      color: var(--color-success-text);
      border-color: var(--color-success-border);
    }
  `]
})
export class MachineLogsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly hrmsService = inject(HRMSService);
  private readonly messageService = inject(AppMessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private machineId: string | null = null;
  
  readonly machineStatus = signal<any>(null);
  readonly subtitle = signal<string>('Loading...');
  readonly data = signal<any[]>([]);
  readonly isLoading = signal(false);

  readonly columns: GridColumn[] = [
    {
      field: 'timestamp', header: 'Timestamp', width: '220px', sortable: true,
      formatter: (v: any) => v ? new Date(v).toLocaleString() : '—',
    },
    {
      field: 'user.name', header: 'User Details', width: '250px',
      formatter: (_v: any, row: any) => {
        const name = row?.user?.name || 'Unmapped User';
        const empId = row?.user?.employeeProfile?.employeeId || '—';
        return `${name} (EMP ID: ${empId})`;
      },
    },
    {
      field: 'biometricData.method', header: 'Verification Mode', width: '160px',
      formatter: (v: any, row: any) => (v || row?.source || 'unknown').toUpperCase(),
    },
    {
      field: 'type', header: 'Punch Type', width: '140px', type: 'badge',
      formatter: (v: any) => (v || 'in').toUpperCase(),
    },
    {
      field: 'processingStatus', header: 'Status', width: '120px', type: 'badge',
      formatter: (v: any) => (v || 'unknown').toUpperCase(),
    },
  ];

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.machineId = params.get('id');
      if (this.machineId) {
        this.subtitle.set(`ID: ${this.machineId}`);
        this.getStatus();
        this.getData();
      }
    });
  }

  getStatus(): void {
    if (!this.machineId) return;
    this.hrmsService.getMachineStatus(this.machineId).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.machineStatus.set(res.data?.machine ?? null);
      this.cdr.markForCheck();
    });
  }

  getData(): void {
    if (!this.machineId) return;
    this.isLoading.set(true);
    this.hrmsService.getMachineLogs(this.machineId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.data.set(res.data?.logs ?? res.data ?? []);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.messageService.handleHttpError(err);
        this.isLoading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/hrms/attendance/machines']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
