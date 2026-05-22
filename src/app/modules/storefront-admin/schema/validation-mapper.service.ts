import { Injectable } from '@angular/core';
import { ValidatorFn, Validators } from '@angular/forms';
import { SectionFieldSchema } from './section-schema.types';

@Injectable({ providedIn: 'root' })
export class ValidationMapperService {
  validatorsFor(definition: SectionFieldSchema | undefined): ValidatorFn[] {
    if (!definition) return [];

    const validators: ValidatorFn[] = [];
    if (definition.required) validators.push(Validators.required);
    if (definition.min !== undefined) validators.push(Validators.min(definition.min));
    if (definition.max !== undefined) validators.push(Validators.max(definition.max));
    if (definition.maxLength !== undefined) validators.push(Validators.maxLength(definition.maxLength));
    if (definition.maxItems !== undefined) {
      validators.push(control => {
        const value = control.value;
        return Array.isArray(value) && value.length > definition.maxItems!
          ? { maxItems: { max: definition.maxItems, actual: value.length } }
          : null;
      });
    }

    return validators;
  }
}
