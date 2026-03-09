// src/app/core/services/chat-state.service.ts
import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, Observable, distinctUntilChanged, shareReplay, map } from 'rxjs';
import { SocketConnectionService } from './socket-connection.service';
import { Channel } from 'diagnostics_channel';
import { Message, OnlineUser } from '../../../chat/chat.component/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatStateService implements OnDestroy {
  private socketService = inject(SocketConnectionService);

  // --- STATE STREAMS ---
  public messages$ = new Subject<Message>();
  public messagesBatch$ = new BehaviorSubject<Message[]>([]);

  public channels$ = new BehaviorSubject<Channel[]>([]);
  public channelUsers$ = new BehaviorSubject<Record<string, string[]>>({});
  public channelActivity$ = new Subject<{ channelId: string; lastMessage: any }>();

  public onlineUsers$ = new BehaviorSubject<Set<string>>(new Set());
  public onlineUsersList$: Observable<OnlineUser[]> = this.onlineUsers$.pipe(
    map(users => Array.from(users).map(userId => ({ userId }))),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
    shareReplay(1)
  );

  public typing$ = new Subject<{ channelId: string; userId: string; typing: boolean; timestamp?: string }>();
  public readReceipt$ = new Subject<{ userId: string; channelId: string; messageIds: string[] | null; timestamp: string }>();

  constructor() {
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    // Note: The on() method in SocketConnectionService already handles NgZone.run()

    // --- MESSAGES ---
    this.socketService.on('newMessage', (msg: Message) => {
      this.messages$.next(msg);
      const currentBatch = this.messagesBatch$.value;
      if (!currentBatch.some(m => m._id === msg._id)) {
        this.messagesBatch$.next([...currentBatch, msg]);
      }
    });

    this.socketService.on('messageEdited', (msg: Message) => {
      const updatedBatch = this.messagesBatch$.value.map(m => m._id === msg._id ? msg : m);
      this.messagesBatch$.next(updatedBatch);
    });

    this.socketService.on('messageDeleted', (data: any) => {
      const updated = this.messagesBatch$.value.map(m =>
        m._id === data.messageId ? { ...m, body: '', attachments: [], deleted: true } : m
      );
      this.messagesBatch$.next(updated);
    });

    this.socketService.on('messages', (payload: { channelId: string; messages: Message[] }) => {
      const current = this.messagesBatch$.value;
      const existingIds = new Set(current.map(m => m._id));
      const newMessages = payload.messages.reverse().filter(m => !existingIds.has(m._id));
      this.messagesBatch$.next([...newMessages, ...current]);
    });

    this.socketService.on('messageRead', (data: any) => {
      const msg = this.messagesBatch$.value.find(m => m._id === data.messageId);
      if (msg) {
        this.readReceipt$.next({ userId: data.userId, channelId: msg.channelId, messageIds: [data.messageId], timestamp: data.readAt });
      }
    });

    // --- CHANNELS ---
    this.socketService.on('initialData', (data: any) => {
      if (data.channels) this.channels$.next(data.channels);
    });

this.socketService.on('channelActivity', (data: any) => {
      this.channelActivity$.next(data);

      // 1. Get the current value from the BehaviorSubject
      const currentChannels = [...this.channels$.value];
      
      // 2. Find the index using a safe typecast
      const index = currentChannels.findIndex((c: any) => String(c._id) === String(data.channelId));
      
      if (index > -1) {
        // 3. Create the updated channel object
        // Use : any here to stop TS from comparing it to the Global Channel API
        const updatedChannel: any = { 
          ...currentChannels[index], 
          lastMessage: data.lastMessage 
        };

        // 4. Remove the old one and push the new one to the front (Top of sidebar)
        const filtered = currentChannels.filter((c: any) => String(c._id) !== String(data.channelId));
        
        // 5. Update the stream
        this.channels$.next([updatedChannel, ...filtered]);
      }
    });
    

    this.socketService.on('channelCreated', (channel: any) => {
      const current = this.channels$.value;
      if (!current.some((c: any) => c._id === channel._id)) {
        this.channels$.next([channel, ...current]);
      }
    });

    this.socketService.on('channelUpdated', (channel: any) => {
      this.channels$.next(this.channels$.value.map((c: any) => c._id === channel._id ? channel : c));
    });

    this.socketService.on('removedFromChannel', (data: { channelId: string }) => {
      this.channels$.next(this.channels$.value.filter((c: any) => c._id !== data.channelId));
      this.messagesBatch$.next(this.messagesBatch$.value.filter(m => m.channelId !== data.channelId));
    });

    // --- PRESENCE ---
    this.socketService.on('userTyping', (data: any) => this.typing$.next(data));
    this.socketService.on('readReceipt', (data: any) => this.readReceipt$.next(data));
    this.socketService.on('channelUsers', (data: any) => this.channelUsers$.next({ ...this.channelUsers$.value, [data.channelId]: data.users }));

    this.socketService.on('userJoinedChannel', (data: any) => {
      const current = this.channelUsers$.value;
      const users = current[data.channelId] || [];
      if (!users.includes(data.userId)) this.channelUsers$.next({ ...current, [data.channelId]: [...users, data.userId] });
    });

    this.socketService.on('userLeftChannel', (data: any) => {
      const current = this.channelUsers$.value;
      const users = current[data.channelId] || [];
      this.channelUsers$.next({ ...current, [data.channelId]: users.filter(u => u !== data.userId) });
    });

    this.socketService.on('userOnline', (data: OnlineUser) => { const set = new Set(this.onlineUsers$.value); set.add(data.userId); this.onlineUsers$.next(set); });
    this.socketService.on('userOffline', (data: OnlineUser) => { const set = new Set(this.onlineUsers$.value); set.delete(data.userId); this.onlineUsers$.next(set); });
    this.socketService.on('orgOnlineUsers', (data: any) => this.onlineUsers$.next(new Set(data.users)));
  }

  // --- ACTIONS ---
  joinChannel(channelId: string) { this.socketService.emit('joinChannel', { channelId }); }
  sendTyping(channelId: string, isTyping: boolean) { this.socketService.emit('typing', { channelId, typing: isTyping }); }
  markRead(channelId: string, messageIds?: string[]) { this.socketService.emit('markRead', { channelId, messageIds }); }

  ngOnDestroy() {
    this.messages$.complete();
    this.messagesBatch$.complete();
    this.channels$.complete();
    this.channelUsers$.complete();
    this.onlineUsers$.complete();
    this.typing$.complete();
    this.readReceipt$.complete();
  }
}