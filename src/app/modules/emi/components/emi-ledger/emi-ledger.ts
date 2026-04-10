import { ChangeDetectorRef, Component, OnInit, inject, signal, effect, ViewChild, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';

// Shared
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { EmiService } from '../../services/emi-service';
import { GridApi } from 'ag-grid-community';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

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
    AgShareGrid
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
  public masterList = inject(MasterListService);
  private gridApi!: GridApi;

  @ViewChild(AgShareGrid) grid!: AgShareGrid;

  // Filters
  filter = {
    startDate: null as Date | null,
    endDate: null as Date | null,
    customerId: null as string | null
  };

  customerOptions = signal<any[]>([]);
  data: any[] = [];
  column: any[] = [];
  isLoading = false;

  constructor() {
    effect(() => {
      this.customerOptions.set(this.masterList.customers());
    });
  }

  ngOnInit(): void {
    this.getColumn();
    this.fetchLedger();
  }

  fetchLedger() {
    this.isLoading = true;
    if (this.grid) this.grid.showLoadingOverlay();
    
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
        if (this.grid) this.grid.hideOverlay();
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading = false;
        if (this.grid) this.grid.hideOverlay();
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
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({
        fileName: `EMI_Ledger_${new Date().getTime()}.csv`
      });
      this.messageService.showSuccess('Ledger report exported successfully.');
    }
  }

  eventFromGrid(event: any) {
    if (event.type === 'init') {
      this.gridApi = event.api;
    }
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
        headerName: 'Date',
        field: 'date',
        width: 130,
        sortable: true,
        valueFormatter: (p: any) => this.formatDate(p.value)
      },
      {
        headerName: 'Account',
        field: 'accountId',
        width: 250,
        valueGetter: (p: any) => p.data.accountId?.name || '—',
        cellRenderer: (p: any) => `
          <div style="line-height:1.2">
            <div style="font-weight:600">${p.value}</div>
            <div style="font-size:11px;color:var(--text-secondary)">Code: ${p.data.accountId?.code || '—'}</div>
          </div>
        `
      },
      {
        headerName: 'Description',
        field: 'description',
        flex: 1.5,
        minWidth: 200,
        sortable: true,
        filter: true
      },
      {
        headerName: 'Reference',
        field: 'referenceType',
        width: 150,
        cellRenderer: (p: any) => `
           <span style="background:var(--primary-light); color:var(--primary); padding:2px 8px; border-radius:12px; font-size:11px; font-weight:600; text-transform:uppercase">
            ${p.value?.replace('_', ' ')}
           </span>
        `
      },
      {
        headerName: 'Payment Info',
        field: 'paymentId',
        width: 180,
        valueGetter: (p: any) => p.data.paymentId,
        cellRenderer: (p: any) => {
          if (!p.value) return '—';
          return `
            <div>
              <div style="font-weight:600">${this.formatCurrency(p.value.amount)}</div>
              <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase">${p.value.paymentMethod}</div>
            </div>
          `;
        }
      },
      {
        headerName: 'Debit',
        field: 'debit',
        width: 120,
        type: 'rightAligned',
        sortable: true,
        valueFormatter: (p: any) => p.value ? this.formatCurrency(p.value) : '',
        cellStyle: { color: 'var(--color-error)', fontWeight: 'bold' }
      },
      {
        headerName: 'Credit',
        field: 'credit',
        width: 120,
        type: 'rightAligned',
        sortable: true,
        valueFormatter: (p: any) => p.value ? this.formatCurrency(p.value) : '',
        cellStyle: { color: 'var(--color-success)', fontWeight: 'bold' }
      }
    ];
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
