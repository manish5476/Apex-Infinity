import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PlatformDeliveryService } from '../services/platform-delivery.service';

export const platformDeliveryGuard: CanActivateFn = () => {
  const service = inject(PlatformDeliveryService);
  const router = inject(Router);

  if (service.getToken()) return true;

  return router.createUrlTree(['/apex-delivery/login']);
};
