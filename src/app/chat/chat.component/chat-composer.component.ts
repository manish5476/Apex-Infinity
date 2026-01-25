import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Channel } from './chat.models';

@Component({
  selector: 'app-chat-composer',
  standalone: true,
  imports: [CommonModule, FormsModule],
template: `
    <div class="composer-container">
      @if (internalAttachments().length > 0) {
        <div class="attachments-shelf">
          <div class="shelf-header">
            <span>{{ internalAttachments().length }} Files attached</span>
            <button class="btn-text-danger" (click)="clearAttachments()">Clear All</button>
          </div>
          <div class="attachments-grid">
            @for (file of internalAttachments(); track $index) {
              <div class="attachment-chip">
                <i class="pi" [ngClass]="getFileTypeIcon(file)"></i>
                <span class="file-label">{{ truncateFileName(file.name, 12) }}</span>
                <button class="btn-remove" (click)="onRemoveAttachment($index)">
                  <i class="pi pi-times"></i>
                </button>
              </div>
            }
          </div>
        </div>
      }

      <div class="composer-main">
        <button class="btn-icon-secondary" (click)="openFilePicker()" [disabled]="isUploading">
          <i class="pi pi-paperclip"></i>
        </button>

        <div class="input-card">
          <textarea #messageInputRef
                    class="message-textarea"
                    [(ngModel)]="internalMessage"
                    (input)="onUserInput()"
                    (keydown.enter)="handleEnterKey($event)"
                    [placeholder]="'Message #' + (activeChannel?.name || 'general')"
                    rows="1"
                    [disabled]="isUploading"></textarea>
          
          <button class="btn-emoji-trigger" (click)="toggleEmojiPicker()">
            <i class="pi pi-smile"></i>
          </button>
        </div>

        <button class="btn-circle-primary" 
                (click)="onSendMessage()" 
                [disabled]="isButtonDisabled()"
                [class.recording]="isVoiceRecording">
          @if (isUploading) {
            <i class="pi pi-spinner pi-spin"></i>
          } @else {
            <i class="pi" [class.pi-send]="!isVoiceRecording" [class.pi-stop]="isVoiceRecording"></i>
          }
        </button>
      </div>

      @if (isUploading) {
        <div class="progress-track">
          <div class="progress-fill" [style.width.%]="uploadProgress"></div>
        </div>
      }
    </div>

    <input #fileInputRef type="file" (change)="onFileSelect($event)" hidden multiple />
  `,
  styles: [`
    :host {
      display: block;
      padding: var(--spacing-md) var(--spacing-xl);
      background: var(--bg-surface);
      border-top: var(--ui-border-width) solid var(--border-subtle);
    }

    .composer-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      max-width: 1200px;
      margin: 0 auto;
    }

    /* --- Attachment Shelf --- */
    .attachments-shelf {
      background: var(--color-gray-50);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-sm);
      border: var(--ui-border-width) solid var(--border-subtle);
      animation: var(--transition-fast) slideInUp;

      .shelf-header {
        display: flex;
        justify-content: space-between;
        font-size: var(--font-size-xs);
        color: var(--text-muted);
        margin-bottom: var(--spacing-xs);
        padding: 0 var(--spacing-xs);
      }

      .attachments-grid {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
      }
    }

    .attachment-chip {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      background: var(--bg-surface);
      border: var(--ui-border-width) solid var(--border-subtle);
      border-radius: var(--ui-border-radius);
      font-size: var(--font-size-xs);
      box-shadow: var(--shadow-xs);

      i { color: var(--color-primary); }
      .btn-remove {
        border: none; background: none; cursor: pointer;
        font-size: 10px; color: var(--color-gray-400);
        &:hover { color: var(--color-danger-text); }
      }
    }

    /* --- Main Composer Row --- */
    .composer-main {
      display: flex;
      align-items: flex-end;
      gap: var(--spacing-md);
    }

    .input-card {
      flex: 1;
      display: flex;
      align-items: flex-end;
      background: var(--color-gray-50);
      border: var(--ui-border-width) solid var(--border-subtle);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-xs) var(--spacing-md);
      transition: var(--transition-base);

      &:focus-within {
        background: var(--bg-surface);
        border-color: var(--color-primary);
        box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
      }

      .message-textarea {
        flex: 1;
        border: none;
        background: transparent;
        resize: none;
        padding: var(--spacing-md) 0;
        font-size: var(--font-size-base);
        line-height: var(--line-height-normal);
        outline: none;
        max-height: 150px;
        color: var(--text-primary);
      }
    }

    /* --- Buttons --- */
    .btn-icon-secondary {
      background: none; border: none; cursor: pointer;
      color: var(--text-secondary); padding: var(--spacing-md);
      font-size: var(--font-size-xl);
      transition: var(--transition-fast);
      &:hover { color: var(--color-primary); transform: translateY(-2px); }
    }

    .btn-emoji-trigger {
      background: none; border: none; cursor: pointer;
      color: var(--text-placeholder); padding: var(--spacing-md);
      font-size: var(--font-size-lg);
      &:hover { color: var(--color-primary); }
    }

    .btn-circle-primary {
      width: 44px; height: 44px;
      background: var(--color-primary);
      color: var(--color-on-primary);
      border: none; border-radius: 50%;
      cursor: pointer; display: grid; place-items: center;
      box-shadow: var(--shadow-md);
      transition: var(--transition-fast);

      &:hover:not(:disabled) {
        background: var(--color-primary-hover);
        transform: scale(1.08) translateY(-2px);
      }

      &:disabled { opacity: 0.5; cursor: not-allowed; }

      &.recording {
        background: var(--color-danger-text);
        animation: pulse 1.5s infinite;
      }
    }

    /* --- Progress --- */
    .progress-track {
      height: 3px; background: var(--color-gray-200);
      border-radius: 10px; overflow: hidden;
      .progress-fill {
        height: 100%; background: var(--color-primary);
        transition: width 0.3s ease;
      }
    }

    .btn-text-danger {
      border: none; background: none; cursor: pointer;
      color: var(--color-danger-text); font-weight: var(--font-weight-medium);
      &:hover { text-decoration: underline; }
    }

    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ChatComposerComponent {
  // View Children
  @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('messageInputRef') messageInputRef!: ElementRef<HTMLTextAreaElement>;

  // Input Properties
  @Input() messageInput: string = '';
  @Input() attachmentsInput: File[] = [];
  @Input() isUploading: boolean = false;
  @Input() activeChannel: Channel | null = null;
  @Input() uploadProgress: number = 0;

  // Output Events - Renamed to avoid conflicts
  @Output() sendMessage = new EventEmitter<{ message: string; attachments: File[] }>();
  @Output() typingInput = new EventEmitter<void>();
  @Output() fileSelected = new EventEmitter<File[]>();
  @Output() removeAttachment = new EventEmitter<number>();
  @Output() clearAllInput = new EventEmitter<void>();

  // Internal State with unique names
  internalMessage: string = '';
  internalAttachments = signal<File[]>([]);
  showEmojiPicker = false;
  isVoiceRecording = false;
  maxLength = 5000;
  
  // Voice recording state
  private voiceTimer: any = null;
  private recordingDuration = 0;

  ngOnInit() {
    // Initialize from inputs
    this.internalMessage = this.messageInput || '';
    if (this.attachmentsInput.length > 0) {
      this.internalAttachments.set([...this.attachmentsInput]);
    }
  }

  ngOnChanges() {
    // Update when inputs change
    this.internalMessage = this.messageInput || '';
    if (this.attachmentsInput.length !== this.internalAttachments().length) {
      this.internalAttachments.set([...this.attachmentsInput]);
    }
  }

  // Computed property for send button disabled state
  isButtonDisabled(): boolean {
    return (!this.internalMessage.trim() && this.internalAttachments().length === 0) || 
           this.isUploading || 
           this.isVoiceRecording ||
           this.internalMessage.length > this.maxLength;
  }

  // Auto-resize textarea
  @HostListener('window:resize')
  resizeTextarea() {
    if (this.messageInputRef?.nativeElement) {
      const textarea = this.messageInputRef.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }

  onUserInput() {
    this.typingInput.emit();
    this.resizeTextarea();
  }

  handleEnterKey(event: any) {
    if (event.key === 'Enter' && !event.shiftKey && !this.isButtonDisabled()) {
      event.preventDefault();
      this.triggerSendMessage();
    }
  }

  onSendMessage() {
    this.triggerSendMessage();
  }

  private triggerSendMessage() {
    if (this.isButtonDisabled()) return;

    const trimmedMessage = this.internalMessage.trim();
    
    // Emit the message with attachments
    this.sendMessage.emit({
      message: trimmedMessage,
      attachments: this.internalAttachments()
    });

    // Clear input after sending
    this.internalMessage = '';
    this.internalAttachments.set([]);
    this.clearAllInput.emit();
    this.resizeTextarea();
  }

  // File Handling
  openFilePicker() {
    this.fileInputRef?.nativeElement?.click();
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    
    if (files.length === 0) return;

    // Check file sizes (10MB limit)
    const maxFileSize = 10 * 1024 * 1024;
    const validFiles = files.filter(file => file.size <= maxFileSize);
    
    if (validFiles.length < files.length) {
      console.warn('Some files exceeded size limit');
    }

    // Add to internal attachments
    const current = this.internalAttachments();
    const updated = [...current, ...validFiles];
    this.internalAttachments.set(updated);
    
    // Emit files for upload
    this.fileSelected.emit(validFiles);
    
    // Reset file input
    input.value = '';
  }

  onRemoveAttachment(index: number) {
    const current = this.internalAttachments();
    const updated = current.filter((_, i) => i !== index);
    this.internalAttachments.set(updated);
    this.removeAttachment.emit(index);
  }

  clearAttachments() {
    this.internalAttachments.set([]);
  }

  // File Type Detection
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  getFilePreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  getFileTypeIcon(file: File): string {
    const type = file.type;
    
    if (type.includes('pdf')) return 'pi-file-pdf';
    if (type.includes('word') || type.includes('document')) return 'pi-file-word';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'pi-file-excel';
    if (type.includes('zip') || type.includes('compressed')) return 'pi-file-archive';
    if (type.includes('video')) return 'pi-video';
    if (type.includes('audio')) return 'pi-volume-up';
    
    return 'pi-file';
  }

  truncateFileName(name: string, maxLength: number): string {
    if (name.length <= maxLength) return name;
    const extension = name.split('.').pop();
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    const truncated = nameWithoutExt.substring(0, maxLength - 3);
    return `${truncated}...${extension ? '.' + extension : ''}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  previewImageFile(file: File) {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
  }

  // Emoji Picker
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  closeEmojiPicker() {
    this.showEmojiPicker = false;
  }

  insertEmoji(emoji: string) {
    this.internalMessage += emoji;
    this.showEmojiPicker = false;
    this.resizeTextarea();
  }

  // Voice Recording
  toggleVoiceRecording() {
    if (this.isVoiceRecording) {
      this.stopVoiceRecording();
    } else {
      this.startVoiceRecording();
    }
  }

  private startVoiceRecording() {
    this.isVoiceRecording = true;
    this.recordingDuration = 0;
    
    // Start timer
    this.voiceTimer = setInterval(() => {
      this.recordingDuration++;
      console.log('Recording...', this.recordingDuration, 'seconds');
    }, 1000);
  }

  private stopVoiceRecording() {
    this.isVoiceRecording = false;
    
    if (this.voiceTimer) {
      clearInterval(this.voiceTimer);
      this.voiceTimer = null;
    }
    
    // Here you would process and send the voice recording
    console.log('Voice recording stopped after', this.recordingDuration, 'seconds');
  }

  // Cleanup
  ngOnDestroy() {
    if (this.voiceTimer) {
      clearInterval(this.voiceTimer);
    }
    
    // Revoke object URLs to prevent memory leaks
    this.internalAttachments().forEach(file => {
      if (this.isImageFile(file)) {
        URL.revokeObjectURL(this.getFilePreviewUrl(file));
      }
    });
  }
}
