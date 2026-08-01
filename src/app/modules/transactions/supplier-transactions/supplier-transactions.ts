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
  selector: 'app-supplier-transactions',
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
export class SupplierTransactions implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly transactionService = inject(TransactionService);
  private readonly common = inject(CommonMethodService);

  @Input() inputSupplierId: string | undefined;

  private supplierId = '';
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
    { label: 'Purchase', value: 'purchase' },
    { label: 'Payment', value: 'payment' },
    { label: 'Ledger', value: 'ledger' },
  ];
  readonly transactionEffects = [
    { label: 'Credit (+)', value: 'credit' },
    { label: 'Debit (-)', value: 'debit' },
  ];

  readonly columns: GridColumn[] = [
    {
      field: 'date',
      header: 'Date',
      width: '140px',
      sticky: 'left',
      sortable: true,
      formatter: (val: any) => val ? this.common.formatDate(val, 'dd MMM yyyy') : '—',
    },
    { field: 'type', header: 'Type', type: 'badge', width: '120px' },
    {
      field: 'description',
      header: 'Description',
      minWidth: '220px',
      formatter: (val: any) => val || 'System Entry',
    },
    {
      field: 'effect',
      header: 'Dr / Cr',
      type: 'badge',
      width: '110px',
      formatter: (val: any) => val?.toUpperCase() || '—',
    },
    {
      field: 'amount',
      header: 'Amount',
      width: '140px',
      type: 'currency',
      align: 'right',
      sortable: true,
    },
  ];

  ngOnInit(): void {
    this.supplierId = this.inputSupplierId
      || this.route.snapshot.paramMap.get('id')
      || this.route.parent?.snapshot.paramMap.get('id')
      || '';

    if (this.supplierId) this.getData(true);
  }

  applyFilters(): void { this.getData(true); }

  resetFilters(): void {
    this.filterParams = { type: null, effect: null, search: '' };
    this.rangeDates = undefined;
    this.getData(true);
  }

  getData(isReset = false): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);

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

    this.transactionService.getSupplierTransactions(this.supplierId, queryParams).subscribe({
      next: (res: any) => {
        const newData: any[] = Array.isArray(res.results) ? res.results : [];
        this.totalCount = res.pagination?.totalResults ?? this.totalCount;
        this.data.update(prev => (isReset ? newData : [...prev, ...newData]));
        if (newData.length > 0) this.currentPage++;
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => this.isLoading.set(false),
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