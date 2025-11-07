import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export const loggingInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const startTime = Date.now();
  // console.log(`[${req.method}] Request to ${req.urlWithParams}`);

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        // console.log(
        //   `[${event.status}] Response from ${event.url} in ${duration}ms`
        // );
      }
    })
  );
};
