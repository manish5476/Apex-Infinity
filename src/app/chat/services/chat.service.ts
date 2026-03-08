// import { inject, Injectable, NgZone } from '@angular/core';
// import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
// import { BehaviorSubject, Subject, timer, Subscription, lastValueFrom } from 'rxjs'; // ✅ Added lastValueFrom
// import { environment } from '../../../environments/environment';
// import { HttpClient } from '@angular/common/http';

// // --- INTERFACES ---
// export interface ChatUser {
//   _id: string;
//   name: string;
//   email?: string;
//   avatar?: string;
// }

// export interface Attachment {
//   name: string;
//   url: string;
//   type: string;
//   size?: number;
//   publicId?: string; // ✅ Added to match backend
// }

// export interface Announcement {
//   _id: string;
//   title: string;
//   message: string;
//   type: 'info' | 'warning' | 'success' | 'urgent';
//   createdAt: string;
//   senderId?: any;
// }

// export interface Message {
//   _id?: string;
//   channelId: string;
//   senderId?: string | ChatUser | any;
//   body?: string;
//   attachments?: Attachment[];
//   createdAt?: string;
//   deleted?: boolean;
//   readBy?: string[]; // ✅ Added readBy for read receipts
// }

// export interface Channel {
//   _id: string;
//   name?: string;
//   type?: string;
//   members?: string[];
//   isActive?: boolean;
// }

// @Injectable({ providedIn: 'root' })
// export class ChatService {
//   private http = inject(HttpClient);
//   private zone = inject(NgZone);

//   private socket: Socket | null = null;
//   private token: string | null = null;
//   public announcement$ = new Subject<Announcement>();

//   // Reconnect Strategy
//   private baseReconnectMs = 500;
//   private maxReconnectMs = 30_000;
//   private reconnectAttempts = 0;
//   private reconnectTimerSub: Subscription | null = null;
//   private manualDisconnect = false;

//   // Outbound Queue (Still useful for socket-only events like Typing)
//   private outboundQueue: Array<{ event: string; payload: any }> = [];
//   private maxQueueSize = 200;

//   // Rate Limiting
//   private bucketTokens = 20;
//   private bucketCapacity = 20;
//   private bucketRefillIntervalMs = 1000;
//   private bucketRefillSub: Subscription | null = null;

//   // Token Refresh Hook
//   private tokenRefreshFn?: () => Promise<string>;

//   // --- STATE OBSERVABLES ---
//   public messages$ = new Subject<Message>();
//   public messagesBatch$ = new BehaviorSubject<Message[]>([]);
//   public channels$ = new BehaviorSubject<Channel[]>([]);
//   public channelUsers$ = new BehaviorSubject<Record<string, string[]>>({});
//   public onlineUsers$ = new BehaviorSubject<Set<string>>(new Set());
//   public typing$ = new Subject<{ channelId: string; userId: string; typing: boolean }>();
//   public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

//   // Internal Caches
//   private channelPresence = new Map<string, Set<string>>();
//   private orgOnlineUsers = new Map<string, Set<string>>();

//   // Config
//   public autoReconnect = true;
//   public maxReconnectAttempts = 50;

//   constructor() {
//     this.startBucketRefill();
//   }

//   setTokenRefresh(fn: () => Promise<string>) {
//     this.tokenRefreshFn = fn;
//   }

//   // ==========================================================================
//   // 🔌 SOCKET CONNECTION MANAGEMENT
//   // ==========================================================================

//   connect(token: string) {
//     this.manualDisconnect = false;
//     this.token = token;

//     // Prevent double connection if already connected
//     if (this.socket?.connected) {
//       return;
//     }

//     this.zone.runOutsideAngular(() => this.openSocket());
//   }

//   disconnect() {
//     this.manualDisconnect = true;
//     this.clearReconnectTimer();
//     this._closeSocket();
//     this.connectionStatus$.next('disconnected');
//   }

//   private openSocket() {
//     if (!this.token) {
//       console.warn('ChatService: no token provided for connect');
//       return;
//     }

//     if (this.socket) this._closeSocket();

//     const opts: Partial<ManagerOptions & SocketOptions> = {
//       transports: ['websocket'],
//       auth: { token: this.token },
//       reconnection: false, // We handle reconnection manually
//     };

