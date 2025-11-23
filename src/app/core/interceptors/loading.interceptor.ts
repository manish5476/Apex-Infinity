// src/app/core/interceptors/loading.interceptor.ts
import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

export const LoadingInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const loadingService = inject(LoadingService);
  loadingService.show();
  return next(req).pipe(finalize(() => loadingService.hide()));
};


// import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { finalize } from 'rxjs/operators';
// import { LoadingService } from '../services/loading.service';

// export const LoadingInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
//   const loadingService = inject(LoadingService);
//   loadingService.show();
  
//   return next(req).pipe(
//     finalize(() => {
//       loadingService.hide();
//     })
//   );
// };
