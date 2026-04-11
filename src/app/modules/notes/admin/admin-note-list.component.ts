import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  signal,
  ViewEncapsulation, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NoteService } from '../../../core/services/notes.service';
import { AppMessageService } from '../../../core/services/message.service';
import { AgShareGrid } from '../../shared/components/ag-shared-grid';
import { DatePicker } from 'primeng/datepicker';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-admin-note-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    DatePicker,
    AgShareGrid
],
  providers: [ConfirmationService, DatePipe],
  encapsulation: ViewEncapsulation.None,
  template: `
    <p-toast></p-toast>
    <p-confirmDialog header="Confirmation" icon="pi pi-exclamation-triangle"></p-confirmDialog>
    
    <div class="list-page-container">
      <div class="themed-card list-content-area">
        <div class="se-filter-bar">
          <div class="se-filter-field">
            <label for="type">Type</label>
            <p-select
              id="type"
              [options]="typeOptions"
              [(ngModel)]="filterState.noteType"
              optionLabel="label"
              optionValue="value"
              [showClear]="true"
              placeholder="All Types"
              (onChange)="applyFilters()"
              appendTo="body"
              styleClass="w-full"
              >
            </p-select>
          </div>
    
          <div class="se-filter-field">
            <label for="status">Status</label>
            <p-select
              id="status"
              [options]="statusOptions"
              [(ngModel)]="filterState.status"
              optionLabel="label"
              optionValue="value"
              [showClear]="true"
              placeholder="All Status"
              (onChange)="applyFilters()"
              appendTo="body"
              styleClass="w-full"
              >
            </p-select>
          </div>
    
          <div class="se-filter-field">
            <label for="priority">Priority</label>
            <p-select
              id="priority"
              [options]="priorityOptions"
              [(ngModel)]="filterState.priority"
              optionLabel="label"
              optionValue="value"
              [showClear]="true"
              placeholder="All Priorities"
              (onChange)="applyFilters()"
              appendTo="body"
              styleClass="w-full"
              >
            </p-select>
          </div>
    
          <div class="se-filter-field" style="min-width: 240px;">
            <label>Created Date Range</label>
            <p-datepicker
              [(ngModel)]="dateRange"
              selectionMode="range"
              [readonlyInput]="true"
              placeholder="Start - End"
              (onSelect)="applyFilters()"
              (onClear)="applyFilters()"
              [showIcon]="true"
              [showButtonBar]="true"
              appendTo="body"
              styleClass="w-full"
              >
            </p-datepicker>
          </div>
    
          <div class="se-filter-field" style="flex-grow: 1;">
            <label for="search">Search</label>
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <input
                id="search"
                type="text"
                pInputText
                [(ngModel)]="filterState.search"
                (keydown.enter)="applyFilters()"
                (blur)="applyFilters()"
                placeholder="Search title, content, tags..."
                class="w-full"
                />
              </span>
            </div>
    
            <div class="se-filter-actions">
              <button
                pButton
                label="Reset"
                icon="pi pi-refresh"
                class="p-button-outlined p-button-secondary"
                (click)="resetFilters()"
              ></button>
            </div>
          </div>
          <div class="list-grid-wrapper">
            <app-ag-share-grid
              [columns]="columnDefs"
              [data]="rowData"
              selectionMode="single"
              (gridEvent)="onGridEvent($event)"
              >
            </app-ag-share-grid>
    
            @if (isLoading) {
              <div class="grid-loading-overlay">
                <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
              </div>
            }
          </div>
        </div>
      </div>
    `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        --bg-panel: #ffffff;
        --bg-secondary: #f8fafc;
        --border-secondary: #e2e8f0;
        --text-primary: #1e293b;
        --text-secondary: #64748b;
        --text-tertiary: #94a3b8;
      }

      .list-page-container {
        height: 100%;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
      }

      .themed-card {
        background: var(--bg-panel);
        border: 1px solid var(--border-secondary);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      }

      /* Filter Bar Styling */
      .se-filter-bar {
        padding: 1rem;
        border-bottom: 1px solid var(--border-secondary);
        display: flex;
        gap: 1rem;
        align-items: flex-end;
        flex-wrap: wrap;
        background: var(--bg-panel);
      }

      .se-filter-field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-width: 160px;
        flex: 0 1 auto;

        label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
      }

      .se-filter-actions {
        display: flex;
        gap: 0.5rem;
        align-items: flex-end;
        margin-left: auto;
        padding-bottom: 1px;
      }

      /* Grid Container */
      .list-grid-wrapper {
        flex: 1;
        overflow: hidden;
        position: relative;
      }

      .grid-loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      }

      .w-full {
        width: 100%;
      }

      /* PrimeNG Overrides for consistency */
      ::ng-deep .p-datepicker {
        width: 100%;
      }
      ::ng-deep .p-inputtext {
        font-size: 0.9rem;
        padding: 0.6rem 0.75rem;
      }
      ::ng-deep .p-select {
        font-size: 0.9rem;
      }
    
    /* ==========================================================================
   AG Grid Custom Cell Styles (Theme Aware)
   ========================================================================== */

