import { Injectable, Inject, PLATFORM_ID, inject, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { AppMessageService } from '../../../core/services/message.service';
import { ApiService } from '../../../core/services/api';
import { OrganizationService } from './../../organization/organization.service';

// ======================================================
// INTERFACES
// ======================================================

export interface Role {
  _id: string;
  name: string;
  permissions: string[];
  isSuperAdmin: boolean;
}

export interface Branch {
  _id: string;
  name: string;
  address: any;
  isMainBranch: boolean;
}

export interface EmployeeProfile {
  employeeId?: string;
  departmentId?: string;
  designationId?: string;
  dateOfJoining?: Date;
  dateOfBirth?: Date;
  reportingManagerId?: string;
  employmentType?: 'permanent' | 'contract' | 'intern' | 'probation' | 'consultant';
  workLocation?: string;
  secondaryPhone?: string;
}

export interface AttendanceConfig {
  machineUserId?: string;
  shiftId?: string;
  shiftGroupId?: string;
  isAttendanceEnabled: boolean;
  allowWebPunch: boolean;
  allowMobilePunch: boolean;
  enforceGeoFence: boolean;
  geoFenceId?: string;
  biometricVerified: boolean;
}

export interface Device {
  deviceId: string;
  deviceType: 'web' | 'mobile' | 'tablet';
  lastActive: Date;
  userAgent: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  organizationId: string;
  branchId?: string;
  role?: Role;
  isOwner: boolean;
  isSuperAdmin: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'inactive' | 'suspended';
  isActive: boolean;
  isLoginBlocked: boolean;
  emailVerified: boolean;
  employeeProfile?: EmployeeProfile;
  attendanceConfig?: AttendanceConfig;
  devices?: Device[];
  preferences?: {
    theme: 'light' | 'dark';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

export interface Session {
  _id: string;
  browser: string;
  os: string;
  deviceType: string;
  ipAddress: string;
  lastActivityAt: Date;
  createdAt: Date;
}

export interface LoginResponse {
  status: string;
  token: string;
  data: {
    user: User;
    session: Session;
    organization: {
      id: string;
      name: string;
      uniqueShopId: string;
    };
  };
}

export interface SignupResponse {
  status: string;
  message: string;
  data: {
    email: string;
    name: string;
    status: string;
  };
}

export interface VerifyTokenResponse {
  status: string;
  data: {
    user: User;
    session: Session;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'apex_auth_token';
  private readonly USER_KEY = 'apex_current_user';
  private readonly REMEMBER_ME_KEY = 'apex_remember_me';

  public authTokenData: any;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  public isAuthenticated$: Observable<boolean>;

  private apiService = inject(ApiService);
  private OrganizationService = inject(OrganizationService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isAuthenticated$ = this.currentUser$.pipe(map((user: any) => !!user));
  }

  // ======================================================
  // INITIALIZATION
  // ======================================================

  initializeFromStorage(): Promise<void> {
    return new Promise(resolve => {
      const token = this.getToken();
      this.authTokenData = token;
      const user = this.getItem<User>(this.USER_KEY);

      if (token && user) {
        this.currentUserSubject.next(user);
        // Verify token is still valid
        this.verifyToken().subscribe({
          next: () => resolve(),
          error: () => {
            // Token invalid, clear storage
            this.performClientLogout();
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // ======================================================
  // AUTHENTICATION HANDLERS
  // ======================================================

  public handleLoginSuccess(response: LoginResponse, rememberMe: boolean = false): void {
    const user = response.data?.user;
    if (!response.token || !user) return;

    this.authTokenData = response.token;
    this.setItem(this.TOKEN_KEY, response.token);
    this.setItem(this.USER_KEY, user);
    this.setItem('orgSlug', response.data.organization?.uniqueShopId?.trim());

    if (rememberMe) {
      this.setItem(this.REMEMBER_ME_KEY, 'true');
    }

    this.currentUserSubject.next(user);

    // Show welcome message
    const statusMessage = user.status === 'approved' ? 'Welcome back!' : 'Account pending approval';
    this.messageService.showSuccess('Login Successful', statusMessage);

    // Redirect based on user status
    if (user.status === 'approved') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/auth/pending-approval']);
    }
  }

  public handleSignupSuccess(response: SignupResponse): void {
    this.messageService.showSuccess(
      'Signup Successful',
      response.message || 'Your account is pending admin approval.'
    );
    this.router.navigate(['/auth/login'], {
      queryParams: { email: response.data.email }
    });
  }

  // ======================================================
  // LOGOUT
  // ======================================================

  logout(): void {
    const currentUrl = this.router.url;

    this.apiService.logOut().subscribe({
      next: () => console.log('Backend logout successful'),
      error: (err) => console.warn('Backend logout failed', err),
      complete: () => this.performClientLogout(currentUrl)
    });
  }

  logoutAll(): void {
    const currentUrl = this.router.url;

    this.apiService.logoutAll().subscribe({
      next: () => {
        this.messageService.showSuccess(
          'Logged Out',
          'You have been logged out from all devices'
        );
        this.performClientLogout(currentUrl);
      },
      error: (err) => {
        console.warn('Logout all failed', err);
        this.performClientLogout(currentUrl);
      }
    });
  }

  private performClientLogout(returnUrl?: string): void {
    if (isPlatformBrowser(this.platformId)) {
      // Clear only auth-related items, keep other app data if needed
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.REMEMBER_ME_KEY);
      localStorage.removeItem('orgSlug');
      // Optional: Clear all if you want full cleanup
      // localStorage.clear(); 
      // sessionStorage.clear();
    }

    this.authTokenData = null;
    this.currentUserSubject.next(null);

    if (returnUrl && !returnUrl.includes('/auth/')) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: returnUrl }
      });
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  // ======================================================
  // AUTH API METHODS
  // ======================================================

  /**
   * Login with email or phone
   */
  login(data: { email: string; password: string; uniqueShopId: string }, rememberMe: boolean = false) {
    return this.apiService.login(data).pipe(
      tap((response: LoginResponse) => {
        this.handleLoginSuccess(response, rememberMe);
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
        this.messageService.showError('Login Failed', errorMessage);
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
        this.messageService.showSuccess('Organization Created', 'Welcome! Your organization is ready.');
      }),
      catchError(err => {
        this.messageService.showError('Creation Failed', err.error?.message || 'Failed to create organization');
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
        this.messageService.showError('Signup Failed', errorMessage);
        return throwError(() => err);
      })
    );
  }

  /**
   * Verify current token validity
   */
  verifyToken(): Observable<VerifyTokenResponse> {
    return this.apiService.verifyToken().pipe(
      tap((response: VerifyTokenResponse) => {
        // Update stored user data if changed
        if (response.data?.user) {
          this.setItem(this.USER_KEY, response.data.user);
          this.currentUserSubject.next(response.data.user);
        }
      }),
      catchError(err => {
        this.performClientLogout();
        return throwError(() => err);
      })
    );
  }

  /**
   * Refresh access token
   */
  refreshToken() {
    return this.apiService.refreshToken().pipe(
      tap((response: any) => {
        if (response?.token) {
          this.setItem(this.TOKEN_KEY, response.token);
          this.authTokenData = response.token;
        }
      }),
      catchError(err => {
        // If refresh fails, log out
        this.performClientLogout();
        return throwError(() => err);
      })
    );
  }

  // ======================================================
  // PASSWORD MANAGEMENT
  // ======================================================

  /**
   * Request password reset email
   */
  forgotPassword(email: string) {
    return this.apiService.forgotPassword({ email }).pipe(
      tap(() => {
        this.messageService.showSuccess(
          'Check Your Email',
          'Password reset instructions sent if account exists.'
        );
      }),
      catchError(err => {
        this.messageService.showError('Request Failed', err.error?.message || 'Failed to send reset email');
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
        this.messageService.showSuccess('Password Reset', 'Your password has been reset successfully.');
      }),
      catchError(err => {
        this.messageService.showError('Reset Failed', err.error?.message || 'Failed to reset password');
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
        this.messageService.showSuccess('Password Updated', 'Your password has been changed successfully.');
      }),
      catchError(err => {
        this.messageService.showError('Update Failed', err.error?.message || 'Failed to update password');
        return throwError(() => err);
      })
    );
  }

  // ======================================================
  // EMAIL VERIFICATION
  // ======================================================

  /**
   * Send verification email
   */
  sendVerificationEmail() {
    return this.apiService.sendVerificationEmail().pipe(
      tap(() => {
        this.messageService.showSuccess(
          'Verification Email Sent',
          'Please check your inbox to verify your email.'
        );
      }),
      catchError(err => {
        this.messageService.showError('Failed', err.error?.message || 'Failed to send verification email');
        return throwError(() => err);
      })
    );
  }

  /**
   * Verify email with token
   */
  verifyEmail(token: string) {
    return this.apiService.verifyEmail(token).pipe(
      tap(() => {
        // Update local user data
        const currentUser = this.currentUserValue;
        if (currentUser) {
          currentUser.emailVerified = true;
          this.setItem(this.USER_KEY, currentUser);
          this.currentUserSubject.next(currentUser);
        }
        this.messageService.showSuccess('Email Verified', 'Your email has been verified successfully.');
      }),
      catchError(err => {
        this.messageService.showError('Verification Failed', err.error?.message || 'Invalid or expired token');
        return throwError(() => err);
      })
    );
  }

  // ======================================================
  // SESSION MANAGEMENT
  // ======================================================

  /**
   * Get all active sessions
   */
  getActiveSessions(): Observable<{ sessions: Session[] }> {
    return this.apiService.getActiveSessions().pipe(
      catchError(err => {
        console.error('Failed to fetch sessions', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Terminate specific session
   */
  terminateSession(sessionId: string): Observable<any> {
    return this.apiService.terminateSession(sessionId).pipe(
      tap(() => {
        this.messageService.showInfo('Session Terminated', 'Selected session has been logged out.');
      }),
      catchError(err => {
        this.messageService.showError('Failed', err.error?.message || 'Failed to terminate session');
        return throwError(() => err);
      })
    );
  }

  // ======================================================
  // USER STATE & PERMISSIONS
  // ======================================================

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    if (user.isOwner || user.isSuperAdmin) return true;
    return user.role?.permissions?.includes(permission) ||
      user.role?.permissions?.includes('*') ||
      false;
  }

  /**
   * Check if user has any of the given permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all given permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Check if user is approved
   */
  isApproved(): boolean {
    return this.currentUserValue?.status === 'approved';
  }

  /**
   * Check if user is pending approval
   */
  isPending(): boolean {
    return this.currentUserValue?.status === 'pending';
  }

  /**
   * Check if email is verified
   */
  isEmailVerified(): boolean {
    return this.currentUserValue?.emailVerified || false;
  }

  /**
   * Get user's full name with employee ID
   */
  getDisplayName(): string {
    const user = this.currentUserValue;
    if (!user) return '';
    if (user.employeeProfile?.employeeId) {
      return `${user.name} (${user.employeeProfile.employeeId})`;
    }
    return user.name;
  }

  // ======================================================
  // GETTERS & STORAGE
  // ======================================================

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  public getToken(): string | null {
    return this.getItem<string>(this.TOKEN_KEY);
  }

  public isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  public getOrganizationSlug(): string | null {
    return this.getItem<string>('orgSlug');
  }

  public getRememberMe(): boolean {
    return this.getItem<string>(this.REMEMBER_ME_KEY) === 'true';
  }

  // ======================================================
  // STORAGE HELPERS
  // ======================================================

  private setItem(key: string, value: any): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (key === this.TOKEN_KEY || key === this.REMEMBER_ME_KEY || key === 'orgSlug') {
      localStorage.setItem(key, String(value));
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
  }

  getItem<T>(key: string): T | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const item = localStorage.getItem(key);
    if (!item) return null;

    if (key === this.TOKEN_KEY || key === this.REMEMBER_ME_KEY || key === 'orgSlug') {
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

// import { Injectable, Inject, PLATFORM_ID, inject, Injector } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';
// import { Router } from '@angular/router';
// import { BehaviorSubject, Observable, throwError } from 'rxjs';
// import { tap, catchError, map } from 'rxjs/operators';
// import { AppMessageService } from '../../../core/services/message.service';
// import { ApiService } from '../../../core/services/api';
// import { OrganizationService } from './../../organization/organization.service';
// export interface Role { _id: string; name: string; permissions: string[]; isSuperAdmin: boolean; }
// export interface Branch { _id: string; name: string; address: any; isMainBranch: boolean; }
// export interface User { _id: string; name: string; email: string; organizationId: string; branchId: string; role: Role; }

// export interface LoginResponse {
//   token: string;
//   data: {
//     uniqueShopId?: string;
//     user?: User;
//     owner?: User;
//     organization?: any;
//     branch?: Branch;
//     role?: Role;
//   };
// }

// @Injectable({ providedIn: 'root' })
// export class AuthService {
//   private readonly TOKEN_KEY = 'apex_auth_token';
//   private readonly USER_KEY = 'apex_current_user';
//   public authTokenData: any;
//   private currentUserSubject: BehaviorSubject<User | null>;
//   public currentUser$: Observable<User | null>;
//   public isAuthenticated$: Observable<boolean>;
//   private apiService = inject(ApiService);
//   private OrganizationService = inject(OrganizationService);
//   private messageService = inject(AppMessageService);
//   private router = inject(Router);
//   constructor(@Inject(PLATFORM_ID) private platformId: Object) {
//     this.currentUserSubject = new BehaviorSubject<User | null>(null);
//     this.currentUser$ = this.currentUserSubject.asObservable();
//     this.isAuthenticated$ = this.currentUser$.pipe(map((user: any) => !!user));
//   }

//   initializeFromStorage(): Promise<void> {
//     return new Promise(resolve => {
//       const token = this.getToken();
//       this.authTokenData = token;
//       const user = this.getItem<User>(this.USER_KEY);

//       if (token && user) {
//         this.currentUserSubject.next(user);
//         // Socket connection is now handled in AppComponent!
//         this.verifyToken().subscribe(() => resolve());
//       } else {
//         resolve();
//       }
//     });
//   }

//   public handleLoginSuccess(response: LoginResponse): void {
//     const user = response.data.user || response.data.owner;
//     if (!response.token || !user) return;
//     this.authTokenData = response.token;
//     this.setItem(this.TOKEN_KEY, response.token);
//     this.setItem(this.USER_KEY, user);
//     this.setItem('orgSlug', response.data.uniqueShopId?.trim());
//     this.currentUserSubject.next(user);
//     this.router.navigate(['/dashboard']);
//   }

// logout(): void {
//     const currentUrl = this.router.url;
//     this.apiService.logOut().subscribe({
//       next: () => console.log('Backend logout successful'),
//       error: (err) => console.warn('Backend logout failed', err),
//     });
//     this.performClientLogout(currentUrl);
//   }

//   private performClientLogout(returnUrl?: string): void {
//     if (isPlatformBrowser(this.platformId)) {
//       localStorage.clear();
//       sessionStorage.clear();
//     }
//     this.authTokenData = null;
//     this.currentUserSubject.next(null);
//     if (returnUrl && !returnUrl.includes('/auth/')) {
//       this.router.navigate(['/auth/login'], {
//         queryParams: { returnUrl: returnUrl }
//       });
//     } else {
//       this.router.navigate(['/auth/login']);
//     }
//   }

//   // --- API Methods (Keep existing) ---
//   login(data: any) {
//     return this.apiService.login(data).pipe(
//       tap((response: any) => { this.handleLoginSuccess(response); }),
//       catchError(err => throwError(() => err))
//     );
//   }

//   createOrganization(data: any) {
//     return this.OrganizationService.createNewOrganization(data).pipe(
//       tap(response => {
//         this.handleLoginSuccess(response);
//         this.messageService.showSuccess('Organization Created', 'Welcome!');
//       }),
//       catchError(err => throwError(() => err))
//     );
//   }

//   employeeSignup(data: any) {
//     return this.apiService.employeeSignup(data).pipe(
//       tap(() => {
//         this.messageService.showSuccess('Signup Successful', 'Your account is pending admin approval.');
//         this.router.navigate(['/auth/login']);
//       }),
//       catchError(err => throwError(() => err))
//     );
//   }

//   verifyToken() {
//     return this.apiService.verifyToken().pipe(
//       tap(() => { }),
//       catchError(err => {
//         this.logout();
//         return throwError(() => err);
//       })
//     );
//   }

//   refreshToken() {
//     return this.apiService.refreshToken().pipe(
//       tap((response: any) => {
//         if (response?.token) {
//           this.setItem(this.TOKEN_KEY, response.token);
//           this.authTokenData = response.token;
//         }
//       }),
//       catchError(err => throwError(() => err))
//     );
//   }

//   forgotPassword(email: string) {
//     return this.apiService.forgotPassword({ email }).pipe(
//       tap(() => this.messageService.showSuccess('Check Your Email', 'Password reset instructions sent.')),
//       catchError(err => throwError(() => err))
//     );
//   }

//   resetPassword(resetToken: string, passwords: any) {
//     return this.apiService.resetPassword(resetToken, passwords).pipe(
//       tap(response => {
//         this.handleLoginSuccess(response);
//         this.messageService.showSuccess('Password Reset', 'You are now logged in.');
//       }),
//       catchError(err => throwError(() => err))
//     );
//   }

//   updateUserPassword(data: any) {
//     return this.apiService.updateMyPassword(data).pipe(
//       tap((response: any) => {
//         if (response?.token) this.setItem(this.TOKEN_KEY, response.token);
//         this.messageService.showSuccess('Password Updated', 'Your password has been changed.');
//       }),
//       catchError(err => throwError(() => err))
//     );
//   }

//   // --- Getters & Storage ---
//   public get currentUserValue(): User | null { return this.currentUserSubject.value; }
//   public getCurrentUser(): User | null { return this.currentUserSubject.value; }
//   public getToken(): string | null { return this.getItem<string>(this.TOKEN_KEY); }
//   public isLoggedIn(): boolean { return !!this.currentUserSubject.value; }

//   private setItem(key: string, value: any): void {
//     if (!isPlatformBrowser(this.platformId)) return;
//     if (key === this.TOKEN_KEY) { localStorage.setItem(key, value); return; }
//     localStorage.setItem(key, JSON.stringify(value));
//   }

//   getItem<T>(key: string): T | null {
//     if (!isPlatformBrowser(this.platformId)) return null;
//     const item = localStorage.getItem(key);
//     if (!item) return null;
//     if (key === this.TOKEN_KEY) return item as any;
//     try { return JSON.parse(item); } catch { localStorage.removeItem(key); return null; }
//   }

//   private removeItem(key: string): void {
//     if (isPlatformBrowser(this.platformId)) localStorage.removeItem(key);
//   }
// }
