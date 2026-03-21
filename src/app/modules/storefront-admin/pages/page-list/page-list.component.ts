// src/app/features/storefront-admin/pages/page-list/page-list.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StorefrontAdminService, CreatePageDto } from '@core/services/storefront-admin.service';
// import { AdminPage } from '@core/models/storefront.model';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(value: string): string {
  return value.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getOrgSlug(): string {
  try {
    const raw = window.localStorage.getItem('orgSlug');
    return raw ? JSON.parse(raw) : '';
  } catch {
    return window.localStorage.getItem('orgSlug') ?? '';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-page-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, DatePipe],
  template: `
    <div class="page-container">
      <div class="bg-overlay"></div>

      <div class="content-relative">

        <!-- Header -->
        <header class="page-header">
          <div class="header-left">
            <h1 class="page-title">Storefront Pages</h1>
            <p class="page-subtitle">Design, publish, and manage your storefront campaigns.</p>
          </div>
          <button type="button" (click)="openCreateModal()" class="btn btn-primary">
            <i class="pi pi-plus icon"></i>
            <span>New Page</span>
          </button>
        </header>

        <!-- Error banner -->
        @if (error()) {
          <div class="error-banner">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ error() }}</span>
            <button (click)="error.set(null)" class="error-close">
              <i class="pi pi-times"></i>
            </button>
          </div>
        }

        <!-- Loading -->
        @if (isLoading()) {
          <div class="loader-container">
            <div class="spinner-ring"></div>
            <span class="loading-text">Loading pages…</span>
          </div>
        } @else {

          <!-- Stats row -->
          @if (pages().length > 0) {
            <div class="stats-row">
              <div class="stat-chip">
                <span class="stat-value">{{ pages().length }}</span>
                <span class="stat-label">Total</span>
              </div>
              <div class="stat-chip">
                <span class="stat-value">{{ publishedCount() }}</span>
                <span class="stat-label">Live</span>
              </div>
              <div class="stat-chip">
                <span class="stat-value">{{ draftCount() }}</span>
                <span class="stat-label">Drafts</span>
              </div>
            </div>
          }

          <!-- Grid -->
          <div class="card-grid">

            <!-- Create card -->
            <button (click)="openCreateModal()" class="create-card" type="button">
              <div class="create-icon-ring">
                <i class="pi pi-plus"></i>
              </div>
              <span class="create-label">Create New Page</span>
              <span class="create-hint">Start from scratch</span>
            </button>

            <!-- Page cards -->
            @for (page of pages(); track page._id) {
              <div class="page-card">

                <!-- Image -->
                <div class="card-image-wrapper">
                  <img
                    src="https://images.unsplash.com/photo-1768409427465-01320d46963e?q=80&w=800&auto=format&fit=crop"
                    alt="Page Preview"
                    class="card-image"
                    loading="lazy" />
                  <div class="card-image-overlay"></div>
                </div>

                <!-- Status pill -->
                <div class="status-badge" [class.published]="page.isPublished">
                  <span class="status-dot"></span>
                  {{ page.isPublished ? 'Live' : 'Draft' }}
                </div>

                <!-- Homepage crown -->
                @if (page.isHomepage) {
                  <div class="homepage-badge">
                    <i class="pi pi-home"></i>
                  </div>
                }

                <!-- Glass pane -->
                <div class="glass-pane">
                  <div class="card-top-row">
                    <h3 class="card-title" [title]="page.name">{{ page.name }}</h3>
                    <button
                      (click)="viewLive(page.slug)"
                      class="external-link-btn"
                      title="View live page"
                      type="button">
                      <i class="pi pi-external-link"></i>
                    </button>
                  </div>

                  <code class="slug-pill">/{{ page.slug }}</code>

                  <div class="card-meta-row">
                    <span class="card-meta-badge">{{ page.pageType }}</span>
                    <span class="card-meta-badge">{{ (page.sectionsCount ?? 0) }} sections</span>
                  </div>

                  <div class="card-actions">
                    <a [routerLink]="[page._id, 'builder']" class="btn btn-sm btn-primary btn-block">
                      <i class="pi pi-pencil"></i>
                      Edit
                    </a>
                    <div class="icon-group">
                      <button
                        (click)="togglePublish(page)"
                        class="icon-btn"
                        [class.active]="page.isPublished"
                        [title]="page.isPublished ? 'Unpublish' : 'Publish'"
                        type="button">
                        <i class="pi" [class]="page.isPublished ? 'pi-eye' : 'pi-eye-slash'"></i>
                      </button>
                      <button
                        (click)="duplicatePage(page)"
                        class="icon-btn"
                        title="Duplicate"
                        type="button">
                        <i class="pi pi-copy"></i>
                      </button>
                      <button
                        (click)="deletePage(page)"
                        class="icon-btn danger"
                        title="Delete"
                        type="button">
                        <i class="pi pi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <div class="meta-info">
                    Updated {{ page.updatedAt | date:'MMM d, y' }}
                  </div>
                </div>

              </div>
            }

          </div>

          <!-- Empty state -->
          @if (pages().length === 0 && !isLoading()) {
            <div class="empty-state">
              <div class="empty-icon">
                <i class="pi pi-file-edit"></i>
              </div>
              <h3 class="empty-title">No pages yet</h3>
              <p class="empty-subtitle">Create your first storefront page to get started.</p>
              <button type="button" (click)="openCreateModal()" class="btn btn-primary">
                <i class="pi pi-plus icon"></i> Create First Page
              </button>
            </div>
          }
        }
      </div>

      <!-- Create modal -->
      @if (showCreateModal()) {
        <div class="modal-backdrop" (click)="closeCreateModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">

            <div class="modal-header">
              <div class="modal-header-left">
                <div class="modal-icon">
                  <i class="pi pi-file-plus"></i>
                </div>
                <h2 class="modal-title">New Page</h2>
              </div>
              <button type="button" (click)="closeCreateModal()" class="close-btn">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <form [formGroup]="createForm" (ngSubmit)="createPage()">
              <div class="form-body">
                <div class="form-group">
                  <label class="label" for="page-name">Page Name</label>
                  <input
                    id="page-name"
                    formControlName="name"
                    class="input"
                    placeholder="e.g. Summer Sale"
                    autocomplete="off" />
                  @if (createForm.get('name')?.invalid && createForm.get('name')?.touched) {
                    <span class="field-error">Page name is required</span>
                  }
                </div>

                <div class="form-group">
                  <label class="label" for="page-slug">URL Slug</label>
                  <div class="slug-input-wrapper">
                    <span class="slug-prefix">/</span>
                    <input
                      id="page-slug"
                      formControlName="slug"
                      class="input slug-input"
                      placeholder="summer-sale"
                      autocomplete="off" />
                  </div>
                  @if (createForm.get('slug')?.invalid && createForm.get('slug')?.touched) {
                    <span class="field-error">
                      Slug must only contain lowercase letters, numbers, and hyphens
                    </span>
                  }
                </div>

                <div class="form-group">
                  <label class="label" for="page-type">Page Type</label>
                  <select id="page-type" formControlName="pageType" class="input select-input">
                    <option value="custom">Custom</option>
                    <option value="home">Home</option>
                    <option value="landing">Landing Page</option>
                    <option value="about">About</option>
                    <option value="contact">Contact</option>
                    <option value="products">Products</option>
                  </select>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" (click)="closeCreateModal()" class="btn btn-text">
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="createForm.invalid || isSubmitting()"
                  class="btn btn-primary">
                  @if (isSubmitting()) {
                    <i class="pi pi-spin pi-spinner icon"></i>
                  } @else {
                    <i class="pi pi-plus icon"></i>
                  }
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
    /* ── Root ── */
    .page-container {
      min-height: 100vh;
      position: relative;
      background-image: url('https://images.unsplash.com/photo-1741153633519-f8af72ed1f0c?q=80&w=764&auto=format&fit=crop');
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
      background: linear-gradient(160deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%);
      z-index: 0;
    }
    .content-relative { position: relative; z-index: 1; }

    /* ── Header ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-2xl);
      padding: var(--spacing-xl) var(--spacing-2xl);
      background: rgba(255,255,255,0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: var(--ui-border-radius-xl);
    }
    .page-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: #fff;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      margin-top: var(--spacing-xs);
      color: rgba(255,255,255,0.6);
      font-size: var(--font-size-sm);
    }

    /* ── Error banner ── */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: rgba(239,68,68,0.15);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 10px;
      color: #fca5a5;
      font-size: var(--font-size-sm);
      margin-bottom: var(--spacing-xl);
      backdrop-filter: blur(8px);
    }
    .error-close {
      margin-left: auto;
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      opacity: 0.7;
    }
    .error-close:hover { opacity: 1; }

    /* ── Loader ── */
    .loader-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      gap: 16px;
    }
    .spinner-ring {
      width: 44px;
      height: 44px;
      border: 3px solid rgba(255,255,255,0.15);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .loading-text {
      color: rgba(255,255,255,0.6);
      font-size: var(--font-size-sm);
      font-weight: 500;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Stats row ── */
    .stats-row {
      display: flex;
      gap: 10px;
      margin-bottom: var(--spacing-xl);
    }
    .stat-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 20px;
    }
    .stat-value {
      font-size: var(--font-size-sm);
      font-weight: 700;
      color: #fff;
      font-family: var(--font-mono);
    }
    .stat-label {
      font-size: 11px;
      color: rgba(255,255,255,0.55);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* ── Grid ── */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--spacing-xl);
    }

    /* ── Create card ── */
    .create-card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
      border: 2px dashed rgba(255,255,255,0.25);
      border-radius: var(--ui-border-radius-xl);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 340px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.2, 0.9, 0.2, 1);
      gap: 8px;
    }
    .create-card:hover {
      background: rgba(255,255,255,0.12);
      border-color: rgba(255,255,255,0.7);
      transform: translateY(-4px);
    }
    .create-icon-ring {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.3);
      background: rgba(255,255,255,0.1);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      transition: all 0.3s;
      margin-bottom: 4px;
    }
    .create-card:hover .create-icon-ring {
      border-color: rgba(255,255,255,0.8);
      background: rgba(255,255,255,0.2);
      transform: scale(1.1);
    }
    .create-label {
      color: #fff;
      font-weight: 700;
      font-size: var(--font-size-base);
    }
    .create-hint {
      color: rgba(255,255,255,0.45);
      font-size: 12px;
    }

    /* ── Page card ── */
    .page-card {
      position: relative;
      height: 340px;
      border-radius: var(--ui-border-radius-xl);
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      transition: all 0.3s cubic-bezier(0.2, 0.9, 0.2, 1);
      border: 1px solid rgba(255,255,255,0.12);
    }
    .page-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      border-color: rgba(255,255,255,0.4);
    }
    .card-image-wrapper { position: absolute; inset: 0; z-index: 0; }
    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .page-card:hover .card-image { transform: scale(1.08); }
    .card-image-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.05) 60%);
    }

    /* ── Badges ── */
    .status-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 2;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(6px);
      border: 1px solid rgba(255,255,255,0.12);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      color: rgba(255,255,255,0.75);
      display: flex;
      align-items: center;
      gap: 5px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .status-badge.published {
      background: rgba(34,197,94,0.2);
      border-color: rgba(34,197,94,0.4);
      color: #86efac;
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

    .homepage-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 2;
      background: rgba(234,179,8,0.2);
      border: 1px solid rgba(234,179,8,0.4);
      color: #fde68a;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      backdrop-filter: blur(4px);
    }

    /* ── Glass pane ── */
    .glass-pane {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      z-index: 2;
      background: rgba(15,23,42,0.6);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255,255,255,0.1);
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .card-top-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .card-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-md);
      font-weight: 700;
      color: #fff;
      margin: 0;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .slug-pill {
      font-family: var(--font-mono);
      font-size: 10px;
      color: rgba(255,255,255,0.5);
      background: rgba(255,255,255,0.07);
      padding: 2px 7px;
      border-radius: 4px;
      align-self: flex-start;
    }
    .card-meta-row { display: flex; gap: 6px; }
    .card-meta-badge {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: rgba(255,255,255,0.4);
      background: rgba(255,255,255,0.06);
      padding: 2px 7px;
      border-radius: 4px;
    }
    .card-actions { display: flex; gap: 6px; align-items: center; }
    .icon-group { display: flex; gap: 4px; }

    /* ── Buttons ── */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--ui-border-radius-lg);
      font-size: var(--font-size-base);
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      gap: 8px;
      line-height: 1;
      text-decoration: none;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-sm { padding: 7px 12px; font-size: var(--font-size-sm); }
    .btn-block { flex: 1; }
    .btn-primary { background: #fff; color: #0f172a; }
    .btn-primary:hover:not(:disabled) { background: #f1f5f9; transform: translateY(-1px); }
    .btn-text { background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; padding: 8px 12px; border-radius: 8px; }
    .btn-text:hover { background: #f1f5f9; }

    .icon-btn, .external-link-btn {
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 8px; border: none;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.75);
      cursor: pointer; transition: all 0.2s;
      flex-shrink: 0;
    }
    .icon-btn:hover, .external-link-btn:hover { background: rgba(255,255,255,0.25); color: #fff; }
    .icon-btn.active { background: rgba(34,197,94,0.3); color: #86efac; }
    .icon-btn.danger:hover { background: rgba(239,68,68,0.35); color: #fca5a5; }

    .meta-info { font-size: 10px; color: rgba(255,255,255,0.3); text-align: right; }

    /* ── Empty state ── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 80px 40px;
      color: rgba(255,255,255,0.7);
    }
    .empty-icon {
      width: 80px; height: 80px;
      border-radius: 20px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; margin-bottom: 20px; color: rgba(255,255,255,0.4);
    }
    .empty-title { font-size: var(--font-size-xl); font-weight: 700; color: #fff; margin: 0 0 8px; }
    .empty-subtitle { color: rgba(255,255,255,0.5); font-size: var(--font-size-sm); margin-bottom: 24px; }

    /* ── Modal ── */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      padding: var(--spacing-2xl);
      animation: fadeIn 0.15s ease;
    }
    .modal-card {
      background: #fff;
      width: 100%; max-width: 460px;
      border-radius: 20px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.35);
      animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 0;
    }
    .modal-header-left { display: flex; align-items: center; gap: 12px; }
    .modal-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      color: #0f172a; font-size: 1rem;
    }
    .modal-title { font-size: 1.15rem; font-weight: 700; color: #0f172a; margin: 0; }
    .close-btn {
      background: #f1f5f9; border: none;
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #64748b; transition: all 0.2s;
    }
    .close-btn:hover { background: #e2e8f0; color: #0f172a; }
    .form-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; }
    .input {
      width: 100%; padding: 10px 12px;
      border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 0.9rem; outline: none;
      transition: border-color 0.2s; box-sizing: border-box;
      font-family: inherit;
    }
    .input:focus { border-color: #0f172a; }
    .select-input { cursor: pointer; background: #fff; }
    .slug-input-wrapper { position: relative; }
    .slug-prefix { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.9rem; }
    .slug-input { padding-left: 22px; }
    .field-error { font-size: 11px; color: #ef4444; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 16px 24px;
      border-top: 1px solid #f1f5f9;
      background: #fafafa;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class PageListComponent implements OnInit {
  private adminService = inject(StorefrontAdminService);
  private fb           = inject(FormBuilder);
  private router       = inject(Router);

  pages         = signal<any[]>([]);
  isLoading     = signal(true);
  isSubmitting  = signal(false);
  showCreateModal = signal(false);
  error         = signal<string | null>(null);

  // Computed stats
  publishedCount = computed(() => this.pages().filter(p => p.isPublished).length);
  draftCount     = computed(() => this.pages().filter(p => !p.isPublished).length);

  createForm = this.fb.group({
    name:     ['', Validators.required],
    slug:     ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    pageType: ['custom']
  });

  ngOnInit(): void {
    this.loadPages();

    // Auto-slugify from name while slug is untouched
    this.createForm.get('name')?.valueChanges.subscribe(name => {
      const slugCtrl = this.createForm.get('slug')!;
      if (name && !slugCtrl.dirty) {
        slugCtrl.setValue(slugify(name), { emitEvent: false });
      }
    });
  }

  loadPages(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.adminService.getPages().subscribe({
      next: (res: any) => {
        this.pages.set(res.data ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load pages. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal(): void { this.showCreateModal.set(true); }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.createForm.reset({ pageType: 'custom' });
  }

  createPage(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.adminService.createPage(this.createForm.getRawValue() as CreatePageDto).subscribe({
      next: (res: any) => {
        this.closeCreateModal();
        this.isSubmitting.set(false);
        // Navigate directly to the builder for the new page
        this.router.navigate([res.data._id, 'builder'], { relativeTo: null });
        this.loadPages();
      },
      error: (err: any) => {
        this.error.set(err?.error?.message ?? 'Failed to create page.');
        this.isSubmitting.set(false);
      }
    });
  }

  viewLive(slug: string): void {
    const org = getOrgSlug();
    if (!org) { this.error.set('Organization slug not found in localStorage.'); return; }
    window.open(`/store/${org}/${slug}`, '_blank', 'noopener');
  }

  togglePublish(page: any): void {
    const action  = page.isPublished ? 'unpublish' : 'publish';
    const request$ = page.isPublished
      ? this.adminService.unpublishPage(page._id)
      : this.adminService.publishPage(page._id);

    request$.subscribe({
      next: () => {
        this.pages.update(list =>
          list.map(p => p._id === page._id ? { ...p, isPublished: !page.isPublished } : p)
        );
      },
      error: (err: any) => this.error.set(err?.error?.message ?? `Failed to ${action} page.`)
    });
  }

  duplicatePage(page: any): void {
    this.adminService.duplicatePage(page._id).subscribe({
      next: () => this.loadPages(),
      error: (err: any) => this.error.set(err?.error?.message ?? 'Failed to duplicate page.')
    });
  }

  deletePage(page: any): void {
    if (page.isPublished) {
      this.error.set(`Unpublish "${page.name}" before deleting it.`);
      return;
    }
    if (page.isHomepage) {
      this.error.set('Cannot delete the active homepage.');
      return;
    }
    if (!confirm(`Permanently delete "${page.name}"? This cannot be undone.`)) return;
    this.adminService.deletePage(page._id).subscribe({
      next: () => this.pages.update(list => list.filter(p => p._id !== page._id)),
      error: (err: any) => this.error.set(err?.error?.message ?? 'Failed to delete page.')
    });
  }
}




// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router, RouterModule } from '@angular/router';
// import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// import { StorefrontAdminService, CreatePageDto } from '../../../../core/services/storefront-admin.service';

// @Component({
//   selector: 'app-page-list',
//   standalone: true,
//   imports: [CommonModule, RouterModule, ReactiveFormsModule],
//   template: `
//     <div class="page-container">
//       <div class="bg-overlay"></div> <div class="content-relative">
        
//         <header class="page-header">
//           <div class="header-content">
//             <h1 class="page-title">Storefront Pages</h1>
//             <p class="page-subtitle">Design, publish, and manage your campaigns.</p>
//           </div>

//           <button type="button" (click)="openCreateModal()" class="btn btn-primary">
//             <i class="pi pi-plus icon"></i>
//             <span>New Page</span>
//           </button>
//         </header>

//         @if (isLoading()) {
//           <div class="loader-container">
//             <div class="spinner"></div>
//           </div>
//         } @else {

//           <div class="card-grid">

//             <button (click)="openCreateModal()" class="create-card">
//               <div class="create-icon-wrapper">
//                 <i class="pi pi-plus"></i>
//               </div>
//               <span class="create-label">Create New Page</span>
//             </button>

//             @for (page of pages(); track page._id) {
//               <div class="page-card group">
                
//                 <div class="card-image-wrapper">
//                   <img src="https://images.unsplash.com/photo-1768409427465-01320d46963e?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
//                        alt="Page Preview" 
//                        class="card-image">
//                   <div class="card-image-overlay"></div>
//                 </div>

//                 <div class="status-badge" [class.published]="page.isPublished">
//                   <span class="status-dot"></span>
//                   {{ page.isPublished ? 'Live' : 'Draft' }}
//                 </div>

//                 <div class="glass-pane">
                  
//                   <div class="card-top-row">
//                     <h3 class="card-title" [title]="page.name">
//                       <i class="pi" [class]="page.isHomepage ? 'pi-home' : 'pi-file'" style="font-size: 0.8rem; opacity: 0.7; margin-right: 4px;"></i>
//                       {{ page.name }}
//                     </h3>
//                     <button (click)="viewLive(page.slug)" class="external-link-btn" title="View Live">
//                       <i class="pi pi-external-link"></i>
//                     </button>
//                   </div>

//                   <code class="slug-pill">/{{ page.slug }}</code>

//                   <div class="card-actions">
//                     <a [routerLink]="[page._id, 'builder']" class="btn btn-sm btn-primary btn-block">
//                       <i class="pi pi-pencil"></i> Edit
//                     </a>
                    
//                     <div class="icon-group">
//                       <button (click)="togglePublish(page)" 
//                               class="icon-btn" 
//                               [class.active]="page.isPublished"
//                               [title]="page.isPublished ? 'Unpublish' : 'Publish'">
//                         <i class="pi" [class]="page.isPublished ? 'pi-eye' : 'pi-eye-slash'"></i>
//                       </button>
//                       <button (click)="deletePage(page._id)" class="icon-btn danger" title="Delete">
//                         <i class="pi pi-trash"></i>
//                       </button>
//                     </div>
//                   </div>

//                   <div class="meta-info">
//                     Updated {{ page.updatedAt | date:'MMM d' }}
//                   </div>

//                 </div>
//               </div>
//             }

//           </div>
//         }
//       </div>

//       @if (showCreateModal()) {
//         <div class="modal-backdrop">
//           <div class="modal-card">
//             <div class="modal-header">
//               <h2 class="modal-title">New Page</h2>
//               <button type="button" (click)="closeCreateModal()" class="close-btn">
//                 <i class="pi pi-times"></i>
//               </button>
//             </div>
//             <form [formGroup]="createForm" (ngSubmit)="createPage()">
//               <div class="form-group">
//                 <label class="label">Page Name</label>
//                 <input formControlName="name" class="input" placeholder="e.g. Summer Sale" />
//               </div>
//               <div class="form-group">
//                 <label class="label">URL Slug</label>
//                 <div class="slug-input-wrapper">
//                   <span class="slug-prefix">/</span>
//                   <input formControlName="slug" class="input slug-input" placeholder="summer-sale" />
//                 </div>
//               </div>
              
//               <div class="modal-footer">
//                 <button type="button" (click)="closeCreateModal()" class="btn btn-text">Cancel</button>
//                 <button type="submit" [disabled]="createForm.invalid || isSubmitting()" class="btn btn-primary">
//                   @if (isSubmitting()) { <i class="pi pi-spin pi-spinner icon"></i> }
//                   Create Page
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       }
//     </div>
//   `,
//   styles: [`
//     /* ===== PAGE BACKGROUND ===== */
//     .page-container {
//       min-height: 100vh;
//       position: relative;
//       /* The Canyon Image provided */
//       background-image: url('https://images.unsplash.com/photo-1741153633519-f8af72ed1f0c?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
//       background-size: cover;
//       background-position: center;
//       background-attachment: fixed;
//       padding: var(--spacing-3xl);
//       font-family: var(--font-body);
//       color: var(--text-color);
//     }

