import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  effect,
  ChangeDetectorRef // 1. IMPORT THIS
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Import Types
import { SocketService, ChatMessage, Channel } from '../../core/services/socket.service';
import { MasterListService } from '../../core/services/master-list.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  // Services
  public socketService = inject(SocketService);
  private masterList = inject(MasterListService);
  private http = inject(HttpClient);
  
  // 2. INJECT CHANGE DETECTOR
  private cdr = inject(ChangeDetectorRef); 

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  // UI state
  channels: Channel[] = [];
  messages: ChatMessage[] = []; 
  
  activeChannelId: string | null = null;
  currentUserId = '';
  messageInput = '';
  isUploading = false;
  typingUser: string | null = null;
  channelUsers: Record<string, string[]> = {}; 

  // Modal
  showCreateModal = false;
  newChannelName = '';
  isPrivateChannel = false;
  masterUsers: any[] = [];
  selectedMembers = new Set<string>();

  private subs: Subscription[] = [];

  constructor() {
    effect(() => {
        const users = this.masterList.users();
        this.masterUsers = users || [];
        // Optional: Update view if master data loads late
        this.cdr.markForCheck(); 
    });
  }

  ngOnInit(): void {
    // --- 1. CHANNELS ---
    this.subs.push(this.socketService.channels$.subscribe(list => {
      this.channels = list || [];
      if (this.channels.length > 0 && !this.activeChannelId) {
        this.selectChannel(this.channels[0]);
      }
      this.cdr.detectChanges(); // ⚡ Force Update
    }));

    // --- 2. MESSAGES (The Critical Part) ---
    this.subs.push(this.socketService.messagesBatch$.subscribe(list => {
      this.messages = list || [];
      
      // ⚡ FORCE UPDATE IMMEDIATELY
      this.cdr.detectChanges(); 

      // Scroll after view updates
      setTimeout(() => this.scrollToBottom(), 100);
    }));

    // --- 3. PRESENCE ---
    this.subs.push(this.socketService.channelUsers$.subscribe(map => {
        this.channelUsers = map || {};
        this.cdr.detectChanges(); // ⚡ Force Update
    }));

    // --- 4. TYPING ---
    this.subs.push(this.socketService.typing$.subscribe(t => {
      if (t.channelId === this.activeChannelId && t.typing && t.userId !== this.currentUserId) {
        const user = this.masterUsers.find(u => u._id === t.userId);
        this.typingUser = user ? user.name : 'Someone';
      } else {
        this.typingUser = null;
      }
      this.cdr.detectChanges(); // ⚡ Force Update (Typing pill needs to show instantly)
    }));

    this.getCurrentUser();
    this.loadChannels();
  }

  getCurrentUser() {
    const token = localStorage.getItem('apex_auth_token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.currentUserId = payload.sub || payload._id;
        } catch {}
    }
  }

  loadChannels() {
    this.socketService.listChannels().subscribe({
        next: (res) => this.socketService.channels$.next(res),
        error: (err) => console.error('Channel list failed', err)
    });
  }

  selectChannel(channel: Channel) {
    if (!channel) return;
    if (this.activeChannelId === channel._id) return;

    if (this.activeChannelId) this.socketService.leaveChannel(this.activeChannelId);
    
    this.activeChannelId = channel._id;
    this.socketService.joinChannel(this.activeChannelId);
    
    this.socketService.fetchMessages(this.activeChannelId).subscribe({
        next: (res: any) => {
            if(res.messages) this.socketService.messagesBatch$.next(res.messages.reverse());
        }
    });
  }

  sendMessage() {
    if (!this.messageInput.trim() || !this.activeChannelId) return;
    
    const msg: any = { 
        channelId: this.activeChannelId,
        body: this.messageInput.trim(),
        senderId: this.currentUserId,
        attachments: []
    };

    // Optimistic Update (Optional: Add to list immediately if you want zero latency feeling)
    // this.messages.push(msg); 
    
    this.socketService.sendMessage(msg);
    this.messageInput = '';
    this.socketService.sendTyping(this.activeChannelId, false);
    
    // Force clear input visually
    this.cdr.detectChanges(); 
  }

  handleFileUpload(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.activeChannelId) return;

    this.isUploading = true;
    this.cdr.detectChanges(); // Show spinner

    this.socketService.uploadAttachment(file).subscribe({
        next: (attachment: any) => {
            this.isUploading = false;
            this.socketService.sendMessage({
                channelId: this.activeChannelId!,
                body: '',
                attachments: [attachment],
                senderId: this.currentUserId
            });
            this.cdr.detectChanges();
        },
        error: () => {
            this.isUploading = false;
            this.cdr.detectChanges();
        }
    });
    input.value = '';
  }

  triggerFilePicker() { this.fileInput?.nativeElement?.click(); }
  onTypingInput() { if(this.activeChannelId) this.socketService.sendTyping(this.activeChannelId, true); }

  // --- Modal Logic ---
  openCreateModal() { 
      this.showCreateModal = true; 
      this.newChannelName = ''; 
      this.isPrivateChannel = false;
      this.selectedMembers.clear();
      this.cdr.detectChanges(); // Open Modal
  }

  closeCreateModal() { 
      this.showCreateModal = false; 
      this.cdr.detectChanges(); // Close Modal
  }
  
  toggleMemberSelection(id: string) {
      if(this.selectedMembers.has(id)) this.selectedMembers.delete(id);
      else this.selectedMembers.add(id);
  }

  submitCreateChannel() {
      if(!this.newChannelName.trim()) return;
      const members = this.isPrivateChannel ? Array.from(this.selectedMembers) : [];
      if(this.isPrivateChannel && this.currentUserId) members.push(this.currentUserId);

      this.socketService.createChannel(this.newChannelName, this.isPrivateChannel ? 'private' : 'public', members)
      .subscribe(ch => {
          const current = this.socketService.channels$.value;
          this.socketService.channels$.next([...current, ch]);
          this.showCreateModal = false;
          this.selectChannel(ch);
          this.cdr.detectChanges();
      });
  }

  // --- Helpers ---

  getChannelName(id: string | null): string {
      if (!id) return '';
      const c = this.channels.find(ch => ch._id === id);
      return c?.name || 'Unnamed';
  }

  getSenderId(msg: ChatMessage): string {
    if (!msg || !msg.senderId) return '';
    return typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId._id || '');
  }

  getSenderName(msg: ChatMessage): string {
    if (!msg || !msg.senderId) return 'Unknown';
    if (typeof msg.senderId === 'object' && msg.senderId.name) return msg.senderId.name;
    if (typeof msg.senderId === 'string') {
        const u = this.masterUsers.find(user => user._id === msg.senderId);
        if (u) return u.name;
        return msg.senderId.slice(0, 6);
    }
    return 'User';
  }

  isImage(url?: string): boolean {
    if (!url) return false;
    return /\.(jpe?g|png|gif|webp|svg)$/i.test(url) || url.includes('cloudinary');
  }

  deleteMessage(msg: ChatMessage) {
      if(msg._id && confirm('Delete message?')) {
          this.socketService.deleteMessage(msg._id).subscribe();
      }
  }

  scrollToBottom() {
    if (this.scrollContainer?.nativeElement) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }
}

