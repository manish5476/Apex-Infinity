import {
  Directive, Input, TemplateRef, ViewContainerRef,
  OnInit, OnChanges, effect, inject,
} from '@angular/core';
import { PermissionService } from '../services/permission.service';

/**
 * *hasRole structural directive
 * Shows/hides content based on the user's role name or owner/superAdmin status.
 *
 * ─── Usage examples ───────────────────────────────────────────────
 *
 * Show only for owners:
 *   <div *hasRole="'owner'">...</div>
 *
 * Show only for superAdmins:
 *   <div *hasRole="'superAdmin'">...</div>
 *
 * Show for a specific named role:
 *   <div *hasRole="'Branch Manager'">...</div>
 *
 * Show for multiple roles (any match):
 *   <div *hasRole="['HR Manager', 'Admin']">...</div>
 *
 * ──────────────────────────────────────────────────────────────────
 * For granular feature access, prefer *hasPermission over *hasRole.
 * *hasRole is for coarse-grained UI decisions (e.g. showing an entire
 * admin section vs a specific action button).
 */
@Directive({
  selector: '[hasRole]',
  standalone: true,
})
export class HasRoleDirective implements OnInit, OnChanges {
  @Input('hasRole')
  role!: string | string[];

  @Input('hasRoleElse')
  elseTemplate?: TemplateRef<unknown>;

  private readonly permSvc = inject(PermissionService);
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private _hasView = false;
  private _hasElse = false;

  constructor() {
    effect(() => {
      this.permSvc.user(); // reactive dependency
      this._update();
    });
  }

  ngOnInit(): void { this._update(); }
  ngOnChanges(): void { this._update(); }

  private _update(): void {
    const allowed = this._check();
    if (allowed && !this._hasView) {
      this.vcr.clear();
      this.vcr.createEmbeddedView(this.tpl);
      this._hasView = true; this._hasElse = false;
    } else if (!allowed && !this._hasElse) {
      this.vcr.clear();
      if (this.elseTemplate) this.vcr.createEmbeddedView(this.elseTemplate);
      this._hasElse = true; this._hasView = false;
    }
  }

  private _check(): boolean {
    const roles = Array.isArray(this.role) ? this.role : [this.role];
    return roles.some(r => {
      if (r === 'owner') return this.permSvc.isOwner();
      if (r === 'superAdmin') return this.permSvc.isSuperAdmin();
      return this.permSvc.roleName() === r;
    });
  }
}
