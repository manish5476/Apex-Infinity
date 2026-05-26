// src/app/features/storefront-admin/pages/page-list/page-list.component.ts
import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StorefrontAdminService, CreatePageDto } from '@core/services/storefront-admin.service';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

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
      <div class="content-relative">

        <header class="page-header">
          <div class="header-left">
            <h1 class="page-title">Storefront Pages</h1>
            <p class="page-subtitle">Design, publish, and optimize your storefront landing campaigns.</p>
          </div>
          <button type="button" (click)="openCreateModal()" class="btn-primary-action">
            <i class="pi pi-plus"></i>
            <span>Create New Page</span>
          </button>
        </header>

        @if (error()) {
          <div class="error-banner">
            <div class="error-banner-content">
              <i class="pi pi-exclamation-triangle"></i>
              <span>{{ error() }}</span>
            </div>
            <button (click)="error.set(null)" class="error-close" type="button">
              <i class="pi pi-times"></i>
            </button>
          </div>
        }

        @if (isLoading()) {
          <div class="loader-container">
            <div class="spinner-ring"></div>
            <span class="loading-text">Assembling customer workspaces...</span>
          </div>
        } @else {

          @if (pages().length > 0) {
            <div class="stats-row">
              <div class="stat-chip">
                <span class="stat-value">{{ pages().length }}</span>
                <span class="stat-label">Total Folders</span>
              </div>
              <div class="stat-chip live">
                <span class="stat-value">{{ publishedCount() }}</span>
                <span class="stat-label">Live Channels</span>
              </div>
              <div class="stat-chip draft">
                <span class="stat-value">{{ draftCount() }}</span>
                <span class="stat-label">Draft Profiles</span>
              </div>
            </div>
          }

          <div class="card-grid">

            <button (click)="openCreateModal()" class="create-card" type="button">
              <div class="create-icon-ring">
                <i class="pi pi-plus"></i>
              </div>
              <span class="create-label">Blank Slate Workspace</span>
              <span class="create-hint">Start a new layout structure</span>
            </button>

            @for (page of pages(); track page._id) {
              <div class="page-card">
                
                <div class="card-media-segment">
                  <img
                    src="https://images.unsplash.com/photo-1768409427465-01320d46963e?q=80&w=800&auto=format&fit=crop"
                    alt="Layout Preview Template"
                    class="card-image"
                    loading="lazy" />
                  <div class="card-image-overlay"></div>

                  <div class="status-badge" [class.published]="page.isPublished">
                    <span class="status-dot"></span>
                    {{ page.isPublished ? 'Live' : 'Draft' }}
                  </div>

                  @if (page.isHomepage) {
                    <div class="homepage-badge" title="Primary Store Homepage Routing">
                      <i class="pi pi-home"></i>
                    </div>
                  }
                </div>

                <div class="card-content-segment">
                  <div class="card-top-row">
                    <h3 class="card-title" [title]="page.name">{{ page.name }}</h3>
                    <button
                      (click)="viewLive(page.slug)"
                      class="external-link-btn"
                      title="Open external channel"
                      type="button">
                      <i class="pi pi-external-link"></i>
                    </button>
                  </div>

                  <div class="meta-tags-row">
                    <code class="slug-pill">/{{ page.slug }}</code>
                    <span class="card-meta-badge">{{ page.pageType }}</span>
                    <span class="card-meta-badge">{{ (page.sectionsCount ?? 0) }} Blocks</span>
                  </div>

                  <div class="card-actions-wrapper">
                    <a [routerLink]="[page._id, 'builder']" class="btn-edit-action">
                      <i class="pi pi-pencil"></i>
                      <span>Design Layout</span>
                    </a>
                    
                    <div class="icon-actions-group">
                      <button
                        (click)="togglePublish(page)"
                        class="icon-action-btn"
                        [class.active]="page.isPublished"
                        [title]="page.isPublished ? 'Unpublish Channel' : 'Publish Channel'"
                        type="button">
                        <i class="pi" [class]="page.isPublished ? 'pi-eye' : 'pi-eye-slash'"></i>
                      </button>
                      <button
                        (click)="duplicatePage(page)"
                        class="icon-action-btn"
                        title="Duplicate Profile Schema"
                        type="button">
                        <i class="pi pi-copy"></i>
                      </button>
                      <button
                        (click)="deletePage(page)"
                        class="icon-action-btn danger"
                        title="Purge Profile Segment"
                        type="button">
                        <i class="pi pi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <div class="meta-timestamp">
                    Sync trace: {{ page.updatedAt | date:'MMM d, y, h:mm a' }}
                  </div>
                </div>

              </div>
            }

          </div>

          @if (pages().length === 0 && !isLoading()) {
            <div class="empty-state">
              <div class="empty-icon">
                <i class="pi pi-folder-open"></i>
              </div>
              <h3 class="empty-title">Workspace is Empty</h3>
              <p class="empty-subtitle">Initialize your core distribution channels by spinning up your first custom layout profile container.</p>
              <button type="button" (click)="openCreateModal()" class="btn-primary-action">
                <i class="pi pi-plus"></i> Create First Page
              </button>
            </div>
          }
        }
      </div>

      @if (showCreateModal()) {
        <div class="modal-backdrop" (click)="closeCreateModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">

            <div class="modal-header">
              <div class="modal-header-left">
                <div class="modal-icon">
                  <i class="pi pi-file-plus"></i>
                </div>
                <h2 class="modal-title">New Workspace Node</h2>
              </div>
              <button type="button" (click)="closeCreateModal()" class="close-btn">
                <i class="pi pi-times"></i>
              </button>
            </div>

            <form [formGroup]="createForm" (ngSubmit)="createPage()">
              <div class="form-body">
                <div class="form-group">
                  <label class="label" for="page-name">Workspace Descriptor / Title</label>
                  <input
                    id="page-name"
                    formControlName="name"
                    class="input"
                    placeholder="e.g. Winter Catalog Launch"
                    autocomplete="off" />
                  @if (createForm.get('name')?.invalid && createForm.get('name')?.touched) {
                    <span class="field-error">A unique descriptive name string is required.</span>
                  }
                </div>

                <div class="form-group">
                  <label class="label" for="page-slug">Routing Uniform URL Slug</label>
                  <div class="slug-input-wrapper">
                    <span class="slug-prefix">/</span>
                    <input
                      id="page-slug"
                      formControlName="slug"
                      class="input slug-input"
                      placeholder="winter-catalog-launch"
                      autocomplete="off" />
                  </div>
                  @if (createForm.get('slug')?.invalid && createForm.get('slug')?.touched) {
                    <span class="field-error">
                      Slugs are constrained to lowercase text alphanumeric vectors and uniform hyphens.
                    </span>
                  }
                </div>

                <div class="form-group">
                  <label class="label" for="page-type">Functional Page Type Module</label>
                  <select id="page-type" formControlName="pageType" class="input select-input">
                    <option value="custom">Custom Framework Layer</option>
                    <option value="home">Primary System Home Dashboard</option>
                    <option value="landing">Marketing Conversion Landing Target</option>
                    <option value="about">Corporate About Matrix Profile</option>
                    <option value="contact">Support Touchpoint Pipeline Gateway</option>
                    <option value="products">Product Directory Module Mesh</option>
                  </select>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" (click)="closeCreateModal()" class="btn-text-dismiss">
                  Dismiss
                </button>
                <button
                  type="submit"
                  [disabled]="createForm.invalid || isSubmitting()"
                  class="btn-primary-action min-w-btn">
                  @if (isSubmitting()) {
                    <i class="pi pi-spin pi-spinner"></i>
                  } @else {
                    <i class="pi pi-plus"></i>
                  }
                  <span>Initialize Matrix Node</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    /* ── High-End SaaS Workspace Grid Canvas Foundation ── */
    .page-container {
      min-height: 100vh;
      position: relative;
      background-color: #f8fafc; // Pristine enterprise studio color matrix backdrop layer
      padding: 24px;
      box-sizing: border-box;
      overflow-x: hidden;
    }
    .content-relative { position: relative; z-index: 1; width: 100%; max-width: 1600px; margin: 0 auto; }

    /* ── Structural Grid Responsive Ribbon Headboards ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 20px 24px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
      gap: 16px;
      flex-wrap: wrap;
    }
    .header-left { min-width: 250px; }
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      margin: 4px 0 0 0;
      color: #64748b;
      font-size: 13px;
    }

    /* ── Resilient Global Notification Action Banners ── */
    .error-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 20px;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 12px;
      color: #991b1b;
      font-size: 13px;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .error-banner-content { display: flex; align-items: center; gap: 10px; }
    .error-close {
      background: none; border: none; color: #b91c1c; cursor: pointer; padding: 4px;
      display: flex; align-items: center; justify-content: center; opacity: 0.8;
      &:hover { opacity: 1; }
    }

    /* ── System State Loader Framework Animation Loops ── */
    .loader-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 16px;
    }
    .spinner-ring {
      width: 40px; height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #0f172a;
      border-radius: 50%;
      animation: spin 0.65s linear infinite;
    }
    .loading-text { color: #64748b; font-size: 13px; font-weight: 500; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Unified Analytical Stats Bento Counters ── */
    .stats-row {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .stat-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.01);

      .stat-value { font-size: 13px; font-weight: 700; color: #0f172a; font-family: monospace; }
      .stat-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; }

      &.live { background: #f0fdf4; border-color: #bbf7d0; .stat-value { color: #166534; } .stat-label { color: #15803d; } }
      &.draft { background: #f8fafc; border-color: #cbd5e1; .stat-value { color: #334155; } .stat-label { color: #475569; } }
    }

    /* ── Dynamic Layout Resilient Grid Sheet Infrastructure ── */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      width: 100%;
    }

    /* ── Creation Module Bento Base Card ── */
    .create-card {
      background: #ffffff;
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 24px;
      min-height: 360px;
      cursor: pointer;
      box-sizing: border-box;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      gap: 8px;
      width: 100%;

      &:hover {
        background: #f8fafc; border-color: #0f172a; transform: translateY(-4px);
        box-shadow: 0 12px 24px -10px rgba(15, 23, 42, 0.06);
      }
    }
    .create-icon-ring {
      width: 48px; height: 48px; border-radius: 12px; border: 1px solid #e2e8f0;
      background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center;
      font-size: 16px; transition: all 0.2s; margin-bottom: 4px;
    }
    .create-card:hover .create-icon-ring { border-color: #0f172a; background: #0f172a; color: #ffffff; transform: scale(1.05); }
    .create-label { color: #0f172a; font-weight: 600; font-size: 14px; }
    .create-hint { color: #64748b; font-size: 12px; }

    /* ── Production Node Container Blocks (Dynamic Flex Height - Zoom Proof!) ── */
    .page-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.01), 0 10px 20px -12px rgba(15, 23, 42, 0.03);
      display: flex;
      flex-direction: column;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      width: 100%;
      box-sizing: border-box;

      &:hover {
        transform: translateY(-4px);
        border-color: #cbd5e1;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.01), 0 16px 32px -10px rgba(15, 23, 42, 0.08);
      }
    }

    /* Media Wrapper Blocks */
    .card-media-segment {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9; // Forces solid image box sizing bounds under high zoom variables
      background: #f1f5f9;
      overflow: hidden;
      flex-shrink: 0;
    }
    .card-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
    .page-card:hover .card-image { transform: scale(1.04); }
    .card-image-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,42,0.08) 0%, transparent 100%); }

    /* Floating Media Component Tags */
    .status-badge {
      position: absolute; top: 12px; right: 12px; z-index: 5;
      background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(4px);
      border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 600; color: #475569;
      display: inline-flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.03em;
      
      &.published { background: #dcfce7; border-color: #bbf7d0; color: #15803d; }
      .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    }
    .homepage-badge {
      position: absolute; top: 12px; left: 12px; z-index: 5;
      background: #fef3c7; border: 1px solid #fde68a; color: #b45309;
      width: 26px; height: 26px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 12px;
    }

    /* Core Content Block Matrices */
    .card-content-segment {
      padding: 18px;
      display: flex;
      flex-direction: column;
      flex-grow: 1; // Content box automatically expands/shrinks to securely absorb changing font size heights
      gap: 14px;
      min-width: 0;
    }
    .card-top-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .card-title {
      font-size: 16px; font-weight: 600; color: #0f172a; margin: 0; flex: 1;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .meta-tags-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; min-width: 0; }
    .slug-pill {
      font-family: monospace; font-size: 11px; color: #475569; background: #f1f5f9;
      padding: 2px 8px; border-radius: 6px; font-weight: 500;
      max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .card-meta-badge {
      font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em;
      color: #64748b; background: #f8fafc; padding: 2px 8px; border-radius: 6px; border: 1px solid #f1f5f9;
    }

    /* Actions Arrays Section Layouts */
    .card-actions-wrapper {
      display: flex; gap: 8px; align-items: center; margin-top: auto; padding-top: 4px;
      @media (max-width: 360px) { flex-direction: column; .btn-edit-action { width: 100%; } }
    }
    .icon-actions-group { display: flex; gap: 4px; align-items: center; }

    /* ── Action Framework Buttons Core Styling Sheet ── */
    .btn-primary-action {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 500;
      cursor: pointer; border: none; background: #0f172a; color: #ffffff;
      gap: 8px; line-height: 1; transition: background 0.15s ease;
      
      &:hover:not([disabled]) { background: #1e293b; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .btn-edit-action {
      flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
      background: #f1f5f9; color: #1e293b; text-decoration: none; transition: background 0.15s;
      border: 1px solid transparent;
      &:hover { background: #e2e8f0; border-color: #cbd5e1; }
    }
    .btn-text-dismiss {
      background: transparent; border: none; color: #64748b; font-weight: 500;
      cursor: pointer; padding: 10px 16px; border-radius: 8px; font-size: 13px;
      &:hover { background: #f1f5f9; color: #0f172a; }
    }

    .icon-action-btn, .external-link-btn {
      width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
      border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; color: #475569;
      cursor: pointer; transition: all 0.15s ease; flex-shrink: 0; font-size: 13px;
      
      &:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }
      &.active { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
      &.danger:hover { background: #fef2f2; color: #991b1b; border-color: #fca5a5; }
    }

    .meta-timestamp { font-size: 10px; color: #94a3b8; text-align: left; }

    /* ── Screen Empty Display Formats ── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; padding: 80px 24px; color: #475569; max-width: 500px; margin: 0 auto;
    }
    .empty-icon {
      width: 64px; height: 64px; border-radius: 16px; background: #ffffff;
      border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center;
      font-size: 24px; margin-bottom: 16px; color: #94a3b8;
    }
    .empty-title { font-size: 18px; font-weight: 600; color: #0f172a; margin: 0 0 8px; }
    .empty-subtitle { color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.5; }

    /* ── Creation Overlay Dialog Backdrops ── */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
      z-index: 1000; display: flex; align-items: center; justify-content: center;
      padding: 24px; animation: fadeIn 0.15s ease;
    }
    .modal-card {
      background: #ffffff; width: 100%; max-width: 480px; border-radius: 16px;
      box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.18);
      animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 24px 16px; border-bottom: 1px solid #f1f5f9; }
    .modal-header-left { display: flex; align-items: center; gap: 12px; }
    .modal-icon {
      width: 36px; height: 36px; border-radius: 10px; background: #f8fafc;
      display: flex; align-items: center; justify-content: center; color: #0f172a; font-size: 15px; border: 1px solid #e2e8f0;
    }
    .modal-title { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0; }
    .close-btn {
      background: #f1f5f9; border: none; width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.15s;
      &:hover { background: #e2e8f0; color: #0f172a; }
    }
    .form-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; }
    .input {
      width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px;
      font-size: 13px; outline: none; transition: border-color 0.15s; box-sizing: border-box; font-family: inherit; color: #0f172a;
      &::placeholder { color: #cbd5e1; }
      &:focus { border-color: #0f172a; box-shadow: 0 0 0 1px #0f172a; }
    }
    .select-input { cursor: pointer; background: #ffffff; padding-right: 24px; }
    .slug-input-wrapper { position: relative; }
    .slug-prefix { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 13px; font-family: monospace; }
    .slug-input { padding-left: 24px; font-family: monospace; }
    .field-error { font-size: 11px; color: #ef4444; font-weight: 400; margin-top: 2px; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px;
      border-top: 1px solid #f1f5f9; background: #f8fafc;
    }
    .min-w-btn { min-width: 140px; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class PageListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private adminService = inject(StorefrontAdminService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  pages = signal<any[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);
  showCreateModal = signal(false);
  error = signal<string | null>(null);

  // Computed channel status maps
  publishedCount = computed(() => this.pages().filter(p => p.isPublished).length);
  draftCount = computed(() => this.pages().filter(p => !p.isPublished).length);

  createForm = this.fb.group({
    name: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    pageType: ['custom']
  });

  ngOnInit(): void {
    this.loadPages();

    // Auto-slugify channel definitions on form interaction arrays
    this.createForm.get('name')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(name => {
      const slugCtrl = this.createForm.get('slug')!;
      if (name && !slugCtrl.dirty) {
        slugCtrl.setValue(slugify(name), { emitEvent: false });
      }
    });
  }

  loadPages(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.adminService.getPages().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.pages.set(res.data ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to read current storefront page matrices. Please retry.');
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
    this.adminService.createPage(this.createForm.getRawValue() as CreatePageDto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.closeCreateModal();
        this.isSubmitting.set(false);
        const currentUrl = this.router.url;
        const baseSegment = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
        this.router.navigateByUrl(`${baseSegment}/${res.data._id}/builder`);
        this.loadPages();
      },
      error: (err: any) => {
        this.error.set(err?.error?.message ?? 'Initialization pipeline failure.');
        this.isSubmitting.set(false);
      }
    });
  }

  viewLive(slug: string): void {
    const org = getOrgSlug();
    if (!org) { this.error.set('Target operational organization mapping token slice missing.'); return; }
    window.open(`/store/${org}/${slug}`, '_blank', 'noopener');
  }

  togglePublish(page: any): void {
    const action = page.isPublished ? 'unpublish' : 'publish';
    const request$ = page.isPublished
      ? this.adminService.unpublishPage(page._id)
      : this.adminService.publishPage(page._id);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.pages.update(list =>
          list.map(p => p._id === page._id ? { ...p, isPublished: !page.isPublished } : p)
        );
      },
      error: (err: any) => this.error.set(err?.error?.message ?? `Failed to complete state shift to ${action}.`)
    });
  }

  duplicatePage(page: any): void {
    this.adminService.duplicatePage(page._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.loadPages(),
      error: (err: any) => this.error.set(err?.error?.message ?? 'Cloning configuration error.')
    });
  }

  deletePage(page: any): void {
    if (page.isPublished) {
      this.error.set(`Unpublish active channel segment "${page.name}" prior to executing removal sequences.`);
      return;
    }
    if (page.isHomepage || page.pageType === 'home' || page.pageType === 'products') {
      this.error.set('Immutable core system layouts (Home or Products) cannot be purged.');
      return;
    }
    if (!confirm(`Permanently delete "${page.name}"? This transaction is irreversible.`)) return;
    this.adminService.deletePage(page._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.pages.update(list => list.filter(p => p._id !== page._id)),
      error: (err: any) => this.error.set(err?.error?.message ?? 'Purge execution block fault.')
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}