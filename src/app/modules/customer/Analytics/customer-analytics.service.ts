import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';

/**
 * Interface for common analytics filters
 * Usage: service.getOverview({ startDate: '2023-01-01', branchId: 'XYZ' })
 */
export interface AnalyticsFilter {
  startDate?: string | Date;
  endDate?: string | Date;
  branchId?: string;
  customerId?: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class CustomerAnalyticsService extends BaseApiService {
  // Ensure this prefix matches your main app route registration (e.g., /v1/customer-analytics)
  private endpoint = '/v1/customeranalytics';

  // =============================================================================
  // 1. CACHED ANALYTICS ROUTES
  // =============================================================================

  /** Get general overview metrics */
  getCustomerOverview(filters?: AnalyticsFilter): Observable<any> {
    return this.get(`${this.endpoint}/overview`, filters, 'getCustomerOverview');
  }

  /** Get financial health and trends */
  getFinancials(filters?: AnalyticsFilter): Observable<any> {
    return this.get(`${this.endpoint}/financials`, filters, 'getFinancials');
  }

  /** Analyze how customers pay (On-time vs Late) */
  getPaymentBehavior(filters?: AnalyticsFilter): Observable<any> {
    return this.get(`${this.endpoint}/payment-behavior`, filters, 'getPaymentBehavior');
  }

  /** Get Customer Lifetime Value (LTV) analytics */
  getLTV(filters?: AnalyticsFilter): Observable<any> {
    return this.get(`${this.endpoint}/ltv`, filters, 'getLTV');
  }

  /** Get customer grouping and segmentation data */
  getSegmentation(filters?: AnalyticsFilter): Observable<any> {
    return this.get(`${this.endpoint}/segmentation`, filters, 'getSegmentation');
  }

  /** Get geographic distribution of customers */
  getGeospatial(filters?: AnalyticsFilter): Observable<any> {
    return this.get(`${this.endpoint}/geospatial`, filters, 'getGeospatial');
  }

  // =============================================================================
  // 2. REAL-TIME & SENSITIVE ROUTES
  // =============================================================================

  /** Fetch live dashboard metrics (Uncached) */
  getRealTimeDashboard(): Observable<any> {
    return this.get(`${this.endpoint}/realtime`, {}, 'getRealTimeDashboard');
  }

  /** Get EMI-specific analytics and aging reports */
  getEMIAnalytics(filters?: AnalyticsFilter): Observable<any> {
    return this.get(`${this.endpoint}/emi`, filters, 'getEMIAnalytics');
  }

  // =============================================================================
  // 3. EXPORT ROUTES
  // =============================================================================

  /** * Export Financials to CSV 
   * Usually handled via direct window.open or a blob response 
   */
  exportFinancials(filters?: AnalyticsFilter): Observable<Blob> {
    const url = `${this.endpoint}/export/financials`;
    // We use 'blob' as the response type for file downloads
    return this.http.get(url, {
      params: filters,
      responseType: 'blob'
    });
  }
}