import { Pipe, PipeTransform, inject } from '@angular/core';
import { PermissionService } from '../services/permission.service';
import { Permission, PermissionMode } from '../permissions.constants';

/**
 * hasPermission pipe — use in template expressions where a structural
 * directive isn't ergonomic (e.g., ngClass, routerLinkActive, *ngIf
 * with a complex condition).
 *
 * ─── Usage examples ───────────────────────────────────────────────
 *
 * Boolean in *ngIf:
 *   *ngIf="'invoice:read' | hasPermission"
 *
 * Dynamic class:
 *   [class.hidden]="!('analytics:read' | hasPermission)"
 *
 * Multiple (any):
 *   *ngIf="['product:create','product:update'] | hasPermission"
 *
 * Multiple (all):
 *   *ngIf="['payment:create','payment:update'] | hasPermission:'all'"
 *
 * ──────────────────────────────────────────────────────────────────
 *
 * NOTE: Angular pipes are pure by default — they won't re-run when
 * permissions change mid-session unless permissions is part of the
 * change detection cycle. For reactive updates, prefer the directive
 * or use the PermissionService signal directly.
 */
@Pipe({
  name: 'hasPermission',
  standalone: true,
  pure: false, // impure so it re-evaluates on any CD cycle
})
export class HasPermissionPipe implements PipeTransform {
  private readonly permSvc = inject(PermissionService);

  transform(
    permission: Permission | Permission[],
    mode: PermissionMode = 'any'
  ): boolean {
    const list = Array.isArray(permission) ? permission : [permission];
    return this.permSvc.check(list, mode);
  }
}
