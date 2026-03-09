// src/app/core/services/socket-connection.service.ts
import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { BehaviorSubject, Subject } from 'rxjs';
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

  public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  public forceLogout$ = new Subject<{ reason: string; timestamp: string }>();
  public systemStats$ = new Subject<any>();

  connect(token: string, orgId: string, userId: string) {
    if (this.socket?.connected) return;

    const opts: Partial<ManagerOptions & SocketOptions> = {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true, 
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      withCredentials: true,
      timeout: 30000,
      autoConnect: true
    };

    this.disconnect(); // Ensure clean slate
    this.socket = io(this.url, opts);
    this.setupCoreListeners(orgId);
  }

  private setupCoreListeners(orgId: string) {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.zone.run(() => {
        console.log('✅ Master Socket Connected');
        this.connectionStatus$.next('connected');
        this.socket?.emit('joinOrg', { organizationId: orgId });
        this.socket?.emit('subscribeNotifications');
        this.socket?.emit('getInitialData');
      });
    });

    this.socket.on('connect_error', (error: any) => {
      if (error.data?.code === 'TOKEN_EXPIRED') {
        this.zone.run(() => {
          this.connectionStatus$.next('reconnecting');
          this.authService.refreshToken().subscribe({
            next: (res: any) => {
              if (this.socket) {
                this.socket.auth = { token: res.token };
                this.socket.connect();
              }
            },
            error: (err) => {
              this.disconnect();
              this.messageService.handleHttpError(err);
            }
          });
        });
      } else {
        this.zone.run(() => this.connectionStatus$.next('disconnected'));
      }
    });

    this.socket.on('disconnect', () => {
      this.zone.run(() => this.connectionStatus$.next('disconnected'));
    });

    this.socket.on('forceLogout', (data: any) => {
      this.zone.run(() => {
        this.forceLogout$.next(data);
        this.disconnect();
      });
    });

    this.socket.on('systemStats', (stats: any) => this.zone.run(() => this.systemStats$.next(stats)));
  }

  // Allow other services to listen to specific events
  on(eventName: string, callback: (data: any) => void) {
    this.socket?.on(eventName, (data) => this.zone.run(() => callback(data)));
  }

  // Allow other services to emit events
  emit(eventName: string, payload?: any) {
    if (this.socket?.connected) {
      this.socket.emit(eventName, payload);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus$.next('disconnected');
  }

  ngOnDestroy() {
    this.disconnect();
    this.connectionStatus$.complete();
    this.forceLogout$.complete();
    this.systemStats$.complete();
  }
}