//     .bg-overlay {
//       position: absolute;
//       inset: 0;
//       background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6));
//       z-index: 0;
//     }

//     .content-relative {
//       position: relative;
//       z-index: 1;
//     }

//     /* ===== HEADER (Glass) ===== */
//     .page-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       margin-bottom: var(--spacing-4xl);
//       padding: var(--spacing-xl) var(--spacing-2xl);
//       background: rgba(255, 255, 255, 0.1);
//       backdrop-filter: blur(12px);
//       border: 1px solid rgba(255, 255, 255, 0.2);
//       border-radius: var(--ui-border-radius-xl);
//       box-shadow: var(--shadow-lg);
//     }
    
//     .page-title {
//       font-family: var(--font-heading);
//       font-size: var(--font-size-3xl);
//       font-weight: var(--font-weight-bold);
//       color: #ffffff; /* White text on dark img */
//       margin: 0;
//       text-shadow: 0 2px 4px rgba(0,0,0,0.3);
//     }
    
//     .page-subtitle {
//       margin-top: var(--spacing-xs);
//       color: rgba(255, 255, 255, 0.7);
//       font-size: var(--font-size-sm);
//     }

//     /* ===== BUTTONS ===== */
//     .btn {
//       display: inline-flex;
//       align-items: center;
//       justify-content: center;
//       padding: var(--spacing-md) var(--spacing-xl);
//       border-radius: var(--ui-border-radius-lg);
//       font-size: var(--font-size-base);
//       font-weight: var(--font-weight-semibold);
//       cursor: pointer;
//       border: none;
//       transition: var(--transition-base);
//       gap: var(--spacing-md);
//       line-height: 1;
//     }

