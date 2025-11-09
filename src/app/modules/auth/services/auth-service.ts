import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AppMessageService } from '../../../core/services/message.service';
import { ApiService } from '../../../core/services/api';
import { NotificationService } from '../../../core/services/notification.service';

// --- Interfaces ---
export interface Role {
  _id: string;
  name: string;
  permissions: string[];
  isSuperAdmin: boolean;
}

export interface Branch {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isMainBranch: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  organizationId: string;
  branchId: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  data: {
    user?: User;
    owner?: User;
    organization?: any;
    branch?: Branch;
    role?: Role;
  };
}

// --- End Interfaces ---
@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private notificationService = inject(NotificationService);
  private readonly TOKEN_KEY = 'apex_auth_token';
  private readonly USER_KEY = 'apex_current_user';

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  public isAuthenticated$: Observable<boolean>;

  private apiService = inject(ApiService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // 1. ✅ FIX: ALWAYS initialize the user as `null`.
    // This is the most important change. It forces the auth guard
    // to wait for the `validateTokenOnLoad` to complete instead of
    // trusting a stale user from local storage.
    this.currentUserSubject = new BehaviorSubject<User | null>(null);

    // 2. Create observables for the app to use
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));

    // 3. Validate token on app load
    // This will now run, fetch the user, and *then* update the
    // currentUserSubject, which will "unblock" the auth guard.
    // this.validateTokenOnLoad();
  }

 validateTokenOnLoad(): void {
  if (isPlatformBrowser(this.platformId)) {
    const token = this.getToken();

    // if (token) {
    //   this.apiService.getMe().subscribe({
    //     next: (user) => {
    //       // Token valid — populate user and connect notifications
    //       this.setItem(this.USER_KEY, user);
    //       this.currentUserSubject.next(user);
    //       if (user?._id) {
    //         this.notificationService.connect(user._id);
    //       }
    //     },
    //     error: (err: any) => {
    //       const status = err?.status ?? null;s
    //       if (status === 401 || status === 403) {
    //         // definite auth failure: logout and remove token
    //         this.logout();
    //         return;
    //       }
    //       if (status === 0 || status === null) {
    //         this.messageService.showError('Server unreachable. Retaining session token and will retry validation.', '');
    //         this.retryValidateToken();
    //         return;
    //       }

    //       // For other errors, log and keep token — don't remove token automatically.
    //       console.error('Unexpected error while validating token on load:', err);
    //       this.messageService.showError('Unable to validate session on load. Retaining token.');
    //     }
    //   });
    // }
  }
}

/** Example simple retry (low frequency). Adapt as needed. */
private retryValidateToken(retries = 0): void {
  const MAX_RETRIES = 3;
  const BACKOFF_MS = Math.min(60000, 2000 * Math.pow(2, retries)); // 2s, 4s, 8s...
  if (retries >= MAX_RETRIES) {
    this.messageService.showError('Could not validate session after retries.');
    return;
  }
  setTimeout(() => {
    const token = this.getToken();
    if (!token) return;
    this.apiService.getMe().subscribe({
      next: (user) => {
        this.setItem(this.USER_KEY, user);
        this.currentUserSubject.next(user);
        if (user?._id) this.notificationService.connect(user._id);
      },
      error: (err) => {
        const status = err?.status ?? null;
        if (status === 401 || status === 403) {
          this.logout();
          return;
        }
        // retry again
        this.retryValidateToken(retries + 1);
      }
    });
  }, BACKOFF_MS);
}


  // --- Public Getters ---
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public getToken(): string | null {
    return this.getItem<string>(this.TOKEN_KEY);
  }

  public isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  // --- Core Auth Methods ---

  public handleLoginSuccess(response: LoginResponse): void {
    const user = response.data.user || response.data.owner;

    if (!response || !response.token || !user) {
      console.error('Invalid login response', response);
      return;
    }

    this.setItem(this.TOKEN_KEY, response.token);
    this.setItem(this.USER_KEY, user);
    this.currentUserSubject.next(user);

    this.notificationService.connect(user._id);
    this.router.navigate(['/']);
  }

  createOrganization(data: any): Observable<LoginResponse | null> {
    return this.apiService.createNewOrganization(data).pipe(
      tap(response => {
        this.handleLoginSuccess(response);
        this.messageService.showSuccess('Organization Created', 'Welcome!');
      }),
      catchError(err => throwError(() => err))
    );
  }

  employeeSignup(data: any): Observable<any | null> {
    return this.apiService.employeeSignup(data).pipe(
      tap(() => {
        this.messageService.showSuccess('Signup Successful', 'Your account is pending admin approval.');
        this.router.navigate(['/auth/login']);
      }),
      catchError(err => throwError(() => err))
    );
  }

  login(data: any): Observable<LoginResponse | null> {
    return this.apiService.login(data).pipe(
      tap((response: any) => { this.handleLoginSuccess(response) }),
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    this.removeItem(this.TOKEN_KEY);
    this.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.notificationService.disconnect();
    this.router.navigate(['/auth/login']);
  }

  // --- Password Management ---
  forgotPassword(email: string): Observable<any> {
    return this.apiService.forgotPassword({ email }).pipe(
      tap(() => {
        this.messageService.showSuccess('Check Your Email', 'Password reset instructions sent.');
      }),
      catchError(err => throwError(() => err))
    );
  }

  resetPassword(resetToken: string, passwords: any): Observable<LoginResponse | null> {
    return this.apiService.resetPassword(resetToken, passwords).pipe(
      tap(response => {
        this.handleLoginSuccess(response);
        this.messageService.showSuccess('Password Reset', 'You are now logged in.');
      }),
      catchError(err => throwError(() => err))
    );
  }

  updateUserPassword(data: any): Observable<LoginResponse | null> {
    return this.apiService.updateMyPassword(data).pipe(
      tap(response => {
        this.setItem(this.TOKEN_KEY, response.token);
        this.messageService.showSuccess('Password Updated', 'Your password has been changed.');
      }),
      catchError(err => throwError(() => err))
    );
  }

  // // --- LocalStorage Wrappers ---
  // private setItem(key: string, value: any): void {
  //   if (isPlatformBrowser(this.platformId)) {
  //     localStorage.setItem(key, JSON.stringify(value));
  //   }
  // }

  // getItem<T>(key: string): T | null {
  //   if (isPlatformBrowser(this.platformId)) {
  //     try {
  //       const item = localStorage.getItem(key);
  //       return item ? JSON.parse(item) : null;
  //     } catch (e) {
  //       console.error(`Error parsing item from localStorage key: ${key}`, e);
  //       this.removeItem(key);
  //       return null;
  //     }
  //   }
  //   return null;
  // }

  // private removeItem(key: string): void {
  //   if (isPlatformBrowser(this.platformId)) {
  //     localStorage.removeItem(key);
  //   }
  // }

  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }















  private setItem(key: string, value: any): void {
  if (isPlatformBrowser(this.platformId)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

getItem<T>(key: string): T | null {
  if (isPlatformBrowser(this.platformId)) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error(`Error parsing item from localStorage key: ${key}`, e);
      this.removeItem(key);
      return null;
    }
  }
  return null;
}

private removeItem(key: string): void {
  if (isPlatformBrowser(this.platformId)) {
    localStorage.removeItem(key);
  }
}

}