// import {
//   Component,
//   ElementRef,
//   OnDestroy,
//   OnInit,
//   ViewChild,
//   inject,
//   effect
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Subscription } from 'rxjs';
// import { HttpClient } from '@angular/common/http';
// import { environment } from '../../../environments/environment';

// // ✅ IMPORT ChatMessage specifically to avoid conflicts
// import { SocketService, ChatMessage, Channel } from '../../core/services/socket.service';
// import { MasterListService } from '../../core/services/master-list.service';

// @Component({
//   selector: 'app-chat',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './chat.component.html',
//   styleUrls: ['./chat.component.scss']
// })
// export class ChatComponent implements OnInit, OnDestroy {
//   // --- INJECTIONS ---
//   public socketService = inject(SocketService);
//   private masterList = inject(MasterListService);
//   private http = inject(HttpClient);

//   // --- VIEW CHILDREN ---
//   @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
//   @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

//   // --- STATE ---
//   channels: Channel[] = [];
//   messages: ChatMessage[] = []; // Using strict type from SocketService
  
//   activeChannelId: string | null = null;
//   currentUserId = '';
//   messageInput = '';
//   isUploading = false;
//   typingUser: string | null = null;
  
//   // Presence map (channelId -> [userIds])
//   channelUsers: Record<string, string[]> = {}; 

