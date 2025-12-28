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
