import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseApiService } from '../../../core/services/base-api.service';


@Injectable({ providedIn: 'root' })
export class CustomerService extends BaseApiService {
  private endpoint = '/v1/customers';

    // This function now supports sending a single object or an array of objects
  createNewCustomer(data: any | any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}${this.endpoint}`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('createNewCustomer', error),
        ),
      );
  }

  getAllCustomerData(filterParams?: any): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}`, {
        params: this.createHttpParams(filterParams),
      })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('getAllCustomerData', error),
        ),
      );
  }

  getCustomerDataWithId(id: string): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('getCustomerDataWithId', error),
        ),
      );
  }


  updateCustomer(customerId: string, data: any): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}${this.endpoint}/${customerId}`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('updateCustomer', error),
        ),
      );
  }

  reStoreCustomer(customerId: string, data: any): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}${this.endpoint}/${customerId}/restore`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('reStoreCustomer', error),
        ),
      );
  }
  /**
   * Deletes a single customer by their ID.
   * @param customerId The ID of the customer to delete.
   */
  deleteCustomerID(customerId: string): Observable<any> {
    const url = `${this.baseUrl}${this.endpoint}/${customerId}`;
    return this.http
      .delete(url)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('deleteCustomerID', error),
        ),
      );
  }



  /**
   * Deletes multiple customers in a single bulk operation.
   * @param customerIds An array of customer IDs to delete.
   */
  deleteCustomers(customerIds: string[]): Observable<any> {
    // This now correctly calls the unified DELETE endpoint without an ID in the URL
    const url = `${this.baseUrl}${this.endpoint}`;
    const body = { ids: customerIds };
    return this.http
      .delete(url, { body })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('deleteCustomers', error),
        ),
      );
  }

  
uploadProfileImage(formData: FormData, customerId: string): Observable<any> {
  const apiUrl = `${this.baseUrl}${this.endpoint}/${customerId}/upload`;
  return this.http.post(apiUrl, formData).pipe(
    catchError((error: any) =>
      this.errorhandler.handleError("uploadProfileImage", error)
    )
  );
}


  // getCustomerDropDown(): Observable<any[]> {
  //   return this.http
  //     .get<any[]>(`${this.baseUrl}${this.endpoint}/customerDropDown`)
  //     .pipe(
  //       catchError((error: HttpErrorResponse) =>
  //         this.errorhandler.handleError('getCustomerDropDown', error),
  //       ),
  //     );
  // }

  // getCustomerSnapShot(id: any): Observable<any[]> {
  //   return this.http
  //     .get<any[]>(`${this.baseUrl}${this.endpoint}/${id}/snapshot`)
  //     .pipe(
  //       catchError((error: HttpErrorResponse) =>
  //         this.errorhandler.handleError('getCustomerSnapShot', error),
  //       ),
  //     );
  // }
}


// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root',
// })
// export class CustomerService {
  
// }
