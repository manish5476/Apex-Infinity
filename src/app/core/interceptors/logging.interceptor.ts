// src/app/core/interceptors/logging.interceptor.ts
import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export const loggingInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const start = Date.now();
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        const d = Date.now() - start;
        // console.log(`[${event.status}] ${event.url} (${d}ms)`);
      }
    })
  );
};
