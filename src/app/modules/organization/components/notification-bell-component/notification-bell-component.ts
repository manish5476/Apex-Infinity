import { Component, OnInit, inject, effect, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Services
import { SocketService, NotificationData } from '../../../../core/services/socket.service'; // ✅ New Import
import { ApiService } from '../../../../core/services/api';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';
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

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, MultiSelectModule, InputTextModule, TextareaModule, ButtonModule, BadgeModule, TooltipModule, SkeletonModule],
  templateUrl: './notification-bell-component.html',
  styleUrl: './notification-bell-component.scss'
})
export class NotificationBellComponent implements OnInit {
  
  // ✅ Inject SocketService
  private notificationService = inject(SocketService);
  private apiService = inject(ApiService);
  private messageService = inject(AppMessageService);
  private OrganizationService = inject(OrganizationService);
  private masterList = inject(MasterListService);
  private announcementService = inject(AnnouncementService);

  unreadList: NotificationData[] = [];
  historyList: NotificationData[] = [];
  pendingMembers: any[] = [];
  
  unreadCount = 0;
  isLoading = false;
  showDropdown = false;
  activeTab = 0;

  // Master Data
  roles: any[] = [];
  branches: any[] = [];
  users: any[] = []; 
  selectedRoles: { [userId: string]: string } = {};
  selectedBranches: { [userId: string]: string } = {};

  // Announcement
  announcement = { title: '', message: '', type: 'info', targetAudience: 'all' };
  selectedTargetIds: string[] = [];
  audienceOptions = [ { label: 'Entire Organization', value: 'all' }, { label: 'Specific Roles', value: 'role' }, { label: 'Specific People', value: 'specific' } ];
  typeOptions = [ { label: 'Information', value: 'info', icon: 'pi pi-info-circle' }, { label: 'Success', value: 'success', icon: 'pi pi-check-circle' }, { label: 'Warning', value: 'warning', icon: 'pi pi-exclamation-triangle' }, { label: 'Urgent', value: 'urgent', icon: 'pi pi-megaphone' } ];

  @Output() close = new EventEmitter<void>();

  constructor() {
    effect(() => {
      this.roles = this.masterList.roles();
      this.users = this.masterList.users();
      this.branches = this.masterList.branches();
    });
  }

