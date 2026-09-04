// src/app/features/storefront-admin/pages/page-builder/page-builder.component.ts
import {
  Component, OnInit, inject, signal, computed, ViewEncapsulation, OnDestroy, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { SplitterModule } from 'primeng/splitter';

// Config form
import { ConfigFormComponent } from '../config-form/config-form.component';

import { MasterListService } from '../../../../core/services/master-list.service';
import { AdminPage, PageSection, SectionDefinition } from '@core/models/storefront.model';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
import { StorefrontPublicService } from '@core/services/storefront-public.service';
import { AuthService } from '../../../auth/services/auth-service';
import { CanComponentDeactivate } from '../../guards/page-builder-unsaved.guard';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  SECTION_COMPONENT_REGISTRY,
  SECTION_RUNTIME_TYPES
} from '../../../storefront-public/dynamic-page/section-component.registry';
import { StorefrontSectionRendererComponent } from '../../../storefront-public/dynamic-page/storefront-section-renderer.component';

function buildDefaultConfig(schema: Record<string, any>): Record<string, any> {
  const config: Record<string, any> = {};
  for (const [key, def] of Object.entries(schema ?? {})) {
    if (def?.default !== undefined) {
      config[key] = def.default;
    } else if (def?.type === 'array') {
      config[key] = [];
    } else if (def?.type === 'object') {
      config[key] = buildDefaultConfig(def.schema ?? def.itemSchema ?? {});
    }
  }
  return config;
}

