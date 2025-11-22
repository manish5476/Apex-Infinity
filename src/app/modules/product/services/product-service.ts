import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators'; // <--- IMPORT THIS
import { BaseApiService } from '../../../core/services/base-api.service';
@Injectable({ providedIn: 'root' })
export class ProductService extends BaseApiService {
  private endpoint = '/v1/products';

  // ================= CREATE =================
  createProduct(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createProduct');
  }

  // ================= GET =================
  getAllProducts(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllProducts');
  }

  getProductById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getProductById');
  }

  searchProducts(query: any): Observable<any> {
    return this.get(`${this.endpoint}/search`, query, 'searchProducts');
  }

  // ================= UPDATE =================
  updateProduct(productId: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${productId}`, data, 'updateProduct');
  }

  // PATCH /v1/products/:id/upload
  uploadProductFile(productId: string, formData: FormData): Observable<any> {
    const url = `${this.baseUrl}${this.endpoint}/${productId}/upload`;
    
    // 1. Use standard http.patch
    // 2. Use the fixed catchAndHandle
    return this.http.patch(url, formData)
      .pipe(this.catchAndHandle('uploadProductFile'));
  }

  restoreProduct(productId: string): Observable<any> {
    return this.patch(`${this.endpoint}/${productId}/restore`, {}, 'restoreProduct');
  }

  // ================= BULK OPERATIONS =================
  bulkImportProducts(formData: FormData): Observable<any> {
    const url = `${this.baseUrl}${this.endpoint}/bulk-import`;
    return this.http.post(url, formData)
      .pipe(this.catchAndHandle('bulkImportProducts'));
  }

  // ================= DELETE =================
  deleteProductById(productId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${productId}`, 'deleteProductById');
  }

  // ================= HELPER (FIXED) =================
  private catchAndHandle(operation: string) {
    return (source: Observable<any>) => {
      return source.pipe(
        // FIX: You must use the 'catchError' operator here
        catchError(err => this.errorhandler.handleError(err, operation))
      );
    };
  }
}

// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService } from '../../../core/services/base-api.service';

// @Injectable({ providedIn: 'root' })
// export class ProductService extends BaseApiService {
//   private endpoint = '/v1/products';
//   // ================= CREATE =================
//   createProduct(data: any): Observable<any> {
//     return this.post(this.endpoint, data, 'createProduct');
//   }
//   // ================= GET =================
//   getAllProducts(filterParams?: any): Observable<any> {
//     return this.get(this.endpoint, filterParams, 'getAllProducts');
//   }
//   getProductById(id: string): Observable<any> {
//     return this.get(`${this.endpoint}/${id}`, {}, 'getProductById');
//   }
//   // GET /v1/products/search
//   searchProducts(query: any): Observable<any> {
//     return this.get(`${this.endpoint}/search`, query, 'searchProducts');
//   }
//   // ================= UPDATE =================
//   updateProduct(productId: string, data: any): Observable<any> {
//     return this.patch(`${this.endpoint}/${productId}`, data, 'updateProduct');
//   }
//   // PATCH /v1/products/:id/upload
//   uploadProductFile(productId: string, formData: FormData): Observable<any> {
//     const url = `${this.baseUrl}${this.endpoint}/${productId}/upload`;
//     return this.http.patch(url, formData)
//       .pipe(this.catchAndHandle('uploadProductFile'));
//   }
//   // PATCH /v1/products/:id/restore
//   restoreProduct(productId: string): Observable<any> {
//     return this.patch(`${this.endpoint}/${productId}/restore`, {}, 'restoreProduct');
//   }
//   // ================= BULK OPERATIONS =================
//   // POST /v1/products/bulk-import
//   bulkImportProducts(formData: FormData): Observable<any> {
//     const url = `${this.baseUrl}${this.endpoint}/bulk-import`;
//     return this.http.post(url, formData)
//       .pipe(this.catchAndHandle('bulkImportProducts'));
//   }

//   // ================= DELETE =================

//   deleteProductById(productId: string): Observable<any> {
//     return this.delete(`${this.endpoint}/${productId}`, 'deleteProductById');
//   }

//   // ================= HELPER FOR PATCH/POST FORM DATA =================
//   private catchAndHandle(operation: string) {
//     return (source: any) =>
//       source.pipe(
//         // reuse BaseApiService error handler
//           this.errorhandler.handleError(operation,'createProduct'),
//         // this.errorhandler.handleErrorOperator(operation)
//       );
//   }
// }