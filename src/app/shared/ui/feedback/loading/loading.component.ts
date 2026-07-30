import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

export type LoadingType = 'table' | 'card' | 'form' | 'spinner';

/**
 * Component: app-loading
 * Purpose: Consolidated loading component handling skeletons and spinners.
 * Inputs: type (LoadingType)
 * Used By: Global
 */
@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [SkeletonModule, ProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (type()) {
      @case ('table') {
        <div class="flex flex-col gap-2 w-full">
          <p-skeleton height="2.5rem" width="100%"></p-skeleton>
          <p-skeleton height="2.5rem" width="100%"></p-skeleton>
          <p-skeleton height="2.5rem" width="100%"></p-skeleton>
          <p-skeleton height="2.5rem" width="100%"></p-skeleton>
          <p-skeleton height="2.5rem" width="100%"></p-skeleton>
        </div>
      }
      @case ('card') {
        <div class="flex flex-col gap-4 w-full">
          <div class="flex justify-between items-center w-full">
             <p-skeleton width="40%" height="1.5rem"></p-skeleton>
             <p-skeleton shape="circle" size="2rem"></p-skeleton>
          </div>
          <p-skeleton width="100%" height="150px"></p-skeleton>
        </div>
      }
      @case ('form') {
        <div class="flex flex-col gap-4 w-full">
          <p-skeleton width="30%" height="1rem"></p-skeleton>
          <p-skeleton width="100%" height="2.5rem"></p-skeleton>
          <p-skeleton width="25%" height="1rem"></p-skeleton>
          <p-skeleton width="100%" height="2.5rem"></p-skeleton>
        </div>
      }
      @case ('spinner') {
        <div class="flex justify-center items-center p-4">
          <p-progressSpinner styleClass="w-8 h-8" strokeWidth="4" animationDuration=".5s"></p-progressSpinner>
        </div>
      }
    }
  `
})
export class LoadingComponent {
  type = input<LoadingType>('spinner');
}
