import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class NotificationApiService extends BaseApiService {
  private endpoint = '/v1/notifications';

  getMyNotifications(params?: any): Observable<any> {
    return this.get(this.endpoint, params, 'getMyNotifications');
  }

  getNotificationStats(): Observable<any> {
    return this.get(`${this.endpoint}/stats`, {}, 'getNotificationStats');
  }

  getUnreadCount(): Observable<any> {
    return this.get(`${this.endpoint}/unread-count`, {}, 'getUnreadCount');
  }

  getNotification(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getNotification');
  }

  markAsRead(id: string): Observable<any> {
    return this.patch(`${this.endpoint}/${id}`, {}, 'markAsRead');
  }

  markMultipleAsRead(notificationIds: string[]): Observable<any> {
    return this.patch(`${this.endpoint}/mark-read`, { notificationIds }, 'markMultipleAsRead');
  }

  markAllRead(): Observable<any> {
    return this.patch(`${this.endpoint}/mark-all-read`, {}, 'markAllRead');
  }

  deleteNotification(id: string): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`, null, 'deleteNotification');
  }

  clearAll(): Observable<any> {
    return this.delete(`${this.endpoint}/clear-all`, null, 'clearAll');
  }
}
