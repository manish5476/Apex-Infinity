import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
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

export interface AttendanceLogItem {
  _id: string;
  type: string;
  timestamp: string | Date;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    geoJson?: {
      type?: string;
      coordinates?: [number, number];
    };
    accuracy?: number;
  };
  processingStatus?: string;
  isCorrection?: boolean;
}

export interface PairedSessionBreak {
  start?: AttendanceLogItem;
  end?: AttendanceLogItem;
  durationMinutes: number;
}

export interface PairedAttendanceSession {
  id: string;
  date: Date;
  dateLabel: string;
  isToday: boolean;
  inPunch?: AttendanceLogItem;
  outPunch?: AttendanceLogItem;
  breaks: PairedSessionBreak[];
  status: 'active' | 'break' | 'completed' | 'out_only';
  durationHours: number;
  durationFormatted: string;
  totalBreakMinutes: number;
  logs: AttendanceLogItem[];
}

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
      <header class="dashboard-header">
        <div class="header-icon">
          <i class="pi pi-clock"></i>
        </div>
        <div class="header-content">
          <h1>Time & Attendance</h1>
          <p>Record your daily attendance and track your working hours.</p>
        </div>
      </header>
    
      <div class="bento-grid">
    
        <div class="left-column">
    
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
                  @if (!isPunching()) { <i class="pi pi-sign-in"></i> }
                  @if (isPunching()) { <i class="pi pi-spinner pi-spin"></i> }
                  Punch In
                </button>
              } @else {
                <button class="btn-primary btn-out" [class.loading]="isPunching()" (click)="performPunch('out')">
                  @if (!isPunching()) { <i class="pi pi-sign-out"></i> }
                  @if (isPunching()) { <i class="pi pi-spinner pi-spin"></i> }
                  Punch Out
                </button>
              }
    
              <div class="secondary-actions">
                @if (currentStatus() === 'in') {
                  <button class="btn-secondary" [class.loading]="isPunching()" (click)="performPunch('break_start')">
                    @if (!isPunching()) { <i class="pi pi-coffee"></i> } Start Break
                  </button>
                } @else if (currentStatus() === 'break') {
                  <button class="btn-secondary" [class.loading]="isPunching()" (click)="performPunch('break_end')">
                    @if (!isPunching()) { <i class="pi pi-play"></i> } End Break
                  </button>
                } @else {
                  <button class="btn-secondary btn-remote" [class.loading]="isPunching()" (click)="performPunch('remote_in')">
                    @if (!isPunching()) { <i class="pi pi-globe"></i> } Remote In
                  </button>
                }
              </div>
            </div>
    
            <div class="location-badge" [class.acquired]="hasLocation()">
              <i class="pi" [ngClass]="hasLocation() ? 'pi-map-marker' : 'pi-compass pi-spin'"></i>
              <span>{{ hasLocation() ? 'Location Acquired' : 'Acquiring Location...' }}</span>
            </div>
          </div>
    
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
    
        <div class="right-column">
          <div class="bento-card timeline-card">
            <div class="card-header">
              <div class="header-title">
                <div class="icon-wrapper"><i class="pi pi-calendar-check"></i></div>
                <div>
                  <h3>Daily Activity Logs</h3>
                  <p class="header-sub">Paired punch records showcasing daily in & out telemetry</p>
                </div>
              </div>
              
              <div class="header-actions">
                <div class="view-toggle-group">
                  <button
                    type="button"
                    class="view-toggle-btn"
                    [class.active]="viewMode() === 'sessions'"
                    (click)="viewMode.set('sessions')"
                    pTooltip="Unified Session Cards (In & Out paired)"
                    tooltipPosition="bottom">
                    <i class="pi pi-th-large"></i>
                    <span>Sessions</span>
                  </button>
                  <button
                    type="button"
                    class="view-toggle-btn"
                    [class.active]="viewMode() === 'stream'"
                    (click)="viewMode.set('stream')"
                    pTooltip="Raw Telemetry Timeline"
                    tooltipPosition="bottom">
                    <i class="pi pi-list"></i>
                    <span>Raw Stream</span>
                  </button>
                </div>

                <span class="meta-pill">
                  <i class="pi pi-check-circle"></i>
                  @if (viewMode() === 'sessions') {
                    {{ pairedSessions().length }} Session{{ pairedSessions().length !== 1 ? 's' : '' }}
                  } @else {
                    {{ myLogs().length }} Records
                  }
                </span>
              </div>
            </div>
    
            <!-- This container is the ONLY scrollable element in the page -->
            <div class="timeline-container">
              @if (isLoadingLogs()) {
                <div class="skeleton-wrapper">
                  <p-skeleton height="140px" borderRadius="1rem" styleClass="mb-3"></p-skeleton>
                  <p-skeleton height="140px" borderRadius="1rem" styleClass="mb-3"></p-skeleton>
                  <p-skeleton height="140px" borderRadius="1rem"></p-skeleton>
                </div>
              } @else {
                <!-- 1. PAIRED SESSIONS VIEW: Showcases both IN & OUT in the same card -->
                @if (viewMode() === 'sessions') {
                  <div class="sessions-list">
                    @for (sess of pairedSessions(); track sess.id) {
                      <div class="session-card" [class.today-card]="sess.isToday" [class.active-card]="sess.status === 'active' || sess.status === 'break'">
                        <!-- Session Header -->
                        <div class="session-header">
                          <div class="session-date-group">
                            @if (sess.isToday) {
                              <span class="pill-today">TODAY</span>
                            }
                            <span class="session-date">{{ sess.dateLabel }}</span>
                          </div>

                          <div class="session-badges">
                            @if (sess.status === 'active') {
                              <span class="status-badge active">
                                <span class="pulse-dot"></span> In Progress
                              </span>
                            } @else if (sess.status === 'break') {
                              <span class="status-badge break">
                                <i class="pi pi-coffee"></i> On Break
                              </span>
                            } @else if (sess.status === 'completed') {
                              <span class="status-badge completed">
                                <i class="pi pi-check"></i> Completed
                              </span>
                            } @else {
                              <span class="status-badge out-only">
                                Clocked Out
                              </span>
                            }

                            <span class="duration-pill">
                              <i class="pi pi-clock text-xs"></i>
                              {{ sess.durationFormatted }}
                            </span>
                          </div>
                        </div>

                        <!-- Paired Punch Grid: IN and OUT side by side in ONE card -->
                        <div class="paired-punch-grid">
                          <!-- Punch In Column -->
                          <div class="punch-box in-box">
                            <div class="box-header">
                              <span class="box-tag tag-in">
                                <i class="pi pi-sign-in"></i> PUNCH IN
                              </span>
                              @if (sess.inPunch) {
                                <span class="source-tag">{{ sess.inPunch.source || 'WEB' | uppercase }}</span>
                              }
                            </div>

                            <div class="box-time-row">
                              @if (sess.inPunch) {
                                <span class="time-large">{{ sess.inPunch.timestamp | date:'HH:mm:ss' }}</span>
                              } @else {
                                <span class="time-large text-muted">--:--:--</span>
                              }
                            </div>

                            @if (sess.inPunch) {
                              <div class="box-meta">
                                @if (sess.inPunch.ipAddress) {
                                  <div class="meta-line">
                                    <i class="pi pi-globe text-xs"></i>
                                    <span class="mono">{{ sess.inPunch.ipAddress }}</span>
                                  </div>
                                }
                                @if (formatCoords(sess.inPunch); as coords) {
                                  <div class="meta-line">
                                    <i class="pi pi-map-marker text-xs text-success"></i>
                                    <span class="mono">{{ coords }}</span>
                                  </div>
                                }
                              </div>
                            } @else {
                              <div class="box-meta text-muted text-xs">No initial check-in recorded</div>
                            }
                          </div>

                          <!-- Punch Out Column -->
                          <div class="punch-box out-box" [class.awaiting-box]="!sess.outPunch">
                            <div class="box-header">
                              <span class="box-tag tag-out">
                                <i class="pi pi-sign-out"></i> PUNCH OUT
                              </span>
                              @if (sess.outPunch) {
                                <span class="source-tag">{{ sess.outPunch.source || 'WEB' | uppercase }}</span>
                              } @else {
                                <span class="source-tag awaiting-tag">AWAITING</span>
                              }
                            </div>

                            <div class="box-time-row">
                              @if (sess.outPunch) {
                                <span class="time-large">{{ sess.outPunch.timestamp | date:'HH:mm:ss' }}</span>
                              } @else {
                                <div class="awaiting-state">
                                  <span class="live-dot"></span>
                                  <span class="awaiting-text">Shift in progress</span>
                                </div>
                              }
                            </div>

                            @if (sess.outPunch) {
                              <div class="box-meta">
                                @if (sess.outPunch.ipAddress) {
                                  <div class="meta-line">
                                    <i class="pi pi-globe text-xs"></i>
                                    <span class="mono">{{ sess.outPunch.ipAddress }}</span>
                                  </div>
                                }
                                @if (formatCoords(sess.outPunch); as coords) {
                                  <div class="meta-line">
                                    <i class="pi pi-map-marker text-xs text-danger"></i>
                                    <span class="mono">{{ coords }}</span>
                                  </div>
                                }
                              </div>
                            } @else {
                              <div class="box-meta text-muted text-xs">
                                Will record upon punch out
                              </div>
                            }
                          </div>
                        </div>

                        <!-- Breaks strip if breaks taken -->
                        @if (sess.breaks && sess.breaks.length > 0) {
                          <div class="session-breaks-strip">
                            <div class="break-strip-title">
                              <i class="pi pi-coffee text-warning"></i>
                              <span>{{ sess.breaks.length }} Break{{ sess.breaks.length > 1 ? 's' : '' }} ({{ sess.totalBreakMinutes }} min total)</span>
                            </div>
                            <div class="break-pills-list">
                              @for (b of sess.breaks; track $index) {
                                <span class="break-interval-pill">
                                  {{ b.start ? (b.start.timestamp | date:'HH:mm') : '--:--' }} &rarr; {{ b.end ? (b.end.timestamp | date:'HH:mm') : 'Now' }}
                                  ({{ b.durationMinutes }}m)
                                </span>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    }

                    @if (pairedSessions().length === 0) {
                      <div class="empty-state">
                        <div class="empty-icon"><i class="pi pi-calendar-times"></i></div>
                        <h4>No Activity Recorded Today</h4>
                        <p>Use the Punch In button to begin tracking your work shift.</p>
                      </div>
                    }
                  </div>
                }

                <!-- 2. RAW TELEMETRY TIMELINE VIEW -->
                @if (viewMode() === 'stream') {
                  <p-timeline [value]="myLogs()" styleClass="modern-timeline">
                    <ng-template pTemplate="marker" let-log>
                      <div class="timeline-marker" [ngClass]="getMarkerClass(log.type)">
                        <i [ngClass]="getLogIcon(log.type)"></i>
                      </div>
                    </ng-template>
      
                    <ng-template pTemplate="content" let-log>
                      <div class="log-surface">
                        <div class="log-header">
                          <div class="log-title">
                            <span class="log-badge" [ngClass]="getMarkerClass(log.type)">{{ formatType(log.type) }}</span>
                            <span class="log-time">{{ log.timestamp | date:'HH:mm:ss.SSS' }}</span>
                          </div>
                          <div class="log-status">
                            @if (log.processingStatus === 'processed') {
                              <span class="status-indicator processed"><i class="pi pi-check"></i> Processed</span>
                            }
                            @if (log.isCorrection) {
                              <span class="status-indicator correction"><i class="pi pi-pencil"></i> Correction</span>
                            }
                          </div>
                        </div>
                        
                        <div class="log-grid">
                          @if (log.location?.geoJson?.coordinates) {
                            <div class="data-group">
                              <span class="data-label">Coordinates</span>
                              <span class="data-value mono">
                                {{ log.location.geoJson.coordinates[1] | number:'1.4-4' }}, {{ log.location.geoJson.coordinates[0] | number:'1.4-4' }}
                                <span class="accuracy">±{{ log.location.accuracy }}m</span>
                              </span>
                            </div>
                          }
                          
                          @if (log.ipAddress) {
                            <div class="data-group">
                              <span class="data-label">Network IP</span>
                              <span class="data-value mono">{{ log.ipAddress }}</span>
                            </div>
                          }

                          <div class="data-group full-width">
                            <span class="data-label">Source & Agent</span>
                            <span class="data-value truncate" [pTooltip]="log.userAgent" tooltipPosition="top">
                              <i class="pi pi-desktop" style="font-size: 0.75rem; margin-right: 4px;"></i>
                              {{ log.source | uppercase }} &mdash; {{ log.userAgent }}
                            </span>
                          </div>
                          
                          <div class="data-group">
                            <span class="data-label">Log ID</span>
                            <span class="data-value hash">{{ log._id }}</span>
                          </div>
                        </div>
                      </div>
                    </ng-template>
                  </p-timeline>
      
                  @if (myLogs().length === 0) {
                    <div class="empty-state">
                      <div class="empty-icon"><i class="pi pi-database"></i></div>
                      <h4>No Telemetry Data</h4>
                      <p>Attendance logs and network signatures will appear here.</p>
                    </div>
                  }
                }
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       HOST & LAYOUT CONSTRAINTS
       Locked viewport: The page never scrolls; only the right container scrolls.
       ========================================================================== */
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .attendance-dashboard {
      width: 100%;
      height: 100%;
      max-height: 100%;
      padding: 1.25rem 2rem 1.25rem 4rem; /* 4rem leaves clear space for floating sidebar toggle */
      box-sizing: border-box;
      font-family: var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      background: var(--bg-primary, transparent);
      color: var(--text-primary, #1e293b);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .dashboard-header {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      background: var(--glass-bg-c, rgba(255, 255, 255, 0.85));
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--glass-border-c, rgba(226, 232, 240, 0.8));
      padding: 1rem 1.5rem;
      border-radius: 1.25rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      margin-bottom: 1.25rem;
    }

    .header-icon {
      width: 3rem;
      height: 3rem;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      border-radius: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
      flex-shrink: 0;
    }

    .header-content h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .header-content p {
      margin: 0.15rem 0 0;
      font-size: 0.875rem;
      color: #64748b;
    }

    /* ==========================================================================
       GRID SYSTEM
       ========================================================================== */
    .bento-grid {
      flex: 1;
      min-height: 0;
      height: 100%;
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 1.5rem;
      align-items: stretch;
      overflow: hidden;
    }

    .left-column {
      height: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      overflow-y: auto;
      scrollbar-width: thin;
    }

    .right-column {
      min-width: 0;
      min-height: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .bento-card {
      background: var(--component-bg);
      border: var(--ui-border-width) solid var(--component-border);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-3xl);
      box-shadow: var(--shadow-md);
      transition: var(--transition-base);
    }

    /* ==========================================================================
       CLOCK & ACTIONS (LEFT COLUMN)
       ========================================================================== */
    .main-action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .clock-section {
      text-align: center;
      margin-bottom: var(--spacing-4xl);
    }

    .time-display {
      font-family: var(--font-mono);
      font-size: var(--font-size-5xl);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-tight);
      color: var(--color-primary);
      letter-spacing: -0.05em;
    }

    .date-display {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin-top: var(--spacing-sm);
    }

    /* Status Ring */
    .status-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: var(--spacing-4xl);
    }

    .status-ring {
      width: 5.5rem;
      height: 5.5rem;
      border-radius: var(--ui-border-radius-pill);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-3xl);
      color: white;
      position: relative;
      margin-bottom: var(--spacing-xl);
      box-shadow: var(--elevation-2);
    }

    .ring-in { background: linear-gradient(135deg, var(--color-success), var(--color-success-dark)); }
    .ring-break { background: linear-gradient(135deg, var(--color-warning), var(--color-warning-dark)); }
    .ring-out { background: linear-gradient(135deg, var(--text-secondary), var(--text-muted)); }

    .pulse {
      position: absolute;
      inset: 0;
      border-radius: var(--ui-border-radius-pill);
      border: 2px solid inherit;
      animation: pulseAnim 2s infinite cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .ring-in .pulse { border-color: var(--color-success); }
    .ring-break .pulse { border-color: var(--color-warning); }

    @keyframes pulseAnim {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(1.4); opacity: 0; }
    }

    .status-text {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .text-in { color: var(--color-success); }
    .text-break { color: var(--color-warning); }
    .text-out { color: var(--text-secondary); }

    .status-subtext {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--text-muted);
      margin-top: var(--spacing-xs);
      font-family: var(--font-mono);
    }

    /* Action Buttons */
    .action-buttons {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    button {
      border: none;
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-xl);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      font-family: var(--font-body);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
      transition: var(--transition-fast);
    }

    button:disabled, button.loading {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none !important;
    }

    .btn-primary {
      color: white;
      box-shadow: var(--shadow-sm);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .btn-primary:active { transform: translateY(0); }
    .btn-in { background: var(--color-success); }
    .btn-out { background: var(--color-error); }

    .secondary-actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }

    .btn-secondary {
      background: var(--component-surface-raised);
      color: var(--text-primary);
      border: var(--ui-border-width) solid var(--component-divider);
    }
    .btn-secondary:hover { background: var(--bg-hover); }

    /* Location Badge */
    .location-badge {
      margin-top: var(--spacing-3xl);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--ui-border-radius-pill);
      background: var(--component-surface-raised);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--text-secondary);
    }
    .location-badge.acquired {
      background: var(--color-success-bg);
      color: var(--color-success);
      border: var(--ui-border-width) solid var(--color-success-border);
    }

    /* Stats Card */
    .stats-card {
      display: flex;
      padding: 0;
    }
    .stat-box {
      flex: 1;
      padding: var(--spacing-2xl);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .border-right { border-right: var(--ui-border-width) solid var(--component-divider); }
    
    .stat-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-secondary);
      margin-bottom: var(--spacing-md);
    }
    .stat-value {
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-bold);
      font-family: var(--font-mono);
      display: flex;
      align-items: baseline;
      gap: var(--spacing-xs);
    }
    .text-primary { color: var(--color-primary); }
    .text-warning { color: var(--color-warning); }
    .stat-unit { font-size: var(--font-size-sm); color: var(--text-muted); }

    /* ==========================================================================
       DATA LOGS TIMELINE (RIGHT COLUMN)
       ========================================================================== */
    .timeline-card {
      flex: 1;
      min-height: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 1.25rem 1.5rem;
    }

    .card-header {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
      gap: 1rem;
    }

    .header-title { display: flex; align-items: center; gap: 0.85rem; }
    
    .icon-wrapper {
      width: 2.25rem;
      height: 2.25rem;
      background: #eff6ff;
      color: #2563eb;
      border-radius: 0.65rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .header-title h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .header-sub {
      margin: 0;
      font-size: 0.75rem;
      color: #64748b;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    /* View Toggle */
    .view-toggle-group {
      display: flex;
      background: #f1f5f9;
      border-radius: 9999px;
      padding: 3px;
      gap: 2px;
    }

    .view-toggle-btn {
      background: transparent;
      border: none;
      padding: 5px 12px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s;
    }

    .view-toggle-btn.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }

    .meta-pill {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      white-space: nowrap;
    }

    /* THE SOLE SCROLLABLE CONTAINER */
    .timeline-container {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding-right: 0.5rem;
    }

    .timeline-container::-webkit-scrollbar { width: 6px; }
    .timeline-container::-webkit-scrollbar-track { background: #f8fafc; border-radius: 4px; }
    .timeline-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .timeline-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

    /* ==========================================================================
       PAIRED SESSION CARDS UI DESIGN
       ========================================================================== */
    .sessions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-bottom: 1rem;
    }

    .session-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.25rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
      transition: all 0.2s ease;
      position: relative;
    }

    .session-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    .session-card.today-card {
      border-left: 4px solid #3b82f6;
      background: linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%);
    }

    .session-card.active-card {
      border-color: #93c5fd;
    }

    /* Session Card Header */
    .session-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px dashed #e2e8f0;
    }

    .session-date-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .pill-today {
      background: #2563eb;
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 2px 7px;
      border-radius: 9999px;
    }

    .session-date {
      font-weight: 700;
      font-size: 0.95rem;
      color: #0f172a;
    }

    .session-badges {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
    }
    .status-badge.active { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    .status-badge.break { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .status-badge.completed { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
    .status-badge.out-only { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }

    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      animation: pulseAnim 1.5s infinite;
    }

    .duration-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #1e293b;
      background: #f1f5f9;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }

    /* Paired Punch Grid */
    .paired-punch-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .punch-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.85rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .punch-box.in-box {
      border-left: 3px solid #10b981;
    }

    .punch-box.out-box {
      border-left: 3px solid #64748b;
    }

    .punch-box.out-box:not(.awaiting-box) {
      border-left-color: #ef4444;
    }

    .punch-box.awaiting-box {
      background: #fafbfe;
      border: 1px dashed #cbd5e1;
      border-left: 3px solid #3b82f6;
    }

    .box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .box-tag {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .tag-in { color: #059669; }
    .tag-out { color: #64748b; }
    .punch-box:not(.awaiting-box) .tag-out { color: #dc2626; }

    .source-tag {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748b;
      background: #e2e8f0;
      padding: 1px 6px;
      border-radius: 4px;
    }

    .awaiting-tag {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .box-time-row {
      display: flex;
      align-items: baseline;
      min-height: 2.25rem;
    }

    .time-large {
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
    }

    .awaiting-state {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #3b82f6;
      animation: pulseAnim 1.8s infinite;
    }

    .awaiting-text {
      font-size: 0.85rem;
      font-weight: 600;
      color: #2563eb;
    }

    .box-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.72rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .meta-line {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    .mono { font-family: ui-monospace, SFMono-Regular, monospace; }

    /* Breaks Strip */
    .session-breaks-strip {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px dashed #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .break-strip-title {
      font-size: 0.72rem;
      font-weight: 600;
      color: #475569;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .break-pills-list {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .break-interval-pill {
      font-size: 0.7rem;
      font-weight: 600;
      font-family: ui-monospace, SFMono-Regular, monospace;
      background: #fef3c7;
      color: #92400e;
      padding: 2px 7px;
      border-radius: 9999px;
    }

    /* PrimeNG Timeline Overrides */
    :host ::ng-deep .modern-timeline .p-timeline-event-opposite { display: none; }
    :host ::ng-deep .modern-timeline .p-timeline-event-content { 
      padding-left: var(--spacing-2xl); 
      padding-bottom: var(--spacing-3xl); 
      width: 100%;
    }
    
    .timeline-marker {
      width: 2rem;
      height: 2rem;
      border-radius: var(--ui-border-radius-pill);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: var(--font-size-sm);
      box-shadow: var(--shadow-sm);
      border: var(--ui-border-width-lg) solid var(--component-bg);
      z-index: 1;
      margin-top: 0.25rem;
    }

    .marker-in { background-color: var(--color-success); }
    .marker-out { background-color: var(--text-secondary); }
    .marker-break { background-color: var(--color-warning); }
    .marker-remote { background-color: var(--color-primary); }

    /* Developer-Centric Log Surface */
    .log-surface {
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--component-divider);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-2xl);
      transition: var(--transition-base);
    }

    .log-surface:hover {
      border-color: var(--component-border-focus);
      box-shadow: var(--shadow-sm);
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
    }

    .log-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
    }

    .log-badge {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--ui-border-radius-sm);
      color: white;
      letter-spacing: 0.05em;
    }

    .log-time {
      font-family: var(--font-mono);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
    }

    .status-indicator {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }
    .status-indicator.processed { color: var(--color-success); }
    .status-indicator.correction { color: var(--color-warning); }

    /* Dense Data Grid Layout */
    .log-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-xl);
      background: var(--component-surface-raised);
      padding: var(--spacing-lg);
      border-radius: var(--ui-border-radius-sm);
      border: var(--ui-border-width) solid var(--component-divider);
    }

    .data-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }
    .data-group.full-width {
      grid-column: 1 / -1;
    }

    .data-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .data-value {
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
    .data-value.mono { font-family: var(--font-mono); }
    .data-value.hash { font-family: var(--font-mono); color: var(--text-muted); font-size: var(--font-size-xs); }
    
    .data-value.truncate {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      display: block;
    }

    .accuracy {
      color: var(--text-muted);
      font-size: var(--font-size-xs);
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 250px;
      color: var(--text-secondary);
      text-align: center;
    }

    .empty-icon {
      font-size: var(--font-size-4xl);
      margin-bottom: var(--spacing-lg);
      color: var(--component-divider);
    }

    .empty-state h4 {
      margin: 0 0 var(--spacing-xs);
      font-family: var(--font-heading);
      font-size: var(--font-size-lg);
      color: var(--text-primary);
    }

    .empty-state p { margin: 0; font-size: var(--font-size-sm); }

    /* Responsive adjustments */
    @media (max-width: 1200px) {
      .bento-grid { grid-template-columns: 1fr; }
      .timeline-card { min-height: 500px; }
      .left-column { flex-direction: row; flex-wrap: wrap; }
      .main-action-card, .stats-card { flex: 1 1 300px; }
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
  myLogs = signal<AttendanceLogItem[]>([]);
  summaryStats = signal<any>(null);

  // View switch: 'sessions' (paired in/out card design) vs 'stream' (raw timeline)
  viewMode = signal<'sessions' | 'stream'>('sessions');

  // Geolocation
  hasLocation = signal<boolean>(false);
  currentLocation: any = null;

  private clockInterval: any;

  /**
   * Paired Sessions Computed Signal:
   * Groups chronological punch logs into work sessions pairing Punch In & Punch Out
   * into a single unified card for clear daily activity display.
   */
  pairedSessions = computed<PairedAttendanceSession[]>(() => {
    const logs = this.myLogs();
    if (!logs || logs.length === 0) return [];

    // Sort ascending by timestamp to trace sessions chronologically
    const sorted = [...logs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const todayStr = new Date().toDateString();
    const sessions: PairedAttendanceSession[] = [];
    let currentSession: Partial<PairedAttendanceSession> | null = null;
    let currentBreak: PairedSessionBreak | null = null;

    for (const log of sorted) {
      const logDate = new Date(log.timestamp);
      const type = log.type;

      if (type === 'in' || type === 'remote_in') {
        if (currentSession) {
          finalizeSession(currentSession);
          sessions.push(currentSession as PairedAttendanceSession);
        }
        currentSession = {
          id: log._id || `sess-${logDate.getTime()}`,
          date: logDate,
          dateLabel: formatDateLabel(logDate),
          isToday: logDate.toDateString() === todayStr,
          inPunch: log,
          outPunch: undefined,
          breaks: [],
          totalBreakMinutes: 0,
          logs: [log],
          status: 'active'
        };
      } else if (type === 'break_start') {
        if (!currentSession) {
          currentSession = {
            id: log._id || `sess-${logDate.getTime()}`,
            date: logDate,
            dateLabel: formatDateLabel(logDate),
            isToday: logDate.toDateString() === todayStr,
            breaks: [],
            totalBreakMinutes: 0,
            logs: [],
            status: 'break'
          };
        }
        currentSession.logs!.push(log);
        currentBreak = { start: log, durationMinutes: 0 };
        currentSession.breaks!.push(currentBreak);
        currentSession.status = 'break';
      } else if (type === 'break_end') {
        if (currentSession) {
          currentSession.logs!.push(log);
          if (currentBreak) {
            currentBreak.end = log;
            if (currentBreak.start) {
              const diffMs =
                new Date(log.timestamp).getTime() -
                new Date(currentBreak.start.timestamp).getTime();
              currentBreak.durationMinutes = Math.max(0, Math.round(diffMs / 60000));
              currentSession.totalBreakMinutes =
                (currentSession.totalBreakMinutes || 0) + currentBreak.durationMinutes;
            }
            currentBreak = null;
          }
          currentSession.status = 'active';
        }
      } else if (type === 'out') {
        if (currentSession) {
          currentSession.logs!.push(log);
          currentSession.outPunch = log;
          currentSession.status = 'completed';
          finalizeSession(currentSession);
          sessions.push(currentSession as PairedAttendanceSession);
          currentSession = null;
        } else {
          // Out punch without preceding in punch
          const outOnly: PairedAttendanceSession = {
            id: log._id || `sess-${logDate.getTime()}`,
            date: logDate,
            dateLabel: formatDateLabel(logDate),
            isToday: logDate.toDateString() === todayStr,
            outPunch: log,
            breaks: [],
            totalBreakMinutes: 0,
            logs: [log],
            status: 'out_only',
            durationHours: 0,
            durationFormatted: '0h 0m'
          };
          sessions.push(outOnly);
        }
      }
    }

    if (currentSession) {
      finalizeSession(currentSession);
      sessions.push(currentSession as PairedAttendanceSession);
    }

    function finalizeSession(sess: Partial<PairedAttendanceSession>) {
      if (!sess.breaks) sess.breaks = [];
      if (!sess.totalBreakMinutes) sess.totalBreakMinutes = 0;

      let workMs = 0;
      if (sess.inPunch && sess.outPunch) {
        workMs =
          new Date(sess.outPunch.timestamp).getTime() -
          new Date(sess.inPunch.timestamp).getTime();
        sess.status = 'completed';
      } else if (sess.inPunch) {
        workMs = Math.max(0, Date.now() - new Date(sess.inPunch.timestamp).getTime());
        if (sess.status !== 'break') {
          sess.status = 'active';
        }
      }

      const breakMs = sess.totalBreakMinutes * 60000;
      const netMs = Math.max(0, workMs - breakMs);
      const netHours = Math.floor(netMs / (1000 * 60 * 60));
      const netMinutes = Math.floor((netMs % (1000 * 60 * 60)) / (1000 * 60));
      sess.durationHours = +(netMs / (1000 * 60 * 60)).toFixed(2);
      sess.durationFormatted = `${netHours}h ${netMinutes}m`;
    }

    function formatDateLabel(d: Date): string {
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      };
      return d.toLocaleDateString('en-US', options);
    }

    // Latest sessions appear first
    return sessions.sort((a, b) => b.date.getTime() - a.date.getTime());
  });

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
      
      // Ensure logs are sorted by timestamp descending just in case
      logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
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

  formatCoords(log?: AttendanceLogItem | any): string {
    const coords = log?.location?.geoJson?.coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      const lat = Number(coords[1]);
      const lng = Number(coords[0]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      }
    }
    return '';
  }
}
