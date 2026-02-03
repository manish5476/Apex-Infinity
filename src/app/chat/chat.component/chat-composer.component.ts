import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { Channel } from './chat.models';

@Component({
  selector: 'app-chat-composer',
  standalone: true,
  imports: [CommonModule, FormsModule, TooltipModule],
  templateUrl: './chat-composer.component.html', // Pointing to HTML file is cleaner, but I will provide template below if you prefer inline
  styleUrls: ['./chat-composer.component.scss'] // MOVED STYLES HERE
})
export class ChatComposerComponent {
  @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('messageInputRef') messageInputRef!: ElementRef<HTMLTextAreaElement>;

  @Input() messageInput: string = '';
  @Input() attachmentsInput: File[] = [];
  @Input() isUploading: boolean = false;
  @Input() activeChannel: Channel | null = null;
  @Input() uploadProgress: number = 0;

  @Output() sendMessage = new EventEmitter<{ message: string; attachments: File[] }>();
  @Output() typingInput = new EventEmitter<void>();
  @Output() fileSelected = new EventEmitter<File[]>();
  @Output() removeAttachment = new EventEmitter<number>();
  @Output() clearAllInput = new EventEmitter<void>();

  internalMessage: string = '';
  internalAttachments = signal<File[]>([]);
  showEmojiPicker = false;
  isVoiceRecording = false;
  isDragging = false;
  recordingDuration = 0;
  private voiceTimer: any = null;

  ngOnInit() {
    this.internalMessage = this.messageInput || '';
    if (this.attachmentsInput.length > 0) this.internalAttachments.set([...this.attachmentsInput]);
  }

  ngOnChanges() {
    this.internalMessage = this.messageInput || '';
    if (this.attachmentsInput.length !== this.internalAttachments().length) {
      this.internalAttachments.set([...this.attachmentsInput]);
    }
  }

  getPlaceholder(): string {
    return this.isVoiceRecording ? '' : 'Message #' + (this.activeChannel?.name || 'general');
  }

  isButtonDisabled(): boolean {
    return (!this.internalMessage.trim() && this.internalAttachments().length === 0) || this.isUploading || this.isVoiceRecording;
  }

  @HostListener('dragover', ['$event']) onDragOver(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.isDragging = true;
  }

  @HostListener('dragleave', ['$event']) onDragLeave(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.isDragging = false;
  }

  @HostListener('drop', ['$event']) onDrop(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.isDragging = false;
    const files = Array.from(evt.dataTransfer?.files || []);
    if (files.length > 0) this.processFiles(files);
  }

  openFilePicker() { this.fileInputRef?.nativeElement?.click(); }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.processFiles(files);
    input.value = '';
  }

  processFiles(files: File[]) {
    if (files.length === 0) return;
    const current = this.internalAttachments();
    this.internalAttachments.set([...current, ...files]);
    this.fileSelected.emit(files);
  }

  onRemoveAttachment(index: number) {
    const current = this.internalAttachments();
    this.internalAttachments.set(current.filter((_, i) => i !== index));
    this.removeAttachment.emit(index);
  }

  clearAttachments() {
    this.internalAttachments.set([]);
    this.clearAllInput.emit();
  }

  onUserInput() {
    this.typingInput.emit();
    this.resizeTextarea();
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !this.isButtonDisabled()) {
      event.preventDefault();
      this.onSendMessage();
    }
  }

  onSendMessage() {
    if (this.isButtonDisabled()) return;
    this.sendMessage.emit({ message: this.internalMessage.trim(), attachments: this.internalAttachments() });
    this.internalMessage = '';
    this.internalAttachments.set([]);
    this.clearAllInput.emit();
    this.resizeTextarea();
  }

  insertFormat(char: string) {
    const textarea = this.messageInputRef.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = this.internalMessage;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    
    // Fixed template literal syntax
    this.internalMessage = before + char + selected + char + after;
    
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + char.length, end + char.length);
    });
  }

  startVoiceRecording() {
    this.isVoiceRecording = true;
    this.recordingDuration = 0;
    this.voiceTimer = setInterval(() => { this.recordingDuration++; }, 1000);
  }

  stopVoiceRecording() {
    this.endRecording();
    console.log('Voice sent:', this.recordingDuration);
  }

  cancelVoiceRecording() {
    this.endRecording();
  }

  private endRecording() {
    this.isVoiceRecording = false;
    clearInterval(this.voiceTimer);
    this.recordingDuration = 0;
  }

  resizeTextarea() {
    const el = this.messageInputRef?.nativeElement;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 150) + 'px';
    }
  }

  toggleEmojiPicker() { this.showEmojiPicker = !this.showEmojiPicker; }
  
  isImageFile(file: File) { return file.type.startsWith('image/'); }
  getFilePreviewUrl(file: File) { return URL.createObjectURL(file); }
  truncateFileName(name: string, len: number) { return name.length > len ? name.substring(0, len-3) + '...' : name; }
  
  formatFileSize(bytes: number) { 
      if(bytes === 0) return '0 B'; 
      const i = Math.floor(Math.log(bytes) / Math.log(1024)); 
      return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + ['B','KB','MB','GB'][i]; 
  }

  formatDuration(sec: number) { 
      const m = Math.floor(sec/60); 
      const s = sec % 60; 
      // Fixed template literal
      return m + ':' + (s < 10 ? '0' + s : s); 
  }

  getFileTypeIcon(file: File) {
      if (file.type.includes('pdf')) return 'pi-file-pdf';
      if (file.type.includes('image')) return 'pi-image';
      return 'pi-file'; 
  }

  ngOnDestroy() { clearInterval(this.voiceTimer); }
}