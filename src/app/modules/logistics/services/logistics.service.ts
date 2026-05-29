import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface LogisticsShipment {
  _id: string;
  shipmentNumber: string;
  trackingNumber: string;
  status: string;
  fulfillmentMode: string;
  priority: string;
  serviceLevel: string;
  sourceType: string;
  sourceNumber?: string;
  customer?: { name?: string; phone?: string; email?: string };
  pickupAddress?: { city?: string; state?: string; addressLine1?: string };
  dropoffAddress?: { city?: string; state?: string; addressLine1?: string };
  slaDeadlineAt?: string;
  promisedDeliveryAt?: string;
  updatedAt: string;
  createdAt: string;
}

export interface LogisticsSummary {
  byStatus: Array<{ _id: string; count: number }>;
  slaRisk: number;
  recent: LogisticsShipment[];
  generatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class LogisticsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/logistics`;

  getSummary(): Observable<{ status: string; data: LogisticsSummary }> {
    return this.http.get<{ status: string; data: LogisticsSummary }>(`${this.base}/operations/summary`);
  }

  getShipments(filters: { status?: string; search?: string; limit?: number } = {}): Observable<{
    status: string;
    data: { items: LogisticsShipment[]; total: number; page: number; limit: number };
  }> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<{
      status: string;
      data: { items: LogisticsShipment[]; total: number; page: number; limit: number };
    }>(`${this.base}/shipments`, { params });
  }
}
