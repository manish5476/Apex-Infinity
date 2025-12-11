import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class GlobalSearchService extends BaseApiService {
  
  /**
   * Searches Customers, Products, and Invoices simultaneously.
   * @param query The search text
   */
  search(query: string): Observable<any> {
    return this.get('/v1/search/global', { q: query }, 'globalSearch');
  }
}