//     .btn-sm {
//       padding: var(--spacing-sm) var(--spacing-md);
//       font-size: var(--font-size-sm);
//     }

//     .btn-primary {
//       background-color: #ffffff;
//       color: #0f172a;
//       box-shadow: var(--shadow-md);
//     }
//     .btn-primary:hover {
//       background-color: #f8fafc;
//       transform: translateY(-1px);
//       box-shadow: var(--shadow-lg);
//     }

//     .btn-block { width: 100%; }

//     /* ===== GRID ===== */
//     .card-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
//       gap: var(--spacing-2xl);
//     }

//     /* ===== CREATE CARD (Glass Dashed) ===== */
//     .create-card {
//       background: rgba(255, 255, 255, 0.05);
//       backdrop-filter: blur(10px);
//       border: 2px dashed rgba(255, 255, 255, 0.3);
//       border-radius: var(--ui-border-radius-xl);
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       min-height: 320px;
//       cursor: pointer;
//       transition: var(--transition-base);
//     }
//     .create-card:hover {
//       background: rgba(255, 255, 255, 0.15);
//       border-color: rgba(255, 255, 255, 0.8);
//       transform: translateY(-4px);
//     }
//     .create-icon-wrapper {
//       width: 56px;
//       height: 56px;
//       border-radius: 50%;
//       background: rgba(255, 255, 255, 0.2);
//       color: #ffffff;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       margin-bottom: var(--spacing-md);
//       font-size: var(--font-size-2xl);
//     }
//     .create-label {
//       color: #ffffff;
//       font-weight: var(--font-weight-bold);
//     }

