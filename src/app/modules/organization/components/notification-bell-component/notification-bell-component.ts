import { Component, OnInit, inject, effect } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../core/services/api';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';

// --- PrimeNG Modules ---
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { SelectModule } from 'primeng/select'; // Correct import for p-select
activeSection: 'new' | 'approvals' | 'all' = 'new';
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Tabs,
    SelectModule, // Correct import
    ButtonModule,
    BadgeModule,
    TooltipModule,
    SkeletonModule,
    TabList,
    Tab,
    TabPanels,
    TabPanel
  ],
  templateUrl: './notification-bell-component.html',
  styleUrl: './notification-bell-component.scss'
})
export class NotificationBellComponent implements OnInit {
  // --- Injections ---
  private notificationService = inject(NotificationService);
  private apiService = inject(ApiService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);

  // --- State ---
  realtimeNotifications: any[] = []; // <-- For "New" tab (Tab 0)
  allNotifications: any[] = [];      // <-- For "All" tab (Tab 2)
  pendingMembers: any[] = [];
  roles: any[] = [];
  branches: any[] = [];

  showDropdown = false;
  unreadCount = 0;
  isLoading = false;

  // --- Approval Form State ---
  selectedRoles: { [userId: string]: string } = {};
  selectedBranches: { [userId: string]: string } = {};
  customers: any

  constructor() {
    effect(() => {
      this.roles = this.masterList.roles();
      this.customers = this.masterList.customers();
      this.branches = this.masterList.branches();
    });
  }

  ngOnInit() {
    // This subscription is for REAL-TIME updates (e.g., from a socket)
    // It updates the badge and list *after* the component is loaded
    this.notificationService.notifications$.subscribe((data) => {
      this.realtimeNotifications = data;
      this.unreadCount = data.filter(n => !n.isRead).length;
    });
    this.loadData();
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

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
       // Refresh data every time it's opened
    }
  }

  markAsRead(notification: any) {
    // This tells the service, which (presumably) will trigger the
    // observable in ngOnInit to update the list automatically.
    this.notificationService.markAsRead(notification._id!);
  }

  approveMember(member: any) {
    const userId = member._id;
    const roleId = this.selectedRoles[userId];
    const branchId = this.selectedBranches[userId];

    if (!roleId || !branchId) {
      this.messageService.showWarn('Missing Info', 'Please select a role and branch.');
      return;
    }

    const payload = { userId, roleId, branchId };

    this.apiService.approveMember(payload).subscribe({
      next: (response) => {
        this.messageService.showSuccess('Member Approved', `${member.name} is now active.`);
        this.loadData(); // Refresh lists
      },
      error: (err) => {
        // Error is already handled
      }
    });
  }
}
