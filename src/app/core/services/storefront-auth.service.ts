// src/app/core/services/storefront-auth.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, tap, switchMap, throwError, map } from 'rxjs';
import {
  StorefrontCustomerService,
  StorefrontLoginDto,
  StorefrontRegisterDto
} from './storefront-customer.service';
import { StorefrontAuthStore } from './storefront-auth.store';
import { StorefrontCartService } from './storefront.cart.service';

@Injectable({ providedIn: 'root' })
export class StorefrontAuthService {
  private readonly customerApi = inject(StorefrontCustomerService);
  private readonly authStore = inject(StorefrontAuthStore);
  private readonly cartService = inject(StorefrontCartService);

  readonly customer = this.authStore.customer;
  readonly dashboard = this.authStore.dashboard;
  readonly isAuthenticated = this.authStore.isAuthenticated;

  /**
   * Hydrates the user session and cart. 
   */
  hydrate(orgSlug: string): Observable<boolean> {
    this.authStore.loading.set(true);
    
    return this.customerApi.me(orgSlug).pipe(
      tap((res: any) => {
        const data = res?.data ?? res;
        this.authStore.setDashboard({ customer: data?.customer ?? data });
        this.cartService.getCart(orgSlug).subscribe();
        this.authStore.loading.set(false);
      }),
      map(() => true),
      catchError(() => {
        this.authStore.clear();
        this.authStore.loading.set(false);
        return of(false);
      })
    );
  }

  /**
   * Log in user and guarantee session/cart state sync
   */
  login(orgSlug: string, payload: StorefrontLoginDto): Observable<any> {
    this.authStore.loading.set(true);
    return this.customerApi.login(orgSlug, payload).pipe(
      switchMap(() => this.customerApi.me(orgSlug)),
      tap((meRes: any) => {
        const data = meRes?.data ?? meRes;
        this.authStore.setDashboard({ customer: data?.customer ?? data });
        this.cartService.getCart(orgSlug).subscribe();
      }),
      tap(() => this.authStore.loading.set(false)),
      catchError(err => {
        this.authStore.loading.set(false);
        this.authStore.error.set(err?.error?.message ?? 'Login failed.');
        return throwError(() => err);
      })
    );
  }

  /**
   * Register user and perform immediate auto-login/hydrate
   */
  register(orgSlug: string, payload: StorefrontRegisterDto): Observable<any> {
    this.authStore.loading.set(true);
    return this.customerApi.register(orgSlug, payload).pipe(
      switchMap(() => this.customerApi.me(orgSlug)),
      tap((meRes: any) => {
        const data = meRes?.data ?? meRes;
        this.authStore.setDashboard({ customer: data?.customer ?? data });
        this.cartService.getCart(orgSlug).subscribe();
      }),
      tap(() => this.authStore.loading.set(false)),
      catchError(err => {
        this.authStore.loading.set(false);
        this.authStore.error.set(err?.error?.message ?? 'Registration failed.');
        return throwError(() => err);
      })
    );
  }

  logout(orgSlug: string): Observable<any> {
    return this.customerApi.logout(orgSlug).pipe(
      tap(() => {
        this.authStore.clear();
        this.cartService.resetCart();
      })
    );
  }
}// // src/app/storefront/core/services/storefront-auth.service.ts
// import { Injectable, inject } from '@angular/core';
// import { Observable, catchError, of, tap, switchMap, throwError } from 'rxjs';
// import { StorefrontCustomerService, StorefrontLoginDto, StorefrontRegisterDto } from './storefront-customer.service';
// import { StorefrontAuthStore } from './storefront-auth.store';
// import { StorefrontCartService } from './storefront.cart.service';

// @Injectable({ providedIn: 'root' })
// export class StorefrontAuthService {
//   private readonly customerApi = inject(StorefrontCustomerService);
//   private readonly authStore = inject(StorefrontAuthStore);
//   private readonly cartService = inject(StorefrontCartService);

//   hydrate(orgSlug: string): Observable<boolean> {
//     this.authStore.loading.set(true);
//     return this.customerApi.me(orgSlug).pipe(
//       tap((res: any) => {
//         const data = res?.data ?? res;
//         this.authStore.setDashboard({ customer: data?.customer ?? data });
//         this.authStore.loading.set(false);
//       }),
//       map(() => true),
//       catchError(() => {
//         this.authStore.clear();
//         this.authStore.loading.set(false);
//         return of(false);
//       })
//     );
//   }