//     try {
//       this.socket = io(environment.socketUrl, opts);

//       this.socket.on('connect', () => {
//         this.reconnectAttempts = 0;
//         this.connectionStatus$.next('connected');
//         this.zone.run(() => {
//           const payload = this.decodeJwt(this.token!);
//           if (payload?.sub) this.socket?.emit('registerUser', payload.sub);

//           // Join organization room automatically if orgId exists in token
//           if (payload?.organizationId) {
//             this.socket?.emit('joinOrg', { organizationId: payload.organizationId });
//           }
//         });
//         this.flushQueue();
//       });

//       this.socket.on('connect_error', async (err: any) => {
//         const message = err?.message || err?.toString?.() || 'connect_error';

//         // Handle Token Expiry
//         if (message.toLowerCase().includes('auth') || message.toLowerCase().includes('jwt expired')) {
//           if (this.tokenRefreshFn) {
//             try {
//               const newToken = await this.tokenRefreshFn();
//               if (newToken) {
//                 this.token = newToken;
//                 this.scheduleReconnect(300); // Try again immediately with new token
//                 return;
//               }
//             } catch (refreshErr) {
//               console.error('Token refresh failed', refreshErr);
//             }
//           }
//         }

//         if (!this.manualDisconnect && this.autoReconnect) this.scheduleReconnect();
//       });

//       this.socket.on('disconnect', () => {
//         if (this.manualDisconnect) return;
//         this.connectionStatus$.next('disconnected');
//         if (this.autoReconnect) this.scheduleReconnect();
//       });

//       this.socket.on('newAnnouncement', (payload: any) => {
//         this.zone.run(() => {
//           if (payload && payload.data) {
//             this.announcement$.next(payload.data);
//           }
//         });
//       });

//       this.socket.on('removedFromChannel', (data: { channelId: string }) => {
//         this.zone.run(() => {
//           const currentChannels = this.channels$.value;
//           const updatedChannels = currentChannels.filter(c => c._id !== data.channelId);
//           this.channels$.next(updatedChannels);
//           const currentMessages = this.messagesBatch$.value;
//           const updatedMessages = currentMessages.filter(m => m.channelId !== data.channelId);
//           this.messagesBatch$.next(updatedMessages);

//           console.log(`🚫 You were removed from channel ${data.channelId}`);
//         });
//       });

//       // --- EVENTS ---
//       this.socket.on('newMessage', (msg: Message) => this.zone.run(() => this.onNewMessage(msg)));
//       this.socket.on('messageDeleted', (data: { messageId: string }) => this.zone.run(() => this.onMessageDeleted(data)));
//       this.socket.on('messages', (payload) => this.zone.run(() => this.onMessages(payload)));
//       this.socket.on('channelUsers', (data) => this.zone.run(() => this.onChannelUsers(data)));
//       this.socket.on('userJoinedChannel', (data) => this.zone.run(() => this.onUserJoinedChannel(data)));
//       this.socket.on('userLeftChannel', (data) => this.zone.run(() => this.onUserLeftChannel(data)));
//       this.socket.on('userOnline', (data) => this.zone.run(() => this.onUserOnline(data)));
//       this.socket.on('userOffline', (data) => this.zone.run(() => this.onUserOffline(data)));
//       this.socket.on('userTyping', (data) => this.zone.run(() => this.typing$.next(data)));

//     } catch (err) {
//       console.error('ChatService.openSocket error', err);
//       if (!this.manualDisconnect && this.autoReconnect) this.scheduleReconnect();
//     }
//   }

//   // ==========================================================================
//   // 📥 INCOMING EVENT HANDLERS
//   // ==========================================================================

//   private onNewMessage(msg: Message) {
//     this.messages$.next(msg);
//     const batch = this.messagesBatch$.value || [];

//     // Prevent duplicates
//     if (!batch.some(m => m._id === msg._id)) {
//       batch.push(msg);
//       if (batch.length > 100) batch.splice(0, batch.length - 100);
//       this.messagesBatch$.next(batch);
//     }
//   }

//   private onMessageDeleted(data: { messageId: string }) {
//     const current = this.messagesBatch$.value;
//     const updated = current.map(m => {
//       if (m._id === data.messageId) {
//         return { ...m, body: '', attachments: [], deleted: true };
//       }
//       return m;
//     });
//     this.messagesBatch$.next(updated);
//   }

