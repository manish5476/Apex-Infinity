import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { BaseApiService } from '../../core/services/base-api.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService extends BaseApiService {
  private endpoint = '/v1/ai-agent';
  sendMessage(message: string): Observable<any> {
    const userStr = localStorage.getItem("apex_current_user");
    if (!userStr) {
      return throwError(() => new Error("User not logged in"));
    }
    const currentUser = JSON.parse(userStr);
    const payload = {
      message: message
    };

    return this.post(`${this.endpoint}/chat`, payload, 'aiAgentQuery');
  }
}