//   login(orgSlug: string, payload: StorefrontLoginDto): Observable<any> {
//     this.authStore.loading.set(true);
//     // CHAIN: Login -> Fetch Me -> Sync Cart
//     return this.customerApi.login(orgSlug, payload).pipe(
//       switchMap(() => this.customerApi.me(orgSlug)),
//       tap((meRes: any) => {
//         const data = meRes?.data ?? meRes;
//         this.authStore.setDashboard({ customer: data?.customer ?? data });
//         this.cartService.getCart(orgSlug).subscribe();
//       }),
//       tap(() => this.authStore.loading.set(false)),
//       catchError(err => {
//         this.authStore.loading.set(false);
//         this.authStore.error.set(err?.error?.message ?? 'Login failed.');
//         return throwError(() => err);
//       })
//     );
//   }

//   register(orgSlug: string, payload: StorefrontRegisterDto): Observable<any> {
//     this.authStore.loading.set(true);
//     return this.customerApi.register(orgSlug, payload).pipe(
//       switchMap(() => this.customerApi.me(orgSlug)),
//       tap((meRes: any) => {
//         const data = meRes?.data ?? meRes;
//         this.authStore.setDashboard({ customer: data?.customer ?? data });
//         this.cartService.getCart(orgSlug).subscribe();
//       }),
//       tap(() => this.authStore.loading.set(false)),
//       catchError(err => {
//         this.authStore.loading.set(false);
//         this.authStore.error.set(err?.error?.message ?? 'Registration failed.');
//         return throwError(() => err);
//       })
//     );
//   }

//   logout(orgSlug: string): Observable<any> {
//     return this.customerApi.logout(orgSlug).pipe(
//       tap(() => {
//         this.authStore.clear();
//         this.cartService.resetCart();
//       })
//     );
//   }
// }// import { Injectable, inject } from '@angular/core';
// // import { Observable, catchError, of, tap, switchMap, throwError } from 'rxjs';
// // import {
// //   StorefrontCustomerService,
// //   StorefrontLoginDto,
// //   StorefrontRegisterDto
// // } from './storefront-customer.service';
// // import { StorefrontAuthStore } from './storefront-auth.store';
// // import { StorefrontCartService } from './storefront.cart.service';

// // @Injectable({ providedIn: 'root' })
// // export class StorefrontAuthService {
// //   private readonly customerApi = inject(StorefrontCustomerService);
// //   private readonly authStore = inject(StorefrontAuthStore);
// //   private readonly cartService = inject(StorefrontCartService);

// //   readonly customer = this.authStore.customer;
// //   readonly dashboard = this.authStore.dashboard;
// //   readonly isAuthenticated = this.authStore.isAuthenticated;

// //   /**
// //    * Hydrates the user session and cart. 
// //    * Use this in an APP_INITIALIZER or AuthGuard.
// //    */
// //   hydrate(orgSlug: string): Observable<boolean> {
// //     this.authStore.loading.set(true);
    
// //     return this.customerApi.me(orgSlug).pipe(
// //       tap((res: any) => {
// //         const data = res?.data ?? res;
// //         this.authStore.setDashboard({ customer: data?.customer ?? data });
// //         // Hydrate cart only after successful user sync
// //         this.cartService.getCart(orgSlug).subscribe();
// //         this.authStore.loading.set(false);
// //       }),
// //       map(() => true),
// //       catchError(() => {
// //         this.authStore.clear();
// //         this.authStore.loading.set(false);
// //         return of(false);
// //       })
// //     );
// //   }

// //   /**
// //    * Log in user and guarantee session/cart state sync
// //    */
// //   login(orgSlug: string, payload: StorefrontLoginDto): Observable<any> {
// //     this.authStore.loading.set(true);
// //     return this.customerApi.login(orgSlug, payload).pipe(
// //       // Ensure we fetch 'me' immediately to populate all dashboard/cart state
// //       switchMap((loginRes: any) => {
// //         return this.customerApi.me(orgSlug).pipe(
// //           tap((meRes: any) => {
// //             const data = meRes?.data ?? meRes;
// //             this.authStore.setDashboard({ customer: data?.customer ?? data });
// //             // Sync cart with the new user session
// //             this.cartService.getCart(orgSlug).subscribe();
// //           })
// //         );
// //       }),
// //       tap(() => this.authStore.loading.set(false)),
// //       catchError(err => {
// //         this.authStore.loading.set(false);
// //         this.authStore.error.set(err?.error?.message ?? 'Storefront login failed.');
// //         return throwError(() => err);
// //       })
// //     );
// //   }

