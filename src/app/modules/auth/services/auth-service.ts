import { Injectable, Inject, PLATFORM_ID, inject, Injector, signal, computed, OnDestroy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, throwError, firstValueFrom, of, Subject } from 'rxjs';
import { tap, catchError, switchMap, finalize, shareReplay, takeUntil } from 'rxjs/operators';
import { AppMessageService } from '../../../core/services/message.service';
import { ApiService } from '../../../core/services/api';
import { OrganizationService } from './../../organization/organization.service';
import { User, Session, LoginResponse, SignupResponse, VerifyTokenResponse } from './auth.types';
import { TabWorkspaceService } from '../../../tab-workspace/tab-workspace.service';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly TOKEN_KEY = 'apex_auth_token';
  private readonly USER_KEY = 'apex_current_user';
  private readonly REMEMBER_ME_KEY = 'apex_remember_me';
  /** Source of truth for the logged-in user — use `currentUser()` in new code. */
  private readonly _currentUser = signal<User | null>(null);
  /** Readonly signal; templates and services can depend on this for OnPush-friendly updates. */
  readonly currentUser = this._currentUser.asReadonly();
  /** Signal: whether a user is logged in (prefer this over `isAuthenticated$` in new code). */
  readonly isAuthenticated = computed(() => !!this._currentUser());
  /** Observable mirror of `currentUser` for legacy `subscribe` / `async` usage. */
  public currentUser$: Observable<User | null>;
  public isAuthenticated$: Observable<boolean>;
  private apiService = inject(ApiService);
  private OrganizationService = inject(OrganizationService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private tabWorkspace = inject(TabWorkspaceService);
  private _token: string | null = null;
  private isLoggingOut = signal(false)

  public get authTokenData(): string | null {
    if (!this._token) { this._token = this.getItem<string>(this.TOKEN_KEY); }
    return this._token;
  }
  public set authTokenData(value: string | null) {
    this._token = value;
    if (value) {
      this.setItem(this.TOKEN_KEY, value);
    } else {
      this.removeItem(this.TOKEN_KEY);
    }
  }
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.currentUser$ = toObservable(this._currentUser);
    this.isAuthenticated$ = toObservable(this.isAuthenticated);
  }

  async initializeFromStorage(): Promise<void> {
    const token = this.getToken();
    const user = this.getItem<any>(this.USER_KEY);

    if (token && user) {
      this._token = token;
      this._currentUser.set(user);

      try {
        // 1. Verify token validity with backend
        await firstValueFrom(this.verifyToken());
        // 2. STRENGTHEN: Wait for permissions to be fully fetched BEFORE completing init
        // Removed as per user request to use direct login data instead.
        // await firstValueFrom(this.refreshPermissions());
      } catch (err) {
        console.warn('Auth initialization failed, clearing state', err);
        this.performClientLogout();
      }
    }
  }

  public handleLoginSuccess(response: any, rememberMe: boolean = false, returnUrl: string = '/create-dashboard'): void {
    const user = response.data?.user;
    const token = response.token;
    if (!token || !user) return;
    this._token = token;
    this.setItem(this.TOKEN_KEY, token);
    this.setItem(this.USER_KEY, user);
    this.setItem('orgSlug', response.data.organization?.uniqueShopId?.trim());
    if (rememberMe) {
      this.setItem(this.REMEMBER_ME_KEY, 'true');
    }
    this._currentUser.set(user);
    // this.refreshPermissions().subscribe(); // Removed to rely on direct data 
    this.messageService.handleSuccess(response, user.status === 'approved' ? 'Welcome back!' : 'Account pending approval');
    if (user.status === 'approved') {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/auth/pending-approval']);
    }
  }

  public handleSignupSuccess(response: SignupResponse): void {
    this.messageService.showSuccess(
      response.message || 'Your account is pending admin approval.'
    );
    this.router.navigate(['/auth/login'], {
      queryParams: { email: response.data.email }
    });
  }

  logout(): void {
    if (this.isLoggingOut()) return;
    this.isLoggingOut.set(true);
    const currentUrl = this.router.url;
    this.apiService.logOut().pipe(
      finalize(() => {
        this.performClientLogout(currentUrl);
        this.isLoggingOut.set(false);
      }), takeUntil(this.destroy$)
    ).subscribe({
      error: () => {
        console.warn('Backend logout failed or token already expired');
      }
    });
  }

  logoutAll(): void {
    if (this.isLoggingOut()) return;
    this.isLoggingOut.set(true);

    const currentUrl = this.router.url;

    this.apiService.logoutAll().pipe(
      finalize(() => {
        this.performClientLogout(currentUrl);
        this.isLoggingOut.set(false);
      }), takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('You have been logged out from all devices');
      },
      error: (err) => {
        console.warn('Logout all failed', err);
      }
    });
  }

  private performClientLogout(returnUrl?: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.REMEMBER_ME_KEY);
      localStorage.removeItem('orgSlug');
    }

    this.tabWorkspace.clear();

    this._token = null; // ✅ Kill the token state
    this._currentUser.set(null); // ✅ Triggers app.component socket disconnect

    const target = (returnUrl && !returnUrl.includes('/auth/')) ?
      ['/auth/login', { queryParams: { returnUrl } }] :
      ['/auth/login'];

    this.router.navigate(target as any[]);
  }

  /**
   * Login with email or phone
   */
  login(data: { email: string; password: string; uniqueShopId: string; forceLogout?: boolean }, rememberMe: boolean = false, returnUrl: string = '/create-dashboard') {
    return this.apiService.login(data).pipe(
      tap((response: LoginResponse) => {
        this.handleLoginSuccess(response, rememberMe, returnUrl);
      }),
      catchError(err => {
        let errorMessage = 'Login failed';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.status === 423) {
          errorMessage = 'Account temporarily locked. Please try again later.';
        } else if (err.status === 403 && err.error?.message?.includes('blocked')) {
          errorMessage = 'Account blocked. Please contact administrator.';
        }
        this.messageService.handleHttpError(err)
        return throwError(() => err);
      })
    );
  }

  /**
   * Create new organization (owner signup)
   */
  createOrganization(data: any) {
    return this.OrganizationService.createNewOrganization(data).pipe(
      tap((response: LoginResponse) => {
        this.handleLoginSuccess(response, true);
      }),
      catchError(err => {
        this.messageService.handleHttpError(err)
        return throwError(() => err);
      })
    );
  }

  /**
   * Employee signup (requires approval)
   */
  employeeSignup(data: { name: string; email: string; phone: string; password: string; uniqueShopId: string }) {
    return this.apiService.employeeSignup(data).pipe(
      tap((response: SignupResponse) => {
        this.handleSignupSuccess(response);
      }),
      catchError(err => {
        let errorMessage = 'Signup failed';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.error?.errors) {
          errorMessage = Object.values(err.error.errors).join(', ');
        }
        this.messageService.handleHttpError(err)
        return throwError(() => err);
      })
    );
  }

  verifyToken(): Observable<any> {
    return this.apiService.verifyToken().pipe(
      tap((res: any) => {
        if (res.data?.user) {
          this.setItem(this.USER_KEY, res.data.user);
          this._currentUser.set(res.data.user);
        }
      }),
      catchError(err => {
        this.performClientLogout();
        return throwError(() => err);
      })
    );
  }

  refreshToken(): Observable<any> {
    return this.apiService.refreshToken().pipe(
      tap((res: any) => {
        if (res?.token) {
          this._token = res.token;
          this.setItem(this.TOKEN_KEY, res.token);
        }
      }),
      catchError(err => {
        this.performClientLogout();
        return throwError(() => err);
      })
    );
  }

  forgotPassword(email: string) {
    return this.apiService.forgotPassword({ email }).pipe(
      tap(() => {
        // Interceptor will show res.message
      }),
      catchError(err => {
        this.messageService.handleHttpError(err)
        return throwError(() => err);
      })
    );
  }

  /**
   * Reset password with token
   */
  //{ password: string; passwordConfirm: string }
  resetPassword(resetToken: string, passwords: any) {
    return this.apiService.resetPassword(resetToken, passwords).pipe(
      tap((response: LoginResponse) => {
        this.handleLoginSuccess(response);
      }),
      catchError(err => {
        this.messageService.handleHttpError(err)
        return throwError(() => err);
      })
    );
  }

  /**
   * Update password when logged in
   */
  updateUserPassword(data: any) { //{ currentPassword: string; newPassword: string; newPasswordConfirm: string }
    return this.apiService.updateMyPassword(data).pipe(
      tap((response: any) => {
        if (response?.token) {
          this.setItem(this.TOKEN_KEY, response.token);
          this.authTokenData = response.token;
        }
      }),
      catchError(err => {
        this.messageService.handleHttpError(err)
        return throwError(() => err);
      })
    );
  }

  sendVerificationEmail() {
    return this.apiService.sendVerificationEmail().pipe(
      tap(() => {
        this.messageService.showSuccess(
          'Please check your inbox to verify your email.'
        );
      }),
      catchError(err => {
        this.messageService.handleHttpError(err)
        return throwError(() => err);
      })
    );
  }

  verifyEmail(token: string) {
    return this.apiService.verifyEmail(token).pipe(
      tap(() => {
        const currentUser = this.currentUserValue;
        if (currentUser) {
          currentUser.emailVerified = true;
          this.setItem(this.USER_KEY, currentUser);
          this._currentUser.set(currentUser);
        }
        this.messageService.showSuccess('Your email has been verified successfully.');
      }),
      catchError(err => {
        this.messageService.handleHttpError(err)
        return throwError(() => err);
      })
    );
  }

  getActiveSessions(): Observable<{ sessions: Session[] }> {
    return this.apiService.getActiveSessions().pipe(
      catchError(err => {
        console.error('Failed to fetch sessions', err);
        return throwError(() => err);
      })
    );
  }

  terminateSession(sessionId: string): Observable<any> {
    return this.apiService.terminateSession(sessionId).pipe(
      tap(() => {
        this.messageService.showInfo('Selected session has been logged out.');
      }),
      catchError(err => {
        this.messageService.handleHttpError(err)
        return throwError(() => err);
      })
    );
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    if (user.isOwner || user.isSuperAdmin) return true;
    const perms = user.permissions || [];
    return perms.includes(permission) || perms.includes('*');
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  isApproved(): boolean {
    return this.currentUserValue?.status === 'approved';
  }

  isPending(): boolean {
    return this.currentUserValue?.status === 'pending';
  }

  isEmailVerified(): boolean {
    return this.currentUserValue?.emailVerified || false;
  }

  getDisplayName(): string {
    const user = this.currentUserValue;
    if (!user) return '';
    if (user.employeeProfile?.employeeId) {
      return `${user.name} (${user.employeeProfile.employeeId})`;
    }
    return user.name;
  }

  public getCurrentUser(): User | null {
    return this._currentUser();
  }

  public getToken(): string | null {
    return this.getItem<string>(this.TOKEN_KEY);
  }

  public get currentUserValue(): any | null {
    return this._currentUser();
  }

  public isLoggedIn(): boolean {
    return !!this._currentUser();
  }

  public getOrganizationSlug(): string | null {
    return this.getItem<string>('orgSlug');
  }

  public getRememberMe(): boolean {
    return this.getItem<string>(this.REMEMBER_ME_KEY) === 'true';
  }

  private setItem(key: string, value: any): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const data = (typeof value === 'string') ? value : JSON.stringify(value);
    localStorage.setItem(key, data);
  }

  private getItem<T>(key: string): T | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item);
    } catch {
      return item as unknown as T;
    }
  }

  private removeItem(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(key);
    }
  }

  refreshPermissions(): Observable<any> {
    return this.apiService.getMyPermissions().pipe(
      tap((res) => {
        const user: any = this.currentUserValue;
        if (user && res?.data) {
          const updated = {
            ...user,
            isOwner: res.data.isOwner ?? user.isOwner,
            isSuperAdmin: res.data.isSuperAdmin ?? user.isSuperAdmin,
            permissions: res.data.permissions ?? user.permissions ?? []
          };
          this.setItem(this.USER_KEY, updated);
          this._currentUser.set(updated);
        }
      }),
      catchError((err) => {
        console.warn('Permission refresh failed', err);
        return of(null);
      }),
      shareReplay(1) // Ensure subsequent subscribers get the same result
    );
  }
  // refreshPermissions(): void {
  //   this.apiService.getMyPermissions().subscribe({
  //     next: (res) => {
  //       const user: any = this.currentUserValue;
  //       if (user && res.data) {
  //         user.role = { ...user.role, permissions: res.data };
  //         this.setItem(this.USER_KEY, user);
  //         this._currentUser.set({ ...user });
  //       }
  //     }
  //   });
  // }

  updateUserPreferences(preferences: Partial<User['preferences']>, themeId?: string): void {
    const user = this.currentUserValue;
    if (user) {
      user.preferences = {
        ...(user.preferences || { theme: 'light' }),
        ...preferences
      } as any;
      if (themeId) {
        user.themeId = themeId;
      }
      this.setItem(this.USER_KEY, user);
      this._currentUser.set({ ...user });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
