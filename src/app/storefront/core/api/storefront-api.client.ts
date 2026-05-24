import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, retry } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NormalizedStorefrontResponse, StorefrontApiResponse } from '@apx/storefront-contracts';
import { ApiResponseNormalizerService } from './api-response-normalizer.service';

export type StorefrontQueryParams = Readonly<Record<string, string | number | boolean | null | undefined>>;

export interface StorefrontRequestOptions {
  readonly retryCount?: number;
  readonly context?: HttpContext;
}

@Injectable({ providedIn: 'root' })
export class StorefrontApiClient {
  private readonly http = inject(HttpClient);
  private readonly normalizer = inject(ApiResponseNormalizerService);
  private readonly baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/v1/store`;

  get<T>(orgSlug: string, path = '', params?: StorefrontQueryParams, options?: StorefrontRequestOptions): Observable<NormalizedStorefrontResponse<T>> {
    return this.http.get<StorefrontApiResponse<T> | T>(this.url(orgSlug, path), {
      params: this.params(params),
      withCredentials: true,
      context: options?.context
    }).pipe(
      retry({ count: options?.retryCount ?? 1, delay: 250 }),
      map(body => this.normalizer.normalize<T>(body))
    );
  }

  post<T, B extends object>(orgSlug: string, path: string, body: B, options?: StorefrontRequestOptions): Observable<NormalizedStorefrontResponse<T>> {
    return this.http.post<StorefrontApiResponse<T> | T>(this.url(orgSlug, path), body, {
      withCredentials: true,
      context: options?.context
    }).pipe(map(response => this.normalizer.normalize<T>(response)));
  }

  patch<T, B extends object>(orgSlug: string, path: string, body: B, options?: StorefrontRequestOptions): Observable<NormalizedStorefrontResponse<T>> {
    return this.http.patch<StorefrontApiResponse<T> | T>(this.url(orgSlug, path), body, {
      withCredentials: true,
      context: options?.context
    }).pipe(map(response => this.normalizer.normalize<T>(response)));
  }

  delete<T>(orgSlug: string, path: string, options?: StorefrontRequestOptions): Observable<NormalizedStorefrontResponse<T>> {
    return this.http.delete<StorefrontApiResponse<T> | T>(this.url(orgSlug, path), {
      withCredentials: true,
      context: options?.context
    }).pipe(map(response => this.normalizer.normalize<T>(response)));
  }

  private url(orgSlug: string, path: string): string {
    const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : '';
    return `${this.baseUrl}/${encodeURIComponent(orgSlug)}${normalizedPath}`;
  }

  private params(params?: StorefrontQueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      httpParams = httpParams.set(key, String(value));
    });

    return httpParams;
  }
}