//   // --- MODAL STATE ---
//   showCreateModal = false;
//   newChannelName = '';
//   isPrivateChannel = false;
  
//   // Master data for user selection
//   masterUsers: any[] = [];
//   selectedMembers = new Set<string>();

//   private subs: Subscription[] = [];

//   constructor() {
//     // Load users from master list for the modal
//     effect(() => {
//         const users = this.masterList.users();
//         this.masterUsers = users || [];
//     });
//   }

//   ngOnInit(): void {
//     // 1. Subscribe to Channels
//     this.subs.push(this.socketService.channels$.subscribe(list => {
//       this.channels = list || [];
//       // Auto-select first channel if none selected
//       if (this.channels.length > 0 && !this.activeChannelId) {
//         this.selectChannel(this.channels[0]);
//       }
//     }));

//     // 2. Subscribe to Messages Batch (History + New)
//     this.subs.push(this.socketService.messagesBatch$.subscribe(list => {
//       this.messages = list || [];
//       setTimeout(() => this.scrollToBottom(), 100);
//     }));

//     // 3. Subscribe to Presence (Who is online in channel)
//     this.subs.push(this.socketService.channelUsers$.subscribe(map => {
//         this.channelUsers = map || {};
//     }));

//     // 4. Typing Indicator
//     this.subs.push(this.socketService.typing$.subscribe(t => {
//       if (t.channelId === this.activeChannelId && t.typing && t.userId !== this.currentUserId) {
//         // Try to resolve name
//         const user = this.masterUsers.find(u => u._id === t.userId);
//         this.typingUser = user ? user.name : 'Someone';
//       } else {
//         this.typingUser = null;
//       }
//     }));

//     // 5. Setup
//     this.getCurrentUser();
//     this.loadChannels();
//   }

//   // --- INIT HELPERS ---

//   getCurrentUser() {
//     const token = localStorage.getItem('apex_auth_token');
//     if (token) {
//         try {
//             const payload = JSON.parse(atob(token.split('.')[1]));
//             this.currentUserId = payload.sub || payload._id;
//         } catch {}
//     }
//   }

//   loadChannels() {
//     this.socketService.listChannels().subscribe({
//         next: (res) => this.socketService.channels$.next(res),
//         error: (err) => console.error('Channel list failed', err)
//     });
//   }

//   // --- CHANNEL ACTIONS ---

//   selectChannel(channel: Channel) {
//     if (!channel) return;
//     if (this.activeChannelId === channel._id) return;

//     // Leave old channel room
//     if (this.activeChannelId) this.socketService.leaveChannel(this.activeChannelId);
    
//     this.activeChannelId = channel._id;
//     this.socketService.joinChannel(this.activeChannelId);
    
//     // Fetch History via HTTP
//     this.socketService.fetchMessages(this.activeChannelId).subscribe({
//         next: (res: any) => {
//             if(res.messages) this.socketService.messagesBatch$.next(res.messages.reverse());
//         }
//     });
//   }

//   getChannelName(id: string | null): string {
//       if (!id) return '';
//       const c = this.channels.find(ch => ch._id === id);
//       return c?.name || 'Unnamed';
//   }

