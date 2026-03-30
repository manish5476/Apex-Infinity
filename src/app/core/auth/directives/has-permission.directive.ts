import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  effect,
  inject,
} from '@angular/core';
import { PermissionService } from '../services/permission.service';
import { Permission, PermissionMode } from '../permissions.constants';

/**
 * Structural directive: show template only if the user has the required permission(s).
 *
 * Supported syntax (equivalent):
 *   *hasPermission="PERMISSIONS.INVOICE.READ"
 *   *permission="PERMISSIONS.INVOICE.READ"
 *
 * Multiple (any): *hasPermission="[p1, p2]"
 * All required:    *hasPermission="[p1, p2]; hasPermissionMode: 'all'"
 *                 *permission="[p1, p2]; permissionMode: 'all'"
 */
@Directive({
  selector: '[hasPermission],[permission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit {
  private _permission?: Permission | Permission[];
  private _mode: PermissionMode = 'any';
  private _elseTemplate?: TemplateRef<unknown>;

  @Input('hasPermission')
  set hasPermissionInput(value: Permission | Permission[] | undefined) {
    this._permission = value;
    this._updateView();
  }

  /** Alias for *permission / microsyntax compatibility */
  @Input('permission')
  set permissionInput(value: Permission | Permission[] | undefined) {
    this._permission = value;
    this._updateView();
  }

  @Input('hasPermissionMode')
  set hasPermissionModeInput(value: PermissionMode | undefined) {
    this._mode = value ?? 'any';
    this._updateView();
  }

  @Input('permissionMode')
  set permissionModeInput(value: PermissionMode | undefined) {
    this._mode = value ?? 'any';
    this._updateView();
  }

  @Input('hasPermissionElse')
  set hasPermissionElseInput(value: TemplateRef<unknown> | undefined) {
    this._elseTemplate = value;
    this._updateView();
  }

  @Input('permissionElse')
  set permissionElseInput(value: TemplateRef<unknown> | undefined) {
    this._elseTemplate = value;
    this._updateView();
  }

  private readonly permSvc = inject(PermissionService);
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);

  private _hasView = false;
  private _hasElseView = false;

  constructor() {
    effect(() => {
      this.permSvc.permissions();
      this._updateView();
    });
  }

  ngOnInit(): void {
    this._updateView();
  }

  private _updateView(): void {
    const raw = this._permission;
    if (raw === undefined || raw === null) {
      return;
    }

    const list = Array.isArray(raw) ? raw : [raw];
    const allowed = this.permSvc.check(list, this._mode);

    if (allowed) {
      if (!this._hasView) {
        this.vcr.clear();
        this.vcr.createEmbeddedView(this.tpl);
        this._hasView = true;
        this._hasElseView = false;
      }
    } else {
      if (!this._hasElseView) {
        this.vcr.clear();
        if (this._elseTemplate) {
          this.vcr.createEmbeddedView(this._elseTemplate);
          this._hasElseView = true;
        }
        this._hasView = false;
      }
    }
  }
}
