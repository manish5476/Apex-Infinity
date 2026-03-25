// src/app/core/services/notification.service.ts
import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, distinctUntilChanged, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppMessageService } from './message.service';

export interface NotificationData {
  _id?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'urgent';
  isRead?: boolean;
  createdAt?: string;
  recipientId?: string;
  metadata?: any;
  createdBy?: string;
  readAt?: string;
  readBy?: string;
  organizationId?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = environment.apiUrl;
  private messageService = inject(AppMessageService);
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);

  // State
  private notificationsSource = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notificationsSource.asObservable();

  public unreadCount$: Observable<number> = this.notifications$.pipe(
    map((notifications: any) => {
      // Ensure it's an array before filtering
      if (!Array.isArray(notifications)) return 0;
      return notifications.filter((n: any) => !n.isRead).length;
    }),
    distinctUntilChanged(),
    shareReplay(1)
  );

  // ==========================================================================
  // HTTP FETCHERS
  // ==========================================================================

  loadInitialNotifications(): Observable<NotificationData[]> {
    return this.http.get<any>(`${this.apiUrl}/v1/notifications`).pipe(
      map(response => {
        // Extract the array safely depending on your backend's format
        const notificationsArray = Array.isArray(response)
          ? response
          : (response?.data || response?.notifications || []);

        this.notificationsSource.next(notificationsArray);
        return notificationsArray;
      })
    );
  }

  // ==========================================================================
  // ACTIONS (Called by UI)
  // ==========================================================================

  markAsRead(notificationId: string): Observable<any> {
    this.markAsReadLocal(notificationId);
    return this.http.patch(`${this.apiUrl}/v1/notifications/${notificationId}/read`, {});
  }

  markMultipleAsRead(notificationIds: string[]): Observable<any> {
    notificationIds.forEach(id => this.markAsReadLocal(id));
    return this.http.patch(`${this.apiUrl}/v1/notifications/mark-read`, { notificationIds });
  }

  markAllAsRead(): Observable<any> {
    this.ngZone.run(() => {
      const updated = this.notificationsSource.value.map(n =>
        ({ ...n, isRead: true, readAt: new Date().toISOString() })
      );
      this.notificationsSource.next(updated);
    });
    return this.http.patch(`${this.apiUrl}/v1/notifications/mark-all-read`, {});
  }

  removeNotification(notificationId: string): void {
    const updated = this.notificationsSource.value.filter(n => n._id !== notificationId);
    this.notificationsSource.next(updated);
  }

  public handleLiveNotification(notification: NotificationData): void {
    this.ngZone.run(() => {
      const current = this.notificationsSource.value;
      this.notificationsSource.next([notification, ...current]);
      if (!notification.isRead) this.showToast(notification);
    });
  }

  public markAsReadLocal(notificationId: string): void {
    this.ngZone.run(() => {
      const updated = this.notificationsSource.value.map(n =>
        n._id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      );
      this.notificationsSource.next(updated);
    });
  }

  private showToast(notification: NotificationData): void {
    if (notification.isRead) return;
    const msg = `${notification.title}: ${notification.message}`;

    switch (notification.type) {
      case 'success': this.messageService.showSuccess(msg); break;
      case 'error': this.messageService.showError(msg); break;
      case 'warning': this.messageService.showWarn(msg); break;
      case 'urgent': this.messageService.showError(`[URGENT] ${msg}`); break;
      default: this.messageService.showInfo(msg); break;
    }
  }
}