//   private onMessages(payload: { channelId: string; messages: Message[] }) {
//     const existing = this.messagesBatch$.value || [];
//     // Merge strategy: Filter out duplicates based on ID
//     const existingIds = new Set(existing.map(m => m._id));
//     const newMessages = payload.messages.reverse().filter(m => !existingIds.has(m._id));

//     const merged = [...newMessages, ...existing];
//     // Sort by Date just in case
//     merged.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

//     if (merged.length > 500) merged.splice(0, merged.length - 500); // Remove oldest
//     this.messagesBatch$.next(merged);
//   }

//   private onChannelUsers(data: { channelId: string; users: string[] }) {
//     this.channelUsers$.next({ ...this.channelUsers$.value, [data.channelId]: data.users });
//     this.channelPresence.set(data.channelId, new Set(data.users));
//   }

//   private onUserJoinedChannel(data: { channelId: string; userId: string }) {
//     const cur = { ...this.channelUsers$.value };
//     cur[data.channelId] = Array.from(new Set([...(cur[data.channelId] || []), data.userId]));
//     this.channelUsers$.next(cur);
//     if (!this.channelPresence.has(data.channelId)) this.channelPresence.set(data.channelId, new Set());
//     this.channelPresence.get(data.channelId)!.add(data.userId);
//   }

//   private onUserLeftChannel(data: { channelId: string; userId: string }) {
//     const cur = { ...this.channelUsers$.value };
//     cur[data.channelId] = (cur[data.channelId] || []).filter(u => u !== data.userId);
//     this.channelUsers$.next(cur);
//     this.channelPresence.get(data.channelId)?.delete(data.userId);
//   }

//   private onUserOnline(data: { userId: string; organizationId?: string }) {
//     const set = new Set(this.onlineUsers$.value);
//     set.add(data.userId);
//     this.onlineUsers$.next(set);
//     if (data.organizationId) {
//       if (!this.orgOnlineUsers.has(data.organizationId)) this.orgOnlineUsers.set(data.organizationId, new Set());
//       this.orgOnlineUsers.get(data.organizationId)!.add(data.userId);
//     }
//   }

//   private onUserOffline(data: { userId: string; organizationId?: string }) {
//     const set = new Set(this.onlineUsers$.value);
//     set.delete(data.userId);
//     this.onlineUsers$.next(set);
//     if (data.organizationId) this.orgOnlineUsers.get(data.organizationId)?.delete(data.userId);
//   }

//   // ==========================================================================
//   // 📤 PUBLIC API & ACTIONS
//   // ==========================================================================

//   joinChannel(channelId: string) {
//     if (!channelId) return;
//     this.emitOrQueue('joinChannel', { channelId });
//   }

//   /**
//    * Leave a channel (Self)
//    */
//   leaveChannel(channelId: string) {
//     return this.http.post(`${environment.apiUrl}/channels/${channelId}/leave`, {});
//   }

//   /**
//    * Add a member to a channel
//    */
//   addMember(channelId: string, userId: string) {
//     return this.http.post(`${environment.apiUrl}/channels/${channelId}/members`, { userId });
//   }

//   /**
//    * Remove a member from a channel (Admin)
//    */
//   removeMember(channelId: string, userId: string) {
//     return this.http.delete(`${environment.apiUrl}/channels/${channelId}/members/${userId}`);
//   }

//   sendMessage(channelId: string, body: string, attachments: Attachment[] = []): Promise<Message> {
//     if (!channelId || (!body && !attachments.length)) {
//       return Promise.reject(new Error('invalid payload'));
//     }
//     if (!this.consumeBucket()) {
//       return Promise.reject(new Error('Rate limit exceeded. Please slow down.'));
//     }
//     const payload = { channelId, body, attachments };
//     return lastValueFrom(
//       this.http.post<Message>(`${environment.apiUrl}/messages`, payload)
//     );
//   }

//   uploadAttachment(file: File) {
//     const formData = new FormData();
//     formData.append('file', file);
//     return this.http.post<Attachment>(`${environment.apiUrl}/upload`, formData);
//   }

//   deleteMessage(messageId: string) {
//     return this.http.delete(`${environment.apiUrl}/messages/${messageId}`);
//   }

