// src/app/modules/auth/services/auth-service.ts
import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AppMessageService } from '../../../core/services/message.service';
import { ApiService } from '../../../core/services/api';
import { NotificationService } from '../../../core/services/notification.service';

export interface Role { _id: string; name: string; permissions: string[]; isSuperAdmin: boolean; }
export interface Branch { _id: string; name: string; address: any; isMainBranch: boolean; }
export interface User { _id: string; name: string; email: string; organizationId: string; branchId: string; role: Role; }

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

@Injectable({ providedIn: 'root' })
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
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser$ = this.currentUserSubject.asObservable();

    // Correct Observable<boolean> stream
    this.isAuthenticated$ = this.currentUser$.pipe(
      map((user: any) => !!user)
    );
  }

  refreshToken() {
  return this.apiService.refreshToken().pipe(
    tap((response: any) => {
      if (response?.token) {
        this.setItem(this.TOKEN_KEY, response.token);
      }
    }),
    catchError(err => throwError(() => err))
  );
}


verifyToken() {
  return this.apiService.verifyToken().pipe(
    tap((response: any) => {
      // token valid: do nothing
    }),
    catchError(err => {
      // token invalid -> logout
      this.logout();
      return throwError(() => err);
    })
  );
}

initializeFromStorage(): Promise<void> {
  return new Promise(resolve => {
    const token = this.getToken();
    const user = this.getItem<User>(this.USER_KEY);

    if (token && user) {
      this.currentUserSubject.next(user);
      if (user?._id) this.notificationService.connect(user._id);
      // verify token with backend
      this.verifyToken().subscribe({
        next: () => resolve(),
        error: () => resolve() // even on fail → resolve bootstrap
      });

    } else {
      resolve();
    }
  });
}

  // --- getters ---
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public getToken(): string | null {
    return this.getItem<string>(this.TOKEN_KEY);
  }

  public isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  // --- auth flows ---
  public handleLoginSuccess(response: LoginResponse): void {
    const user = response.data.user || response.data.owner;

    if (!response || !response.token || !user) {
      console.error('Invalid login response', response);
      return;
    }

    this.setItem(this.TOKEN_KEY, response.token);
    this.setItem(this.USER_KEY, user);
    this.currentUserSubject.next(user);

    if (user?._id) this.notificationService.connect(user._id);
    this.router.navigate(['/']);
  }

  createOrganization(data: any) {
    return this.apiService.createNewOrganization(data).pipe(
      tap(response => {
        this.handleLoginSuccess(response);
        this.messageService.showSuccess('Organization Created', 'Welcome!');
      }),
      catchError(err => throwError(() => err))
    );
  }

  employeeSignup(data: any) {
    return this.apiService.employeeSignup(data).pipe(
      tap(() => {
        this.messageService.showSuccess('Signup Successful', 'Your account is pending admin approval.');
        this.router.navigate(['/auth/login']);
      }),
      catchError(err => throwError(() => err))
    );
  }

  login(data: any) {
    return this.apiService.login(data).pipe(
      tap((response: any) => { this.handleLoginSuccess(response); }),
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    this.removeItem(this.TOKEN_KEY);
    this.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    try { this.notificationService.disconnect(); } catch { /* ignore */ }
    this.router.navigate(['/auth/login']);
  }

  forgotPassword(email: string) {
    return this.apiService.forgotPassword({ email }).pipe(
      tap(() => this.messageService.showSuccess('Check Your Email', 'Password reset instructions sent.')),
      catchError(err => throwError(() => err))
    );
  }

  resetPassword(resetToken: string, passwords: any) {
    return this.apiService.resetPassword(resetToken, passwords).pipe(
      tap(response => {
        this.handleLoginSuccess(response);
        this.messageService.showSuccess('Password Reset', 'You are now logged in.');
      }),
      catchError(err => throwError(() => err))
    );
  }

  updateUserPassword(data: any) {
    return this.apiService.updateMyPassword(data).pipe(
      tap((response: any) => {
        if (response?.token) this.setItem(this.TOKEN_KEY, response.token);
        this.messageService.showSuccess('Password Updated', 'Your password has been changed.');
      }),
      catchError(err => throwError(() => err))
    );
  }

  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // --- storage wrappers ---
  private setItem(key: string, value: any): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (key === this.TOKEN_KEY) {
      localStorage.setItem(key, value);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  }


  getItem<T>(key: string): T | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const item = localStorage.getItem(key);
    if (!item) return null;

    if (key === this.TOKEN_KEY) {
      // token is stored raw
      return item as any;
    }

    try {
      return JSON.parse(item);
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  private removeItem(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(key);
    }
  }
}
