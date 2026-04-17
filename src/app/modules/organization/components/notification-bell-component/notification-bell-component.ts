import { Component, OnInit, inject, effect, EventEmitter, Output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Services
import { NotificationService, NotificationData } from '../../../../core/services/notification.service';
import { AppMessageService } from '../../../../core/services/message.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
import { OrganizationService } from './../../organization.service';
import { AnnouncementService } from '../../../../core/services/announcement.service';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MasterDropdownComponent } from '../../../shared/components/masterFilterDropdown/master-dropdown.component';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DatePipe, SelectModule, MultiSelectModule,
    InputTextModule, TextareaModule, ButtonModule, BadgeModule,
    TooltipModule, SkeletonModule, MasterDropdownComponent
  ],
  templateUrl: './notification-bell-component.html',
  styleUrl: './notification-bell-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationBellComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private messageService = inject(AppMessageService);
  private orgService = inject(OrganizationService);
  // private masterList = inject(MasterListService);
  private announcementService = inject(AnnouncementService);
  private cdr = inject(ChangeDetectorRef);

  // Data
  unreadList: NotificationData[] = [];
  historyList: NotificationData[] = [];
  allNotifications: NotificationData[] = [];
  pendingMembers: any[] = [];

  // UI State
  unreadCount = 0;
  isLoading = false;
  activeTab = 0;
  showAnnouncementSuccess = false;

  // Master Data
  // roles: any[] = [];
  // branches: any[] = [];
  // users: any[] = [];
  selectedRoles: { [userId: string]: string } = {};
  selectedBranches: { [userId: string]: string } = {};

  // Announcement
  announcement = { title: '', message: '', type: 'info', targetAudience: 'all' };
  selectedTargetIds: string[] = [];
  audienceOptions = [
    { label: 'Entire Organization', value: 'all' },
    { label: 'Specific Roles', value: 'role' },
    { label: 'Specific People', value: 'specific' }
  ];
  typeOptions = [
    { label: 'Information', value: 'info', icon: 'pi pi-info-circle' },
    { label: 'Success', value: 'success', icon: 'pi pi-check-circle' },
    { label: 'Warning', value: 'warning', icon: 'pi pi-exclamation-triangle' },
    { label: 'Urgent', value: 'urgent', icon: 'pi pi-megaphone' }
  ];

  @Output() close = new EventEmitter<void>();

  constructor() {
    // effect(() => {
    //   this.roles = this.masterList.roles();
    //   this.users = this.masterList.users();
    //   this.branches = this.masterList.branches();
    //   this.cdr.markForCheck();
    // });

    this.notificationService.notifications$
      .pipe(takeUntilDestroyed())
      .subscribe((response: any) => {
        // 1. Ensure we always have an array. 
        // If the API returns an object like { data: [...] }, adjust the fallback accordingly.
        const safeNotifications = Array.isArray(response)
          ? response
          : (response?.data || response?.notifications || []);

        this.allNotifications = safeNotifications;
        this.historyList = safeNotifications;
        this.unreadList = safeNotifications.filter((n: any) => !n.isRead);

        this.checkForSignupRequests();
        this.cdr.markForCheck();
      });

    this.notificationService.unreadCount$
      .pipe(takeUntilDestroyed())
      .subscribe(count => {
        this.unreadCount = count;
        this.cdr.markForCheck();
      });
  }

  ngOnInit() {
    this.fetchPendingMembers();

    // Auto-select tab based on available notifications
    setTimeout(() => {
      if (this.unreadCount > 0) this.activeTab = 0;
      else if (this.pendingMembers.length > 0) this.activeTab = 1;
      else this.activeTab = 2;
      this.cdr.markForCheck();
    });
  }

  checkForSignupRequests() {
    const hasSignup = this.allNotifications.some(
      n => n.title === 'New Signup Request' || n.metadata?.type === 'SIGNUP_REQUEST'
    );
    if (hasSignup) this.fetchPendingMembers();
  }

  switchTab(index: number) {
    this.activeTab = index;
  }

  closeDialog() {
    this.close.emit();
  }

  onAudienceChange() {
    this.selectedTargetIds = [];
  }

  getIcon(type: string | undefined): string {
    switch (type) {
      case 'success': return 'pi-check-circle';
      case 'warning': return 'pi-exclamation-triangle';
      case 'urgent': return 'pi-megaphone';
      default: return 'pi-info-circle';
    }
  }

  getIconColor(type: string | undefined): string {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'urgent': return 'error';
      default: return 'info';
    }
  }

  fetchPendingMembers() {
    this.isLoading = true;
    this.orgService.getPendingMembers().subscribe({
      next: (res) => {
        this.pendingMembers = res.data?.pendingMembers || [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  markAsRead(notification: NotificationData) {
    if (notification.isRead || !notification._id) return;
    this.notificationService.markAsRead(notification._id).subscribe({
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  markAllRead() {
    if (this.unreadList.length === 0) return;
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.messageService.showSuccess('All notifications marked as read.');
        if (this.activeTab === 0) this.activeTab = 2; // Move to history
        this.cdr.markForCheck();
      },
      error: (err: any) => this.messageService.handleHttpError(err)
    });
  }

  approveMember(member: any) {
    const userId = member._id;
    const roleId = this.selectedRoles[userId];
    const branchId = this.selectedBranches[userId];

    if (!roleId || !branchId) {
      this.messageService.showWarn('Please select a role and branch.');
      return;
    }

    this.orgService.approveMember({ userId, roleId, branchId }).subscribe({
      next: () => {
        this.messageService.showSuccess(`Approved: ${member.name}`);
        this.pendingMembers = this.pendingMembers.filter(m => m._id !== userId);
        const notif = this.allNotifications.find(n => n.metadata?.userId === userId && n.title.includes('Signup Request'));
        if (notif?._id) this.notificationService.removeNotification(notif._id);
        this.cdr.markForCheck();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  rejectMember(member: any) {
    const userId = member._id;
    this.orgService.rejectMember({ userId }).subscribe({
      next: () => {
        this.messageService.showSuccess(`Rejected: ${member.name}`);
        this.pendingMembers = this.pendingMembers.filter(m => m._id !== userId);
        const notif = this.allNotifications.find(n => n.metadata?.userId === userId && n.title.includes('Signup Request'));
        if (notif?._id) this.notificationService.removeNotification(notif._id);
        this.cdr.markForCheck();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  sendAnnouncement() {
    if (!this.announcement.title || !this.announcement.message) {
      this.messageService.showWarn('Title and message are required.');
      return;
    }

    const payload = { ...this.announcement, targetIds: this.selectedTargetIds };

    this.announcementService.createAnnouncement(payload).subscribe({
      next: () => {
        this.messageService.showSuccess('Announcement broadcasted successfully.');
        this.announcement = { title: '', message: '', type: 'info', targetAudience: 'all' };
        this.selectedTargetIds = [];
        this.showAnnouncementSuccess = true;
        this.cdr.markForCheck();

        setTimeout(() => {
          this.showAnnouncementSuccess = false;
          this.activeTab = 2;
          this.cdr.markForCheck();
        }, 2000);
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }
}