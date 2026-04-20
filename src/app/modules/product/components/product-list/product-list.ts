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
import { ProductService } from '../../services/product-service';
import { AppMessageService } from '../../../../core/services/message.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';
import { ImageCellRendererComponent } from '../../../shared/AgGrid/AgGridcomponents/image-cell-renderer/image-cell-renderer.component';
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
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
    RouterModule,
    AgShareGrid,
    Dialog,
    BulkProductEntry,
    HasPermissionDirective,
    ConfirmDialogModule,
    MasterDropdownComponent
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
  column = signal<any[]>([]);
  rowSelectionMode: any = 'single';
  isLoading = signal(false);

  brandOptions = signal<any[]>([]);
  categoryOptions = signal<any[]>([]);

  productFilter = signal({
    name: null as string | null,
    sku: null as string | null,
    brand: null as string | null,
    category: null as string | null,
  });

  patchProductFilter(key: 'name' | 'sku' | 'brand' | 'category', value: any) {
    this.productFilter.update((f) => ({ ...f, [key]: value }));
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
    this.productFilter.set({ name: null, sku: null, brand: null, category: null });
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

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
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

      // ═══════════════════════════════════════════════════════
      // GROUP 1 — PRODUCT DETAILS
      // ═══════════════════════════════════════════════════════
      {
        headerName: 'Product Details',
        children: [
          {
            field: 'images',
            headerName: '',
            width: 60,
            pinned: 'left',
            cellRenderer: ImageCellRendererComponent,
            valueGetter: (params: any) => params.data.images?.[0] || null,
            filter: false,
            sortable: false,
            suppressMenu: true,
            cellClass: 'cell-flex-center',
          },

          {
            field: 'name',
            headerName: 'Product Name',
            pinned: 'left',
            flex: 1.5,
            minWidth: 240,
            filter: 'agTextColumnFilter',
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              const name = params.data?.name || '—';
              const desc = params.data?.description || '';
              const isActive = params.data?.isActive;
              const isDeleted = params.data?.isDeleted;

              const avatar = this.getAvatarStyle(name);
              const initials = this.getInitials(name);

              const statusBadge = isDeleted
                ? `<span style="font-size:9.5px;font-weight:600;background:#FCEBEB;color:#791F1F;
                    padding:1px 6px;border-radius:3px;">Deleted</span>`
                : !isActive
                  ? `<span style="font-size:9.5px;font-weight:600;background:#F1EFE8;color:#444441;
                    padding:1px 6px;border-radius:3px;">Inactive</span>`
                  : '';

              return `
                <div style="display:flex;align-items:center;gap:9px;width:100%;min-width:0;overflow:hidden;padding:5px 0;">
                  <span style="
                    width:30px;height:30px;border-radius:6px;flex-shrink:0;
                    background:${avatar.background};color:${avatar.color};
                    display:inline-flex;align-items:center;justify-content:center;
                    font-size:9px;font-weight:700;letter-spacing:.02em;
                  ">${initials}</span>
                  <div style="min-width:0;flex:1;overflow:hidden;display:flex;flex-direction:column;gap:0;line-height:1.2;">
                    <div style="display:flex;align-items:center;min-width:0;overflow:hidden;line-height:1.3;">
                      <span style="font-size:12.5px;font-weight:600;color:var(--text-primary);
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;">${name}</span>
                      ${statusBadge
                  ? `<span style="flex-shrink:0;margin-left:5px;">${statusBadge}</span>`
                  : ''}
                    </div>
                    ${desc ? `<div style="font-size:10.5px;color:var(--text-tertiary);margin-top:1px;line-height:1.2;
                      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${desc}</div>` : ''}
                  </div>
                </div>`;
            },
            tooltipValueGetter: (p: any) => p.data?.name ?? '',
          },

          {
            field: 'sku',
            headerName: 'SKU',
            width: 140,
            pinned: 'left',
            filter: 'agTextColumnFilter',
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return `<span style="color:var(--text-tertiary)">—</span>`;
              return `<span style="
                font-family:var(--font-mono);font-size:11.5px;font-weight:700;
                color:#185FA5;background:#E6F1FB;
                padding:2px 7px;border-radius:4px;letter-spacing:.03em;
              ">${params.value}</span>`;
            },
          },
        ],
      },

      // ═══════════════════════════════════════════════════════
      // GROUP 2 — CLASSIFICATION
      // ═══════════════════════════════════════════════════════
      {
        headerName: 'Classification',
        children: [
          {
            field: 'brandId.name',
            headerName: 'Brand',
            width: 120,
            filter: 'agSetColumnFilter',
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              const brand = params.value;
              if (!brand) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
              return `<span style="
                font-size:11.5px;font-weight:600;
                background:#E6F1FB;color:#0C447C;
                padding:2px 8px;border-radius:4px;
                white-space:nowrap;
              ">${brand}</span>`;
            },
          },

          {
            field: 'categoryId.name',
            headerName: 'Category',
            width: 130,
            filter: 'agSetColumnFilter',
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              const val = params.value;
              if (!val) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
              return `<span style="font-size:12px;color:var(--text-secondary);font-weight:500;">${val}</span>`;
            },
          },

          {
            field: 'subCategoryId.name',
            headerName: 'Sub-Category',
            width: 140,
            hide: true,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              const val = params.value;
              if (!val) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
              return `<span style="font-size:12px;color:var(--text-secondary);">${val}</span>`;
            },
          },

          {
            field: 'unitId.code',
            headerName: 'Unit',
            width: 80,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              const val = params.value;
              if (!val) return `<span style="color:var(--text-tertiary)">—</span>`;
              return `<span style="
                font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
                background:#F1EFE8;color:#444441;padding:2px 7px;border-radius:4px;
              ">${val}</span>`;
            },
          },
        ],
      },

      // ═══════════════════════════════════════════════════════
      // GROUP 3 — PRICING & MARGINS
      // ═══════════════════════════════════════════════════════
      {
        headerName: 'Pricing & Margins',
        children: [
          {
            field: 'purchasePrice',
            headerName: 'Buy Price',
            width: 120,
            sortable: true,
            type: 'rightAligned',
            cellClass: 'cell-flex-end',
            cellRenderer: (params: any) => {
              const val = params.value ?? 0;
              return `<span style="
                font-family:var(--font-mono);font-size:12.5px;font-weight:600;
                color:var(--text-secondary);
              ">${this.formatCurrency(val)}</span>`;
            },
          },

          {
            field: 'sellingPrice',
            headerName: 'Sell Price',
            width: 120,
            sortable: true,
            type: 'rightAligned',
            cellClass: 'cell-flex-end',
            cellRenderer: (params: any) => {
              const val = params.value ?? 0;
              return `<span style="
                font-family:var(--font-mono);font-size:13px;font-weight:700;
                color:#27500A;
              ">${this.formatCurrency(val)}</span>`;
            },
          },

          {
            field: 'discountedPrice',
            headerName: 'Disc. Price',
            width: 120,
            sortable: true,
            type: 'rightAligned',
            cellClass: 'cell-flex-end',
            cellRenderer: (params: any) => {
              const disc = params.value;
              const sell = params.data?.sellingPrice ?? 0;
              if (!disc || disc >= sell) {
                return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
              }
              const saving = sell - disc;
              return this.twoLine(
                `<span style="font-family:var(--font-mono);font-size:12.5px;font-weight:600;color:#633806;">
                  ${this.formatCurrency(disc)}
                </span>`,
                `<span style="font-size:10px;color:#854F0B;">
                  save ${this.formatCurrency(saving)}
                </span>`,
                'text-align:right;',
                'text-align:right;',
              );
            },
          },

          {
            headerName: 'Margin',
            width: 110,
            sortable: true,
            type: 'rightAligned',
            cellClass: 'cell-flex-end',
            valueGetter: (params: any) => {
              const buy = params.data?.purchasePrice || 0;
              const sell = params.data?.sellingPrice || 0;
              if (sell === 0) return 0;
              return ((sell - buy) / sell) * 100;
            },
            cellRenderer: (params: any) => {
              const val: number = params.value || 0;
              if (val === 0) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;

              const isGood = val > 20;
              const isLow = val < 10;
              const color = isGood ? '#27500A' : isLow ? '#791F1F' : '#633806';
              const bg = isGood ? '#EAF3DE' : isLow ? '#FCEBEB' : '#FAEEDA';
              const arrow = isGood ? '↑' : isLow ? '↓' : '→';

              return `<span style="
                display:inline-flex;align-items:center;gap:3px;
                font-family:var(--font-mono);font-size:11.5px;font-weight:700;
                background:${bg};color:${color};
                padding:2px 7px;border-radius:4px;
              ">${arrow} ${val.toFixed(1)}%</span>`;
            },
          },

          {
            field: 'taxRate',
            headerName: 'Tax %',
            width: 95,
            type: 'rightAligned',
            cellClass: 'cell-flex-end',
            cellRenderer: (params: any) => {
              const val = params.value;
              if (!val && val !== 0) return `<span style="color:var(--text-tertiary)">—</span>`;
              const isInclusive = params.data?.isTaxInclusive;
              return this.twoLine(
                `<span style="font-family:var(--font-mono);font-size:12px;font-weight:600;
                  color:var(--text-secondary);">${val}%</span>`,
                isInclusive
                  ? `<span style="font-size:9.5px;color:#3B6D11;">incl.</span>`
                  : `<span style="font-size:9.5px;color:#854F0B;">excl.</span>`,
                'text-align:right;',
                'text-align:right;',
              );
            },
          },
        ],
      },

      // ═══════════════════════════════════════════════════════
      // GROUP 4 — INVENTORY & STATUS
      // ═══════════════════════════════════════════════════════
      {
        headerName: 'Inventory & Status',
        children: [
          {
            headerName: 'Total Stock',
            width: 120,
            sortable: true,
            type: 'rightAligned',
            cellClass: 'cell-flex-end',
            valueGetter: (params: any) => {
              if (!Array.isArray(params.data?.inventory)) return 0;
              return params.data.inventory.reduce(
                (sum: number, item: any) => sum + (item.quantity || 0), 0
              );
            },
            cellRenderer: (params: any) => {
              const stock = params.value ?? 0;
              const reorder = params.data?.inventory?.[0]?.reorderLevel ?? 10;
              const isOut = stock === 0;
              const isLow = stock > 0 && stock <= reorder;

              if (isOut) {
                return `<span style="
                  display:inline-flex;align-items:center;gap:4px;
                  font-family:var(--font-mono);font-size:12px;font-weight:700;
                  background:#FCEBEB;color:#791F1F;
                  padding:2px 8px;border-radius:4px;
                ">0 · out</span>`;
              }
              if (isLow) {
                return this.twoLine(
                  `<span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#633806;">
                    ${stock}
                  </span>`,
                  `<span style="font-size:9.5px;color:#854F0B;">low · reorder ${reorder}</span>`,
                  'text-align:right;',
                  'text-align:right;',
                );
              }
              return `<span style="
                font-family:var(--font-mono);font-size:13px;font-weight:700;
                color:var(--text-primary);
              ">${stock}</span>`;
            },
          },

          {
            field: 'defaultSupplierId.companyName',
            headerName: 'Supplier',
            width: 170,
            tooltipField: 'defaultSupplierId.contactPerson',
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              const name = params.value;
              if (!name) return `<span style="color:var(--text-tertiary);font-size:12px;">—</span>`;
              return `<span style="
                font-size:12px;font-weight:500;
                color:var(--text-secondary);
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
              ">${name}</span>`;
            },
          },

          {
            field: 'isActive',
            headerName: 'Status',
            width: 110,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              const isDeleted = params.data?.isDeleted;
              const isActive = params.value;
              if (isDeleted) {
                return `<span style="
                  display:inline-flex;align-items:center;gap:4px;
                  font-size:11px;font-weight:600;
                  background:#FCEBEB;color:#791F1F;
                  padding:3px 8px;border-radius:4px;
                "><span style="width:5px;height:5px;border-radius:50%;background:#A32D2D;flex-shrink:0;display:inline-block;"></span>Deleted</span>`;
              }
              return isActive
                ? `<span style="
                    display:inline-flex;align-items:center;gap:4px;
                    font-size:11px;font-weight:600;
                    background:#EAF3DE;color:#27500A;
                    padding:3px 8px;border-radius:4px;
                  "><span style="width:5px;height:5px;border-radius:50%;background:#3B6D11;flex-shrink:0;display:inline-block;"></span>Active</span>`
                : `<span style="
                    display:inline-flex;align-items:center;gap:4px;
                    font-size:11px;font-weight:600;
                    background:#F1EFE8;color:#444441;
                    padding:3px 8px;border-radius:4px;
                  "><span style="width:5px;height:5px;border-radius:50%;background:#888780;flex-shrink:0;display:inline-block;"></span>Inactive</span>`;
            },
          },

          {
            field: 'updatedAt',
            headerName: 'Last Updated',
            width: 150,
            sortable: true,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return `<span style="color:var(--text-tertiary)">—</span>`;
              return this.twoLine(
                this.common.formatDate(params.value, 'dd MMM yyyy'),
                this.common.formatDate(params.value, 'hh:mm a'),
                'font-size:12px;font-weight:500;color:var(--text-primary);',
                'font-size:10px;color:var(--text-tertiary);font-family:var(--font-mono);',
              );
            },
          },

          {
            field: 'createdAt',
            headerName: 'Created',
            width: 150,
            hide: true,
            cellClass: 'cell-flex-center',
            cellRenderer: (params: any) => {
              if (!params.value) return `<span style="color:var(--text-tertiary)">—</span>`;
              return this.twoLine(
                this.common.formatDate(params.value, 'dd MMM yyyy'),
                this.common.formatDate(params.value, 'hh:mm a'),
                'font-size:12px;font-weight:500;color:var(--text-primary);',
                'font-size:10px;color:var(--text-tertiary);font-family:var(--font-mono);',
              );
            },
          },
        ],
      },
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
