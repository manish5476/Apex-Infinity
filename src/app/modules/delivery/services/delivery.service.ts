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

  private get headers() {
    const token = localStorage.getItem('delivery_token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  login(phone: string, password: string):Observable<any> {
    return this.http.post(`${this.base}/login`, { phone, password });
  }

  getOrders(): Observable<any> {
    return this.http.get(`${this.base}/orders`, this.headers);
  }

  updateOrderStatus(orderId: string, status: string): Observable<any> {
    return this.http.patch(`${this.base}/orders/${orderId}/status`, { status }, this.headers);
  }
}
