import { Component, inject, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { NoteService } from '../../core/services/notes.service';

@Component({
  selector: 'app-note-export-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="export-container">
      
      <!-- Option 1: Scope -->
      <div class="form-group">
        <label class="section-label">Export Scope</label>
        <div class="radio-group">
          <div class="radio-item" [class.active]="scope === 'all'" (click)="scope = 'all'">
            <div class="radio-circle">
                <div class="dot" *ngIf="scope === 'all'"></div>
            </div>
            <div class="radio-content">
              <span class="title">All Data</span>
              <span class="desc">Export entire history</span>
            </div>
          </div>

          <div class="radio-item" [class.active]="scope === 'filtered'" (click)="scope = 'filtered'">
            <div class="radio-circle">
                <div class="dot" *ngIf="scope === 'filtered'"></div>
            </div>
            <div class="radio-content">
              <span class="title">Date Range</span>
              <span class="desc">Export specific period</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Date Picker (Simulating p-calendar) -->
      <div class="form-group" *ngIf="scope === 'filtered'">
        <label class="section-label">Select Period</label>
        <div class="date-inputs">
           <input type="date" [(ngModel)]="startDate" class="std-input" placeholder="Start">
           <span class="separator">-</span>
           <input type="date" [(ngModel)]="endDate" class="std-input" placeholder="End">
        </div>
        <!-- Note: In real app use: <p-calendar [(ngModel)]="dateRange" selectionMode="range" ...></p-calendar> -->
      </div>

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
          <i class="pi pi-download" *ngIf="!isLoading"></i>
          <!-- Simple Spinner CSS instead of pi-spinner for preview -->
          <span class="spinner" *ngIf="isLoading"></span>
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
      display: flex; flex-direction: column;
      .title { font-weight: 500; font-size: 0.875rem; color: var(--text); }
      .desc { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
    }

    /* Date Inputs (Replacement for p-calendar) */
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
})
export class NoteExportDialogComponent {
  // Use the mocked classes/tokens
  ref = inject(DynamicDialogRef);
  config = inject(DynamicDialogConfig);
  noteService = inject(NoteService);

  scope: 'all' | 'filtered' = 'all';
  format: 'json' | 'csv' = 'json';
  
  // Using separate strings for native date input instead of Date[] for p-calendar
  startDate: string = '';
  endDate: string = '';
  
  isLoading = false;

  close() {
    this.ref.close();
  }

  onExport() {
    this.isLoading = true;

    if (this.scope === 'all') {
      this.noteService.exportAllUserNotes(this.format).subscribe({
        next: (response) => this.handleDownload(response, `all-notes-export`),
        error: () => this.isLoading = false,
        complete: () => this.isLoading = false
      });
    } else {
      this.noteService.exportNoteData(this.format, this.startDate, this.endDate).subscribe({
        next: (response) => this.handleDownload(response, `notes-export-${this.startDate}`),
        error: () => this.isLoading = false,
        complete: () => this.isLoading = false
      });
    }
  }

  private handleDownload(data: any, filename: string) {
    // Determine Blob Type
    const type = this.format === 'json' ? 'application/json' : 'text/csv';
    const blobData = this.format === 'json' ? JSON.stringify(data, null, 2) : data.mockData;
    
    // In a real browser environment, this triggers a download
    // For this preview, we'll just log it and close
    console.log('Downloading file:', filename, 'Type:', type);
    console.log('Data:', blobData);
    
    const blob = new Blob([blobData], { type });
    const url = window.URL.createObjectURL(blob);
    
    // Create Link
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${this.format}`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    this.ref.close();
  }
}