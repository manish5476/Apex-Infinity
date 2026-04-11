import { Component, Input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../services/customer-service';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-customer-feed',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  template: `
    <div class="feed-card premium-card">
      <!-- ════════ HEADER ════════ -->
      <div class="feed-header">
        <div class="header-title">
          <div class="header-icon"><i class="pi pi-history"></i></div>
          <h3>Customer Activity Feed</h3>
        </div>
        <div class="badge-mono">{{ feedItems.length }} Activities</div>
      </div>

      <!-- ════════ SCROLLABLE CONTENT ════════ -->
      <div class="feed-body">
        @if (loading) {
          <div class="feed-loading">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Synchronizing history...</span>
          </div>
        } @else if (feedItems.length === 0) {
          <div class="empty-state">
            <div class="empty-glyph"><i class="pi pi-inbox"></i></div>
            <p>No recent activity found for this account.</p>
          </div>
        } @else {
          <!-- This area handles the scrolling -->
          <div class="feed-scroll-area custom-scrollbar">
            <div class="timeline-container">
              @for (item of feedItems; track item.id || $index; let i = $index) {
                <div class="timeline-item reveal" [style.--delay]="(i * 50) + 'ms'">
                  
                  <!-- Left Side: Icon & Line -->
                  <div class="timeline-visual">
                    <div class="icon-circle" [ngClass]="getIconClass(item.type)">
                      <i [class]="'pi pi-' + getPrimeIcon(item.icon)"></i>
                    </div>
                    <div class="connector-line"></div>
                  </div>

                  <!-- Right Side: Content -->
                  <div class="timeline-content">
                    <div class="content-header">
                      <h4 class="item-title">{{ item.title }}</h4>
                      <time class="item-date">{{ item.date | date:'MMM d, h:mm a' }}</time>
                    </div>
                    
                    <p class="item-subtitle">{{ item.subtitle }}</p>
                    
                    <div class="item-footer">
                      <span class="status-pill" [ngClass]="getStatusColor(item.status)">
                        <span class="dot"></span>
                        {{ item.status }}
                      </span>
                    </div>
                  </div>

                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    /* ══════════════════════════════════════════════════════
       FEED CARD - BILLION DOLLAR UI
    ══════════════════════════════════════════════════════ */
    :host {
      display: block;
      height: 100%;
    }

    .feed-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    /* ── HEADER ── */
    .feed-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-secondary);
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
      flex-shrink: 0;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .header-icon {
      width: 32px; height: 32px;
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
      color: var(--accent-primary);
      border-radius: var(--ui-border-radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
    }

    .header-title h3 {
      margin: 0;
      font-family: var(--font-heading);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }

    .badge-mono {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      padding: 4px 10px;
      border-radius: var(--ui-border-radius-pill);
      color: var(--text-secondary);
    }

    /* ── BODY & SCROLLING ── */
    .feed-body {
      flex: 1;
      overflow: hidden; /* Important: containment for the scroll area */
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      position: relative;
    }

    .feed-scroll-area {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-xl);
      max-height: 600px; /* Adjust height here or let it fill parent */
    }

    /* ── TIMELINE ── */
    .timeline-container {
      display: flex;
      flex-direction: column;
    }

    .timeline-item {
      display: flex;
      gap: var(--spacing-lg);
      position: relative;
      animation: revealItem 0.4s ease forwards;
      animation-delay: var(--delay);
      opacity: 0;
    }

    @keyframes revealItem {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .timeline-visual {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
    }

    .icon-circle {
      width: 36px; height: 36px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      z-index: 2;
      box-shadow: 0 0 0 4px var(--bg-primary);
      border: 1px solid currentColor;
    }

    .connector-line {
      flex: 1;
      width: 2px;
      background: var(--border-secondary);
      margin: 4px 0;
      z-index: 1;
    }

    .timeline-item:last-child .connector-line {
      display: none;
    }

    .timeline-content {
      flex: 1;
      padding-bottom: var(--spacing-2xl);
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-md);
      margin-bottom: 4px;
    }

    .item-title {
      margin: 0;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }

    .item-date {
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--text-tertiary);
      white-space: nowrap;
    }

    .item-subtitle {
      margin: 0 0 8px 0;
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      line-height: 1.5;
    }

    /* ── STATUS PILLS ── */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 10px;
      border-radius: var(--ui-border-radius-pill);
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-width: 1px;
      border-style: solid;
    }

    .status-pill .dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

    .st-success { 
      background: var(--color-success-bg); 
      color: var(--color-success-dark); 
      border-color: var(--color-success-border); 
    }
    .st-info { 
      background: var(--color-info-bg); 
      color: var(--color-info-dark); 
      border-color: var(--color-info-border); 
    }
    .st-warning { 
      background: var(--color-warning-bg); 
      color: var(--color-warning-dark); 
      border-color: var(--color-warning-border); 
    }
    .st-error { 
      background: var(--color-error-bg); 
      color: var(--color-error-dark); 
      border-color: var(--color-error-border); 
    }

    /* ── TYPE SPECIFIC COLORS ── */
    .type-payment { color: var(--color-success); background: var(--color-success-bg); }
    .type-invoice { color: var(--color-info); background: var(--color-info-bg); }
    .type-returned { color: var(--color-error); background: var(--color-error-bg); }

    /* ── SCROLLBAR ── */
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { 
      background: var(--border-secondary); 
      border-radius: 10px; 
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }

    .feed-loading, .empty-state {
      padding: 60px 20px;
      text-align: center;
      color: var(--text-tertiary);
    }
    .feed-loading i { font-size: 24px; margin-bottom: 12px; display: block; }
    .empty-glyph { font-size: 40px; margin-bottom: 16px; opacity: 0.5; }
  `]
})
export class CustomerFeedComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @Input() customerId!: string;
  feedItems: any[] = [];
  loading = false;

  constructor(private customerService: CustomerService) { }

  ngOnInit(): void {
    if (this.customerId) {
      this.loadFeed();
    }
  }

  loadFeed() {
    this.loading = true;
    this.customerService.getCustomerFeed(this.customerId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.feedItems = res.data.feed;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  getIconClass(type: string): string {
    return `type-${type.toLowerCase()}`;
  }

  // Maps Lucide icon names to PrimeIcons
  getPrimeIcon(icon: string): string {
    switch (icon) {
      case 'file-text': return 'file-edit';
      case 'dollar-sign': return 'wallet';
      case 'refresh-ccw': return 'replay';
      default: return 'bell';
    }
  }

  getStatusColor(status: string): string {
    const s = status.toLowerCase();
    if (['completed', 'paid', 'success'].includes(s)) return 'st-success';
    if (['issued', 'active', 'processed'].includes(s)) return 'st-info';
    if (['pending', 'waiting'].includes(s)) return 'st-warning';
    if (['returned', 'cancelled', 'failed'].includes(s)) return 'st-error';
    return '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
// import { Component, Input, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { CustomerService } from '../../services/customer-service';
// import { Subject } from "rxjs";
// import { takeUntil } from "rxjs/operators";

// @Component({
//   selector: 'app-customer-feed',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './customer-feed.html',
//   styleUrls: ['./customer-feed.scss']
// })
// export class CustomerFeedComponent implements OnInit, OnDestroy {
//     private readonly destroy$ = new Subject<void>();
//   @Input() customerId!: string;
//   feedItems: any[] = [];
//   loading = false;

//   constructor(private customerService: CustomerService) { }

//   ngOnInit(): void {
//     if (this.customerId) {
//       this.loadFeed();
//     }
//   }

//   loadFeed() {
//     this.loading = true;
//     this.customerService.getCustomerFeed(this.customerId).pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res) => {
//         this.feedItems = res.data.feed;
//         this.loading = false;
//       },
//       error: () => this.loading = false
//     });
//   }

//   // Helper for dynamic Icon Backgrounds based on activity type
//   getIconBg(type: string): string {
//     switch (type) {
//       case 'payment': return 'bg-success/10 text-success';
//       case 'invoice': return 'bg-info/10 text-info';
//       case 'note': return 'bg-warning/10 text-warning';
//       default: return 'bg-base-200 text-base-content';
//     }
//   }

//   // Helper for Status Badge colors
//   getStatusClass(status: string): string {
//     const s = status.toLowerCase();
//     if (s === 'completed' || s === 'issued') return 'badge-success';
//     if (s === 'pending') return 'badge-warning';
//     if (s === 'cancelled') return 'badge-error';
//     return 'badge-ghost';
//   }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//     }
// }
