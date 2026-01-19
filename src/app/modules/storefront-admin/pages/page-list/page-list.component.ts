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
      <div class="bg-overlay"></div> <div class="content-relative">
        
        <header class="page-header">
          <div class="header-content">
            <h1 class="page-title">Storefront Pages</h1>
            <p class="page-subtitle">Design, publish, and manage your campaigns.</p>
          </div>

          <button type="button" (click)="openCreateModal()" class="btn btn-primary">
            <i class="pi pi-plus icon"></i>
            <span>New Page</span>
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
                <i class="pi pi-plus"></i>
              </div>
              <span class="create-label">Create New Page</span>
            </button>

            @for (page of pages(); track page._id) {
              <div class="page-card group">
                
                <div class="card-image-wrapper">
                  <img src="https://images.unsplash.com/photo-1481487484168-9b995ecc168d?q=80&w=800&auto=format&fit=crop" 
                       alt="Page Preview" 
                       class="card-image">
                  <div class="card-image-overlay"></div>
                </div>

                <div class="status-badge" [class.published]="page.isPublished">
                  <span class="status-dot"></span>
                  {{ page.isPublished ? 'Live' : 'Draft' }}
                </div>

                <div class="glass-pane">
                  
                  <div class="card-top-row">
                    <h3 class="card-title" [title]="page.name">
                      <i class="pi" [class]="page.isHomepage ? 'pi-home' : 'pi-file'" style="font-size: 0.8rem; opacity: 0.7; margin-right: 4px;"></i>
                      {{ page.name }}
                    </h3>
                    <button (click)="viewLive(page.slug)" class="external-link-btn" title="View Live">
                      <i class="pi pi-external-link"></i>
                    </button>
                  </div>

                  <code class="slug-pill">/{{ page.slug }}</code>

                  <div class="card-actions">
                    <a [routerLink]="[page._id, 'builder']" class="btn btn-sm btn-primary btn-block">
                      <i class="pi pi-pencil"></i> Edit
                    </a>
                    
                    <div class="icon-group">
                      <button (click)="togglePublish(page)" 
                              class="icon-btn" 
                              [class.active]="page.isPublished"
                              [title]="page.isPublished ? 'Unpublish' : 'Publish'">
                        <i class="pi" [class]="page.isPublished ? 'pi-eye' : 'pi-eye-slash'"></i>
                      </button>
                      <button (click)="deletePage(page._id)" class="icon-btn danger" title="Delete">
                        <i class="pi pi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <div class="meta-info">
                    Updated {{ page.updatedAt | date:'MMM d' }}
                  </div>

                </div>
              </div>
            }

          </div>
        }
      </div>

      @if (showCreateModal()) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h2 class="modal-title">New Page</h2>
              <button type="button" (click)="closeCreateModal()" class="close-btn">
                <i class="pi pi-times"></i>
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
                  @if (isSubmitting()) { <i class="pi pi-spin pi-spinner icon"></i> }
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
    /* ===== PAGE BACKGROUND ===== */
    .page-container {
      min-height: 100vh;
      position: relative;
      /* The Canyon Image provided */
      background-image: url('https://images.unsplash.com/photo-1474552226712-ac0f0961a954?q=80&w=2071&auto=format&fit=crop');
      background-size: cover;
      background-position: center;
      background-attachment: fixed;
      padding: var(--spacing-3xl);
      font-family: var(--font-body);
      color: var(--text-color);
    }

    .bg-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6));
      z-index: 0;
    }

    .content-relative {
      position: relative;
      z-index: 1;
    }

    /* ===== HEADER (Glass) ===== */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-4xl);
      padding: var(--spacing-xl) var(--spacing-2xl);
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--shadow-lg);
    }
    
    .page-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: #ffffff; /* White text on dark img */
      margin: 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .page-subtitle {
      margin-top: var(--spacing-xs);
      color: rgba(255, 255, 255, 0.7);
      font-size: var(--font-size-sm);
    }

    /* ===== BUTTONS ===== */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--ui-border-radius-lg);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      border: none;
      transition: var(--transition-base);
      gap: var(--spacing-md);
      line-height: 1;
    }

    .btn-sm {
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: var(--font-size-sm);
    }

    .btn-primary {
      background-color: #ffffff;
      color: #0f172a;
      box-shadow: var(--shadow-md);
    }
    .btn-primary:hover {
      background-color: #f8fafc;
      transform: translateY(-1px);
      box-shadow: var(--shadow-lg);
    }

    .btn-block { width: 100%; }

    /* ===== GRID ===== */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--spacing-2xl);
    }

    /* ===== CREATE CARD (Glass Dashed) ===== */
    .create-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 2px dashed rgba(255, 255, 255, 0.3);
      border-radius: var(--ui-border-radius-xl);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 320px;
      cursor: pointer;
      transition: var(--transition-base);
    }
    .create-card:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.8);
      transform: translateY(-4px);
    }
    .create-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--spacing-md);
      font-size: var(--font-size-2xl);
    }
    .create-label {
      color: #ffffff;
      font-weight: var(--font-weight-bold);
    }

    /* ===== IMAGE PAGE CARD ===== */
    .page-card {
      position: relative;
      height: 320px;
      border-radius: var(--ui-border-radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-xl);
      transition: var(--transition-base);
      border: 1px solid rgba(255,255,255,0.2);
    }
    .page-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--shadow-2xl);
      border-color: rgba(255,255,255,0.6);
    }

    /* 1. Image Background */
    .card-image-wrapper {
      position: absolute;
      inset: 0;
      z-index: 0;
    }
    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .page-card:hover .card-image {
      transform: scale(1.1); /* Zoom effect */
    }
    .card-image-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1));
    }

    /* 2. Status Badge */
    .status-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 2;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: #e2e8f0;
      display: flex;
      align-items: center;
      gap: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-badge.published {
      background: rgba(34, 197, 94, 0.2); /* Green tint */
      color: #86efac;
      border-color: rgba(34, 197, 94, 0.4);
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }

    /* 3. Glass Content Pane */
    .glass-pane {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 2;
      background: rgba(255, 255, 255, 0.15); /* Frosted glass */
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .card-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      color: #ffffff;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .slug-pill {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      color: rgba(255,255,255,0.7);
      background: rgba(0,0,0,0.3);
      padding: 2px 6px;
      border-radius: 4px;
      align-self: flex-start;
    }

    .card-actions {
      display: flex;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-xs);
    }
    .icon-group {
      display: flex;
      gap: 4px;
    }
    
    .icon-btn, .external-link-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      transition: all 0.2s;
    }
    .icon-btn:hover, .external-link-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      color: #ffffff;
    }
    .icon-btn.active {
      background: rgba(34, 197, 94, 0.4);
      color: #ffffff;
    }
    .icon-btn.danger:hover {
      background: rgba(239, 68, 68, 0.4);
      color: #ffffff;
    }

    .meta-info {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      text-align: right;
      margin-top: -4px;
    }

    /* ===== MODAL (Standard, not glass) ===== */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: var(--z-modal-backdrop);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2xl);
    }
    .modal-card {
      background: #ffffff; /* Modal remains clean white */
      width: 100%;
      max-width: 450px;
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-3xl);
      box-shadow: var(--shadow-2xl);
      animation: scaleIn 0.2s ease-out;
    }
    /* Modal styles remain similar to previous iteration for readability */
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .modal-title { font-size: 1.25rem; font-weight: bold; color: #0f172a; }
    .close-btn { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; }
    .form-group { margin-bottom: 16px; }
    .label { display: block; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
    .input { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; outline: none; }
    .input:focus { border-color: #0f172a; ring: 2px solid rgba(15,23,42,0.1); }
    .slug-input-wrapper { position: relative; }
    .slug-prefix { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .slug-input { padding-left: 24px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
    .btn-text { background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; }

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
