import { Injectable, Inject, PLATFORM_ID, inject, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AppMessageService } from '../../../core/services/message.service';
import { ApiService } from '../../../core/services/api';
import { OrganizationService } from './../../organization/organization.service';
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
  private readonly TOKEN_KEY = 'apex_auth_token';
  private readonly USER_KEY = 'apex_current_user';
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

  initializeFromStorage(): Promise<void> {
    return new Promise(resolve => {
      const token = this.getToken();
      this.authTokenData = token;
      const user = this.getItem<User>(this.USER_KEY);

      if (token && user) {
        this.currentUserSubject.next(user);
        // Socket connection is now handled in AppComponent!
        this.verifyToken().subscribe(() => resolve());
      } else {
        resolve();
      }
    });
  }

  public handleLoginSuccess(response: LoginResponse): void {
    const user = response.data.user || response.data.owner;
    if (!response.token || !user) return;

    this.authTokenData = response.token;
    this.setItem(this.TOKEN_KEY, response.token);
    this.setItem(this.USER_KEY, user);
    this.currentUserSubject.next(user);

    // ✅ Socket will auto-connect via AppComponent subscription
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.removeItem(this.TOKEN_KEY);
    this.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  // --- API Methods (Keep existing) ---
  login(data: any) {
    return this.apiService.login(data).pipe(
      tap((response: any) => { this.handleLoginSuccess(response); }),
      catchError(err => throwError(() => err))
    );
  }

  createOrganization(data: any) {
    return this.OrganizationService.createNewOrganization(data).pipe(
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

  verifyToken() {
    return this.apiService.verifyToken().pipe(
      tap(() => { }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  refreshToken() {
    return this.apiService.refreshToken().pipe(
      tap((response: any) => {
        if (response?.token) {
            this.setItem(this.TOKEN_KEY, response.token);
            this.authTokenData = response.token;
        }
      }),
      catchError(err => throwError(() => err))
    );
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

  // --- Getters & Storage ---
  public get currentUserValue(): User | null { return this.currentUserSubject.value; }
  public getCurrentUser(): User | null { return this.currentUserSubject.value; }
  public getToken(): string | null { return this.getItem<string>(this.TOKEN_KEY); }
  public isLoggedIn(): boolean { return !!this.currentUserSubject.value; }

  private setItem(key: string, value: any): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (key === this.TOKEN_KEY) { localStorage.setItem(key, value); return; }
    localStorage.setItem(key, JSON.stringify(value));
  }

  getItem<T>(key: string): T | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const item = localStorage.getItem(key);
    if (!item) return null;
    if (key === this.TOKEN_KEY) return item as any;
    try { return JSON.parse(item); } catch { localStorage.removeItem(key); return null; }
  }

  private removeItem(key: string): void {
    if (isPlatformBrowser(this.platformId)) localStorage.removeItem(key);
  }
}

// import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';
// import { Router } from '@angular/router';
// import { BehaviorSubject, Observable, throwError } from 'rxjs';
// import { tap, catchError, map } from 'rxjs/operators';
// import { AppMessageService } from '../../../core/services/message.service';
// import { ApiService } from '../../../core/services/api';
// import { NotificationService } from '../../../core/services/notification.service';
// import { OrganizationService } from './../../organization/organization.service';
// import { ChatBootstrapService } from '../../../chat/services/chat-bootstrap.service';
// import { Injector } from '@angular/core';
// import { ChatService } from '../../../chat/services/chat.service';

// export interface Role { _id: string; name: string; permissions: string[]; isSuperAdmin: boolean; }
// export interface Branch { _id: string; name: string; address: any; isMainBranch: boolean; }
// export interface User { _id: string; name: string; email: string; organizationId: string; branchId: string; role: Role; }

// export interface LoginResponse {
//   token: string;
//   data: {
//     user?: User;
//     owner?: User;
//     organization?: any;
//     branch?: Branch;
//     role?: Role;
//   };
// }

// @Injectable({ providedIn: 'root' })
// export class AuthService {
//   private chatBootstrap = inject(ChatBootstrapService);
//   private readonly TOKEN_KEY = 'apex_auth_token';
//   private readonly USER_KEY = 'apex_current_user';
//   public authTokenData: any
//   private currentUserSubject: BehaviorSubject<User | null>;
//   public currentUser$: Observable<User | null>;
//   public isAuthenticated$: Observable<boolean>;

//   private notificationService = inject(NotificationService);
//   private apiService = inject(ApiService);
//   private OrganizationService = inject(OrganizationService);
//   private messageService = inject(AppMessageService);
//   private router = inject(Router);

//   private injector = inject(Injector);

//   constructor(@Inject(PLATFORM_ID) private platformId: Object) {
//     this.currentUserSubject = new BehaviorSubject<User | null>(null);
//     this.currentUser$ = this.currentUserSubject.asObservable();
//     this.isAuthenticated$ = this.currentUser$.pipe(map((user: any) => !!user));
//   }

//   initializeFromStorage(): Promise<void> {
//     return new Promise(resolve => {
//       const token = this.getToken();
//       this.authTokenData = this.getToken();
//       const user = this.getItem<User>(this.USER_KEY);

//       // if (token && user) {
//       //   this.currentUserSubject.next(user);

//       //   // ✅ PASS ORGANIZATION ID HERE
//       //   if (user._id) {
//       //     this.notificationService.connect(user._id, token, user.organizationId);
//       //   }

//       //   this.verifyToken().subscribe({
//       //     next: () => resolve(),
//       //     error: () => resolve()
//       //   });

//       // } 
//       if (token && user) {
//         this.currentUserSubject.next(user);
//         this.notificationService.connect(user._id, token, user.organizationId);

//         const chat = this.injector.get(ChatService);
//         chat.setTokenRefresh(() => this.refreshTokenPromise());
//         chat.connect(token);

//         this.verifyToken().subscribe(() => resolve());
//       } else {
//         resolve();
//       }
//     });
//   }

//   // public handleLoginSuccess(response: LoginResponse): void {
//   //   const user = response.data.user || response.data.owner;

//   //   if (!response || !response.token || !user) {
//   //     console.error('Invalid login response', response);
//   //     return;
//   //   }

//   //   this.setItem(this.TOKEN_KEY, response.token);
//   //   this.setItem(this.USER_KEY, user);
//   //   this.currentUserSubject.next(user);

//   //   // ✅ PASS ORGANIZATION ID HERE
//   //   if (user._id) {
//   //     this.notificationService.connect(user._id, response.token, user.organizationId);
//   //     this.chatBootstrap.init(response.token, user.organizationId, user._id);
//   //   }

//   //   this.router.navigate(['/']);
//   // }
//   // public handleLoginSuccess(response: LoginResponse): void {
//   //   const user = response.data.user || response.data.owner;
//   //   if (!response.token || !user) return;

//   //   this.setItem(this.TOKEN_KEY, response.token);
//   //   this.setItem(this.USER_KEY, user);
//   //   this.currentUserSubject.next(user);

//   //   this.notificationService.connect(user._id, response.token, user.organizationId);

//   //   // IMPORTANT: set refresh function HERE, NOT IN BOOTSTRAP
//   //   const chat = this.injector.get(ChatService);
//   //   chat.setTokenRefresh(() => this.refreshTokenPromise());
//   //   chat.connect(response.token);

//   //   this.router.navigate(['/']);
//   // }
//   public handleLoginSuccess(response: LoginResponse): void {
//     const user = response.data.user || response.data.owner;
//     if (!response.token || !user) return;

//     this.setItem(this.TOKEN_KEY, response.token);
//     this.setItem(this.USER_KEY, user);
//     this.currentUserSubject.next(user);

//     this.notificationService.connect(user._id, response.token, user.organizationId);

//     const chat = this.injector.get(ChatService);
//     chat.setTokenRefresh(() => this.refreshTokenPromise());
//     chat.connect(response.token);

//     // ✅ UPDATED: Navigate to dashboard instead of root ('/')
//     this.router.navigate(['/dashboard']);
//   }

//   logout(): void {
//     this.removeItem(this.TOKEN_KEY);
//     this.removeItem(this.USER_KEY);
//     this.currentUserSubject.next(null);

//     try { this.notificationService.disconnect(); } catch { }
//     try { this.chatBootstrap.stop(); } catch { }

//     this.router.navigate(['/auth/login']);
//   }
//   // --- API Methods --
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
//         if (response?.token) this.setItem(this.TOKEN_KEY, response.token);
//       }),
//       catchError(err => throwError(() => err))
//     );
//   }

//   refreshTokenPromise(): Promise<string> {
//     return new Promise((resolve, reject) => {
//       this.refreshToken().subscribe({
//         next: (res: any) => resolve(res.token),
//         error: (err) => reject(err)
//       });
//     });
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

//   public get currentUserValue(): User | null {
//     return this.currentUserSubject.value;
//   }

//   public getCurrentUser(): User | null {
//     return this.currentUserSubject.value;
//   }

//   public getToken(): string | null {
//     return this.getItem<string>(this.TOKEN_KEY);
//   }

//   public isLoggedIn(): boolean {
//     return !!this.currentUserSubject.value;
//   }

//   private setItem(key: string, value: any): void {
//     if (!isPlatformBrowser(this.platformId)) return;
//     if (key === this.TOKEN_KEY) {
//       localStorage.setItem(key, value);
//       return;
//     }
//     localStorage.setItem(key, JSON.stringify(value));
//   }

//   getItem<T>(key: string): T | null {
//     if (!isPlatformBrowser(this.platformId)) return null;
//     const item = localStorage.getItem(key);
//     if (!item) return null;
//     if (key === this.TOKEN_KEY) return item as any;
//     try {
//       return JSON.parse(item);
//     } catch {
//       localStorage.removeItem(key);
//       return null;
//     }
//   }

//   private removeItem(key: string): void {
//     if (isPlatformBrowser(this.platformId)) {
//       localStorage.removeItem(key);
//     }
//   }
// }


