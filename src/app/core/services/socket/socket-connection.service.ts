// src/app/core/services/socket-connection.service.ts
import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { BehaviorSubject, Subject, timer, Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../modules/auth/services/auth-service';
import { AppMessageService } from './../message.service';

@Injectable({ providedIn: 'root' })
export class SocketConnectionService implements OnDestroy {
  private zone = inject(NgZone);
  private authService = inject(AuthService);
  private messageService = inject(AppMessageService);

  private socket: Socket | null = null;
  private readonly url = environment.socketUrl;

  // ── Subjects ──────────────────────────────────────────────────────────────
  public permissionsUpdated$ = new Subject<{
    type: 'role' | 'override' | 'role_assigned';
    roleId?: string;
    userId?: string;
  }>();
  public themeChanged$ = new Subject<{ themeId: string }>();
  public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  public connectionHealth$ = new BehaviorSubject<'healthy' | 'degraded' | 'poor'>('healthy');
  public forceLogout$ = new Subject<{ reason: string; timestamp: string }>();
  public systemStats$ = new Subject<any>();
  public announcement$ = new Subject<any>();

  // ── Internal state ────────────────────────────────────────────────────────
  private outboundQueue: Array<{ event: string; payload: any }> = [];
  private orgId: string = '';
  private userId: string = '';
  private isRefreshingToken = false;      // prevents concurrent refresh calls
  private heartbeatSub: Subscription | null = null;
  private lastPongTime = 0;

  constructor() {
    // Re-connect when tab becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.socket?.disconnected) {
        console.log('🔄 Tab visible — forcing reconnect');
        this.socket.connect();
      }
    });

    // Re-connect when the browser comes back online
    window.addEventListener('online', () => {
      if (this.socket?.disconnected) {
        console.log('🌐 Network online — forcing reconnect');
        this.socket.connect();
      }
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  connect(token: string, orgId: string, userId: string) {
    this.orgId = orgId;
    this.userId = userId;

    // Already connected with the same identity — nothing to do
    if (this.socket?.connected) return;

    const opts: Partial<ManagerOptions & SocketOptions> = {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,       // keep trying; we handle logic ourselves
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,          // cap at 30s
      randomizationFactor: 0.5,            // jitter prevents thundering herd
      withCredentials: true,
      timeout: 20000,
      autoConnect: true,
      // Do NOT enable connectionStateRecovery on the client side — the server
      // loses all room state on crash, so "recovery" is misleading. We
      // re-join rooms ourselves on every connect event instead.
    };

    this.disconnect(); // clean slate
    this.socket = io(this.url, opts);
    this.setupCoreListeners();
  }

  emit(eventName: string, payload?: any) {
    if (this.socket?.connected) {
      this.socket.emit(eventName, payload);
    } else if (this.outboundQueue.length < 100) {
      // Buffer while offline; flushed on reconnect
      this.outboundQueue.push({ event: eventName, payload });
    }
  }

  on(eventName: string, callback: (data: any) => void) {
    this.socket?.on(eventName, (data) => this.zone.run(() => callback(data)));
  }

  ping() {
    this.socket?.emit('ping');
  }

  updateTheme(themeId: string) {
    this.emit('updateTheme', { themeId });
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus$.next('disconnected');
  }

  // ── Private setup ─────────────────────────────────────────────────────────

  private setupCoreListeners() {
    if (!this.socket) return;

    // ✅ CRITICAL: This fires on EVERY (re)connect, including after server crash.
    //    Always re-join rooms here — never assume they survived.
    this.socket.on('connect', () => {
      this.zone.run(() => {
        console.log('✅ Socket connected:', this.socket?.id);
        this.isRefreshingToken = false;
        this.connectionStatus$.next('connected');
        this.flushQueue();
        // Re-join rooms unconditionally — server loses them on crash
        this.socket?.emit('joinOrg', { organizationId: this.orgId });
        this.socket?.emit('subscribeNotifications');
        this.socket?.emit('getInitialData');
        this.startHeartbeat();
      });
    });

    this.socket.on('disconnect', (reason: string) => {
      this.zone.run(() => {
        console.warn('⚠️ Socket disconnected:', reason);
        this.stopHeartbeat();
        this.connectionStatus$.next('disconnected');

        // If the server closed the connection (not a client-side disconnect),
        // the socket.io manager will auto-reconnect. But if the reason is
        // 'io server disconnect' (server called socket.disconnect()), we must
        // reconnect manually because the manager won't retry.
        if (reason === 'io server disconnect') {
          console.log('🔁 Server-initiated disconnect — reconnecting manually');
          setTimeout(() => this.socket?.connect(), 1000);
        }
      });
    });

    this.socket.on('connect_error', (error: any) => {
      this.zone.run(() => {
        console.error('❌ Connection error:', error.message, error.data?.code);
        this.connectionStatus$.next('reconnecting');

        if (error.data?.code === 'TOKEN_EXPIRED' && !this.isRefreshingToken) {
          this.isRefreshingToken = true;
          this.authService.refreshToken().subscribe({
            next: (res: any) => {
              if (this.socket) {
                // Update auth token and let the manager retry
                (this.socket as any).auth = { token: res.token };
                this.socket.connect();
              }
              this.isRefreshingToken = false;
            },
            error: (err) => {
              this.isRefreshingToken = false;
              this.disconnect();
              this.messageService.handleHttpError(err);
            },
          });
        }
        // Other errors (INVALID_TOKEN, USER_INACTIVE, etc.) — let manager
        // handle backoff reconnection; no special client-side action needed.
      });
    });

    this.socket.on('reconnect_attempt', (attempt: number) => {
      this.zone.run(() => {
        console.log(`🔄 Reconnect attempt #${attempt}`);
        this.connectionStatus$.next('reconnecting');
      });
    });

    this.socket.on('reconnect_failed', () => {
      this.zone.run(() => {
        console.error('💀 All reconnect attempts exhausted');
        this.connectionStatus$.next('disconnected');
      });
    });

    this.socket.on('pong', (data: { timestamp: string }) => {
      const latency = Date.now() - new Date(data.timestamp).getTime();
      this.lastPongTime = Date.now();
      this.zone.run(() => {
        if (latency < 150) this.connectionHealth$.next('healthy');
        else if (latency < 500) this.connectionHealth$.next('degraded');
        else this.connectionHealth$.next('poor');
      });
    });

    this.socket.on('themeChanged', (data: { themeId: string }) => {
      this.zone.run(() => this.themeChanged$.next(data));
    });

    this.socket.on('permissions:updated', (payload: any) => {
      this.zone.run(() => this.permissionsUpdated$.next(payload));
    });

    this.socket.on('newAnnouncement', (payload: { data: any }) => {
      this.zone.run(() => {
        if (payload?.data) this.announcement$.next(payload.data);
      });
    });

    this.socket.on('forceLogout', (data: any) => {
      this.zone.run(() => {
        this.forceLogout$.next(data);
        this.disconnect();
      });
    });

    this.socket.on('systemStats', (stats: any) => {
      this.zone.run(() => this.systemStats$.next(stats));
    });
  }

  // ── Heartbeat ─────────────────────────────────────────────────────────────
  // Sends a ping every 25s. If no pong comes back within 10s, the socket
  // is likely dead — force a reconnect. This catches "zombie" connections
  // where the TCP socket is open but the server is unresponsive.

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatSub = timer(25000, 25000).subscribe(() => {
      if (!this.socket?.connected) return;

      const now = Date.now();
      // If we sent a ping >35s ago and never got a pong, the connection is dead
      if (this.lastPongTime > 0 && now - this.lastPongTime > 35000) {
        console.warn('💔 Heartbeat timeout — forcing reconnect');
        this.socket.disconnect();
        this.socket.connect();
        return;
      }

      this.socket.emit('ping');
    });
  }

  private stopHeartbeat() {
    this.heartbeatSub?.unsubscribe();
    this.heartbeatSub = null;
  }

  // ── Queue ─────────────────────────────────────────────────────────────────

  private flushQueue() {
    while (this.outboundQueue.length > 0 && this.socket?.connected) {
      const item = this.outboundQueue.shift();
      if (item) this.socket.emit(item.event, item.payload);
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnDestroy() {
    this.disconnect();
    this.permissionsUpdated$.complete();
    this.connectionStatus$.complete();
    this.connectionHealth$.complete();
    this.forceLogout$.complete();
    this.systemStats$.complete();
    this.announcement$.complete();
    this.themeChanged$.complete();
  }
}

