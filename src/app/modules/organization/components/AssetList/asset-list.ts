import { Component, OnInit, inject, signal, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

// PrimeNG Imports
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';

// Services
import { AssetsService } from '@core/services/assets.service';
import { AppMessageService } from '../../../../core/services/message.service';

// Layout Components
import { PageComponent } from '../../../../shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '../../../../shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '../../../../shared/ui/layout/page-content/page-content.component';

// Enterprise DataGrid
import { DataGridComponent } from '../../../../shared/ui/grid/dataGrid/data-grid.component';
import { SearchFilterComponent } from '../../../../shared/ui/filters/search-filter.component';
import { SelectFilterComponent } from '../../../../shared/ui/filters/select-filter.component';
import { DateFilterComponent } from '../../../../shared/ui/filters/date-filter.component';
import {
  GridColumn,
  GridRowAction,
  GridBulkAction,
  GridRowSaveEvent,
  GridContext,
} from '../../../../shared/ui/grid/grid-types';

export interface Asset {
  _id: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  category: string;
  uploadedBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
  metadata?: Record<string, any>;
}

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    ConfirmDialogModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    DataGridComponent,
    SearchFilterComponent,
    SelectFilterComponent,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page class="bg-[color-mix(in_srgb,var(--accent-primary)_2%,var(--bg-secondary))]">
      <app-page-header
        variant="transparent"
        density="compact"
        title="Media Vault"
        subtitle="Manage your organization's digital assets"
        class="!m-0 !mb-6">
        <div header-right class="flex items-center gap-3">
          <app-search-filter
            [value]="filters().search"
            (valueChange)="filters().search = $event; onSearchChange($event)">
          </app-search-filter>

          <app-select-filter
            [options]="categoryOptions"
            [value]="filters().category"
            placeholder="Category"
            (valueChange)="filters().category = $event; applyFilters()">
          </app-select-filter>

          <app-select-filter
            [options]="[{label:'Today', value:'today'}, {label:'Last 7 Days', value:'7d'}]"
            [value]="null"
            placeholder="Date">
          </app-select-filter>

          <app-select-filter
            [options]="[{label:'Me', value:'me'}, {label:'Anyone', value:'anyone'}]"
            [value]="null"
            placeholder="Owner">
          </app-select-filter>

          <p-button 
            icon="pi pi-times" 
            [text]="true"
            severity="secondary"
            pTooltip="Reset Filters"
            (onClick)="resetFilters()">
          </p-button>

          <p-button 
            label="Upload File" 
            icon="pi pi-upload" 
            (onClick)="triggerUpload()"
            styleClass="p-button-primary border-round-xl px-4 py-2 font-bold shadow-md">
          </p-button>
        </div>
      </app-page-header>

      <app-page-content [density]="'compact'" [fullWidth]="true">
        @if (stats()) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 px-6 mb-6">
          <div class="flex flex-col bg-primary border-1 border-secondary shadow-sm border-round-xl p-4 transition-all hover:shadow-md">
            <div class="text-tertiary text-sm font-medium mb-1">Storage Used</div>
            <div class="text-primary text-2xl font-bold">{{ stats().totalMB }} MB</div>
            <div class="text-green-500 text-xs font-semibold mt-1">+12% this month</div>
          </div>
          <div class="flex flex-col bg-primary border-1 border-secondary shadow-sm border-round-xl p-4 transition-all hover:shadow-md">
            <div class="text-tertiary text-sm font-medium mb-1">Total Files</div>
            <div class="text-primary text-2xl font-bold">{{ stats().totalFiles }}</div>
            <div class="text-tertiary text-xs mt-1">Images &bull; PDF &bull; Videos</div>
          </div>
          <div class="flex flex-col bg-primary border-1 border-secondary shadow-sm border-round-xl p-4 transition-all hover:shadow-md">
            <div class="text-tertiary text-sm font-medium mb-1">Categories</div>
            <div class="text-primary text-2xl font-bold">8</div>
            <div class="text-tertiary text-xs mt-1">Documents grouped</div>
          </div>
          <div class="flex flex-col bg-primary border-1 border-secondary shadow-sm border-round-xl p-4 transition-all hover:shadow-md">
            <div class="text-tertiary text-sm font-medium mb-1">Last Upload</div>
            <div class="text-primary text-2xl font-bold">Today</div>
            <div class="text-tertiary text-xs mt-1">3 files</div>
          </div>
        </div>
        }

        <div class="px-6 pb-6 flex-1 flex flex-col min-h-0">
          <!-- Wrapper Card for Datagrid -->
          <div class="flex flex-col flex-1 bg-primary border-round-2xl border-1 border-secondary shadow-sm overflow-hidden">
            @if (assets().length > 0 || loading()) {
              <app-data-grid
                gridId="asset-vault"
                dataKey="_id"
                class="flex-1 min-h-0"
                [data]="assets()"
                [columns]="columns"
                [rowSelection]="true"
                [multipleSelection]="true"
                [pagination]="true"
                [pageSize]="gridState().pageSize"
                [loading]="loading()"
                [rowActions]="rowActions"
                [bulkActions]="bulkActions"
                [enableExport]="true"
                [viewOnly]="true"
                [enableAdd]="false"
                [enableUndo]="false"
                [enableContextMenu]="true"
                [lazy]="true"
                [totalRecords]="totalRecords()"
                (pageChange)="onPageChange($event)"
                (pageSizeChange)="onPageSizeChange($event)"
                (sortChange)="onSortChange($event)"
                (searchChange)="onSearchChange($event)"
                (rowDelete)="onRowDelete($event)"
                (selectionChange)="onSelectionChange($event)"
                (refresh)="loadAssets()">
              </app-data-grid>
            } @else {
              <!-- Rich Empty State -->
              <div class="flex flex-col items-center justify-center flex-1 p-8 text-center bg-primary">
                <div class="text-6xl mb-4">📂</div>
                <h3 class="text-xl font-bold text-primary mb-2 m-0">No Assets Yet</h3>
                <p class="text-tertiary mb-6 max-w-sm m-0">Upload your first file to start building your media library.</p>
                <p-button 
                  label="Upload Files" 
                  icon="pi pi-upload" 
                  (onClick)="triggerUpload()"
                  styleClass="p-button-primary border-round-xl px-4 py-2 font-bold shadow-sm">
                </p-button>
              </div>
            }
          </div>
        </div>
      </app-page-content>
    </app-page>

    <p-toast></p-toast>
    <p-confirmDialog appendTo="body" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}">
    </p-confirmDialog>
  `,
})
export class AssetList implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // Services
  private assetService = inject(AssetsService);
  private appMessage = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);

  // State
  assets = signal<Asset[]>([]);
  selectedRows = signal<Asset[]>([]);
  loading = signal(false);
  totalRecords = signal<number>(0);
  stats = signal<any>(null);

  // Lazy Load State
  gridState = signal<{ page: number; pageSize: number; sort: string; search: string }>({
    page: 1,
    pageSize: 50,
    sort: '',
    search: '',
  });

  filters = signal<{ category: string | null; search: string }>({
    category: null,
    search: '',
  });

  categoryOptions = [
    { label: 'Chat Attachments', value: 'chat' },
    { label: 'Product Images', value: 'product' },
    { label: 'KYC Documents', value: 'kyc' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Avatars', value: 'avatar' },
  ];

  // ─── Column Definitions ─────────────────────────────────────────────────
  columns: GridColumn[] = [
    {
      field: 'thumbnail',
      header: 'Media',
      type: 'image',
      width: '80px',
      pinned: 'left',
      sortable: false,
      filterable: false,
      formatter: (value: string, row: any) => {
        const mimeType = row.mimeType || '';
        if (mimeType.startsWith('image/')) {
          return value; // Let the grid's image type handle it
        }
        return ''; // Will show file icon via formatter
      },
    },
    {
      field: 'fileName',
      header: 'File Details',
      type: 'text',
      width: '280px',
      sortable: true,
      filterable: true,
      searchable: true,
      formatter: (value: string, row: any) => {
        const ext = row.mimeType?.split('/')[1]?.toUpperCase() || 'FILE';
        const size = this.formatBytes(row.size);
        return `${value} (${ext} • ${size})`;
      },
    },
    {
      field: 'category',
      header: 'Category',
      type: 'select',
      options: this.categoryOptions,
      width: '140px',
      sortable: true,
      filterable: true,
    },
    {
      field: 'uploadedBy',
      header: 'Uploaded By',
      type: 'text',
      width: '200px',
      sortable: true,
      filterable: true,
      formatter: (value: any) => {
        return value?.name || 'System';
      },
    },
    {
      field: 'createdAt',
      header: 'Uploaded On',
      type: 'date',
      width: '170px',
      sortable: true,
      filterable: true,
    },
  ];

  // ─── Row Actions ────────────────────────────────────────────────────────
  rowActions: GridRowAction[] = [
    {
      id: 'download',
      icon: 'pi pi-download',
      label: 'Download',
      tooltip: 'Download file',
      variant: 'ghost',
      showWhen: 'hover',
      callback: (row: any) => {
        window.open(row['url'], '_blank');
      },
    },
    {
      id: 'preview',
      icon: 'pi pi-eye',
      label: 'Preview',
      tooltip: 'Preview file',
      variant: 'ghost',
      showWhen: 'hover',
      callback: (row: any) => {
        this.previewAsset(row as Asset);
      },
    },
  ];

  // ─── Bulk Actions ────────────────────────────────────────────────────────
  bulkActions: GridBulkAction[] = [
    {
      id: 'bulk-download',
      icon: 'pi pi-download',
      label: 'Download Selected',
      variant: 'primary',
      callback: (rows: any[], _ctx: GridContext) => {
        rows.forEach(row => window.open(row['url'], '_blank'));
        this.appMessage.showInfo(`Opening ${rows.length} files for download`);
      },
    },
    {
      id: 'bulk-delete',
      icon: 'pi pi-trash',
      label: 'Delete Selected',
      variant: 'danger',
      callback: (rows: any[], _ctx: GridContext) => {
        this.confirmBulkDelete(rows as Asset[]);
      },
    },
  ];

  // ─── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadAssets();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Load Assets ────────────────────────────────────────────────────────
  loadAssets(): void {
    this.loading.set(true);

    const state = this.gridState();
    const currentFilters = this.filters();

    const params = {
      page: state.page,
      limit: state.pageSize,
      sort: state.sort,
      search: state.search || currentFilters.search,
      category: currentFilters.category,
    };

    this.assetService.getAllAssets(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const data = res.data?.assets || res.data?.items || res.data || [];
          const total = res.data?.totalRecords ?? res.data?.total ?? res.totalRecords ?? data.length;

          // Map assets with additional display properties
          const mapped = data.map((asset: Asset) => ({
            ...asset,
            thumbnail: asset.url, // For image cell renderer
            displayName: asset.fileName,
          }));

          this.assets.set(mapped);
          this.totalRecords.set(total);
          this.selectedRows.set([]);
          this.loading.set(false);
        },
        error: (err) => {
          this.appMessage.handleHttpError(err);
          this.loading.set(false);
        },
      });
  }

  loadStats(): void {
    this.assetService.getMyAssetsStat()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.stats.set(res.data),
        error: (err) => this.appMessage.handleHttpError(err),
      });
  }

  // ─── Grid Event Handlers ────────────────────────────────────────────────
  onPageChange(event: any): void {
    this.gridState.update(s => ({ ...s, page: (event.page ?? 0) + 1, pageSize: event.pageSize }));
    this.loadAssets();
  }

  onPageSizeChange(pageSize: number): void {
    this.gridState.update(s => ({ ...s, page: 1, pageSize }));
    this.loadAssets();
  }

  onSortChange(sortData: any[]): void {
    const sortParams = sortData.map(s => `${s.field}:${s.direction}`).join(',');
    this.gridState.update(s => ({ ...s, sort: sortParams }));
    this.loadAssets();
  }

  onSearchChange(query: string): void {
    this.filters.update(f => ({ ...f, search: query }));
    this.gridState.update(s => ({ ...s, search: query, page: 1 }));
    this.loadAssets();
  }

  onSelectionChange(rows: any[]): void {
    this.selectedRows.set(rows as Asset[]);
  }

  // ─── Filter Actions ─────────────────────────────────────────────────────
  applyFilters(): void {
    this.gridState.update(s => ({ ...s, page: 1 }));
    this.loadAssets();
  }

  resetFilters(): void {
    this.filters.set({ category: null, search: '' });
    this.gridState.set({ page: 1, pageSize: 50, sort: '', search: '' });
    this.loadAssets();
  }

  // ─── Row Actions ────────────────────────────────────────────────────────
  onRowDelete(row: any): void {
    const asset = row as Asset;
    this.confirmationService.confirm({
      message: `Are you sure you want to permanently delete <b>${asset.fileName}</b>?<br><small class="text-tertiary">This action cannot be undone.</small>`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      accept: () => this.deleteAssets([asset]),
    });
  }

  confirmBulkDelete(rows: Asset[]): void {
    if (!rows.length) return;
    this.confirmationService.confirm({
      message: `Are you sure you want to permanently delete <b>${rows.length} files</b>?<br><small class="text-tertiary">This action cannot be undone.</small>`,
      header: 'Confirm Bulk Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      accept: () => this.deleteAssets(rows),
    });
  }

  private deleteAssets(assets: Asset[]): void {
    const ids = assets.map(a => a._id);

    this.loading.set(true);

    // Assuming bulk delete endpoint exists, otherwise loop through
    const deleteRequests = ids.map(id =>
      this.assetService.deleteAssetsId(id).pipe(takeUntil(this.destroy$))
    );

    // Use forkJoin for parallel deletes, or call bulk endpoint
    (this.assetService as any).bulkDeleteAssets?.(ids)?.pipe(takeUntil(this.destroy$))?.subscribe({
      next: (res: any) => {
        this.appMessage.showSuccess?.(res.message || `${ids.length} assets deleted successfully`);
        this.loadAssets();
        this.loadStats();
      },
      error: (err: any) => {
        this.appMessage.handleHttpError(err);
        this.loading.set(false);
      },
    }) ??
      // Fallback: Delete individually if no bulk endpoint
      ids.reduce((promise, id) =>
        promise.then(() =>
          this.assetService.deleteAssetsId(id).toPromise()
        ),
        Promise.resolve()
      ).then(() => {
        this.appMessage.showSuccess?.(`${ids.length} assets deleted successfully`);
        this.loadAssets();
        this.loadStats();
      }).catch(err => {
        this.appMessage.handleHttpError(err);
        this.loading.set(false);
      });
  }

  // ─── Upload & Preview ──────────────────────────────────────────────────
  triggerUpload(): void {
    // Implement your upload modal/dialog logic here
    this.appMessage.showInfo('Upload functionality coming soon');
  }

  previewAsset(asset: Asset): void {
    const mimeType = asset.mimeType;

    if (mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType === 'application/pdf') {
      // Open in new tab or modal preview
      window.open(asset.url, '_blank');
    } else {
      // Download for other file types
      const link = document.createElement('a');
      link.href = asset.url;
      link.download = asset.fileName;
      link.click();
    }
  }

  // ─── Utility Methods ────────────────────────────────────────────────────
  private formatBytes(bytes: number, decimals = 2): string {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}

// import { ChangeDetectorRef, Component, OnInit, inject, signal, OnDestroy } from '@angular/core';

// import { FormsModule } from '@angular/forms';
// import { finalize, Subject } from 'rxjs';
// import { GridApi, GridReadyEvent } from 'ag-grid-community';

// // --- PrimeNG ---
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ConfirmationService } from 'primeng/api';

// // --- Services & Components ---
// import { AssetsService } from '@core/services/assets.service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
// import { ImageCellRendererComponent } from '../../../shared/AgGrid/AgGridcomponents/image-cell-renderer/image-cell-renderer.component';
// import { takeUntil } from "rxjs/operators";

// @Component({
//   selector: 'app-asset-list',
//   standalone: true,
//   imports: [
//     FormsModule,
//     ButtonModule,
//     SelectModule,
//     InputTextModule,
//     ToastModule,
//     ConfirmDialogModule,
//     AgShareGrid
// ],
//   providers: [ConfirmationService],
//   templateUrl: './asset-list.html',
//   styleUrl: './asset-list.scss',
// })
// export class AssetList implements OnInit, OnDestroy {
//     private readonly destroy$ = new Subject<void>();
//   private cdr = inject(ChangeDetectorRef);
//   private assetService = inject(AssetsService);
//   private messageService = inject(AppMessageService);
//   private confirmationService = inject(ConfirmationService);

//   // Grid & State
//   private gridApi!: GridApi;
//   data: any[] = [];
//   column: any[] = [];
//   stats = signal<any>(null);
//   isLoading = false;

//   // Pagination & Filter
//   private currentPage = 1;
//   private pageSize = 50;
//   private totalCount = 0;
//   private hasNextPage = true;

//   assetFilter = {
//     category: null,
//     search: ''
//   };

//   categoryOptions = [
//     { label: 'Chat Attachments', value: 'chat' },
//     { label: 'Product Images', value: 'product' },
//     { label: 'KYC Documents', value: 'kyc' },
//     { label: 'Marketing', value: 'marketing' },
//     { label: 'Avatars', value: 'avatar' }
//   ];

//   ngOnInit(): void {
//     this.getColumn();
//     this.getData(true);
//     this.getStats();
//   }

//   // --- Grid Events ---

//   onGridReady(params: any) {
//     this.gridApi = params.api;
//   }

//   eventFromGrid(event: any) {
//     if (event.type === 'reachedBottom') {
//       this.onScrolledToBottom();
//     }
//   }

//   onScrolledToBottom() {
//     if (!this.isLoading && this.hasNextPage) {
//       this.getData(false);
//     }
//   }

//   applyFilters() {
//     this.getData(true);
//   }

//   resetFilters() {
//     this.assetFilter = { category: null, search: '' };
//     this.getData(true);
//   }

//   // --- Data Fetching ---

//   getStats() {
//     this.assetService.getMyAssetsStat().pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res) => this.stats.set(res.data),
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   getData(isReset: boolean = false) {
//     if (this.isLoading) return;
//     this.isLoading = true;

//     if (isReset) {
//       this.currentPage = 1;
//       this.data = [];
//       this.totalCount = 0;
//       this.hasNextPage = true;
//     }

//     const params = {
//       ...this.assetFilter,
//       page: this.currentPage,
//       limit: this.pageSize
//     };

//     this.assetService.getAllAssets(params)
//       .pipe(
//         finalize(() => {
//           this.isLoading = false;
//           this.cdr.markForCheck();
//         }), takeUntil(this.destroy$)
//       )
//       .subscribe({
//         next: (res: any) => {
//           const newData = res.data?.assets || [];
//           this.totalCount = res.total || 0;
//           this.data = isReset ? newData : [...this.data, ...newData];

//           this.hasNextPage = res.currentPage < res.totalPages;
//           if (this.hasNextPage && newData.length > 0) {
//             this.currentPage++;
//           }
//         },
//         error: (err) => {
//           this.messageService.handleHttpError(err);
//         }
//       });
//   }

//   // --- Actions ---

//   deleteAsset(id: string) {
//     this.confirmationService.confirm({
//       message: 'Are you sure you want to permanently delete this file? This action cannot be undone.',
//       header: 'Confirm Delete',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger p-button-text',
//       rejectButtonStyleClass: 'p-button-secondary p-button-text',
//       accept: () => {
//         this.assetService.deleteAssetsId(id).pipe(takeUntil(this.destroy$)).subscribe({
//           next: () => {
//             this.messageService.showSuccess('Asset deleted permanently');
//             this.getData(true);
//             this.getStats();
//           },
//           error: (err) => this.messageService.handleHttpError(err)
//         });
//       }
//     });
//   }

//   triggerUpload() {
//     // Placeholder for your upload logic
//     this.messageService.showInfo('Upload dialog triggered');
//   }

//   // --- Utility Formatting ---

//   private formatBytes(bytes: number, decimals = 2): string {
//     if (!+bytes) return '0 Bytes';
//     const k = 1024;
//     const dm = decimals < 0 ? 0 : decimals;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
//   }

//   private formatDate(dateStr: string): string {
//     if (!dateStr) return 'N/A';
//     return new Date(dateStr).toLocaleDateString('en-US', {
//       year: 'numeric', month: 'short', day: 'numeric',
//       hour: '2-digit', minute: '2-digit'
//     });
//   }

//   // --- Grid Columns ---
//   // ... Keep existing imports and logic above ...

//   getColumn(): void {
//     this.column = [
//       {
//         headerName: 'Media',
//         width: 80,
//         pinned: 'left',
//         filter: false,
//         sortable: false,
//         suppressMenu: true,
//         valueGetter: (params: any) => params.data?.url || null,
//         cellRendererSelector: (params: any) => {
//           const mime = params.data?.mimeType || '';
//           if (mime.startsWith('image/')) {
//             return { component: ImageCellRendererComponent };
//           }
//           return undefined;
//         },
//         cellRenderer: (p: any) => {
//           const container = document.createElement('div');
//           container.style.cssText = 'display: flex; align-items: center; justify-content: center; height: 100%;';

//           const isPdf = p.data?.mimeType === 'application/pdf';
//           const iconColor = isPdf ? 'var(--color-error)' : 'var(--text-secondary)';
//           const iconClass = isPdf ? 'pi pi-file-pdf' : 'pi pi-file';

//           container.innerHTML = `
//             <div style="width: 38px; height: 38px; flex-shrink: 0; border-radius: var(--ui-border-radius); background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-secondary); box-shadow: var(--shadow-sm);">
//               <i class="${iconClass}" style="color: ${iconColor}; font-size: 1.25rem;"></i>
//             </div>
//           `;
//           return container;
//         }
//       },
//       {
//         headerName: 'File Details',
//         flex: 2,
//         minWidth: 250,
//         valueGetter: (p: any) => p.data,
//         cellRenderer: (p: any) => `
//           <div style="display: flex; flex-direction: column; justify-content: center; height: 100%; padding-left: 8px;">
//             <span style="font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: var(--font-size-md); line-height: 1.2;">
//               ${p.value.fileName}
//             </span>
//             <span style="font-size: var(--font-size-sm); color: var(--text-tertiary); margin-top: 4px; line-height: 1; font-weight: 500;">
//               ${p.value.mimeType.split('/')[1]?.toUpperCase() || 'FILE'} • ${this.formatBytes(p.value.size)}
//             </span>
//           </div>
//         `
//       },
//       {
//         headerName: 'Category',
//         field: 'category',
//         width: 140,
//         cellRenderer: (p: any) => {
//           const themeMap: any = {
//             chat: 'var(--accent-primary)',
//             product: 'var(--color-success)',
//             kyc: 'var(--color-warning)',
//             avatar: 'var(--accent-secondary)',
//             marketing: 'var(--color-info)'
//           };
//           const color = themeMap[p.value] || 'var(--text-secondary)';