/* Layout Helpers */
.cell-flex-center {
  display: flex;
  align-items: center;
  height: 100%;
}

.cell-stack {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: var(--line-height-tight);
  height: 100%;
}

.gap-sm { gap: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }

/* Typography Helpers */
.cell-title {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.text-primary { color: var(--text-secondary); font-size: var(--font-size-xs); }
.text-secondary { color: var(--text-tertiary); font-size: 10px; }
.text-muted { color: var(--text-tertiary); font-size: var(--font-size-xs); }
.text-mono { 
  color: var(--text-secondary); 
  font-size: var(--font-size-xs); 
  font-family: var(--font-mono); 
}

/* Type Icons (Mapped to theme semantic colors) */
.type-label {
  text-transform: capitalize;
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}
.icon-type-meeting { color: var(--accent-primary); font-size: var(--font-size-md); }
.icon-type-task { color: var(--color-info); font-size: var(--font-size-md); }
.icon-type-note { color: var(--color-warning); font-size: var(--font-size-md); }

/* Owner Avatar & Details */
.owner-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--ui-border-radius-pill);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: var(--ui-border-width) solid var(--border-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.owner-info {
  display: flex;
  flex-direction: column;
  line-height: var(--line-height-tight);
  justify-content: center;
  overflow: hidden;
}

.owner-name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.owner-email {
  font-size: 10px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Base Badge System */
.grid-badge {
  padding: 2px 8px;
  border-radius: var(--ui-border-radius-sm);
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: var(--line-height-normal);
  border: var(--ui-border-width) solid transparent;
}

/* Priority Modifiers (Mapped to semantic colors) */
.badge-urgent {
  background-color: var(--color-error-bg);
  color: var(--color-error-dark);
  border-color: var(--color-error-border);
}
.badge-high {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-dark);
  border-color: var(--color-warning-border);
}
.badge-medium {
  background-color: var(--color-info-bg);
  color: var(--color-info-dark);
  border-color: var(--color-info-border);
}
.badge-low {
  background-color: var(--color-success-bg);
  color: var(--color-success-dark);
  border-color: var(--color-success-border);
}

/* Status Modifiers */
.badge-success {
  background-color: var(--color-success-bg);
  color: var(--color-success-dark);
  border-color: var(--color-success-border);
}
.badge-neutral {
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  border-color: var(--border-secondary);
}`,
  ],
})
export class AdminNoteListComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  private noteService = inject(NoteService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  rowData: any[] = [];
  columnDefs: any[] = [];
  isLoading = false;

  currentPage = 1;
  pageSize = 50;
  totalRecords = 0;

  dateRange: Date[] | undefined;

  filterState = {
    noteType: null,
    status: null,
    priority: null,
    search: '',
    sortBy: 'createdAt',
    order: 'desc',
  };

  readonly typeOptions = [
    { label: 'Note', value: 'note' },
    { label: 'Meeting', value: 'meeting' },
    { label: 'Task', value: 'task' },
  ];

  readonly statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Archived', value: 'archived' },
    { label: 'Draft', value: 'draft' },
    { label: 'Completed', value: 'completed' },
  ];

  readonly priorityOptions = [
    { label: 'Urgent', value: 'urgent' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];

  ngOnInit(): void {
    this.setupColumns();
    this.loadData(true);
  }


  applyFilters() {
    this.loadData(true);
  }

  resetFilters() {
    this.filterState = {
      noteType: null,
      status: null,
      priority: null,
      search: '',
      sortBy: 'createdAt',
      order: 'desc',
    };
    this.dateRange = undefined;
    this.loadData(true);
  }

  onGridEvent(event: any) {
    switch (event.type) {
      case 'sortChanged':
        const sortModel = event.api.getSortModel();
        if (sortModel.length > 0) {
          this.filterState.sortBy = sortModel[0].colId;
          this.filterState.order = sortModel[0].sort;
        } else {
          this.filterState.sortBy = 'createdAt';
          this.filterState.order = 'desc';
        }
        this.loadData(true);
        break;

      case 'reachedBottom':
        if (!this.isLoading && this.rowData.length < this.totalRecords) {
          this.loadData(false);
        }
        break;

      case 'delete':
        this.confirmDelete(event.row);
        break;

      case 'editStart':
      case 'cellClicked':
        this.router.navigate(['/notes', event.row._id]);

        break;
    }
  }

  private confirmDelete(row: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to permanently delete <b>${row.title}</b>?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      accept: () => {
        this.noteService.hardDeleteNote(row._id).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            // Simplified to single parameter string
            this.messageService.showSuccess('Note deleted successfully.');

            this.rowData = this.rowData.filter((n) => n._id !== row._id);
            this.cdr.markForCheck();
          },
          error: (err) => {
            // Replaced manual showError with global HTTP error handler
            this.messageService.handleHttpError(err);
          },
        });
      },
    });
  }

  /**
   * Main Data Fetching Logic
   * @param isReset - If true, clears current data and starts from page 1
   */
  loadData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.rowData = [];
      this.totalRecords = 0;
    }

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.filterState.sortBy,
      order: this.filterState.order,
      search: this.filterState.search || '',
    };

    if (this.filterState.noteType) params.noteType = this.filterState.noteType;
    if (this.filterState.status) params.status = this.filterState.status;
    if (this.filterState.priority) params.priority = this.filterState.priority;

    if (this.dateRange && this.dateRange[0]) {
      params.createdFrom = this.dateRange[0].toISOString();
    }
    if (this.dateRange && this.dateRange[1]) {
      params.createdTo = this.dateRange[1].toISOString();
    }

    this.noteService.getAllOrganizationNotes(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const fetchedNotes = res.data?.notes || [];
        this.totalRecords = res.pagination?.total || res.results || 0;
        this.rowData = isReset ? fetchedNotes : [...this.rowData, ...fetchedNotes];

        if (fetchedNotes.length > 0) {
          this.currentPage++;
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Data Load Error:', err);

        // Replaced generic string with dynamic HTTP error handling
        this.messageService.handleHttpError(err);

        this.cdr.markForCheck();
      },
    });
  }

  setupColumns(): void {
    this.columnDefs = [
      {
        field: 'title',
        headerName: 'Title',
        width: 240,
        pinned: 'left',
        sortable: true,
        filter: true,
        cellClass: 'cell-flex-center cell-title',
      },

      {
        field: 'noteType',
        headerName: 'Type',
        width: 120,
        sortable: true,
        cellRenderer: (params: any) => {
          const type = params.value || 'note';
          const iconMap: Record<string, string> = {
            meeting: 'pi-calendar',
            task: 'pi-check-square',
            note: 'pi-file-edit'
          };

          const icon = iconMap[type] || 'pi-file';

          return `
            <div class="cell-flex-center gap-sm">
               <i class="pi ${icon} icon-type-${type}"></i>
               <span class="type-label">${type}</span>
            </div>
          `;
        },
      },

      {
        field: 'priority',
        headerName: 'Priority',
        width: 110,
        sortable: true,
        cellRenderer: (params: any) => {
          const priority = (params.value || 'medium').toLowerCase();
          return `
            <div class="cell-flex-center">
              <span class="grid-badge badge-${priority}">
                ${priority}
              </span>
            </div>
          `;
        },
      },

      {
        field: 'owner',
        headerName: 'Owner',
        width: 180,
        cellRenderer: (params: any) => {
          const name = params.data.owner?.name || 'Unknown';
          const email = params.data.owner?.email || '';
          const initial = name.charAt(0).toUpperCase();

          return `
            <div class="cell-flex-center gap-md">
               <div class="owner-avatar">${initial}</div>
               <div class="owner-info">
                  <span class="owner-name">${name}</span>
                  <span class="owner-email" title="${email}">${email}</span>
               </div>
            </div>
          `;
        },
      },

      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        sortable: true,
        cellRenderer: (params: any) => {
          const status = (params.value || 'UNKNOWN').toLowerCase();
          const badgeClass = status === 'active' ? 'badge-success' : 'badge-neutral';

          return `
            <div class="cell-flex-center">
              <span class="grid-badge ${badgeClass}">
                ${status}
              </span>
            </div>`;
        },
      },

      {
        field: 'createdAt',
        headerName: 'Created',
        width: 140,
        sortable: true,
        cellRenderer: (params: any) => {
          if (!params.value) return '-';
          const dateObj = new Date(params.value);

          return `
            <div class="cell-stack">
               <span class="text-primary">${dateObj.toLocaleDateString()}</span>
               <span class="text-secondary">${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
           `;
        },
      },

      {
        field: 'dueDate',
        headerName: 'Due Date',
        width: 140,
        sortable: true,
        cellRenderer: (params: any) => {
          if (!params.value) return `<span class="text-muted">-</span>`;
          const date = new Date(params.value).toLocaleDateString();
          return `<span class="text-mono">${date}</span>`;
        },
      },
    ];
  }

  // setupColumns(): void {
  //   this.columnDefs = [
  //     {
  //       field: 'title',
  //       headerName: 'Title',
  //       width: 240,
  //       pinned: 'left',
  //       sortable: true,
  //       filter: true,
  //       cellStyle: {
  //         display: 'flex',
  //         'align-items': 'center',
  //         'font-weight': '600',
  //         color: 'var(--text-primary)',
  //       },
  //     },

  //     {
  //       field: 'noteType',
  //       headerName: 'Type',
  //       width: 120,
  //       sortable: true,
  //       cellRenderer: (params: any) => {
  //         const type = params.value || 'note';
  //         let icon = 'pi-file';
  //         let color = '#64748b';

  //         if (type === 'meeting') {
  //           icon = 'pi-calendar';
  //           color = '#8b5cf6';
  //         }
  //         if (type === 'task') {
  //           icon = 'pi-check-square';
  //           color = '#0ea5e9';
  //         }
  //         if (type === 'note') {
  //           icon = 'pi-file-edit';
  //           color = '#f59e0b';
  //         }

  //         return `
  //           <div style="display:flex; align-items:center; height:100%; gap:8px;">
  //              <i class="pi ${icon}" style="color:${color}; font-size:14px;"></i>
  //              <span style="text-transform:capitalize; color:var(--text-secondary); font-size:12px; font-weight:500;">${type}</span>
  //           </div>
  //         `;
  //       },
  //     },

  //     {
  //       field: 'priority',
  //       headerName: 'Priority',
  //       width: 110,
  //       sortable: true,
  //       cellRenderer: (params: any) => {
  //         const priority = params.value || 'medium';

  //         let bg = '#f1f5f9';
  //         let text = '#475569';

  //         if (priority === 'urgent') {
  //           bg = '#fef2f2';
  //           text = '#dc2626';
  //         }
  //         if (priority === 'high') {
  //           bg = '#fff1f2';
  //           text = '#e11d48';
  //         }
  //         if (priority === 'medium') {
  //           bg = '#eff6ff';
  //           text = '#2563eb';
  //         }
  //         if (priority === 'low') {
  //           bg = '#f0fdf4';
  //           text = '#16a34a';
  //         }

  //         return `
  //           <div style="display:flex; align-items:center; height:100%;">
  //             <span style="
  //               background:${bg}; 
  //               color:${text}; 
  //               padding:2px 8px; 
  //               border-radius:4px; 
  //               font-size:10px; 
  //               font-weight:700; 
  //               text-transform:uppercase;
  //               letter-spacing: 0.5px;
  //             ">
  //               ${priority}
  //             </span>
  //           </div>
  //         `;
  //       },
  //     },

  //     {
  //       field: 'owner',
  //       headerName: 'Owner',
  //       width: 180,
  //       cellRenderer: (params: any) => {
  //         const name = params.data.owner?.name || 'Unknown';
  //         const email = params.data.owner?.email || '';
  //         const initial = name.charAt(0).toUpperCase();

  //         return `
  //           <div style="display:flex; align-items:center; height:100%; gap:10px;">
  //              <div style="
  //                 width:28px; height:28px; 
  //                 border-radius:50%; 
  //                 background:#f1f5f9; 
  //                 color:#64748b; 
  //                 display:flex; align-items:center; justify-content:center; 
  //                 font-size:11px; font-weight:700;
  //                 border: 1px solid #e2e8f0;
  //              ">
  //                 ${initial}
  //              </div>
  //              <div style="display:flex; flex-direction:column; line-height:1.2; justify-content:center;">
  //                 <span style="font-size:12px; font-weight:500; color:var(--text-primary); white-space:nowrap;">${name}</span>
  //                 <span style="font-size:10px; color:var(--text-tertiary); overflow:hidden; text-overflow:ellipsis; max-width:120px;">${email}</span>
  //              </div>
  //           </div>
  //         `;
  //       },
  //     },

  //     {
  //       field: 'status',
  //       headerName: 'Status',
  //       width: 120,
  //       sortable: true,
  //       cellRenderer: (params: any) => {
  //         const status = params.value;

  //         const isActive = status === 'active';
  //         const bg = isActive ? '#ecfdf5' : '#f3f4f6';
  //         const color = isActive ? '#15803d' : '#4b5563';
  //         const border = isActive ? '#bbf7d0' : '#e5e7eb';

  //         return `
  //           <div style="display:flex; align-items:center; height:100%;">
  //             <span style="
  //               background-color: ${bg}; 
  //               color: ${color}; 
  //               border: 1px solid ${border}; 
  //               padding: 1px 8px; 
  //               border-radius: 4px; 
  //               font-size: 10px; 
  //               font-weight: 700; 
  //               text-transform: uppercase; 
  //               line-height: 1.2; 
  //               letter-spacing: 0.5px;
  //             ">
  //               ${status || 'UNKNOWN'}
  //             </span>
  //           </div>`;
  //       },
  //     },

  //     {
  //       field: 'createdAt',
  //       headerName: 'Created',
  //       width: 140,
  //       sortable: true,
  //       cellRenderer: (params: any) => {
  //         if (!params.value) return '-';
  //         const date = new Date(params.value).toLocaleDateString();
  //         const time = new Date(params.value).toLocaleTimeString([], {
  //           hour: '2-digit',
  //           minute: '2-digit',
  //         });
  //         return `
  //           <div style="display:flex; flex-direction:column; justify-content:center; line-height:1.2; height:100%;">
  //              <span style="color:var(--text-secondary); font-size:12px;">${date}</span>
  //              <span style="color:var(--text-tertiary); font-size:10px;">${time}</span>
  //           </div>
  //          `;
  //       },
  //     },

  //     {
  //       field: 'dueDate',
  //       headerName: 'Due Date',
  //       width: 140,
  //       sortable: true,
  //       cellRenderer: (params: any) => {
  //         if (!params.value)
  //           return `<span style="color:var(--text-tertiary); font-size:11px;">-</span>`;
  //         const date = new Date(params.value).toLocaleDateString();
  //         return `<span style="color:var(--text-secondary); font-size:12px; font-family:monospace;">${date}</span>`;
  //       },
  //     },
  //   ];
  // }
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