//   setTyping(channelId: string, typing: boolean) {
//     this.emitOrQueue('typing', { channelId, typing });
//   }

//   markRead(channelId: string, messageIds?: string[]) {
//     // We can fire-and-forget this via HTTP to ensure it persists
//     this.http.patch(`${environment.apiUrl}/messages/${messageIds?.[0]}/read`, { messageIds }).subscribe({
//       error: (e) => console.warn('Failed to mark read', e)
//     });
//     // Or keep using socket if your backend socket listener handles DB updates
//     // this.emitOrQueue('markRead', { channelId, messageIds });
//   }

//   fetchMessages(channelId: string, before?: string, limit = 50) {
//     const params: any = { limit };
//     if (before) params.before = before;
//     return this.http.get<{ messages: Message[] }>(`${environment.apiUrl}/channels/${channelId}/messages`, { params });
//   }

//   listChannels() {
//     return this.http.get<Channel[]>(`${environment.apiUrl}/channels`);
//   }

//   createChannel(name: string, type: 'public' | 'private' | 'dm' = 'public', members: string[] = []) {
//     return this.http.post<Channel>(`${environment.apiUrl}/channels`, {
//       name,
//       type,
//       members
//     });
//   }

//   // ==========================================================================
//   // ⚙️ INTERNAL UTILITIES
//   // ==========================================================================

//   flushQueue() {
//     if (!this.socket || this.connectionStatus$.value !== 'connected') return;
//     while (this.outboundQueue.length) {
//       const item = this.outboundQueue.shift()!;
//       try {
//         this.socket.emit(item.event, item.payload);
//       } catch (err) {
//         console.error('flushQueue emit error', err);
//         this.outboundQueue.unshift(item); // Put it back if fail
//         break;
//       }
//     }
//   }

//   private emitOrQueue(event: string, payload: any): Promise<any> {
//     if (this.socket && this.connectionStatus$.value === 'connected') {
//       try {
//         this.socket.emit(event, payload);
//         return Promise.resolve(true);
//       } catch (err) { }
//     }
//     return this.queueMessage(event, payload);
//   }

//   private queueMessage(event: string, payload: any): Promise<any> {
//     if (this.outboundQueue.length >= this.maxQueueSize) this.outboundQueue.shift();
//     this.outboundQueue.push({ event, payload });
//     return Promise.resolve(true);
//   }

//   private _closeSocket() {
//     try {
//       if (this.socket) {
//         this.socket.removeAllListeners();
//         this.socket.disconnect();
//         this.socket = null;
//       }
//     } catch (err) {
//       console.warn('error closing socket', err);
//       this.socket = null;
//     }
//   }

//   private scheduleReconnect(waitMs?: number) {
//     if (this.manualDisconnect) return;
//     this.reconnectAttempts++;
//     if (this.reconnectAttempts > this.maxReconnectAttempts) return;

//     const base = waitMs ?? Math.min(this.baseReconnectMs * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectMs);
//     const delay = Math.max(300, base); // Simplified jitter

//     this.clearReconnectTimer();
//     this.connectionStatus$.next('reconnecting');

//     this.reconnectTimerSub = timer(delay).subscribe(() => this.openSocket());
//   }

//   private clearReconnectTimer() {
//     if (this.reconnectTimerSub) {
//       this.reconnectTimerSub.unsubscribe();
//       this.reconnectTimerSub = null;
//     }
//   }

//   private startBucketRefill() {
//     if (this.bucketRefillSub) return;
//     this.bucketRefillSub = timer(0, this.bucketRefillIntervalMs).subscribe(() => {
//       this.bucketTokens = Math.min(this.bucketCapacity, this.bucketTokens + 1);
//     });
//   }

//   private stopBucketRefill() {
//     this.bucketRefillSub?.unsubscribe();
//     this.bucketRefillSub = null;
//   }

//   private consumeBucket(): boolean {
//     if (this.bucketTokens <= 0) return false;
//     this.bucketTokens--;
//     return true;
//   }

//   private decodeJwt(token: string | null): any {
//     try {
//       if (!token) return null;
//       const parts = token.split('.');
//       if (parts.length !== 3) return null;
//       return JSON.parse(atob(parts[1]));
//     } catch { return null; }
//   }

