import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { isStorefrontApiUrl } from '@core/services/storefront-request.util';
import { ApiResponseNormalizerService } from './api-response-normalizer.service';

export const storefrontErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const normalizer = inject(ApiResponseNormalizerService);
  const messages = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!isStorefrontApiUrl(req.url)) return throwError(() => error);

      const normalized = normalizer.normalizeError(error.status, error.error);
      if (error.status !== 401 || !req.url.includes('/account/me')) {
        messages.add({
          severity: error.status >= 500 ? 'error' : 'warn',
          summary: 'Storefront',
          detail: normalized.message,
          life: 4500
        });
      }

      return throwError(() => normalized);
    })
  );
};
