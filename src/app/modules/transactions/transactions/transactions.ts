import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from "primeng/toast";
import { DatePickerModule } from 'primeng/datepicker';
import { CommonMethodService } from '../../../core/utils/common-method.service';
import { TransactionService } from '../transaction.service';
import { AgShareGrid } from "../../shared/components/ag-shared-grid";

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    DatePickerModule,
    AgShareGrid
  ],
  providers: [TransactionService],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class Transactions implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private transactionService = inject(TransactionService);
  public common = inject(CommonMethodService);

  // --- Grid & Data ---
  private gridApi!: GridApi;
  private currentPage = 1;
  private totalCount = 0;
  private pageSize = 50;

  data: any[] = [];
  column: any = [];

  // --- State ---
  viewMode = signal<'all' | 'mine'>('all');
  loading = signal(false);

  // --- Filter State ---
  rangeDates: Date[] | undefined;

  transactionTypes = [
    { label: 'Invoice', value: 'invoice' },
    { label: 'Payment', value: 'payment' },
    { label: 'Purchase', value: 'purchase' },
    { label: 'Journal', value: 'journal' },
    { label: 'EMI Payment', value: 'emi_payment' },
    { label: 'Opening Stock', value: 'opening_stock' }
  ];

  filterParams: any = {
    type: null,
    search: '',
  };

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  // --- Actions ---

  toggleViewMode(mode: 'all' | 'mine') {
    this.viewMode.set(mode);
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.filterParams = { type: null, search: '' };
    this.rangeDates = undefined;
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (this.loading()) return;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    this.loading.set(true);

    const queryParams: any = {
      ...this.filterParams,
      scope: this.viewMode(),
      page: this.currentPage,
      limit: this.pageSize,
    };

    if (this.rangeDates?.length) {
      const [start, end] = this.rangeDates;
      if (start) queryParams.startDate = this.formatDateForApi(start);
      if (end) queryParams.endDate = this.formatDateForApi(end);
    }

    this.common.apiCall(
      this.transactionService.getAllTransactions(queryParams),
      (res: any) => {
        this.loading.set(false);
        // API shape: { status, total, page, limit, results, data: { data: [...] } }
        const newData: any[] = res.data?.data ?? [];
        this.totalCount = res.total ?? this.totalCount;
        this.data = [...this.data, ...newData];
        if (newData.length > 0) this.currentPage++;
        this.cdr.markForCheck();
      },
      'Fetch Transactions'
    );
  }

  private formatDateForApi(date: Date): string {
    // Simple ISO string creation handling timezone offset roughly
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }

  downloadCsv() {
    // Implementation for CSV download using current filters
    console.log("Download CSV triggered");
  }

  // Grid Events
  eventFromGrid(event: any) {
    if (event.type === 'reachedBottom' && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }
  getColumn(): void {
    this.column = [

      // ── Row Index ─────────────────────────────────────────────────────────
      {
        headerName: '#',
        valueGetter: 'node.rowIndex + 1',
        width: 48,
        sortable: false,
        filter: false,
        suppressHeaderMenuButton: true,
        pinned: 'left',
        cellStyle: {
          color: 'var(--text-tertiary)',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      },

      // ── Date ──────────────────────────────────────────────────────────────
      {
        field: 'date',
        headerName: 'Date',
        sortable: true,
        width: 150,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        cellRenderer: (p: any) => {
          if (p.node?.rowPinned || !p.value) return '—';
          return this.twoLine(
            this.common.formatDate(p.value, 'dd MMM yyyy'),
            this.common.formatDate(p.value, 'hh:mm a'),
            'font-size:12px;color:var(--text-primary);font-weight:500;',
            'font-size:10px;color:var(--text-tertiary);'
          );
        },
      },

      // ── Transaction Type ──────────────────────────────────────────────────
      // ── Transaction Type ──────────────────────────────────────────────────
      {
        field: 'type',
        headerName: 'Type',
        width: 140,
        sortable: true,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 10px' },
        cellRenderer: (p: any) => {
          if (p.node?.rowPinned) return '';
          const type = (p.value ?? 'unknown').toLowerCase();

          const typeMap: Record<string, { label: string; bg: string; color: string }> = {
            payment: { label: 'Payment', bg: 'var(--color-success-bg)', color: 'var(--color-success-dark)' },
            emi_payment: { label: 'EMI Payment', bg: 'var(--color-info-bg)', color: 'var(--color-info-dark)' },
            invoice: { label: 'Invoice', bg: 'var(--color-warning-bg)', color: 'var(--color-warning-dark)' },
            purchase: { label: 'Purchase', bg: 'var(--color-error-bg)', color: 'var(--color-error-dark)' },
            journal: { label: 'Journal', bg: 'var(--bg-secondary)', color: 'var(--text-secondary)' },
            credit_note: { label: 'Credit Note', bg: 'var(--color-error-bg)', color: 'var(--color-error-dark)' },
            opening_stock: { label: 'Opening Stock', bg: 'var(--bg-secondary)', color: 'var(--text-secondary)' },
          };

          const t = typeMap[type] ?? { label: p.value ?? 'Unknown', bg: 'var(--bg-secondary)', color: 'var(--text-secondary)' };

          return `<span style="
      display:inline-flex;align-items:center;
      padding:2px 8px;border-radius:4px;
      font-size:11px;font-weight:600;letter-spacing:0.02em;
      white-space:nowrap;line-height:16px;
      background:${t.bg};color:${t.color};">
      ${t.label}
    </span>`;
        },
      },

      // ── Effect ────────────────────────────────────────────────────────────
      {
        field: 'effect',
        headerName: 'Dr / Cr',
        width: 75,
        sortable: true,
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' },
        cellRenderer: (p: any) => {
          if (p.node?.rowPinned) return '';
          const effect = (p.value ?? '').toLowerCase();
          const isDr = effect === 'debit';
          const bg = isDr ? 'var(--color-error-bg)' : 'var(--color-success-bg)';
          const color = isDr ? 'var(--color-error-dark)' : 'var(--color-success-dark)';
          const label = isDr ? 'Dr' : 'Cr';
          return `<span style="
      display:inline-flex;align-items:center;
      padding:2px 7px;border-radius:4px;
      font-size:11px;font-weight:700;letter-spacing:0.04em;
      line-height:16px;font-family:var(--font-mono);
      background:${bg};color:${color};">
      ${label}
    </span>`;
        },
      },
      // ── Description ───────────────────────────────────────────────────────
      {
        field: 'description',
        headerName: 'Description',
        flex: 2,
        minWidth: 220,
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          fontSize: '13px',
          color: 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
        valueGetter: (p: any) => p.data?.description || 'System Entry',
        tooltipValueGetter: (p: any) => p.data?.description || 'System Entry',
      },

      // ── Party ─────────────────────────────────────────────────────────────
      {
        field: 'partyName',
        headerName: 'Party',
        flex: 1,
        minWidth: 170,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        cellRenderer: (p: any) => {
          if (p.node?.rowPinned) return '';
          const name = p.value;
          if (!name) {
            return `<span style="
            font-size:11px;font-style:italic;
            color:var(--text-tertiary);">
            System / Internal
          </span>`;
          }
          const avatar = this.common.getAvatarStyle(name);
          const initials = this.common.getInitials(name);
          return `
          <div style="display:flex;align-items:center;gap:7px;overflow:hidden;">
            <span style="
              width:24px;height:24px;border-radius:50%;flex-shrink:0;
              background:${avatar.background};color:${avatar.color};
              display:inline-flex;align-items:center;justify-content:center;
              font-size:8px;font-weight:700;">
              ${initials}
            </span>
            <span style="font-size:12px;font-weight:500;color:var(--text-primary);
              overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              ${name}
            </span>
          </div>`;
        },
        tooltipValueGetter: (p: any) => p.value ?? 'System / Internal',
      },

      // ── Debit ─────────────────────────────────────────────────────────────
      {
        field: 'debit',
        headerName: 'Debit',
        sortable: true,
        width: 140,
        type: 'rightAligned',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
        cellRenderer: (p: any) => {
          const val = p.value ?? 0;
          if (p.node?.rowPinned) {
            return `<span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--color-error-dark);">
            ${this.common.formatCurrency(val)}
          </span>`;
          }
          if (!val) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
          return `<span style="
          font-family:var(--font-mono);font-size:13px;font-weight:700;
          color:var(--color-error);">
          ${this.common.formatCurrency(val)}
        </span>`;
        },
      },

      // ── Credit ────────────────────────────────────────────────────────────
      {
        field: 'credit',
        headerName: 'Credit',
        sortable: true,
        width: 140,
        type: 'rightAligned',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
        cellRenderer: (p: any) => {
          const val = p.value ?? 0;
          if (p.node?.rowPinned) {
            return `<span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--color-success-dark);">
            ${this.common.formatCurrency(val)}
          </span>`;
          }
          if (!val) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
          return `<span style="
          font-family:var(--font-mono);font-size:13px;font-weight:700;
          color:var(--color-success);">
          ${this.common.formatCurrency(val)}
        </span>`;
        },
      },

      // ── Net Amount ────────────────────────────────────────────────────────
      {
        field: 'amount',
        headerName: 'Amount',
        sortable: true,
        width: 140,
        type: 'rightAligned',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' },
        cellRenderer: (p: any) => {
          const val = p.value ?? 0;
          const effect = (p.data?.effect ?? '').toLowerCase();
          if (p.node?.rowPinned) {
            return `<span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-primary);">
            ${this.common.formatCurrency(val)}
          </span>`;
          }
          const color = effect === 'debit' ? 'var(--color-error)' : 'var(--color-success)';
          const prefix = effect === 'debit' ? '+ ' : '- ';
          return this.twoLine(
            `<span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${color};">${prefix}${this.common.formatCurrency(val)}</span>`,
            `<span style="font-size:10px;color:var(--text-tertiary);">${effect === 'debit' ? 'outflow' : 'inflow'}</span>`,
          );
        },
      },

    ];

    this.cdr.detectChanges();
  }
  private badge(label: string, bg: string, color: string, border: string): string {
    return `<span style="
      background:${bg};
      color:${color};
      border:1px solid ${border};
      padding:1px 6px;
      border-radius:3px;
      font-size:10px;
      font-weight:700;
      letter-spacing:0.3px;
      text-transform:uppercase;
      white-space:nowrap;
      line-height:1.4;
      display:inline-block;">
      ${label}
    </span>`;
  }

  private twoLine(
    top: string,
    bottom: string,
    topStyle = 'font-size:11px;color:var(--text-secondary);',
    bottomStyle = 'font-size:10px;color:var(--text-tertiary);'
  ): string {
    return `
      <div style="
        display:flex;flex-direction:column;
        justify-content:center;gap:0px;
        line-height:1.25;overflow:hidden;">
        <span style="${topStyle}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${top}</span>
        <span style="${bottomStyle}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${bottom}</span>
      </div>`;
  }
}
