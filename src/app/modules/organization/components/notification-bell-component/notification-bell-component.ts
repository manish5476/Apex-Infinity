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
import { Select } from 'primeng/select';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Tabs,
    Select,
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
  allNotifications: any[] = [];    // <-- For "All" tab (Tab 2)
  pendingMembers: any[] = [];
  roles: any[] = [];
  branches: any[] = [];

  showDropdown = false;
  unreadCount = 0;
  isLoading = false;

  // --- Approval Form State ---
  selectedRoles: { [userId: string]: string } = {};
  selectedBranches: { [userId: string]: string } = {};
  customers:any

  constructor() {
    effect(() => {
      this.roles = this.masterList.roles();
      this.customers = this.masterList.customers();
      this.branches = this.masterList.branches();
      console.log(this.roles,this.customers ,
this.branches);
    });
  }

  ngOnInit() {
    // This subscription is for REAL-TIME updates (e.g., from a socket)
    // It updates the badge and list *after* the component is loaded
    this.notificationService.notifications$.subscribe((data) => {
      this.realtimeNotifications = data;
      this.unreadCount = data.filter(n => !n.isRead).length;
    });
  }

  loadData() {
    this.isLoading = true;
    
    this.masterList.refresh(); 
    
    this.apiService.getPendingMembers().subscribe(res => {
      this.pendingMembers = res.data.pendingMembers || [];
    });
    
    // --- THIS SECTION IS THE FIX ---
    this.apiService.getAllNotifications().subscribe((res:any) => {
      // 1. Populate the "All" tab (Tab 2)
      this.allNotifications = res.data.notifications || []; 
      
      // 2. Populate the "New" tab (Tab 0) with unread items from the "All" list
      this.realtimeNotifications = this.allNotifications.filter(n => !n.isRead);
      
      // 3. Update the badge count from this initial list
      this.unreadCount = this.realtimeNotifications.length;
    });
    // --- END FIX ---
    
    this.isLoading = false; 
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.loadData(); // Refresh data every time it's opened
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

// import { Component, OnInit, inject, effect } from '@angular/core';
// import { NotificationService } from '../../../../core/services/notification.service';
// import { CommonModule } from '@angular/common';
// import { ApiService } from '../../../../core/services/api';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { MasterListService } from '../../../../core/services/master-list.service'; // You injected this

// // --- PrimeNG Modules ---
// import { ButtonModule } from 'primeng/button';
// import { FormsModule } from '@angular/forms';
// import { BadgeModule } from 'primeng/badge';
// import { TooltipModule } from 'primeng/tooltip';
// import { SkeletonModule } from 'primeng/skeleton';
// import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
// import { Select } from 'primeng/select';

// @Component({
//   selector: 'app-notification-bell',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     Tabs,
//     Select,
//     ButtonModule,
//     BadgeModule,
//     TooltipModule,
//     SkeletonModule,
//     TabList,
//     Tab,
//     TabPanels,
//     TabPanel
// ],
//   templateUrl: './notification-bell-component.html',
//   styleUrl: './notification-bell-component.scss'
// })
// export class NotificationBellComponent implements OnInit {
//   // --- Injections ---
//   private notificationService = inject(NotificationService);
//   private apiService = inject(ApiService);
//   private messageService = inject(AppMessageService);
//   private masterList = inject(MasterListService);

//   // --- State ---
//   realtimeNotifications: any[] = [];
//   allNotifications: any[] = []; // <-- Changed type to any[]
//   pendingMembers: any[] = [];
//   roles: any[] = [];
//   branches: any[] = [];

//   showDropdown = false;
//   unreadCount = 0;
//   isLoading = false;

//   // --- Approval Form State ---
//   selectedRoles: { [userId: string]: string } = {};
//   selectedBranches: { [userId: string]: string } = {};

//   constructor() {
//     // This effect will run whenever the signals in MasterListService change
//     effect(() => {
//       this.roles = this.masterList.roles();
//       this.branches = this.masterList.branches();
//     });
//   }

//   ngOnInit() {
//     // 1. Subscribe to real-time socket notifications
//     this.notificationService.notifications$.subscribe((data) => {
//       this.realtimeNotifications = data;
//       this.unreadCount = data.filter(n => !n.isRead).length;
//     });
//   }

//   loadData() {
//     this.isLoading = true;
    
//     // Refresh the master list (which contains roles and branches)
//     this.masterList.refresh(); 
    
//     // Fetch pending members and all notifications
//     this.apiService.getPendingMembers().subscribe(res => {
//       // CHANGED: Access the nested 'pendingMembers' array
//       this.pendingMembers = res.data.pendingMembers || []; 
//     });
    
//     this.apiService.getAllNotifications().subscribe((res:any) => {
//       // CHANGED: Access the nested 'notifications' array
//       this.allNotifications = res.data.notifications 
//     });
    
//     this.isLoading = false; // Note: This might be slightly premature, add proper forkJoin/finally if needed
//   }

//   toggleDropdown() {
//     this.showDropdown = !this.showDropdown;
//     if (this.showDropdown) {
//       this.loadData(); // Refresh data every time it's opened
//     }
//   }

//   markAsRead(notification: any) {
//     this.notificationService.markAsRead(notification._id!);
//     // unreadCount updates automatically
//   }

//   approveMember(member: any) {
//     const userId = member._id;
//     const roleId = this.selectedRoles[userId];
//     const branchId = this.selectedBranches[userId];

//     if (!roleId || !branchId) {
//       this.messageService.showWarn('Missing Info', 'Please select a role and branch.');
//       return;
//     }

//     const payload = { userId, roleId, branchId };

//     this.apiService.approveMember(payload).subscribe({
//       next: (response) => {
//         this.messageService.showSuccess('Member Approved', `${member.name} is now active.`);
//         // Refresh the lists
//         this.loadData();
//       },
//       error: (err) => {
//         // Error is already handled by interceptor/messageService
//       }
//     });
//   }
// }

// // import { Component, OnInit, inject, effect } from '@angular/core';
// // import { NotificationService } from '../../../../core/services/notification.service';
// // import { CommonModule } from '@angular/common';
// // import { ApiService } from '../../../../core/services/api';
// // import { AppMessageService } from '../../../../core/services/message.service';
// // import { MasterListService } from '../../../../core/services/master-list.service'; // You injected this

// // // --- PrimeNG Modules ---

// // import { ButtonModule } from 'primeng/button';
// // import { FormsModule } from '@angular/forms';
// // import { BadgeModule } from 'primeng/badge';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { SkeletonModule } from 'primeng/skeleton';
// // import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
// // import { Select } from 'primeng/select';

// // @Component({
// //   selector: 'app-notification-bell',
// //   standalone: true, // <-- Make it standalone
// //   imports: [
// //     CommonModule,
// //     FormsModule,
// //     Tabs,
// //     Select,
// //     ButtonModule,
// //     BadgeModule,
// //     TooltipModule,
// //     SkeletonModule,
// //     TabList,
// //     Tab,
// //     TabPanels,
// //     TabPanel
// // ],
// //   templateUrl: './notification-bell-component.html',
// //   styleUrl: './notification-bell-component.scss'
// // })
// // export class NotificationBellComponent implements OnInit {
// //   // --- Injections ---
// //   private notificationService = inject(NotificationService);
// //   private apiService = inject(ApiService);
// //   private messageService = inject(AppMessageService);
// //   private masterList = inject(MasterListService); // You are injecting this

// //   // --- State ---
// //   realtimeNotifications: any[] = [];
// //   allNotifications: any
// //   pendingMembers: any[] = [];
// //   roles: any[] = [];
// //   branches: any[] = [];

// //   showDropdown = false;
// //   unreadCount = 0;
// //   isLoading = false;

// //   // --- Approval Form State ---
// //   selectedRoles: { [userId: string]: string } = {};
// //   selectedBranches: { [userId: string]: string } = {};

// //   constructor() {
// //     // This effect will run whenever the signals in MasterListService change
// //     effect(() => {
// //       this.roles = this.masterList.roles();
// //       this.branches = this.masterList.branches();
// //     });
// //   }

// //   ngOnInit() {
// //     // 1. Subscribe to real-time socket notifications
// //     this.notificationService.notifications$.subscribe((data) => {
// //       this.realtimeNotifications = data;
// //       this.unreadCount = data.filter(n => !n.isRead).length;
// //     });
// //   }

// //   loadData() {
// //     this.isLoading = true;
    
// //     // Refresh the master list (which contains roles and branches)
// //     this.masterList.refresh(); 
    
// //     // Fetch pending members and all notifications
// //     this.apiService.getPendingMembers().subscribe(res => {
// //       this.pendingMembers = res.data || [];
// //     });
    
// //     this.apiService.getAllNotifications().subscribe(res => {
// //       this.allNotifications = res.data || [];
// //     });
    
// //     this.isLoading = false; // Note: This might be slightly premature, add proper forkJoin/finally if needed
// //   }

// //   toggleDropdown() {
// //     this.showDropdown = !this.showDropdown;
// //     if (this.showDropdown) {
// //       this.loadData(); // Refresh data every time it's opened
// //     }
// //   }

// //   markAsRead(notification: any) {
// //     this.notificationService.markAsRead(notification._id!);
// //     // unreadCount updates automatically
// //   }

// //   approveMember(member: any) {
// //     const userId = member._id;
// //     const roleId = this.selectedRoles[userId];
// //     const branchId = this.selectedBranches[userId];

// //     if (!roleId || !branchId) {
// //       this.messageService.showWarn('Missing Info', 'Please select a role and branch.');
// //       return;
// //     }

// //     const payload = { userId, roleId, branchId };

// //     this.apiService.approveMember(payload).subscribe({
// //       next: (response) => {
// //         this.messageService.showSuccess('Member Approved', `${member.name} is now active.`);
// //         // Refresh the lists
// //         this.loadData();
// //       },
// //       error: (err) => {
// //         // Error is already handled by interceptor/messageService
// //       }
// //     });
// //   }
// // }

// // // import { ApiService } from './../../../../core/services/api';
// // // import { Component, effect, inject, Inject, OnInit } from '@angular/core';
// // // import { NotificationService } from '../../../../core/services/notification.service';
// // // import { CommonModule } from '@angular/common';
// // // import { MasterListService } from '../../../../core/services/master-list.service';
// // // // import { NotificationService, NotificationData } from '../../core/services/notification.service';

// // // @Component({
// // //   selector: 'app-notification-bell',
// // //   imports: [CommonModule],
// // //   templateUrl: './notification-bell-component.html',
// // //   styleUrl: './notification-bell-component.scss'
// // // })
// // // export class NotificationBellComponent implements OnInit {
// // //   notifications: any[] = [];
// // //   showDropdown = false;
// // //   unreadCount = 0;
// // //   private ApiService = inject(ApiService)
// // //   private masterList = inject(MasterListService)

// // //   constructor(private notificationService: NotificationService) {
// // //     effect(() => {
// // //       console.log('Available branches:', this.masterList.branches(),this.masterList.roles());
// // //     });
// // //   }

// // //   // this.masterList.refresh();
// // //   ngOnInit() {
// // //     this.notificationService.notifications$.subscribe((data) => {
// // //       this.notifications = data;
// // //       this.unreadCount = data.filter(n => !n.isRead).length;
// // //     });
// // //   }

// // //   toggleDropdown() {
// // //     this.showDropdown = !this.showDropdown;
// // //   }

// // //   markAsRead(notification: any) {
// // //     this.notificationService.markAsRead(notification._id!);
// // //     this.unreadCount = this.notifications.filter(n => !n.isRead).length;
// // //   }
// // // }