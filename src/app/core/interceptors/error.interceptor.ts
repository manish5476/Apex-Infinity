import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../modules/auth/services/auth-service'; // ✅ Import AuthService

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);
  const authService = inject(AuthService); // ✅ Inject AuthService

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // 1. Handle 403 Forbidden (Permission Error)
      if (error.status === 403 || (error.status === 400 && error.error?.message?.includes('permission'))) {
        const errorMsg = error.error?.message || 'You do not have permission to perform this action.';
        messageService.add({
          severity: 'error',
          summary: 'Permission Denied',
          detail: errorMsg,
          life: 5000
        });
      } 
      
      // 2. Handle 401 Unauthorized (Session Expired)
      // ⚠️ IMPORTANT: Ignore 401s coming from auth endpoints to prevent recursion loops
      else if (error.status === 401 && 
               !req.url.includes('/auth/login') && 
               !req.url.includes('/auth/logout') && 
               !req.url.includes('/auth/logout-all')) {
        
        // Show Toast
        messageService.add({
          severity: 'warn',
          summary: 'Session Expired',
          detail: 'Logging you out...'
        });

        // ✅ TRIGGER AUTOMATIC LOGOUT
        // This clears cookies, local storage, and redirects to login
        authService.logout();
      }

      // Re-throw error so the UI knows the request failed
      return throwError(() => error);
    })
  );
};

// import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { catchError, throwError } from 'rxjs';
// import { MessageService } from 'primeng/api';

// export const errorInterceptor: HttpInterceptorFn = (req, next) => {
//   const messageService = inject(MessageService);

//   return next(req).pipe(
//     catchError((error: HttpErrorResponse) => {
      
//       // Check if the error is a 403 Forbidden (Permission Error)
//       // OR if the backend specifically sent status: "error"
//       if (error.status === 403 || (error.status === 400 && error.error?.message?.includes('permission'))) {
        
//         const errorMsg = error.error?.message || 'You do not have permission to perform this action.';
        
//         // ✅ Show the Toast Globally
//         messageService.add({
//           severity: 'error',
//           summary: 'Permission Denied',
//           detail: errorMsg,
//           life: 5000 // Show for 5 seconds
//         });

//       } 
      
//       // Optional: Handle 401 Unauthorized (Session Expired)
//       else if (error.status === 401) {
//         messageService.add({
//           severity: 'warn',
//           summary: 'Session Expired',
//           detail: 'Please log in again.'
//         });
//         // You could also redirect to login here via inject(Router)
//       }

//       // Re-throw the error so the component knows it failed (e.g., to stop a loading spinner)
//       return throwError(() => error);
//     })
//   );
// };
