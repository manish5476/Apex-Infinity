import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { CustomDepartmentTreeComponent } from "./custom-dept-tree.component";

/* ══════════════════════════════════════════════════════
   DIRECTORY EXPLORER COMPONENT
══════════════════════════════════════════════════════ */
@Component({
  selector: 'app-directory-explorer',
  standalone: true,
  imports: [CommonModule, CustomDepartmentTreeComponent],
  template: `
    <div class="premium-card directory-card">
      
      <!-- Header -->
      <div class="card-header">
        <div class="header-title">
          <div class="header-icon"><i class="pi pi-folder-open"></i></div>
          <span>Directory Explorer</span>
        </div>
        <div class="badge-count">
          <span class="count-dot"></span> {{ data.length }} Items
        </div>
      </div>
      
      <!-- Body -->
      <div class="card-body p-0">
        @if (data.length) {
          <div class="tree-wrapper">
            <app-custom-dept-tree [nodes]="data"></app-custom-dept-tree>
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-glyph"><i class="pi pi-folder"></i></div>
            <h3>No Directory Data</h3>
            <p>There are no departments available to display in the explorer.</p>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    /* ══════════════════════════════════════════════════════
       DIRECTORY EXPLORER - PREMIUM UI
    ══════════════════════════════════════════════════════ */
    :host {
      display: block;
      height: 100%;
    }

    .directory-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    /* ── HEADER ────────────────────────────────────────── */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg) var(--spacing-2xl);
      background: var(--bg-secondary);
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
      z-index: 2;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      font-family: var(--font-heading);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }

    .header-icon {
      width: 32px; height: 32px;
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
      color: var(--accent-primary);
      border-radius: var(--ui-border-radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-md);
    }

    .badge-count {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      background: var(--bg-primary);
      padding: 6px 14px;
      border-radius: var(--ui-border-radius-pill);
      border: var(--ui-border-width) solid var(--border-primary);
      color: var(--text-secondary);
      box-shadow: var(--shadow-xs);
    }

    .count-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--accent-primary);
      opacity: 0.8;
    }

    /* ── BODY & SCROLL ─────────────────────────────────── */
    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      background: var(--bg-primary);
      overflow: hidden;
    }
    
    .card-body.p-0 { padding: 0; }

    .tree-wrapper {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      overflow: auto;
      padding: var(--spacing-xl) var(--spacing-2xl);

      /* Premium Scrollbar */
      &::-webkit-scrollbar { width: 8px; height: 8px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { 
        background: var(--border-secondary); 
        border-radius: var(--ui-border-radius-pill); 
      }
      &::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
    }

    /* ── EMPTY STATE ───────────────────────────────────── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%;
      padding: var(--spacing-3xl); 
      text-align: center;
    }

    .empty-glyph {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; color: var(--text-tertiary);
      margin-bottom: var(--spacing-lg);
      opacity: 0.7;
    }

    .empty-state h3 { 
      margin: 0 0 8px 0; 
      font-family: var(--font-heading); 
      font-size: var(--font-size-xl); 
      color: var(--text-primary); 
    }

    .empty-state p { 
      margin: 0; 
      font-size: var(--font-size-sm); 
      color: var(--text-secondary); 
    }
  `]
})
export class DirectoryExplorerComponent {
  @Input() data: any[] = [];
}