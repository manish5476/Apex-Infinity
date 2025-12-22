import { Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnnouncementService extends BaseApiService {
  private endpoint = '/v1/announcements';

  getAll(): Observable<any> {
    return this.get(this.endpoint, {}, 'getAllAnnouncements');
  }

  create(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createAnnouncement');
  }

  deleteAnnouncement(id: string): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`,null, 'deleteAnnouncement');
  }
}