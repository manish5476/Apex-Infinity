

// import { Injectable } from '@angular/core';
// import { Resolve, Router } from '@angular/router';
// import { AuthService } from './services/auth.service';
// import { Observable } from 'rxjs';
// import { map, take } from 'rxjs/operators';

// @Injectable({ providedIn: 'root' })
// export class AuthResolver implements Resolve<boolean> {
//   constructor(private authService: AuthService, private router: Router) {}

//   resolve(): Observable<boolean> {
//     // Use the isAuthenticated$ observable
//     return this.authService.isAuthenticated$.pipe(
//       take(1),
//       map(isAuthenticated => {
//         if (isAuthenticated) {
//           return true;
//         }
//         this.router.navigate(['/auth/login']);
//         return false;
//       })
//     );
//   }
// }