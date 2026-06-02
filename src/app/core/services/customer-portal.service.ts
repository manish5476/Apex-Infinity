import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { StorefrontSessionService } from '@core/services/storefront-session.service';

/**
 * CustomerPortalService
 * ─────────────────────────────────────────────
 * Talks to /api/v1/store/:slug/portal/* endpoints.
 * Uses the CRM Customer portalAccess auth (portal_customer JWT),
 * NOT the StorefrontCustomer JWT from StorefrontAuthFacade.
 */
@Injectable({ providedIn: 'root' })
export class CustomerPortalService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(StorefrontSessionService);

  private base(slug: string) {
    return `/api/v1/store/${slug}/portal`;
  }

  // ── Auth ──────────────────────────────────────────────────────────────

  register(slug: string, payload: {
    email: string; password: string;
    firstName?: string; lastName?: string; phone: string;
  }): Observable<any> {
    return this.http.post(`${this.base(slug)}/register`, payload, { withCredentials: true });
  }

  login(slug: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.base(slug)}/login`, { email, password }, { withCredentials: true }).pipe(
      tap((res: any) => {
        if (res?.data?.token) {
          sessionStorage.setItem(`portal_token_${slug}`, res.data.token);
        }
      })
    );
  }

  logout(slug: string): Observable<any> {
    sessionStorage.removeItem(`portal_token_${slug}`);
    return this.http.post(`${this.base(slug)}/logout`, {}, { withCredentials: true });
  }

  forgotPassword(slug: string, email: string): Observable<any> {
    return this.http.post(`${this.base(slug)}/forgot-password`, { email });
  }

  resetPassword(slug: string, token: string, password: string): Observable<any> {
    return this.http.post(`${this.base(slug)}/reset-password`, { token, password });
  }

  isPortalLoggedIn(slug: string): boolean {
    return !!sessionStorage.getItem(`portal_token_${slug}`);
  }

  // ── Profile ───────────────────────────────────────────────────────────

  getMe(slug: string): Observable<any> {
    return this.http.get(`${this.base(slug)}/me`, {
      withCredentials: true,
      headers: this.authHeaders(slug)
    });
  }

  updateMe(slug: string, payload: any): Observable<any> {
    return this.http.put(`${this.base(slug)}/me`, payload, {
      withCredentials: true,
      headers: this.authHeaders(slug)
    });
  }

  changePassword(slug: string, currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.base(slug)}/me/change-password`,
      { currentPassword, newPassword },
      { withCredentials: true, headers: this.authHeaders(slug) }
    );
  }

  // ── Orders ────────────────────────────────────────────────────────────

  listOrders(slug: string, page = 1, limit = 20): Observable<any> {
    return this.http.get(`${this.base(slug)}/orders`, {
      params: { page, limit },
      withCredentials: true,
      headers: this.authHeaders(slug)
    });
  }

  getOrder(slug: string, saleId: string): Observable<any> {
    return this.http.get(`${this.base(slug)}/orders/${saleId}`, {
      withCredentials: true,
      headers: this.authHeaders(slug)
    });
  }

  // ── Invoices ──────────────────────────────────────────────────────────

  getInvoice(slug: string, invoiceId: string): Observable<any> {
    return this.http.get(`${this.base(slug)}/invoices/${invoiceId}`, {
      withCredentials: true,
      headers: this.authHeaders(slug)
    });
  }

  getInvoicePdfUrl(slug: string, invoiceId: string): string {
    const token = sessionStorage.getItem(`portal_token_${slug}`) ?? '';
    return `/api/v1/store/${slug}/portal/invoices/${invoiceId}/pdf?token=${encodeURIComponent(token)}`;
  }

  // ── Returns ───────────────────────────────────────────────────────────

  listReturns(slug: string, page = 1): Observable<any> {
    return this.http.get(`${this.base(slug)}/returns`, {
      params: { page },
      withCredentials: true,
      headers: this.authHeaders(slug)
    });
  }

  getReturn(slug: string, returnId: string): Observable<any> {
    return this.http.get(`${this.base(slug)}/returns/${returnId}`, {
      withCredentials: true,
      headers: this.authHeaders(slug)
    });
  }

  submitReturn(slug: string, payload: {
    invoiceId: string;
    items: Array<{ productId: string; name: string; quantity: number; unitPrice: number; refundAmount: number }>;
    reason: string;
    notes?: string;
    evidenceImages?: string[];
  }): Observable<any> {
    return this.http.post(`${this.base(slug)}/returns`, payload, {
      withCredentials: true,
      headers: this.authHeaders(slug)
    });
  }

  // ── Internals ─────────────────────────────────────────────────────────

  private authHeaders(slug: string): Record<string, string> {
    const token = sessionStorage.getItem(`portal_token_${slug}`);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
