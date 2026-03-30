import { Injectable, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Permission, PermissionMode } from '../permissions.constants';
import { AuthService } from '../../../modules/auth/services/auth-service';

/**
 * PermissionService
 *
 * Thin reactive wrapper around YOUR existing AuthService.
 *
 * ─── What this does ───────────────────────────────────────────────
 * • Converts AuthService.currentUser$ (BehaviorSubject) → Angular Signals
 * • Exposes computed signals: isAuth, isOwner, isSuperAdmin, permissions
 * • Provides check() / can() / canAny() for directives, guards, components
 * • All actual auth logic (login/logout/token/storage) stays in YOUR AuthService
 *
 * ─── What this does NOT do ────────────────────────────────────────
 * • Does NOT store any tokens or user state of its own
 * • Does NOT duplicate login/logout/storage logic
 * • Does NOT replace AuthService — it wraps it
 *
 * ─── AuthService methods delegated to ────────────────────────────
 * • authSvc.hasPermission(p)      → handles isOwner / isSuperAdmin / wildcard '*'
 * • authSvc.hasAnyPermission([])  → any match
 * • authSvc.hasAllPermissions([]) → all must match
 * • authSvc.currentUser$          → BehaviorSubject source of truth
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly authSvc = inject(AuthService);
  private readonly router = inject(Router);

  // ── Convert BehaviorSubject → Signal ─────────────────────────────
  // toSignal subscribes to currentUser$ once and keeps it in sync.
  // When authSvc calls currentUserSubject.next(user) (login/logout/
  // refreshPermissions), all computed signals and directives below
  // automatically re-evaluate — zero manual wiring needed.
  readonly user = toSignal(this.authSvc.currentUser$, { initialValue: null });

  // ── Derived computed signals ──────────────────────────────────────

  /** True if any user is currently logged in */
  readonly isAuth = computed(() => !!this.user());

  /** True if user is an organization owner → wildcard access */
  readonly isOwner = computed(() => this.user()?.isOwner ?? false);

  /**
   * True if owner OR role has isSuperAdmin flag.
   * Mirrors backend: isOwner || role.isSuperAdmin
   */
  readonly isSuperAdmin = computed(() => {
    const u = this.user();
    return u?.isOwner || u?.isSuperAdmin || u?.role?.isSuperAdmin || false;
  });

  /**
   * Reactive permissions array — used by directives to establish
   * a signal dependency so they re-run on permission changes.
   * ['*'] for owners, role.permissions[] for everyone else.
   */
  readonly permissions = computed((): string[] => {
    const u = this.user();
    if (!u) return [];
    if (u.isOwner) return ['*'];
    return u.role?.permissions ?? [];
  });

  /** Current role name — used by *hasRole directive */
  readonly roleName = computed(() => this.user()?.role?.name ?? null);

  /** True when account status === 'approved' */
  readonly isApproved = computed(() => this.user()?.status === 'approved');

  // ── Permission checks — delegate to AuthService ───────────────────
  // Your AuthService.hasPermission() already handles:
  //   isOwner → true, isSuperAdmin → true, '*' wildcard → true

  /** Check a single permission string */
  hasPermission(permission: Permission): boolean {
    return this.authSvc.hasPermission(permission);
  }

  /** True if user has AT LEAST ONE of the given permissions */
  hasAnyPermission(permissions: Permission[]): boolean {
    return this.authSvc.hasAnyPermission(permissions);
  }

  /** True only if user has ALL of the given permissions */
  hasAllPermissions(permissions: Permission[]): boolean {
    return this.authSvc.hasAllPermissions(permissions);
  }

  /**
   * Unified flexible check — used internally by all directives and guards.
   * @param permissions - single string or array
   * @param mode        - 'any' (default) | 'all'
   */
  check(permissions: Permission | Permission[], mode: PermissionMode = 'any'): boolean {
    const list = Array.isArray(permissions) ? permissions : [permissions];
    if (list.length === 0) return true;
    return mode === 'all'
      ? this.hasAllPermissions(list)
      : this.hasAnyPermission(list);
  }

  // ── Signal factories for components ──────────────────────────────
  // These return computed() Signals so component properties stay reactive.
  // Call once in the component field, not inside a template or method.

  /**
   * Returns a computed Signal<boolean> for a single permission.
   *
   * @example
   *   // Component field:
   *   readonly canDelete = inject(PermissionService).can(PERMISSIONS.INVOICE.DELETE);
   *
   *   // Template:
   *   <button [disabled]="!canDelete()">Delete</button>
   *   <div *ngIf="canDelete()">...</div>
   */
  can(permission: Permission): ReturnType<typeof computed<boolean>> {
    return computed(() => {
      this.permissions(); // reactive dependency — re-runs on permission change
      return this.hasPermission(permission);
    });
  }

  /**
   * Returns a computed Signal<boolean> — true if user has ANY of the permissions.
   *
   * @example
   *   readonly canSave = inject(PermissionService)
   *     .canAny([PERMISSIONS.INVOICE.CREATE, PERMISSIONS.INVOICE.UPDATE]);
   */
  canAny(permissions: Permission[]): ReturnType<typeof computed<boolean>> {
    return computed(() => {
      this.permissions();
      return this.hasAnyPermission(permissions);
    });
  }

  /**
   * Returns a computed Signal<boolean> — true only if user has ALL permissions.
   *
   * @example
   *   readonly canFullEdit = inject(PermissionService)
   *     .canAll([PERMISSIONS.PAYMENT.CREATE, PERMISSIONS.PAYMENT.UPDATE]);
   */
  canAll(permissions: Permission[]): ReturnType<typeof computed<boolean>> {
    return computed(() => {
      this.permissions();
      return this.hasAllPermissions(permissions);
    });
  }

  // ── Route guard helper ────────────────────────────────────────────

  /**
   * Call from functional route guards. Handles both unauthenticated
   * and unauthorized cases with appropriate redirects.
   *
   * @example
   *   export const invoiceGuard: CanActivateFn = () =>
   *     inject(PermissionService).guardRoute(PERMISSIONS.INVOICE.READ);
   */
  guardRoute(
    permissions: Permission | Permission[],
    mode: PermissionMode = 'any',
    redirectUrl = '/unauthorized'
  ): boolean {
    if (!this.isAuth()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return false;
    }
    const allowed = this.check(permissions, mode);
    if (!allowed) this.router.navigate([redirectUrl]);
    return allowed;
  }
}
