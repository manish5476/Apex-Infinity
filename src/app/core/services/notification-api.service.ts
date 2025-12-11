import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class NotificationApiService extends BaseApiService {
  private endpoint = '/v1/notifications';
  getMyNotifications(): Observable<any> {
    return this.get(`${this.endpoint}/my-notifications`, {}, 'getMyNotifications');
  }
}