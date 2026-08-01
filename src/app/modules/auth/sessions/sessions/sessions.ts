import { ChangeDetectorRef, Component, OnInit, inject, signal, OnDestroy } from '@angular/core';

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
import { AppMessageService } from '../../../../core/services/message.service';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

// --- Shared UI ---
import { PageComponent } from '../../../../shared/ui/layout/page/page.component';
import { PageHeaderComponent } from '../../../../shared/ui/layout/page-header/page-header.component';
import { PageContentComponent } from '../../../../shared/ui/layout/page-content/page-content.component';
import { DataGridComponent, GridColumn, GridRowAction } from '../../../../shared/ui/grid';
import { DialogComponent } from '../../../../shared/ui/dialog/dialog.component';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    DialogComponent,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    SelectModule,
    InputTextModule,
    PageComponent,
    PageHeaderComponent,
    PageContentComponent,
    DataGridComponent
],
  providers: [ConfirmationService, MessageService],
  templateUrl: './sessions.html',
  styleUrl: './sessions.scss',
})
export class Sessions implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  // --- Injections ---
  private cdr = inject(ChangeDetectorRef);
  private sessionService = inject(SessionService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  public common = inject(CommonMethodService);
  selectedIds: any[]=[]
  // --- Grid State ---
  data: any[] = [];
  column: GridColumn[] = [];
  rowActions: GridRowAction[] = [];
  isLoading = signal(false);

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

    req$.pipe(takeUntil(this.destroy$)).subscribe({
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
        header: 'Status',
        width: '110px',
        type: 'status',
        formatter: (value: any) => value ? 'Active' : 'Revoked'
      },
      ...(this.viewMode() === 'all' ? [{
        field: 'userId.name', 
        header: 'User',
        sortable: true,
        filterable: true,
        width: '180px',
        formatter: (value: any, row: any) => row.userId?.name || 'Unknown User'
      }] : []),
      {
        field: 'ipAddress',
        header: 'IP Address',
        sortable: true,
        filterable: true,
        width: '140px'
      },
      {
        field: 'browser', 
        header: 'Browser',
        width: '130px',
        filterable: true
      },
      {
        field: 'os',
        header: 'OS',
        width: '130px',
        filterable: true
      },
      {
        field: 'lastActivityAt',
        header: 'Last Active',
        sortable: true,
        width: '160px',
        formatter: (value: any) => this.common.formatDate(value, 'medium')
      }
    ];

    this.rowActions = [
      {
        id: 'view',
        icon: 'pi pi-eye',
        label: 'View Details',
        callback: (row: any) => this.openSessionDetails(row)
      },
      {
        id: 'revoke',
        icon: 'pi pi-power-off',
        label: 'Revoke Access',
        variant: 'danger',
        callback: (row: any) => { 
          this.selectedSession = row; 
          if(row.isValid) this.revokeSession(); 
        }
      },
      {
        id: 'delete',
        icon: 'pi pi-trash',
        label: 'Delete Record',
        variant: 'danger',
        callback: (row: any) => { this.selectedSession = row; this.deleteSession(); }
      }
    ];
    this.cdr.detectChanges();
  }

  onSelectionChange(selected: any[]) {
    this.selectedIds = selected.map((item: any) => item._id);
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
        this.sessionService.revokeSession(this.selectedSession._id).pipe(takeUntil(this.destroy$)).subscribe({
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
        this.sessionService.deleteSession(this.selectedSession._id).pipe(takeUntil(this.destroy$)).subscribe({
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
        this.sessionService.bulkDeleteSessions(payload).pipe(takeUntil(this.destroy$)).subscribe({
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
        this.sessionService.revokeAllOthers().pipe(takeUntil(this.destroy$)).subscribe({
          next: (res:any) => {
            this.messageService.showSuccess(res.message)
            this.loadData();
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
