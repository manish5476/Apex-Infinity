import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class HolidayService extends BaseApiService {
  private endpoint = '/v1/holidays';

  /**
   * 🟢 Create a New Holiday
   * @param data { name, date, description, isOptional }
   */
  createHoliday(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createHoliday');
  }

  /**
   * 📅 Get Holidays (Supports Year Filter)
   * @param filterParams { year: '2024' }
   */
  getHolidays(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getHolidays');
  }

  /**
   * 🔍 Get Single Holiday
   */
  getHolidayById(holidayId: string): Observable<any> {
    return this.get(`${this.endpoint}/${holidayId}`, {}, 'getHolidayById');
  }

  /**
   * ✏️ Update Holiday
   */
  updateHoliday(holidayId: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${holidayId}`, data, 'updateHoliday');
  }

  /**
   * 🗑️ Delete Holiday
   */
  deleteHoliday(holidayId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${holidayId}`, null, 'deleteHoliday');
  }
}