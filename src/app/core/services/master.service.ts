import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class MasterService extends BaseApiService {

  private masterEndpoint = '/v1/master';
  private bulkEndpoint = '/v1/master/bulk';
  private masterTypeEndpoint = '/v1/master-types';

  /* ==================== MASTER CRUD ==================== */

  createMaster(data: any): Observable<any> {
    return this.post(this.masterEndpoint, data, 'createMaster');
  }

  getMasters(filterParams?: any): Observable<any> {
    return this.get(this.masterEndpoint, filterParams, 'getMasters');
  }

  updateMaster(id: string, data: any): Observable<any> {
    return this.patch(`${this.masterEndpoint}/${id}`, data, 'updateMaster');
  }

  deleteMaster(id: string): Observable<any> {
    return this.delete(`${this.masterEndpoint}/${id}`,null, 'deleteMaster');
  }

  /* ==================== BULK IMPORT ==================== */

  createBulkMasters(data: any[]): Observable<any> {
    const payload = { items: data };
    return this.post(this.bulkEndpoint, payload, 'createBulkMasters');
  }

  /* ==================== MASTER TYPE CRUD ==================== */

  createMasterType(data: any): Observable<any> {
    return this.post(this.masterTypeEndpoint, data, 'createMasterType');
  }

  getMasterTypes(): Observable<any> {
    return this.get(this.masterTypeEndpoint, {}, 'getMasterTypes');
  }

  updateMasterType(id: string, data: any): Observable<any> {
    return this.patch(`${this.masterTypeEndpoint}/${id}`, data, 'updateMasterType');
  }

  deleteMasterType(id: string): Observable<any> {
    return this.delete(`${this.masterTypeEndpoint}/${id}`,null, 'deleteMasterType');
  }
}
