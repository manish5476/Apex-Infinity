import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class CustomerService extends BaseApiService {
  private endpoint = '/v1/customers';

  // ============================================================
  // =============== STANDARD CUSTOMER CRUD =====================
  // ============================================================

  createNewCustomer(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createNewCustomer');
  }

  getAllCustomerData(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllCustomerData');
  }

  getCustomerDataWithId(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getCustomerDataWithId');
  }

  updateCustomer(customerId: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${customerId}`, data, 'updateCustomer');
  }

  reStoreCustomer(customerId: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${customerId}/restore`, data, 'reStoreCustomer');
  }

  deleteCustomerID(customerId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${customerId}`, 'deleteCustomerID');
  }

  deleteCustomers(customerIds: string[]): Observable<any> {
    const url = `${this.baseUrl}${this.endpoint}`;
    return this.http
      .delete(url, { body: { ids: customerIds } })
      .pipe(catchError(err => this.errorhandler.handleError(err, 'deleteCustomers')));
  }

  // ============================================================
  // =============== NEWLY ADDED API ROUTES =====================
  // ============================================================

  /** GET /v1/customers/search */
  searchCustomers(queryParams: any): Observable<any> {
    return this.get(`${this.endpoint}/search`, queryParams, 'searchCustomers');
  }

  /** POST /v1/customers/bulk-update */
  bulkUpdateCustomers(data: any): Observable<any> {
    return this.post(`${this.endpoint}/bulk-update`, data, 'bulkUpdateCustomers');
  }

  /** PATCH /v1/customers/:id/upload */
  uploadProfileImage(formData: FormData, customerId: string): Observable<any> {
    const url = `${this.baseUrl}${this.endpoint}/${customerId}/upload`;
    return this.http
      .patch(url, formData)
      .pipe(catchError(err => this.errorhandler.handleError(err, 'uploadProfileImage')));
  }

  /** PATCH /v1/customers/:id/restore */
restoreCustomer(customerId: string): Observable<any> {
  return this.patch(`${this.endpoint}/${customerId}/restore`, {}, 'restoreCustomer');
}

}


// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { BaseApiService } from '../../../core/services/base-api.service';

// @Injectable({ providedIn: 'root' })
// export class CustomerService extends BaseApiService {
//   private endpoint = '/v1/customers';

//   createNewCustomer(data: any): Observable<any> {
//     return this.post(this.endpoint, data, 'createNewCustomer');
//   }

//   getAllCustomerData(filterParams?: any): Observable<any> {
//     return this.get(this.endpoint, filterParams, 'getAllCustomerData');
//   }

//   getCustomerDataWithId(id: string): Observable<any> {
//     return this.get(`${this.endpoint}/${id}`, {}, 'getCustomerDataWithId');
//   }

//   updateCustomer(customerId: string, data: any): Observable<any> {
//     return this.patch(`${this.endpoint}/${customerId}`, data, 'updateCustomer');
//   }

//   reStoreCustomer(customerId: string, data: any): Observable<any> {
//     return this.patch(`${this.endpoint}/${customerId}/restore`, data, 'reStoreCustomer');
//   }

//   deleteCustomerID(customerId: string): Observable<any> {
//     return this.delete(`${this.endpoint}/${customerId}`, 'deleteCustomerID');
//   }

//   deleteCustomers(customerIds: string[]): Observable<any> {
//     // DELETE with Body is tricky in standard Angular HTTP client wrapper
//     // accessing http directly for this specific case
//     const url = `${this.baseUrl}${this.endpoint}`;
//     return this.http.delete(url, { body: { ids: customerIds } })
//       .pipe(catchError(err => this.errorhandler.handleError(err, 'deleteCustomers')));
//   }

//   uploadProfileImage(formData: FormData, customerId: string): Observable<any> {
//     const url = `${this.baseUrl}${this.endpoint}/${customerId}/upload`;
//     return this.http.post(url, formData)
//       .pipe(catchError(err => this.errorhandler.handleError(err, 'uploadProfileImage')));
//   }
// }

// // import { Injectable } from '@angular/core';
// // import { Observable } from 'rxjs';
// // import { catchError } from 'rxjs/operators';
// // import { HttpErrorResponse } from '@angular/common/http';
// // import { BaseApiService } from '../../../core/services/base-api.service';


// // @Injectable({ providedIn: 'root' })
// // export class CustomerService extends BaseApiService {
// //   private endpoint = '/v1/customers';

// //     // This function now supports sending a single object or an array of objects
// //   createNewCustomer(data: any | any): Observable<any> {
// //     return this.http
// //       .post(`${this.baseUrl}${this.endpoint}`, data)
// //       .pipe(
// //         catchError((error: HttpErrorResponse) =>
// //           this.errorhandler.handleError(error,'createNewCustomer'),
// //         ),
// //       );
// //   }

// //   getAllCustomerData(filterParams?: any): Observable<any> {
// //     return this.http
// //       .get<any>(`${this.baseUrl}${this.endpoint}`, {
// //         params: this.createHttpParams(filterParams),
// //       })
// //       .pipe(
// //         catchError((error: HttpErrorResponse) =>
// //           this.errorhandler.handleError(error,'getAllCustomerData'),
// //         ),
// //       );
// //   }

// //   getCustomerDataWithId(id: string): Observable<any> {
// //     return this.http
// //       .get<any>(`${this.baseUrl}${this.endpoint}/${id}`)
// //       .pipe(
// //         catchError((error: HttpErrorResponse) =>
// //           this.errorhandler.handleError(error,'getCustomerDataWithId'),
// //         ),
// //       );
// //   }


// //   updateCustomer(customerId: string, data: any): Observable<any> {
// //     return this.http
// //       .patch(`${this.baseUrl}${this.endpoint}/${customerId}`, data)
// //       .pipe(
// //         catchError((error: HttpErrorResponse) =>
// //           this.errorhandler.handleError(error,'updateCustomer'),
// //         ),
// //       );
// //   }

// //   reStoreCustomer(customerId: string, data: any): Observable<any> {
// //     return this.http
// //       .patch(`${this.baseUrl}${this.endpoint}/${customerId}/restore`, data)
// //       .pipe(
// //         catchError((error: HttpErrorResponse) =>
// //           this.errorhandler.handleError(error,'reStoreCustomer'),
// //         ),
// //       );
// //   }
// //   /**
// //    * Deletes a single customer by their ID.
// //    * @param customerId The ID of the customer to delete.
// //    */
// //   deleteCustomerID(customerId: string): Observable<any> {
// //     const url = `${this.baseUrl}${this.endpoint}/${customerId}`;
// //     return this.http
// //       .delete(url)
// //       .pipe(
// //         catchError((error: HttpErrorResponse) =>
// //           this.errorhandler.handleError(error,'deleteCustomerID'),
// //         ),
// //       );
// //   }



// //   /**
// //    * Deletes multiple customers in a single bulk operation.
// //    * @param customerIds An array of customer IDs to delete.
// //    */
// //   deleteCustomers(customerIds: string[]): Observable<any> {
// //     // This now correctly calls the unified DELETE endpoint without an ID in the URL
// //     const url = `${this.baseUrl}${this.endpoint}`;
// //     const body = { ids: customerIds };
// //     return this.http
// //       .delete(url, { body })
// //       .pipe(
// //         catchError((error: HttpErrorResponse) =>
// //           this.errorhandler.handleError(error,'deleteCustomers'),
// //         ),
// //       );
// //   }

  
// // uploadProfileImage(formData: FormData, customerId: string): Observable<any> {
// //   const apiUrl = `${this.baseUrl}${this.endpoint}/${customerId}/upload`;
// //   return this.http.post(apiUrl, formData).pipe(
// //     catchError((error: any) =>
// //       this.errorhandler.handleError(error,"uploadProfileImage")
// //     )
// //   );
// // }


// //   // getCustomerDropDown(): Observable<any[]> {
// //   //   return this.http
// //   //     .get<any[]>(`${this.baseUrl}${this.endpoint}/customerDropDown`)
// //   //     .pipe(
// //   //       catchError((error: HttpErrorResponse) =>
// //   //         this.errorhandler.handleError(error,'getCustomerDropDown'),
// //   //       ),
// //   //     );
// //   // }

// //   // getCustomerSnapShot(id: any): Observable<any[]> {
// //   //   return this.http
// //   //     .get<any[]>(`${this.baseUrl}${this.endpoint}/${id}/snapshot`)
// //   //     .pipe(
// //   //       catchError((error: HttpErrorResponse) =>
// //   //         this.errorhandler.handleError(error,'getCustomerSnapShot'),
// //   //       ),
// //   //     );
// //   // }
// // }


// // // import { Injectable } from '@angular/core';

// // // @Injectable({
// // //   providedIn: 'root',
// // // })
// // // export class CustomerService {
  
// // // }