// //   /**
// //    * Register user and perform immediate auto-login/hydrate
// //    */
// //   register(orgSlug: string, payload: StorefrontRegisterDto): Observable<any> {
// //     this.authStore.loading.set(true);
// //     return this.customerApi.register(orgSlug, payload).pipe(
// //       switchMap(() => this.customerApi.me(orgSlug)),
// //       tap((res: any) => {
// //         const data = res?.data ?? res;
// //         this.authStore.setDashboard({ customer: data?.customer ?? data });
// //         this.cartService.getCart(orgSlug).subscribe();
// //       }),
// //       tap(() => this.authStore.loading.set(false)),
// //       catchError(err => {
// //         this.authStore.loading.set(false);
// //         this.authStore.error.set(err?.error?.message ?? 'Storefront registration failed.');
// //         return throwError(() => err);
// //       })
// //     );
// //   }

// //   logout(orgSlug: string): Observable<any> {
// //     return this.customerApi.logout(orgSlug).pipe(
// //       tap(() => {
// //         this.authStore.clear();
// //         this.cartService.resetCart();
// //       })
// //     );
// //   }
// // }// import { Injectable, inject } from '@angular/core';
// // // import { Observable, catchError, map, of, tap } from 'rxjs';
// // // import {
// // //   StorefrontCustomerService,
// // //   StorefrontLoginDto,
// // //   StorefrontRegisterDto
// // // } from './storefront-customer.service';
// // // import { StorefrontAuthStore } from './storefront-auth.store';
// // // import { StorefrontCartService } from './storefront.cart.service';

// // // @Injectable({ providedIn: 'root' })
// // // export class StorefrontAuthService {
// // //   private readonly customerApi = inject(StorefrontCustomerService);
// // //   private readonly authStore = inject(StorefrontAuthStore);
// // //   private readonly cartService = inject(StorefrontCartService);

// // //   readonly customer = this.authStore.customer;
// // //   readonly dashboard = this.authStore.dashboard;
// // //   readonly isAuthenticated = this.authStore.isAuthenticated;

// // //   hydrate(orgSlug: string): Observable<boolean> {
// // //     this.authStore.loading.set(true);
// // //     return this.customerApi.me(orgSlug).pipe(
// // //       map(() => true),
// // //       catchError(() => {
// // //         this.authStore.clear();
// // //         return of(false);
// // //       }),
// // //       tap(() => this.authStore.loading.set(false))
// // //     );
// // //   }

// // //   login(orgSlug: string, payload: StorefrontLoginDto): Observable<any> {
// // //     this.authStore.loading.set(true);
// // //     return this.customerApi.login(orgSlug, payload).pipe(
// // //       tap((res: any) => {
// // //         const data = res?.data ?? res;
// // //         this.authStore.setDashboard({ customer: data?.customer ?? data });
// // //         if (data?.cart) this.cartService.setCart(data.cart);
// // //       }),
// // //       tap(() => this.authStore.loading.set(false)),
// // //       catchError(err => {
// // //         this.authStore.loading.set(false);
// // //         this.authStore.error.set(err?.error?.message ?? 'Storefront login failed.');
// // //         throw err;
// // //       })
// // //     );
// // //   }

// // //   register(orgSlug: string, payload: StorefrontRegisterDto): Observable<any> {
// // //     this.authStore.loading.set(true);
// // //     return this.customerApi.register(orgSlug, payload).pipe(
// // //       tap((res: any) => this.authStore.setDashboard({ customer: res?.data ?? res })),
// // //       tap(() => this.authStore.loading.set(false)),
// // //       catchError(err => {
// // //         this.authStore.loading.set(false);
// // //         this.authStore.error.set(err?.error?.message ?? 'Storefront registration failed.');
// // //         throw err;
// // //       })
// // //     );
// // //   }

// // //   logout(orgSlug: string): Observable<any> {
// // //     return this.customerApi.logout(orgSlug).pipe(
// // //       tap(() => {
// // //         this.authStore.clear();
// // //         this.cartService.resetCart();
// // //       })
// // //     );
// // //   }
// // // }