//   destroy() {
//     this.disconnect();
//     this.stopBucketRefill();
//     this.clearReconnectTimer();
//     this.messages$.complete();
//     this.messagesBatch$.complete();
//     this.channels$.complete();
//     this.channelUsers$.complete();
//     this.onlineUsers$.complete();
//     this.typing$.complete();
//     this.connectionStatus$.complete();
//   }
// }



























// // import { inject, Injectable, NgZone } from '@angular/core';
// // import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
// // import { BehaviorSubject, Subject, timer, Subscription } from 'rxjs';
// // import { environment } from '../../../environments/environment';
// // import { HttpClient } from '@angular/common/http';

// // // --- INTERFACES ---

// // export interface ChatUser {
// //   _id: string;
// //   name: string;
// //   email?: string;
// //   avatar?: string;
// // }

// // export interface Attachment {
// //   name: string;
// //   url: string;
// //   type: string; // e.g. 'image/png', 'application/pdf'
// //   size?: number;
// // }
// // export interface Announcement {
// //   _id: string;
// //   title: string;
// //   message: string;
// //   type: 'info' | 'warning' | 'success' | 'urgent';
// //   createdAt: string;
// //   senderId?: any;
// // }
// // export interface Message {
// //   _id?: string;
// //   channelId: string;
// //   // senderId can be string (sending) or object (receiving)
// //   senderId?: string | ChatUser | any;
// //   body?: string;
// //   attachments?: Attachment[]; // ✅ Updated to use strict Interface
// //   createdAt?: string;
// //   deleted?: boolean;
// // }

// // export interface Channel {
// //   _id: string;
// //   name?: string;
// //   type?: string;
// //   members?: string[];
// //   isActive?: boolean;
// // }

// // @Injectable({ providedIn: 'root' })
// // export class ChatService {
// //   private http = inject(HttpClient);
// //   private zone = inject(NgZone);

// //   private socket: Socket | null = null;
// //   private token: string | null = null;
// //   public announcement$ = new Subject<Announcement>(); // ✅ Add this

// //   // Reconnect Strategy
// //   private baseReconnectMs = 500;
// //   private maxReconnectMs = 30_000;
// //   private reconnectAttempts = 0;
// //   private reconnectTimerSub: Subscription | null = null;
// //   private manualDisconnect = false;

// //   // Outbound Queue (for offline messaging)
// //   private outboundQueue: Array<{ event: string; payload: any }> = [];
// //   private maxQueueSize = 200;

// //   // Rate Limiting (Token Bucket)
// //   private bucketTokens = 20;
// //   private bucketCapacity = 20;
// //   private bucketRefillIntervalMs = 1000;
// //   private bucketRefillSub: Subscription | null = null;

// //   // Token Refresh Hook
// //   private tokenRefreshFn?: () => Promise<string>;

// //   // --- STATE OBSERVABLES ---
// //   public messages$ = new Subject<Message>();
// //   public messagesBatch$ = new BehaviorSubject<Message[]>([]);
// //   public channels$ = new BehaviorSubject<Channel[]>([]);
// //   public channelUsers$ = new BehaviorSubject<Record<string, string[]>>({});
// //   public onlineUsers$ = new BehaviorSubject<Set<string>>(new Set());
// //   public typing$ = new Subject<{ channelId: string; userId: string; typing: boolean }>();
// //   public connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

// //   // Internal Caches
// //   private channelPresence = new Map<string, Set<string>>();
// //   private orgOnlineUsers = new Map<string, Set<string>>();

// //   // Config
// //   public autoReconnect = true;
// //   public maxReconnectAttempts = 50;

// //   constructor() {
// //     this.startBucketRefill();
// //   }

// //   setTokenRefresh(fn: () => Promise<string>) {
// //     this.tokenRefreshFn = fn;
// //   }

// //   // ==========================================================================
// //   // 🔌 SOCKET CONNECTION MANAGEMENT
// //   // ==========================================================================

// //   connect(token: string) {
// //     this.manualDisconnect = false;
// //     this.token = token;
// //     if (this.socket && this.connectionStatus$.value === 'connected') return;
// //     this.zone.runOutsideAngular(() => this.openSocket());
// //   }

// //   disconnect() {
// //     this.manualDisconnect = true;
// //     this.clearReconnectTimer();
// //     this._closeSocket();
// //     this.connectionStatus$.next('disconnected');
// //   }

