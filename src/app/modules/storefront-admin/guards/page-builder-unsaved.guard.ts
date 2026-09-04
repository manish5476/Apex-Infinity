import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';

export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Observable<boolean> | Promise<boolean>;
}

/**
 * pageBuilderUnsavedGuard
 *
 * Prevents accidental navigation away from the page builder when there are
 * unsaved draft changes.
 */
export const pageBuilderUnsavedGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (component && typeof component.canDeactivate === 'function') {
    return component.canDeactivate();
  }
  return true;
};
