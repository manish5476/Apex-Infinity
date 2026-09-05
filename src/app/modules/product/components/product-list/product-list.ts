import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  effect,
  inject,
  signal,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';

import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProductService } from '../../services/product-service';
import { AppMessageService } from '../../../../core/services/message.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
import { DataGridComponent, GridColumn } from '@shared/ui/grid';
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { PageToolbarComponent } from '@shared/ui/layout/page-toolbar/page-toolbar.component';
import { Dialog } from "primeng/dialog";
import { BulkProductEntry } from "../bulk-product-entry/bulk-product-entry";
import { finalize, Subject } from 'rxjs';
import { HasPermissionDirective } from '../../../../core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { takeUntil } from "rxjs/operators";
import { DecimalPipe } from '@angular/common';
import { CommonMethodService } from '../../../../core/utils/common-method.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    SelectModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    RouterModule,
    DataGridComponent,
    Dialog,
    BulkProductEntry,
    HasPermissionDirective,
    ConfirmDialogModule,
    MasterDropdownComponent,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent
  ],
  providers: [ConfirmationService, DecimalPipe],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private productService = inject(ProductService);
  private messageService = inject(AppMessageService);
  // private masterList = inject(MasterListService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmationService = inject(ConfirmationService);
  private common = inject(CommonMethodService);
  private decimalPipe = inject(DecimalPipe);

  PERMISSIONS = PERMISSIONS;

  selectedRows = signal<any[]>([]);
  private gridApi!: GridApi;
  private currentPage = 1;
  private totalCount = 0;
  private pageSize = 50;
  bulkDialogVisible = signal(false);
  @ViewChild('fileInput') fileInput!: ElementRef;
  data = signal<any[]>([]);
  column = signal<GridColumn[]>([]);
  rowSelectionMode: any = 'single';
  isLoading = signal(false);

  productFilter = signal({
    name: null as string | null,
    sku: null as string | null,
    // Backend expects ObjectId fields (Product schema): brandId, categoryId
    brandId: null as string | null,
    categoryId: null as string | null,
    subCategoryId: null as string | null,
    unitId: null as string | null,
    // Backend expects boolean, ApiFeatures will coerce "true"/"false"
    isActive: null as boolean | null,
  });

  patchProductFilter(
    key: 'name' | 'sku' | 'brandId' | 'categoryId' | 'subCategoryId' | 'unitId' | 'isActive',
    value: any
  ) {
    this.productFilter.update((f) => {
      // If category changes, subCategory should reset (dependent dropdown)
      if (key === 'categoryId') {
        return { ...f, categoryId: value, subCategoryId: null };
      }
      return { ...f, [key]: value };
    });
  }

  constructor() {
    // effect(() => {
    //   this.brandOptions.set(this.masterList.brands());
    //   this.categoryOptions.set(this.masterList.categories());
    // });
  }

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.productFilter.set({
      name: null,
      sku: null,
      brandId: null,
      categoryId: null,
      subCategoryId: null,
      unitId: null,
      isActive: null,
    });
    this.getData(true);
  }

  getData(isReset: boolean = false) {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    if (isReset) {
      this.currentPage = 1;
      this.data.set([]);
      this.totalCount = 0;
    }

    const filterParams = {
      ...this.productFilter(),
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.productService.getAllProducts(filterParams)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }), takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          let newData: any[] = [];

          // 1. EXTRACT DATA
          // Structure is: root -> data -> data (array)
          if (res.data && Array.isArray(res.data.data)) {
            newData = res.data.data;
          }

          // 2. EXTRACT PAGINATION
          // Structure is: root -> pagination -> totalResults
          if (res.pagination) {
            this.totalCount = res.pagination.totalResults;
          }

          // 3. UPDATE LOCAL STATE
          const base = isReset ? [] : this.data();
          const merged = [...base, ...newData];
          this.data.set(merged);

          // 4. UPDATE GRID
          if (this.gridApi) {
            if (isReset) {
              // If resetting, replace all data
              this.gridApi.setGridOption('rowData', merged);
            } else {
              // If appending (scrolling), just add new rows
              this.gridApi.applyTransaction({ add: newData });
            }
          }

          this.currentPage++;
        },
        error: (err: any) => {
          // Replaced console.error and manual toast with global handler
          this.messageService.handleHttpError(err);
        }
      });
  }

  onScrolledToBottom(event: any) {
    if (!this.isLoading() && this.data().length < this.totalCount) {
      this.getData(false);
    }
  }

  onGridReady() {
    // gridApi no longer used directly with DataGridComponent
  }

  eventFromGrid(event: any) {
    console.log(event);
    if (event.type === 'cellClicked' && event.field === 'name') {
      const productId = event.row._id;
      if (productId) {
        this.router.navigate([productId], { relativeTo: this.route });
      }
    }
    console.log(event);
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom(event)
    }
    if (event.type === 'selectionChanged') {
      this.selectedRows.set(event.rows ?? []);
    }
  }

  deleteProduct() {
    const rows = this.selectedRows();
    if (!rows?.length || rows.length !== 1) return;
    const productId = rows[0]._id;
    const productName = rows[0].name;

    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${productName}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.productService.deleteProductById(productId).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.messageService.showSuccess('Product deleted successfully');
            this.selectedRows.set([]);
            this.getData(true);
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }

  triggerUpload() {
    const rows = this.selectedRows();
    if (rows?.length === 1) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    const rows = this.selectedRows();
    if (!files?.length || rows.length !== 1) return;

    const productId = rows[0]._id;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }

    this.isLoading.set(true);
    this.productService.uploadProductFile(productId, formData)
      .pipe(finalize(() => {
        this.isLoading.set(false);
      }), takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.messageService.showSuccess('Images uploaded successfully.');
          this.getData(true);
        },
        error: (err: any) => {
          this.messageService.handleHttpError(err);
        }
      });
  }
  getColumn(): void {
    this.column.set([
      {
        field: 'images',
        header: '',
        width: '60px',
        pinned: 'left',
        formatter: (val: any, row: any) => {
          const img = row.images?.[0];
          return img ? `<img src="${img}" style="width:30px;height:30px;border-radius:4px;object-fit:cover;" />` : `<div style="width:30px;height:30px;border-radius:4px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;"><i class="pi pi-image" style="color:#ccc"></i></div>`;
        }
      },
      {
        field: 'name',
        header: 'Product Name',
        pinned: 'left',
        flex: 1.5,
        minWidth: '240px',
        formatter: (val: any, row: any) => {
          const name = row?.name || '—';
          const desc = row?.description || '';
          const isActive = row?.isActive;
          const isDeleted = row?.isDeleted;
          const avatar = this.getAvatarStyle(name);
          const initials = this.getInitials(name);
          const statusBadge = isDeleted
            ? `<span style="font-size:9.5px;font-weight:600;background:#FCEBEB;color:#791F1F;padding:1px 6px;border-radius:3px;">Deleted</span>`
            : !isActive
              ? `<span style="font-size:9.5px;font-weight:600;background:#F1EFE8;color:#444441;padding:1px 6px;border-radius:3px;">Inactive</span>`
              : '';

          return `
            <div style="display:flex;align-items:center;gap:9px;width:100%;min-width:0;overflow:hidden;padding:5px 0;">
              <span style="width:30px;height:30px;border-radius:6px;flex-shrink:0;background:${avatar.background};color:${avatar.color};display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;letter-spacing:.02em;">${initials}</span>
              <div style="min-width:0;flex:1;overflow:hidden;display:flex;flex-direction:column;gap:0;line-height:1.2;">
                <div style="display:flex;align-items:center;min-width:0;overflow:hidden;line-height:1.3;">
                  <span style="font-size:12.5px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;">${name}</span>
                  ${statusBadge ? `<span style="flex-shrink:0;margin-left:5px;">${statusBadge}</span>` : ''}
                </div>
                ${desc ? `<div style="font-size:10.5px;color:var(--text-tertiary);margin-top:1px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${desc}</div>` : ''}
              </div>
            </div>`;
        }
      },
      {
        field: 'sku',
        header: 'SKU',
        width: '140px',
        pinned: 'left',
        formatter: (val: any) => {
          if (!val) return `<span style="color:var(--text-tertiary)">—</span>`;
          return `<span style="font-family:var(--font-mono);font-size:11.5px;font-weight:700;color:#185FA5;background:#E6F1FB;padding:2px 7px;border-radius:4px;letter-spacing:.03em;">${val}</span>`;
        }
      },
      {
        field: 'brandId.name',
        header: 'Brand',
        width: '120px',
        formatter: (val: any) => {
          if (!val) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
          return `<span style="font-size:11.5px;font-weight:600;background:#E6F1FB;color:#0C447C;padding:2px 8px;border-radius:4px;white-space:nowrap;">${val}</span>`;
        }
      },
      {
        field: 'categoryId.name',
        header: 'Category',
        width: '130px',
        formatter: (val: any) => {
          if (!val) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
          return `<span style="font-size:12px;color:var(--text-secondary);font-weight:500;">${val}</span>`;
        }
      },
      {
        field: 'subCategoryId.name',
        header: 'Sub-Category',
        width: '140px',
        visible: false,
        formatter: (val: any) => {
          if (!val) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
          return `<span style="font-size:12px;color:var(--text-secondary);">${val}</span>`;
        }
      },
      {
        field: 'unitId.code',
        header: 'Unit',
        width: '80px',
        formatter: (val: any) => {
          if (!val) return `<span style="color:var(--text-tertiary)">—</span>`;
          return `<span style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;background:#F1EFE8;color:#444441;padding:2px 7px;border-radius:4px;">${val}</span>`;
        }
      },
      {
        field: 'purchasePrice',
        header: 'Buy Price',
        width: '120px',
        type: 'currency',
        align: 'right'
      },
      {
        field: 'sellingPrice',
        header: 'Sell Price',
        width: '120px',
        type: 'currency',
        align: 'right',
        cellClass: () => 'text-success font-bold'
      },
      {
        field: 'discountedPrice',
        header: 'Disc. Price',
        width: '120px',
        align: 'right',
        formatter: (val: any, row: any) => {
          const disc = val;
          const sell = row?.sellingPrice ?? 0;
          if (!disc || disc >= sell) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
          const saving = sell - disc;
          return this.twoLine(
            `<span style="font-family:var(--font-mono);font-size:12.5px;font-weight:600;color:#633806;">${this.formatCurrency(disc)}</span>`,
            `<span style="font-size:10px;color:#854F0B;">save ${this.formatCurrency(saving)}</span>`,
            'text-align:right;', 'text-align:right;'
          );
        }
      },
      {
        field: 'margin',
        header: 'Margin',
        width: '110px',
        align: 'right',
        formatter: (_val: any, row: any) => {
          const buy = row?.purchasePrice || 0;
          const sell = row?.sellingPrice || 0;
          if (sell === 0) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
          const margin = ((sell - buy) / sell) * 100;
          const isGood = margin > 20;
          const isLow = margin < 10;
          const color = isGood ? '#27500A' : isLow ? '#791F1F' : '#633806';
          const bg = isGood ? '#EAF3DE' : isLow ? '#FCEBEB' : '#FAEEDA';
          const arrow = isGood ? '↑' : isLow ? '↓' : '→';
          return `<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:11.5px;font-weight:700;background:${bg};color:${color};padding:2px 7px;border-radius:4px;">${arrow} ${margin.toFixed(1)}%</span>`;
        }
      },
      {
        field: 'taxRate',
        header: 'Tax %',
        width: '95px',
        align: 'right',
        formatter: (val: any, row: any) => {
          if (!val && val !== 0) return `<span style="color:var(--text-tertiary)">—</span>`;
          const isInclusive = row?.isTaxInclusive;
          return this.twoLine(
            `<span style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--text-secondary);">${val}%</span>`,
            isInclusive ? `<span style="font-size:9.5px;color:#3B6D11;">incl.</span>` : `<span style="font-size:9.5px;color:#854F0B;">excl.</span>`,
            'text-align:right;', 'text-align:right;'
          );
        }
      },
      {
        field: 'stock',
        header: 'Total Stock',
        width: '120px',
        align: 'right',
        formatter: (_val: any, row: any) => {
          const stock = Array.isArray(row?.inventory) ? row.inventory.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) : 0;
          const reorder = row?.inventory?.[0]?.reorderLevel ?? 10;
          const isOut = stock === 0;
          const isLow = stock > 0 && stock <= reorder;

          if (isOut) {
            return `<span style="display:inline-flex;align-items:center;gap:4px;font-family:var(--font-mono);font-size:12px;font-weight:700;background:#FCEBEB;color:#791F1F;padding:2px 8px;border-radius:4px;">0 · out</span>`;
          }
          if (isLow) {
            return this.twoLine(
              `<span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#633806;">${stock}</span>`,
              `<span style="font-size:9.5px;color:#854F0B;">low · reorder ${reorder}</span>`,
              'text-align:right;', 'text-align:right;'
            );
          }
          return `<span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-primary);">${stock}</span>`;
        }
      },
      {
        field: 'defaultSupplierId.companyName',
        header: 'Supplier',
        width: '170px',
        formatter: (val: any) => {
          if (!val) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
          return `<span style="font-size:12px;font-weight:500;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${val}</span>`;
        }
      },
      {
        field: 'isActive',
        header: 'Status',
        width: '110px',
        formatter: (val: any, row: any) => {
          const isDeleted = row?.isDeleted;
          const isActive = val;
          if (isDeleted) {
            return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;background:#FCEBEB;color:#791F1F;padding:3px 8px;border-radius:4px;"><span style="width:5px;height:5px;border-radius:50%;background:#A32D2D;flex-shrink:0;display:inline-block;"></span>Deleted</span>`;
          }
          return isActive
            ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;background:#EAF3DE;color:#27500A;padding:3px 8px;border-radius:4px;"><span style="width:5px;height:5px;border-radius:50%;background:#3B6D11;flex-shrink:0;display:inline-block;"></span>Active</span>`
            : `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;background:#F1EFE8;color:#444441;padding:3px 8px;border-radius:4px;"><span style="width:5px;height:5px;border-radius:50%;background:#888780;flex-shrink:0;display:inline-block;"></span>Inactive</span>`;
        }
      },
      {
        field: 'updatedAt',
        header: 'Last Updated',
        width: '150px',
        formatter: (val: any) => {
          if (!val) return `<span style="color:var(--text-tertiary)">—</span>`;
          return this.twoLine(
            this.common.formatDate(val, 'dd MMM yyyy'),
            this.common.formatDate(val, 'hh:mm a'),
            'font-size:12px;font-weight:500;color:var(--text-primary);',
            'font-size:10px;color:var(--text-tertiary);font-family:var(--font-mono);'
          );
        }
      },
      {
        field: 'createdAt',
        header: 'Created',
        width: '150px',
        visible: false,
        formatter: (val: any) => {
          if (!val) return `<span style="color:var(--text-tertiary)">—</span>`;
          return this.twoLine(
            this.common.formatDate(val, 'dd MMM yyyy'),
            this.common.formatDate(val, 'hh:mm a'),
            'font-size:12px;font-weight:500;color:var(--text-primary);',
            'font-size:10px;color:var(--text-tertiary);font-family:var(--font-mono);'
          );
        }
      }
    ]);
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


  // ─────────────────────────────────────────────────────────────────────────
  // Cell Helpers
  // ─────────────────────────────────────────────────────────────────────────

  currencyFormatter(params: any) {
    if (params.value === null || params.value === undefined) return '-';
    return '₹ ' + params.value.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