  ngOnInit() {
    // 1. Subscribe to Single Source (SocketService)
    this.notificationService.notifications$.subscribe((allNotifications) => {
      this.historyList = allNotifications;
      this.unreadList = allNotifications.filter(n => !n.isRead);
      this.unreadCount = this.unreadList.length;

      if (allNotifications.length > 0 && allNotifications[0].title === 'New Signup Request') {
        this.fetchPendingMembers();
      }
    });

    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.masterList.refresh();
    this.fetchPendingMembers();

    this.apiService.getAllNotifications().subscribe({
      next: (res: any) => {
        const notifications = res.data.notifications || [];
        this.notificationService.setInitialNotifications(notifications);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  fetchPendingMembers() {
    this.OrganizationService.getPendingMembers().subscribe({
      next: (res) => { this.pendingMembers = res.data.pendingMembers || []; }
    });
  }

  markAsRead(notification: NotificationData) {
    if (notification.isRead || !notification._id) return;
    this.notificationService.markRead(notification._id);
  }

  markAllRead() {
    this.unreadList.forEach(n => {
      if(n._id) this.notificationService.markRead(n._id);
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.loadData();
      if (this.unreadCount > 0) this.activeTab = 0;
      else if (this.pendingMembers.length > 0) this.activeTab = 1;
      else this.activeTab = 2;
    }
  }

  switchTab(index: number) { this.activeTab = index; }
  closeDialog() { this.showDropdown = false; this.close.emit(); }

  // ... (Keep existing Approve/Reject and Announcement Logic exactly as you had it) ...
  approveMember(member: any) {
    const userId = member._id;
    const roleId = this.selectedRoles[userId];
    const branchId = this.selectedBranches[userId];
    if (!roleId || !branchId) {
      this.messageService.showWarn('Missing Info', 'Please select a role and branch.');
      return;
    }
    this.OrganizationService.approveMember({ userId, roleId, branchId }).subscribe({
      next: () => {
        this.messageService.showSuccess('Approved', `${member.name} is now active.`);
        this.pendingMembers = this.pendingMembers.filter(m => m._id !== userId);
      }
    });
  }

  rejectMember(member: any) {
        const userId = member._id;
    this.OrganizationService.rejectMember({ userId: member._id }).subscribe({
      next: () => {
        this.messageService.showSuccess('Rejected', `${member.name} removed.`);
        this.pendingMembers = this.pendingMembers.filter(m => m._id !== userId);
      }
    });
  }
  
  onAudienceChange() {
    this.selectedTargetIds = [];
  }

  sendAnnouncement() {
    if (!this.announcement.title || !this.announcement.message) return;
    const payload = { ...this.announcement, targetIds: this.selectedTargetIds };
    
    this.announcementService.create(payload).subscribe({
      next: () => {
        this.messageService.showSuccess('Broadcast Sent');
        this.announcement = { title: '', message: '', type: 'info', targetAudience: 'all' };
        this.activeTab = 2;
      }
    });
  }

  getIcon(type: string | undefined): string {
    switch (type) {
      case 'success': return 'pi-check-circle';
      case 'warning': return 'pi-exclamation-triangle';
      case 'urgent': return 'pi-megaphone';
      default: return 'pi-info-circle';
    }
  }
}

// import { Component, OnInit, inject, effect, EventEmitter, Output } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';

// // --- Services ---
// import { NotificationService, NotificationData } from '../../../../core/services/notification.service';
// import { ApiService } from '../../../../core/services/api';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { OrganizationService } from './../../organization.service';
// import { AnnouncementService } from '../../../../core/services/announcement.service';

// // --- PrimeNG Modules ---
// import { ButtonModule } from 'primeng/button';
// import { BadgeModule } from 'primeng/badge';
// import { TooltipModule } from 'primeng/tooltip';
// import { SkeletonModule } from 'primeng/skeleton';
// import { SelectModule } from 'primeng/select'; 
// import { MultiSelectModule } from 'primeng/multiselect'; 
// import { InputTextModule } from 'primeng/inputtext'; 
// import { TextareaModule } from 'primeng/textarea'; 

// @Component({
//   selector: 'app-notification-bell',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     SelectModule,
//     MultiSelectModule,
//     InputTextModule,
//     TextareaModule,
//     ButtonModule,
//     BadgeModule,
//     TooltipModule,
//     SkeletonModule
//   ],
//   templateUrl: './notification-bell-component.html',
//   styleUrl: './notification-bell-component.scss'
// })
// export class NotificationBellComponent implements OnInit {
  
//   // --- Injections ---
//   private notificationService = inject(NotificationService);
//   private apiService = inject(ApiService);
//   private messageService = inject(AppMessageService);
//   private OrganizationService = inject(OrganizationService);
//   private masterList = inject(MasterListService);
//   private announcementService = inject(AnnouncementService);

//   // --- UI State Variables ---
//   unreadList: NotificationData[] = [];   // Tab 0: New/Unread
//   historyList: NotificationData[] = [];  // Tab 2: All History
//   pendingMembers: any[] = [];            // Tab 1: Approvals

//   unreadCount = 0;
//   isLoading = false;
//   showDropdown = false;

//   // Tabs: 0=New, 1=Approvals, 2=History, 3=Broadcast
//   activeTab = 0;

//   // --- Master Data for Approvals/Broadcasts ---
//   roles: any[] = [];
//   branches: any[] = [];
//   users: any[] = []; 

//   selectedRoles: { [userId: string]: string } = {};
//   selectedBranches: { [userId: string]: string } = {};

//   // --- ANNOUNCEMENT FORM STATE ---
//   announcement = {
//     title: '',
//     message: '',
//     type: 'info',
//     targetAudience: 'all' // 'all', 'role', 'specific'
//   };

//   selectedTargetIds: string[] = [];

//   audienceOptions = [
//     { label: 'Entire Organization', value: 'all' },
//     { label: 'Specific Roles', value: 'role' },
//     { label: 'Specific People', value: 'specific' }
//   ];

//   typeOptions = [
//     { label: 'Information', value: 'info', icon: 'pi pi-info-circle' },
//     { label: 'Success', value: 'success', icon: 'pi pi-check-circle' },
//     { label: 'Warning', value: 'warning', icon: 'pi pi-exclamation-triangle' },
//     { label: 'Urgent', value: 'urgent', icon: 'pi pi-megaphone' }
//   ];

//   @Output() close = new EventEmitter<void>();

//   constructor() {
//     // Reactively update master lists when signals change
//     effect(() => {
//       this.roles = this.masterList.roles();
//       this.users = this.masterList.users();
//       this.branches = this.masterList.branches();
//     });
//   }

//   ngOnInit() {
//     // 1. Subscribe to the SINGLE source of truth
//     this.notificationService.notifications$.subscribe((allNotifications) => {
//       // Tab 2 gets everything
//       this.historyList = allNotifications;
      
//       // Tab 0 gets only unread items
//       this.unreadList = allNotifications.filter(n => !n.isRead);
      
//       this.unreadCount = this.unreadList.length;

//       // React to specific events (e.g., refresh pending list if a new signup comes in)
//       if (allNotifications.length > 0 && allNotifications[0].title === 'New Signup Request') {
//         this.fetchPendingMembers();
//       }
//     });

//     this.loadData();
//   }

//   loadData() {
//     this.isLoading = true;
//     this.masterList.refresh();
//     this.fetchPendingMembers();

//     // 2. Fetch history from API and feed it into the Service Stream
//     this.apiService.getAllNotifications().subscribe({
//       next: (res: any) => {
//         const notifications = res.data.notifications || [];
//         this.notificationService.setInitialNotifications(notifications);
//         this.isLoading = false;
//       },
//       error: () => { this.isLoading = false; }
//     });
//   }

//   fetchPendingMembers() {
//     this.OrganizationService.getPendingMembers().subscribe({
//       next: (res) => { this.pendingMembers = res.data.pendingMembers || []; },
//       error: () => { }
//     });
//   }

//   toggleDropdown() {
//     this.showDropdown = !this.showDropdown;
//     if (this.showDropdown) {
//       this.loadData();
//       // Default to "New" tab if there are unread items, else "History" or "Approvals"
//       if (this.unreadCount > 0) this.activeTab = 0;
//       else if (this.pendingMembers.length > 0) this.activeTab = 1;
//       else this.activeTab = 2;
//     }
//   }

//   switchTab(index: number) {
//     this.activeTab = index;
//   }

//   markAsRead(notification: NotificationData) {
//     if (notification.isRead || !notification._id) return;
//     // Service updates the stream -> stream updates unreadList -> UI updates automatically
//     this.notificationService.markAsRead(notification._id);
//   }

//   markAllRead() {
//     // Optimistically mark all unread as read
//     this.unreadList.forEach(n => {
//       if(n._id) this.notificationService.markAsRead(n._id);
//     });
//   }

//   closeDialog() {
//     this.showDropdown = false;
//     this.close.emit();
//   }

//   // --- Approval Logic ---

//   approveMember(member: any) {
//     const userId = member._id;
//     const roleId = this.selectedRoles[userId];
//     const branchId = this.selectedBranches[userId];
//     if (!roleId || !branchId) {
//       this.messageService.showWarn('Missing Info', 'Please select a role and branch.');
//       return;
//     }
//     const payload = { userId, roleId, branchId };
//     this.OrganizationService.approveMember(payload).subscribe({
//       next: () => {
//         this.messageService.showSuccess('Approved', `${member.name} is now active.`);
//         this.pendingMembers = this.pendingMembers.filter(m => m._id !== userId);
//       },
//       error: () => { }
//     });
//   }

//   rejectMember(member: any) {
//     const userId = member._id;
//     const payload = { userId };
//     this.OrganizationService.rejectMember(payload).subscribe({
//       next: () => {
//         this.messageService.showSuccess('Rejected', `${member.name} has been removed.`);
//         this.pendingMembers = this.pendingMembers.filter(m => m._id !== userId);
//       },
//       error: () => { }
//     });
//   }

//   // --- Announcement Logic ---


//   sendAnnouncement() {
//     if (!this.announcement.title || !this.announcement.message) {
//       this.messageService.showWarn('Validation', 'Title and Message are required');
//       return;
//     }

//     if (this.announcement.targetAudience !== 'all' && this.selectedTargetIds.length === 0) {
//       this.messageService.showWarn('Validation', 'Please select at least one Role or User');
//       return;
//     }

//     const payload = {
//       ...this.announcement,
//       targetIds: this.selectedTargetIds
//     };

//     this.announcementService.create(payload).subscribe({
//       next: () => {
//         this.messageService.showSuccess('Announcement broadcasted successfully');
//         this.announcement = { title: '', message: '', type: 'info', targetAudience: 'all' };
//         this.selectedTargetIds = [];
//         this.activeTab = 2; // Switch to history to see it eventually
//       },
//       error: (err) => {
//         console.error(err);
//         this.messageService.showError('Failed', 'Could not send announcement');
//       }
//     });
//   }

//   getIcon(type: string | undefined): string {
//     switch (type) {
//       case 'success': return 'pi-check-circle';
//       case 'warning': return 'pi-exclamation-triangle';
//       case 'urgent': return 'pi-megaphone';
//       default: return 'pi-info-circle';
//     }
//   }
// }
