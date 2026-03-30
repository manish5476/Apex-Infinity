import {
  Directive,
  Input,
  ElementRef,
  Renderer2,
  OnInit,
  OnChanges,
  effect,
  inject,
} from '@angular/core';
import { PermissionService } from '../services/permission.service';
import { Permission, PermissionMode } from '../permissions.constants';

/**
 * disableIfNoPermission attribute directive
 * Adds `disabled` attribute + `permission-disabled` CSS class
 * when the user lacks the required permission(s).
 * Works on buttons, inputs, selects, anchors, or any element.
 *
 * ─── Usage examples ───────────────────────────────────────────────
 *
 * Disable a button:
 *   <button [disableIfNoPermission]="'invoice:delete'">Delete</button>
 *
 * Disable with multiple permissions (any):
 *   <button [disableIfNoPermission]="['product:create', 'product:update']">Save</button>
 *
 * Disable with all-mode:
 *   <button
 *     [disableIfNoPermission]="['payment:create', 'payment:update']"
 *     disableIfNoPermissionMode="all">
 *     Submit Payment
 *   </button>
 *
 * ──────────────────────────────────────────────────────────────────
 */
@Directive({
  selector: '[disableIfNoPermission]',
  standalone: true,
})
export class DisableIfNoPermissionDirective implements OnInit, OnChanges {
  @Input('disableIfNoPermission')
  permission!: Permission | Permission[];

  @Input('disableIfNoPermissionMode')
  mode: PermissionMode = 'any';

  private readonly permSvc = inject(PermissionService);
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  constructor() {
    effect(() => {
      this.permSvc.permissions();
      this._applyState();
    });
  }

  ngOnInit(): void { this._applyState(); }
  ngOnChanges(): void { this._applyState(); }

  private _applyState(): void {
    const list = Array.isArray(this.permission) ? this.permission : [this.permission];
    const allowed = this.permSvc.check(list, this.mode);
    const el = this.el.nativeElement;

    if (allowed) {
      this.renderer.removeAttribute(el, 'disabled');
      this.renderer.removeClass(el, 'permission-disabled');
      this.renderer.removeStyle(el, 'pointer-events');
      this.renderer.removeStyle(el, 'opacity');
      el.removeAttribute('title'); // remove tooltip if set by this directive
    } else {
      this.renderer.setAttribute(el, 'disabled', 'true');
      this.renderer.addClass(el, 'permission-disabled');
      this.renderer.setStyle(el, 'pointer-events', 'none');
      this.renderer.setStyle(el, 'opacity', '0.45');
      this.renderer.setAttribute(el, 'title', "You don't have permission for this action");
    }
  }
}
