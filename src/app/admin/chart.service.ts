import { Injectable } from '@angular/core';
import { BaseApiService } from '@core/services/base-api.service';
import { Observable } from 'rxjs';

// =============================================================================
// Interfaces for Chart Query Parameters (Payloads)
// =============================================================================

export interface YearQuery {
  year?: number; // e.g., 2024
  [key: string]: any;
}

export interface DateRangeQuery {
  startDate?: string | Date; // e.g., '2024-01-01'
  endDate?: string | Date;   // e.g., '2024-12-31'
  [key: string]: any;
}

export interface FinancialTrendQuery extends YearQuery {
  interval?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface SalesDistributionQuery extends DateRangeQuery {
  groupBy?: 'category' | 'brand' | 'branch' | 'salesRep' | 'paymentMethod' | string;
}

export interface TopPerformersQuery extends DateRangeQuery {
  type?: 'products' | 'customers' | 'branches' | 'staff' | string;
  limit?: number; // default 5
}

export interface HeatmapAttendanceQuery {
  branchId?: string;
  days?: number; // e.g., 30
  [key: string]: any;
}

export interface LimitQuery {
  limit?: number; // e.g., 10
  [key: string]: any;
}

export interface InventoryHealthQuery {
  branchId?: string;
  [key: string]: any;
}

export interface LeaveUtilizationQuery {
  financialYear?: string; // e.g., '2024-2025'
  [key: string]: any;
}

// =============================================================================
// Analytics / Chart Service
// =============================================================================

@Injectable({ providedIn: 'root' })
export class ChartService extends BaseApiService {
  // Base path matching your Express app.js mount point
  private endpoint = '/v1/chart';

  // ─────────────────────────────────────────────────────────────
  // FINANCIAL & SALES
  // ─────────────────────────────────────────────────────────────

  getFinancialTrend(queryParams?: FinancialTrendQuery): Observable<any> {
    return this.get(`${this.endpoint}/financial-trend`, queryParams, 'getFinancialTrend');
  }

  getGrossProfitTrend(queryParams?: YearQuery): Observable<any> {
    return this.get(`${this.endpoint}/gross-profit`, queryParams, 'getGrossProfitTrend');
  }

  getYoYGrowth(queryParams?: YearQuery): Observable<any> {
    return this.get(`${this.endpoint}/yoy-growth`, queryParams, 'getYoYGrowth');
  }

  getPurchaseVsSales(queryParams?: YearQuery): Observable<any> {
    return this.get(`${this.endpoint}/purchase-vs-sales`, queryParams, 'getPurchaseVsSales');
  }

  getSalesReturnRate(queryParams?: YearQuery): Observable<any> {
    return this.get(`${this.endpoint}/return-rate`, queryParams, 'getSalesReturnRate');
  }

  // ─────────────────────────────────────────────────────────────
  // DISTRIBUTION & SEGMENTATION
  // ─────────────────────────────────────────────────────────────

  getSalesDistribution(queryParams?: SalesDistributionQuery): Observable<any> {
    return this.get(`${this.endpoint}/sales-distribution`, queryParams, 'getSalesDistribution');
  }

  getPaymentMethodBreakdown(queryParams?: DateRangeQuery): Observable<any> {
    return this.get(`${this.endpoint}/payment-methods`, queryParams, 'getPaymentMethodBreakdown');
  }

  // ─────────────────────────────────────────────────────────────
  // BRANCH & PERFORMANCE
  // ─────────────────────────────────────────────────────────────

  getBranchPerformanceRadar(queryParams?: DateRangeQuery): Observable<any> {
    return this.get(`${this.endpoint}/branch-radar`, queryParams, 'getBranchPerformanceRadar');
  }

  getTopPerformers(queryParams?: TopPerformersQuery): Observable<any> {
    return this.get(`${this.endpoint}/top-performers`, queryParams, 'getTopPerformers');
  }

  // ─────────────────────────────────────────────────────────────
  // ORDERS & PIPELINE
  // ─────────────────────────────────────────────────────────────

  getOrderFunnel(queryParams?: DateRangeQuery): Observable<any> {
    return this.get(`${this.endpoint}/order-funnel`, queryParams, 'getOrderFunnel');
  }

  getAOVTrend(queryParams?: YearQuery): Observable<any> {
    return this.get(`${this.endpoint}/aov-trend`, queryParams, 'getAOVTrend');
  }

  getHeatmap(queryParams?: HeatmapAttendanceQuery): Observable<any> {
    return this.get(`${this.endpoint}/heatmap`, queryParams, 'getHeatmap');
  }



  // ─────────────────────────────────────────────────────────────
  // INVENTORY
  // ─────────────────────────────────────────────────────────────

  getInventoryHealth(queryParams?: InventoryHealthQuery): Observable<any> {
    return this.get(`${this.endpoint}/inventory-health`, queryParams, 'getInventoryHealth');
  }

  // ─────────────────────────────────────────────────────────────
  // FINANCE — EMI
  // ─────────────────────────────────────────────────────────────

  getEmiPortfolioStats(): Observable<any> {
    // No query params expected for org-wide snapshot
    return this.get(`${this.endpoint}/emi-portfolio`, {}, 'getEmiPortfolioStats');
  }




  // ─────────────────────────────────────────────────────────────
  // CUSTOMERS
  // ─────────────────────────────────────────────────────────────

  getCustomerAcquisition(queryParams?: YearQuery): Observable<any> {
    return this.get(`${this.endpoint}/customer-acquisition`, queryParams, 'getCustomerAcquisition');
  }

  getCustomerOutstanding(queryParams?: LimitQuery): Observable<any> {
    return this.get(`${this.endpoint}/customer-outstanding`, queryParams, 'getCustomerOutstanding');
  }

  // ─────────────────────────────────────────────────────────────
  // HRMS
  // ─────────────────────────────────────────────────────────────

  getAttendanceKpis(queryParams?: HeatmapAttendanceQuery): Observable<any> {
    return this.get(`${this.endpoint}/attendance-kpis`, queryParams, 'getAttendanceKpis');
  }

  getLeaveUtilization(queryParams?: LeaveUtilizationQuery): Observable<any> {
    return this.get(`${this.endpoint}/leave-utilization`, queryParams, 'getLeaveUtilization');
  }
}