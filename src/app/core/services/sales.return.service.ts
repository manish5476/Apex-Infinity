import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

// =============================================================================
// Interfaces for Payload Suggestions (IntelliSense)
// =============================================================================

export interface SalesReturnItem {
  productId: string;
  quantity: number;
}

export interface CreateSalesReturnPayload {
  invoiceId: string; // FIXED: Matches controller's req.body.invoiceId
  items: SalesReturnItem[];
  reason: string;    // FIXED: Matches controller's req.body.reason
  notes?: string;
}

export interface GetSalesReturnsQuery {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected' | string;
  customerId?: string;
  invoiceId?: string;
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string;   // Format: YYYY-MM-DD
  [key: string]: any;
}

export interface RejectSalesReturnPayload {
  rejectionReason: string; // Matches controller's req.body.rejectionReason
}

// =============================================================================
// Sales Return Service
// =============================================================================

@Injectable({ providedIn: 'root' })
export class SalesReturnService extends BaseApiService {
  private endpoint = '/v1/sales-returns';

  // ============================================================
  // ── COLLECTION ROUTES ───────────────────────────────────────
  // ============================================================

  createSalesReturn(payload: CreateSalesReturnPayload): Observable<any> {
    return this.post(this.endpoint, payload, 'createSalesReturn');
  }

  getSalesReturns(queryParams?: GetSalesReturnsQuery): Observable<any> {
    return this.get(this.endpoint, queryParams, 'getSalesReturns');
  }

  // ============================================================
  // ── APPROVAL WORKFLOW ACTIONS ───────────────────────────────
  // ============================================================

  approveReturn(returnId: string, payload: any): Observable<any> {
    return this.patch(`${this.endpoint}/${returnId}/approve`, payload, 'approveReturn');
  }

  rejectReturn(returnId: string, payload: RejectSalesReturnPayload): Observable<any> {
    return this.patch(`${this.endpoint}/${returnId}/reject`, payload, 'rejectReturn');
  }

  // ============================================================
  // ── ITEM ROUTES ─────────────────────────────────────────────
  // ============================================================

  getSalesReturnById(returnId: string): Observable<any> {
    return this.get(`${this.endpoint}/${returnId}`, {}, 'getSalesReturnById');
  }
}