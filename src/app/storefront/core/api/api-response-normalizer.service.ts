import { Injectable } from '@angular/core';
import {
  NormalizedStorefrontResponse,
  StorefrontApiError,
  StorefrontApiResponse,
  StorefrontMetadata,
  StorefrontPagination,
  StorefrontValidationIssue
} from '@apx/storefront-contracts';

@Injectable({ providedIn: 'root' })
export class ApiResponseNormalizerService {
  normalize<T>(body: StorefrontApiResponse<T> | T): NormalizedStorefrontResponse<T> {
    const objectBody = this.asRecord(body);

    if (objectBody && this.hasResponseMetadata(objectBody)) {
      const hasData = Object.prototype.hasOwnProperty.call(objectBody, 'data');

      return {
        data: (hasData ? objectBody['data'] : body) as T,
        message: this.stringValue(objectBody['message']),
        pagination: this.paginationValue(objectBody['pagination']),
        metadata: this.metadataValue(objectBody['metadata']),
        status: this.stringValue(objectBody['status'])
      };
    }

    return {
      data: body as T,
      message: null,
      pagination: null,
      metadata: null,
      status: null
    };
  }

  normalizeError(status: number, body: unknown): StorefrontApiError {
    const objectBody = this.asRecord(body);
    const message = this.stringValue(objectBody?.['message']) ?? this.stringValue(objectBody?.['error']) ?? 'Something went wrong. Please try again.';
    const code = this.stringValue(objectBody?.['code']) ?? `HTTP_${status}`;
    const issues = this.issueList(objectBody?.['issues'] ?? objectBody?.['data']);

    return { status, message, code, issues };
  }

  private hasResponseMetadata(body: Record<string, unknown>): boolean {
    return 'data' in body || 'status' in body || 'pagination' in body || 'metadata' in body || 'message' in body;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? value as Record<string, unknown> : null;
  }

  private stringValue(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private paginationValue(value: unknown): StorefrontPagination | null {
    const pagination = this.asRecord(value);
    if (!pagination) return null;

    const page = this.numberValue(pagination['page']);
    const limit = this.numberValue(pagination['limit']);
    const total = this.numberValue(pagination['total']);
    const pages = this.numberValue(pagination['pages']);

    return page !== null && limit !== null && total !== null && pages !== null
      ? { page, limit, total, pages }
      : null;
  }

  private metadataValue(value: unknown): StorefrontMetadata | null {
    return this.asRecord(value) as StorefrontMetadata | null;
  }

  private numberValue(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private issueList(value: unknown): readonly StorefrontValidationIssue[] {
    const maybeIssues = this.asRecord(value)?.['issues'] ?? value;
    return Array.isArray(maybeIssues) ? maybeIssues.filter(item => item && typeof item === 'object') as readonly StorefrontValidationIssue[] : [];
  }
}
