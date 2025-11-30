import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { BaseApiService } from '../../core/services/base-api.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService extends BaseApiService {
  private endpoint = '/v1/ai-agent';

  sendMessage(message: string): Observable<any> {
    // 1. Get String from LocalStorage
    const userStr = localStorage.getItem("apex_current_user");

    if (!userStr) {
      return throwError(() => new Error("User not logged in"));
    }

    // 2. Parse JSON safely
    const currentUser = JSON.parse(userStr);

    // 3. We send ONLY the message. 
    // The OrganizationID is inside the 'Authorization' header token automatically.
    const payload = {
      message: message
    };

    return this.post(`${this.endpoint}/chat`, payload, 'aiAgentQuery');
  }
}
