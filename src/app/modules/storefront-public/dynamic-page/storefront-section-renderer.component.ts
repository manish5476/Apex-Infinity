import { CommonModule } from '@angular/common';
import { Component, Input, Type, signal } from '@angular/core';
import { SECTION_COMPONENT_REGISTRY, SectionRenderEntry } from './section-component.registry';

@Component({
  selector: 'app-storefront-section-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (componentType(); as component) {
      <ng-container *ngComponentOutlet="component; inputs: componentInputs()"></ng-container>
    } @else if (isDev && loadError()) {
      <div class="debug-placeholder">
        <i class="pi pi-code"></i>
        <span>{{ loadError() }}</span>
      </div>
    }
  `
})
export class StorefrontSectionRendererComponent {
  @Input({ required: true }) set section(value: any) {
    this._section = value;
    this.loadSection(value);
  }

  @Input() set orgSlug(value: string) {
    this._orgSlug = value ?? '';
    this.refreshInputs();
  }

  @Input() isDev = false;

  componentType = signal<Type<unknown> | null>(null);
  componentInputs = signal<Record<string, unknown>>({});
  loadError = signal<string | null>(null);

  private _section: any = null;
  private _orgSlug = '';
  private _entry: SectionRenderEntry | null = null;
  private _loadToken = 0;

  private async loadSection(section: any): Promise<void> {
    const token = ++this._loadToken;
    this.componentType.set(null);
    this.loadError.set(null);

    const entry = SECTION_COMPONENT_REGISTRY[section?.type];
    this._entry = entry ?? null;
    if (!entry) {
      this.componentInputs.set({});
      this.loadError.set(`Unknown section type: ${section?.type ?? 'missing'}`);
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
        this.loadError.set(`Unable to load section type: ${section?.type}`);
      }
    }
  }

  private refreshInputs(): void {
    if (!this._entry || !this._section) return;
    this.componentInputs.set(this._entry.inputs(this._section, this._orgSlug));
  }
}