// //   private openSocket() {
// //     if (!this.token) {
// //       console.warn('ChatService: no token provided for connect');
// //       return;
// //     }

// //     if (this.socket) this._closeSocket();

// //     const opts: Partial<ManagerOptions & SocketOptions> = {
// //       transports: ['websocket'],
// //       auth: { token: this.token },
// //       reconnection: false, // Manual control
// //     };

// //     try {
// //       this.socket = io(environment.socketUrl, opts);

// //       this.socket.on('connect', () => {
// //         this.reconnectAttempts = 0;
// //         this.connectionStatus$.next('connected');
// //         this.zone.run(() => {
// //           const payload = this.decodeJwt(this.token!);
// //           if (payload?.sub) this.socket?.emit('registerUser', payload.sub);
// //         });
// //         this.flushQueue();
// //       });

// //       this.socket.on('connect_error', async (err: any) => {
// //         const message = err?.message || err?.toString?.() || 'connect_error';
// //         if (message.toLowerCase().includes('auth') || message.toLowerCase().includes('invalid token')) {
// //           if (this.tokenRefreshFn) {
// //             try {
// //               const newToken = await this.tokenRefreshFn();
// //               if (newToken) {
// //                 this.token = newToken;
// //                 this.scheduleReconnect(300);
// //                 return;
// //               }
// //             } catch (refreshErr) {
// //               console.error('Token refresh failed', refreshErr);
// //             }
// //           }
// //         }
// //         if (!this.manualDisconnect && this.autoReconnect) this.scheduleReconnect();
// //       });

// //       this.socket.on('disconnect', () => {
// //         if (this.manualDisconnect) return;
// //         this.connectionStatus$.next('disconnected');
// //         if (this.autoReconnect) this.scheduleReconnect();
// //       });

// //       this.socket.on('newAnnouncement', (payload: any) => {
// //         console.log('🔔 SOCKET EVENT RECEIVED:', payload); // <--- ADD THIS
// //         this.zone.run(() => {
// //           if (payload && payload.data) {
// //             this.announcement$.next(payload.data);
// //           }
// //         });
// //       });

// //       // --- EVENTS ---
// //       this.socket.on('newMessage', (msg: Message) => this.zone.run(() => this.onNewMessage(msg)));
// //       this.socket.on('messageDeleted', (data: { messageId: string }) => this.zone.run(() => this.onMessageDeleted(data)));
// //       this.socket.on('messages', (payload) => this.zone.run(() => this.onMessages(payload)));
// //       this.socket.on('channelUsers', (data) => this.zone.run(() => this.onChannelUsers(data)));
// //       this.socket.on('userJoinedChannel', (data) => this.zone.run(() => this.onUserJoinedChannel(data)));
// //       this.socket.on('userLeftChannel', (data) => this.zone.run(() => this.onUserLeftChannel(data)));
// //       this.socket.on('userOnline', (data) => this.zone.run(() => this.onUserOnline(data)));
// //       this.socket.on('userOffline', (data) => this.zone.run(() => this.onUserOffline(data)));
// //       this.socket.on('userTyping', (data) => this.zone.run(() => this.typing$.next(data)));

// //     } catch (err) {
// //       console.error('ChatService.openSocket error', err);
// //       if (!this.manualDisconnect && this.autoReconnect) this.scheduleReconnect();
// //     }
// //   }

// //   // ==========================================================================
// //   // 📥 INCOMING EVENT HANDLERS
// //   // ==========================================================================

// //   private onNewMessage(msg: Message) {
// //     this.messages$.next(msg);
// //     const batch = this.messagesBatch$.value || [];
// //     batch.push(msg);
// //     if (batch.length > 100) batch.splice(0, batch.length - 100);
// //     this.messagesBatch$.next(batch);
// //   }

// //   private onMessageDeleted(data: { messageId: string }) {
// //     // Soft delete in UI: Find message and mark as deleted
// //     const current = this.messagesBatch$.value;
// //     const updated = current.map(m => {
// //       if (m._id === data.messageId) {
// //         return { ...m, body: '', attachments: [], deleted: true };
// //       }
// //       return m;
// //     });
// //     this.messagesBatch$.next(updated);
// //   }

