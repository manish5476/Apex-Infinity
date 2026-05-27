import { CommonModule } from '@angular/common';
import { Component, Input, Type, signal } from '@angular/core';
import {
  LAYOUT_SECTION_COMPONENT_REGISTRY,
  LayoutRenderContext,
  LayoutSectionRenderEntry
} from './layout-section.registry';

@Component({
  selector: 'app-layout-section-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (componentType(); as component) {
      <ng-container *ngComponentOutlet="component; inputs: componentInputs()"></ng-container>
    } @else if (isDev && loadError()) {
      <div class="layout-debug-placeholder">
        <i class="pi pi-code"></i>
        <span>{{ loadError() }}</span>
      </div>
    }
  `,
  styles: [`
    :host { display: contents; }

    .layout-debug-placeholder {
      margin: 0.75rem auto;
      width: min(100% - 2rem, 960px);
      padding: 0.85rem 1rem;
      border: 1px dashed var(--apx-color-danger, var(--color-error));
      border-radius: var(--apx-radius-md, 0.5rem);
      color: var(--apx-color-danger, var(--color-error));
      background: color-mix(in srgb, var(--apx-color-danger, var(--color-error)) 8%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      font: 700 0.8rem / 1.4 var(--apx-font-mono, monospace);
    }
  `]
})
export class LayoutSectionRendererComponent {
  @Input({ required: true }) set section(value: any) {
    this._section = value;
    this.loadSection(value);
  }

  @Input() set organization(value: any) {
    this._context.organization = value;
    this._context.orgSlug = value?.slug ?? this._context.orgSlug;
    this.refreshInputs();
  }

  @Input() set orgSlug(value: string) {
    this._context.orgSlug = value ?? '';
    this.refreshInputs();
  }

  @Input() isDev = false;

  readonly componentType = signal<Type<unknown> | null>(null);
  readonly componentInputs = signal<Record<string, unknown>>({});
  readonly loadError = signal<string | null>(null);

  private _section: any = null;
  private _entry: LayoutSectionRenderEntry | null = null;
  private _loadToken = 0;
  private _context: LayoutRenderContext = { organization: null, orgSlug: '' };

  private async loadSection(section: any): Promise<void> {
    const token = ++this._loadToken;
    this.componentType.set(null);
    this.loadError.set(null);

    const entry = LAYOUT_SECTION_COMPONENT_REGISTRY[section?.type];
    this._entry = entry ?? null;
    if (!entry) {
      this.componentInputs.set({});
      this.loadError.set(`Unknown layout section type: ${section?.type ?? 'missing'}`);
      return;
    }

    this.refreshInputs();

    try {
      const component = await entry.load();
      if (token === this._loadToken) {
        this.componentType.set(component);
      }
    } catch {
      if (token === this._loadToken) {
        this.loadError.set(`Unable to load layout section type: ${section?.type}`);
      }
    }
  }

  private refreshInputs(): void {
    if (!this._entry || !this._section) return;
    this.componentInputs.set(this._entry.inputs(this._section, this._context));
  }
}
