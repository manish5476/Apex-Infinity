// src/app/storefront/core/api/storefront-form.api.ts
//
// Covers the backend routes defined in storefrontForm.routes.js:
//
//   PUBLIC (no auth)
//     POST /api/v1/store/:uniqueShopId/forms/submit
//
//   PROTECTED (JWT required – CRM admin)
//     GET    /api/v1/storefront-forms/submissions
//     PATCH  /api/v1/storefront-forms/submissions/:id
//     DELETE /api/v1/storefront-forms/submissions/:id
//
// The public submit endpoint is mounted under the same /store prefix so it
// goes through StorefrontApiClient (which builds …/v1/store/:slug/…).
// The admin submission endpoints are NOT under /store — they are mounted at
// /api/v1/storefront-forms/… so we use BaseApiService (HttpClient directly).

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  NormalizedStorefrontResponse,
  StorefrontFormSubmission,
  StorefrontFormSubmitDto,
  StorefrontSubmissionListParams,
  StorefrontSubmissionStatus
} from '@apx/storefront-contracts';
import { StorefrontApiClient } from './storefront-api.client';
import { environment } from '../../../../environments/environment';

// ──────────────────────────────────────────────────────────────────────────────
// Public form-submit API
// ──────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class StorefrontFormApi {
  private readonly api = inject(StorefrontApiClient);
  private readonly http = inject(HttpClient);
  private readonly adminBase = `${environment.apiUrl.replace(/\/$/, '')}/v1/storefront-forms`;

  // ── PUBLIC ──────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/store/:uniqueShopId/forms/submit
   *
   * Submit a contact / lead-capture / newsletter form from the public storefront.
   * No authentication required — rate-limited by the backend.
   */
  submit(shopId: string, dto: StorefrontFormSubmitDto): Observable<NormalizedStorefrontResponse<{ readonly submitted: boolean }>> {
    return this.api.post<{ readonly submitted: boolean }, StorefrontFormSubmitDto>(
      shopId,
      'forms/submit',
      dto
    );
  }

  // ── PROTECTED (CRM admin) ────────────────────────────────────────────────────

  /**
   * GET /api/v1/storefront-forms/submissions
   *
   * Paginated list of form submissions. Requires CRM JWT.
   */
  getSubmissions(params?: StorefrontSubmissionListParams): Observable<any> {
    let httpParams = new HttpParams();
    if (!params) return this.http.get<any>(`${this.adminBase}/submissions`, { withCredentials: true });

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return this.http.get<any>(`${this.adminBase}/submissions`, {
      params: httpParams,
      withCredentials: true
    });
  }

  /**
   * PATCH /api/v1/storefront-forms/submissions/:id
   *
   * Update the status of a form submission (e.g. mark as 'read', 'replied').
   */
  updateSubmissionStatus(
    submissionId: string,
    status: StorefrontSubmissionStatus
  ): Observable<any> {
    return this.http.patch<any>(
      `${this.adminBase}/submissions/${submissionId}`,
      { status },
      { withCredentials: true }
    );
  }

  /**
   * DELETE /api/v1/storefront-forms/submissions/:id
   *
   * Permanently delete a form submission.
   */
  deleteSubmission(submissionId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.adminBase}/submissions/${submissionId}`,
      { withCredentials: true }
    );
  }
}
