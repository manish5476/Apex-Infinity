import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ImageModule } from 'primeng/image'; // For high-end preview
import { TooltipModule } from 'primeng/tooltip';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { AppMessageService } from '../../../../core/services/message.service';
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
import { AssetsService } from '@core/services/assets.service';
import { ConfirmationService } from '@core/services/confirmationService';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, SelectModule,
    InputTextModule, ToastModule, AgShareGrid, ImageModule, TooltipModule
  ],
  templateUrl: './asset-list.html',
  styleUrl: './asset-list.scss',
})
export class AssetList implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private assetService = inject(AssetsService);
  private messageService = inject(AppMessageService);
  private messageConfirmService = inject(ConfirmationService);

  // State
  data: any[] = [];
  column: any[] = [];
  stats = signal<any>(null);
  isLoading = false;

  // Pagination & Filter
  private currentPage = 1;
  private pageSize = 50;
  private hasNextPage = true;
  assetFilter = { category: null, search: '' };

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

  getStats() {
    this.assetService.getMyAssetsStat().subscribe({
      next: (res) => this.stats.set(res.data),
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  getData(isReset: boolean = false) {
    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.hasNextPage = true;
    }

    if (this.isLoading || (!isReset && !this.hasNextPage)) return;
    this.isLoading = true;

    const params = {
      ...this.assetFilter,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.assetService.getAllAssets(params).subscribe({
      next: (res: any) => {
        const newData = res.data?.assets || [];
        this.data = isReset ? newData : [...this.data, ...newData];
        this.hasNextPage = res.currentPage < res.totalPages;
        if (this.hasNextPage) this.currentPage++;

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.handleHttpError(err);
      }
    });
  }

  deleteAsset(id: string) {
    // 1. Trigger the confirmation dialog
    this.messageConfirmService.confirm({
      header: 'Delete Asset?',
      message: 'Are you sure you want to permanently delete this file? This action cannot be undone.',
      icon: 'pi pi-trash',
      acceptLabel: 'Delete Now',
      rejectLabel: 'Keep File'
    }).subscribe((accepted: boolean) => {

      // 2. Only execute if user clicked 'Accept'
      if (accepted) {
        this.assetService.deleteAssetsId(id).subscribe({
          next: () => {
            this.messageService.showSuccess('Asset deleted permanently');
            this.getData(true); // Refresh Grid
            this.getStats();    // Refresh Storage Stats
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }

  getColumn(): void {
    this.column = [
      {
        headerName: 'Preview',
        width: 80,
        pinned: 'left',
        cellRenderer: (p: any) => {
          // Optimization: Use Cloudinary thumbnails for the grid to save bandwidth
          const thumbUrl = p.data.url.replace('/upload/', '/upload/c_thumb,w_100,g_face/');
          return `<img src="${thumbUrl}" style="width:40px; height:40px; object-fit:cover; border-radius:6px; margin-top:4px; border:1px solid var(--border-secondary)"/>`;
        }
      },
      {
        headerName: 'File Details',
        flex: 2,
        valueGetter: (p: any) => p.data,
        cellRenderer: (p: any) => `
          <div style="line-height:1.4; padding-top:4px">
            <div style="font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">
              ${p.value.fileName}
            </div>
            <div style="font-size:11px; color:var(--text-tertiary)">
              ${p.value.mimeType} • ${(p.value.size / 1024).toFixed(1)} KB
            </div>
          </div>
        `
      },
      {
        headerName: 'Category',
        field: 'category',
        width: 120,
        cellRenderer: (p: any) => {
          const colors: any = {
            chat: '#6366f1', product: '#10b981', kyc: '#f59e0b', avatar: '#ec4899'
          };
          return `<span style="background:${colors[p.value] || '#64748b'}20; color:${colors[p.value] || '#64748b'}; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; text-transform:uppercase">
            ${p.value}
          </span>`;
        }
      },
      {
        headerName: 'Uploaded By',
        field: 'uploadedBy.name',
        width: 150,
        cellRenderer: (p: any) => `
          <div style="font-size:12px">
            <i class="pi pi-user" style="font-size:10px; margin-right:4px"></i>${p.value || 'System'}
          </div>
        `
      },
      {
        headerName: 'Provider',
        field: 'provider',
        width: 110,
        cellRenderer: (p: any) => `
          <span style="font-size:11px; color:var(--text-secondary)">
            <i class="pi ${p.value === 'cloudinary' ? 'pi-cloud' : 'pi-server'}" style="margin-right:5px"></i>${p.value}
          </span>
        `
      },
      {
        headerName: 'Actions',
        width: 100,
        pinned: 'right',
        cellRenderer: (p: any) => {
          const btn = document.createElement('button');
          btn.innerHTML = '<i class="pi pi-trash"></i>';
          btn.className = 'p-button p-button-danger p-button-text p-button-sm';
          btn.onclick = () => this.deleteAsset(p.data._id);
          return btn;
        }
      }
      // {
      //   headerName: 'Actions',
      //   width: 100,
      //   pinned: 'right',
      //   cellRenderer: (p: any) => {
      //     const btn = document.createElement('button');
      //     btn.innerHTML = '<i class="pi pi-trash"></i>';
      //     btn.className = 'p-button p-button-danger p-button-text p-button-sm';
      //     btn.onclick = () => this.deleteAsset(p.data._id);
      //     return btn;
      //   }
      // }
    ];
  }

  eventFromGrid(event: any) {
    if (event.type === 'reachedBottom') this.getData(false);
  }
}