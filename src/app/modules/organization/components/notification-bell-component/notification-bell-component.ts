import { OrganizationService } from './../../organization.service';
import { Component, OnInit, inject, effect, EventEmitter, Output } from '@angular/core';
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
  private notificationService = inject(NotificationService);
  private apiService = inject(ApiService);
  private messageService = inject(AppMessageService);
  private OrganizationService = inject(OrganizationService);
  private masterList = inject(MasterListService);

  realtimeNotifications: any[] = []; // Tab 0
  pendingMembers: any[] = []
  allNotifications: any[] = []
  roles: any[] = [];
  branches: any[] = [];
  showDropdown = false;
  unreadCount = 0;
  isLoading = false;
  activeTab = 0; // 0 = New, 1 = Approvals, 2 = History
  selectedRoles: { [userId: string]: string } = {};
  selectedBranches: { [userId: string]: string } = {};

  constructor() {
    effect(() => {
      this.roles = this.masterList.roles();
      this.branches = this.masterList.branches();
    });
  }

  ngOnInit() {
    this.notificationService.notifications$.subscribe((data) => {
      this.realtimeNotifications = data;
      this.unreadCount = data.filter(n => !n.isRead).length;
    });
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.masterList.refresh();

    this.OrganizationService.getPendingMembers().subscribe({
      next: (res) => {
        this.pendingMembers = res.data.pendingMembers || [];
      },
      error: () => { }
    });

    this.apiService.getAllNotifications().subscribe({
      next: (res: any) => {
        this.allNotifications = res.data.notifications || [];
        this.realtimeNotifications = this.allNotifications.filter(n => !n.isRead);
        this.unreadCount = this.realtimeNotifications.length;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.loadData();
      this.activeTab = 0;
    }
  }

  switchTab(index: number) {
    this.activeTab = index;
  }

  markAsRead(notification: any) {
    if (notification.isRead) return;
    this.notificationService.markAsRead(notification._id!);
    notification.isRead = true;
    this.unreadCount = Math.max(0, this.unreadCount - 1);
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
    this.OrganizationService.approveMember(payload).subscribe({
      next: () => {
        this.messageService.showSuccess('Approved', `${member.name} is now active.`);
        this.pendingMembers = this.pendingMembers.filter(m => m._id !== userId);
      },
      error: () => {
      }
    });
  }
  getIcon(type: string): string {
  switch(type) {
    case 'success': return 'pi-check-circle';
    case 'warn': return 'pi-exclamation-triangle';
    case 'error': return 'pi-times-circle';
    default: return 'pi-info-circle';
  }
}

markAllRead() {
  this.realtimeNotifications.forEach(n => this.markAsRead(n));
}
@Output() close = new EventEmitter<void>(); // Or use a shared service to toggle visibility

closeDialog() {
  // If you used the [(visible)]="showNotificationdialog" in the parent, 
  // you might need an Output here, or just toggle the variable if this component controls it.
  // Easiest way: Inject the parent component or use a shared state.
  // OR simply:
  document.querySelector('.p-dialog-mask')?.remove(); // Hacky? No. 
  // Better:
  // this.showNotificationdialog = false; // If you bind this variable in the component
}
}
