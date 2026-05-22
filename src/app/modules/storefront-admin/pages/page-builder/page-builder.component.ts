// src/app/features/storefront-admin/pages/page-builder/page-builder.component.ts
import {
  Component, OnInit, inject, signal, computed, ViewEncapsulation, OnDestroy
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
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import {
  SECTION_COMPONENT_REGISTRY,
  SECTION_RUNTIME_TYPES
} from '../../../storefront-public/dynamic-page/section-component.registry';
import { StorefrontSectionRendererComponent } from '../../../storefront-public/dynamic-page/storefront-section-renderer.component';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOrgSlug(): string {
  try {
    const raw = window.localStorage.getItem('orgSlug');
    return raw ? JSON.parse(raw) : '';
  } catch {
    return window.localStorage.getItem('orgSlug') ?? '';
  }
}

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
export class PageBuilderComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private adminService = inject(StorefrontAdminService);
  private publicService = inject(StorefrontPublicService);
  private masterListService = inject(MasterListService);

  // ── Data ──────────────────────────────────────────────────────────────────
  page = signal<AdminPage | null>(null);
  sections = signal<PageSection[]>([]);
  selectedSection = signal<PageSection | null>(null);
  
  private _storeEnums = signal<any>({ categories: [], brands: [], tags: [], products: [] });
  mastersData = computed(() => ({
    ...this._storeEnums()
  }));
  // ── View state ────────────────────────────────────────────────────────────
  viewMode = signal<'sidebar' | 'dialog'>('sidebar');
  sidebarState = signal<'split' | 'full'>('split');
  showAddMenu = signal(false);
  isSaving = signal(false);
  saveError = signal<string | null>(null);

  // ── Registry ──────────────────────────────────────────────────────────────
  /** Map of type → SectionDefinition — used in template */
  sectionRegistry: Record<string, SectionDefinition> = {};
  /** Flat list for the component library panel (excludes system sections) */
  availableTypes: SectionDefinition[] = [];
  /** Grouped by category for the library overlay */
  groupedTypes: Array<{ category: string; items: SectionDefinition[] }> = [];

  // ───────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const pageId = this.route.snapshot.paramMap.get('id');

    // Load section type catalogue first, then the page
    this.adminService.getSectionTypes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const types: SectionDefinition[] = res.data ?? (Array.isArray(res) ? res : []);

        this.availableTypes = types.filter(t => !t.isSystem && this.hasRuntimeSupport(t.type));
        this.sectionRegistry = types.reduce<Record<string, SectionDefinition>>((acc, t) => {
          acc[t.type] = t;
          return acc;
        }, {});

        // Group non-system types by category for the library panel
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

        // Only keep sections whose type exists in the registry
        const valid = (data.sections ?? [])
          .filter((s: PageSection) => !!this.sectionRegistry[s.type] && this.hasRuntimeSupport(s.type))
          .map((s: PageSection) => ({ ...s, id: s.id || crypto.randomUUID() }));

        this.sections.set(valid);
      },
      error: () => this.saveError.set('Failed to load page.')
    });
  }

  loadStoreMetadata(): void {
    const orgSlug = getOrgSlug();
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

  // ── UI actions ────────────────────────────────────────────────────────────

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
    this.selectSection(newSection);
    this.showAddMenu.set(false);

    // Scroll canvas to new section
    setTimeout(() => {
      document.getElementById('preview-container')
        ?.scrollTo({ top: 999999, behavior: 'smooth' });
    }, 80);
  }

  selectSection(section: PageSection): void {
    if (this.viewMode() === 'sidebar' && this.sidebarState() === 'full') {
      this.sidebarState.set('split');
    }
    // Deep-clone to prevent direct mutation before explicit save
    try {
      this.selectedSection.set(JSON.parse(JSON.stringify(section)));
    } catch {
      this.selectedSection.set(section);
    }
  }

  deselectSection(): void {
    this.selectedSection.set(null);
  }

  deleteSection(id: string, event: Event): void {
    event.stopPropagation();
    if (!confirm('Remove this section?')) return;
    this.sections.update(list => list.filter(s => s.id !== id));
    if (this.selectedSection()?.id === id) {
      this.selectedSection.set(null);
    }
  }

  drop(event: CdkDragDrop<PageSection[]>): void {
    const list = [...this.sections()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.sections.set(list);
  }

  onConfigChange(newConfig: Record<string, any>): void {
    const current = this.selectedSection();
    if (!current) return;

    // ✅ FIX: Only overwrite keys where newConfig has a real value.
    // If the form emits null/undefined for a key (e.g. an optional field
    // left blank), we keep the section's existing saved value instead of
    // wiping it out. This is critical for preserving items[] arrays after
    // selecting a section that has pre-saved content.
    const merged: Record<string, any> = { ...current.config };
    for (const [k, v] of Object.entries(newConfig)) {
      if (v !== null && v !== undefined) {
        merged[k] = v;
      }
    }

    const updated: PageSection = { ...current, config: merged };
    this.selectedSection.set(updated);
    this.sections.update(list => list.map(s => s.id === updated.id ? updated : s));
  }

  // ── API actions ───────────────────────────────────────────────────────────

  savePage(): void {
    const pageId = this.page()?._id;
    if (!pageId) return;

    this.isSaving.set(true);
    this.saveError.set(null);

    // ✅ FIX: Only send fields the backend actually expects.
    // 'position' and 'dataSource' are NOT in the section schema — removed.
    const sections = this.sections().map(s => {
      // Strip null/empty string values from config to keep payload clean
      const config: Record<string, any> = {};
      for (const [k, v] of Object.entries(s.config ?? {})) {
        if (v !== null && v !== '') config[k] = v;
      }

      // Type coercions that the backend validators require
      if (s.type === 'product_grid' && config['columns']) {
        config['columns'] = Number(config['columns']);
      }
      if (s.type === 'countdown_timer' && config['targetDate'] instanceof Date) {
        config['targetDate'] = (config['targetDate'] as Date).toISOString();
      }

      return {
        id: s.id,
        type: s.type,
        config,
        styles: s.styles,
        isActive: s.isActive ?? true,
        isHiddenOnMobile: s.isHiddenOnMobile ?? false,
        isHiddenOnDesktop: s.isHiddenOnDesktop ?? false,
        smartRuleId: s.smartRuleId ?? null,
        manualData: s.manualData ?? undefined
      };
    });

    this.adminService.updatePage(pageId, { sections }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.isSaving.set(false),
      error: (err: any) => {
        this.isSaving.set(false);
        this.saveError.set(err?.error?.message ?? 'Save failed. Please try again.');
      }
    });
  }

  togglePublish(): void {
    const page = this.page();
    if (!page?._id) return;

    const action = page.isPublished ? 'unpublish' : 'publish';
    const request$ = page.isPublished
      ? this.adminService.unpublishPage(page._id)
      : this.adminService.publishPage(page._id);

    this.isSaving.set(true);
    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.page.set(res.data);
        this.isSaving.set(false);
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.saveError.set(err?.error?.message ?? `Failed to ${action} page.`);
      }
    });
  }
  scrollToTop(): void {
    document.getElementById('preview-container')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  hasRuntimeSupport(type: string): boolean {
    return SECTION_RUNTIME_TYPES.includes(type) || !!SECTION_COMPONENT_REGISTRY[type];
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
