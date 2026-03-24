import { MessageService } from "primeng/api";
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { NoteService } from '../../core/services/notes.service';
import { AppMessageService } from "../../core/services/message.service";
import { finalize } from "rxjs";
import { DatePickerModule } from 'primeng/datepicker';


@Component({
  selector: 'app-note-export-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule],
  template: `
    <div class="export-container">
      
      <!-- Option 1: Scope -->
      <div class="form-group">
        <label class="section-label">Export Scope</label>
        <div class="radio-group">
          <div class="radio-item" [class.active]="scope === 'all'" (click)="scope = 'all'">
            <div class="radio-circle">
                @if (scope === 'all') {
                  <div class="dot"></div>
                }
            </div>
            <div class="radio-content">
              <span class="title">All Data</span>
              <span class="desc">Export entire history</span>
            </div>
          </div>

          <div class="radio-item" [class.active]="scope === 'filtered'" (click)="scope = 'filtered'">
            <div class="radio-circle">
                @if (scope === 'filtered') {
                  <div class="dot"></div>
                }
            </div>
            <div class="radio-content">
              <span class="title">Date Range</span>
              <span class="desc">Export specific period</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Date Picker (Simulating p-datepicker) -->
      @if (scope === 'filtered') {
        <div class="form-group">
          <label class="section-label">Select Period</label>
          <div class="date-inputs">
             <p-datepicker [(ngModel)]="startDate" placeholder="Start" dateFormat="yy-mm-dd" [showIcon]="true" iconDisplay="input" appendTo="body" styleClass="w-full"></p-datepicker>
             <span class="separator">-</span>
             <p-datepicker [(ngModel)]="endDate" placeholder="End" dateFormat="yy-mm-dd" [showIcon]="true" iconDisplay="input" appendTo="body" styleClass="w-full"></p-datepicker>
          </div>
        </div>
      }


      <!-- Option 2: Format -->
      <div class="form-group">
        <label class="section-label">Format</label>
        <div class="format-options">
          <button class="format-btn" [class.selected]="format === 'json'" (click)="format = 'json'">
            <i class="pi pi-code"></i> JSON
          </button>
          <button class="format-btn" [class.selected]="format === 'csv'" (click)="format = 'csv'">
            <i class="pi pi-file-excel"></i> CSV
          </button>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="dialog-footer">
        <button class="btn-cancel" (click)="close()">Cancel</button>
        <button class="btn-confirm" 
                [disabled]="isLoading || (scope === 'filtered' && (!startDate || !endDate))"
                (click)="onExport()">
          @if (!isLoading) {
            <i class="pi pi-download"></i>
          }
          @if (isLoading) {
            <span class="spinner"></span>
          }
          {{ isLoading ? 'Exporting...' : 'Download Export' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 1.5rem;
      font-family: 'Inter', sans-serif;
      --bg-hover: var(--component-bg-hover, #f3f4f6);
      --accent: var(--accent-primary, #3b82f6);
      --text: var(--text-primary, #1f2937);
      --text-muted: var(--text-secondary, #6b7280);
      --border: var(--border-secondary, #e5e7eb);
    }

    .export-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 400px;
      margin: 0 auto;
      background: white; 
    }

    .section-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.75rem;
    }

    /* Radio Cards */
    .radio-group {
      display: flex;
      gap: 1rem;
    }

    .radio-item {
      flex: 1;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover { background: var(--bg-hover); }
      &.active { 
        border-color: var(--accent); 
        background: rgba(59, 130, 246, 0.05);
      }
    }

    .radio-circle {
      width: 18px; height: 18px;
      border-radius: 50%;
      border: 2px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      margin-top: 2px;
      .active & { border-color: var(--accent); }
      .dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; }
    }

    .radio-content {
      display: flex;
      flex-direction: column;
      .title { font-weight: 500; font-size: 0.875rem; color: var(--text); }
      .desc { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
    }

    /* Date Inputs (Replacement for p-datepicker) */
    .date-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .std-input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.875rem;
      color: var(--text);
    }
    .separator { color: var(--text-muted); }

    /* Format Buttons */
    .format-options {
      display: flex;
      gap: 0.75rem;
    }

    .format-btn {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid var(--border);
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      color: var(--text-muted);
      transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;

      &:hover { background: var(--bg-hover); color: var(--text); }
      &.selected {
        background: var(--text);
        color: white;
        border-color: var(--text);
      }
    }

    /* Footer */
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }

    .btn-cancel {
      padding: 0.6rem 1.25rem;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-weight: 500;
      &:hover { color: var(--text); }
    }

    .btn-confirm {
      padding: 0.6rem 1.25rem;
      background: var(--accent);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      display: flex; align-items: center; gap: 0.5rem;
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    /* Loading Spinner */
    .spinner {
      width: 12px; height: 12px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})export class NoteExportDialogComponent {
  ref = inject(DynamicDialogRef);
  config = inject(DynamicDialogConfig);
  noteService = inject(NoteService);
  messageService = inject(AppMessageService);
  private cdr = inject(ChangeDetectorRef); // Essential for OnPush/Manual state updates

  scope: 'all' | 'filtered' = 'all';
  format: 'json' | 'csv' = 'json';

  startDate: Date | null = null;
  endDate: Date | null = null;


  isLoading = false;

  close() {
    this.ref.close();
  }

  onExport() {
    this.isLoading = true;

    const export$ = this.scope === 'all' 
      ? this.noteService.exportAllUserNotes(this.format)
      : this.noteService.exportNoteData(
          this.format, 
          this.startDate instanceof Date ? this.startDate.toISOString().split('T')[0] : (this.startDate || undefined), 
          this.endDate instanceof Date ? this.endDate.toISOString().split('T')[0] : (this.endDate || undefined)
        );


    export$.pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (response) => {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = this.scope === 'all' ? `all-notes-${timestamp}` : `filtered-notes-${timestamp}`;
        
        this.messageService.showSuccess(`Notes exported successfully in ${this.format.toUpperCase()} format.`);
        this.handleDownload(response, filename);
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
      }
    });
  }

  private handleDownload(data: any, filename: string) {
    // If the service returns a Blob directly, use it. Otherwise, create one.
    const isBlob = data instanceof Blob;
    const type = this.format === 'json' ? 'application/json' : 'text/csv';
    
    let blob: Blob;
    if (isBlob) {
      blob = data;
    } else {
      const blobData = this.format === 'json' ? JSON.stringify(data, null, 2) : (data.mockData || data);
      blob = new Blob([blobData], { type });
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${filename}.${this.format}`;
    
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    this.ref.close();
  }
}