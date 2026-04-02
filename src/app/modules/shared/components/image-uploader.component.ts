import { Component, EventEmitter, Output, inject, signal, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

// --- PrimeNG Modules ---
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AppMessageService } from '../../../core/services/message.service';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [
    CommonModule,
    ProgressSpinnerModule,
    ToastModule,
    ButtonModule
  ],
  template: `
    <div class="uploader-wrapper" [class.is-dialog]="isDialog()">
      <!-- Header (Only if in Dialog) -->
      @if (isDialog()) {
        <div class="uploader-header">
          <p class="subtitle">{{ config?.data?.description || 'Select or drag an image to upload.' }}</p>
        </div>
      }

      <div class="drop-zone" 
           [class.has-file]="!!selectedFile()"
           [class.uploading]="isUploading()"
           (click)="!isUploading() && fileInput.click()"
           (dragover)="$event.preventDefault()"
           (drop)="onFileDropped($event)">
        
        <input #fileInput type="file" [accept]="accept()" (change)="onFileSelected($event)" hidden>

        <!-- Initial/Empty State -->
        @if (!selectedFile() && !isUploading()) {
          <div class="empty-state fade-in">
            <div class="icon-circle">
              <i class="pi pi-images"></i>
            </div>
            <span class="label">Click or Drag Image</span>
            <span class="hint">Supports: PNG, JPG (Max {{ maxSize() }}MB)</span>
          </div>
        }

        <!-- File Preview -->
        @if (selectedFile() && !isUploading()) {
          <div class="preview-container fade-in">
            <img [src]="previewUrl()" alt="Preview" class="preview-img">
            <div class="preview-overlay">
              <p-button icon="pi pi-refresh" severity="secondary" [rounded]="true" (click)="$event.stopPropagation(); fileInput.click()"></p-button>
              <p-button icon="pi pi-trash" severity="danger" [rounded]="true" (click)="$event.stopPropagation(); clearSelection()"></p-button>
            </div>
          </div>
        }

        <!-- Uploading State -->
        @if (isUploading()) {
          <div class="loading-state">
            <p-progressSpinner styleClass="w-3rem h-3rem" strokeWidth="4"></p-progressSpinner>
            <span class="status-text">Processing Upload...</span>
          </div>
        }
      </div>

      <!-- Footer Actions -->
      <div class="uploader-footer">
        @if (isDialog()) {
          <p-button label="Cancel" icon="pi pi-times" severity="secondary" [text]="true" (click)="ref?.close()"></p-button>
        }
        <p-button [label]="isUploading() ? 'Uploading...' : 'Confirm Upload'" 
                  icon="pi pi-check" 
                  [disabled]="!selectedFile() || isUploading()" 
                  [loading]="isUploading()"
                  (click)="handleUpload()">
        </p-button>
      </div>
    </div>
    <p-toast></p-toast>
  `,
  styles: [`
    .uploader-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      min-width: 320px;
    }

    .uploader-wrapper.is-dialog { padding: 0; }

    .uploader-header .subtitle {
      color: var(--theme-text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    .drop-zone {
      position: relative;
      height: 240px;
      border: 2px dashed var(--theme-border-primary);
      border-radius: 12px;
      background: var(--theme-bg-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      overflow: hidden;
    }

    .drop-zone:hover:not(.uploading) {
      border-color: var(--theme-accent-primary);
      background: rgba(var(--accent-primary-rgb, 59, 130, 246), 0.04);
    }

    .drop-zone.has-file { border-style: solid; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;
    }

    .icon-circle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--theme-bg-ternary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--theme-text-tertiary);
      font-size: 1.5rem;
    }

    .empty-state .label { font-weight: 600; color: var(--theme-text-primary); }
    .empty-state .hint { font-size: 0.75rem; color: var(--theme-text-tertiary); }

    .preview-container { width: 100%; height: 100%; position: relative; }
    .preview-img { width: 100%; height: 100%; object-fit: contain; background: #000; }

    .preview-overlay {
      position: absolute;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 0.5rem;
      background: rgba(0,0,0,0.5);
      padding: 0.5rem;
      border-radius: 40px;
      backdrop-filter: blur(4px);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      color: var(--theme-text-secondary);
    }

    .uploader-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .manish-fade-in {
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageUploaderComponent implements OnInit {
  // Dependencies
  protected config = inject(DynamicDialogConfig, { optional: true });
  protected ref = inject(DynamicDialogRef, { optional: true });
  private appMessage = inject(AppMessageService);

  // Constraints (Inputs for direct usage, Defaults from config for dialog)
  @Input() accept = signal('image/*');
  @Input() maxSize = signal(5); // MB

  @Output() uploaded = new EventEmitter<any>();

  // State
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  isUploading = signal(false);
  isDialog = signal(false);

  ngOnInit() {
    if (this.config?.data) {
      this.isDialog.set(true);
      if (this.config.data.accept) this.accept.set(this.config.data.accept);
      if (this.config.data.maxSize) this.maxSize.set(this.config.data.maxSize);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) this.processFile(file);
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  processFile(file: File) {
    // 1. Type Check
    if (!file.type.startsWith('image/')) {
      this.appMessage.showError('Invalid File Type ,Please select an image file (PNG, JPG, etc).');
      return;
    }

    // 2. Size Check
    if (file.size > this.maxSize() * 1024 * 1024) {
      this.appMessage.showError(`File Too Large, Image must be smaller than ${this.maxSize()}MB.`);
      return;
    }

    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = (e: any) => this.previewUrl.set(e.target.result);
    reader.readAsDataURL(file);
  }

  clearSelection() {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
  }

  handleUpload() {
    const file = this.selectedFile();
    if (!file) return;

    // Check if an upload function was provided via dialog config
    const uploadFn = this.config?.data?.uploadFn as (f: File) => Observable<any>;

    if (uploadFn) {
      this.isUploading.set(true);
      uploadFn(file).pipe(
        finalize(() => this.isUploading.set(false))
      ).subscribe({
        next: (res) => {
          this.appMessage.showSuccess(`Upload Complete Your image has been saved successfully.`);
          this.uploaded.emit(res);
          if (this.isDialog()) this.ref?.close(res);
        },
        error: (err) => {
          this.appMessage.handleHttpError(err);
        }
      });
    } else {
      // If no uploadFn, just emit the file and let the parent handle it
      this.uploaded.emit(file);
      if (this.isDialog()) this.ref?.close(file);
    }
  }
}