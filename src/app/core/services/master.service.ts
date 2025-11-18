import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class MasterService extends BaseApiService {
  private endpoint = '/v1/master';

  /**
   * Create a new Master entry
   * POST /api/v1/master
   */
  createMaster(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}${this.endpoint}`, data).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'createMaster'))
    );
  }

  /**
   * Get all Masters
   * GET /api/v1/master
   */
  getMasters(filterParams?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}${this.endpoint}`, { 
      params: this.createHttpParams(filterParams) 
    }).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getMasters'))
    );
  }

  /**
   * Update Master entry
   * PATCH /api/v1/master/:id
   */
  updateMaster(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}${this.endpoint}/${id}`, data).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'updateMaster'))
    );
  }

  /**
   * Delete Master entry
   * DELETE /api/v1/master/:id
   */
  deleteMaster(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}${this.endpoint}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'deleteMaster'))
    );
  }
}