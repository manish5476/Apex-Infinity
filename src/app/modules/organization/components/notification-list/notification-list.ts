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
import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { CommonMethodService } from '@core/utils/common-method.service';
import { AnnouncementService, CreateAnnouncementPayload, UpdateAnnouncementPayload } from '@core/services/announcement.service';

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
    AgShareGrid, HasPermissionDirective,
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
  columns: any[] = [];
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

  readonly actionColumn: ActionColumnConfig = {
    showView: false,
    showEdit: true,
    showDelete: true,
    editPermission: PERMISSIONS.ANNOUNCEMENT?.MANAGE,
    deletePermission: PERMISSIONS.ANNOUNCEMENT?.MANAGE,
  };

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

    this.announcementSvc.getAllAnnouncements(params).subscribe({
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
      this.announcementSvc.createAnnouncement(payload).subscribe({
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
      this.announcementSvc.updateAnnouncement(id, payload).subscribe({
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
        this.announcementSvc.deleteAnnouncement(row._id).subscribe({
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
    this.announcementSvc.markAsRead(row._id).subscribe({
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
        headerName: '#',
        valueGetter: 'node.rowIndex + 1',
        width: 52,
        sortable: false,
        filter: false,
        suppressMenu: true,
        pinned: 'left',
        cellStyle: { color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'center' },
      },
      {
        headerName: 'Title',
        flex: 2,
        minWidth: 200,
        sortable: true,
        filter: true,
        valueGetter: (p: any) => p.data,
        valueFormatter: (p: any) => p.data?.title ?? '',
        cellRenderer: (p: any) => {
          const row = p.value;
          const pinBadge = row.isPinned
            ? `<span style="font-size:9px;padding:1px 6px;border-radius:99px;background:var(--accent-focus);color:var(--accent-primary);font-weight:700;margin-left:6px">📌 PINNED</span>` : '';
          const urgentBadge = row.isUrgent
            ? `<span style="font-size:9px;padding:1px 6px;border-radius:99px;background:var(--color-error-bg);color:var(--color-error-dark);font-weight:700;margin-left:4px">🔴 URGENT</span>` : '';
          return `
            <div style="padding:4px 0;line-height:1.35">
              <div style="display:flex;align-items:center;flex-wrap:wrap;gap:2px">
                <span style="font-size:13px;font-weight:600;color:var(--text-primary)">${row.title}</span>
                ${pinBadge}${urgentBadge}
              </div>
              <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:340px">${row.message}</div>
            </div>`;
        },
      },
      {
        headerName: 'Type',
        field: 'type',
        width: 110,
        sortable: true,
        filter: true,
        cellRenderer: (p: any) => {
          const map: Record<string, [string, string, string]> = {
            info: ['var(--color-info-bg)', 'var(--color-info-dark)', 'ℹ'],
            warning: ['var(--color-warning-bg)', 'var(--color-warning-dark)', '⚠'],
            success: ['var(--color-success-bg)', 'var(--color-success-dark)', '✓'],
            alert: ['var(--color-error-bg)', 'var(--color-error-dark)', '!'],
          };
          const [bg, color, icon] = map[p.value] || ['var(--bg-ternary)', 'var(--text-secondary)', '·'];
          return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:${bg};color:${color}">${icon} ${p.value}</span>`;
        },
      },
      {
        headerName: 'Audience',
        field: 'targetAudience',
        width: 120,
        sortable: true,
        filter: true,
        cellRenderer: (p: any) => {
          const map: Record<string, string> = { all: '🌐', staff: '👥', customers: '🤝' };
          const icon = map[p.value] ?? '—';
          return `<span style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:5px">${icon} <span style="text-transform:capitalize">${p.value}</span></span>`;
        },
      },
      {
        headerName: 'Priority',
        field: 'priority',
        width: 105,
        sortable: true,
        cellRenderer: (p: any) => {
          const map: Record<string, [string, string]> = {
            high: ['var(--color-error-bg)', 'var(--color-error-dark)'],
            medium: ['var(--color-warning-bg)', 'var(--color-warning-dark)'],
            low: ['var(--bg-ternary)', 'var(--text-secondary)'],
          };
          const [bg, color] = map[p.value] || ['var(--bg-ternary)', 'var(--text-secondary)'];
          return `<span style="padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;text-transform:capitalize;background:${bg};color:${color}">${p.value}</span>`;
        },
      },
      {
        headerName: 'Sender',
        field: 'senderId',
        minWidth: 130,
        flex: 1,
        valueFormatter: (p: any) => p.value?.name ?? '—',
        cellRenderer: (p: any) => {
          const name = p.value?.name ?? '—';
          const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
          return `
            <div style="display:flex;align-items:center;gap:7px;padding:4px 0">
              <div style="width:24px;height:24px;border-radius:50%;background:var(--accent-focus);color:var(--accent-primary);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0">${initials}</div>
              <span style="font-size:12px;color:var(--text-secondary)">${name}</span>
            </div>`;
        },
      },
      {
        headerName: 'Status',
        field: 'isActive',
        width: 100,
        cellRenderer: (p: any) => p.value
          ? `<span style="padding:2px 10px;border-radius:99px;font-size:10px;font-weight:700;background:var(--color-success-bg);color:var(--color-success-dark)">Active</span>`
          : `<span style="padding:2px 10px;border-radius:99px;font-size:10px;font-weight:700;background:var(--bg-ternary);color:var(--text-secondary)">Inactive</span>`,
      },
      {
        headerName: 'Created',
        field: 'createdAt',
        minWidth: 130,
        sortable: true,
        valueFormatter: (p: any) => this.common.formatDate(p.value),
        cellRenderer: (p: any) => `
          <div style="font-size:11px;color:var(--text-secondary);line-height:1.4">
            <div>${c.formatDate(p.value)}</div>
            <div style="font-size:10px;color:var(--text-tertiary)">${c.timeAgoText(p.value)}</div>
          </div>`,
      },
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