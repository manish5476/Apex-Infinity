import { HttpInterceptorFn } from '@angular/common/http';
import { isStorefrontApiUrl } from '@core/services/storefront-request.util';

export const storefrontApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isStorefrontApiUrl(req.url)) return next(req);

  return next(req.clone({
    headers: req.headers
      .delete('Authorization')
      .set('Accept', 'application/json'),
    withCredentials: true
  }));
};