//   // --- MESSAGING ---

//   sendMessage() {
//     if (!this.messageInput.trim() || !this.activeChannelId) return;
    
//     const msg: any = { 
//         channelId: this.activeChannelId,
//         body: this.messageInput.trim(),
//         senderId: this.currentUserId,
//         attachments: []
//     };

//     this.socketService.sendMessage(msg);
//     this.messageInput = '';
//     this.socketService.sendTyping(this.activeChannelId, false);
//   }

//   onTypingInput() {
//       if(this.activeChannelId) this.socketService.sendTyping(this.activeChannelId, true);
//   }

//   // --- ATTACHMENTS ---

//   handleFileUpload(ev: Event) {
//     const input = ev.target as HTMLInputElement;
//     const file = input.files?.[0];
//     if (!file || !this.activeChannelId) return;

//     this.isUploading = true;
//     this.socketService.uploadAttachment(file).subscribe({
//         next: (attachment: any) => {
//             this.isUploading = false;
//             this.socketService.sendMessage({
//                 channelId: this.activeChannelId!,
//                 body: '',
//                 attachments: [attachment],
//                 senderId: this.currentUserId
//             });
//         },
//         error: () => this.isUploading = false
//     });
//     input.value = '';
//   }

//   triggerFilePicker() { this.fileInput?.nativeElement?.click(); }

//   // --- MODAL LOGIC (Restored) ---

//   openCreateModal() { 
//       this.showCreateModal = true; 
//       this.newChannelName = ''; 
//       this.isPrivateChannel = false;
//       this.selectedMembers.clear();
//   }

//   closeCreateModal() { 
//       this.showCreateModal = false; 
//   }
  
//   toggleMemberSelection(id: string) {
//       if(this.selectedMembers.has(id)) this.selectedMembers.delete(id);
//       else this.selectedMembers.add(id);
//   }

//   submitCreateChannel() {
//       if(!this.newChannelName.trim()) return;
      
//       const members = this.isPrivateChannel ? Array.from(this.selectedMembers) : [];
//       // Ensure creator is in private channel
//       if(this.isPrivateChannel && this.currentUserId) members.push(this.currentUserId);

//       this.socketService.createChannel(this.newChannelName, this.isPrivateChannel ? 'private' : 'public', members)
//       .subscribe(ch => {
//           const current = this.socketService.channels$.value;
//           this.socketService.channels$.next([...current, ch]);
//           this.showCreateModal = false;
//           this.selectChannel(ch);
//       });
//   }

//   // --- TEMPLATE HELPERS (Restored) ---

//   getSenderId(msg: ChatMessage): string {
//     if (!msg || !msg.senderId) return '';
//     return typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId._id || '');
//   }

//   getSenderName(msg: ChatMessage): string {
//     if (!msg || !msg.senderId) return 'Unknown';
//     // If populated object
//     if (typeof msg.senderId === 'object' && msg.senderId.name) return msg.senderId.name;
//     // If string ID, try to find in master list
//     if (typeof msg.senderId === 'string') {
//         const u = this.masterUsers.find(user => user._id === msg.senderId);
//         if (u) return u.name;
//         return msg.senderId.slice(0, 6);
//     }
//     return 'User';
//   }

//   isImage(url?: string): boolean {
//     if (!url) return false;
//     return /\.(jpe?g|png|gif|webp|svg)$/i.test(url) || url.includes('cloudinary');
//   }

//   deleteMessage(msg: ChatMessage) {
//       if(msg._id && confirm('Delete message?')) {
//           this.socketService.deleteMessage(msg._id).subscribe();
//       }
//   }

//   scrollToBottom() {
//     if (this.scrollContainer?.nativeElement) {
//       const el = this.scrollContainer.nativeElement;
//       el.scrollTop = el.scrollHeight;
//     }
//   }

//   ngOnDestroy() {
//     this.subs.forEach(s => s.unsubscribe());
//   }
// }