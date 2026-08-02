import { ChangeDetectorRef, Component, OnInit, inject, signal, effect, ViewChild, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';

import { DataGridComponent, GridColumn } from '@shared/ui/grid';
import { AppMessageService } from '../../../../core/services/message.service';
import { EmiService } from '../../services/emi-service';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';

@Component({
  selector: 'app-emi-ledger',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    ButtonModule,
    DatePickerModule,
    SelectModule,
    ToastModule,
    DataGridComponent,
    MasterDropdownComponent
],
  providers: [EmiService],
  templateUrl: './emi-ledger.html',
  styleUrl: './emi-ledger.scss',
})
export class EmiLedger implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  private emiService = inject(EmiService);
  private messageService = inject(AppMessageService);

  @ViewChild(DataGridComponent) grid!: DataGridComponent;

  // Filters
  filter = {
    startDate: null as Date | null,
    endDate: null as Date | null,
    customerId: null as string | null
  };

  customerOptions = signal<any[]>([]);
  data: any[] = [];
  column: GridColumn[] = [];
  isLoading = false;

  constructor() {
    // effect(() => {
    //   this.customerOptions.set(this.masterList.customers());
    // });
  }

  ngOnInit(): void {
    this.getColumn();
    this.fetchLedger();
  }

  fetchLedger() {
    this.isLoading = true;
    
    // Convert dates to ISO string for API
    const params = {
      ...this.filter,
      startDate: this.filter.startDate ? this.filter.startDate.toISOString() : undefined,
      endDate: this.filter.endDate ? this.filter.endDate.toISOString() : undefined
    };

    this.emiService.getEmiLedgerReport(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.data = res.data || [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.messageService.handleHttpError(err);
        this.cdr.markForCheck();
      }
    });
  }

  applyFilters() {
    this.fetchLedger();
  }

  resetFilters() {
    this.filter = {
      startDate: null,
      endDate: null,
      customerId: null
    };
    this.fetchLedger();
  }

  exportLedger() {
    if (this.grid) {
      // DataGridComponent does not have exportDataAsCsv exposed directly in this way
      // but if the component has enableExport=true it handles it via UI
      this.messageService.showInfo('Use the grid toolbar to export.');
    }
  }

  eventFromGrid(event: any) {
  }

  private formatDate(d: any) {
    return d ? new Date(d).toLocaleDateString() : '—';
  }

  private formatCurrency(value: number): string {
    return value !== undefined && value !== null ? `₹ ${value.toFixed(2)}` : '₹ 0.00';
  }

  getColumn(): void {
    this.column = [
      {
        header: 'Date',
        field: 'date',
        width: '130px',
        sortable: true,
        formatter: (val: any) => this.formatDate(val)
      },
      {
        header: 'Account',
        field: 'accountId',
        width: '250px',
        formatter: (val: any, row: any) => `
          <div style="line-height:1.2">
            <div style="font-weight:600">${val || '—'}</div>
            <div style="font-size:11px;color:var(--text-secondary)">Code: ${row?.accountId?.code || '—'}</div>
          </div>
        `
      },
      {
        header: 'Description',
        field: 'description',
        flex: 1.5,
        minWidth: '200px',
        sortable: true,
        filterable: true
      },
      {
        header: 'Reference',
        field: 'referenceType',
        width: '150px',
        formatter: (val: any) => `
           <span style="background:var(--primary-light); color:var(--primary); padding:2px 8px; border-radius:12px; font-size:11px; font-weight:600; text-transform:uppercase">
            ${val?.replace('_', ' ')}
           </span>
        `
      },
      {
        header: 'Payment Info',
        field: 'paymentId',
        width: '180px',
        formatter: (val: any) => {
          if (!val) return '—';
          return `
            <div>
              <div style="font-weight:600">${this.formatCurrency(val.amount)}</div>
              <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase">${val.paymentMethod}</div>
            </div>
          `;
        }
      },
      {
        header: 'Debit',
        field: 'debit',
        width: '120px',
        align: 'right',
        sortable: true,
        formatter: (val: any) => val ? this.formatCurrency(val) : '',
        cellClass: () => 'text-error font-bold'
      },
      {
        header: 'Credit',
        field: 'credit',
        width: '120px',
        align: 'right',
        sortable: true,
        formatter: (val: any) => val ? this.formatCurrency(val) : '',
        cellClass: () => 'text-success font-bold'
      }
    ];
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
