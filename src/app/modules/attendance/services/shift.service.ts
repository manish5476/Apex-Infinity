import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class ShiftService extends BaseApiService {
  private endpoint = '/v1/shifts';

  /**
   * 🟢 Create a new Shift Rule
   * @param data { name, startTime, endTime, gracePeriodMins, weeklyOffs... }
   */
  createShift(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createShift');
  }

  /**
   * 📋 Get All Active Shifts (For Dropdowns)
   */
  getAllShifts(): Observable<any> {
    return this.get(this.endpoint, {}, 'getAllShifts');
  }

  /**
   * 🔍 Get Single Shift Details
   */
  getShiftById(shiftId: string): Observable<any> {
    return this.get(`${this.endpoint}/${shiftId}`, {}, 'getShiftById');
  }

  /**
   * ✏️ Update Shift (e.g. Change Grace Period)
   */
  updateShift(shiftId: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${shiftId}`, data, 'updateShift');
  }

  /**
   * 🗑️ Delete Shift (Soft Delete)
   */
  deleteShift(shiftId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${shiftId}`, null, 'deleteShift');
  }
}