import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';

export interface Confirmation {
  message: string;
  header?: string;
  icon?: string;
  acceptLabel?: string;
  rejectLabel?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private confirmationState = new BehaviorSubject<Confirmation | null>(null);
  private result = new Subject<boolean>();

  get state$(): Observable<Confirmation | null> {
    return this.confirmationState.asObservable();
  }

  confirm(confirmation: Confirmation): Observable<boolean> {
    this.confirmationState.next({
      ...confirmation,
      header: confirmation.header || 'Confirm Action',
      icon: confirmation.icon || 'pi pi-exclamation-triangle',
      acceptLabel: confirmation.acceptLabel || 'Yes, proceed',
      rejectLabel: confirmation.rejectLabel || 'Cancel'
    });

    return this.result.asObservable().pipe(take(1));
  }

  private respond(accepted: boolean): void {
    this.confirmationState.next(null); // Hide the dialog
    this.result.next(accepted);
  }

  accept(): void {
    this.respond(true);
  }

  reject(): void {
    this.respond(false);
  }
}
