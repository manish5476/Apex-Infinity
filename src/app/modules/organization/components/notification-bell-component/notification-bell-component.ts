import { Component, OnInit, inject, effect, EventEmitter, Output, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// Services
import { SocketService, NotificationData } from '../../../../core/services/socket.service';
import { NotificationService } from '../../../../core/services/notification.service'; // ✅ Use dedicated NotificationService
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
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    DatePipe,
    SelectModule, 
    MultiSelectModule, 
    InputTextModule, 
    TextareaModule, 
    ButtonModule, 
    BadgeModule, 
    TooltipModule, 
    SkeletonModule,
    DialogModule
  ],
  templateUrl: './notification-bell-component.html',
  styleUrl: './notification-bell-component.scss'
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  
  // ✅ Use dedicated NotificationService instead of SocketService
  private notificationService = inject(NotificationService);
  private apiService = inject(ApiService);
  private messageService = inject(AppMessageService);
  private OrganizationService = inject(OrganizationService);
  private masterList = inject(MasterListService);
  private announcementService = inject(AnnouncementService);

  // Data
  unreadList: NotificationData[] = [];
  historyList: NotificationData[] = [];
  allNotifications: NotificationData[] = [];
  pendingMembers: any[] = [];
  
  // UI State
  unreadCount = 0;
  isLoading = false;
  showDropdown = false;
  activeTab = 0;
  showAnnouncementSuccess = false;

  // Master Data
  roles: any[] = [];
  branches: any[] = [];
  users: any[] = []; 
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

  private subs: Subscription[] = [];

  constructor() {
    effect(() => {
      this.roles = this.masterList.roles();
      this.users = this.masterList.users();
      this.branches = this.masterList.branches();
    });
  }

  ngOnInit() {
    // 1. Subscribe to notifications from NotificationService
    this.subs.push(
      this.notificationService.notifications$.subscribe((allNotifications) => {
        this.allNotifications = allNotifications;
        this.historyList = allNotifications;
        this.unreadList = allNotifications.filter(n => !n.isRead);
        this.unreadCount = this.unreadList.length;
        
        // Check for signup requests
        this.checkForSignupRequests();
      })
    );

    // 2. Subscribe to unread count
    this.subs.push(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );

    // 3. Load initial data
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.masterList.refresh();
    this.fetchPendingMembers();

    // Load notifications via HTTP
    // this.apiService.getAllNotifications().subscribe({
    //   next: (res: any) => {
    //     const notifications = res.data?.notifications || [];
    //     this.notificationService.setInitialNotifications(notifications);
    //     this.isLoading = false;
    //   },
    //   error: (err) => { 
    //     this.messageService.handleHttpError(err, 'Loading notifications');
    //     this.isLoading = false; 
    //   }
    // });
  }

  checkForSignupRequests() {
    const signupNotification = this.allNotifications.find(
      n => n.title === 'New Signup Request' || n.metadata?.type === 'SIGNUP_REQUEST'
    );
    
    if (signupNotification) {
      this.fetchPendingMembers();
    }
  }

  fetchPendingMembers() {
    this.OrganizationService.getPendingMembers().subscribe({
      next: (res) => { 
        this.pendingMembers = res.data?.pendingMembers || []; 
      },
      error: (err) => {
        console.error('Failed to fetch pending members:', err);
      }
    });
  }

  markAsRead(notification: NotificationData) {
    if (notification.isRead || !notification._id) return;
    
    this.notificationService.markAsRead(notification._id).subscribe({
      error: (err) => {
        this.messageService.handleHttpError(err, 'Marking notification as read');
      }
    });
  }

  markAllRead() {
    if (this.unreadList.length === 0) return;
    
    const unreadIds = this.unreadList
      .filter(n => n._id)
      .map(n => n._id as string);
    
    if (unreadIds.length > 0) {
      this.notificationService.markMultipleAsRead(unreadIds).subscribe({
        next: () => {
          this.messageService.showSuccess('All Read', 'All notifications marked as read');
        },
        error: (err) => {
          this.messageService.handleHttpError(err, 'Marking all as read');
        }
      });
    }
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.loadData();
      // Auto-select tab based on content
      if (this.unreadCount > 0) {
        this.activeTab = 0;
      } else if (this.pendingMembers.length > 0) {
        this.activeTab = 1;
      } else {
        this.activeTab = 2;
      }
    }
  }

  switchTab(index: number) { 
    this.activeTab = index; 
  }
  
  closeDialog() { 
    this.showDropdown = false; 
    this.close.emit(); 
  }

  // Member Approval/Rejection
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
        
        // Remove related notification
        const notificationIndex = this.allNotifications.findIndex(
          n => n.metadata?.userId === userId && n.title.includes('Signup Request')
        );
        if (notificationIndex > -1) {
          this.notificationService.removeNotification(this.allNotifications[notificationIndex]._id as string);
        }
      },
      error: (err) => {
        this.messageService.handleHttpError(err, 'Approving member');
      }
    });
  }

  rejectMember(member: any) {
    const userId = member._id;
    
    this.OrganizationService.rejectMember({ userId }).subscribe({
      next: () => {
        this.messageService.showSuccess('Rejected', `${member.name} has been rejected.`);
        this.pendingMembers = this.pendingMembers.filter(m => m._id !== userId);
        
        // Remove related notification
        const notificationIndex = this.allNotifications.findIndex(
          n => n.metadata?.userId === userId && n.title.includes('Signup Request')
        );
        if (notificationIndex > -1) {
          this.notificationService.removeNotification(this.allNotifications[notificationIndex]._id as string);
        }
      },
      error: (err) => {
        this.messageService.handleHttpError(err, 'Rejecting member');
      }
    });
  }
  
  onAudienceChange() {
    this.selectedTargetIds = [];
  }

  sendAnnouncement() {
    if (!this.announcement.title || !this.announcement.message) {
      this.messageService.showWarn('Validation', 'Title and message are required');
      return;
    }
    
    const payload = { 
      ...this.announcement, 
      targetIds: this.selectedTargetIds 
    };
    
    this.announcementService.create(payload).subscribe({
      next: () => {
        this.messageService.showSuccess('Broadcast Sent', 'Announcement has been sent successfully');
        this.announcement = { title: '', message: '', type: 'info', targetAudience: 'all' };
        this.selectedTargetIds = [];
        this.showAnnouncementSuccess = true;
        
        setTimeout(() => {
          this.showAnnouncementSuccess = false;
          this.activeTab = 2;
        }, 2000);
      },
      error: (err) => {
        this.messageService.handleHttpError(err, 'Sending announcement');
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

  getIconColor(type: string | undefined): string {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'urgent': return 'danger';
      default: return 'info';
    }
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  }
}

// import { Component, OnInit, inject, effect, EventEmitter, Output } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';

// // Services
// import { SocketService, NotificationData } from '../../../../core/services/socket.service'; // ✅ New Import
// import { ApiService } from '../../../../core/services/api';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { OrganizationService } from './../../organization.service';
// import { AnnouncementService } from '../../../../core/services/announcement.service';

// // PrimeNG
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
//   imports: [CommonModule, FormsModule, SelectModule, MultiSelectModule, InputTextModule, TextareaModule, ButtonModule, BadgeModule, TooltipModule, SkeletonModule],
//   templateUrl: './notification-bell-component.html',
//   styleUrl: './notification-bell-component.scss'
// })
// export class NotificationBellComponent implements OnInit {
  
//   // ✅ Inject SocketService
//   private notificationService = inject(SocketService);
//   private apiService = inject(ApiService);
//   private messageService = inject(AppMessageService);
//   private OrganizationService = inject(OrganizationService);
//   private masterList = inject(MasterListService);
//   private announcementService = inject(AnnouncementService);

//   unreadList: NotificationData[] = [];
//   historyList: NotificationData[] = [];
//   pendingMembers: any[] = [];
  
//   unreadCount = 0;
//   isLoading = false;
//   showDropdown = false;
//   activeTab = 0;

//   // Master Data
//   roles: any[] = [];
//   branches: any[] = [];
//   users: any[] = []; 
//   selectedRoles: { [userId: string]: string } = {};
//   selectedBranches: { [userId: string]: string } = {};

//   // Announcement
//   announcement = { title: '', message: '', type: 'info', targetAudience: 'all' };
//   selectedTargetIds: string[] = [];
//   audienceOptions = [ { label: 'Entire Organization', value: 'all' }, { label: 'Specific Roles', value: 'role' }, { label: 'Specific People', value: 'specific' } ];
//   typeOptions = [ { label: 'Information', value: 'info', icon: 'pi pi-info-circle' }, { label: 'Success', value: 'success', icon: 'pi pi-check-circle' }, { label: 'Warning', value: 'warning', icon: 'pi pi-exclamation-triangle' }, { label: 'Urgent', value: 'urgent', icon: 'pi pi-megaphone' } ];

//   @Output() close = new EventEmitter<void>();

//   constructor() {
//     effect(() => {
//       this.roles = this.masterList.roles();
//       this.users = this.masterList.users();
//       this.branches = this.masterList.branches();
//     });
//   }

//   ngOnInit() {
//     // 1. Subscribe to Single Source (SocketService)
//     this.notificationService.notifications$.subscribe((allNotifications) => {
//       this.historyList = allNotifications;
//       this.unreadList = allNotifications.filter(n => !n.isRead);
//       this.unreadCount = this.unreadList.length;

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
//       next: (res) => { this.pendingMembers = res.data.pendingMembers || []; }
//     });
//   }

//   markAsRead(notification: NotificationData) {
//     if (notification.isRead || !notification._id) return;
//     this.notificationService.markRead(notification._id);
//   }

//   markAllRead() {
//     this.unreadList.forEach(n => {
//       if(n._id) this.notificationService.markRead(n._id);
//     });
//   }

//   toggleDropdown() {
//     this.showDropdown = !this.showDropdown;
//     if (this.showDropdown) {
//       this.loadData();
//       if (this.unreadCount > 0) this.activeTab = 0;
//       else if (this.pendingMembers.length > 0) this.activeTab = 1;
//       else this.activeTab = 2;
//     }
//   }

//   switchTab(index: number) { this.activeTab = index; }
//   closeDialog() { this.showDropdown = false; this.close.emit(); }

//   // ... (Keep existing Approve/Reject and Announcement Logic exactly as you had it) ...
//   approveMember(member: any) {
//     const userId = member._id;
//     const roleId = this.selectedRoles[userId];
//     const branchId = this.selectedBranches[userId];
//     if (!roleId || !branchId) {
//       this.messageService.showWarn('Missing Info', 'Please select a role and branch.');
//       return;
//     }
//     this.OrganizationService.approveMember({ userId, roleId, branchId }).subscribe({
//       next: () => {
//         this.messageService.showSuccess('Approved', `${member.name} is now active.`);
//         this.pendingMembers = this.pendingMembers.filter(m => m._id !== userId);
//       }
//     });
//   }

//   rejectMember(member: any) {
//         const userId = member._id;
//     this.OrganizationService.rejectMember({ userId: member._id }).subscribe({
//       next: () => {
//         this.messageService.showSuccess('Rejected', `${member.name} removed.`);
//         this.pendingMembers = this.pendingMembers.filter(m => m._id !== userId);
//       }
//     });
//   }
  
//   onAudienceChange() {
//     this.selectedTargetIds = [];
//   }

//   sendAnnouncement() {
//     if (!this.announcement.title || !this.announcement.message) return;
//     const payload = { ...this.announcement, targetIds: this.selectedTargetIds };
    
//     this.announcementService.create(payload).subscribe({
//       next: () => {
//         this.messageService.showSuccess('Broadcast Sent');
//         this.announcement = { title: '', message: '', type: 'info', targetAudience: 'all' };
//         this.activeTab = 2;
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
