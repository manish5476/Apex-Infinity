import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';

// Services
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiService } from '../../../../core/services/api';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    BadgeModule,
    TooltipModule,
    SelectModule,
    SkeletonModule
  ],
  templateUrl: './notification-bell-component.html',
  styleUrls: ['./notification-bell-component.scss']
})
export class NotificationBellComponent implements OnInit {

  private notificationService = inject(NotificationService);
  private apiService = inject(ApiService);
  private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);

  // State ---
  realtimeNotifications: any[] = [];
  allNotifications: any[] = [];
  pendingMembers: any[] = [];

  roles: any[] = [];
  branches: any[] = [];

  selectedRoles: Record<string, string> = {};
  selectedBranches: Record<string, string> = {};

  activeTab: 'new' | 'approvals' | 'all' = 'new';
  showDropdown = false;
  unreadCount = 0;
  isLoading = false;

  constructor() {
    effect(() => {
      this.roles = this.masterList.roles();
      this.branches = this.masterList.branches();
    });
  }

  ngOnInit() {
    this.subscribeRealtime();
    this.loadData();
  }

  private subscribeRealtime() {
    this.notificationService.notifications$.subscribe(data => {
      this.realtimeNotifications = data;
      this.unreadCount = data.filter(n => !n.isRead).length;
    });
  }

  loadData() {
    this.isLoading = true;
    this.masterList.refresh();

    // Pending Member Approvals
    this.apiService.getPendingMembers().subscribe(res => {
      this.pendingMembers = res.data.pendingMembers || [];
    });

    // All Notifications
    this.apiService.getAllNotifications().subscribe(res => {
      this.allNotifications = res.data.notifications || [];
      this.realtimeNotifications = this.allNotifications.filter(n => !n.isRead);
      this.unreadCount = this.realtimeNotifications.length;
      this.isLoading = false;
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;

    if (this.showDropdown) {
      this.activeTab = 'new';
      this.loadData();
    }
  }

  markAsRead(notification: any) {
    if (!notification._id) return;

    this.notificationService.markAsRead(notification._id);
    notification.isRead = true;

    this.unreadCount = this.realtimeNotifications.filter(n => !n.isRead).length;
  }

  approveMember(member: any) {
    const id = member._id;
    const roleId = this.selectedRoles[id];
    const branchId = this.selectedBranches[id];

    if (!roleId || !branchId) {
      this.messageService.showWarn(
        'Missing Info',
        'Select both role and branch'
      );
      return;
    }

    const payload = { userId: id, roleId, branchId };

    this.apiService.approveMember(payload).subscribe({
      next: () => {
        this.messageService.showSuccess(
          'Approval Done',
          `${member.name} activated`
        );
        this.loadData();
      }
    });
  }
}