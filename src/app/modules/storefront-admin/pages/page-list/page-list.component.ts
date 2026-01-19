import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';

@Component({
  selector: 'app-page-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      
      <header class="page-header">
        <div class="header-content">
          <h1 class="page-title">Storefront Pages</h1>
          <p class="page-subtitle">Manage your landing pages and marketing campaigns.</p>
        </div>

        <button type="button" (click)="openCreateModal()" class="btn btn-primary">
          <i class="fas fa-plus icon"></i>
          <span>Create New Page</span>
        </button>
      </header>

      @if (isLoading()) {
        <div class="loader-container">
          <div class="spinner"></div>
        </div>
      } @else {

        <div class="card-grid">

          <button (click)="openCreateModal()" class="create-card">
            <div class="create-icon-wrapper">
              <i class="fas fa-plus"></i>
            </div>
            <span class="create-label">Create New Page</span>
          </button>

          @for (page of pages(); track page._id) {
            <div class="page-card">
              
              <div class="status-badge-wrapper">
                <span class="status-dot" [class.published]="page.isPublished"></span>
              </div>

              <div class="card-header">
                <div class="page-icon" [class.is-home]="page.isHomepage">
                  <i class="fas" [class]="page.isHomepage ? 'fa-home' : 'fa-layer-group'"></i>
                </div>

                <h3 class="card-title" [title]="page.name">{{ page.name }}</h3>
                
                <div class="slug-wrapper">
                  <code class="slug-code">/{{ page.slug }}</code>
                  <button (click)="viewLive(page.slug)" class="link-btn" title="View Live">
                    <i class="fas fa-external-link-alt"></i>
                  </button>
                </div>
              </div>

              <div class="card-footer">
                <div class="meta-row">
                   <span class="meta-status" [class.published]="page.isPublished">
                     {{ page.isPublished ? 'PUBLISHED' : 'DRAFT' }}
                   </span>
                   <span class="meta-date">{{ page.updatedAt | date:'MMM d' }}</span>
                </div>

                <div class="action-grid">
                  <a [routerLink]="[page._id, 'builder']" class="btn btn-secondary btn-block">
                    <i class="fas fa-pen icon"></i> Builder
                  </a>

                  <div class="icon-actions">
                    <button (click)="togglePublish(page)" 
                            class="icon-btn" 
                            [title]="page.isPublished ? 'Unpublish' : 'Publish'"
                            [class.active]="page.isPublished">
                       <i class="fas" [class]="page.isPublished ? 'fa-eye-slash' : 'fa-cloud-upload-alt'"></i>
                    </button>
                    <button (click)="deletePage(page._id)" class="icon-btn danger" title="Delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          }

          @if (pages().length === 0) {
            <div class="empty-state">
              <i class="fas fa-ghost empty-icon"></i>
              <p>No pages yet.</p>
            </div>
          }

        </div>
      }

      @if (showCreateModal()) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h2 class="modal-title">New Page</h2>
              <button type="button" (click)="closeCreateModal()" class="close-btn">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <form [formGroup]="createForm" (ngSubmit)="createPage()">
              <div class="form-group">
                <label class="label">Page Name</label>
                <input formControlName="name" class="input" placeholder="e.g. Summer Sale" />
              </div>
              <div class="form-group">
                <label class="label">URL Slug</label>
                <div class="slug-input-wrapper">
                  <span class="slug-prefix">/</span>
                  <input formControlName="slug" class="input slug-input" placeholder="summer-sale" />
                </div>
              </div>
              
              <div class="modal-footer">
                <button type="button" (click)="closeCreateModal()" class="btn btn-text">Cancel</button>
                <button type="submit" [disabled]="createForm.invalid || isSubmitting()" class="btn btn-primary">
                  @if (isSubmitting()) { <i class="fas fa-spinner fa-spin icon"></i> }
                  Create Page
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* --- CONTAINER --- */
    .page-container {
      min-height: 100vh;
      background: var(--surface-ground);
      padding: var(--spacing-3xl);
      font-family: var(--font-body);
      color: var(--text-primary);
    }

    /* --- HEADER --- */
    .page-header {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-4xl);
      gap: var(--spacing-xl);
    }
    @media(min-width: 768px) {
      .page-header {
        flex-direction: row;
        align-items: center;
      }
    }
    
    .page-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
      line-height: var(--line-height-tight);
      letter-spacing: -0.02em;
    }
    
    .page-subtitle {
      margin-top: var(--spacing-xs);
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    /* --- BUTTONS --- */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--ui-border-radius-lg);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      border: var(--ui-border-width) solid transparent;
      transition: var(--transition-base);
      gap: var(--spacing-md);
      line-height: 1;
    }

    .btn-primary {
      background-color: var(--primary-color);
      color: var(--primary-color-text);
      box-shadow: var(--shadow-md);
    }
    .btn-primary:hover {
      background-color: var(--primary-600); /* Assuming you have shades, or use opacity */
      transform: translateY(-1px);
      box-shadow: var(--shadow-lg);
    }
    .btn-primary:disabled {
      opacity: var(--state-disabled-opacity);
      cursor: not-allowed;
      transform: none;
    }

    .btn-secondary {
      background-color: var(--surface-card);
      color: var(--text-primary);
      border-color: var(--surface-border);
      box-shadow: var(--shadow-sm);
    }
    .btn-secondary:hover {
      background-color: var(--surface-hover);
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    .btn-text {
      background: transparent;
      color: var(--text-secondary);
    }
    .btn-text:hover {
      color: var(--text-primary);
      background: var(--surface-hover);
    }

    .btn-block {
      width: 100%;
    }

    /* --- ICON BUTTONS --- */
    .icon-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--ui-border-radius);
      border: var(--ui-border-width) solid transparent;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition-fast);
    }
    .icon-btn:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
      border-color: var(--surface-border);
    }
    .icon-btn.active {
      color: var(--green-600);
      background: var(--green-50);
    }
    .icon-btn.active:hover {
      color: var(--red-500); /* Hovering active publish usually implies unpublish intention */
      background: var(--red-50);
    }
    .icon-btn.danger:hover {
      color: var(--red-600);
      background: var(--red-50);
    }

    .link-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      padding: var(--spacing-xs);
      transition: var(--transition-colors);
    }
    .link-btn:hover {
      color: var(--primary-color);
    }

    /* --- GRID --- */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--spacing-2xl);
    }

    /* --- CARDS (Base) --- */
    .page-card, .create-card {
      position: relative;
      display: flex;
      flex-direction: column;
      border-radius: var(--ui-border-radius-xl);
      transition: var(--transition-base);
    }

    /* --- CREATE CARD --- */
    .create-card {
      background: var(--surface-ground);
      border: 2px dashed var(--surface-border);
      align-items: center;
      justify-content: center;
      min-height: 240px;
      cursor: pointer;
    }
    .create-card:hover {
      border-color: var(--primary-color);
      background: var(--surface-card);
      transform: translateY(-2px);
    }
    .create-icon-wrapper {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--surface-card);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--spacing-lg);
      font-size: var(--font-size-xl);
      color: var(--text-secondary);
      box-shadow: var(--shadow-sm);
      transition: var(--transition-transform);
    }
    .create-card:hover .create-icon-wrapper {
      transform: scale(1.1);
      color: var(--primary-color);
    }
    .create-label {
      font-weight: var(--font-weight-bold);
      color: var(--text-secondary);
      font-size: var(--font-size-md);
    }
    .create-card:hover .create-label {
      color: var(--text-primary);
    }

    /* --- PAGE CARD --- */
    .page-card {
      background: var(--surface-card);
      border: var(--ui-border-width) solid var(--surface-border);
      box-shadow: var(--shadow-sm);
      padding: var(--spacing-2xl);
      justify-content: space-between;
      min-height: 240px;
    }
    .page-card:hover {
      box-shadow: var(--shadow-xl);
      transform: translateY(-4px);
      border-color: var(--primary-100); /* subtle border highlight */
    }

    /* Status Dot */
    .status-badge-wrapper {
      position: absolute;
      top: var(--spacing-xl);
      right: var(--spacing-xl);
    }
    .status-dot {
      display: block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--yellow-400); /* Draft */
      box-shadow: 0 0 0 4px var(--surface-card); /* fake border/gap */
    }
    .status-dot.published {
      background-color: var(--green-500);
    }

    /* Content */
    .card-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    
    .page-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--ui-border-radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--spacing-lg);
      background: var(--surface-ground);
      color: var(--text-secondary);
      font-size: var(--font-size-lg);
    }
    .page-icon.is-home {
      background: var(--primary-50);
      color: var(--primary-color);
    }

    .card-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xs) 0;
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .slug-wrapper {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
    .slug-code {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      background: var(--surface-ground);
      padding: 2px 6px;
      border-radius: var(--ui-border-radius-sm);
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Footer */
    .card-footer {
      margin-top: var(--spacing-xl);
      padding-top: var(--spacing-lg);
      border-top: var(--ui-border-width) solid var(--surface-border);
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
      font-size: var(--font-size-xs);
    }
    .meta-status {
      font-weight: var(--font-weight-bold);
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }
    .meta-status.published {
      color: var(--green-600);
    }
    .meta-date {
      color: var(--text-secondary);
    }

    .action-grid {
      display: flex;
      gap: var(--spacing-sm);
    }
    .icon-actions {
      display: flex;
      gap: var(--spacing-xs);
      margin-left: auto;
    }

    /* --- MODAL --- */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      z-index: var(--z-modal-backdrop);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2xl);
    }
    
    .modal-card {
      background: var(--surface-card);
      width: 100%;
      max-width: 480px;
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--shadow-2xl);
      padding: var(--spacing-3xl);
      z-index: var(--z-modal);
      animation: scaleIn 0.2s ease-out;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-2xl);
    }
    .modal-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
    }
    .close-btn {
      background: var(--surface-ground);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition-colors);
    }
    .close-btn:hover {
      background: var(--surface-hover);
      color: var(--text-primary);
    }

    /* --- FORMS --- */
    .form-group {
      margin-bottom: var(--spacing-xl);
    }
    .label {
      display: block;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-secondary);
      margin-bottom: var(--spacing-sm);
      letter-spacing: 0.05em;
    }
    
    .input {
      width: 100%;
      padding: var(--spacing-lg);
      font-family: var(--font-body);
      font-size: var(--font-size-base);
      color: var(--text-primary);
      background: var(--surface-ground);
      border: var(--ui-border-width) solid var(--surface-border);
      border-radius: var(--ui-border-radius-lg);
      transition: var(--transition-colors);
      outline: none;
    }
    .input:focus {
      background: var(--surface-card);
      border-color: var(--primary-color);
      box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
    }
    
    .slug-input-wrapper {
      position: relative;
    }
    .slug-prefix {
      position: absolute;
      left: var(--spacing-lg);
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
      font-family: var(--font-mono);
      font-size: var(--font-size-base);
    }
    .slug-input {
      padding-left: var(--spacing-5xl); /* Space for / prefix */
      font-family: var(--font-mono);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
      margin-top: var(--spacing-2xl);
    }

    /* --- LOADER --- */
    .loader-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 300px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--surface-border);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-5xl);
      color: var(--text-secondary);
    }
    .empty-icon {
      font-size: var(--font-size-5xl);
      margin-bottom: var(--spacing-md);
      opacity: 0.3;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class PageListComponent implements OnInit {
  private adminService = inject(StorefrontAdminService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  pages = signal<any[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);
  showCreateModal = signal(false);
  currentOrgSlug = 'shivam';

  createForm = this.fb.group({
    name: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]]
  });

  ngOnInit() {
    this.loadPages();
    this.createForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.createForm.get('slug')?.dirty) {
        this.createForm.get('slug')?.setValue(
          name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        );
      }
    });
  }

  loadPages() {
    this.isLoading.set(true);
    this.adminService.getPages().subscribe({
      next: res => {
        this.pages.set(res.pages);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openCreateModal() { this.showCreateModal.set(true); }
  closeCreateModal() { 
    this.showCreateModal.set(false); 
    this.createForm.reset(); 
  }

  createPage() {
    if (!this.createForm.valid) return;
    this.isSubmitting.set(true);
    this.adminService.createPage(this.createForm.value).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadPages();
        this.isSubmitting.set(false);
      },
      error: () => this.isSubmitting.set(false)
    });
  }

  viewLive(slug: string) {
    window.open(`/store/${this.currentOrgSlug}/${slug}`, '_blank', 'noopener');
  }

  togglePublish(page: any) {
    const action = page.isPublished ? 'unpublish' : 'publish';
    if (!confirm(`Are you sure you want to ${action} "${page.name}"?`)) return;

    const request$ = page.isPublished 
      ? this.adminService.unpublishPage(page._id)
      : this.adminService.publishPage(page._id);

    request$.subscribe({
      next: () => {
        this.pages.update(currentPages => 
          currentPages.map(p => 
            p._id === page._id ? { ...p, isPublished: !page.isPublished } : p
          )
        );
      },
      error: () => alert(`Failed to ${action} page.`)
    });
  }

  deletePage(id: string) {
    if (!confirm('Are you sure you want to delete this page permanently?')) return;
    this.adminService.deletePage(id).subscribe({
      next: () => this.pages.update(currentPages => currentPages.filter(p => p._id !== id)),
      error: () => alert('Failed to delete page.')
    });
  }
}