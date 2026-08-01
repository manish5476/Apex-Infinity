import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { DataGridComponent, GridColumn } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';

import { CommonMethodService } from '../../../core/utils/common-method.service';
import { TransactionService } from '../transaction.service';

@Component({
  selector: 'app-logs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    DataGridComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
  ],
  template: `
    <app-page>
      <app-page-header
        title="System Logs"
        subtitle="Server application logs for debugging and monitoring">
        <div header-right class="flex items-center gap-3">
          <p-button
            icon="pi pi-refresh"
            [text]="true"
            [rounded]="true"
            severity="secondary"
            [loading]="isLoading()"
            (onClick)="getLogs()"
            pTooltip="Refresh">
          </p-button>
        </div>
      </app-page-header>

      <app-page-content [padded]="true">
        <!-- Filter Toolbar -->
        <div class="filter-toolbar">
          <p-select
            [options]="logFiles"
            [(ngModel)]="filters.file"
            placeholder="Log File"
            (onChange)="applyFilters()">
          </p-select>

          <p-datepicker
            [(ngModel)]="dateRange"
            selectionMode="range"
            placeholder="Date Range"
            appendTo="body"
            (onClose)="applyFilters()">
          </p-datepicker>

          <input
            type="text"
            pInputText
            [(ngModel)]="filters.search"
            placeholder="Search message..."
            (keydown.enter)="applyFilters()" />

          <p-select
            [options]="limitOptions"
            [(ngModel)]="filters.limit"
            placeholder="Limit"
            (onChange)="applyFilters()">
          </p-select>

          <p-button
            icon="pi pi-times"
            [text]="true"
            severity="secondary"
            pTooltip="Reset"
            (onClick)="resetFilters()">
          </p-button>
        </div>

        <!-- DataGrid -->
        <app-data-grid
          [columns]="columns"
          [data]="data()"
          [loading]="isLoading()"
          (gridEvent)="eventFromGrid($event)">
        </app-data-grid>
      </app-page-content>
    </app-page>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
      height: 100%;
    }

    .filter-toolbar {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex-wrap: wrap;
      margin-bottom: var(--spacing-md);
    }
  `]
})
export class LogsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  private readonly logsService = inject(TransactionService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly common = inject(CommonMethodService);

  readonly isLoading = signal(false);
  readonly data = signal<any[]>([]);

  readonly logFiles = [
    { label: 'Combined', value: 'combined' },
    { label: 'Errors', value: 'error' },
    { label: 'Exceptions', value: 'exceptions' },
    { label: 'Rejections', value: 'rejections' },
  ];

  readonly limitOptions = [
    { label: '100', value: 100 },
    { label: '200', value: 200 },
    { label: '500', value: 500 },
  ];

  filters: { file: string; search: string; limit: number } = {
    file: 'combined',
    search: '',
    limit: 200,
  };

  dateRange: Date[] | null = null;

  readonly columns: GridColumn[] = [
    {
      field: 'timestamp',
      header: 'Timestamp',
      width: '200px',
      sortable: true,
      formatter: (val: any) => val ? this.common.formatDate(val, 'dd MMM yyyy, hh:mm:ss a') : '—',
    },
    {
      field: 'level',
      header: 'Level',
      type: 'badge',
      width: '120px',
      sortable: true,
    },
    {
      field: 'message',
      header: 'Message',
      minWidth: '300px',
    },
  ];

  ngOnInit(): void {
    this.getLogs();
  }

  applyFilters(): void {
    this.getLogs();
  }

  resetFilters(): void {
    this.filters = { file: 'combined', search: '', limit: 200 };
    this.dateRange = null;
    this.getLogs();
  }

  getLogs(): void {
    this.isLoading.set(true);
    const params: Record<string, any> = { ...this.filters };

    if (this.dateRange?.length === 2) {
      if (this.dateRange[0]) params['startDate'] = this.format(this.dateRange[0]);
      if (this.dateRange[1]) params['endDate'] = this.format(this.dateRange[1]);
    }

    this.logsService.getLogs(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.data.set(res.content ?? []);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  eventFromGrid(_event: any): void {
    // No special grid events needed for logs
  }

  private format(date: Date): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
