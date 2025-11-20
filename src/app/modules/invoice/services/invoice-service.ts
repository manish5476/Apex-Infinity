import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class InvoiceService extends BaseApiService {
  private endpoint = '/v1/invoices';

  createInvoice(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createInvoice');
  }

  getAllInvoices(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllInvoices');
  }

  getInvoiceById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getInvoiceById');
  }

  getInvoicesByCustomer(customerId: string): Observable<any> {
    return this.get(`${this.endpoint}/customer/${customerId}`, {}, 'getInvoicesByCustomer');
  }

  updateInvoice(id: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${id}`, data, 'updateInvoice');
  }

  deleteInvoiceById(id: string): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`, 'deleteInvoiceById');
  }

  // Special case: Email
  emailInvoice(id: string): Observable<any> {
    return this.post(`${this.endpoint}/pdf/${id}/email`, {}, 'emailInvoice');
  }

  // Special case: Blob Response for Download
  downloadInvoice(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}${this.endpoint}/pdf/${id}/download`, {
      responseType: 'blob', 
      observe: 'response'
    }).pipe(
      catchError(err => this.errorhandler.handleError(err, 'downloadInvoice'))
    );
  }
}


// // import { Injectable } from '@angular/core';

// // @Injectable({
// //   providedIn: 'root',
// // })
// // export class InvoiceService {

// // }
// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { HttpErrorResponse } from '@angular/common/http';
// import { BaseApiService } from '../../../core/services/base-api.service';

// @Injectable({ providedIn: 'root' })
// export class InvoiceService extends BaseApiService {
//   private endpoint = '/v1/invoices';

//   /**
//    * Create a new invoice
//    */
//   createInvoice(data: any): Observable<any> {
//     return this.http
//       .post(`${this.baseUrl}${this.endpoint}`, data)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error, 'createInvoice'),
//         ),
//       );
//   }

//   /**
//    * Get all invoices (supports filters, pagination, etc.)
//    */
//   getAllInvoices(filterParams?: any): Observable<any> {
//     return this.http
//       .get<any>(`${this.baseUrl}${this.endpoint}`, {
//         params: this.createHttpParams(filterParams),
//       })
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error, 'getAllInvoices'),
//         ),
//       );
//   }

//   /**
//    * Get a single invoice by ID
//    */
//   getInvoiceById(id: string): Observable<any> {
//     return this.http
//       .get<any>(`${this.baseUrl}${this.endpoint}/${id}`)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error, 'getInvoiceById'),
//         ),
//       );
//   }

//   /**
//    * Get invoices by Customer ID
//    */
//   getInvoicesByCustomer(customerId: string): Observable<any> {
//     return this.http
//       .get<any>(`${this.baseUrl}${this.endpoint}/customer/${customerId}`)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error, 'getInvoicesByCustomer'),
//         ),
//       );
//   }

//   /**
//    * Update an invoice by ID
//    */
//   updateInvoice(id: string, data: any): Observable<any> {
//     return this.http
//       .patch(`${this.baseUrl}${this.endpoint}/${id}`, data)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error, 'updateInvoice'),
//         ),
//       );
//   }

//   /**
//    * Delete an invoice by ID
//    */
//   deleteInvoiceById(id: string): Observable<any> {
//     return this.http
//       .delete(`${this.baseUrl}${this.endpoint}/${id}`)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error, 'deleteInvoiceById'),
//         ),
//       );
//   }

//   // ----------------------------------------------------------------------
//   // 📄 Additional Invoice Operations (PDF / Email)
//   // ----------------------------------------------------------------------

//   /**
//    * Download invoice as PDF
//    */
//   // downloadInvoice(id: string): Observable<Blob> {
//   //   return this.http
//   //     .get(`${this.baseUrl}${this.endpoint}/pdf/${id}/download`, {
//   //       responseType: 'blob',
//   //     })
//   //     .pipe(
//   //       catchError((error: HttpErrorResponse) =>
//   //         this.errorhandler.handleError(error,'downloadInvoice'),
//   //       ),
//   //     );
//   // }

//   downloadInvoice(id: string): Observable<any> {
//     return this.http.get(`${this.baseUrl}${this.endpoint}/pdf/${id}/download`, {
//       responseType: 'blob' as 'json',
//       observe: 'response'
//     }).pipe(
//       catchError((error: HttpErrorResponse) =>
//         this.errorhandler.handleError(error, 'downloadInvoice')
//       )
//     );
//   }
//     /**
//    * Send invoice to customer via email
//    */
//   emailInvoice(id: string): Observable<any> {
//     return this.http
//       .post<any>(`${this.baseUrl}${this.endpoint}/pdf/${id}/email`, {})
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error, 'emailInvoice'),
//         ),
//       );
//   }

//   // ----------------------------------------------------------------------
//   // 🔒 Future Routes (Not Implemented Yet in Backend)
//   // ----------------------------------------------------------------------

//   // /**
//   //  * Restore a deleted invoice (if soft delete is used)
//   //  * PATCH /v1/invoices/:id/restore
//   //  */
//   // restoreInvoice(id: string): Observable<any> {
//   //   return this.http
//   //     .patch(`${this.baseUrl}${this.endpoint}/${id}/restore`, {})
//   //     .pipe(
//   //       catchError((error: HttpErrorResponse) =>
//   //         this.errorhandler.handleError(error,'restoreInvoice'),
//   //       ),
//   //     );
//   // }

//   // /**
//   //  * Bulk delete invoices
//   //  * DELETE /v1/invoices  (with body: { ids: [] })
//   //  */
//   // deleteInvoices(ids: string[]): Observable<any> {
//   //   return this.http
//   //     .delete(`${this.baseUrl}${this.endpoint}`, { body: { ids } })
//   //     .pipe(
//   //       catchError((error: HttpErrorResponse) =>
//   //         this.errorhandler.handleError(error,'deleteInvoices'),
//   //       ),
//   //     );
//   // }
// }
