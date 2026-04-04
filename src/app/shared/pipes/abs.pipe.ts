import { Pipe, PipeTransform } from '@angular/core';

// ─────────────────────────────────────────────────────────────
// abs.pipe.ts  →  src/app/shared/pipes/abs.pipe.ts
// ─────────────────────────────────────────────────────────────
// Standalone pipe used in the invoice form template:
//   {{ balanceAmount() | abs | currency:'INR' }}
//

@Pipe({ name: 'abs', standalone: true })
export class AbsPipe implements PipeTransform {
  transform(value: number): number {
    return Math.abs(value ?? 0);
  }
}