// //   private onMessages(payload: { channelId: string; messages: Message[] }) {
// //     const existing = this.messagesBatch$.value || [];
// //     const merged = [...payload.messages.reverse(), ...existing];
// //     if (merged.length > 500) merged.splice(500);
// //     this.messagesBatch$.next(merged);
// //   }

// //   private onChannelUsers(data: { channelId: string; users: string[] }) {
// //     this.channelUsers$.next({ ...this.channelUsers$.value, [data.channelId]: data.users });
// //     this.channelPresence.set(data.channelId, new Set(data.users));
// //   }

// //   private onUserJoinedChannel(data: { channelId: string; userId: string }) {
// //     const cur = { ...this.channelUsers$.value };
// //     cur[data.channelId] = Array.from(new Set([...(cur[data.channelId] || []), data.userId]));
// //     this.channelUsers$.next(cur);
// //     if (!this.channelPresence.has(data.channelId)) this.channelPresence.set(data.channelId, new Set());
// //     this.channelPresence.get(data.channelId)!.add(data.userId);
// //   }

// //   private onUserLeftChannel(data: { channelId: string; userId: string }) {
// //     const cur = { ...this.channelUsers$.value };
// //     cur[data.channelId] = (cur[data.channelId] || []).filter(u => u !== data.userId);
// //     this.channelUsers$.next(cur);
// //     this.channelPresence.get(data.channelId)?.delete(data.userId);
// //   }

// //   private onUserOnline(data: { userId: string; organizationId?: string }) {
// //     const set = new Set(this.onlineUsers$.value);
// //     set.add(data.userId);
// //     this.onlineUsers$.next(set);
// //     if (data.organizationId) {
// //       if (!this.orgOnlineUsers.has(data.organizationId)) this.orgOnlineUsers.set(data.organizationId, new Set());
// //       this.orgOnlineUsers.get(data.organizationId)!.add(data.userId);
// //     }
// //   }

// //   private onUserOffline(data: { userId: string; organizationId?: string }) {
// //     const set = new Set(this.onlineUsers$.value);
// //     set.delete(data.userId);
// //     this.onlineUsers$.next(set);
// //     if (data.organizationId) this.orgOnlineUsers.get(data.organizationId)?.delete(data.userId);
// //   }

// //   // ==========================================================================
// //   // 📤 PUBLIC API & ACTIONS
// //   // ==========================================================================

// //   joinChannel(channelId: string) {
// //     if (!channelId) return;
// //     this.emitOrQueue('joinChannel', { channelId });
// //   }

// //   leaveChannel(channelId: string) {
// //     if (!channelId) return;
// //     this.emitOrQueue('leaveChannel', { channelId });
// //     this.channelPresence.get(channelId)?.delete(this.decodeJwt(this.token || '')?.sub);
// //   }

// //   /**
// //    * Send Message: Can include body AND/OR attachments
// //    */
// //   sendMessage(channelId: string, body: string, attachments: Attachment[] = []) {
// //     if (!channelId || (!body && !attachments.length)) return Promise.reject(new Error('invalid payload'));

// //     const payload: Message = { channelId, body, attachments };

// //     if (!this.consumeBucket()) {
// //       return this.queueMessage('sendMessage', payload);
// //     }
// //     return this.emitOrQueue('sendMessage', payload);
// //   }

// //   /**
// //    * ✅ NEW: Upload File
// //    * Uploads to backend, returns the Attachment object (url, type, name)
// //    */
// //   uploadAttachment(file: File) {
// //     const formData = new FormData();
// //     formData.append('file', file);
// //     // You must create this route in your backend!
// //     return this.http.post<Attachment>(`${environment.apiUrl}/v1/chat/upload`, formData);
// //   }

// //   deleteMessage(messageId: string) {
// //     return this.http.delete(`${environment.apiUrl}/v1/chat/messages/${messageId}`);
// //   }

// //   setTyping(channelId: string, typing: boolean) {
// //     this.emitOrQueue('typing', { channelId, typing });
// //   }

// //   markRead(channelId: string, messageIds?: string[]) {
// //     this.emitOrQueue('markRead', { channelId, messageIds });
// //   }

