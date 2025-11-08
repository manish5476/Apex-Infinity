import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { CommonModule } from '@angular/common';
// import { NotificationService, NotificationData } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  imports:[CommonModule],
 templateUrl: './notification-bell-component.html',
  styleUrl: './notification-bell-component.scss'
})
export class NotificationBellComponent implements OnInit {
  notifications: any[] = [];
  showDropdown = false;
  unreadCount = 0;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.notifications$.subscribe((data) => {
      this.notifications = data;
      this.unreadCount = data.filter(n => !n.isRead).length;
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  markAsRead(notification: any) {
    this.notificationService.markAsRead(notification._id!);
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
  }
}