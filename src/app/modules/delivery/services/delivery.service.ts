import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/v1/delivery-agent`;

  private getHeaders(orgSlug: string) {
    const token = localStorage.getItem(`delivery_token_${orgSlug}`);
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  login(orgSlug: string, phone: string, password: string):Observable<any> {
    return this.http.post(`${this.base}/login`, { orgSlug, phone, password });
  }

  getOrders(orgSlug: string): Observable<any> {
    return this.http.get(`${this.base}/orders`, this.getHeaders(orgSlug));
  }

  scanOrder(orgSlug: string, identifier: string): Observable<any> {
    return this.http.get(`${this.base}/scan/${identifier}`, this.getHeaders(orgSlug));
  }

  updateOrderStatus(orgSlug: string, orderId: string, status: string, paymentCollected?: boolean): Observable<any> {
    return this.http.patch(`${this.base}/orders/${orderId}/status`, { status, paymentCollected }, this.getHeaders(orgSlug));
  }

  updatePassword(orgSlug: string, oldPassword: string, newPassword: string): Observable<any> {
    return this.http.patch(`${this.base}/update-password`, { oldPassword, newPassword }, this.getHeaders(orgSlug));
  }

  forgotPassword(orgSlug: string, phoneOrEmail: string): Observable<any> {
    const isEmail = phoneOrEmail.includes('@');
    const payload = isEmail ? { orgSlug, email: phoneOrEmail } : { orgSlug, phone: phoneOrEmail };
    return this.http.post(`${this.base}/forgot-password`, payload);
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.patch(`${this.base}/reset-password/${token}`, { password });
  }

  getProfile(orgSlug: string): Observable<any> {
    return this.http.get(`${this.base}/profile`, this.getHeaders(orgSlug));
  }

  updateProfile(orgSlug: string, data: any): Observable<any> {
    return this.http.patch(`${this.base}/profile`, data, this.getHeaders(orgSlug));
  }
}
