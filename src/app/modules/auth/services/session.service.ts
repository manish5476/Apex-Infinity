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
