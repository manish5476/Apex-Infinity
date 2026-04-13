import { Component, OnInit, inject, signal, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { ProductService } from '../../services/product-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
import { ButtonModule } from 'primeng/button';
import { finalize, Subject } from 'rxjs';
import { ImageCellRendererComponent } from '../../../shared/AgGrid/AgGridcomponents/image-cell-renderer/image-cell-renderer.component';
import { RouterModule } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';

@Component({
  selector: 'app-low-stock-report',
  standalone: true,
  imports: [AgShareGrid, ButtonModule, RouterModule],
  providers: [DecimalPipe],
  templateUrl: './low-stock-report.html',
  styleUrls: ['./low-stock-report.scss'],
})
export class LowStockReportComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  private productService = inject(ProductService);
  private messageService = inject(AppMessageService);
  private cdr = inject(ChangeDetectorRef);
  private decimalPipe = inject(DecimalPipe);

  isLoading = signal(true);
  data: any[] = [];
  columns: any[] = [];

  readonly actionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: false,
    showDelete: false,
    viewPermission: PERMISSIONS.PRODUCT.READ,
  };

  ngOnInit() {
    this.columns = this.buildColumns();
    this.loadData();
  }

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

      // ── Image ─────────────────────────────────────────────────────────────
      {
        field: 'image',
        headerName: '',
        width: 56,
        pinned: 'left',
        cellRenderer: ImageCellRendererComponent,
        valueGetter: (params: any) => params.data?.image || params.data?.images?.[0] || null,
        filter: false,
        sortable: false,
        suppressMenu: true,
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' },
      },

      // ── Product Name ───────────────────────────────────────────────────────
      {
        field: 'name',
        headerName: 'Product',
        pinned: 'left',
        flex: 1,
        minWidth: 230,
        filter: 'agTextColumnFilter',
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        cellRenderer: (params: any) => {
          const name = params.data?.name || '—';
          const sku = params.data?.sku || '';
          const avatar = this.getAvatarStyle(name);
          const initials = this.getInitials(name);

          return `
            <div style="display:flex;align-items:center;gap:9px;width:100%;min-width:0;overflow:hidden;padding:5px 0;">
              <span style="
                width:30px;height:30px;border-radius:6px;flex-shrink:0;
                background:${avatar.background};color:${avatar.color};
                display:inline-flex;align-items:center;justify-content:center;
                font-size:9px;font-weight:700;letter-spacing:.02em;
              ">${initials}</span>
              <div style="min-width:0;flex:1;overflow:hidden;display:flex;flex-direction:column;gap:0;line-height:1.2;">
                <div style="font-size:12.5px;font-weight:600;color:var(--text-primary);
                  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;">${name}</div>
                ${sku ? `<div style="font-size:10.5px;color:var(--text-tertiary);margin-top:1px;
                  font-family:var(--font-mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;">${sku}</div>` : ''}
              </div>
            </div>`;
        },
        tooltipValueGetter: (p: any) => p.data?.name ?? '',
      },

      // ── Category ──────────────────────────────────────────────────────────
      {
        field: 'categoryId.name',
        headerName: 'Category',
        width: 140,
        filter: 'agSetColumnFilter',
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 10px' },
        cellRenderer: (params: any) => {
          const val = params.value || params.data?.categoryId?.name;
          if (!val) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
          return `<span style="font-size:12px;font-weight:500;color:var(--text-secondary);">${val}</span>`;
        },
      },

      // ── Branch ────────────────────────────────────────────────────────────
      {
        field: 'branchId.name',
        headerName: 'Branch',
        width: 140,
        filter: 'agSetColumnFilter',
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 10px' },
        cellRenderer: (params: any) => {
          const val = params.value || params.data?.branchName || params.data?.branch?.name;
          if (!val) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
          return `<span style="
            font-size:11.5px;font-weight:500;
            background:#EEEDFE;color:#3C3489;
            padding:2px 8px;border-radius:4px;white-space:nowrap;
          ">${val}</span>`;
        },
      },

      // ── Supplier ──────────────────────────────────────────────────────────
      {
        field: 'defaultSupplierId.companyName',
        headerName: 'Supplier',
        width: 160,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        cellRenderer: (params: any) => {
          const val = params.value || params.data?.supplierName;
          if (!val) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
          return `<span style="font-size:12px;color:var(--text-secondary);
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${val}</span>`;
        },
        tooltipValueGetter: (p: any) => p.data?.defaultSupplierId?.contactPerson ?? '',
      },

      // ── Reorder Level ─────────────────────────────────────────────────────
      {
        field: 'reorderLevel',
        headerName: 'Reorder Level',
        width: 140,
        sortable: true,
        type: 'rightAligned',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 12px' },
        cellRenderer: (params: any) => {
          const val = params.value ?? params.data?.inventory?.[0]?.reorderLevel ?? 0;
          return `<span style="
            font-family:var(--font-mono);font-size:12.5px;font-weight:600;
            color:var(--text-secondary);
          ">${val}</span>`;
        },
      },

      // ── Current Stock ─────────────────────────────────────────────────────
      {
        field: 'currentStock',
        headerName: 'Current Stock',
        width: 145,
        sortable: true,
        type: 'rightAligned',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 12px' },
        cellRenderer: (params: any) => {
          const stock = params.value ?? params.data?.inventory?.[0]?.quantity ?? 0;
          const reorder = params.data?.reorderLevel ?? params.data?.inventory?.[0]?.reorderLevel ?? 10;
          const isOut = stock === 0;

          if (isOut) {
            return `<span style="
              display:inline-flex;align-items:center;gap:5px;
              font-family:var(--font-mono);font-size:12px;font-weight:700;
              background:#FCEBEB;color:#791F1F;
              padding:3px 10px;border-radius:4px;
            ">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;">
                <path d="M8 2L14.9 14H1.1L8 2z" stroke="#791F1F" stroke-width="1.5"/>
                <line x1="8" y1="7" x2="8" y2="10" stroke="#791F1F" stroke-width="1.5"/>
                <circle cx="8" cy="12.5" r="0.8" fill="#791F1F"/>
              </svg>
              Out of stock
            </span>`;
          }

          return this.twoLine(
            `<span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#791F1F;">${stock}</span>`,
            `<span style="font-size:9.5px;color:#854F0B;">reorder at ${reorder}</span>`,
            'text-align:right;',
            'text-align:right;',
          );
        },
      },

      // ── Gap (shortage) ────────────────────────────────────────────────────
      {
        headerName: 'Shortage',
        width: 120,
        sortable: true,
        type: 'rightAligned',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 12px' },
        valueGetter: (params: any) => {
          const stock = params.data?.currentStock ?? params.data?.inventory?.[0]?.quantity ?? 0;
          const reorder = params.data?.reorderLevel ?? params.data?.inventory?.[0]?.reorderLevel ?? 0;
          return Math.max(0, reorder - stock);
        },
        cellRenderer: (params: any) => {
          const gap = params.value ?? 0;
          if (gap === 0) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
          return `<span style="
            font-family:var(--font-mono);font-size:12.5px;font-weight:700;
            color:#633806;
          ">− ${gap} units</span>`;
        },
      },

      // ── Sell Price ────────────────────────────────────────────────────────
      {
        field: 'sellingPrice',
        headerName: 'Sell Price',
        width: 120,
        sortable: true,
        type: 'rightAligned',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 12px' },
        cellRenderer: (params: any) => {
          const val = params.value ?? 0;
          if (!val) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
          return `<span style="
            font-family:var(--font-mono);font-size:12.5px;font-weight:600;
            color:var(--text-primary);
          ">${this.formatCurrency(val)}</span>`;
        },
      },

      // ── Estimated Loss ────────────────────────────────────────────────────
      {
        headerName: 'Est. Loss',
        width: 140,
        sortable: true,
        type: 'rightAligned',
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 12px' },
        valueGetter: (params: any) => {
          const gap = Math.max(0,
            (params.data?.reorderLevel ?? params.data?.inventory?.[0]?.reorderLevel ?? 0)
            - (params.data?.currentStock ?? params.data?.inventory?.[0]?.quantity ?? 0)
          );
          const price = params.data?.sellingPrice ?? 0;
          return gap * price;
        },
        cellRenderer: (params: any) => {
          const val = params.value ?? 0;
          if (!val) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
          return this.twoLine(
            `<span style="font-family:var(--font-mono);font-size:12.5px;font-weight:700;color:#791F1F;">
              ${this.formatCurrency(val)}
            </span>`,
            `<span style="font-size:9.5px;color:var(--text-tertiary);">potential revenue loss</span>`,
            'text-align:right;',
            'text-align:right;',
          );
        },
      },

      // ── Last Updated ──────────────────────────────────────────────────────
      {
        field: 'updatedAt',
        headerName: 'Last Updated',
        width: 145,
        sortable: true,
        cellStyle: { display: 'flex', alignItems: 'center', padding: '0 8px' },
        cellRenderer: (params: any) => {
          if (!params.value) return `<span style="color:var(--text-tertiary)">—</span>`;
          const date = new Date(params.value);
          const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          return this.twoLine(
            dateStr,
            timeStr,
            'font-size:12px;font-weight:500;color:var(--text-primary);',
            'font-size:10px;color:var(--text-tertiary);font-family:var(--font-mono);',
          );
        },
      },

    ];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Data
  // ─────────────────────────────────────────────────────────────────────────
  loadData() {
    this.isLoading.set(true);
    this.productService
      .getLowStockProducts()
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.cdr.detectChanges();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res: any) => {
          if (res?.data?.products) {
            this.data = res.data.products;
          } else if (Array.isArray(res?.data)) {
            this.data = res.data;
          } else {
            this.data = [];
          }
        },
        error: (err: any) => {
          this.messageService.handleHttpError(err);
        },
      });
  }

  refresh() {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  private formatCurrency(value: number): string {
    if (value === undefined || value === null) return '—';
    return '₹\u202F' + (this.decimalPipe.transform(value, '1.2-2') ?? '0.00');
  }

  private getAvatarStyle(name: string): { background: string; color: string } {
    const palettes = [
      { background: '#EAF3DE', color: '#27500A' },
      { background: '#E6F1FB', color: '#0C447C' },
      { background: '#FAEEDA', color: '#633806' },
      { background: '#EEEDFE', color: '#3C3489' },
      { background: '#FBEAF0', color: '#72243E' },
      { background: '#E1F5EE', color: '#085041' },
      { background: '#FCEBEB', color: '#791F1F' },
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