//     /* ===== IMAGE PAGE CARD ===== */
//     .page-card {
//       position: relative;
//       height: 320px;
//       border-radius: var(--ui-border-radius-xl);
//       overflow: hidden;
//       box-shadow: var(--shadow-xl);
//       transition: var(--transition-base);
//       border: 1px solid rgba(255,255,255,0.2);
//     }
//     .page-card:hover {
//       transform: translateY(-5px);
//       box-shadow: var(--shadow-2xl);
//       border-color: rgba(255,255,255,0.6);
//     }

//     /* 1. Image Background */
//     .card-image-wrapper {
//       position: absolute;
//       inset: 0;
//       z-index: 0;
//     }
//     .card-image {
//       width: 100%;
//       height: 100%;
//       object-fit: cover;
//       transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
//     }
//     .page-card:hover .card-image {
//       transform: scale(1.1); /* Zoom effect */
//     }
//     .card-image-overlay {
//       position: absolute;
//       inset: 0;
//       background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1));
//     }

//     /* 2. Status Badge */
//     .status-badge {
//       position: absolute;
//       top: 12px;
//       right: 12px;
//       z-index: 2;
//       background: rgba(0, 0, 0, 0.6);
//       backdrop-filter: blur(4px);
//       border: 1px solid rgba(255, 255, 255, 0.1);
//       padding: 4px 10px;
//       border-radius: 20px;
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       color: #e2e8f0;
//       display: flex;
//       align-items: center;
//       gap: 6px;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//     }
//     .status-badge.published {
//       background: rgba(34, 197, 94, 0.2); /* Green tint */
//       color: #86efac;
//       border-color: rgba(34, 197, 94, 0.4);
//     }
//     .status-dot {
//       width: 6px;
//       height: 6px;
//       border-radius: 50%;
//       background-color: currentColor;
//     }