//           return `
//             <div style="display: flex; align-items: center; height: 100%;">
//               <span style="background: color-mix(in srgb, ${color} 12%, transparent); color: ${color}; padding: 4px 10px; border-radius: var(--ui-border-radius-pill); font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid color-mix(in srgb, ${color} 25%, transparent);">
//                 ${p.value}
//               </span>
//             </div>
//           `;
//         }
//       },
//       {
//         headerName: 'Uploaded By',
//         width: 200,
//         valueGetter: (p: any) => p.data.uploadedBy,
//         cellRenderer: (p: any) => `
//           <div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
//             <span style="font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); line-height: 1.2; display: flex; align-items: center; gap: 6px;">
//               <i class="pi pi-user" style="font-size: 0.75rem; color: var(--color-primary);"></i>${p.value?.name || 'System'}
//             </span>
//             <span style="font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1; padding-left: 18px;">
//               ${p.value?.email || 'N/A'}
//             </span>
//           </div>
//         `
//       },
//       {
//         headerName: 'Uploaded On',
//         field: 'createdAt',
//         width: 170,
//         cellRenderer: (p: any) => `
//           <div style="display: flex; align-items: center; height: 100%; font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: 500;">
//             <i class="pi pi-calendar" style="font-size: 0.85rem; margin-right: 8px; color: var(--text-tertiary);"></i>
//             ${this.formatDate(p.value)}
//           </div>
//         `
//       },
//       {
//         headerName: 'Actions',
//         width: 120,
//         pinned: 'right',
//         cellRenderer: (p: any) => {
//           const container = document.createElement('div');
//           container.style.cssText = 'display: flex; gap: 8px; align-items: center; justify-content: center; height: 100%;';

//           const dlBtn = document.createElement('button');
//           dlBtn.innerHTML = '<i class="pi pi-download"></i>';
//           dlBtn.className = 'p-button p-button-rounded p-button-text p-button-sm p-button-secondary';
//           dlBtn.style.cssText = 'width: 32px; height: 32px; color: var(--text-secondary);';
//           dlBtn.title = 'Download File';
//           dlBtn.onclick = () => window.open(p.data.url, '_blank');

//           const delBtn = document.createElement('button');
//           delBtn.innerHTML = '<i class="pi pi-trash"></i>';
//           delBtn.className = 'p-button p-button-rounded p-button-text p-button-sm p-button-danger';
//           delBtn.style.cssText = 'width: 32px; height: 32px; color: var(--color-error);';
//           delBtn.title = 'Delete Asset';
//           delBtn.onclick = () => this.deleteAsset(p.data._id);

//           container.appendChild(dlBtn);
//           container.appendChild(delBtn);
//           return container;
//         }
//       }
//     ];
//   }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//     }
// }
