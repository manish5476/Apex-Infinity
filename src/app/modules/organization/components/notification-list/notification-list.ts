import {
  ChangeDetectorRef, Component, OnInit, OnDestroy,
  inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { GridApi } from 'ag-grid-community';

import { AppMessageService } from '../../../../core/services/message.service';

import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { CommonMethodService } from '@core/utils/common-method.service';
import { AnnouncementService, CreateAnnouncementPayload, UpdateAnnouncementPayload } from '@core/services/announcement.service';
import { takeUntil } from "rxjs/operators";
import { SearchFilterComponent } from '@shared/ui/filters/search-filter.component';
import { SelectFilterComponent } from '@shared/ui/filters/select-filter.component';
import { DataGridComponent, GridColumn, GridRowAction } from '@shared/ui/grid';
import { PageContentComponent } from '@shared/ui/layout/page-content/page-content.component';
import { PageHeaderComponent } from '@shared/ui/layout/page-header/page-header.component';
import { PageComponent } from '@shared/ui/layout/page/page.component';

// ─── Form Model ───────────────────────────────────────────────
interface AnnouncementForm {
  title: string;
  message: string;
  type: string;
  targetAudience: string;
  priority: string;
  isPinned: boolean;
  isUrgent: boolean;
  isActive: boolean;
}

@Component({
  selector: 'app-announcement-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, DialogModule, SelectModule,
    InputTextModule, TextareaModule, ToastModule,
    ToggleSwitchModule, TooltipModule, ConfirmDialogModule,
    HasPermissionDirective,
    DataGridComponent, PageComponent, PageHeaderComponent, PageContentComponent,
     SelectFilterComponent,
  ],
  providers: [AnnouncementService, ConfirmationService],
  templateUrl: './announcement-list.html',
  styleUrl: './announcement-list.scss',
})
export class AnnouncementList implements OnInit, OnDestroy {
  readonly PERMISSIONS = PERMISSIONS;

  private destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  private announcementSvc = inject(AnnouncementService);
  private messageService = inject(AppMessageService);
  private confirmSvc = inject(ConfirmationService);
  public common = inject(CommonMethodService);
  private gridApi!: GridApi;

  // ── Pagination ───────────────────────────────────────────────
  private currentPage = 1;
  private pageSize = 50;
  private isLoading = false;
  private hasNextPage = true;

  // ── State ────────────────────────────────────────────────────
  data = signal<any[]>([]);
  columns: GridColumn[] = [];
  stats = signal<any>(null);
  dialogOpen = signal(false);
  dialogMode = signal<'create' | 'edit'>('create');
  dialogLoading = signal(false);
  selectedId = signal<string | null>(null);

  // ── Filter ───────────────────────────────────────────────────
  filterType: string | null = null;
  filterAudience: string | null = null;
  filterStatus: string | null = null;

  // ── Options ──────────────────────────────────────────────────
  typeOptions = [
    { label: 'Info', value: 'info' },
    { label: 'Warning', value: 'warning' },
    { label: 'Success', value: 'success' },
    { label: 'Alert', value: 'alert' },
  ];

  audienceOptions = [
    { label: 'All', value: 'all' },
    { label: 'Staff', value: 'staff' },
    { label: 'Customers', value: 'customers' },
  ];

  priorityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
  ];

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  // ── Form ─────────────────────────────────────────────────────
  form: AnnouncementForm = this.emptyForm();

  // ── Computed ─────────────────────────────────────────────────
  totalUnread = computed(() => this.stats()?.totalUnread ?? 0);

  readonly rowActions: GridRowAction[] = [
    {
      id: 'edit',
      icon: 'pi pi-pencil',
      tooltip: 'Edit',
      permission: PERMISSIONS.ANNOUNCEMENT?.MANAGE,
      callback: (row) => this.openEdit(row),
    },
    {
      id: 'delete',
      icon: 'pi pi-trash',
      tooltip: 'Delete',
      variant: 'danger',
      permission: PERMISSIONS.ANNOUNCEMENT?.MANAGE,
      callback: (row) => this.confirmDelete(row),
    }
  ];

  // ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildColumns();
    this.loadStats();
    this.loadData(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Stats ────────────────────────────────────────────────────
  loadStats(): void {
    this.common.apiCall(
      this.announcementSvc.getAnnouncementStats(),
      (res: any) => {
        if (res.status === 'success') this.stats.set(res.data.stats);
        this.cdr.markForCheck();
      },
      'Load Announcement Stats',
      { skipLoading: true, destroy$: this.destroy$ }
    );
  }

  // ── List ─────────────────────────────────────────────────────
  loadData(reset = false): void {
    if (reset) {
      this.currentPage = 1;
      this.data.set([]);
      this.hasNextPage = true;
    }
    if (this.isLoading || (!reset && !this.hasNextPage)) return;
    this.isLoading = true;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
    };
    if (this.filterType) params['type'] = this.filterType;
    if (this.filterAudience) params['audience'] = this.filterAudience;
    if (this.filterStatus) params['status'] = this.filterStatus;

    this.announcementSvc.getAllAnnouncements(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const newData: any[] = res.data?.announcements ?? [];
        this.hasNextPage = res.page < res.totalPages;
        this.data.set(reset ? newData : [...this.data(), ...newData]);
        if (this.gridApi && !reset && newData.length)
          this.gridApi.applyTransaction({ add: newData });
        if (this.hasNextPage) this.currentPage++;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.handleHttpError(err);
        this.cdr.markForCheck();
      },
    });
  }

  applyFilters(): void {
    this.loadData(true);
    this.loadStats();
  }

  resetFilters(): void {
    this.filterType = this.filterAudience = this.filterStatus = null;
    this.loadData(true);
    this.loadStats();
  }

  // ── Grid Events ──────────────────────────────────────────────
  onGridEvent(event: any): void {
    if (event.type === 'init') { this.gridApi = event.api; return; }
    if (event.type === 'reachedBottom') { this.onScrollBottom(); }
    if (event.type === 'edit') { this.openEdit(event.row); }
    if (event.type === 'delete') { this.confirmDelete(event.row); }
  }

  onScrollBottom(): void {
    if (!this.isLoading && this.hasNextPage) this.loadData(false);
  }

  // ── Dialog ───────────────────────────────────────────────────
  openCreate(): void {
    this.form = this.emptyForm();
    this.selectedId.set(null);
    this.dialogMode.set('create');
    this.dialogOpen.set(true);
  }

  openEdit(row: any): void {
    this.form = {
      title: row.title ?? '',
      message: row.message ?? '',
      type: row.type ?? 'info',
      targetAudience: row.targetAudience ?? 'all',
      priority: row.priority ?? 'low',
      isPinned: row.isPinned ?? false,
      isUrgent: row.isUrgent ?? false,
      isActive: row.isActive ?? true,
    };
    this.selectedId.set(row._id);
    this.dialogMode.set('edit');
    this.dialogOpen.set(true);
  }

  closeDialog(): void { this.dialogOpen.set(false); }

  saveDialog(): void {
    if (!this.form.title.trim() || !this.form.message.trim()) {
      this.messageService.showWarn('Validation ,Title and message are required.');
      return;
    }

    this.dialogLoading.set(true);

    if (this.dialogMode() === 'create') {
      const payload: CreateAnnouncementPayload = {
        title: this.form.title,
        message: this.form.message,
        type: this.form.type,
        targetAudience: this.form.targetAudience,
        priority: this.form.priority,
        isPinned: this.form.isPinned,
        isUrgent: this.form.isUrgent,
      };
      this.announcementSvc.createAnnouncement(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.dialogLoading.set(false);
          this.dialogOpen.set(false);
          this.messageService.showSuccess('Created Announcement created successfully.');
          this.loadData(true);
          this.loadStats();
        },
        error: (err) => { this.dialogLoading.set(false); this.messageService.handleHttpError(err); },
      });
    } else {
      const id = this.selectedId()!;
      const payload: UpdateAnnouncementPayload = {
        title: this.form.title,
        message: this.form.message,
        type: this.form.type,
        targetAudience: this.form.targetAudience,
        priority: this.form.priority,
        isPinned: this.form.isPinned,
        isUrgent: this.form.isUrgent,
        isActive: this.form.isActive,
      };
      this.announcementSvc.updateAnnouncement(id, payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.dialogLoading.set(false);
          this.dialogOpen.set(false);
          this.messageService.showSuccess('Updated Announcement updated successfully.');
          this.loadData(true);
          this.loadStats();
        },
        error: (err) => { this.dialogLoading.set(false); this.messageService.handleHttpError(err); },
      });
    }
  }

  // ── Delete ───────────────────────────────────────────────────
  confirmDelete(row: any): void {
    this.confirmSvc.confirm({
      message: `Delete "${row.title}"? This cannot be undone.`,
      header: 'Delete Announcement',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.announcementSvc.deleteAnnouncement(row._id).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.messageService.showSuccess('Deleted Announcement removed.');
            this.data.set(this.data().filter(d => d._id !== row._id));
            this.loadStats();
            this.cdr.markForCheck();
          },
          error: (err) => this.messageService.handleHttpError(err),
        });
      },
    });
  }

  // ── Mark as Read ─────────────────────────────────────────────
  markRead(row: any): void {
    this.announcementSvc.markAsRead(row._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.messageService.showSuccess('Marked as read.');
        this.loadStats();
      },
    });
  }

  // ── Columns ──────────────────────────────────────────────────
  buildColumns(): void {
    const c = this.common;

    this.columns = [
      {
        header: 'Title',
        field: 'title',
        flex: 2,
        minWidth: '200px',
        formatter: (val: any, row: any) => {
          let extra = '';
          if (row.isPinned) extra += ' 📌 PINNED';
          if (row.isUrgent) extra += ' 🔴 URGENT';
          return extra ? `${val} ${extra}` : val;
        }
      },
      {
        header: 'Type',
        field: 'type',
        width: '110px',
        type: 'badge'
      },
      {
        header: 'Audience',
        field: 'targetAudience',
        width: '120px',
        formatter: (val: any) => {
          const map: Record<string, string> = { all: '🌐 All', staff: '👥 Staff', customers: '🤝 Customers' };
          return map[val] ?? val;
        }
      },
      {
        header: 'Priority',
        field: 'priority',
        width: '105px',
        type: 'badge'
      },
      {
        header: 'Sender',
        field: 'senderId',
        minWidth: '130px',
        flex: 1,
        formatter: (val: any) => val?.name ?? '—'
      },
      {
        header: 'Status',
        field: 'isActive',
        width: '100px',
        type: 'status',
        formatter: (val: any) => val ? 'Active' : 'Inactive'
      },
      {
        header: 'Created',
        field: 'createdAt',
        minWidth: '130px',
        formatter: (val: any) => this.common.formatDate(val)
      }
    ];
    this.cdr.detectChanges();
  }

  // ── Helpers ──────────────────────────────────────────────────
  private emptyForm(): AnnouncementForm {
    return {
      title: '', message: '', type: 'info',
      targetAudience: 'all', priority: 'low',
      isPinned: false, isUrgent: false, isActive: true,
    };
  }

  get dialogTitle(): string {
    return this.dialogMode() === 'create' ? 'New Announcement' : 'Edit Announcement';
  }
}