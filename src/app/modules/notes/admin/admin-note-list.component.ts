import { ChangeDetectorRef, Component, OnInit, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// --- PrimeNG Modules ---
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

// --- Services & Shared Components ---
// Adjust these import paths to match your project structure
import { NoteService } from '../../../core/services/notes.service';
import { AppMessageService } from '../../../core/services/message.service';
import { AgShareGrid } from '../../shared/components/ag-shared-grid';
import { DatePicker } from 'primeng/datepicker';

@Component({
  selector: 'app-admin-note-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    DatePicker,
    // Shared
    AgShareGrid
  ],
  providers: [
    ConfirmationService, 
    DatePipe,
    // If AppMessageService isn't provided in root, add it here
    // AppMessageService 
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <p-toast></p-toast>
    <p-confirmDialog header="Confirmation" icon="pi pi-exclamation-triangle"></p-confirmDialog>

    <div class="list-page-container">
      <div class="themed-card list-content-area">

        <!-- 🟢 FILTER BAR -->
        <div class="se-filter-bar">
          
          <!-- Type Filter -->
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
              styleClass="w-full">
            </p-select>
          </div>

          <!-- Status Filter -->
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
              styleClass="w-full">
            </p-select>
          </div>

          <!-- Priority Filter -->
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
              styleClass="w-full">
            </p-select>
          </div>

          <!-- Date Range Filter -->
          <div class="se-filter-field" style="min-width: 240px;">
            <label>Created Date Range</label>
            <p-datepicker 
              [(ngModel)]="dateRange" selectionMode="range" [readonlyInput]="true"placeholder="Start - End"(onSelect)="applyFilters()"(onClear)="applyFilters()"[showIcon]="true"[showButtonBar]="true"
               appendTo="body"
              styleClass="w-full">
            </p-datepicker>
          </div>

          <!-- Search Input -->
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
                class="w-full" />
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="se-filter-actions">
            <button 
              pButton 
              label="Reset" 
              icon="pi pi-refresh" 
              class="p-button-outlined p-button-secondary"
              (click)="resetFilters()">
            </button>
                 </div>
        </div>
        <div class="list-grid-wrapper">
          <app-ag-share-grid 
            [columns]="columnDefs" 
            [data]="rowData" 
            [showActions]="false" 
            selectionMode="single"
            (gridEvent)="onGridEvent($event)">
          </app-ag-share-grid>
          
          <!-- Loading Overlay (Optional custom overlay) -->
          <div *ngIf="isLoading" class="grid-loading-overlay">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
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
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255,255,255,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .w-full { width: 100%; }
    
    /* PrimeNG Overrides for consistency */
    ::ng-deep .p-datepicker { width: 100%; }
    ::ng-deep .p-inputtext { font-size: 0.9rem; padding: 0.6rem 0.75rem; }
    ::ng-deep .p-select { font-size: 0.9rem; }
  `]
})
export class AdminNoteListComponent implements OnInit {
  // --- Injections ---
  private cdr = inject(ChangeDetectorRef);
  private noteService = inject(NoteService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  // --- State Variables ---
  rowData: any[] = [];
  columnDefs: any[] = [];
  isLoading = false;
  
  // Pagination State
  currentPage = 1;
  pageSize = 50;
  totalRecords = 0;

  // Filter State
  dateRange: Date[] | undefined;
  
  filterState = {
    noteType: null,
    status: null,
    priority: null,
    search: '',
    sortBy: 'createdAt',
    order: 'desc'
  };

  // --- Dropdown Options ---
  readonly typeOptions = [
    { label: 'Note', value: 'note' },
    { label: 'Meeting', value: 'meeting' },
    { label: 'Task', value: 'task' }
  ];

  readonly statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Archived', value: 'archived' },
    { label: 'Draft', value: 'draft' },
    { label: 'Completed', value: 'completed' }
  ];

  readonly priorityOptions = [
    { label: 'Urgent', value: 'urgent' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' }
  ];

  ngOnInit(): void {
    this.setupColumns();
    this.loadData(true);
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

    // 1. Build Query Params for Backend
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.filterState.sortBy,
      order: this.filterState.order,
      search: this.filterState.search || ''
    };

    // Add optional filters if they exist
    if (this.filterState.noteType) params.noteType = this.filterState.noteType;
    if (this.filterState.status) params.status = this.filterState.status;
    if (this.filterState.priority) params.priority = this.filterState.priority;

    // Handle Date Range (Convert to ISO String)
    if (this.dateRange && this.dateRange[0]) {
      params.createdFrom = this.dateRange[0].toISOString();
    }
    if (this.dateRange && this.dateRange[1]) {
      params.createdTo = this.dateRange[1].toISOString();
    }

    // 2. Call API
    this.noteService.getAllOrganizationNotes(params).subscribe({
      next: (res: any) => {
        // Backend Response Structure Mapping:
        // Expected: { data: { notes: [...] }, pagination: { total: 100, ... } }
        
        const fetchedNotes = res.data?.notes || [];
        // Fallback for total count if pagination object is missing
        this.totalRecords = res.pagination?.total || res.results || 0; 

        // Append or Replace Data
        this.rowData = isReset ? fetchedNotes : [...this.rowData, ...fetchedNotes];

        // Increment Page for next scroll
        if (fetchedNotes.length > 0) {
          this.currentPage++;
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Data Load Error:', err);
        this.messageService.showError('Error', 'Failed to load organization notes');
        this.cdr.markForCheck();
      }
    });
  }

  // --- Filter Actions ---

  applyFilters() {
    this.loadData(true); // Reset to page 1
  }

  resetFilters() {
    this.filterState = {
      noteType: null,
      status: null,
      priority: null,
      search: '',
      sortBy: 'createdAt',
      order: 'desc'
    };
    this.dateRange = undefined;
    this.loadData(true);
  }

  // --- Grid Event Handling ---

  onGridEvent(event: any) {
    switch (event.type) {
      
      // 1. Server-side Sorting
      case 'sortChanged':
        const sortModel = event.api.getSortModel();
        if (sortModel.length > 0) {
          this.filterState.sortBy = sortModel[0].colId;
          this.filterState.order = sortModel[0].sort; // 'asc' or 'desc'
        } else {
          this.filterState.sortBy = 'createdAt';
          this.filterState.order = 'desc';
        }
        this.loadData(true);
        break;

      // 2. Infinite Scroll
      case 'reachedBottom':
        // Only load more if we haven't reached the total
        if (!this.isLoading && this.rowData.length < this.totalRecords) {
          this.loadData(false);
        }
        break;

      // 3. Delete Action
      case 'delete':
        this.confirmDelete(event.row);
        break;

      // 4. Edit/View Actions
      case 'editStart':
      case 'cellClicked':
            this.router.navigate(['/notes', event.row._id]);
        // this.router.navigate(['/notes/edit', event.row._id]);
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
        this.noteService.hardDeleteNote(row._id).subscribe({
          next: () => {
            this.messageService.showSuccess('Success', 'Note deleted successfully');
            // Optimistic update: remove from local array
            this.rowData = this.rowData.filter(n => n._id !== row._id);
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.messageService.showError('Error', err.error?.message || 'Delete failed');
          }
        });
      }
    });
  }

  // --- Column Definitions with HTML Renderers ---

  setupColumns(): void {
    this.columnDefs = [
      // 1. TITLE (Bold, Primary)
      {
        field: 'title',
        headerName: 'Title',
        width: 240,
        pinned: 'left',
        sortable: true,
        filter: true,
        cellStyle: { 'display': 'flex', 'align-items': 'center', 'font-weight': '600', 'color': 'var(--text-primary)' }
      },

      // 2. TYPE (Icon + Text)
      {
        field: 'noteType',
        headerName: 'Type',
        width: 120,
        sortable: true,
        cellRenderer: (params: any) => {
          const type = params.value || 'note';
          let icon = 'pi-file';
          let color = '#64748b'; // default gray

          if (type === 'meeting') { icon = 'pi-calendar'; color = '#8b5cf6'; } // Purple
          if (type === 'task') { icon = 'pi-check-square'; color = '#0ea5e9'; } // Blue
          if (type === 'note') { icon = 'pi-file-edit'; color = '#f59e0b'; } // Amber

          return `
            <div style="display:flex; align-items:center; height:100%; gap:8px;">
               <i class="pi ${icon}" style="color:${color}; font-size:14px;"></i>
               <span style="text-transform:capitalize; color:var(--text-secondary); font-size:12px; font-weight:500;">${type}</span>
            </div>
          `;
        }
      },

      // 3. PRIORITY (Colored Badge)
      {
        field: 'priority',
        headerName: 'Priority',
        width: 110,
        sortable: true,
        cellRenderer: (params: any) => {
          const priority = params.value || 'medium';
          
          let bg = '#f1f5f9'; let text = '#475569'; // Default Slate

          if (priority === 'urgent') { bg = '#fef2f2'; text = '#dc2626'; } // Red
          if (priority === 'high') { bg = '#fff1f2'; text = '#e11d48'; } // Rose
          if (priority === 'medium') { bg = '#eff6ff'; text = '#2563eb'; } // Blue
          if (priority === 'low') { bg = '#f0fdf4'; text = '#16a34a'; } // Green

          return `
            <div style="display:flex; align-items:center; height:100%;">
              <span style="
                background:${bg}; 
                color:${text}; 
                padding:2px 8px; 
                border-radius:4px; 
                font-size:10px; 
                font-weight:700; 
                text-transform:uppercase;
                letter-spacing: 0.5px;
              ">
                ${priority}
              </span>
            </div>
          `;
        }
      },

      // 4. OWNER (Avatar + Name Stack)
      {
        field: 'owner',
        headerName: 'Owner',
        width: 180,
        cellRenderer: (params: any) => {
          const name = params.data.owner?.name || 'Unknown';
          const email = params.data.owner?.email || '';
          const initial = name.charAt(0).toUpperCase();
          
          return `
            <div style="display:flex; align-items:center; height:100%; gap:10px;">
               <div style="
                  width:28px; height:28px; 
                  border-radius:50%; 
                  background:#f1f5f9; 
                  color:#64748b; 
                  display:flex; align-items:center; justify-content:center; 
                  font-size:11px; font-weight:700;
                  border: 1px solid #e2e8f0;
               ">
                  ${initial}
               </div>
               <div style="display:flex; flex-direction:column; line-height:1.2; justify-content:center;">
                  <span style="font-size:12px; font-weight:500; color:var(--text-primary); white-space:nowrap;">${name}</span>
                  <span style="font-size:10px; color:var(--text-tertiary); overflow:hidden; text-overflow:ellipsis; max-width:120px;">${email}</span>
               </div>
            </div>
          `;
        }
      },

      // 5. STATUS (Styled Pill)
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        sortable: true,
        cellRenderer: (params: any) => {
          const status = params.value;
          
          const isActive = status === 'active';
          const bg = isActive ? '#ecfdf5' : '#f3f4f6';
          const color = isActive ? '#15803d' : '#4b5563';
          const border = isActive ? '#bbf7d0' : '#e5e7eb';
          
          return `
            <div style="display:flex; align-items:center; height:100%;">
              <span style="
                background-color: ${bg}; 
                color: ${color}; 
                border: 1px solid ${border}; 
                padding: 1px 8px; 
                border-radius: 4px; 
                font-size: 10px; 
                font-weight: 700; 
                text-transform: uppercase; 
                line-height: 1.2; 
                letter-spacing: 0.5px;
              ">
                ${status || 'UNKNOWN'}
              </span>
            </div>`;
        }
      },

      // 6. CREATED DATE
      {
        field: 'createdAt',
        headerName: 'Created',
        width: 140,
        sortable: true,
        cellRenderer: (params: any) => {
           if (!params.value) return '-';
           const date = new Date(params.value).toLocaleDateString();
           const time = new Date(params.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
           return `
            <div style="display:flex; flex-direction:column; justify-content:center; line-height:1.2; height:100%;">
               <span style="color:var(--text-secondary); font-size:12px;">${date}</span>
               <span style="color:var(--text-tertiary); font-size:10px;">${time}</span>
            </div>
           `;
        }
      },

      // 7. DUE DATE
      {
        field: 'dueDate',
        headerName: 'Due Date',
        width: 140,
        sortable: true,
        cellRenderer: (params: any) => {
           if (!params.value) return `<span style="color:var(--text-tertiary); font-size:11px;">-</span>`;
           const date = new Date(params.value).toLocaleDateString();
           return `<span style="color:var(--text-secondary); font-size:12px; font-family:monospace;">${date}</span>`;
        }
      }
    ];
  }
}

// import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router } from '@angular/router';
// import { GridApi, GridReadyEvent } from 'ag-grid-community';

// // --- PrimeNG ---
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ConfirmationService } from 'primeng/api';

// // --- App Services & Components ---
// import { NoteService } from '../../../core/services/notes.service'; // Assuming path
// import { AppMessageService } from '../../../core/services/message.service'; // Assuming path
// import { AgShareGrid } from '../../shared/components/ag-shared-grid'; // Assuming path

// @Component({
//   selector: 'app-admin-note-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     SelectModule,
//     ButtonModule,
//     InputTextModule,
//     ToastModule,
//     ConfirmDialogModule,
//     AgShareGrid
//   ],
//   providers: [NoteService, ConfirmationService, DatePipe],
//   template: `
//     <p-toast></p-toast>
//     <p-confirmDialog header="Confirmation" icon="pi pi-exclamation-triangle"></p-confirmDialog>

//     <div class="list-page-container">
//       <div class="themed-card list-content-area">
        
//         <div class="se-filter-bar">
//           <div class="se-filter-field">
//             <label for="type">Type</label>
//             <p-select appendTo="body" (onChange)="applyFilters()" id="type" [options]="typeOptions"
//               [(ngModel)]="noteFilter.type" optionLabel="label" optionValue="value" [showClear]="true"
//               placeholder="Filter by Type" styleClass="w-full">
//             </p-select>
//           </div>

//           <div class="se-filter-field">
//             <label for="status">Status</label>
//             <p-select appendTo="body" (onChange)="applyFilters()" id="status" [options]="statusOptions"
//               [(ngModel)]="noteFilter.status" optionLabel="label" optionValue="value" [showClear]="true"
//               placeholder="Filter by Status" styleClass="w-full">
//             </p-select>
//           </div>

//           <div class="se-filter-field">
//             <label for="search">Search</label>
//             <input id="search" type="text" pInputText [(ngModel)]="noteFilter.search" (keydown.enter)="applyFilters()"
//               (blur)="applyFilters()" placeholder="Title or Content..." class="w-full" />
//           </div>

//           <div class="se-filter-actions">
//             <p-button label="Reset" icon="pi pi-refresh" styleClass="p-button-outlined p-button-secondary"
//               (onClick)="resetFilters()">
//             </p-button>
//           </div>
          
//           <div class="se-filter-right">
//              <button pButton label="Export" icon="pi pi-download" class="p-button-outlined"></button>
//           </div>
//         </div>

//         <div class="list-grid-wrapper">
//           <app-ag-share-grid 
//             [columns]="column" 
//             [data]="data" 
//             [showActions]="true" 
//             selectionMode="single"
//             (gridEvent)="eventFromGrid($event)">
//           </app-ag-share-grid>
//         </div>

//       </div>
//     </div>
//   `,
//   styles: [`
//     :host {
//       display: block;
//       height: 100%;
//       --bg-panel: #ffffff; /* Adjust based on your theme var */
//       --bg-secondary: #f8fafc;
//       --border-secondary: #e2e8f0;
//       --text-primary: #1e293b;
//       --text-secondary: #64748b;
//       --text-tertiary: #94a3b8;
//     }

//     .list-page-container {
//       height: 100%;
//       padding: 1.5rem;
//       display: flex;
//       flex-direction: column;
//     }

//     .themed-card {
//       background: var(--bg-panel);
//       border: 1px solid var(--border-secondary);
//       border-radius: 12px;
//       display: flex;
//       flex-direction: column;
//       height: 100%;
//       overflow: hidden;
//       box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
//     }

//     /* Filter Bar Styles mimicking UserList */
//     .se-filter-bar {
//       padding: 1rem;
//       border-bottom: 1px solid var(--border-secondary);
//       display: flex;
//       gap: 1rem;
//       align-items: flex-end;
//       flex-wrap: wrap;
//     }

//     .se-filter-field {
//       display: flex;
//       flex-direction: column;
//       gap: 0.25rem;
//       min-width: 180px;
//       flex: 0 1 auto;
      
//       label {
//         font-size: 0.75rem;
//         font-weight: 600;
//         color: var(--text-secondary);
//         text-transform: uppercase;
//         letter-spacing: 0.025em;
//       }
//     }

//     .se-filter-actions {
//       display: flex;
//       align-items: flex-end;
//       padding-bottom: 2px; /* Align with inputs */
//     }

//     .se-filter-right {
//       margin-left: auto;
//       display: flex;
//       align-items: flex-end;
//     }

//     .list-grid-wrapper {
//       flex: 1;
//       overflow: hidden;
//       position: relative;
//     }

//     .w-full { width: 100%; }
//   `]
// })
// export class AdminNoteListComponent implements OnInit {
//   // --- Injections ---
//   private cdr = inject(ChangeDetectorRef);
//   private noteService = inject(NoteService);
//   private messageService = inject(AppMessageService); // Using your AppMessageService
//   private confirmationService = inject(ConfirmationService);
//   private datePipe = inject(DatePipe);
//   private router = inject(Router);

//   // --- Grid State ---
//   private gridApi!: GridApi;
//   private currentPage = 1;
//   private isLoading = false;
//   private totalCount = 0;
//   private pageSize = 50;

//   data: any[] = [];
//   column: any[] = [];

//   // --- Filters ---
//   typeOptions = [
//     { label: 'Note', value: 'note' },
//     { label: 'Meeting', value: 'meeting' },
//     { label: 'Task', value: 'task' }
//   ];

//   statusOptions = [
//     { label: 'Active', value: 'active' },
//     { label: 'Archived', value: 'archived' },
//     { label: 'Draft', value: 'draft' }
//   ];

//   noteFilter = {
//     type: null,
//     status: null,
//     search: ''
//   };

//   ngOnInit(): void {
//     this.setupColumns();
//     this.getData(true);
//   }

//   // --- Data Fetching ---
//   getData(isReset: boolean = false) {
//     if (this.isLoading) return;
//     this.isLoading = true;

//     if (isReset) {
//       this.currentPage = 1;
//       this.data = [];
//       this.totalCount = 0;
//     }

//     const params = {
//       ...this.noteFilter,
//       page: this.currentPage,
//       limit: this.pageSize
//     };

//     // Assuming getAllOrganizationNotes accepts params matching your backend
//     this.noteService.getAllOrganizationNotes(params).subscribe({
//       next: (res: any) => {
//         let newData = [];
//         let totalResults = 0;

//         if (res.data && Array.isArray(res.data.notes)) {
//              // Structure 1: From your first JSON snippet
//              newData = res.data.notes;
//              totalResults = res.data.total || newData.length; // Fallback
//         } else if (res.data?.data) {
//              // Structure 2: From your UserList reference pattern
//              newData = res.data.data;
//              totalResults = res.data.pagination?.totalResults || 0;
//         }

//         this.totalCount = totalResults;
//         this.data = isReset ? newData : [...this.data, ...newData];

//         if (newData.length > 0) {
//           this.currentPage++;
//         }

//         this.isLoading = false;
//         this.cdr.markForCheck();
//       },
//       error: (err) => {
//         this.isLoading = false;
//         console.error(err);
//         this.messageService.showError('Error', 'Failed to fetch notes.');
//       }
//     });
//   }

//   applyFilters() {
//     this.getData(true);
//   }

//   resetFilters() {
//     this.noteFilter = { type: null, status: null, search: '' };
//     this.getData(true);
//   }

//   onScrolledToBottom() {
//     if (!this.isLoading && this.data.length < this.totalCount) {
//       this.getData(false);
//     }
//   }

//   // --- Grid Events ---
//   eventFromGrid(event: any) {
//     if (event.type === 'cellClicked') {
//       // Optional: View details
//       // const id = event.row._id;
//       // this.router.navigate(['/notes/details', id]);
//     }

//     if (event.type === 'editStart') {
//        // Optional: Edit
//        // const id = event.row._id;
//        // this.router.navigate(['/notes/edit', id]);
//     }

//     if (event.type === 'delete') {
//       const id = event.row._id;
//       const title = event.row.title;
      
//       this.confirmationService.confirm({
//         message: `Are you sure you want to permanently delete <b>${title}</b>?`,
//         header: 'Confirm Delete',
//         icon: 'pi pi-exclamation-triangle',
//         acceptButtonStyleClass: 'p-button-danger p-button-text',
//         rejectButtonStyleClass: 'p-button-secondary p-button-text',
//         accept: () => {
//           this.deleteNote(id);
//         }
//       });
//     }

//     if (event.type === 'reachedBottom') {
//       this.onScrolledToBottom();
//     }
//   }

//   private deleteNote(id: string) {
//     this.noteService.hardDeleteNote(id).subscribe({
//       next: () => {
//         this.messageService.showSuccess('Deleted', 'Note removed successfully');
//         this.data = this.data.filter(n => n._id !== id);
//         this.cdr.markForCheck();
//       },
//       error: (err) => {
//         this.messageService.showError('Error', err.error?.message || 'Failed to delete note');
//       }
//     });
//   }

//   // --- Column Definition ---
//   setupColumns(): void {
//     this.column = [
//       // 1. TITLE
//       {
//         field: 'title',
//         headerName: 'Title',
//         width: 220,
//         pinned: 'left',
//         sortable: true,
//         filter: true,
//         cellStyle: {
//           'display': 'flex',
//           'align-items': 'center',
//           'font-weight': '600',
//           'color': 'var(--text-primary)',
//           'font-size': '13px'
//         }
//       },

//       // 2. TYPE (Icon + Text)
//       {
//         field: 'noteType',
//         headerName: 'Type',
//         width: 120,
//         filter: true,
//         cellRenderer: (params: any) => {
//           const type = params.value || 'note';
//           let icon = 'pi-file';
//           let color = '#64748b'; // default gray

//           if (type === 'meeting') { icon = 'pi-calendar'; color = '#8b5cf6'; } // Purple
//           if (type === 'task') { icon = 'pi-check-square'; color = '#0ea5e9'; } // Blue
//           if (type === 'note') { icon = 'pi-file-edit'; color = '#f59e0b'; } // Amber

//           return `
//             <div style="display:flex; align-items:center; height:100%; gap:8px;">
//                <i class="pi ${icon}" style="color:${color}; font-size:14px;"></i>
//                <span style="text-transform:capitalize; color:var(--text-secondary); font-size:12px;">${type}</span>
//             </div>
//           `;
//         }
//       },

//       // 3. PRIORITY (Badge)
//       {
//         field: 'priority',
//         headerName: 'Priority',
//         width: 110,
//         cellRenderer: (params: any) => {
//           const priority = params.value || 'medium';
//           let bg = '#eff6ff'; let text = '#3b82f6'; // medium blue

//           if (priority === 'urgent' || priority === 'high') { bg = '#fef2f2'; text = '#ef4444'; }
//           if (priority === 'low') { bg = '#f0fdf4'; text = '#22c55e'; }

//           return `
//             <div style="display:flex; align-items:center; height:100%;">
//               <span style="background:${bg}; color:${text}; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:700; text-transform:uppercase;">
//                 ${priority}
//               </span>
//             </div>
//           `;
//         }
//       },

//       // 4. OWNER (Avatar)
//       {
//         field: 'owner',
//         headerName: 'Owner',
//         width: 180,
//         cellRenderer: (params: any) => {
//           const name = params.data.owner?.name || 'Unknown';
//           const email = params.data.owner?.email || '';
//           const initial = name.charAt(0).toUpperCase();
          
//           return `
//             <div style="display:flex; align-items:center; height:100%; gap:8px;">
//                <div style="width:24px; height:24px; border-radius:50%; background:#e2e8f0; color:#475569; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold;">
//                   ${initial}
//                </div>
//                <div style="display:flex; flex-direction:column; line-height:1.2;">
//                   <span style="font-size:12px; font-weight:500; color:var(--text-primary);">${name}</span>
//                   <span style="font-size:10px; color:var(--text-tertiary);">${email}</span>
//                </div>
//             </div>
//           `;
//         }
//       },

//       // 5. STATUS (Styled Badge similar to Reference)
//       {
//         field: 'status',
//         headerName: 'Status',
//         width: 120,
//         cellRenderer: (params: any) => {
//           const status = params.value;
          
//           const isActive = status === 'active';
//           const bg = isActive ? '#ecfdf5' : '#f3f4f6';
//           const color = isActive ? '#15803d' : '#4b5563';
//           const border = isActive ? '#bbf7d0' : '#e5e7eb';
          
//           return `
//             <div style="display:flex; align-items:center; height:100%;">
//               <span style="
//                 background-color: ${bg}; 
//                 color: ${color}; 
//                 border: 1px solid ${border}; 
//                 padding: 1px 8px; 
//                 border-radius: 4px; 
//                 font-size: 10px; 
//                 font-weight: 700; 
//                 text-transform: uppercase; 
//                 line-height: 1.2; 
//                 letter-spacing: 0.5px;
//               ">
//                 ${status}
//               </span>
//             </div>`;
//         }
//       },

//       // 6. CREATED DATE
//       {
//         field: 'createdAt',
//         headerName: 'Created',
//         width: 140,
//         cellRenderer: (params: any) => {
//            if (!params.value) return '-';
//            // Simple date formatting using JS, or you can use a custom formatter if you prefer
//            const date = new Date(params.value).toLocaleDateString();
//            return `<span style="color:var(--text-secondary); font-size:12px;">${date}</span>`;
//         }
//       },

//       // 7. DUE DATE (Conditional)
//       {
//         field: 'dueDate',
//         headerName: 'Due Date',
//         width: 140,
//         cellRenderer: (params: any) => {
//            if (!params.value) return `<span style="color:var(--text-tertiary); font-size:11px;">-</span>`;
//            const date = new Date(params.value).toLocaleDateString();
//            return `<span style="color:var(--text-secondary); font-size:12px; font-family:monospace;">${date}</span>`;
//         }
//       }
//     ];
//     this.cdr.detectChanges();
//   }
// }