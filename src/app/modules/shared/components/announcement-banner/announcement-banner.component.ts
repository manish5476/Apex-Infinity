import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
// ✅ UPDATE: Import SocketService and unified Interface
import { SocketService, NotificationData } from '../../../../core/services/socket.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-announcement-banner',
  standalone: true,
  imports: [CommonModule, ToastModule],
  template: `
    <p-toast position="top-right" key="announcement" [baseZIndex]="9999">
      <ng-template let-message pTemplate="headless" let-closeFn="closeFn">
        
        <section class="announcement-card" [ngClass]="message.data.type || 'info'">
          
          <div class="icon-wrapper">
            <i class="pi" [ngClass]="getIcon(message.data.type)"></i>
          </div>

          <div class="content-wrapper">
            <h3 class="title">{{ message.summary }}</h3>
            <p class="desc">{{ message.detail }}</p>
            <span class="time">Just now</span>
          </div>

          <button class="close-btn" (click)="closeFn($event)">
            <i class="pi pi-times"></i>
          </button>
          
        </section>
      </ng-template>
    </p-toast>
  `,
  styles: `
    /* --- VARS FOR EASY THEME CHANGES --- */
    $info-color: #3b82f6;    // Blue
    $success-color: #10b981; // Emerald
    $warn-color: #f59e0b;    // Amber
    $urgent-color: #ef4444;  // Red

    .announcement-card {
      width: 100%;
      min-width: 350px;
      max-width: 400px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: flex-start;
      padding: 1rem;
      gap: 1rem;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.5);
      transition: transform 0.2s ease;
      pointer-events: auto; /* Ensure clicks work */

      /* --- LEFT BORDER STRIP --- */
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 6px; 
        background: $info-color; /* Default */
      }

      /* --- TYPE VARIANTS --- */
      &.info {
        &::before { background: $info-color; }
        .icon-wrapper { background: rgba($info-color, 0.1); color: $info-color; }
      }

      &.success {
        &::before { background: $success-color; }
        .icon-wrapper { background: rgba($success-color, 0.1); color: $success-color; }
      }

      &.warning {
        &::before { background: $warn-color; }
        .icon-wrapper { background: rgba($warn-color, 0.1); color: $warn-color; }
      }

      &.urgent, &.error { /* Map 'urgent' or 'error' to Red */
        &::before { background: $urgent-color; }
        .icon-wrapper { background: rgba($urgent-color, 0.1); color: $urgent-color; }
        animation: pulse-red 2s infinite;
      }
    }

    .icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      i { font-size: 1.25rem; }
    }

    .content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.2;
      }

      .desc {
        margin: 0;
        font-size: 0.85rem;
        color: #64748b;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .time {
        font-size: 0.7rem;
        color: #94a3b8;
        margin-top: 0.25rem;
      }
    }

    .close-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      padding: 4px;
      border-radius: 50%;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: rgba(0,0,0,0.05);
        color: #1e293b;
      }
    }

    @keyframes pulse-red {
      0% { box-shadow: 0 0 0 0 rgba($urgent-color, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba($urgent-color, 0); }
      100% { box-shadow: 0 0 0 0 rgba($urgent-color, 0); }
    }
  `
})
export class AnnouncementListenerComponent implements OnInit, OnDestroy {
  // ✅ Inject SocketService
  private socketService = inject(SocketService);
  private messageService = inject(MessageService);
  private subscription: Subscription | null = null;

  ngOnInit() {
    // ✅ Subscribe to the unified announcement stream
    this.subscription = this.socketService.announcement$.subscribe((announcement: any) => {
      // Cast to NotificationData if needed, but 'any' is safe here since we just pass it to toast
      this.showToast(announcement);
      this.playNotificationSound();
    });
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  showToast(ann: NotificationData) {
    this.messageService.add({
      key: 'announcement',
      severity: 'custom', 
      summary: ann.title,
      detail: ann.message,
      data: ann, 
      sticky: ann.type === 'urgent' || ann.type === 'error',
      life: 6000
    });
  }

  getIcon(type: string | undefined): string {
    switch (type) {
      case 'urgent': 
      case 'error': return 'pi-megaphone';
      case 'warning': return 'pi-exclamation-triangle';
      case 'success': return 'pi-verified';
      default: return 'pi-bell';
    }
  }

  playNotificationSound() {
    try {
      const audio = new Audio('assets/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => { });
    } catch (e) { }
  }
}

