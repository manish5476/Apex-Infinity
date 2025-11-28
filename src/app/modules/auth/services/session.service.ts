import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService extends BaseApiService {

  /** * GET /sessions/me
   */
  getMySessions(): Observable<any> {
    return this.get('/v1/sessions/me', {}, 'getMySessions');
  }

  /**
   * GET /sessions
   */
  getAllSessions(filter?: any): Observable<any> {
    return this.get('/v1/sessions', filter, 'getAllSessions');
  }

  /**
   * PATCH /sessions/:id/revoke
   */
  revokeSession(sessionId: string): Observable<any> {
    return this.patch(`/v1/sessions/${sessionId}/revoke`, {}, 'revokeSession');
  }
  
  /**
   * DELETE /sessions/:id
   * Permanently delete a session
   */
  deleteSession(sessionId: string): Observable<any> {
    return this.delete(`/v1/sessions/${sessionId}`, 'deleteSession');
  }

  /**
   * PATCH /sessions/revoke-all
   */
  revokeAllOthers(): Observable<any> {
    return this.patch('/v1/sessions/revoke-all', {}, 'revokeAllOthers');
  }
}

// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService } from '../../../core/services/base-api.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class SessionService extends BaseApiService {

//   /** 
//    * GET /sessions/me
//    * Fetch active sessions for current logged-in user
//    */
//   getMySessions(): Observable<any> {
//     return this.get('/v1/sessions/me', {}, 'getMySessions');
//   }

//   /**
//    * GET /sessions?userId=
//    * Admin/SuperAdmin: list sessions of all users or a specific user
//    */
//   getAllSessions(filter?: any): Observable<any> {
//     return this.get('/v1/sessions', filter, 'getAllSessions');
//   }

//   /**
//    * PATCH /sessions/:id/revoke
//    * Revoke a specific session (admin or user revoking self)
//    */
//   revokeSession(sessionId: string): Observable<any> {
//     return this.patch(`/v1/sessions/${sessionId}/revoke`, {}, 'revokeSession');
//   }

//   /**
//    * PATCH /sessions/revoke-all
//    * Revoke all sessions except current one
//    */
//   revokeAllOthers(): Observable<any> {
//     return this.patch('/v1/sessions/revoke-all', {}, 'revokeAllOthers');
//   }
// }
