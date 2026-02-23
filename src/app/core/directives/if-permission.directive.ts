// src/app/core/directives/if-permission.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../../modules/auth/services/auth-service';

@Directive({
  selector: '[ifPermission]',
  standalone: true
})
export class IfPermissionDirective {
  private auth = inject(AuthService);
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);

  @Input() set ifPermission(permission: string | string[]) {
    this.viewContainer.clear();

    const hasAccess = Array.isArray(permission) 
      ? this.auth.hasAnyPermission(permission) 
      : this.auth.hasPermission(permission);

    if (hasAccess) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
