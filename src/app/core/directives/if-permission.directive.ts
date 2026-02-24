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

  @Input() set ifPermission(input: string | string[]) {
    this.viewContainer.clear();

    // Directly use the string tags since we don't have the PERMISSIONS config object
    const check = (tag: string) => this.auth.hasPermission(tag);

    const hasAccess = Array.isArray(input) 
      ? input.some(check) 
      : check(input);

    if (hasAccess) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}