// src/app/shared/ui/file-upload/file-upload.component.ts
import { Component, ChangeDetectionStrategy, input, model, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Component: app-file-upload
 * Purpose: Enterprise drag-and-drop file upload zone with file validation, previews, batch management, and progress indicators.
 */
@Component({
    selector: 'app-file-upload',
    standalone: true,
    imports: [CommonModule, ButtonModule, ProgressBarModule, TooltipModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'block w-full'
    },
    template: `
    <div class="flex flex-col gap-[var(--spacing-md)]">
      
      <!-- Drag & Drop Zone -->
      <div
        class="relative flex flex-col items-center justify-center p-[var(--spacing-2xl)] border-2 border-dashed rounded-[var(--ui-border-radius-lg)] transition-all cursor-pointer select-none"
        [class]="dropzoneClasses()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()">
        
        <input
          #fileInput
          type="file"
          class="hidden"
          [accept]="accept()"
          [multiple]="multiple()"
          [disabled]="disabled() || uploading()"
          (change)="onFileSelect($event)" />

        <div class="flex flex-col items-center text-center gap-[var(--spacing-sm)] pointer-events-none">
          <div class="p-3 rounded-full bg-[var(--bg-secondary)] text-[var(--accent-primary)] mb-1">
            <ng-content select="[dropzone-icon]">
              <i class="pi pi-cloud-upload text-3xl"></i>
            </ng-content>
          </div>

          <div class="flex flex-col gap-0.5">
            <p class="text-[length:var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] m-0">
              <span class="text-[var(--accent-primary)] hover:underline">Click to upload</span> or drag and drop
            </p>
            <p class="text-[length:var(--font-size-xs)] text-[var(--text-secondary)] m-0">
              {{ displayHint() }}
            </p>
          </div>
        </div>
      </div>

      <!-- Active Upload Progress Bar -->
      @if (uploading()) {
        <div class="flex flex-col gap-1.5 p-[var(--spacing-md)] bg-[var(--bg-secondary)] rounded-[var(--ui-border-radius)] border border-[var(--border-secondary)]">
          <div class="flex items-center justify-between text-[length:var(--font-size-xs)] font-[var(--font-weight-medium)] text-[var(--text-primary)]">
            <span class="flex items-center gap-2">
              <i class="pi pi-spin pi-spinner text-[var(--accent-primary)]"></i>
              Uploading {{ files().length }} file(s)...
            </span>
            <span>{{ progress() }}%</span>
          </div>
          <p-progressBar [value]="progress()" [showValue]="false" styleClass="h-2"></p-progressBar>
        </div>
      }

      <!-- Selected File List Previews -->
      @if (files().length > 0) {
        <div class="flex flex-col gap-[var(--spacing-xs)] mt-1">
          <div class="flex items-center justify-between px-1">
            <span class="text-[length:var(--font-size-xs)] font-[var(--font-weight-semibold)] text-[var(--text-secondary)] uppercase tracking-wider">
              Selected Files ({{ files().length }}/{{ maxFiles() }})
            </span>
            
            @if (!uploading() && !disabled()) {
              <p-button
                label="Clear All"
                [link]="true"
                severity="danger"
                size="small"
                styleClass="p-0 text-[length:var(--font-size-xs)]"
                (onClick)="clearAllFiles()">
              </p-button>
            }
          </div>

          <div class="divide-y divide-[var(--border-secondary)] border border-[var(--border-secondary)] rounded-[var(--ui-border-radius)] bg-[var(--bg-primary)] overflow-hidden">
            @for (file of files(); track file.name + file.size; let index = $index) {
              <div class="flex items-center justify-between p-[var(--spacing-sm)] hover:bg-[var(--bg-secondary)] transition-colors">
                
                <div class="flex items-center gap-[var(--spacing-md)] min-w-0 flex-1 pr-2">
                  <div class="flex items-center justify-center h-9 w-9 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] shrink-0">
                    <i [class]="getFileIcon(file) + ' text-lg'"></i>
                  </div>

                  <div class="flex flex-col min-w-0">
                    <span class="text-[length:var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--text-primary)] truncate">
                      {{ file.name }}
                    </span>
                    <span class="text-[length:var(--font-size-xs)] text-[var(--text-secondary)]">
                      {{ formatBytes(file.size) }}
                    </span>
                  </div>
                </div>

                @if (!uploading() && !disabled()) {
                  <p-button
                    icon="pi pi-trash"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    size="small"
                    pTooltip="Remove file"
                    (onClick)="removeFile(index)">
                  </p-button>
                }
              </div>
            }
          </div>

          <!-- Bottom Action Bar -->
          <div class="flex items-center justify-between pt-[var(--spacing-sm)]">
            <ng-content select="[extra-actions]"></ng-content>
            
            @if (!uploading() && files().length > 0) {
              <p-button
                label="Upload Selected Files"
                icon="pi pi-upload"
                severity="primary"
                size="small"
                [disabled]="disabled()"
                (onClick)="triggerUpload()">
              </p-button>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class FileUploadComponent {
    files = model<File[]>([]);

    accept = input<string>('*');
    maxFileSize = input<number>(10 * 1024 * 1024); // 10MB Default
    maxFiles = input<number>(5);
    multiple = input<boolean>(true);
    uploading = input<boolean>(false);
    progress = input<number>(0);
    disabled = input<boolean>(false);
    hint = input<string>('');

    upload = output<File[]>();
    fileRejected = output<{ file: File; reason: string }>();

    protected isDragging = signal<boolean>(false);

    protected displayHint = computed(() => {
        if (this.hint()) return this.hint();
        const sizeMb = (this.maxFileSize() / (1024 * 1024)).toFixed(0);
        return `Supports ${this.accept() === '*' ? 'all files' : this.accept()} up to ${sizeMb}MB (Max ${this.maxFiles()} files)`;
    });

    protected dropzoneClasses = computed(() => {
        if (this.disabled()) {
            return 'border-[var(--border-secondary)] bg-[var(--bg-secondary)] opacity-60 cursor-not-allowed';
        }
        if (this.isDragging()) {
            return 'border-[var(--accent-primary)] bg-[var(--accent-focus)] scale-[0.99]';
        }
        return 'border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-secondary)]';
    });

    protected onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        if (!this.disabled() && !this.uploading()) {
            this.isDragging.set(true);
        }
    }

    protected onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(false);
    }

    protected onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging.set(false);

        if (this.disabled() || this.uploading()) return;

        const droppedFiles = event.dataTransfer?.files;
        if (droppedFiles && droppedFiles.length > 0) {
            this.processFiles(Array.from(droppedFiles));
        }
    }

    protected onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.processFiles(Array.from(input.files));
            input.value = ''; // Reset input selection
        }
    }

    private processFiles(newFiles: File[]): void {
        const currentFiles = [...this.files()];
        const validFiles: File[] = [];

        for (const file of newFiles) {
            if (currentFiles.length + validFiles.length >= this.maxFiles()) {
                this.fileRejected.emit({ file, reason: `Maximum limit of ${this.maxFiles()} file(s) reached.` });
                continue;
            }

            if (file.size > this.maxFileSize()) {
                const sizeMb = (this.maxFileSize() / (1024 * 1024)).toFixed(0);
                this.fileRejected.emit({ file, reason: `File size exceeds ${sizeMb}MB limit.` });
                continue;
            }

            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            this.files.set(this.multiple() ? [...currentFiles, ...validFiles] : [validFiles[0]]);
        }
    }

    protected removeFile(index: number): void {
        const updated = [...this.files()];
        updated.splice(index, 1);
        this.files.set(updated);
    }

    protected clearAllFiles(): void {
        this.files.set([]);
    }

    protected triggerUpload(): void {
        if (this.files().length > 0) {
            this.upload.emit(this.files());
        }
    }

    protected formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    protected getFileIcon(file: File): string {
        const name = file.name.toLowerCase();
        if (name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
            return 'pi pi-file-excel text-emerald-600';
        }
        if (name.endsWith('.pdf')) {
            return 'pi pi-file-pdf text-rose-600';
        }
        if (file.type.startsWith('image/')) {
            return 'pi pi-image text-blue-600';
        }
        if (name.endsWith('.zip') || name.endsWith('.rar')) {
            return 'pi pi-box text-amber-600';
        }
        return 'pi pi-file text-slate-500';
    }
}