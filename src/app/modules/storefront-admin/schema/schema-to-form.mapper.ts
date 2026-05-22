import { Injectable, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import {
  DynamicFieldDefinition,
  DynamicFormTabs,
  SectionFieldSchema
} from './section-schema.types';
import { ValidationMapperService } from './validation-mapper.service';

@Injectable({ providedIn: 'root' })
export class SchemaToFormMapper {
  private readonly fb = inject(FormBuilder);
  private readonly validation = inject(ValidationMapperService);

  buildForm(schema: Record<string, SectionFieldSchema> = {}, data: Record<string, unknown> = {}): FormGroup {
    const controls: Record<string, FormControl | FormArray | FormGroup> = {};

    for (const [key, definition] of Object.entries(schema)) {
      const value = data[key] !== undefined ? data[key] : definition.default ?? null;

      if (definition.type === 'array') {
        const items = Array.isArray(value) ? value : [];
        controls[key] = this.fb.array(items.map(item => this.createNestedControl(definition.itemSchema, item)));
        continue;
      }

      if (definition.type === 'object') {
        controls[key] = this.createNestedGroup(definition.schema ?? this.unwrapSchema(definition.itemSchema), value);
        continue;
      }

      controls[key] = new FormControl(this.coerceInitialValue(definition, value), this.validation.validatorsFor(definition));
    }

    return this.fb.group(controls);
  }

  toFields(schema: Record<string, SectionFieldSchema> = {}): DynamicFieldDefinition[] {
    return Object.entries(schema).map(([key, definition]) => ({
      key,
      ...definition,
      type: definition.type ?? 'string',
      label: definition.label ?? this.formatLabel(key),
      validators: this.validation.validatorsFor(definition)
    }));
  }

  classify(fields: DynamicFieldDefinition[]): DynamicFormTabs & { booleans: DynamicFieldDefinition[] } {
    const tabs: DynamicFormTabs & { booleans: DynamicFieldDefinition[] } = {
      content: [],
      settings: [],
      style: [],
      booleans: []
    };

    for (const field of fields) {
      const key = field.key.toLowerCase();
      const styleKeys = ['color', 'padding', 'margin', 'gap', 'theme', 'align', 'height', 'width', 'opacity', 'background'];
      const settingKeys = ['isactive', 'hideon', 'limit', 'ruletype', 'itemsper', 'columns', 'pagination', 'sticky', 'autoplay', 'show'];

      if (field.type === 'boolean') tabs.booleans.push(field);
      else if (styleKeys.some(token => key.includes(token)) || field.type === 'color') tabs.style.push(field);
      else if (settingKeys.some(token => key.includes(token))) tabs.settings.push(field);
      else tabs.content.push(field);
    }

    return tabs;
  }

  createArrayItem(field: DynamicFieldDefinition): FormControl | FormGroup {
    return this.createNestedControl(field.itemSchema, null);
  }

  childFields(field: DynamicFieldDefinition): DynamicFieldDefinition[] {
    return this.toFields(this.unwrapSchema(field.schema ?? field.itemSchema));
  }

  cleanValue(value: Record<string, unknown>): Record<string, unknown> {
    const clean: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value ?? {})) {
      if (entry !== null && entry !== undefined) clean[key] = entry;
    }
    return clean;
  }

  private createNestedControl(schemaDef: DynamicFieldDefinition['itemSchema'], data: unknown): FormControl | FormGroup {
    const schema = this.unwrapSchema(schemaDef);
    if (!schema || Object.keys(schema).length === 0) return new FormControl(data ?? '');
    return this.createNestedGroup(schema, data);
  }

  private createNestedGroup(schema: Record<string, SectionFieldSchema> = {}, data: unknown): FormGroup {
    const group: Record<string, FormControl> = {};
    const source = typeof data === 'object' && data !== null ? data as Record<string, unknown> : {};

    for (const [key, definition] of Object.entries(schema)) {
      const value = source[key] !== undefined ? source[key] : definition.default ?? null;
      group[key] = new FormControl(this.coerceInitialValue(definition, value), this.validation.validatorsFor(definition));
    }

    return this.fb.group(group);
  }

  private unwrapSchema(schemaDef: DynamicFieldDefinition['itemSchema'] | DynamicFieldDefinition['schema']): Record<string, SectionFieldSchema> {
    if (!schemaDef || typeof schemaDef === 'string') return {};
    return ((schemaDef as { schema?: Record<string, SectionFieldSchema> }).schema ?? schemaDef) as Record<string, SectionFieldSchema>;
  }

  private coerceInitialValue(definition: SectionFieldSchema, value: unknown): unknown {
    if ((definition.type === 'datetime' || definition.type === 'date') && typeof value === 'string' && value) {
      return new Date(value);
    }
    return value;
  }

  private formatLabel(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}
