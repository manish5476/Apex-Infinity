import { Component, inject, signal, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { NoteService } from '../../../core/services/notes.service';
import { Note } from '../../../core/models/note.types';

@Component({
  selector: 'app-template-selector',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="template-selector-container">
      
      <!-- Header / Search (Future proofing) -->
      <div class="selector-header">
        <p>Select a template to start with. This will overwrite your current title and content.</p>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i> Loading templates...
        </div>
      }

      <!-- Empty State -->
      @if (!isLoading() && templates().length === 0) {
        <div class="empty-state">
          <div class="icon-circle"><i class="pi pi-file-o"></i></div>
          <h3>No templates found</h3>
          <p>Create a note and check "Save as Template" to add one here.</p>
          <button class="btn-text" (click)="close()">Cancel</button>
        </div>
      }

      <!-- Templates Grid -->
      <div class="templates-grid custom-scrollbar">
        @for (template of templates(); track template._id) {
          <div class="template-card" (click)="selectTemplate(template)">
            
            <div class="card-preview">
              <!-- Mini visual representation of content -->
              <div class="mini-lines">
                <div class="line title"></div>
                <div class="line"></div>
                <div class="line"></div>
                <div class="line short"></div>
              </div>
              <div class="hover-overlay">
                <button class="btn-use">Use Template</button>
              </div>
            </div>

            <div class="card-meta">
              <span class="type-icon" [ngClass]="template.noteType">
                <i [class]="getTypeIcon(template.noteType)"></i>
              </span>
              <div class="info">
                <h4 class="title">{{ template.title }}</h4>
                <span class="date">Updated {{ template.updatedAt | date:'MMM d' }}</span>
              </div>
            </div>

          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      /* Using your existing theme tokens */
      --bg-hover: var(--bg-ternary);
      --accent: var(--accent-primary);
      --border: var(--border-secondary);
    }

    .template-selector-container {
      padding: 0.5rem;
      font-family: var(--font-body);
    }

    .selector-header {
      margin-bottom: 1.5rem;
      p { color: var(--text-secondary); font-size: 0.9rem; margin: 0; }
    }

    /* Grid Layout */
    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      max-height: 400px;
      overflow-y: auto;
      padding-bottom: 1rem;
    }

    /* Card Styling */
    .template-card {
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: var(--ui-border-radius-lg);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      display: flex;
      flex-direction: column;

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        border-color: var(--accent);

        .card-preview { background: var(--bg-hover); }
        .hover-overlay { opacity: 1; }
      }
    }

    /* Preview Area (Top) */
    .card-preview {
      height: 120px;
      background: var(--bg-secondary);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid var(--border);
      transition: background 0.2s;

      /* Abstract Lines */
      .mini-lines {
        width: 60%;
        display: flex;
        flex-direction: column;
        gap: 6px;
        opacity: 0.5;
        
        .line { height: 4px; background: var(--text-tertiary); border-radius: 2px; width: 100%; }
        .title { height: 6px; width: 70%; background: var(--text-secondary); margin-bottom: 4px; }
        .short { width: 40%; }
      }

      /* Hover Button */
      .hover-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
        backdrop-filter: blur(1px);

        .btn-use {
          background: var(--accent);
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: var(--shadow-md);
        }
      }
    }

    /* Meta Info (Bottom) */
    .card-meta {
      padding: 12px;
      display: flex;
      gap: 10px;
      align-items: center;

      .type-icon {
        width: 32px; height: 32px;
        border-radius: 8px;
        background: var(--bg-ternary);
        color: var(--text-secondary);
        display: flex; align-items: center; justify-content: center;
        font-size: 1rem;
        
        &.meeting { color: #3b82f6; background: #eff6ff; }
        &.task { color: #10b981; background: #f0fdf4; }
      }

      .info {
        flex: 1;
        min-width: 0;
        .title { font-size: 0.9rem; font-weight: 600; margin: 0 0 2px 0; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .date { font-size: 0.75rem; color: var(--text-tertiary); display: block; }
      }
    }

    /* States */
    .loading-state, .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-secondary);
      
      .icon-circle { width: 48px; height: 48px; background: var(--bg-ternary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto; i { font-size: 1.5rem; } }
      h3 { margin: 0 0 0.5rem 0; color: var(--text-primary); }
      p { margin: 0 0 1rem 0; font-size: 0.9rem; }
      .btn-text { background: none; border: none; color: var(--accent); font-weight: 600; cursor: pointer; &:hover { text-decoration: underline; } }
    }
  `]
})
export class TemplateSelectorComponent implements OnInit {
  ref = inject(DynamicDialogRef);
  noteService = inject(NoteService);

  templates = signal<Note[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    // Assuming getTemplate returns the list of templates based on your previous service definition
    // Usually endpoint is GET /templates
    this.noteService.getTemplate().subscribe({
      next: (res: any) => {
        // Handle if response is array or wrapped object
        const data = Array.isArray(res.data) ? res.data : (res.data.templates || [res.data.note].filter(Boolean));
        this.templates.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load templates', err);
        this.isLoading.set(false);
      }
    });
  }

  selectTemplate(template: Note) {
    this.ref.close(template);
  }

  close() {
    this.ref.close();
  }

  getTypeIcon(type: string) {
    const map: any = { note: 'pi pi-file', meeting: 'pi pi-calendar', task: 'pi pi-check-square', project: 'pi pi-briefcase' };
    return map[type] || 'pi pi-file';
  }
}