//     /* 3. Glass Content Pane */
//     .glass-pane {
//       position: absolute;
//       bottom: 0;
//       left: 0;
//       right: 0;
//       z-index: 2;
//       background: rgba(255, 255, 255, 0.15); /* Frosted glass */
//       backdrop-filter: blur(15px);
//       -webkit-backdrop-filter: blur(15px);
//       border-top: 1px solid rgba(255, 255, 255, 0.2);
//       padding: var(--spacing-lg);
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-md);
//     }

//     .card-top-row {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//     }
//     .card-title {
//       font-family: var(--font-heading);
//       font-size: var(--font-size-md);
//       font-weight: var(--font-weight-bold);
//       color: #ffffff;
//       margin: 0;
//       white-space: nowrap;
//       overflow: hidden;
//       text-overflow: ellipsis;
//     }
    
//     .slug-pill {
//       font-family: var(--font-mono);
//       font-size: var(--font-size-xs);
//       color: rgba(255,255,255,0.7);
//       background: rgba(0,0,0,0.3);
//       padding: 2px 6px;
//       border-radius: 4px;
//       align-self: flex-start;
//     }

//     .card-actions {
//       display: flex;
//       gap: var(--spacing-sm);
//       margin-top: var(--spacing-xs);
//     }
//     .icon-group {
//       display: flex;
//       gap: 4px;
//     }
    
