import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AppMessageService } from '../../../core/services/message.service';
import { ApiService } from '../../../core/services/api';
import { NotificationService } from '../../../core/services/notification.service';

// --- Interfaces ---
// These interfaces are now updated to match your *exact* backend response
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
  branchId: string; // This is the user's branch
  role: Role; // We can store the full role object
}

export interface LoginResponse {
  token: string;
  data: {
    user?: User; // For Login
    owner?: User; // For CreateOrganization
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


  private notificationService = inject(NotificationService); // <-- inject notification service
  private readonly TOKEN_KEY = 'apex_auth_token';
  private readonly USER_KEY = 'apex_current_user';

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  public isAuthenticated$: Observable<boolean>;

  // --- Injections ---
  private apiService = inject(ApiService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // 1. Get user from storage (if any)
    const user = this.getItem<User>(this.USER_KEY);
    this.currentUserSubject = new BehaviorSubject<User | null>(user);

    // 2. Create observables for the app to use
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));

    // 3. Validate token on app load
    this.validateTokenOnLoad();

    // ✅ Reconnect socket if user already logged in
    if (user?._id) {
      this.notificationService.connect(user._id);
    }
  }

  /**
   * If a token exists on app load, hit the /getMe endpoint to validate it.
   * If valid, populate the user. If invalid, log out.
   */

  private validateTokenOnLoad(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.getToken();
      if (token && !this.currentUserValue) {
        // We have a token but no user. Let's verify it.
        this.apiService.getMe().subscribe({
          next: (user) => {
            // Token is valid. Store user and update state.
            this.setItem(this.USER_KEY, user);
            this.currentUserSubject.next(user);
          },
          error: () => {
            // Token is invalid or expired. Log the user out.
            this.logout();
          }
        });
      }
    }
  }

  // --- Public Getters ---
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public getToken(): string | null {
    return this.getItem<string>(this.TOKEN_KEY);
  }

  public isLoggedIn(): boolean {
    // A user is logged in if we have a user object in our state
    return !!this.currentUserSubject.value;
  }

  // --- Core Auth Methods ---

  /**
   * Central helper to set auth state after a successful login
   * or organization creation.
   */
  public handleLoginSuccess(response: LoginResponse): void {
    const user = response.data.user || response.data.owner;

    if (!response || !response.token || !user) {
      console.error('Invalid login response', response);
      return;
    }

    // 1️⃣ Save token & user
    this.setItem(this.TOKEN_KEY, response.token);
    this.setItem(this.USER_KEY, user);
    this.currentUserSubject.next(user);

    // 2️⃣ Connect Socket.IO (REAL-TIME NOTIFICATIONS)
    this.notificationService.connect(user._id);

    // 3️⃣ Navigate to dashboard
    this.router.navigate(['/']);
  }

  /**
   * Calls the /organization/create endpoint.
   * This is for NEW OWNERS.
   */
  createOrganization(data: any): Observable<LoginResponse | null> {
    return this.apiService.createNewOrganization(data).pipe(
      tap(response => {
        // This endpoint logs the user in
        this.handleLoginSuccess(response); // <-- This saves token & navigates to dashboard
        this.messageService.showSuccess('Organization Created', 'Welcome!');

        // --- BUG FIX ---
        // We remove this line, as it incorrectly redirects back to login
        // this.router.navigate(['/auth/login']); 
      }),
      // Let the component's .subscribe() block handle the error
      catchError(err => throwError(() => err))
    );
  }

  /**
   * Calls the /auth/signup endpoint.
   * This is for NEW EMPLOYEES. It does NOT log them in.
   */
  employeeSignup(data: any): Observable<any | null> {
    return this.apiService.employeeSignup(data).pipe(
      tap(() => {
        this.messageService.showSuccess('Signup Successful', 'Your account is pending admin approval.');
        this.router.navigate(['/auth/login']); // <-- This is correct
      }),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * Calls the /auth/login endpoint.
   * This is for ALL existing, approved users.
   */
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

    // 1️⃣ Disconnect socket
    this.notificationService.disconnect();

    // 2️⃣ Redirect
    this.router.navigate(['/auth/login']);
  }


  // logout(): void {
  //   this.removeItem(this.TOKEN_KEY);
  //   this.removeItem(this.USER_KEY);
  //   this.currentUserSubject.next(null);
  //   this.router.navigate(['/auth/login']);
  // }


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
        // Refresh the token
        this.setItem(this.TOKEN_KEY, response.token);
        this.messageService.showSuccess('Password Updated', 'Your password has been changed.');
      }),
      catchError(err => throwError(() => err))
    );
  }

  // --- LocalStorage Wrappers ---
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

  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

}
