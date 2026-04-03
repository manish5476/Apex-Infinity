import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';

// Shared
import { SessionService } from '../../services/session.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";
import { AppMessageService } from '@core/services/message.service';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [
    CommonModule,

    FormsModule,
    ButtonModule,
    DialogModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    AgShareGrid,
    SelectModule,
    InputTextModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './sessions.html',
  styleUrl: './sessions.scss',
})
export class Sessions implements OnInit {
  // --- Injections ---
  private cdr = inject(ChangeDetectorRef);
  private sessionService = inject(SessionService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  public common = inject(CommonMethodService);
  selectedIds: any[]=[]
  // --- Grid State ---
  private gridApi!: GridApi;
  data: any[] = [];
  column: any = [];
  isLoading = signal(false);
  rowSelectionMode: any = 'single';

  // --- View State ---
  viewMode = signal<'all' | 'mine'>('all');

  // --- Filter State ---
  filter = signal({
    search: '',
    os: null,
    browser: null
  });

  // --- Options ---
  osOptions = [
    { label: 'Windows', value: 'Windows' },
    { label: 'macOS', value: 'Mac OS X' },
    { label: 'Linux', value: 'Linux' },
    { label: 'iOS', value: 'iOS' },
    { label: 'Android', value: 'Android' }
  ];

  browserOptions = [
    { label: 'Chrome', value: 'Chrome' },
    { label: 'Safari', value: 'Safari' },
    { label: 'Firefox', value: 'Firefox' },
    { label: 'Edge', value: 'Edge' },
    { label: 'Opera', value: 'Opera' }
  ];

  // --- Dialog State ---
  displayDialog: boolean = false;
  selectedSession: any = null;
  isRevoking = signal(false);
  isDeleting = signal(false); // New signal for delete state

  ngOnInit(): void {
    this.initColumns();
    this.loadData();
  }

  // --- Data Loading ---
  loadData() {
    this.isLoading.set(true);
    this.data = [];
    
    // Prepare filter params
    const params: any = {};
    if (this.filter().search) params.q = this.filter().search;
    if (this.filter().os) params.os = this.filter().os;
    if (this.filter().browser) params.browser = this.filter().browser;

    const req$ = this.viewMode() === 'mine'
      ? this.sessionService.getMySessions()
      : this.sessionService.getAllSessions(params);

    req$.subscribe({
      next: (res: any) => {
        const rows = res.data?.data || res.data || [];
        this.data = rows;
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.handleHttpError(err)
      }
    });
  }

  applyFilters() {
    this.loadData();
  }

  resetFilters() {
    this.filter.set({
      search: '',
      os: null,
      browser: null
    });
    this.loadData();
  }

  toggleViewMode(mode: 'all' | 'mine') {
    if (this.viewMode() === mode) return;
    this.viewMode.set(mode);
    this.initColumns();
    this.loadData();
  }

  // --- Grid Configuration ---
  initColumns(): void {
    this.column = [
      {
        field: 'isValid',
        headerName: 'Status',
        width: 130,
        cellRenderer: (params: any) => {
          // Determine status string
          const status = params.value ? 'active' : 'revoked';
          const label = params.value ? 'Active' : 'Revoked';
          return `<span class="status-badge status-${status}">${label}</span>`;
        }
      },
      ...(this.viewMode() === 'all' ? [{
        field: 'userId.name', // Access nested property directly for sorting/filtering
        headerName: 'User',
        sortable: true,
        filter: true,
        width: 180,
        cellStyle: { fontWeight: '600', color: 'var(--text-primary)' },
        valueGetter: (params: any) => {
          // Handle case where population might fail or user is deleted
          return params.data.userId?.name || 'Unknown User';
        }
      }] : []),
      {
        field: 'ipAddress',
        headerName: 'IP Address',
        sortable: true,
        filter: true,
        width: 160,
        cellStyle: { fontFamily: 'monospace' }
      },
      {
        field: 'browser', // Backend splits this now usually, or use device string
        headerName: 'Browser',
        width: 150
      },
      {
        field: 'os',
        headerName: 'OS',
        width: 150
      },
      {
        field: 'lastActivityAt',
        headerName: 'Last Active',
        sortable: true,
        width: 200,
        valueFormatter: (params: any) => this.common.formatDate(params.value, 'medium')
      }
    ];
    this.cdr.detectChanges();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  eventFromGrid(event: any) {
    if (event.type === 'cellClicked') {
      this.openSessionDetails(event.row);
    }
    if (event.type === 'selectionChanged') {
      this.selectedIds = event.rows.map((item: any) => item._id)
      console.log(this.selectedIds);
    }
  }

  // --- Actions ---

  openSessionDetails(session: any) {
    this.selectedSession = session;
    this.displayDialog = true;
  }

  revokeSession() {
    if (!this.selectedSession) return;
    this.confirmationService.confirm({
      message: 'Revoking this session will immediately log the user out. Continue?',
      header: 'Revoke Access',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        // this.isRevoking.set(true);
        this.sessionService.revokeSession(this.selectedSession._id).subscribe({
          next: (res:any) => {
            this.messageService.showSuccess(res.message)
            this.displayDialog = false;
            this.isRevoking.set(false);
            this.loadData();
          },
          error: (err) => {
            this.messageService.handleHttpError(err)
            this.isRevoking.set(false);
          }
        });
      }
    });
  }

  // 2. New Delete Method
  deleteSession() {
    if (!this.selectedSession) return;
    this.confirmationService.confirm({
      message: 'This will permanently delete the session record from history. This cannot be undone.',
      header: 'Delete Record',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger p-button-outlined',
      accept: () => {
        // this.isDeleting.set(true);
        this.sessionService.deleteSession(this.selectedSession._id).subscribe({
          next: (res:any) => {
            this.messageService.showSuccess(res.message)
            this.displayDialog = false;
            this.isDeleting.set(false);
            this.loadData();
          },
          error: (err) => {
            this.messageService.handleHttpError(err)
            this.isDeleting.set(false);
          }
        });
      }
    });
  }

  deleteBulkSession() {
    this.confirmationService.confirm({
      message: 'This will permanently delete the session record from history. This cannot be undone.',
      header: 'Delete Record',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger p-button-outlined',
      accept: () => {
        let payload = this.selectedIds
        this.sessionService.bulkDeleteSessions(payload).subscribe({
          next: (res:any) => {
            this.messageService.showSuccess(res.message)
            this.displayDialog = false;
            this.isDeleting.set(false);
            this.loadData();
          },
          error: (err) => {
            this.messageService.handleHttpError(err)
            this.isDeleting.set(false);
          }
        });
      }
    });
  }

  revokeAllOthers() {
    this.confirmationService.confirm({
      message: 'This will log you out from all other devices. Continue?',
      header: 'Secure Account',
      icon: 'pi pi-shield',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.sessionService.revokeAllOthers().subscribe({
          next: (res:any) => {
            this.messageService.showSuccess(res.message)
            this.loadData();
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }
}
