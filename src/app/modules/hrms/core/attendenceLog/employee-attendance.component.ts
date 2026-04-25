import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

// Services
import { MessageService } from 'primeng/api';
import { AppMessageService } from '@core/services/message.service';
import { HRMSService } from '../../hrms.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TimelineModule } from 'primeng/timeline';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-employee-attendance',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TimelineModule,
    SkeletonModule,
    TagModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>
    
    <div class="attendance-dashboard">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-icon">
          <i class="pi pi-clock"></i>
        </div>
        <div class="header-content">
          <h1>Time & Attendance</h1>
          <p>Record your daily attendance and track your working hours.</p>
        </div>
      </header>

      <!-- Main Content Grid (Bento Layout) -->
      <div class="bento-grid">
        
        <!-- Left Column (Actions & Stats) -->
        <div class="left-column">
          
          <!-- Clock & Actions Card -->
          <div class="bento-card main-action-card">
            <div class="clock-section">
              <div class="time-display">{{ currentTime() | date:'HH:mm:ss' }}</div>
              <div class="date-display">{{ currentTime() | date:'EEEE, dd MMM yyyy' }}</div>
            </div>

            <div class="status-section">
              @if (currentStatus() === 'in') {
                <div class="status-ring ring-in">
                  <div class="pulse"></div>
                  <i class="pi pi-sign-in"></i>
                </div>
                <div class="status-text text-in">Currently Clocked In</div>
                <div class="status-subtext">Since {{ lastPunchTime() | date:'HH:mm' }}</div>
              } @else if (currentStatus() === 'break') {
                <div class="status-ring ring-break">
                  <div class="pulse"></div>
                  <i class="pi pi-coffee"></i>
                </div>
                <div class="status-text text-break">On Break</div>
              } @else {
                <div class="status-ring ring-out">
                  <i class="pi pi-sign-out"></i>
                </div>
                <div class="status-text text-out">Currently Clocked Out</div>
              }
            </div>

            <div class="action-buttons">
              @if (currentStatus() === 'out') {
                <button class="btn-primary btn-in" [class.loading]="isPunching()" (click)="performPunch('in')">
                  <i class="pi pi-sign-in" *ngIf="!isPunching()"></i>
                  <i class="pi pi-spinner pi-spin" *ngIf="isPunching()"></i>
                  Punch In
                </button>
              } @else {
                <button class="btn-primary btn-out" [class.loading]="isPunching()" (click)="performPunch('out')">
                  <i class="pi pi-sign-out" *ngIf="!isPunching()"></i>
                  <i class="pi pi-spinner pi-spin" *ngIf="isPunching()"></i>
                  Punch Out
                </button>
              }
              
              <div class="secondary-actions">
                @if (currentStatus() === 'in') {
                  <button class="btn-secondary btn-break" [class.loading]="isPunching()" (click)="performPunch('break_start')">
                    <i class="pi pi-coffee" *ngIf="!isPunching()"></i> Start Break
                  </button>
                } @else if (currentStatus() === 'break') {
                  <button class="btn-secondary btn-break" [class.loading]="isPunching()" (click)="performPunch('break_end')">
                    <i class="pi pi-play" *ngIf="!isPunching()"></i> End Break
                  </button>
                } @else {
                  <button class="btn-secondary btn-remote" [class.loading]="isPunching()" (click)="performPunch('remote_in')">
                    <i class="pi pi-globe" *ngIf="!isPunching()"></i> Remote In
                  </button>
                }
              </div>
            </div>

            <div class="location-badge" [class.acquired]="hasLocation()">
              <i class="pi" [ngClass]="hasLocation() ? 'pi-map-marker' : 'pi-compass pi-spin'"></i>
              <span>{{ hasLocation() ? 'Location Acquired' : 'Acquiring Location...' }}</span>
            </div>
          </div>

          <!-- Stats Card -->
          <div class="bento-card stats-card">
            <div class="stat-box border-right">
              <span class="stat-label">Total Hours</span>
              <div class="stat-value text-primary">
                {{ summaryStats()?.totalHours || '0.0' }}<span class="stat-unit">h</span>
              </div>
            </div>
            <div class="stat-box">
              <span class="stat-label">Break Time</span>
              <div class="stat-value text-warning">
                {{ summaryStats()?.breakHours || '0.0' }}<span class="stat-unit">h</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column (Timeline) -->
        <div class="right-column">
          <div class="bento-card timeline-card">
            <div class="card-header">
              <div class="header-title">
                <div class="icon-wrapper"><i class="pi pi-list"></i></div>
                <h3>Today's Activity</h3>
              </div>
            </div>
            
            <div class="timeline-container">
              @if (isLoadingLogs()) {
                <div class="skeleton-wrapper">
                  <p-skeleton height="80px" borderRadius="12px" styleClass="mb-3"></p-skeleton>
                  <p-skeleton height="80px" borderRadius="12px" styleClass="mb-3"></p-skeleton>
                  <p-skeleton height="80px" borderRadius="12px"></p-skeleton>
                </div>
              } @else {
                <p-timeline [value]="myLogs()" styleClass="modern-timeline">
                  <ng-template pTemplate="marker" let-log>
                    <div class="timeline-marker" [ngClass]="getMarkerClass(log.type)">
                      <i [ngClass]="getLogIcon(log.type)"></i>
                    </div>
                  </ng-template>
                  
                  <ng-template pTemplate="content" let-log>
                    <div class="timeline-content-box">
                      <div class="content-header">
                        <span class="log-type">{{ formatType(log.type) }}</span>
                        <span class="log-time">{{ log.timestamp | date:'HH:mm:ss' }}</span>
                      </div>
                      <div class="content-details">
                        <span class="detail-item source"><i class="pi pi-desktop"></i> {{ log.source }}</span>
                        @if (log.location?.address) {
                          <span class="detail-item location" [pTooltip]="log.location.address" tooltipPosition="top">
                            <i class="pi pi-map-marker"></i> {{ log.location.address }}
                          </span>
                        }
                        @if (log.processingStatus === 'flagged') {
                          <span class="detail-item flagged">FLAGGED</span>
                        }
                      </div>
                    </div>
                  </ng-template>
                </p-timeline>
                
                @if (myLogs().length === 0) {
                  <div class="empty-state">
                    <div class="empty-icon"><i class="pi pi-inbox"></i></div>
                    <h4>No Activity Yet</h4>
                    <p>Your punches for today will appear here.</p>
                  </div>
                }
              }
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* Master Container */
    .attendance-dashboard {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
      font-family: var(--font-body, 'Inter', sans-serif);
      color: var(--text-color, #333);
      height: 100%;
      overflow-y: auto;
      box-sizing: border-box;
    }

    /* Header */
    .dashboard-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      padding: 1.25rem 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      margin-bottom: 1.5rem;
      animation: slideDown 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    :host-context(body.dark-mode) .dashboard-header {
      background: rgba(30, 30, 30, 0.6);
      border-color: rgba(255, 255, 255, 0.05);
    }

    .header-icon {
      width: 3rem;
      height: 3rem;
      background: linear-gradient(135deg, var(--primary-color, #4361ee), color-mix(in srgb, var(--primary-color, #4361ee) 70%, black));
      color: white;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      box-shadow: 0 8px 16px color-mix(in srgb, var(--primary-color, #4361ee) 25%, transparent);
    }

    .header-content h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-color, #1f2937);
      letter-spacing: -0.02em;
    }

    .header-content p {
      margin: 0.25rem 0 0;
      font-size: 0.85rem;
      color: var(--text-color-secondary, #6b7280);
    }

    /* Bento Grid */
    .bento-grid {
      display: grid;
      grid-template-columns: 1fr 1.3fr;
      gap: 1.5rem;
      align-items: start;
    }

    .left-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .bento-card {
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 1.25rem;
      padding: 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      animation: popIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }

    :host-context(body.dark-mode) .bento-card {
      background: rgba(30, 30, 30, 0.6);
      border-color: rgba(255, 255, 255, 0.05);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .bento-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.06);
    }

    /* Main Action Card */
    .main-action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      animation-delay: 0.05s;
      position: relative;
      overflow: hidden;
    }

    .main-action-card::before {
      content: '';
      position: absolute;
      top: -50%; left: -50%;
      width: 200%; height: 200%;
      background: radial-gradient(circle at center, color-mix(in srgb, var(--primary-color, #4361ee) 3%, transparent) 0%, transparent 60%);
      pointer-events: none;
    }

    /* Clock */
    .clock-section {
      text-align: center;
      margin-bottom: 2rem;
    }

    .time-display {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 3.5rem;
      font-weight: 800;
      line-height: 1;
      color: var(--primary-color, #4361ee);
      letter-spacing: -0.05em;
      text-shadow: 0 4px 12px color-mix(in srgb, var(--primary-color, #4361ee) 15%, transparent);
    }

    .date-display {
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-color-secondary, #6b7280);
      margin-top: 0.5rem;
    }

    /* Status Ring */
    .status-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 2.5rem;
    }

    .status-ring {
      width: 5rem;
      height: 5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: white;
      position: relative;
      margin-bottom: 1rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    }

    .ring-in { background: linear-gradient(135deg, #10b981, #059669); }
    .ring-break { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .ring-out { background: linear-gradient(135deg, #6b7280, #4b5563); }

    .pulse {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border-radius: 50%;
      border: 2px solid inherit;
      animation: pulseAnim 2s infinite cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .ring-in .pulse { border-color: #10b981; }
    .ring-break .pulse { border-color: #f59e0b; }

    @keyframes pulseAnim {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(1.5); opacity: 0; }
    }

    .status-text {
      font-size: 0.95rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .text-in { color: #10b981; }
    .text-break { color: #f59e0b; }
    .text-out { color: #6b7280; }

    .status-subtext {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-color-secondary, #6b7280);
      margin-top: 0.25rem;
      font-family: monospace;
    }

    /* Actions */
    .action-buttons {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      z-index: 1;
    }

    button {
      border: none;
      border-radius: 0.75rem;
      padding: 0.875rem;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    button:disabled, button.loading {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none !important;
    }

    .btn-primary {
      color: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 1rem;
      font-size: 1.1rem;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.15);
    }
    
    .btn-primary:active {
      transform: translateY(0);
    }

    .btn-in { background: linear-gradient(135deg, #10b981, #059669); }
    .btn-out { background: linear-gradient(135deg, #ef4444, #dc2626); }

    .secondary-actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .btn-secondary {
      background: rgba(243, 244, 246, 0.8);
      color: var(--text-color, #374151);
      border: 1px solid rgba(229, 231, 235, 0.8);
    }

    :host-context(body.dark-mode) .btn-secondary {
      background: rgba(55, 65, 81, 0.6);
      color: #f3f4f6;
      border-color: rgba(75, 85, 99, 0.8);
    }

    .btn-secondary:hover {
      background: var(--surface-hover, #e5e7eb);
    }
    :host-context(body.dark-mode) .btn-secondary:hover {
      background: #4b5563;
    }

    .btn-break { color: #d97706; }
    :host-context(body.dark-mode) .btn-break { color: #fbbf24; }
    .btn-remote { color: var(--primary-color, #4361ee); }

    /* Location Badge */
    .location-badge {
      margin-top: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 2rem;
      background: rgba(243, 244, 246, 0.8);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-color-secondary, #6b7280);
      transition: all 0.3s ease;
    }

    :host-context(body.dark-mode) .location-badge {
      background: rgba(55, 65, 81, 0.6);
      color: #9ca3af;
    }

    .location-badge.acquired {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    /* Stats Card */
    .stats-card {
      display: flex;
      padding: 0;
      animation-delay: 0.1s;
    }

    .stat-box {
      flex: 1;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .border-right {
      border-right: 1px solid rgba(0, 0, 0, 0.05);
    }
    :host-context(body.dark-mode) .border-right {
      border-right-color: rgba(255, 255, 255, 0.05);
    }

    .stat-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-color-secondary, #6b7280);
      margin-bottom: 0.5rem;
    }

    .stat-value {
      font-size: 2.2rem;
      font-weight: 800;
      line-height: 1;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
    }

    .text-primary { color: var(--primary-color, #4361ee); }
    .text-warning { color: #f59e0b; }

    .stat-unit {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-color-secondary, #6b7280);
    }

    /* Timeline Card */
    .timeline-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      animation-delay: 0.15s;
    }

    .card-header {
      padding-bottom: 1.25rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    :host-context(body.dark-mode) .card-header {
      border-bottom-color: rgba(255, 255, 255, 0.05);
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .icon-wrapper {
      width: 2.25rem;
      height: 2.25rem;
      background: color-mix(in srgb, var(--primary-color, #4361ee) 10%, transparent);
      color: var(--primary-color, #4361ee);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .header-title h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-color, #1f2937);
    }

    .timeline-container {
      flex: 1;
      overflow-y: auto;
      padding-right: 0.5rem;
      max-height: 600px;
    }

    /* Custom Scrollbar for container */
    .timeline-container::-webkit-scrollbar { width: 4px; }
    .timeline-container::-webkit-scrollbar-track { background: transparent; }
    .timeline-container::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
    :host-context(body.dark-mode) .timeline-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }

    /* Timeline Overrides */
    :host ::ng-deep .modern-timeline .p-timeline-event-opposite { display: none; }
    :host ::ng-deep .modern-timeline .p-timeline-event-content { padding-left: 1.25rem; padding-bottom: 1.5rem; }
    
    .timeline-marker {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.9rem;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      border: 3px solid white;
      z-index: 1;
    }
    :host-context(body.dark-mode) .timeline-marker { border-color: #1e1e1e; }

    .marker-in { background-color: #10b981; }
    .marker-out { background-color: #ef4444; }
    .marker-break { background-color: #f59e0b; }
    .marker-remote { background-color: var(--primary-color, #4361ee); }

    .timeline-content-box {
      background: rgba(249, 250, 251, 0.7);
      border: 1px solid rgba(229, 231, 235, 0.8);
      border-radius: 0.75rem;
      padding: 1rem;
      transition: all 0.2s ease;
    }

    :host-context(body.dark-mode) .timeline-content-box {
      background: rgba(31, 41, 55, 0.5);
      border-color: rgba(55, 65, 81, 0.8);
    }

    .timeline-content-box:hover {
      background: #ffffff;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
      border-color: var(--primary-color, #4361ee);
      transform: translateY(-1px);
    }
    :host-context(body.dark-mode) .timeline-content-box:hover {
      background: #1f2937;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .log-type {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-color, #1f2937);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .log-time {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      font-weight: 700;
      background: color-mix(in srgb, var(--primary-color, #4361ee) 10%, transparent);
      color: var(--primary-color, #4361ee);
      padding: 0.2rem 0.6rem;
      border-radius: 2rem;
    }

    .content-details {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.75rem;
      color: var(--text-color-secondary, #6b7280);
      font-weight: 500;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .detail-item i {
      opacity: 0.7;
    }

    .location {
      max-width: 180px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .flagged {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      padding: 0.15rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 200px;
      color: var(--text-color-secondary, #6b7280);
      text-align: center;
    }

    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
      opacity: 0.3;
      color: var(--primary-color, #4361ee);
    }

    .empty-state h4 {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      color: var(--text-color, #1f2937);
    }

    .empty-state p {
      margin: 0;
      font-size: 0.8rem;
    }

    /* Animations */
    @keyframes slideDown {
      from { transform: translateY(-15px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes popIn {
      from { opacity: 0; transform: scale(0.97) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* Responsive */
    @media (max-width: 992px) {
      .bento-grid {
        grid-template-columns: 1fr;
      }
      .timeline-card {
        min-height: 400px;
      }
    }
  `]
})
export class EmployeeAttendanceComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  // State Signals
  currentTime = signal<Date>(new Date());
  currentStatus = signal<'in' | 'out' | 'break'>('out');
  lastPunchTime = signal<Date | null>(null);

  isPunching = signal<boolean>(false);
  isLoadingLogs = signal<boolean>(true);
  myLogs = signal<any[]>([]);
  summaryStats = signal<any>(null);

  // Geolocation
  hasLocation = signal<boolean>(false);
  currentLocation: any = null;

  private clockInterval: any;

  ngOnInit() {
    this.startClock();
    this.fetchLocation();
    this.loadMyLogs();
  }

  ngOnDestroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startClock() {
    this.clockInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  private fetchLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.hasLocation.set(true);
          this.currentLocation = {
            geoJson: {
              type: 'Point',
              coordinates: [position.coords.longitude, position.coords.latitude],
            },
            accuracy: position.coords.accuracy
          };
        },
        (error) => {
          this.hasLocation.set(false);
          console.warn('Geolocation error:', error);
        }
      );
    }
  }

  loadMyLogs() {
    this.isLoadingLogs.set(true);

    this.hrmsService.getMyLogs().pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err);
        return of({ data: { logs: [], summary: {} } });
      }),
      finalize(() => this.isLoadingLogs.set(false)), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      const logs = res?.data?.logs || [];
      this.myLogs.set(logs);
      this.summaryStats.set(res?.data?.summary || { totalHours: '0.0', breakHours: '0.0' });

      if (logs.length > 0) {
        const latest = logs[0];
        this.lastPunchTime.set(new Date(latest.timestamp));
        if (latest.type === 'in' || latest.type === 'remote_in' || latest.type === 'break_end') {
          this.currentStatus.set('in');
        } else if (latest.type === 'break_start') {
          this.currentStatus.set('break');
        } else {
          this.currentStatus.set('out');
        }
      }
    });
  }

  performPunch(type: string) {
    this.isPunching.set(true);

    const payload: any = {
      source: 'web',
      timestamp: new Date(),
      type: type
    };

    if (this.currentLocation) {
      payload.location = this.currentLocation;
    }

    this.hrmsService.createAttendanceLog(payload).pipe(
      catchError(err => {
        this.messageService.handleHttpError(err);
        return of(null);
      }),
      finalize(() => this.isPunching.set(false)), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      if (res) {
        this.messageService.showSuccess(res.message || 'Punch recorded successfully.');
        this.loadMyLogs();
      }
    });
  }

  // --- UI Helpers ---
  formatType(type: string): string {
    return type?.replace('_', ' ') || 'Unknown';
  }

  getMarkerClass(type: string): string {
    if (type?.includes('in')) return 'marker-in';
    if (type?.includes('out')) return 'marker-out';
    if (type?.includes('break')) return 'marker-break';
    return 'marker-remote';
  }

  getLogIcon(type: string): string {
    if (type?.includes('in')) return 'pi-sign-in';
    if (type?.includes('out')) return 'pi-sign-out';
    if (type?.includes('break')) return 'pi-coffee';
    return 'pi-check';
  }
}
