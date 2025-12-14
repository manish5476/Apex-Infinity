import { Component, OnInit, inject, effect, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- Services ---
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiService } from '../../../../core/services/api';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { OrganizationService } from './../../organization.service';
import { AnnouncementService } from '../../../../core/services/announcement.service';

// --- PrimeNG Modules ---
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { SelectModule } from 'primeng/select'; // Or DropdownModule depending on your version
import { MultiSelectModule } from 'primeng/multiselect'; // <--- NEW
import { InputTextModule } from 'primeng/inputtext';     // <--- NEW
import { TextareaModule } from 'primeng/textarea';       // <--- NEW

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    MultiSelectModule, // <--- Add this
    InputTextModule,   // <--- Add this
    TextareaModule,    // <--- Add this
    ButtonModule,
    BadgeModule,
    TooltipModule,
    SkeletonModule
  ],
  templateUrl: './notification-bell-component.html',
  styleUrl: './notification-bell-component.scss'
})
export class NotificationBellComponent implements OnInit {
  // ... existing injections ...
  private notificationService = inject(NotificationService);
  private apiService = inject(ApiService);
  private messageService = inject(AppMessageService);
  private OrganizationService = inject(OrganizationService);
  private masterList = inject(MasterListService);
  private announcementService = inject(AnnouncementService);

  // ... existing state variables ...
  realtimeNotifications: any[] = [];
  pendingMembers: any[] = [];
  allNotifications: any[] = [];
  
  // Master Data
  roles: any[] = [];
  branches: any[] = [];
  users: any[] = []; // Users list for specific targeting

  showDropdown = false;
  unreadCount = 0;
  isLoading = false;
  
  // Tabs: 0=New, 1=Approvals, 2=History, 3=Broadcast (New)
  activeTab = 0; 
  
  selectedRoles: { [userId: string]: string } = {};
  selectedBranches: { [userId: string]: string } = {};

  // --- ANNOUNCEMENT FORM STATE ---
  announcement = {
    title: '',
    message: '',
    type: 'info',
    targetAudience: 'all' // 'all', 'role', 'specific'
  };

  // Holds the IDs selected in the MultiSelect
  selectedTargetIds: string[] = []; 

  // Dropdown Options
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

  constructor() {
    effect(() => {
      this.roles = this.masterList.roles();
      this.users = this.masterList.users(); // Ensure this returns array of users
      this.branches = this.masterList.branches();
    });
  }

  ngOnInit() {
    // ... existing subscription logic ...
    this.notificationService.notifications$.subscribe((data) => {
      this.realtimeNotifications = data;
      this.unreadCount = data.filter(n => !n.isRead).length;
      if (data.length > 0 && data[0].title === 'New Signup Request') {
        this.fetchPendingMembers();
      }
    });
    this.loadData();
  }

  // ... existing loadData, fetchPendingMembers, etc ...
  loadData() {
    this.isLoading = true;
    this.masterList.refresh();
    this.fetchPendingMembers();

    this.apiService.getAllNotifications().subscribe({
      next: (res: any) => {
        this.allNotifications = res.data.notifications || [];
        if (this.realtimeNotifications.length === 0) {
          this.realtimeNotifications = this.allNotifications.filter(n => !n.isRead);
        }
        this.unreadCount = this.realtimeNotifications.length;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  fetchPendingMembers() {
    this.OrganizationService.getPendingMembers().subscribe({
      next: (res) => { this.pendingMembers = res.data.pendingMembers || []; },
      error: () => { }
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
  }

  approveMember(member: any) {
     // ... existing logic ...
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
       error: () => { }
     });
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'pi-check-circle';
      case 'warning': return 'pi-exclamation-triangle';
      case 'urgent': return 'pi-megaphone';
      default: return 'pi-info-circle';
    }
  }

  markAllRead() {
    this.realtimeNotifications.forEach(n => this.markAsRead(n));
  }

  @Output() close = new EventEmitter<void>();

  closeDialog() {
    document.querySelector('.p-dialog-mask')?.remove();
  }

  // --- UPDATED SEND ANNOUNCEMENT LOGIC ---
  
  onAudienceChange() {
    // Clear selections when audience type changes to prevent mismatch
    this.selectedTargetIds = [];
  }

  sendAnnouncement() {
    // 1. Basic Validation
    if (!this.announcement.title || !this.announcement.message) {
      this.messageService.showWarn('Validation', 'Title and Message are required');
      return;
    }

    // 2. Target Validation
    if (this.announcement.targetAudience !== 'all' && this.selectedTargetIds.length === 0) {
      this.messageService.showWarn('Validation', 'Please select at least one Role or User');
      return;
    }

    // 3. Prepare Payload
    const payload = {
      ...this.announcement,
      targetIds: this.selectedTargetIds // The array of RoleIDs or UserIDs
    };

    // 4. API Call
    this.announcementService.create(payload).subscribe({
      next: () => {
        this.messageService.showSuccess('Announcement broadcasted successfully');
        // Reset Form
        this.announcement = { title: '', message: '', type: 'info', targetAudience: 'all' };
        this.selectedTargetIds = [];
        this.activeTab = 0; // Go back to notifications
      },
      error: (err) => {
        console.error(err);
        this.messageService.showError('Failed', 'Could not send announcement');
      }
    });
  }
}