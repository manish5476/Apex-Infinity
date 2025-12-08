// src/app/chat/chat.service.ts
import { inject, Injectable, NgZone } from '@angular/core';
import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { BehaviorSubject, Subject, timer, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

/**
 * Minimal models (import yours if available)
 */
export interface Message {
  _id?: string;
  channelId: string;
  senderId?: string;
  body?: string;
  attachments?: any[];
  createdAt?: string;
}
export interface Channel { _id: string; name?: string; type?: string; members?: string[]; isActive?: boolean; }

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private zone = inject(NgZone);

  private socket: Socket | null = null;
  private token: string | null = null;

  // reconnect strategy
  private baseReconnectMs = 500; // initial
  private maxReconnectMs = 30_000;
  private reconnectAttempts = 0;
  private reconnectTimerSub: Subscription | null = null;
  private manualDisconnect = false;

  // outbound queue (when offline)
  private outboundQueue: Array<{ event: string; payload: any }> = [];
  private maxQueueSize = 200;

  // simple rate limiting (token bucket)
  private bucketTokens = 20;
  private bucketCapacity = 20;
  private bucketRefillIntervalMs = 1000; // refill tokens every second
  private bucketRefillSub: Subscription | null = null;

  // token refresh hook: optional function provided by app to refresh token when expired
  // signature: () => Promise<string> - must resolve to new token
  private tokenRefreshFn?: () => Promise<string>;

  // Observables / Subjects
  public messages$ = new Subject<Message>();
  public messagesBatch$ = new BehaviorSubject<Message[]>([]);
  public channels$ = new BehaviorSubject<Channel[]>([]);
  public channelUsers$ = new BehaviorSubject<Record<string, string[]>>({});
  public onlineUsers$ = new BehaviorSubject<Set<string>>(new Set());
  public typing$ = new Subject<{ channelId: string; userId: string; typing: boolean }>();
  public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  // presence cache (in-memory)
  private channelPresence = new Map<string, Set<string>>(); // channelId -> Set(userId)
  private orgOnlineUsers = new Map<string, Set<string>>(); // orgId -> Set(userId)

  // public config
  public autoReconnect = true;
  public maxReconnectAttempts = 50;

  constructor() {
    // start bucket refill
    this.startBucketRefill();
  }

  /**
   * Set token refresh function so the service can attempt refresh when socket auth fails.
   * Example: chatService.setTokenRefresh(() => authService.refreshTokenPromise());
   */
  setTokenRefresh(fn: () => Promise<string>) {
    this.tokenRefreshFn = fn;
  }

  /**
   * Connect socket with JWT token. Will attempt reconnect automatically with backoff.
   */
  connect(token: string) {
    this.manualDisconnect = false;
    this.token = token;
    if (this.socket && this.connectionStatus$.value === 'connected') return;

    this.zone.runOutsideAngular(() => this.openSocket());
  }

  /**
   * Disconnect and stop reconnect attempts.
   */
  disconnect() {
    this.manualDisconnect = true;
    this.clearReconnectTimer();
    this._closeSocket();
    this.connectionStatus$.next('disconnected');
  }

  private openSocket() {
    if (!this.token) {
      console.warn('ChatService: no token provided for connect');
      return;
    }

    // If existing socket exists, close it
    if (this.socket) this._closeSocket();

    const opts: Partial<ManagerOptions & SocketOptions> = {
      transports: ['websocket'],
      auth: { token: this.token },
      reconnection: false, // we manage reconnection manually for fine control
    };

    try {
      this.socket = io(environment.socketUrl, opts);

      // socket events
      this.socket.on('connect', () => {
        this.reconnectAttempts = 0;
        this.connectionStatus$.next('connected');
        this.zone.run(() => {
          // register user if token contains sub (best-effort)
          const payload = this.decodeJwt(this.token!);
          if (payload?.sub) this.socket?.emit('registerUser', payload.sub);
        });

        // flush queued messages
        this.flushQueue();
      });

      this.socket.on('connect_error', async (err: any) => {
        // If auth error, try token refresh if provided
        const message = err?.message || err?.toString?.() || 'connect_error';
        if (message.toLowerCase().includes('auth') || message.toLowerCase().includes('invalid token')) {
          if (this.tokenRefreshFn) {
            try {
              const newToken = await this.tokenRefreshFn();
              if (newToken) {
                this.token = newToken;
                // re-open with new token after short delay
                this.scheduleReconnect(300);
                return;
              }
            } catch (refreshErr) {
              console.error('Token refresh failed', refreshErr);
            }
          }
        }
        // otherwise schedule reconnect
        if (!this.manualDisconnect && this.autoReconnect) this.scheduleReconnect();
      });

      this.socket.on('disconnect', (reason: any) => {
        if (this.manualDisconnect) return; // intentional
        this.connectionStatus$.next('disconnected');
        if (this.autoReconnect) this.scheduleReconnect();
      });

      // domain events
      this.socket.on('newMessage', (msg: Message) => this.zone.run(() => this.onNewMessage(msg)));
      this.socket.on('messages', (payload: { channelId: string; messages: Message[] }) => this.zone.run(() => this.onMessages(payload)));
      this.socket.on('channelUsers', (data: { channelId: string; users: string[] }) => this.zone.run(() => this.onChannelUsers(data)));
      this.socket.on('userJoinedChannel', (data: { channelId: string; userId: string }) => this.zone.run(() => this.onUserJoinedChannel(data)));
      this.socket.on('userLeftChannel', (data: { channelId: string; userId: string }) => this.zone.run(() => this.onUserLeftChannel(data)));
      this.socket.on('userOnline', (data: { userId: string; organizationId?: string }) => this.zone.run(() => this.onUserOnline(data)));
      this.socket.on('userOffline', (data: { userId: string; organizationId?: string }) => this.zone.run(() => this.onUserOffline(data)));
      this.socket.on('userTyping', (data: { channelId: string; userId: string; typing: boolean }) => this.zone.run(() => this.typing$.next(data)));

    } catch (err) {
      console.error('ChatService.openSocket error', err);
      if (!this.manualDisconnect && this.autoReconnect) this.scheduleReconnect();
    }
  }

  // -----------------------
  // Socket helpers & events
  // -----------------------
  private onNewMessage(msg: Message) {
    this.messages$.next(msg);
    // batch buffer
    const batch = this.messagesBatch$.value || [];
    batch.push(msg);
    if (batch.length > 100) batch.splice(0, batch.length - 100); // keep last 100 in memory
    this.messagesBatch$.next(batch);
  }

  private onMessages(payload: { channelId: string; messages: Message[] }) {
    // server sent a batch
    const existing = this.messagesBatch$.value || [];
    const merged = [...payload.messages.reverse(), ...existing];
    // Trim to reasonable size
    if (merged.length > 500) merged.splice(500);
    this.messagesBatch$.next(merged);
  }

  private onChannelUsers(data: { channelId: string; users: string[] }) {
    this.channelUsers$.next({ ...this.channelUsers$.value, [data.channelId]: data.users });
    // update internal presence map
    this.channelPresence.set(data.channelId, new Set(data.users));
  }

  private onUserJoinedChannel(data: { channelId: string; userId: string }) {
    const cur = { ...this.channelUsers$.value };
    cur[data.channelId] = Array.from(new Set([...(cur[data.channelId] || []), data.userId]));
    this.channelUsers$.next(cur);
    // update map
    if (!this.channelPresence.has(data.channelId)) this.channelPresence.set(data.channelId, new Set());
    this.channelPresence.get(data.channelId)!.add(data.userId);
  }

  private onUserLeftChannel(data: { channelId: string; userId: string }) {
    const cur = { ...this.channelUsers$.value };
    cur[data.channelId] = (cur[data.channelId] || []).filter(u => u !== data.userId);
    this.channelUsers$.next(cur);
    // update map
    this.channelPresence.get(data.channelId)?.delete(data.userId);
  }

  private onUserOnline(data: { userId: string; organizationId?: string }) {
    // update onlineUsers BehaviorSubject
    const set = new Set(this.onlineUsers$.value);
    set.add(data.userId);
    this.onlineUsers$.next(set);
    // update org map if present
    if (data.organizationId) {
      if (!this.orgOnlineUsers.has(data.organizationId)) this.orgOnlineUsers.set(data.organizationId, new Set());
      this.orgOnlineUsers.get(data.organizationId)!.add(data.userId);
    }
  }

  private onUserOffline(data: { userId: string; organizationId?: string }) {
    const set = new Set(this.onlineUsers$.value);
    set.delete(data.userId);
    this.onlineUsers$.next(set);
    if (data.organizationId) this.orgOnlineUsers.get(data.organizationId)?.delete(data.userId);
  }

  // -----------------------
  // Public API: actions
  // -----------------------
  joinChannel(channelId: string) {
    if (!channelId) return;
    this.emitOrQueue('joinChannel', { channelId });
  }

  leaveChannel(channelId: string) {
    if (!channelId) return;
    this.emitOrQueue('leaveChannel', { channelId });
    // also local cleanup
    this.channelPresence.get(channelId)?.delete(this.decodeJwt(this.token || '')?.sub);
  }

  /**
   * Send message. If socket not connected, queue it.
   */
  sendMessage(channelId: string, body: string, attachments: any[] = []) {
    if (!channelId || !(body || attachments?.length)) return Promise.reject(new Error('invalid payload'));
    const payload: Message = { channelId, body, attachments };
    // rate limit
    if (!this.consumeBucket()) {
      // reject quickly or queue depending on design; we'll queue
      return this.queueMessage('sendMessage', payload);
    }
    return this.emitOrQueue('sendMessage', payload);
  }

  setTyping(channelId: string, typing: boolean) {
    this.emitOrQueue('typing', { channelId, typing });
  }

  markRead(channelId: string, messageIds?: string[]) {
    this.emitOrQueue('markRead', { channelId, messageIds });
  }

  fetchMessages(channelId: string, before?: string, limit = 50) {
    // prefer REST for pagination
    const params: any = { limit };
    if (before) params.before = before;
    return this.http.get<{ messages: Message[] }>(`${environment.apiUrl}/chat/channels/${channelId}/messages`, { params });
  }

  listChannels() {
    return this.http.get<Channel[]>(`${environment.apiUrl}/chat/channels`);
  }

  // Flush queued outgoing messages immediately (called on reconnect)
  flushQueue() {
    if (!this.socket || this.connectionStatus$.value !== 'connected') return;
    while (this.outboundQueue.length) {
      const item = this.outboundQueue.shift()!;
      try {
        this.socket.emit(item.event, item.payload);
      } catch (err) {
        console.error('flushQueue emit error', err);
        // push back to front and break
        this.outboundQueue.unshift(item);
        break;
      }
    }
  }

  // -----------------------
  // Internal utilities
  // -----------------------
  private emitOrQueue(event: string, payload: any): Promise<any> {
    if (this.socket && this.connectionStatus$.value === 'connected') {
      try {
        this.socket.emit(event, payload);
        return Promise.resolve(true);
      } catch (err) {
        // fallthrough to queue
      }
    }
    return this.queueMessage(event, payload);
  }

  private queueMessage(event: string, payload: any): Promise<any> {
    if (this.outboundQueue.length >= this.maxQueueSize) {
      // drop oldest to keep queue bounded
      this.outboundQueue.shift();
    }
    this.outboundQueue.push({ event, payload });
    return Promise.resolve(true);
  }

  private _closeSocket() {
    try {
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }
    } catch (err) {
      console.warn('error closing socket', err);
      this.socket = null;
    }
  }

  private scheduleReconnect(waitMs?: number) {
    if (this.manualDisconnect) return;
    this.reconnectAttempts++;
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.warn('ChatService: max reconnect attempts reached');
      return;
    }

    // compute backoff with jitter
    const base = waitMs ?? Math.min(this.baseReconnectMs * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectMs);
    const jitter = Math.floor(Math.random() * Math.min(1000, base));
    const delay = Math.max(300, base + jitter);

    this.clearReconnectTimer();
    this.connectionStatus$.next('reconnecting');

    this.reconnectTimerSub = timer(delay).subscribe(() => {
      this.openSocket();
    });
  }

  private clearReconnectTimer() {
    if (this.reconnectTimerSub) {
      this.reconnectTimerSub.unsubscribe();
      this.reconnectTimerSub = null;
    }
  }

  // -----------------------
  // Rate limiting token bucket
  // -----------------------
  private startBucketRefill() {
    if (this.bucketRefillSub) return;
    this.bucketRefillSub = timer(0, this.bucketRefillIntervalMs).subscribe(() => {
      this.bucketTokens = Math.min(this.bucketCapacity, this.bucketTokens + 1);
    });
  }

  private stopBucketRefill() {
    this.bucketRefillSub?.unsubscribe();
    this.bucketRefillSub = null;
  }

  private consumeBucket(): boolean {
    if (this.bucketTokens <= 0) return false;
    this.bucketTokens--;
    return true;
  }

  // -----------------------
  // JWT / helpers
  // -----------------------
  private decodeJwt(token: string | null): any {
    try {
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }

  // Inside ChatService class
createChannel(name: string, type: 'public' | 'private' = 'public', members: string[] = []) {
  return this.http.post<Channel>(`${environment.apiUrl}/chat/channels`, {
    name,
    type,
    members
  });
}

  // -----------------------
  // Cleanup on destroy (optional)
  // -----------------------
  destroy() {
    this.disconnect();
    this.stopBucketRefill();
    this.clearReconnectTimer();
    this.messages$.complete();
    this.messagesBatch$.complete();
    this.channels$.complete();
    this.channelUsers$.complete();
    this.onlineUsers$.complete();
    this.typing$.complete();
    this.connectionStatus$.complete();
  }
}
