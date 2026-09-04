// src/app/modules/storefront-admin/pages/page-list/page-list.component.ts
import { Component, OnInit, inject, signal, computed, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StorefrontAdminService, CreatePageDto, StorefrontPage } from '@core/services/storefront-admin.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SearchFilterComponent } from '@shared/ui/filters/search-filter.component';
import { SelectFilterComponent, SelectFilterOption } from '@shared/ui/filters/select-filter.component';
import { GridPaginationComponent } from '@shared/ui/grid/components/grid-pagination.component';
import { GridPageState } from '@shared/ui/grid/grid-types';
import { EmptyStateComponent } from '@shared/ui/feedback/empty-state/empty-state.component';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    DatePipe,
    SearchFilterComponent,
    SelectFilterComponent,
    GridPaginationComponent,
    EmptyStateComponent
  ],
  template: `
    <main class="storefront-pages-layout" [class.panel-open]="showCreateModal()">
    
      <section class="grid-section">
        <!-- Page Header -->
        <header class="page-header">
          <div class="header-content">
            <h1>Storefront Pages</h1>
            <p class="subtitle">Design, publish, and manage your storefront pages.</p>
          </div>
          <div class="header-actions">
            <button type="button" (click)="loadPages()" class="premium-btn ghost-btn">
              <i class="pi pi-refresh" [class.pi-spin]="isLoading()"></i> Refresh
            </button>
            <button type="button" (click)="openCreateModal()" class="premium-btn primary-btn">
              <i class="pi pi-plus"></i> Create Page
            </button>
          </div>
        </header>

        <!-- Filters Toolbar -->
        <div class="filters-toolbar">
          <div class="filters-group">
            <app-search-filter
              [placeholder]="'Search by title or slug...'"
              [value]="searchTerm()"
              (valueChange)="onSearchChange($event)">
            </app-search-filter>
            <app-select-filter
              [options]="statusOptions"
              [placeholder]="'All Statuses'"
              [value]="statusFilter()"
              [filter]="false"
              (valueChange)="onStatusChange($event)">
            </app-select-filter>
            <app-select-filter
              [options]="typeOptions"
              [placeholder]="'All Types'"
              [value]="typeFilter()"
              [filter]="false"
              (valueChange)="onTypeChange($event)">
            </app-select-filter>
          </div>
          @if (hasActiveFilters()) {
            <button type="button" class="premium-btn ghost-btn clear-filter-btn" (click)="clearFilters()">
              <i class="pi pi-filter-slash"></i> Clear Filters
            </button>
          }
        </div>
    
        <div class="grid-container">
          @if (error()) {
            <div class="error-state">
              <i class="pi pi-exclamation-triangle"></i>
              <p>{{ error() }}</p>
              <button class="premium-btn ghost-btn" (click)="error.set(null)">Dismiss</button>
            </div>
          }
    
          @if (isLoading()) {
            <div class="loader-container">
              <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--text-secondary);"></i>
              <span class="loading-text">Loading pages...</span>
            </div>
          } @else {
    
            @if (pages().length > 0 || hasActiveFilters()) {
              <div class="bento-metrics-row">
                <div class="bento-block stat-box">
                  <div class="stat-icon"><i class="pi pi-file"></i></div>
                  <div class="stat-content">
                    <span class="value">{{ total() }}</span>
                    <span class="label">Total Pages</span>
                  </div>
                </div>
                <div class="bento-block stat-box highlight">
                  <div class="stat-icon"><i class="pi pi-globe"></i></div>
                  <div class="stat-content">
                    <span class="value">{{ publishedCount() }}</span>
                    <span class="label">Published</span>
                  </div>
                </div>
                <div class="bento-block stat-box">
                  <div class="stat-icon"><i class="pi pi-file-edit"></i></div>
                  <div class="stat-content">
                    <span class="value">{{ draftCount() }}</span>
                    <span class="label">Drafts</span>
                  </div>
                </div>
                <div class="bento-block stat-box total-views">
                  <div class="stat-icon"><i class="pi pi-chart-line"></i></div>
                  <div class="stat-content">
                    <span class="value">{{ totalViewsCount() | number }}</span>
                    <span class="label">Total Views</span>
                  </div>
                </div>
              </div>
            }
    
            <div class="card-grid-wrapper">
              <div class="card-grid">
    
                <!-- Blank Create Card (only shown on page 1 with no filters) -->
                @if (!hasActiveFilters() && currentPage() === 1) {
                  <button (click)="openCreateModal()" class="create-card" type="button">
                    <div class="create-icon-ring">
                      <i class="pi pi-plus"></i>
                    </div>
                    <span class="create-label">New Page</span>
                    <span class="create-hint">Start from a blank canvas</span>
                  </button>
                }
    
                @for (page of pages(); track page._id) {
                  <div class="page-card">
    
                    <div class="card-cover-segment" [attr.data-type]="page.pageType">
                      <div class="cover-overlay"></div>
    
                      <div class="status-badge" [class.published]="page.isPublished && !page.hasUnpublishedChanges" [class.modified]="page.isPublished && page.hasUnpublishedChanges">
                        <span class="status-dot"></span>
                        {{ !page.isPublished ? 'Draft' : (page.hasUnpublishedChanges ? 'Live (Modified)' : 'Live') }}
                      </div>
    
                      @if (page.isHomepage) {
                        <div class="homepage-badge" title="Primary Store Homepage">
                          <i class="pi pi-home"></i>
                        </div>
                      } @else if (page.pageType === 'products') {
                        <div class="homepage-badge product-badge" title="Core Product Directory">
                          <i class="pi pi-shopping-bag"></i>
                        </div>
                      }
                    </div>
    
                    <div class="card-content-segment">
                      <div class="card-header-row">
                        <h3 class="card-title" [title]="page.name">{{ page.name }}</h3>
                        <button (click)="viewLive(page.slug)" class="icon-btn ghost-btn" title="View Live" type="button">
                          <i class="pi pi-external-link"></i>
                        </button>
                      </div>
    
                      <code class="slug-pill">/{{ page.slug }}</code>
    
                      <div class="meta-metrics-grid">
                        <div class="metric-item">
                          <i class="pi pi-eye"></i>
                          <span>{{ page.viewCount ?? 0 }} Views</span>
                        </div>
                        <div class="metric-item">
                          <i class="pi pi-objects-column"></i>
                          <span>{{ page.sectionsCount ?? 0 }} Sections</span>
                        </div>
                        <div class="metric-item">
                          <i class="pi pi-tag"></i>
                          <span style="text-transform: capitalize;">{{ page.pageType }}</span>
                        </div>
                      </div>
    
                      <div class="card-actions-wrapper">
                        <a [routerLink]="[page._id, 'builder']" class="premium-btn primary-btn full-width">
                          <i class="pi pi-pencil"></i> Design
                        </a>
    
                        <div class="icon-actions-group">
                          <button (click)="togglePublish(page)" class="icon-btn toggle-btn" [class.active]="page.isPublished" [title]="page.isPublished ? 'Unpublish' : 'Publish'">
                            <i class="pi" [class]="page.isPublished ? 'pi-eye' : 'pi-eye-slash'"></i>
                          </button>
                          <button (click)="duplicatePage(page)" class="icon-btn" title="Duplicate Page">
                            <i class="pi pi-copy"></i>
                          </button>
                          <button
                            (click)="deletePage(page)"
                            class="icon-btn danger-btn"
                            title="Delete Page"
                            [disabled]="page.isHomepage || page.pageType === 'home' || page.pageType === 'products'">
                            <i class="pi pi-trash"></i>
                          </button>
                        </div>
                      </div>
    
                      <div class="meta-timestamp">
                        Updated: {{ page.updatedAt | date:'MMM d, y, h:mm a' }}
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
    
            @if (pages().length === 0 && !isLoading()) {
              <div class="empty-state-wrapper">
                <app-empty-state
                  icon="pi pi-file"
                  [title]="hasActiveFilters() ? 'No matching pages' : 'No pages yet'"
                  [description]="hasActiveFilters() ? 'No pages match your current search and filter criteria.' : 'Create your first page to start building your storefront.'"
                  [actionLabel]="hasActiveFilters() ? 'Clear Filters' : 'Create Page'"
                  [actionIcon]="hasActiveFilters() ? 'pi pi-filter-slash' : 'pi pi-plus'"
                  (action)="hasActiveFilters() ? clearFilters() : openCreateModal()">
                </app-empty-state>
              </div>
            }

            @if (total() > 0) {
              <div class="pagination-container">
                <app-grid-pagination
                  [total]="total()"
                  [page]="currentPage() - 1"
                  [pageSize]="pageSize()"
                  [pageSizeOptions]="[10, 20, 50]"
                  (pageChange)="onPageChange($event)"
                  (pageSizeChange)="onPageSizeChange($event)">
                </app-grid-pagination>
              </div>
            }
          }
        </div>
      </section>
    
      <!-- Create Page Slide-in Drawer -->
      @if (showCreateModal()) {
        <aside class="detail-panel create-panel">
          <header class="panel-header">
            <div class="title-group">
              <span class="eyebrow">Pages</span>
              <h2>New Page</h2>
            </div>
            <button class="close-btn" (click)="closeCreateModal()" aria-label="Close panel">
              <i class="pi pi-times"></i>
            </button>
          </header>
          <div class="panel-scroll panel-form-scroll">
            <form [formGroup]="createForm" (ngSubmit)="createPage()" class="agent-form-grid">
              <div class="bento-block form-block">
                <div class="block-header-mini">Page Details</div>
                <label class="form-label">
                  Page Title <span class="required">*</span>
                  <input formControlName="name" class="premium-input" placeholder="e.g. Summer Collection" autocomplete="off" />
                  @if (createForm.get('name')?.invalid && createForm.get('name')?.touched) {
                    <span class="field-error">Page title is required.</span>
                  }
                </label>
                <label class="form-label">
                  URL Slug <span class="required">*</span>
                  <div class="slug-input-wrapper">
                    <span class="slug-prefix">/</span>
                    <input formControlName="slug" class="premium-input slug-input" placeholder="summer-collection" autocomplete="off" />
                  </div>
                  @if (createForm.get('slug')?.invalid && createForm.get('slug')?.touched) {
                    <span class="field-error">Use lowercase letters, numbers, and hyphens only.</span>
                  }
                </label>
                <label class="form-label">
                  Page Type
                  <select formControlName="pageType" class="premium-select">
                    <option value="custom">Custom Page</option>
                    <option value="home">Home Page</option>
                    <option value="landing">Landing Page</option>
                    <option value="about">About Us</option>
                    <option value="contact">Contact Us</option>
                    <option value="products">Products Catalog</option>
                  </select>
                </label>
              </div>
            </form>
          </div>
          <div class="sticky-actions">
            <button type="button" (click)="closeCreateModal()" class="premium-btn ghost-btn">Cancel</button>
            <button type="submit" (click)="createPage()" [disabled]="createForm.invalid || isSubmitting()" class="premium-btn primary-btn">
              <i class="pi" [class.pi-spin]="isSubmitting()" [class.pi-spinner]="isSubmitting()" [class.pi-plus]="!isSubmitting()"></i>
              Create Page
            </button>
          </div>
        </aside>
      }
    
    </main>
  `,
  styles: [`
    .storefront-pages-layout {
      display: flex;
      height: 100vh;
      width: 100%;
      position: relative;
      overflow: hidden;
      background: var(--bg-secondary);
      box-sizing: border-box;
      font-family: 'Inter', sans-serif;

      /* Master Detail Split Logic */
      .grid-section {
        flex: 1 1 100%;
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 24px;
        transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        min-width: 0;
      }

      &.panel-open {
        .grid-section {
          flex: 0 0 65%;
          max-width: 65%;
          padding-right: 12px;

          @media (max-width: 1024px) {
            display: none;
          }
        }

        .detail-panel {
          display: flex;
          flex: 0 0 35%;
          max-width: 35%;

          @media (max-width: 1024px) {
            flex: 1 1 100%;
            max-width: 100%;
            padding-left: 24px;
          }
        }
      }

      /* Header */
      .page-header {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        flex-shrink: 0;

        .header-content {
          min-width: 200px;
          h1 {
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.02em;
            color: var(--text-primary);
            margin: 0 0 4px 0;
          }
          .subtitle {
            font-size: 13px;
            color: var(--text-secondary);
            margin: 0;
          }
        }

        .header-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
        }
      }

      /* Filters Toolbar */
      .filters-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 20px;
        flex-shrink: 0;

        .filters-group {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
        }

        .clear-filter-btn {
          font-size: 12px;
          padding: 6px 12px;
        }
      }

      /* Wrappers */
      .grid-container {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .card-grid-wrapper {
        flex: 1;
        overflow-y: auto;
        padding-bottom: 20px;
        padding-right: 8px; /* Scrollbar padding */
      }

      .pagination-container {
        flex-shrink: 0;
        background: var(--bg-primary);
        border: 1px solid var(--border-primary);
        border-radius: 10px;
        padding: 4px 12px;
        margin-top: 8px;
      }

      .empty-state-wrapper {
        padding: 40px 0;
      }

      /* Analytics Metrics Top Row */
      .bento-metrics-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 20px;
        flex-shrink: 0;
        
        @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
        @media (max-width: 600px) { grid-template-columns: 1fr; }

        .stat-box {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          
          .stat-icon {
            width: 42px; height: 42px; border-radius: 10px; background: var(--bg-secondary); color: var(--text-secondary);
            display: grid; place-items: center; font-size: 18px;
          }

          .stat-content {
            display: flex; flex-direction: column; gap: 4px;
            .value { font-size: 20px; font-weight: 700; color: var(--text-primary); line-height: 1; }
            .label { font-size: 11px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
          }

          &.highlight {
            background: #f0fdf4; border-color: #bbf7d0;
            .stat-icon { background: var(--color-success-bg); color: var(--color-success); }
            .stat-content .value { color: var(--color-success); }
          }

          &.total-views {
            background: var(--color-info-bg); border-color: #bfdbfe;
            .stat-icon { background: var(--color-info-bg); color: var(--accent-primary); }
            .stat-content .value { color: #1e3a8a; }
          }
        }
      }

      /* Bento Blocks Generic */
      .bento-block {
        background: var(--bg-primary);
        border: 1px solid rgba(226, 232, 240, 0.9);
        border-radius: 14px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01), 0 8px 16px -10px rgba(15, 23, 42, 0.04);
      }

      /* Card Grid */
      .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        width: 100%;
      }

      /* Create Blank Card */
      .create-card {
        background: var(--bg-primary); border: 2px dashed var(--border-primary); border-radius: 16px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 32px 24px; min-height: 380px; cursor: pointer; box-sizing: border-box;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); gap: 8px; width: 100%;

        &:hover { background: var(--bg-secondary); border-color: var(--text-primary); transform: translateY(-4px); box-shadow: 0 12px 24px -10px rgba(15, 23, 42, 0.06); }
        .create-icon-ring {
          width: 48px; height: 48px; border-radius: 12px; border: 1px solid var(--border-primary); background: var(--bg-secondary); color: var(--text-primary);
          display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.2s; margin-bottom: 4px;
        }
        &:hover .create-icon-ring { border-color: var(--text-primary); background: var(--text-primary); color: var(--bg-primary); transform: scale(1.05); }
        .create-label { color: var(--text-primary); font-weight: 600; font-size: 14px; }
        .create-hint { color: var(--text-secondary); font-size: 12px; }
      }

      /* Dynamic Page Cards */
      .page-card {
        background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 16px;
        overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.01), 0 10px 20px -12px rgba(15, 23, 42, 0.03);
        display: flex; flex-direction: column; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        width: 100%; min-height: 380px; box-sizing: border-box;

        &:hover { transform: translateY(-4px); border-color: var(--border-primary); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.01), 0 16px 32px -10px rgba(15, 23, 42, 0.08); }
      }

      /* Dynamic CSS Gradients based on type */
      .card-cover-segment {
        position: relative; width: 100%; height: 140px; flex-shrink: 0;
        background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--border-primary) 100%);

        &[data-type="home"] { background: linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%); }
        &[data-type="products"] { background: linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 100%); }
        &[data-type="about"] { background: linear-gradient(135deg, #ffedd5 0%, #fdba74 100%); }
        &[data-type="contact"] { background: linear-gradient(135deg, #ecfccb 0%, #bef264 100%); }
        &[data-type="landing"] { background: linear-gradient(135deg, #fce7f3 0%, #f9a8d4 100%); }

        .cover-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,42,0.1) 0%, transparent 100%); }
      }

      .status-badge {
        position: absolute; top: 12px; right: 12px; z-index: 5; background: color-mix(in srgb, var(--bg-primary) 95%, transparent);
        border: 1px solid var(--border-primary); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; color: var(--text-secondary);
        display: inline-flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.03em;
        &.published { background: var(--color-success-bg); border-color: #bbf7d0; color: var(--color-success); }
        &.modified { background: #eef2ff; border-color: #c7d2fe; color: #4338ca; }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
      }

      .homepage-badge {
        position: absolute; top: 12px; left: 12px; z-index: 5;
        background: var(--color-warning-bg); border: 1px solid var(--color-warning-bg); color: var(--color-warning); width: 28px; height: 28px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        &.product-badge { background: var(--color-info-bg); border-color: #bfdbfe; color: var(--accent-primary); }
      }

      .card-content-segment {
        padding: 20px; display: flex; flex-direction: column; flex-grow: 1; gap: 14px;
      }

      .card-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
      .card-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      .slug-pill {
        font-family: monospace; font-size: 12px; color: var(--text-secondary); background: var(--bg-secondary);
        padding: 4px 10px; border-radius: 6px; font-weight: 500; width: fit-content; border: 1px solid var(--border-primary);
      }

      .meta-metrics-grid {
        display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px;
        .metric-item {
          display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary);
          background: var(--bg-secondary); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--bg-secondary);
          i { color: var(--text-secondary); font-size: 11px; }
          span { font-weight: 500; }
        }
      }

      .card-actions-wrapper {
        display: flex; gap: 8px; align-items: center; margin-top: auto; padding-top: 8px;
      }
      .icon-actions-group { display: flex; gap: 6px; align-items: center; }

      .meta-timestamp { font-size: 11px; color: var(--text-secondary); font-weight: 500; }

      /* Buttons */
      .premium-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 500; font-size: 13px;
        padding: 10px 16px; border-radius: 8px; border: 1px solid transparent; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        text-decoration: none;

        &.full-width { flex: 1; }
        &.primary-btn { background: var(--text-primary); color: var(--bg-primary); &:hover { background: var(--text-primary); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1); } &[disabled] { opacity: 0.6; cursor: not-allowed; } }
        &.ghost-btn { background: var(--bg-primary); border: 1px solid var(--border-primary); color: var(--text-secondary); &:hover { background: var(--bg-secondary); color: var(--text-primary); } }
      }

      .icon-btn {
        width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border-primary); background: var(--bg-primary); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; font-size: 14px; flex-shrink: 0;
        &:hover:not([disabled]) { background: var(--bg-secondary); color: var(--text-primary); border-color: var(--border-primary); }
        &[disabled] { opacity: 0.5; cursor: not-allowed; background: var(--bg-secondary); }
        &.toggle-btn.active { background: var(--color-success-bg); color: var(--color-success); border-color: #bbf7d0; }
        &.danger-btn:hover:not([disabled]) { background: var(--color-error-bg); color: #991b1b; border-color: #fca5a5; }
        &.ghost-btn { border-color: transparent; background: transparent; &:hover { background: var(--bg-secondary); } }
      }

      /* Slide-in Drawer */
      .detail-panel {
        display: none;
        flex-direction: column; height: 100%; padding: 24px 24px 24px 12px; min-width: 0;

        .panel-header {
          padding: 16px 24px; border: 1px solid var(--border-primary); border-bottom: none; background: var(--bg-primary); display: flex; justify-content: space-between; align-items: center; border-radius: 16px 16px 0 0;
          .title-group {
            display: flex; flex-direction: column;
            .eyebrow { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-primary); margin-bottom: 2px; }
            h2 { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-primary); }
          }
          .close-btn { background: var(--bg-secondary); border: none; color: var(--text-secondary); cursor: pointer; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; transition: all 0.2s ease; &:hover { background: var(--border-primary); color: var(--text-primary); } }
        }

        .panel-form-scroll {
          flex: 1; overflow-y: auto; padding: 24px; background: var(--bg-secondary); border-left: 1px solid var(--border-primary); border-right: 1px solid var(--border-primary); display: flex; flex-direction: column;
        }

        .sticky-actions {
          background: var(--bg-primary); border: 1px solid var(--border-primary); border-top: none; padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px; border-radius: 0 0 16px 16px;
        }
      }

      /* Form Elements */
      .agent-form-grid {
        display: flex; flex-direction: column; gap: 16px;
        
        .form-block { display: flex; flex-direction: column; gap: 16px; padding: 20px; }
        .block-header-mini { font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; border-bottom: 1px solid var(--bg-secondary); padding-bottom: 12px; }

        .form-label {
          display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 600; color: var(--text-primary);
          .required { color: var(--color-error); }
        }

        .premium-input, .premium-select {
          background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 8px; color: var(--text-primary); padding: 10px 12px; font-size: 13px; font-family: inherit; transition: all 0.2s; outline: none;
          &::placeholder { color: var(--text-secondary); }
          &:focus { border-color: var(--accent-primary); background: var(--bg-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        }
        
        .slug-input-wrapper { position: relative; }
        .slug-prefix { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 13px; font-family: monospace; }
        .slug-input { padding-left: 24px; font-family: monospace; }
        .field-error { font-size: 11px; color: var(--color-error); font-weight: 400; margin-top: 2px; }
      }

      /* Loaders & Empty States */
      .loader-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; gap: 16px; .loading-text { color: var(--text-secondary); font-size: 13px; font-weight: 500; } }
      .error-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px; background: var(--bg-primary); border-radius: 14px; border: 1px solid var(--color-error-bg); color: var(--color-error); gap: 12px; text-align: center; margin-bottom: 20px; i { font-size: 24px; } p { font-size: 14px; margin: 0; font-weight: 500; } }
    }
  `]
})
export class PageListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private adminService = inject(StorefrontAdminService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  pages = signal<StorefrontPage[]>([]);
  total = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  searchTerm = signal('');
  statusFilter = signal<'published' | 'draft' | null>(null);
  typeFilter = signal<string | null>(null);

  isLoading = signal(true);
  isSubmitting = signal(false);
  showCreateModal = signal(false);
  error = signal<string | null>(null);

  readonly statusOptions: SelectFilterOption[] = [
    { label: 'All Statuses', value: null },
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' }
  ];

  readonly typeOptions: SelectFilterOption[] = [
    { label: 'All Types', value: null },
    { label: 'Custom', value: 'custom' },
    { label: 'Home', value: 'home' },
    { label: 'Landing', value: 'landing' },
    { label: 'About', value: 'about' },
    { label: 'Contact', value: 'contact' },
    { label: 'Products', value: 'products' }
  ];

  hasActiveFilters = computed(() => !!this.searchTerm() || !!this.statusFilter() || !!this.typeFilter());

  publishedCount = computed(() => this.pages().filter(p => p.status === 'published' || p.isPublished).length);
  draftCount = computed(() => this.pages().filter(p => p.status !== 'published' && !p.isPublished).length);
  totalViewsCount = computed(() => this.pages().reduce((sum, current) => sum + (current.viewCount || 0), 0));

  createForm = this.fb.group({
    name: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    pageType: ['custom']
  });

  ngOnInit(): void {
    this.loadPages();

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

    this.adminService.getPages({
      page: this.currentPage(),
      limit: this.pageSize(),
      search: this.searchTerm() || undefined,
      status: this.statusFilter() || undefined,
      pageType: this.typeFilter() || undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.pages.set(res.data ?? []);
        this.total.set(res.total ?? res.results ?? (res.data?.length || 0));
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load storefront pages. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadPages();
  }

  onStatusChange(status: any): void {
    this.statusFilter.set(status || null);
    this.currentPage.set(1);
    this.loadPages();
  }

  onTypeChange(type: any): void {
    this.typeFilter.set(type || null);
    this.currentPage.set(1);
    this.loadPages();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set(null);
    this.typeFilter.set(null);
    this.currentPage.set(1);
    this.loadPages();
  }

  onPageChange(state: GridPageState): void {
    this.currentPage.set(state.page + 1);
    this.loadPages();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadPages();
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
        this.error.set(err?.error?.message ?? 'Failed to create page.');
        this.isSubmitting.set(false);
      }
    });
  }

  viewLive(slug: string): void {
    const org = getOrgSlug();
    if (!org) {
      this.error.set('Organization details not found. Please refresh and try again.');
      return;
    }
    window.open(`/store/${org}/${slug}`, '_blank', 'noopener');
  }

  togglePublish(page: StorefrontPage): void {
    const action = page.isPublished ? 'unpublish' : 'publish';
    const request$ = page.isPublished
      ? this.adminService.unpublishPage(page._id)
      : this.adminService.publishPage(page._id);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.pages.update(list =>
          list.map(p => p._id === page._id ? { ...p, isPublished: !page.isPublished, status: !page.isPublished ? 'published' : 'draft' } : p)
        );
      },
      error: (err: any) => this.error.set(err?.error?.message ?? `Failed to ${action} page.`)
    });
  }

  duplicatePage(page: StorefrontPage): void {
    this.adminService.duplicatePage(page._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.loadPages(),
      error: (err: any) => this.error.set(err?.error?.message ?? 'Failed to duplicate page.')
    });
  }

  deletePage(page: StorefrontPage): void {
    if (page.isHomepage || page.pageType === 'home' || page.pageType === 'products') return;
    
    if (page.isPublished || page.status === 'published') {
      this.error.set(`Please unpublish "${page.name}" before deleting it.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete "${page.name}"? This action cannot be undone.`)) return;
    this.adminService.deletePage(page._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.pages.update(list => list.filter(p => p._id !== page._id));
        this.total.update(t => Math.max(0, t - 1));
      },
      error: (err: any) => this.error.set(err?.error?.message ?? 'Failed to delete page.')
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