//     .icon-btn, .external-link-btn {
//       width: 32px;
//       height: 32px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       border-radius: 8px;
//       border: none;
//       background: rgba(255, 255, 255, 0.1);
//       color: rgba(255, 255, 255, 0.8);
//       cursor: pointer;
//       transition: all 0.2s;
//     }
//     .icon-btn:hover, .external-link-btn:hover {
//       background: rgba(255, 255, 255, 0.3);
//       color: #ffffff;
//     }
//     .icon-btn.active {
//       background: rgba(34, 197, 94, 0.4);
//       color: #ffffff;
//     }
//     .icon-btn.danger:hover {
//       background: rgba(239, 68, 68, 0.4);
//       color: #ffffff;
//     }

//     .meta-info {
//       font-size: 10px;
//       color: rgba(255, 255, 255, 0.4);
//       text-align: right;
//       margin-top: -4px;
//     }

//     /* ===== MODAL (Standard, not glass) ===== */
//     .modal-backdrop {
//       position: fixed;
//       inset: 0;
//       background: rgba(0, 0, 0, 0.7);
//       backdrop-filter: blur(8px);
//       z-index: var(--z-modal-backdrop);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       padding: var(--spacing-2xl);
//     }
//     .modal-card {
//       background: #ffffff; /* Modal remains clean white */
//       width: 100%;
//       max-width: 450px;
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-3xl);
//       box-shadow: var(--shadow-2xl);
//       animation: scaleIn 0.2s ease-out;
//     }
//     /* Modal styles remain similar to previous iteration for readability */
//     .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
//     .modal-title { font-size: 1.25rem; font-weight: bold; color: #0f172a; }
//     .close-btn { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; }
//     .form-group { margin-bottom: 16px; }
//     .label { display: block; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
//     .input { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; outline: none; }
//     .input:focus { border-color: #0f172a; ring: 2px solid rgba(15,23,42,0.1); }
//     .slug-input-wrapper { position: relative; }
//     .slug-prefix { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
//     .slug-input { padding-left: 24px; }
//     .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
//     .btn-text { background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; }

