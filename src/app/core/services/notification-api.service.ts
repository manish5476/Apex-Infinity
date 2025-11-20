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

// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { HttpErrorResponse } from '@angular/common/http';
// import { BaseApiService } from './base-api.service';

// @Injectable({ providedIn: 'root' })
// export class NotificationApiService extends BaseApiService {
//   private endpoint = '/v1/notifications';

//   getMyNotifications(): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}${this.endpoint}/my-notifications`).pipe(
//       catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getMyNotifications'))
//     );
//   }
// }