import { Injectable, Inject, PLATFORM_ID, inject, Injector, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map, switchMap, finalize } from 'rxjs/operators';
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
    notifications?: {
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

  // public authTokenData: any;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  public isAuthenticated$: Observable<boolean>;

  private apiService = inject(ApiService);
  private OrganizationService = inject(OrganizationService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);

  // 🟢 CRITICAL FIX: Ensure this is always synced with Storage
  private _token: string | null = null;
  private isLoggingOut = signal(false); // ✅ Guard against concurrent logout calls

  public get authTokenData(): string | null {
    if (!this._token) {
      this._token = this.getItem<string>(this.TOKEN_KEY);
    }
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
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isAuthenticated$ = this.currentUser$.pipe(map((user: any) => !!user));
  }

  // ======================================================
  // INITIALIZATION
  // ======================================================

  //   initializeFromStorage(): Promise<void> {
  //   return new Promise(resolve => {
  //     const token = this.getToken();
  //     const user = this.getItem<User>(this.USER_KEY);

  //     if (token && user) {
  //       this.currentUserSubject.next(user);
  //       this.verifyToken().subscribe({
  //         next: () => {
  //           this.refreshPermissions(); // <--- Add this here
  //           resolve();
  //         },
  //         error: () => {
  //           this.performClientLogout();
  //           resolve();
  //         }
  //       });
  //     } else {
  //       resolve();
  //     }
  //   });
  // }

  initializeFromStorage(): Promise<void> {
    return new Promise(resolve => {
      const token = this.getToken();
      const user = this.getItem<any>(this.USER_KEY);

      if (token && user) {
        this._token = token; // ✅ Sync internal token variable
        this.currentUserSubject.next(user);

        this.verifyToken().subscribe({
          next: () => {
            this.refreshPermissions();
            resolve();
          },
          error: () => {
            this.performClientLogout();
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
  // initializeFromStorage(): Promise<void> {
  //   return new Promise(resolve => {
  //     const token = this.getToken();
  //     this.authTokenData = token;
  //     const user = this.getItem<User>(this.USER_KEY);

  //     if (token && user) {
  //       this.currentUserSubject.next(user);
  //       // Verify token is still valid
  //       this.verifyToken().subscribe({
  //         next: () => resolve(),
  //         error: () => {
  //           // Token invalid, clear storage
  //           this.performClientLogout();
  //           resolve();
  //         }
  //       });
  //     } else {
  //       resolve();
  //     }
  //   });
  // }
  // ======================================================
  // AUTHENTICATION HANDLERS
  // ======================================================

  public handleLoginSuccess(response: any, rememberMe: boolean = false): void {
    const user = response.data?.user;
    const token = response.token;

    if (!token || !user) return;

    this._token = token; // ✅ Update internal state
    this.setItem(this.TOKEN_KEY, token);
    this.setItem(this.USER_KEY, user);
    this.setItem('orgSlug', response.data.organization?.uniqueShopId?.trim());

    if (rememberMe) {
      this.setItem(this.REMEMBER_ME_KEY, 'true');
    }

    this.currentUserSubject.next(user);

    // SuccessInterceptor will show res.message if the backend provides one.
    // However, login response is handled in AuthService.handleLoginSuccess.
    // Let's use handleSuccess for better fallback logic.
    this.messageService.handleSuccess(response, user.status === 'approved' ? 'Welcome back!' : 'Account pending approval');

    if (user.status === 'approved') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/auth/pending-approval']);
    }
  }

  // // ======================================================
  // // AUTHENTICATION HANDLERS
  // // ======================================================

  // public handleLoginSuccess(response: LoginResponse, rememberMe: boolean = false): void {
  //   const user = response.data?.user;
  //   if (!response.token || !user) return;

  //   this.authTokenData = response.token;
  //   this.setItem(this.TOKEN_KEY, response.token);
  //   this.setItem(this.USER_KEY, user);
  //   this.setItem('orgSlug', response.data.organization?.uniqueShopId?.trim());

  //   if (rememberMe) { this.setItem(this.REMEMBER_ME_KEY, 'true');    }
  //   this.currentUserSubject.next(user);
  //   const statusMessage = user.status === 'approved' ? 'Welcome back!' : 'Account pending approval';
  //   this.messageService.showSuccess( statusMessage);
  //   if (user.status === 'approved') {
  //     this.router.navigate(['/dashboard']);
  //   } else {
  //     this.router.navigate(['/auth/pending-approval']);
  //   }
  // }

  public handleSignupSuccess(response: SignupResponse): void {
    this.messageService.showSuccess(
      response.message || 'Your account is pending admin approval.'
    );
    this.router.navigate(['/auth/login'], {
      queryParams: { email: response.data.email }
    });
  }

  // ======================================================
  // LOGOUT
  // ======================================================

  // logout(): void {
  //   const currentUrl = this.router.url;

  //   this.apiService.logOut().subscribe({
  //     next: () => console.log('Backend logout successful'),
  //     error: (err) => console.warn('Backend logout failed', err),
  //     complete: () => this.performClientLogout(currentUrl)
  //   });
  // }
  // ======================================================
  // LOGOUT (Ensures Socket Cleanup)
  // ======================================================

  logout(): void {
    if (this.isLoggingOut()) return;
    this.isLoggingOut.set(true);

    const currentUrl = this.router.url;

    // Optimistically proceed to client logout regardless of backend success
    this.apiService.logOut().pipe(
      finalize(() => {
        this.performClientLogout(currentUrl);
        this.isLoggingOut.set(false);
      })
    ).subscribe({
      error: () => {
        // Even if 401 or network error, we want to clear local session
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
      })
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

    this._token = null; // ✅ Kill the token state
    this.currentUserSubject.next(null); // ✅ Triggers app.component socket disconnect

    const target = (returnUrl && !returnUrl.includes('/auth/')) ?
      ['/auth/login', { queryParams: { returnUrl } }] :
      ['/auth/login'];

    this.router.navigate(target as any[]);
  }

  // private performClientLogout(returnUrl?: string): void {
  //   if (isPlatformBrowser(this.platformId)) {
  //     // Clear only auth-related items, keep other app data if needed
  //     localStorage.removeItem(this.TOKEN_KEY);
  //     localStorage.removeItem(this.USER_KEY);
  //     localStorage.removeItem(this.REMEMBER_ME_KEY);
  //     localStorage.removeItem('orgSlug');
  //     // Optional: Clear all if you want full cleanup
  //     // localStorage.clear(); 
  //     // sessionStorage.clear();
  //   }

  //   this.authTokenData = null;
  //   this.currentUserSubject.next(null);

  //   if (returnUrl && !returnUrl.includes('/auth/')) {
  //     this.router.navigate(['/auth/login'], {
  //       queryParams: { returnUrl: returnUrl }
  //     });
  //   } else {
  //     this.router.navigate(['/auth/login']);
  //   }
  // }

  // ======================================================
  // AUTH API METHODS
  // ======================================================

  /**
   * Login with email or phone
   */
  login(data: { email: string; password: string; uniqueShopId: string; forceLogout?: boolean }, rememberMe: boolean = false) {
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



  /**
   * Verify current token validity
   */
  verifyToken(): Observable<any> {
    return this.apiService.verifyToken().pipe(
      tap((res: any) => {
        if (res.data?.user) {
          this.setItem(this.USER_KEY, res.data.user);
          this.currentUserSubject.next(res.data.user);
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


  // ======================================================
  // PASSWORD MANAGEMENT
  // ======================================================

  /**
   * Request password reset email
   */
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
          'Please check your inbox to verify your email.'
        );
      }),
      catchError(err => {
        this.messageService.handleHttpError(err)
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
        this.messageService.showSuccess('Your email has been verified successfully.');
      }),
      catchError(err => {
        this.messageService.handleHttpError(err)
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
        this.messageService.showInfo('Selected session has been logged out.');
      }),
      catchError(err => {
        this.messageService.handleHttpError(err)
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

  // public get currentUserValue(): User | null {
  //   return this.currentUserSubject.value;
  // }

  public getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  public getToken(): string | null {
    return this.getItem<string>(this.TOKEN_KEY);
  }

  public get currentUserValue(): any | null {
    return this.currentUserSubject.value;
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
  // private setItem(key: string, value: any): void {
  //   if (!isPlatformBrowser(this.platformId)) return;

  //   if (key === this.TOKEN_KEY || key === this.REMEMBER_ME_KEY || key === 'orgSlug') {
  //     localStorage.setItem(key, String(value));
  //     return;
  //   }

  //   localStorage.setItem(key, JSON.stringify(value));
  // }

  // getItem<T>(key: string): T | null {
  //   if (!isPlatformBrowser(this.platformId)) return null;

  //   const item = localStorage.getItem(key);
  //   if (!item) return null;

  //   if (key === this.TOKEN_KEY || key === this.REMEMBER_ME_KEY || key === 'orgSlug') {
  //     return item as any;
  //   }

  //   try {
  //     return JSON.parse(item);
  //   } catch {
  //     localStorage.removeItem(key);
  //     return null;
  //   }
  // }

  private removeItem(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(key);
    }
  }

  refreshPermissions(): void {
    this.apiService.getMyPermissions().subscribe({
      next: (res) => {
        const user: any = this.currentUserValue;
        if (user && res.data) {
          user.role = { ...user.role, permissions: res.data };
          this.setItem(this.USER_KEY, user);
          this.currentUserSubject.next({ ...user });
        }
      }
    });
  }

  /**
   * Update current user preferences locally and in storage
   */
  updateUserPreferences(preferences: Partial<User['preferences']>): void {
    const user = this.currentUserValue;
    if (user) {
      user.preferences = {
        ...(user.preferences || { theme: 'light' }),
        ...preferences
      } as any;
      this.setItem(this.USER_KEY, user);
      this.currentUserSubject.next({ ...user });
    }
  }

  /**
 * Fetch fresh permissions from the server and update local state
 */
  // refreshPermissions(): void {
  //   this.apiService.getMyPermissions().subscribe({
  //     next: (res) => {
  //       const currentUser = this.currentUserValue;
  //       if (currentUser && res.data) {
  //         // We cast the object to 'User' to satisfy the Type check
  //         const updatedUser: User = {
  //           ...currentUser,
  //           role: {
  //             ...currentUser.role,
  //             permissions: res.data // New permissions from API
  //           }
  //         } as User; 

  //         this.setItem(this.USER_KEY, updatedUser);
  //         this.currentUserSubject.next(updatedUser);
  //       }
  //     }
  //   });
  // }

  // /**
  //  * The "Perfect" check logic: 
  //  * Handles Wildcards (*), SuperAdmin status, and Category wildcards (invoice:*)
  //  */
  // can(permission: string): boolean {
  //   if (this.isSuperAdmin()) return true;

  //   const perms = this.userPermissions();
  //   if (perms.includes('*')) return true;
  //   if (perms.includes(permission)) return true;

  //   // Support for category-level access (e.g., 'invoice:*')
  //   const [category] = permission.split(':');
  //   return perms.includes(`${category}:*`);
  // }
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
//         this.messageService.showSuccess( 'Welcome!');
//       }),
//       catchError(err => throwError(() => err))
//     );
//   }

//   employeeSignup(data: any) {
//     return this.apiService.employeeSignup(data).pipe(
//       tap(() => {
//         this.messageService.showSuccess( 'Your account is pending admin approval.');
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
//       tap(() => this.messageService.showSuccess(', 'Password reset instructions sent.')),
//       catchError(err => throwError(() => err))
//     );
//   }

//   resetPassword(resetToken: string, passwords: any) {
//     return this.apiService.resetPassword(resetToken, passwords).pipe(
//       tap(response => {
//         this.handleLoginSuccess(response);
//         this.messageService.showSuccess( 'You are now logged in.');
//       }),
//       catchError(err => throwError(() => err))
//     );
//   }

//   updateUserPassword(data: any) {
//     return this.apiService.updateMyPassword(data).pipe(
//       tap((response: any) => {
//         if (response?.token) this.setItem(this.TOKEN_KEY, response.token);
//         this.messageService.showSuccess( 'Your password has been changed.');
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
