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

// Shared
import { SessionService } from '../../services/session.service';
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { AgShareGrid } from "../../../shared/components/ag-shared-grid";

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
    TooltipModule,
    AgShareGrid
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './sessions.html',
  styleUrl: './sessions.scss',
})
export class Sessions implements OnInit {
  // --- Injections ---
  private cdr = inject(ChangeDetectorRef);
  private sessionService = inject(SessionService);
  private messageService = inject(MessageService);
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
    this.data = [];
    const req$ = this.viewMode() === 'mine'
      ? this.sessionService.getMySessions()
      : this.sessionService.getAllSessions();
    req$.subscribe({
      next: (res: any) => {
        const rows = res.data?.data || res.data || [];
        this.data = rows;
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load sessions' });
      }
    });
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
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Session revoked' });
            this.displayDialog = false;
            this.isRevoking.set(false);
            this.loadData();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed' });
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
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Record removed' });
            this.displayDialog = false;
            this.isDeleting.set(false);
            this.loadData();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not delete' });
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
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Records removed' });
            this.displayDialog = false;
            this.isDeleting.set(false);
            this.loadData();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not delete' });
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
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'All other sessions revoked' });
            this.loadData();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed' })
        });
      }
    });
  }
}
