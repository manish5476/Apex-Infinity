
import { Injectable, inject, Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Resolve, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../../modules/auth/services/auth-service';

@Injectable({ providedIn: 'root' })
export class AuthResolver implements Resolve<boolean> {
  private readonly injector = inject(Injector);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  resolve(): Observable<boolean> {
    return toObservable(this.authService.isAuthenticated, { injector: this.injector }).pipe(
      take(1),
      map((isAuthed) => {
        if (isAuthed) return true;
        this.router.navigate(['/auth/login']);
        return false;
      })
    );
  }
}