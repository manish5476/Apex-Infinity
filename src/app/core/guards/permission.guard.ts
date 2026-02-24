// src/app/core/guards/permission.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppMessageService } from '../services/message.service';
import { AuthService } from '../../modules/auth/services/auth-service';

export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const messageService = inject(AppMessageService);

    // 1. Check if logged in first
    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/auth/login']);
    }

    // 2. Check specific permission
    if (auth.hasPermission(requiredPermission)) {
      return true;
    }

    // 3. Handle Unauthorized
    messageService.showError('Access Denied', 'You do not have permission to view this page.');
    return router.createUrlTree(['/dashboard']); 
  };
};
