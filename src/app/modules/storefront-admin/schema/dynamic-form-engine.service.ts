import { Injectable, inject } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { SchemaToFormMapper } from './schema-to-form.mapper';
import { DynamicFieldDefinition, DynamicFormTabs, SectionFieldSchema } from './section-schema.types';

@Injectable({ providedIn: 'root' })
export class DynamicFormEngineService {
  private readonly mapper = inject(SchemaToFormMapper);

  build(schema: Record<string, SectionFieldSchema>, config: Record<string, unknown>): {
    form: FormGroup;
    fields: DynamicFieldDefinition[];
    tabs: DynamicFormTabs;
    booleans: DynamicFieldDefinition[];
  } {
    const fields = this.mapper.toFields(schema);
    const classified = this.mapper.classify(fields);

    return {
      form: this.mapper.buildForm(schema, config),
      fields,
      tabs: {
        content: classified.content,
        settings: classified.settings,
        style: classified.style
      },
      booleans: classified.booleans
    };
  }

  createArrayItem(field: DynamicFieldDefinition) {
    return this.mapper.createArrayItem(field);
  }

  childFields(field: DynamicFieldDefinition): DynamicFieldDefinition[] {
    return this.mapper.childFields(field);
  }

  cleanValue(value: Record<string, unknown>): Record<string, unknown> {
    return this.mapper.cleanValue(value);
  }

  formArray(form: FormGroup, key: string): FormArray {
    return form.get(key) as FormArray;
  }
}
