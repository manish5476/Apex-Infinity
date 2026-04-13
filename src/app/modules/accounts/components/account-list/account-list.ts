import { AppMessageService } from './../../../../core/services/message.service';
import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { DecimalPipe, CurrencyPipe } from '@angular/common';

// Services
import { AccountService } from '../../accounts';
import { MessageService } from 'primeng/api';

// Shared Components
import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface PillConfig {
  label: string;
  bg: string;
  color: string;
  dot?: string;
}

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [AgShareGrid],
  providers: [MessageService, DecimalPipe, CurrencyPipe],
  templateUrl: './account-list.html',
  styleUrls: ['./account-list.scss'],
})
export class AccountListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // ── DI ──────────────────────────────────────────────────────────────────
  private accountService = inject(AccountService);
  private messageService = inject(AppMessageService);
  private cdr = inject(ChangeDetectorRef);
  private decimalPipe = inject(DecimalPipe);

  // ── Grid State ───────────────────────────────────────────────────────────
  data: any[] = [];
  column: any[] = [];
  isLoading = false;

  readonly accountActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: false,
    showDelete: false,
    viewPermission: PERMISSIONS.ACCOUNT.READ,
  };

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.column = this.buildColumns();
    this.loadAccounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Data
  // ─────────────────────────────────────────────────────────────────────────
  loadAccounts(): void {
    this.isLoading = true;
    this.accountService
      .getAccounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.data = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.isLoading = false;
          this.messageService.handleHttpError(err);
          this.cdr.markForCheck();
        },
      });
  }

  handleGridEvent(_event: any) { }

  // ─────────────────────────────────────────────────────────────────────────
  // Column Definitions
  // ─────────────────────────────────────────────────────────────────────────
  private buildColumns(): any[] {
    return [

      // ── # ─────────────────────────────────────────────────────────────────
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

      // ── Code ─────────────────────────────────────────────────────────────
      {
        field: 'code',
        headerName: 'Code',
        width: 90,
        sortable: true,
        filter: true,
        pinned: 'left',
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        cellRenderer: (p: any) => {
          if (!p.value) return `<span style="color:var(--text-tertiary)">—</span>`;
          return `<span style="
            font-family:var(--font-mono);
            font-size:12px;
            font-weight:700;
            color:#185FA5;
            background:#E6F1FB;
            padding:2px 7px;
            border-radius:4px;
            letter-spacing:.03em;
          ">${p.value}</span>`;
        },
      },

      // ── Account Name ──────────────────────────────────────────────────────
      {
        field: 'name',
        headerName: 'Account Name',
        flex: 1,
        minWidth: 220,
        sortable: true,
        filter: true,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        cellRenderer: (p: any) => {
          const name = p.value || '—';
          const isGroup = p.data?.isGroup;
          const avatar = this.getAvatarStyle(name);
          const initials = this.getInitials(name);
          const groupBadge = isGroup
            ? `<span style="
                font-size:9.5px;font-weight:600;
                background:#EEEDFE;color:#3C3489;
                padding:1px 6px;border-radius:3px;
                letter-spacing:.03em;margin-left:6px;
                vertical-align:middle;
              ">GROUP</span>`
            : '';

          return `
            <div style="display:flex;align-items:center;gap:8px;min-width:0;padding:5px 0;">
              <span style="
                width:28px;height:28px;border-radius:50%;flex-shrink:0;
                background:${avatar.background};color:${avatar.color};
                display:inline-flex;align-items:center;justify-content:center;
                font-size:9px;font-weight:700;letter-spacing:.02em;
              ">${initials}</span>
              <div style="min-width:0;flex:1;overflow:hidden;">
                <div style="
                  font-size:12.5px;font-weight:500;color:var(--text-primary);
                  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                ">${name}${groupBadge}</div>
              </div>
            </div>`;
        },
        tooltipValueGetter: (p: any) => p.data?.name ?? '',
      },

      // ── Type ──────────────────────────────────────────────────────────────
      {
        field: 'type',
        headerName: 'Type',
        width: 130,
        sortable: true,
        filter: true,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 10px' },
        cellRenderer: (p: any) => {
          const type = (p.value || '').toLowerCase();
          const map: Record<string, PillConfig> = {
            asset: { label: 'Asset', bg: '#EAF3DE', color: '#27500A' },
            liability: { label: 'Liability', bg: '#FCEBEB', color: '#791F1F' },
            equity: { label: 'Equity', bg: '#EEEDFE', color: '#3C3489' },
            income: { label: 'Income', bg: '#E6F1FB', color: '#0C447C' },
            expense: { label: 'Expense', bg: '#FAEEDA', color: '#633806' },
          };
          const cfg = map[type] ?? { label: type || '—', bg: '#F1EFE8', color: '#444441' };
          return this.pill(cfg.label, cfg.bg, cfg.color);
        },
      },

      // ── Parent ────────────────────────────────────────────────────────────
      {
        field: 'parent',
        headerName: 'Parent',
        width: 150,
        sortable: false,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        cellRenderer: (p: any) => {
          const parent = p.data?.parent;
          if (!parent) {
            return `<span style="font-size:11px;color:var(--text-tertiary);font-style:italic;">Root account</span>`;
          }
          const name = parent?.name || (typeof parent === 'string' ? 'Has parent' : '—');
          return `<span style="
            font-size:11.5px;font-weight:500;
            color:var(--text-secondary);
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
          ">${name}</span>`;
        },
        tooltipValueGetter: (p: any) => p.data?.parent?.name ?? '',
      },

      // ── Debit ─────────────────────────────────────────────────────────────
      {
        field: 'debitTotal',
        headerName: 'Debit',
        width: 148,
        sortable: true,
        type: 'rightAligned',
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 8px',
        },
        cellRenderer: (p: any) => {
          const val = p.value ?? 0;
          return this.twoLine(
            `<span style="
              font-family:var(--font-mono);
              font-size:12.5px;font-weight:700;
              color:${val > 0 ? '#791F1F' : 'var(--text-tertiary)'};
            ">${this.formatCurrency(val)}</span>`,
            '',
            'text-align:right;',
            'text-align:right;',
          );
        },
      },

      // ── Credit ────────────────────────────────────────────────────────────
      {
        field: 'creditTotal',
        headerName: 'Credit',
        width: 148,
        sortable: true,
        type: 'rightAligned',
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 8px',
        },
        cellRenderer: (p: any) => {
          const val = p.value ?? 0;
          return this.twoLine(
            `<span style="
              font-family:var(--font-mono);
              font-size:12.5px;font-weight:700;
              color:${val > 0 ? '#27500A' : 'var(--text-tertiary)'};
            ">${this.formatCurrency(val)}</span>`,
            '',
            'text-align:right;',
            'text-align:right;',
          );
        },
      },

      // ── Balance ───────────────────────────────────────────────────────────
      {
        field: 'balance',
        headerName: 'Balance',
        width: 160,
        sortable: true,
        type: 'rightAligned',
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 8px',
        },
        cellRenderer: (p: any) => {
          const bal = p.value ?? 0;
          const rawBal = p.data?.rawBalance ?? 0;
          const isNeg = rawBal < 0;
          const color = isNeg ? '#791F1F' : '#27500A';
          const prefix = isNeg ? '−' : '+';

          // Show computed vs raw sub-line if they differ
          const computed = p.data?.computedBalance ?? 0;
          const showSub = Math.abs(computed - bal) > 0.01;

          return this.twoLine(
            `<span style="
              font-family:var(--font-mono);
              font-size:13px;font-weight:700;
              color:${color};
            ">${prefix} ${this.formatCurrency(Math.abs(bal))}</span>`,
            showSub
              ? `<span style="font-size:10px;color:var(--text-tertiary);">
                  Computed: ${this.formatCurrency(Math.abs(computed))}
                </span>`
              : '',
            'text-align:right;',
            'text-align:right;',
          );
        },
      },

      // ── Cached Balance ────────────────────────────────────────────────────
      {
        field: 'cachedBalance',
        headerName: 'Cached Balance',
        width: 190,
        sortable: true,
        type: 'rightAligned',
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 12px',
          gap: '8px',
        },
        cellRenderer: (p: any) => {
          const val = p.value ?? 0;
          const isStale = Math.abs(val - (p.data?.balance ?? 0)) > 0.01;
          const badge = isStale
            ? `<span style="
                display:inline-flex;align-items:center;
                font-size:10px;font-weight:600;
                color:#854F0B;background:#FAEEDA;
                padding:2px 7px;border-radius:4px;
                white-space:nowrap;line-height:15px;
                flex-shrink:0;
              ">⚠ stale</span>`
            : `<span style="
                display:inline-flex;align-items:center;
                font-size:10px;font-weight:600;
                color:#27500A;background:#EAF3DE;
                padding:2px 7px;border-radius:4px;
                white-space:nowrap;line-height:15px;
                flex-shrink:0;
              ">✓ synced</span>`;

          return `
            <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;width:100%;">
              <span style="
                font-family:var(--font-mono);
                font-size:12.5px;font-weight:600;
                color:var(--text-secondary);
                white-space:nowrap;
              ">${this.formatCurrency(val)}</span>
              ${badge}
            </div>`;
        },
      },

    ];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cell Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private twoLine(
    top: string,
    bottom: string,
    topStyle = 'font-size:12px;color:var(--text-primary);font-weight:500;',
    bottomStyle = 'font-size:10px;color:var(--text-tertiary);',
  ): string {
    return `
      <div style="display:flex;flex-direction:column;justify-content:center;gap:1px;
        line-height:1.25;overflow:hidden;">
        <span style="${topStyle}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${top}</span>
        ${bottom
        ? `<span style="${bottomStyle}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${bottom}</span>`
        : ''}
      </div>`;
  }

  private pill(label: string, bg: string, color: string, uppercase = false): string {
    return `<span style="
      display:inline-flex;align-items:center;
      padding:2px 8px;border-radius:4px;
      font-size:11px;font-weight:600;
      letter-spacing:${uppercase ? '.04em' : '.01em'};
      white-space:nowrap;line-height:16px;
      ${uppercase ? 'text-transform:uppercase;' : 'text-transform:capitalize;'}
      background:${bg};color:${color};">
      ${label}
    </span>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Utility
  // ─────────────────────────────────────────────────────────────────────────

  private formatCurrency(value: number): string {
    if (value === undefined || value === null) return '—';
    return '₹\u202F' + (this.decimalPipe.transform(value, '1.2-2') ?? '0.00');
  }

  /** Deterministic pastel avatar from name hash */
  private getAvatarStyle(name: string): { background: string; color: string } {
    const palettes: Array<{ background: string; color: string }> = [
      { background: '#EAF3DE', color: '#27500A' }, // green
      { background: '#E6F1FB', color: '#0C447C' }, // blue
      { background: '#FAEEDA', color: '#633806' }, // amber
      { background: '#EEEDFE', color: '#3C3489' }, // purple
      { background: '#FBEAF0', color: '#72243E' }, // pink
      { background: '#E1F5EE', color: '#085041' }, // teal
      { background: '#FCEBEB', color: '#791F1F' }, // red
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return palettes[Math.abs(hash) % palettes.length];
  }

  private getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }
}