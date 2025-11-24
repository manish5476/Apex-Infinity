import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../../core/services/api';
import { NotificationService } from '../../../../core/services/notification.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    BadgeModule,
    TooltipModule,
    SkeletonModule,
    SelectModule
  ],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss'
})
export class NotificationBellComponent implements OnInit {

  private apiService = inject(ApiService);
  private notificationService = inject(NotificationService);
  private masterList = inject(MasterListService);
  private messageService = inject(AppMessageService);

  showDropdown = false;
  isLoading = false;

  activeSection: 'new' | 'approvals' | 'all' = 'new';

  realtimeNotifications: any[] = [];
  allNotifications: any[] = [];
  pendingMembers: any[] = [];

  unreadCount = 0;

  roles: any[] = [];
  branches: any[] = [];

  selectedRoles: { [userId: string]: string } = {};
  selectedBranches: { [userId: string]: string } = {};

  constructor() {
    effect(() => {
      this.roles = this.masterList.roles();
      this.branches = this.masterList.branches();
    });
  }

  ngOnInit() {
    this.notificationService.notifications$.subscribe(data => {
      this.realtimeNotifications = data.filter(n => !n.isRead);
      this.unreadCount = this.realtimeNotifications.length;
    });

    this.loadData();
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.loadData();
    }
  }

  loadData() {
    this.isLoading = true;
    this.masterList.refresh();

    this.apiService.getPendingMembers().subscribe(res => {
      this.pendingMembers = res.data.pendingMembers || [];
    });

    this.apiService.getAllNotifications().subscribe({
      next: res => {
        this.allNotifications = res.data.notifications || [];
        this.realtimeNotifications = this.allNotifications.filter(n => !n.isRead);
        this.unreadCount = this.realtimeNotifications.length;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  markAsRead(notification: any) {
    this.notificationService.markAsRead(notification._id);
  }

  approveMember(member: any) {
    const roleId = this.selectedRoles[member._id];
    const branchId = this.selectedBranches[member._id];

    if (!roleId || !branchId) {
      this.messageService.showWarn('Missing Info', 'Please select both role and branch.');
      return;
    }

    const payload = {
      userId: member._id,
      roleId,
      branchId
    };

    this.apiService.approveMember(payload).subscribe({
      next: () => {
        this.messageService.showSuccess('Approved', `${member.name} activated.`);
        this.loadData();
      }
    });
  }
}