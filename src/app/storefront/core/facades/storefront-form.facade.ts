// src/app/storefront/core/facades/storefront-form.facade.ts
//
// Facade for storefront contact / lead-capture form submissions.
// Used by ContactFormComponent, NewsletterSignupComponent, etc.

import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of } from 'rxjs';
import {
  StorefrontApiError,
  StorefrontFormSubmitDto,
  StorefrontSubmissionListParams,
  StorefrontSubmissionStatus
} from '@apx/storefront-contracts';
import { StorefrontFormApi } from '../api/storefront-form.api';

@Injectable({ providedIn: 'root' })
export class StorefrontFormFacade {
  private readonly api = inject(StorefrontFormApi);

  // ── Reactive state ──────────────────────────────────────────────────────────

  readonly submitting   = signal(false);
  readonly submitted    = signal(false);
  readonly loading      = signal(false);
  readonly submissions  = signal<readonly any[]>([]);
  readonly error        = signal<StorefrontApiError | null>(null);

  // ── PUBLIC ──────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/store/:uniqueShopId/forms/submit
   *
   * Submit a form from the public storefront (contact, newsletter, lead-capture).
   * Resets state on each call so a component can re-use the facade across interactions.
   */
  submit(shopId: string, dto: StorefrontFormSubmitDto): Observable<boolean> {
    this.submitting.set(true);
    this.submitted.set(false);
    this.error.set(null);

    return this.api.submit(shopId, dto).pipe(
      map(() => {
        this.submitted.set(true);
        return true;
      }),
      catchError(err => {
        this.error.set(err as StorefrontApiError);
        return of(false);
      }),
      finalize(() => this.submitting.set(false))
    );
  }

  // ── ADMIN (CRM) ─────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/storefront-forms/submissions
   * Requires CRM admin JWT. Populates the submissions signal.
   */
  loadSubmissions(params?: StorefrontSubmissionListParams): Observable<readonly any[]> {
    this.loading.set(true);
    return this.api.getSubmissions(params).pipe(
      map((res: any) => {
        const list = res?.data ?? res?.submissions ?? [];
        this.submissions.set(list);
        return list;
      }),
      catchError(err => {
        this.error.set(err as StorefrontApiError);
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  /**
   * PATCH /api/v1/storefront-forms/submissions/:id
   */
  updateStatus(submissionId: string, status: StorefrontSubmissionStatus): Observable<boolean> {
    return this.api.updateSubmissionStatus(submissionId, status).pipe(
      map(() => true),
      catchError(err => {
        this.error.set(err as StorefrontApiError);
        return of(false);
      })
    );
  }

  /**
   * DELETE /api/v1/storefront-forms/submissions/:id
   */
  deleteSubmission(submissionId: string): Observable<boolean> {
    return this.api.deleteSubmission(submissionId).pipe(
      map(() => {
        this.submissions.update(list => list.filter((s: any) => (s._id ?? s.id) !== submissionId));
        return true;
      }),
      catchError(err => {
        this.error.set(err as StorefrontApiError);
        return of(false);
      })
    );
  }

  /** Reset UI state between form reuses. */
  reset(): void {
    this.submitting.set(false);
    this.submitted.set(false);
    this.error.set(null);
  }
}
