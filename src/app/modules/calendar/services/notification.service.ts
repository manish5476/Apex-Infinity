// calendar/services/notification.service.ts
// ─────────────────────────────────────────────────────────────────────────────
//  CalendarNotificationService — subscribes to field-service socket events
//  and translates them into CalendarStore patches + UI toasts.
//
//  This is the ONLY service that knows about both the socket AND the store.
//  Components do NOT subscribe to socket events directly.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, inject, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SocketConnectionService } from '../../../core/services/socket/socket-connection.service';
import { AppMessageService } from '../../../core/services/message.service';
import { CalendarStore } from '../store/calendar.store';
import { CalendarEventAdapter } from '../adapters/calendar-event.adapter';

@Injectable({ providedIn: 'root' })
export class CalendarNotificationService implements OnDestroy {
  private socket  = inject(SocketConnectionService);
  private store   = inject(CalendarStore);
  private adapter = inject(CalendarEventAdapter);
  private toast   = inject(AppMessageService);

  private destroy$ = new Subject<void>();
  private isActive = false;

  /**
   * Call once when the CalendarWorkspace mounts.
   * Subscribes to all field-service socket events.
   */
  start(): void {
    if (this.isActive) return;
    this.isActive = true;

    // ── Assignment created ────────────────────────────────────────────────────
    this.socket.fieldServiceAssignmentCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(payload => {
        if (payload.type === 'series') {
          // Series: append first occurrence to calendar
          const event = this.adapter.fromWorkAssignment(payload.first);
          this.store.appendEvents([event]);
          this.toast.showInfo(
            `${payload.count} recurring assignments scheduled`
          );
        } else {
          const event = this.adapter.fromWorkAssignment(payload.assignment);
          this.store.appendEvents([event]);
          this.toast.showSuccess('New work assignment created');
        }
      });

    // ── Assignment updated ────────────────────────────────────────────────────
    this.socket.fieldServiceAssignmentUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(payload => {
        if (!payload.assignment) return;
        const updated = this.adapter.fromWorkAssignment(payload.assignment);
        this.store.patchEvent(updated);
      });

    // ── Assignment completed ──────────────────────────────────────────────────
    this.socket.fieldServiceAssignmentCompleted$
      .pipe(takeUntil(this.destroy$))
      .subscribe(payload => {
        if (!payload.assignment) return;
        const updated = this.adapter.fromWorkAssignment(payload.assignment);
        this.store.patchEvent(updated);
        this.toast.showSuccess(
          `"${payload.assignment.title}" completed`
        );
      });

    // ── SLA breach ────────────────────────────────────────────────────────────
    this.socket.fieldServiceSlaBreach$
      .pipe(takeUntil(this.destroy$))
      .subscribe(payload => {
        this.toast.showError(
          `SLA breached: "${payload.title}"`
        );
        // Reload the breached event to pick up the breached flag
        // CalendarFacade will handle the reload via its refresh mechanism
      });
  }

  stop(): void {
    this.destroy$.next();
    this.isActive = false;
  }

  ngOnDestroy(): void {
    this.stop();
    this.destroy$.complete();
  }
}
