import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { DataGridComponent, GridColumn } from '@shared/ui/grid';
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { TransactionService } from '../transaction.service';

@Component({
  selector: 'app-customer-transactions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    DataGridComponent,
  ],
  template: `
    <!-- Filter Toolbar -->
    <div class="filter-toolbar">
      <p-datepicker
        [(ngModel)]="rangeDates"
        selectionMode="range"
        placeholder="Date Range"
        appendTo="body"
        (onClose)="applyFilters()">
      </p-datepicker>

      <p-select
        [options]="transactionTypes"
        [(ngModel)]="filterParams.type"
        [showClear]="true"
        placeholder="Type"
        (onChange)="applyFilters()">
      </p-select>

      <p-select
        [options]="transactionEffects"
        [(ngModel)]="filterParams.effect"
        [showClear]="true"
        placeholder="Dr / Cr"
        (onChange)="applyFilters()">
      </p-select>

      <input
        type="text"
        pInputText
        [(ngModel)]="filterParams.search"
        placeholder="Search..."
        (keydown.enter)="applyFilters()" />

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
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      height: 100%;
      min-height: 0;
    }

    .filter-toolbar {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex-wrap: wrap;
      flex-shrink: 0;
    }
  `]
})
export class CustomerTransactions implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly transactionService = inject(TransactionService);
  private readonly common = inject(CommonMethodService);

  @Input() inputCustomerId: string | undefined;

  private customerId = '';
  private currentPage = 1;
  private totalCount = 0;
  private readonly pageSize = 100;

  readonly isLoading = signal(false);
  readonly data = signal<any[]>([]);

  filterParams: { type: string | null; effect: string | null; search: string } = {
    type: null, effect: null, search: '',
  };
  rangeDates: Date[] | undefined;

  readonly transactionTypes = [
    { label: 'Invoice', value: 'invoice' },
    { label: 'Payment', value: 'payment' },
    { label: 'Ledger', value: 'ledger' },
  ];
  readonly transactionEffects = [
    { label: 'Credit', value: 'credit' },
    { label: 'Debit', value: 'debit' },
  ];

  readonly columns: GridColumn[] = [
    {
      field: 'date',
      header: 'Date',
      width: '180px',
      sortable: true,
      formatter: (val: any) => val ? this.common.formatDate(val, 'dd MMM yyyy, hh:mm a') : '—',
    },
    { field: 'type', header: 'Type', type: 'badge', width: '120px', sortable: true },
    {
      field: 'description',
      header: 'Description',
      minWidth: '200px',
      formatter: (val: any) => val || 'System Entry',
    },
    {
      field: 'refNumber',
      header: 'Ref #',
      width: '150px',
      formatter: (_val: any, row: any) => row?.refNumber || row?.refId || '—',
    },
    {
      field: 'amount',
      header: 'Amount',
      width: '140px',
      type: 'currency',
      align: 'right',
      sortable: true,
    },
    {
      field: 'effect',
      header: 'Dr / Cr',
      type: 'badge',
      width: '100px',
      formatter: (val: any) => val?.toUpperCase() || '—',
    },
    {
      field: 'meta.status',
      header: 'Status',
      width: '130px',
      type: 'badge',
      formatter: (_val: any, row: any) => row?.meta?.status || '—',
    },
  ];

  ngOnInit(): void {
    this.customerId = this.inputCustomerId
      || this.route.snapshot.paramMap.get('id')
      || this.route.parent?.snapshot.paramMap.get('id')
      || '';

    if (this.customerId) {
      this.getData(true);
    }
  }

  applyFilters(): void { this.getData(true); }

  resetFilters(): void {
    this.filterParams = { type: null, effect: null, search: '' };
    this.rangeDates = undefined;
    this.getData(true);
  }

  getData(isReset = false): void {
    if (isReset) {
      this.currentPage = 1;
      this.data.set([]);
      this.totalCount = 0;
    }

    const queryParams: Record<string, any> = {
      ...this.filterParams,
      page: this.currentPage,
      limit: this.pageSize,
    };

    if (this.rangeDates?.length) {
      if (this.rangeDates[0]) queryParams['startDate'] = this.formatDateForApi(this.rangeDates[0]);
      if (this.rangeDates[1]) queryParams['endDate'] = this.formatDateForApi(this.rangeDates[1]);
    }

    this.transactionService.getCustomerTransactions(this.customerId, queryParams).subscribe({
      next: (res: any) => {
        const newData: any[] = Array.isArray(res.results) ? res.results : [];
        this.totalCount = res.total ?? this.totalCount;
        this.data.update(prev => [...prev, ...newData]);
        this.currentPage++;
        this.cdr.markForCheck();
      },
    });
  }

  eventFromGrid(event: any): void {
    if (event.type === 'reachedBottom' && this.data().length < this.totalCount) {
      this.getData(false);
    }
  }

  private formatDateForApi(date: Date): string {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().split('T')[0];
  }
}