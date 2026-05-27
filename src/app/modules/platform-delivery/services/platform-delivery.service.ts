import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlatformDeliveryService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/v1/platform-delivery`;

  private get headers() {
    const token = localStorage.getItem('platform_delivery_token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.base}/register`, data);
  }

  login(phone: string, password: string): Observable<any> {
    return this.http.post(`${this.base}/login`, { phone, password });
  }

  getOrders(): Observable<any> {
    return this.http.get(`${this.base}/orders`, this.headers);
  }

  scanOrder(identifier: string): Observable<any> {
    return this.http.get(`${this.base}/scan/${identifier}`, this.headers);
  }

  updateOrderStatus(orderId: string, status: string, paymentCollected?: boolean): Observable<any> {
    return this.http.patch(`${this.base}/orders/${orderId}/status`, { status, paymentCollected }, this.headers);
  }

  updatePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.patch(`${this.base}/update-password`, { oldPassword, newPassword }, this.headers);
  }
}
