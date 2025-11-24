import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- Services ---
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiService } from '../../../../core/services/api';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';

// --- PrimeNG Modules ---
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
    SelectModule,
    ButtonModule,
    BadgeModule,
    TooltipModule,
    SkeletonModule
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
  realtimeNotifications: any[] = []; // Tab 0
  pendingMembers: any[] = [];        // Tab 1
  allNotifications: any[] = [];      // Tab 2
  
  roles: any[] = [];
  branches: any[] = [];
  
  // UI State
  showDropdown = false;
  unreadCount = 0;
  isLoading = false;
  activeTab = 0; // 0 = New, 1 = Approvals, 2 = History

  // Approval Form Models
  selectedRoles: { [userId: string]: string } = {};
  selectedBranches: { [userId: string]: string } = {};

  constructor() {
    // Reactive signal effect for master data
    effect(() => {
      this.roles = this.masterList.roles();
      this.branches = this.masterList.branches();
    });
  }

  ngOnInit() {
    // Subscribe to real-time socket updates
    this.notificationService.notifications$.subscribe((data) => {
      this.realtimeNotifications = data;
      this.unreadCount = data.filter(n => !n.isRead).length;
    });
    
    // Initial Load
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.masterList.refresh();

    // Get Pending Members
    this.apiService.getPendingMembers().subscribe({
      next: (res) => {
        this.pendingMembers = res.data.pendingMembers || [];
      },
      error: () => {} 
    });

    // Get All Notifications
    this.apiService.getAllNotifications().subscribe({
      next: (res: any) => {
        this.allNotifications = res.data.notifications || [];
        // Sync realtime list with unread items from DB
        this.realtimeNotifications = this.allNotifications.filter(n => !n.isRead);
        this.unreadCount = this.realtimeNotifications.length;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  // --- Actions ---

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.loadData(); 
      this.activeTab = 0; // Reset to "New" tab when opening
    }
  }

  switchTab(index: number) {
    this.activeTab = index;
  }

  markAsRead(notification: any) {
    if (notification.isRead) return;

    this.notificationService.markAsRead(notification._id!);
    
    // Optimistic Update
    notification.isRead = true;
    this.unreadCount = Math.max(0, this.unreadCount - 1);
    
    // Remove from "New" list immediately for cleaner UI
    this.realtimeNotifications = this.realtimeNotifications.filter(n => n._id !== notification._id);
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
      next: () => {
        this.messageService.showSuccess('Approved', `${member.name} is now active.`);
        // Remove from list locally
        this.pendingMembers = this.pendingMembers.filter(m => m._id !== userId);
      },
      error: () => {
        // ApiService handles error toast usually
      }
    });
  }
}
