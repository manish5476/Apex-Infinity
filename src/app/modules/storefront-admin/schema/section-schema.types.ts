import { AbstractControl, ValidatorFn } from '@angular/forms';

export type SectionFieldType =
  | 'string'
  | 'textarea'
  | 'richtext'
  | 'boolean'
  | 'number'
  | 'color'
  | 'font'
  | 'image'
  | 'array'
  | 'object'
  | 'datetime'
  | 'date'
  | 'enum'
  | 'reference'
  | 'reference-multi'
  | 'icon';

export interface SectionFieldSchema {
  type?: SectionFieldType | string;
  label?: string;
  required?: boolean;
  default?: unknown;
  enum?: unknown[];
  min?: number;
  max?: number;
  maxLength?: number;
  maxItems?: number;
  ref?: string;
  description?: string;
  itemSchema?: Record<string, SectionFieldSchema> | string;
  schema?: Record<string, SectionFieldSchema>;
}

export interface DynamicFieldDefinition extends SectionFieldSchema {
  key: string;
  type: SectionFieldType | string;
  label: string;
  validators?: ValidatorFn[];
}

export interface DynamicFormBuildResult {
  form: AbstractControl;
  fields: DynamicFieldDefinition[];
}

export interface DynamicFormTabs {
  content: DynamicFieldDefinition[];
  settings: DynamicFieldDefinition[];
  style: DynamicFieldDefinition[];
}
