import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { GridApi, GridReadyEvent } from 'ag-grid-community';

// --- PrimeNG ---
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

// --- Services & Components ---
import { AssetsService } from '@core/services/assets.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
import { ImageCellRendererComponent } from '../../../shared/AgGrid/AgGridcomponents/image-cell-renderer/image-cell-renderer.component';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule, 
    SelectModule,
    InputTextModule, 
    ToastModule, 
    ConfirmDialogModule,
    AgShareGrid
  ],
  providers: [ConfirmationService],
  templateUrl: './asset-list.html',
  styleUrl: './asset-list.scss',
})
export class AssetList implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private assetService = inject(AssetsService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);

  // Grid & State
  private gridApi!: GridApi;
  data: any[] = [];
  column: any[] = [];
  stats = signal<any>(null);
  isLoading = false;

  // Pagination & Filter
  private currentPage = 1;
  private pageSize = 50;
  private totalCount = 0;
  private hasNextPage = true;
  
  assetFilter = { 
    category: null, 
    search: '' 
  };

  categoryOptions = [
    { label: 'Chat Attachments', value: 'chat' },
    { label: 'Product Images', value: 'product' },
    { label: 'KYC Documents', value: 'kyc' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Avatars', value: 'avatar' }
  ];

  ngOnInit(): void {
    this.getColumn();
    this.getData(true);
    this.getStats();
  }

  // --- Grid Events ---

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  eventFromGrid(event: any) {
    if (event.type === 'reachedBottom') {
      this.onScrolledToBottom();
    }
  }

  onScrolledToBottom() {
    if (!this.isLoading && this.hasNextPage) {
      this.getData(false);
    }
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.assetFilter = { category: null, search: '' };
    this.getData(true);
  }

  // --- Data Fetching ---

  getStats() {
    this.assetService.getMyAssetsStat().subscribe({
      next: (res) => this.stats.set(res.data),
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
      this.hasNextPage = true;
    }

    const params = {
      ...this.assetFilter,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.assetService.getAllAssets(params)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res: any) => {
          const newData = res.data?.assets || [];
          this.totalCount = res.total || 0;
          this.data = isReset ? newData : [...this.data, ...newData];
          
          this.hasNextPage = res.currentPage < res.totalPages;
          if (this.hasNextPage && newData.length > 0) {
            this.currentPage++;
          }
        },
        error: (err) => {
          this.messageService.handleHttpError(err);
        }
      });
  }

  // --- Actions ---

  deleteAsset(id: string) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to permanently delete this file? This action cannot be undone.',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      accept: () => {
        this.assetService.deleteAssetsId(id).subscribe({
          next: () => {
            this.messageService.showSuccess('Asset deleted permanently');
            this.getData(true); 
            this.getStats();    
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }

  triggerUpload() {
    // Placeholder for your upload logic
    this.messageService.showInfo('Upload dialog triggered');
  }

  // --- Utility Formatting ---

  private formatBytes(bytes: number, decimals = 2): string {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // --- Grid Columns ---

  getColumn(): void {
    this.column = [
      {
        headerName: 'Media',
        width: 80,
        pinned: 'left',
        filter: false,
        sortable: false,
        suppressMenu: true,
        valueGetter: (params: any) => params.data?.url || null,
        cellRendererSelector: (params: any) => {
          const mime = params.data?.mimeType || '';
          if (mime.startsWith('image/')) {
            return { component: ImageCellRendererComponent };
          }
          return undefined; 
        },
        cellRenderer: (p: any) => {
          const container = document.createElement('div');
          container.style.cssText = 'display: flex; align-items: center; justify-content: center; height: 100%;';
          
          const isPdf = p.data?.mimeType === 'application/pdf';
          const iconColor = isPdf ? 'var(--color-error)' : 'var(--text-secondary)';
          const iconClass = isPdf ? 'pi pi-file-pdf' : 'pi pi-file';

          container.innerHTML = `
            <div style="width: 38px; height: 38px; flex-shrink: 0; border-radius: var(--ui-border-radius-sm); background: var(--bg-ternary); display: flex; align-items: center; justify-content: center; border: var(--ui-border-width) solid var(--border-secondary);">
              <i class="${iconClass}" style="color: ${iconColor}; font-size: 1.25rem;"></i>
            </div>
          `;
          return container;
        }
      },
      {
        headerName: 'File Details',
        flex: 2,
        minWidth: 250,
        valueGetter: (p: any) => p.data,
        cellRenderer: (p: any) => `
          <div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
            <span style="font-weight: var(--font-weight-bold); color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: var(--font-size-md); line-height: 1.2;">
              ${p.value.fileName}
            </span>
            <span style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: 4px; line-height: 1;">
              ${p.value.mimeType.split('/')[1]?.toUpperCase() || 'FILE'} • ${this.formatBytes(p.value.size)}
            </span>
          </div>
        `
      },
      {
        headerName: 'Category',
        field: 'category',
        width: 140,
        cellRenderer: (p: any) => {
          const themeMap: any = {
            chat: 'var(--accent-primary)',
            product: 'var(--color-success)',
            kyc: 'var(--color-warning)',
            avatar: 'var(--accent-secondary)',
            marketing: 'var(--color-info)'
          };
          const color = themeMap[p.value] || 'var(--text-secondary)';

          return `
            <div style="display: flex; align-items: center; height: 100%;">
              <span style="background: color-mix(in srgb, ${color} 15%, transparent); color: ${color}; padding: var(--spacing-xs) var(--spacing-md); border-radius: var(--ui-border-radius-pill); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.5px; border: var(--ui-border-width) solid color-mix(in srgb, ${color} 30%, transparent);">
                ${p.value}
              </span>
            </div>
          `;
        }
      },
      {
        headerName: 'Uploaded By',
        width: 200,
        valueGetter: (p: any) => p.data.uploadedBy,
        cellRenderer: (p: any) => `
          <div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
            <span style="font-size: var(--font-size-base); font-weight: var(--font-weight-medium); color: var(--text-primary); line-height: 1.2;">
              <i class="pi pi-user" style="font-size: var(--font-size-xs); margin-right: var(--spacing-xs); color: var(--text-tertiary);"></i>${p.value?.name || 'System'}
            </span>
            <span style="font-size: var(--font-size-sm); color: var(--text-tertiary); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1;">
              ${p.value?.email || 'N/A'}
            </span>
          </div>
        `
      },
      {
        headerName: 'Uploaded On',
        field: 'createdAt',
        width: 170,
        cellRenderer: (p: any) => `
          <div style="display: flex; align-items: center; height: 100%; font-size: var(--font-size-base); color: var(--text-secondary);">
            <i class="pi pi-calendar" style="font-size: var(--font-size-sm); margin-right: var(--spacing-sm); color: var(--text-tertiary);"></i>
            ${this.formatDate(p.value)}
          </div>
        `
      },
      {
        headerName: 'Actions',
        width: 120,
        pinned: 'right',
        cellRenderer: (p: any) => {
          const container = document.createElement('div');
          container.style.cssText = 'display: flex; gap: var(--spacing-md); align-items: center; justify-content: center; height: 100%;';

          const dlBtn = document.createElement('button');
          dlBtn.innerHTML = '<i class="pi pi-download"></i>';
          dlBtn.className = 'p-button p-button-rounded p-button-text p-button-sm p-button-secondary';
          dlBtn.style.cssText = 'width: 32px; height: 32px; color: var(--text-secondary);';
          dlBtn.title = 'Download File';
          dlBtn.onclick = () => window.open(p.data.url, '_blank');

          const delBtn = document.createElement('button');
          delBtn.innerHTML = '<i class="pi pi-trash"></i>';
          delBtn.className = 'p-button p-button-rounded p-button-text p-button-sm p-button-danger';
          delBtn.style.cssText = 'width: 32px; height: 32px; color: var(--color-error);';
          delBtn.title = 'Delete Asset';
          delBtn.onclick = () => this.deleteAsset(p.data._id);

          container.appendChild(dlBtn);
          container.appendChild(delBtn);
          return container;
        }
      }
    ];
  }
}

// import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { finalize } from 'rxjs';
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

// @Component({
//   selector: 'app-asset-list',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     FormsModule, 
//     ButtonModule, 
//     SelectModule,
//     InputTextModule, 
//     ToastModule, 
//     ConfirmDialogModule,
//     AgShareGrid
//   ],
//   providers: [ConfirmationService],
//   templateUrl: './asset-list.html',
//   styleUrl: './asset-list.scss',
// })
// export class AssetList implements OnInit {
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

//   onGridReady(params: GridReadyEvent) {
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
//     this.assetService.getMyAssetsStat().subscribe({
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
//         })
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
//       header: 'Delete Asset',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger p-button-text',
//       rejectButtonStyleClass: 'p-button-secondary p-button-text',
//       accept: () => {
//         this.assetService.deleteAssetsId(id).subscribe({
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

//           // Fixed 38px size to prevent grid row height stretching
//           container.innerHTML = `
//             <div style="width: 38px; height: 38px; flex-shrink: 0; border-radius: var(--ui-border-radius-sm); background: var(--bg-ternary); display: flex; align-items: center; justify-content: center; border: var(--ui-border-width) solid var(--border-secondary);">
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
//           <div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
//             <span style="font-weight: var(--font-weight-bold); color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: var(--font-size-md); line-height: 1.2;">
//               ${p.value.fileName}
//             </span>
//             <span style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: 4px; line-height: 1;">
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
//               <span style="background: color-mix(in srgb, ${color} 15%, transparent); color: ${color}; padding: var(--spacing-xs) var(--spacing-md); border-radius: var(--ui-border-radius-pill); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.5px; border: var(--ui-border-width) solid color-mix(in srgb, ${color} 30%, transparent);">
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
//             <span style="font-size: var(--font-size-base); font-weight: var(--font-weight-medium); color: var(--text-primary); line-height: 1.2;">
//               <i class="pi pi-user" style="font-size: var(--font-size-xs); margin-right: var(--spacing-xs); color: var(--text-tertiary);"></i>${p.value?.name || 'System'}
//             </span>
//             <span style="font-size: var(--font-size-sm); color: var(--text-tertiary); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1;">
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
//           <div style="display: flex; align-items: center; height: 100%; font-size: var(--font-size-base); color: var(--text-secondary);">
//             <i class="pi pi-calendar" style="font-size: var(--font-size-sm); margin-right: var(--spacing-sm); color: var(--text-tertiary);"></i>
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
//           container.style.cssText = 'display: flex; gap: var(--spacing-md); align-items: center; justify-content: center; height: 100%;';

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
// }

// // import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { ButtonModule } from 'primeng/button';
// // import { SelectModule } from 'primeng/select';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { ToastModule } from 'primeng/toast';
// // import { ImageModule } from 'primeng/image'; // For high-end preview
// // import { TooltipModule } from 'primeng/tooltip';
// // import { GridApi, GridReadyEvent } from 'ag-grid-community';
// // import { AppMessageService } from '../../../../core/services/message.service';
// // import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
// // import { AssetsService } from '@core/services/assets.service';
// // import { ConfirmationService } from '@core/services/confirmationService';

// // @Component({
// //   selector: 'app-asset-list',
// //   standalone: true,
// //   imports: [
// //     CommonModule, FormsModule, ButtonModule, SelectModule,
// //     InputTextModule, ToastModule, AgShareGrid, ImageModule, TooltipModule
// //   ],
// //   templateUrl: './asset-list.html',
// //   styleUrl: './asset-list.scss',
// // })
// // export class AssetList implements OnInit {
// //   private cdr = inject(ChangeDetectorRef);
// //   private assetService = inject(AssetsService);
// //   private messageService = inject(AppMessageService);
// //   private messageConfirmService = inject(ConfirmationService);

// //   // State
// //   data: any[] = [];
// //   column: any[] = [];
// //   stats = signal<any>(null);
// //   isLoading = false;

// //   // Pagination & Filter
// //   private currentPage = 1;
// //   private pageSize = 50;
// //   private hasNextPage = true;
// //   assetFilter = { category: null, search: '' };

// //   categoryOptions = [
// //     { label: 'Chat Attachments', value: 'chat' },
// //     { label: 'Product Images', value: 'product' },
// //     { label: 'KYC Documents', value: 'kyc' },
// //     { label: 'Marketing', value: 'marketing' },
// //     { label: 'Avatars', value: 'avatar' }
// //   ];

// //   ngOnInit(): void {
// //     this.getColumn();
// //     this.getData(true);
// //     this.getStats();
// //   }

// //   getStats() {
// //     this.assetService.getMyAssetsStat().subscribe({
// //       next: (res) => this.stats.set(res.data),
// //       error: (err) => this.messageService.handleHttpError(err)
// //     });
// //   }

// //   getData(isReset: boolean = false) {
// //     if (isReset) {
// //       this.currentPage = 1;
// //       this.data = [];
// //       this.hasNextPage = true;
// //     }

// //     if (this.isLoading || (!isReset && !this.hasNextPage)) return;
// //     this.isLoading = true;

// //     const params = {
// //       ...this.assetFilter,
// //       page: this.currentPage,
// //       limit: this.pageSize
// //     };

// //     this.assetService.getAllAssets(params).subscribe({
// //       next: (res: any) => {
// //         const newData = res.data?.assets || [];
// //         this.data = isReset ? newData : [...this.data, ...newData];
// //         this.hasNextPage = res.currentPage < res.totalPages;
// //         if (this.hasNextPage) this.currentPage++;

// //         this.isLoading = false;
// //         this.cdr.markForCheck();
// //       },
// //       error: (err) => {
// //         this.isLoading = false;
// //         this.messageService.handleHttpError(err);
// //       }
// //     });
// //   }

// //   deleteAsset(id: string) {
// //     // 1. Trigger the confirmation dialog
// //     this.messageConfirmService.confirm({
// //       header: 'Delete Asset?',
// //       message: 'Are you sure you want to permanently delete this file? This action cannot be undone.',
// //       icon: 'pi pi-trash',
// //       acceptLabel: 'Delete Now',
// //       rejectLabel: 'Keep File'
// //     }).subscribe((accepted: boolean) => {

// //       // 2. Only execute if user clicked 'Accept'
// //       if (accepted) {
// //         this.assetService.deleteAssetsId(id).subscribe({
// //           next: () => {
// //             this.messageService.showSuccess('Asset deleted permanently');
// //             this.getData(true); // Refresh Grid
// //             this.getStats();    // Refresh Storage Stats
// //           },
// //           error: (err) => this.messageService.handleHttpError(err)
// //         });
// //       }
// //     });
// //   }

// //  getColumn(): void {
// //   this.column = [

// //     /* ---------------- PREVIEW ---------------- */

// //     {
// //       headerName: '',
// //       width: 90,
// //       pinned: 'left',
// //       sortable: false,
// //       filter: false,
// //       cellRenderer: (p: any) => {

// //         const mime = p.data.mimeType || '';
// //         const thumb = p.data.url.replace('/upload/', '/upload/c_thumb,w_120/');

// //         if (mime.startsWith('image/')) {
// //           return `
// //           <div style="display:flex;align-items:center;justify-content:center;height:100%">
// //             <img src="${thumb}"
// //               style="
// //                 width:42px;
// //                 height:42px;
// //                 object-fit:cover;
// //                 border-radius:8px;
// //                 border:1px solid var(--border-secondary);
// //               "
// //             />
// //           </div>
// //           `;
// //         }

// //         const icon = mime.includes('pdf') ? 'pi-file-pdf' : 'pi-file';

// //         return `
// //         <div style="
// //           width:42px;
// //           height:42px;
// //           display:flex;
// //           align-items:center;
// //           justify-content:center;
// //           border-radius:8px;
// //           background:var(--bg-ternary);
// //           border:1px solid var(--border-secondary);
// //         ">
// //           <i class="pi ${icon}" style="font-size:16px;color:var(--text-secondary)"></i>
// //         </div>
// //         `;
// //       }
// //     },

// //     /* ---------------- FILE INFO ---------------- */

// //     {
// //       headerName: 'File',
// //       flex: 2,
// //       minWidth: 260,
// //       valueGetter: (p: any) => p.data,
// //       cellRenderer: (p: any) => {

// //         const sizeKB = (p.value.size / 1024).toFixed(1);

// //         return `
// //         <div style="
// //           display:flex;
// //           flex-direction:column;
// //           justify-content:center;
// //           line-height:1.4;
// //           overflow:hidden
// //         ">

// //           <span style="
// //             font-weight:600;
// //             color:var(--text-primary);
// //             white-space:nowrap;
// //             overflow:hidden;
// //             text-overflow:ellipsis;
// //             font-size:13px;
// //           ">
// //             ${p.value.fileName}
// //           </span>

// //           <span style="
// //             font-size:11px;
// //             color:var(--text-tertiary);
// //             margin-top:2px
// //           ">
// //             ${p.value.mimeType} • ${sizeKB} KB
// //           </span>

// //         </div>
// //         `;
// //       }
// //     },

// //     /* ---------------- CATEGORY ---------------- */

// //     {
// //       headerName: 'Category',
// //       field: 'category',
// //       width: 140,
// //       cellRenderer: (p: any) => {

// //         const colors: any = {
// //           chat: '#6366f1',
// //           product: '#10b981',
// //           kyc: '#f59e0b',
// //           avatar: '#ec4899',
// //           marketing: '#06b6d4'
// //         };

// //         const color = colors[p.value] || '#64748b';

// //         return `
// //         <span style="
// //           padding:4px 10px;
// //           border-radius:999px;
// //           font-size:11px;
// //           font-weight:600;
// //           text-transform:uppercase;
// //           letter-spacing:.4px;
// //           background:${color}20;
// //           color:${color};
// //         ">
// //           ${p.value}
// //         </span>
// //         `;
// //       }
// //     },

// //     /* ---------------- USER ---------------- */

// //     {
// //       headerName: 'Uploaded By',
// //       field: 'uploadedBy.name',
// //       width: 180,
// //       cellRenderer: (p: any) => `
// //         <div style="
// //           display:flex;
// //           align-items:center;
// //           gap:6px;
// //           font-size:12px;
// //           color:var(--text-secondary)
// //         ">
// //           <i class="pi pi-user" style="font-size:11px"></i>
// //           <span>${p.value || 'System'}</span>
// //         </div>
// //       `
// //     },

// //     /* ---------------- PROVIDER ---------------- */

// //     {
// //       headerName: 'Provider',
// //       field: 'provider',
// //       width: 130,
// //       cellRenderer: (p: any) => {

// //         const isCloud = p.value === 'cloudinary';

// //         return `
// //         <div style="
// //           display:flex;
// //           align-items:center;
// //           gap:6px;
// //           font-size:12px;
// //           color:var(--text-secondary)
// //         ">
// //           <i class="pi ${isCloud ? 'pi-cloud' : 'pi-server'}"></i>
// //           <span style="text-transform:capitalize">
// //             ${p.value}
// //           </span>
// //         </div>
// //         `;
// //       }
// //     },

// //     /* ---------------- ACTIONS ---------------- */

// //     {
// //       headerName: '',
// //       width: 110,
// //       pinned: 'right',
// //       sortable: false,
// //       filter: false,
// //       cellRenderer: (p: any) => {

// //         const container = document.createElement('div');

// //         container.style.display = 'flex';
// //         container.style.alignItems = 'center';
// //         container.style.justifyContent = 'center';
// //         container.style.height = '100%';

// //         const delBtn = document.createElement('button');

// //         delBtn.innerHTML = `<i class="pi pi-trash"></i>`;
// //         delBtn.className = 'p-button p-button-danger p-button-text p-button-sm';

// //         delBtn.onclick = () => this.deleteAsset(p.data._id);

// //         container.appendChild(delBtn);

// //         return container;
// //       }
// //     }

// //   ];
// // }

// //   eventFromGrid(event: any) {
// //     if (event.type === 'reachedBottom') this.getData(false);
// //   }
// // }