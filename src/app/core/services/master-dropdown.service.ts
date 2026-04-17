import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DropdownOption {
  data: any;           // ✅ Full original object for metadata access
  label: string;
  value: string;
  meta?: any; // ✅ Support for rich data (stock, balance, etc.)
}

interface DropdownResponse {
  status: string;
  results: number;
  total: number;       // ✅ Total records matching search
  hasMore: boolean;    // ✅ Convenience for infinite scroll
  data: DropdownOption[];
}

// ✅ COMPLETE: Includes all 20+ routes currently in your backend
// export type DropdownEndpoint =
//   | 'users' | 'branches' | 'roles' | 'customers' | 'suppliers' | 'masters' | 'channels' | 'transfer-requests'
//   | 'products' | 'purchases' | 'sales' | 'sales-returns' | 'purchase-returns'
//   | 'accounts' | 'invoices' | 'payments' | 'emis'
//   | 'departments' | 'designations' | 'shifts' | 'holidays' | 'geofencing'
//   | 'attendance-machines' | 'attendance-requests' | 'leave-requests'
//   | 'meetings' | 'brands' | 'categories' | 'subcategories' | 'units' | 'taxes';

export type DropdownEndpoint =
  | 'users' | 'branches' | 'roles' | 'customers' | 'suppliers' | 'masters' | 'channels' | 'transfer-requests'
  | 'products' | 'purchases' | 'sales' | 'sales-returns' | 'purchase-returns'
  | 'brands' | 'categories' | 'subcategories' | 'units' | 'taxes'
  | 'accounts' | 'invoices' | 'payments' | 'emis'
  | 'departments' | 'designations' | 'shifts' | 'shift-assignments'
  | 'holidays' | 'geofencing' | 'attendance-machines' | 'attendance-requests' | 'leave-requests'
  | 'meetings';
@Injectable({
  providedIn: 'root'
})
export class MasterDropdownService {
  private readonly baseUrl = `${environment.apiUrl}/v1/dropdowns`;

  constructor(private http: HttpClient) { }
  getDropdownData(endpoint: DropdownEndpoint, search: string = '', page: number = 1, limit: number = 100, includeIds?: string[], extraParams: any = {}): Observable<DropdownResponse> { // ✅ Return the full response for better UI control
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);
    if (includeIds?.length) params = params.set('includeIds', includeIds.join(','));

    // ✅ Add any extra dynamic filters (like 'type', 'parentId', etc.)
    Object.keys(extraParams).forEach(key => {
      if (extraParams[key] !== undefined && extraParams[key] !== null) {
        params = params.set(key, extraParams[key].toString());
      }
    });
    return this.http.get<DropdownResponse>(`${this.baseUrl}/${endpoint}`, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching ${endpoint}:`, error);
        return of({ status: 'error', results: 0, total: 0, hasMore: false, data: [] });
      })
    );
  }
}


// import { Injectable } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Observable, of } from 'rxjs';
// import { map, catchError } from 'rxjs/operators';
// import { environment } from '../../../environments/environment';

// // 1. Strict Interface matching your new optimized backend
// export interface DropdownOption {
//   label: string;
//   value: string; // The _id from MongoDB
// }

// interface DropdownResponse {
//   status: string;
//   results: number;
//   data: DropdownOption[];
// }

// // 2. 🟢 ENTERPRISE UPGRADE: Strict typing for all 20+ routes
// // This gives you massive IDE auto-complete and prevents typos
// export type DropdownEndpoint =
//   // Auth & Org
//   | 'users' | 'branches' | 'roles' | 'customers' | 'suppliers' | 'masters'
//   // Inventory
//   | 'products' | 'purchases' | 'sales'
//   // Accounting
//   | 'accounts' | 'invoices' | 'payments' | 'emis'
//   // HRMS
//   | 'departments' | 'designations' | 'shifts' | 'holidays' | 'geofencing'
//   | 'shift-assignments' | 'attendance-machines';

// @Injectable({
//   providedIn: 'root'
// })
// export class MasterDropdownService {
//   // Replace with your actual environment variable path
//   // private readonly baseUrl = '/api/v1/dropdowns';
//   private readonly baseUrl = environment.apiUrl + '/v1/dropdowns';
//   constructor(private http: HttpClient) { }

//   /**
//    * Universal method to fetch optimized { label, value } pairs for ANY model
//    * * @param endpoint The specific module route (strictly typed)
//    * @param search The user's typed search term (for live filtering)
//    * @param page For infinite scrolling/lazy loading
//    * @param searchField (Optional) Override the backend default search field
//    * @param labelField (Optional) Override the backend default label field
//    * @param includeIds (Optional) Array of IDs to guarantee they load (fixes PrimeNG lazy load bug)
//    */
//   getDropdownData(
//     endpoint: DropdownEndpoint,
//     search: string = '',
//     page: number = 1,
//     searchField?: string,
//     labelField?: string,
//     includeIds?: string[]
//   ): Observable<DropdownOption[]> {

//     // 3. Dynamic HttpParams Construction
//     let params = new HttpParams()
//       .set('page', page.toString())
//       .set('limit', '50'); // Keep payload small

//     if (search) {
//       params = params.set('search', search);
//     }

//     if (searchField) {
//       params = params.set('searchField', searchField);
//     }

//     if (labelField) {
//       params = params.set('labelField', labelField);
//     }

//     // 4. Handle the PrimeNG MultiSelect pre-filled data edge case
//     if (includeIds && includeIds.length > 0) {
//       params = params.set('includeIds', includeIds.join(','));
//     }

//     // 5. Execute Request and map directly to the data array
//     return this.http.get<DropdownResponse>(`${this.baseUrl}/${endpoint}`, { params }).pipe(
//       map(response => response.data || []), // Isolate just the array
//       catchError(error => {
//         console.error(`Error fetching dropdown data for ${endpoint}:`, error);
//         return of([]); // Return an empty array on failure so the UI doesn't crash
//       })
//     );
//   }
// }