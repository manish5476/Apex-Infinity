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

// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// // Ensure this path points to your actual BaseApiService location
// import { BaseApiService } from '../../core/services/base-api.service'; 

// @Injectable({
//   providedIn: 'root',
// })
// export class ChatService extends BaseApiService {

//   private endpoint = '/v1/ai-agent';

//   sendMessage(message: string): Observable<any> {

//     const organizationId = localStorage.getItem("organizationId");
//     const branchId = localStorage.getItem("branchId");

//     if (!organizationId) {
//       return throwError(() => ({
//         error: { message: "Missing organizationId. Login again." }
//       }));
//     }

//     const payload = {
//       message,
//       organizationId,
//       branchId
//     };

//     return this.post(`${this.endpoint}/chat`, payload, 'aiAgentQuery');
//   }
// }

// // import { Injectable } from '@angular/core';
// // import { Observable } from 'rxjs';
// // // Ensure this path points to your actual BaseApiService location
// // import { BaseApiService } from '../../core/services/base-api.service'; 

// // @Injectable({
// //   providedIn: 'root',
// // })
// // export class ChatService extends BaseApiService {
// //   private endpoint = '/v1/ai-agent';

// //   /**
// //    * Send a message to the AI Agent
// //    * @param message The text string the user typed
// //    */
// //   sendMessage(message: string): Observable<any> {
// //     const payload = { message: message };

// //     // 3. Call the API
// //     // URL becomes: /v1/ai-agent/chat
// //     // 'aiAgentQuery' is the action tag for your internal logging/tracking in BaseApiService
// //     return this.post(`${this.endpoint}/chat`, payload, 'aiAgentQuery');
// //   }
// // }
