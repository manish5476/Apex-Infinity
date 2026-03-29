import { HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { AppMessageService } from '../services/message.service';

/**
 * Global Success Interceptor
 * Automatically displays success toasts for non-GET API responses that contain a message.
 */
export const successInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(AppMessageService);

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.status >= 200 && event.status < 300) {
        
        // 1. Skip if the request explicitly asks to skip toasts
        if (req.headers.has('X-Skip-Toast')) {
          return;
        }

        // 2. Only show for mutations (POST, PUT, PATCH, DELETE)
        // We generally don't want toasts for GET requests unless they are specific actions
        const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
        
        if (isMutation && (event.body as any)?.message) {
          messageService.showSuccess((event.body as any).message);
        }
      }
    })
  );
};