@Component({
  selector: 'app-page-builder',
  standalone: true,
  imports: [
    CommonModule, RouterModule, DragDropModule,
    DialogModule, TooltipModule, SplitterModule,
    ConfigFormComponent,
    StorefrontSectionRendererComponent
  ],
  templateUrl: './page-builder.component.html',
  styleUrls: ['./page-builder.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PageBuilderComponent implements OnInit, OnDestroy, CanComponentDeactivate {
  private readonly destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private adminService = inject(StorefrontAdminService);
  private publicService = inject(StorefrontPublicService);
  private masterListService = inject(MasterListService);
  private authService = inject(AuthService);

  // ── Data ──────────────────────────────────────────────────────────────────
  page = signal<AdminPage | null>(null);
  sections = signal<PageSection[]>([]);
  selectedSection = signal<PageSection | null>(null);

  private _storeEnums = signal<any>({ categories: [], brands: [], tags: [], products: [] });
  mastersData = computed(() => ({
    ...this._storeEnums()
  }));

  // ── Lifecycle & Concurrency ───────────────────────────────────────────────
  hasUnsavedChanges = signal(false);
  viewportMode = signal<'desktop' | 'tablet' | 'mobile'>('desktop');
  showAddMenu = signal(false);
  isSaving = signal(false);
  saveError = signal<string | null>(null);

  showPublishModal = signal(false);
  showConflictModal = signal(false);
  conflictData = signal<{ serverVersion?: number; yourVersion?: number } | null>(null);

  showPreviewModal = signal(false);
  previewData = signal<any>(null);
  isLoadingPreview = signal(false);

  // ── Tri-State Lifecycle Indicator ─────────────────────────────────────────
  lifecycleState = computed<'draft' | 'live' | 'live_modified'>(() => {
    const p = this.page();
    if (!p) return 'draft';
    if (!p.isPublished) return 'draft';
    if (p.hasUnpublishedChanges || this.hasUnsavedChanges()) return 'live_modified';
    return 'live';
  });

  // ── View state ────────────────────────────────────────────────────────────
  viewMode = signal<'sidebar' | 'dialog'>('sidebar');
  sidebarState = signal<'split' | 'full'>('split');

  // ── Registry ──────────────────────────────────────────────────────────────
  sectionRegistry: Record<string, SectionDefinition> = {};
  availableTypes: SectionDefinition[] = [];
  groupedTypes: Array<{ category: string; items: SectionDefinition[] }> = [];

  // ── Dirty State & Navigation Protection ───────────────────────────────────
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = true;
    }
  }

  canDeactivate(): boolean {
    if (!this.hasUnsavedChanges()) return true;
    return window.confirm(
      'You have unsaved changes in your draft. Leaving this page will discard these edits.\n\nAre you sure you want to leave?'
    );
  }

  ngOnInit(): void {
    const pageId = this.route.snapshot.paramMap.get('id');

    this.adminService.getSectionTypes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const types: SectionDefinition[] = res.data ?? (Array.isArray(res) ? res : []);

        this.availableTypes = types.filter(t => !t.isSystem && this.hasRuntimeSupport(t.type));
        this.sectionRegistry = types.reduce<Record<string, SectionDefinition>>((acc, t) => {
          acc[t.type] = t;
          return acc;
        }, {});

        const grouped = new Map<string, SectionDefinition[]>();
        this.availableTypes.forEach(t => {
          const cat = t.category ?? 'other';
          if (!grouped.has(cat)) grouped.set(cat, []);
          grouped.get(cat)!.push(t);
        });
        this.groupedTypes = Array.from(grouped.entries())
          .map(([category, items]) => ({ category, items }));

        if (pageId) this.loadPage(pageId);
      }
    });

    this.loadStoreMetadata();
  }

  // ── Loaders ───────────────────────────────────────────────────────────────

  loadPage(id: string): void {
    this.adminService.getPageById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const data: AdminPage = res.data;
        this.page.set(data);

        const valid = (data.sections ?? [])
          .filter((s: PageSection) => !!this.sectionRegistry[s.type] && this.hasRuntimeSupport(s.type))
          .map((s: PageSection) => ({ ...s, id: s.id || crypto.randomUUID() }));

        this.sections.set(valid);
        this.hasUnsavedChanges.set(false);
        this.showConflictModal.set(false);
        this.conflictData.set(null);
      },
      error: () => this.saveError.set('Failed to load page.')
    });
  }

  reloadPage(): void {
    const id = this.page()?._id;
    if (id) {
      this.loadPage(id);
    }
  }

  loadStoreMetadata(): void {
    let orgSlug = '';
    try {
      const user = this.authService.currentUser() as any;
      orgSlug = user?.organization?.uniqueShopId || window.localStorage.getItem('orgSlug') || '';
    } catch {
      orgSlug = '';
    }
    if (!orgSlug) return;

    this.publicService.getStoreMetadata(orgSlug).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const enums = res.data?.enums ?? res.enums ?? {};
        this._storeEnums.set({
          categories: enums.categories ?? [],
          brands: enums.brands ?? [],
          tags: enums.tags ?? [],
          products: enums.products ?? []
        });
      }
    });
  }

  // ── Viewport & View Actions ───────────────────────────────────────────────

  setViewportMode(mode: 'desktop' | 'tablet' | 'mobile'): void {
    this.viewportMode.set(mode);
  }

  toggleViewMode(): void {
    this.viewMode.update(m => m === 'sidebar' ? 'dialog' : 'sidebar');
  }

  toggleSidebarState(): void {
    this.sidebarState.update(s => s === 'split' ? 'full' : 'split');
  }

  onDialogHide(): void {
    this.viewMode.set('sidebar');
    this.selectedSection.set(null);
  }

  // ── Section Actions ───────────────────────────────────────────────────────

  addSection(type: string): void {
    const def = this.sectionRegistry[type];
    if (!def || !this.hasRuntimeSupport(type)) {
      this.saveError.set(`Section "${type}" is not available in the Angular runtime yet.`);
      return;
    }

    const newSection: PageSection = {
      id: crypto.randomUUID(),
      type: type as any,
      config: buildDefaultConfig(def.schema),
      isActive: true
    };

    this.sections.update(s => [...s, newSection]);
    this.hasUnsavedChanges.set(true);
    this.selectSection(newSection);
    this.showAddMenu.set(false);

    setTimeout(() => {
      document.getElementById('preview-container')
        ?.scrollTo({ top: 999999, behavior: 'smooth' });
    }, 80);
  }

  selectSection(section: PageSection): void {
    if (this.viewMode() === 'sidebar' && this.sidebarState() === 'full') {
      this.sidebarState.set('split');
    }

    if (this.selectedSection()?.id === section.id) return;

    try {
      this.selectedSection.set(JSON.parse(JSON.stringify(section)));
    } catch {
      this.selectedSection.set(section);
    }

    setTimeout(() => {
      const sidebarPanel = document.querySelector<HTMLElement>(
        '.builder-workbench__sidebar .p-tabpanels'
      );
      if (sidebarPanel) sidebarPanel.scrollTop = 0;

      const dialogPanel = document.querySelector<HTMLElement>(
        '.builder-floating-panel .p-dialog-content'
      );
      if (dialogPanel) dialogPanel.scrollTop = 0;
    }, 0);
  }

  deselectSection(): void {
    this.selectedSection.set(null);
  }

  deleteSection(id: string, event: Event): void {
    event.stopPropagation();
    if (!confirm('Remove this section?')) return;
    this.sections.update(list => list.filter(s => s.id !== id));
    this.hasUnsavedChanges.set(true);
    if (this.selectedSection()?.id === id) {
      this.selectedSection.set(null);
    }
  }

  drop(event: CdkDragDrop<PageSection[]>): void {
    const list = [...this.sections()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.sections.set(list);
    this.hasUnsavedChanges.set(true);
  }

  onConfigChange(newConfig: Record<string, any>): void {
    const current = this.selectedSection();
    if (!current) return;

    for (const [k, v] of Object.entries(newConfig)) {
      if (v !== null && v !== undefined) {
        current.config[k] = v;
      }
    }

    this.hasUnsavedChanges.set(true);

    this.sections.update(list =>
      list.map(s =>
        s.id === current.id
          ? { ...s, config: { ...current.config } }
          : s
      )
    );
  }

  // ── Draft Save (With Optimistic Concurrency) ──────────────────────────────

  savePage(): void {
    const currentPage = this.page();
    const pageId = currentPage?._id;
    if (!pageId) return;

    this.isSaving.set(true);
    this.saveError.set(null);

    const sections = this.sections().map(s => {
      const config: Record<string, any> = {};
      for (const [k, v] of Object.entries(s.config ?? {})) {
        if (v !== null && v !== '') config[k] = v;
      }

      if (s.type === 'product_grid' && config['columns']) {
        config['columns'] = Number(config['columns']);
      }
      if (s.type === 'countdown_timer' && config['targetDate'] instanceof Date) {
        config['targetDate'] = (config['targetDate'] as Date).toISOString();
      }

      const productIds = this.extractManualProductIds(s.type, config, s.manualData?.productIds);
      const manualData = {
        ...(s.manualData ?? {}),
        ...(productIds.length ? { productIds } : {})
      };

      return {
        id: s.id,
        type: s.type,
        config,
        styles: s.styles,
        isActive: s.isActive ?? true,
        isHiddenOnMobile: s.isHiddenOnMobile ?? false,
        isHiddenOnDesktop: s.isHiddenOnDesktop ?? false,
        smartRuleId: s.smartRuleId ?? null,
        manualData: Object.keys(manualData).length ? manualData : undefined
      };
    });

    this.adminService.updatePage(pageId, {
      sections,
      expectedVersion: currentPage.version
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.isSaving.set(false);
        if (res.data) {
          this.page.set(res.data);
        }
        this.hasUnsavedChanges.set(false);
      },
      error: (err: any) => {
        this.isSaving.set(false);
        if (err.status === 409) {
          const conflict = err.error?.data ?? {
            serverVersion: (currentPage.version ?? 1) + 1,
            yourVersion: currentPage.version ?? 1
          };
          this.conflictData.set(conflict);
          this.showConflictModal.set(true);
          this.saveError.set('Conflict: Another user or tab modified this page. Please review.');
        } else {
          this.saveError.set(err?.error?.message ?? 'Save failed. Please try again.');
        }
      }
    });
  }

  // ── Publishing Lifecycle ──────────────────────────────────────────────────

  promptPublish(): void {
    this.showPublishModal.set(true);
  }

  confirmPublish(): void {
    const page = this.page();
    if (!page?._id) return;

    this.isSaving.set(true);
    this.adminService.publishPage(page._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.page.set(res.data);
        this.hasUnsavedChanges.set(false);
        this.isSaving.set(false);
        this.showPublishModal.set(false);
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.saveError.set(err?.error?.message ?? 'Failed to publish page.');
      }
    });
  }

  unpublishPage(): void {
    const page = this.page();
    if (!page?._id) return;
    if (!confirm('Are you sure you want to unpublish this page? It will no longer be visible to public visitors.')) return;

    this.isSaving.set(true);
    this.adminService.unpublishPage(page._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.page.set(res.data);
        this.hasUnsavedChanges.set(false);
        this.isSaving.set(false);
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.saveError.set(err?.error?.message ?? 'Failed to unpublish page.');
      }
    });
  }

  openDraftPreview(): void {
    const pageId = this.page()?._id;
    if (!pageId) return;

    this.isLoadingPreview.set(true);
    this.adminService.getDraftPreview(pageId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.isLoadingPreview.set(false);
        this.previewData.set(res.data);
        this.showPreviewModal.set(true);
      },
      error: (err: any) => {
        this.isLoadingPreview.set(false);
        this.saveError.set(err?.error?.message ?? 'Failed to generate draft preview.');
      }
    });
  }

  scrollToTop(): void {
    document.getElementById('preview-container')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  hasRuntimeSupport(type: string): boolean {
    return SECTION_RUNTIME_TYPES.includes(type) || !!SECTION_COMPONENT_REGISTRY[type];
  }

  private extractManualProductIds(type: string, config: Record<string, any>, existing: string[] = []): string[] {
    const ids = new Set<string>();
    const add = (value: unknown): void => {
      if (Array.isArray(value)) {
        value.forEach(add);
        return;
      }

      const id = String(value ?? '').trim();
      if (id) ids.add(id);
    };

    if (type === 'featured_product') {
      add(config['productId']);
    }

    if (config['ruleType'] === 'manual_selection') {
      add(config['manualProductIds']);
    }

    existing.forEach(add);
    return Array.from(ids);
  }

  deletePage(): void {
    const page = this.page();
    if (!page?._id) return;
    if (!confirm('DANGER: Permanently delete this page? This cannot be undone.')) return;

    this.isSaving.set(true);
    this.adminService.deletePage(page._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => window.history.back(),
      error: (err: any) => {
        this.isSaving.set(false);
        this.saveError.set(err?.error?.message ?? 'Failed to delete page.');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