// //   fetchMessages(channelId: string, before?: string, limit = 50) {
// //     const params: any = { limit };
// //     if (before) params.before = before;
// //     return this.http.get<{ messages: Message[] }>(`${environment.apiUrl}/v1/chat/channels/${channelId}/messages`, { params });
// //   }

// //   listChannels() {
// //     return this.http.get<Channel[]>(`${environment.apiUrl}/v1/chat/channels`);
// //   }

// //   createChannel(name: string, type: 'public' | 'private' = 'public', members: string[] = []) {
// //     return this.http.post<Channel>(`${environment.apiUrl}/v1/chat/channels`, {
// //       name,
// //       type,
// //       members
// //     });
// //   }

// //   // ==========================================================================
// //   // ⚙️ INTERNAL UTILITIES (Queue, Bucket, JWT)
// //   // ==========================================================================

// //   flushQueue() {
// //     if (!this.socket || this.connectionStatus$.value !== 'connected') return;
// //     while (this.outboundQueue.length) {
// //       const item = this.outboundQueue.shift()!;
// //       try {
// //         this.socket.emit(item.event, item.payload);
// //       } catch (err) {
// //         console.error('flushQueue emit error', err);
// //         this.outboundQueue.unshift(item);
// //         break;
// //       }
// //     }
// //   }

// //   private emitOrQueue(event: string, payload: any): Promise<any> {
// //     if (this.socket && this.connectionStatus$.value === 'connected') {
// //       try {
// //         this.socket.emit(event, payload);
// //         return Promise.resolve(true);
// //       } catch (err) { }
// //     }
// //     return this.queueMessage(event, payload);
// //   }

// //   private queueMessage(event: string, payload: any): Promise<any> {
// //     if (this.outboundQueue.length >= this.maxQueueSize) this.outboundQueue.shift();
// //     this.outboundQueue.push({ event, payload });
// //     return Promise.resolve(true);
// //   }

// //   private _closeSocket() {
// //     try {
// //       if (this.socket) {
// //         this.socket.removeAllListeners();
// //         this.socket.disconnect();
// //         this.socket = null;
// //       }
// //     } catch (err) {
// //       console.warn('error closing socket', err);
// //       this.socket = null;
// //     }
// //   }

// //   private scheduleReconnect(waitMs?: number) {
// //     if (this.manualDisconnect) return;
// //     this.reconnectAttempts++;
// //     if (this.reconnectAttempts > this.maxReconnectAttempts) return;

// //     const base = waitMs ?? Math.min(this.baseReconnectMs * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectMs);
// //     const jitter = Math.floor(Math.random() * Math.min(1000, base));
// //     const delay = Math.max(300, base + jitter);

// //     this.clearReconnectTimer();
// //     this.connectionStatus$.next('reconnecting');

// //     this.reconnectTimerSub = timer(delay).subscribe(() => this.openSocket());
// //   }

// //   private clearReconnectTimer() {
// //     if (this.reconnectTimerSub) {
// //       this.reconnectTimerSub.unsubscribe();
// //       this.reconnectTimerSub = null;
// //     }
// //   }

// //   private startBucketRefill() {
// //     if (this.bucketRefillSub) return;
// //     this.bucketRefillSub = timer(0, this.bucketRefillIntervalMs).subscribe(() => {
// //       this.bucketTokens = Math.min(this.bucketCapacity, this.bucketTokens + 1);
// //     });
// //   }

// //   private stopBucketRefill() {
// //     this.bucketRefillSub?.unsubscribe();
// //     this.bucketRefillSub = null;
// //   }

// //   private consumeBucket(): boolean {
// //     if (this.bucketTokens <= 0) return false;
// //     this.bucketTokens--;
// //     return true;
// //   }

// //   private decodeJwt(token: string | null): any {
// //     try {
// //       if (!token) return null;
// //       const parts = token.split('.');
// //       if (parts.length !== 3) return null;
// //       return JSON.parse(atob(parts[1]));
// //     } catch { return null; }
// //   }

// //   destroy() {
// //     this.disconnect();
// //     this.stopBucketRefill();
// //     this.clearReconnectTimer();
// //     this.messages$.complete();
// //     this.messagesBatch$.complete();
// //     this.channels$.complete();
// //     this.channelUsers$.complete();
// //     this.onlineUsers$.complete();
// //     this.typing$.complete();
// //     this.connectionStatus$.complete();
// //   }
// // }