//     @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
//   `]
// })
// export class PageListComponent implements OnInit {
//   private adminService = inject(StorefrontAdminService);
//   private fb = inject(FormBuilder);
//   private router = inject(Router);

//   pages = signal<any[]>([]);
//   isLoading = signal(true);
//   isSubmitting = signal(false);
//   showCreateModal = signal(false);
//   currentOrgSlug = 'shivam';

//   createForm = this.fb.group({
//     name: ['', Validators.required],
//     slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]]
//   });

//   ngOnInit() {
//     this.loadPages();
//     this.createForm.get('name')?.valueChanges.subscribe(name => {
//       if (name && !this.createForm.get('slug')?.dirty) {
//         this.createForm.get('slug')?.setValue(
//           name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
//         );
//       }
//     });
//   }

//   loadPages() {
//     this.isLoading.set(true);
//     this.adminService.getPages().subscribe({
//       next: (res: any) => {
//         // FIX: Map res.data to pages signal because backend returns { results: number, data: any[] }
//         this.pages.set(res.data || []);
//         this.isLoading.set(false);
//       },
//       error: () => this.isLoading.set(false)
//     });
//   }

//   openCreateModal() { this.showCreateModal.set(true); }
//   closeCreateModal() {
//     this.showCreateModal.set(false);
//     this.createForm.reset();
//   }

//   createPage() {
//     if (!this.createForm.valid) return;
//     this.isSubmitting.set(true);
//     this.adminService.createPage(this.createForm.getRawValue() as CreatePageDto).subscribe({
//       next: () => {
//         this.closeCreateModal();
//         this.loadPages();
//         this.isSubmitting.set(false);
//       },
//       error: () => this.isSubmitting.set(false)
//     });
//   }

//   viewLive(slug: string) {
//     window.open(`/store/${this.currentOrgSlug}/${slug}`, '_blank', 'noopener');
//   }

//   togglePublish(page: any) {
//     const action = page.isPublished ? 'unpublish' : 'publish';
//     if (!confirm(`Are you sure you want to ${action} "${page.name}"?`)) return;

//     const request$ = page.isPublished
//       ? this.adminService.unpublishPage(page._id)
//       : this.adminService.publishPage(page._id);

//     request$.subscribe({
//       next: () => {
//         this.pages.update(currentPages =>
//           currentPages.map(p =>
//             p._id === page._id ? { ...p, isPublished: !page.isPublished } : p
//           )
//         );
//       },
//       error: () => alert(`Failed to ${action} page.`)
//     });
//   }

//   deletePage(id: string) {
//     if (!confirm('Are you sure you want to delete this page permanently?')) return;
//     this.adminService.deletePage(id).subscribe({
//       next: () => this.pages.update(currentPages => currentPages.filter(p => p._id !== id)),
//       error: () => alert('Failed to delete page.')
//     });
//   }
// }
