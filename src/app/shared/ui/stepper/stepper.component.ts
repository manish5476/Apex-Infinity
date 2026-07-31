// src/app/shared/ui/stepper/stepper.component.ts
import { Component, ChangeDetectionStrategy, input, model, output, contentChildren, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { StepComponent } from './step.component';

export type StepperOrientation = 'horizontal' | 'vertical';

/**
 * Component: app-stepper
 * Purpose: Enterprise wizard container managing step navigation headers, validation guards, and action footers.
 */
@Component({
    selector: 'app-stepper',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'block w-full bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-[var(--ui-border-radius-lg)] overflow-hidden'
    },
    template: `
    <div [class]="orientation() === 'vertical' ? 'flex flex-col md:flex-row' : 'flex flex-col'">
      
      <!-- Stepper Navigation Header -->
      <div [class]="headerContainerClasses()">
        <div [class]="headerListClasses()">
          @for (step of steps(); track $index; let last = $last) {
            <div class="flex items-center gap-[var(--spacing-md)] flex-1">
              
              <!-- Step Click Target -->
              <button
                type="button"
                class="flex items-center gap-[var(--spacing-md)] text-left focus:outline-none transition-all group disabled:cursor-not-allowed"
                [disabled]="isStepDisabled($index)"
                (click)="goToStep($index)">
                
                <!-- Indicator Circle -->
                <div [class]="stepCircleClasses($index)">
                  @if ($index < activeIndex()) {
                    <i class="pi pi-check text-xs font-bold"></i>
                  } @else if (step.icon()) {
                    <i [class]="step.icon() + ' text-xs'"></i>
                  } @else {
                    <span class="text-[length:var(--font-size-xs)] font-[var(--font-weight-semibold)]">
                      {{ $index + 1 }}
                    </span>
                  }
                </div>

                <!-- Label & Subtitle -->
                <div class="flex flex-col">
                  <span [class]="stepTitleClasses($index)">
                    {{ step.title() }}
                  </span>
                  @if (step.subtitle()) {
                    <span class="text-[length:var(--font-size-xs)] text-[var(--text-secondary)] hidden sm:inline">
                      {{ step.subtitle() }}
                    </span>
                  }
                </div>
              </button>

              <!-- Connector Line -->
              @if (!last) {
                <div [class]="connectorClasses($index)"></div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Active Step Body Content Area -->
      <div class="flex-1 p-[var(--spacing-2xl)]">
        <ng-content></ng-content>

        <!-- Wizard Action Footer Bar -->
        @if (showFooter()) {
          <div class="flex items-center justify-between mt-[var(--spacing-2xl)] pt-[var(--spacing-xl)] border-t border-[var(--border-primary)]">
            
            <div class="flex items-center gap-[var(--spacing-sm)]">
              <p-button
                [label]="prevLabel()"
                icon="pi pi-arrow-left"
                severity="secondary"
                [outlined]="true"
                size="small"
                [disabled]="activeIndex() === 0 || loading()"
                (onClick)="prev()">
              </p-button>

              <ng-content select="[footer-extra]"></ng-content>
            </div>

            <div class="flex items-center gap-[var(--spacing-sm)]">
              @if (isLastStep()) {
                <p-button
                  [label]="completeLabel()"
                  icon="pi pi-check-circle"
                  severity="success"
                  size="small"
                  [loading]="loading()"
                  [disabled]="!isCurrentStepValid()"
                  (onClick)="finish()">
                </p-button>
              } @else {
                <p-button
                  [label]="nextLabel()"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  severity="primary"
                  size="small"
                  [loading]="loading()"
                  [disabled]="!isCurrentStepValid()"
                  (onClick)="next()">
                </p-button>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class StepperComponent {
    steps = contentChildren(StepComponent);

    activeIndex = model<number>(0);

    constructor() {
        effect(() => {
            const index = this.activeIndex();
            this.steps().forEach((step, i) => {
                step.active.set(i === index);
            });
        }, { allowSignalWrites: true });
    }
    linear = input<boolean>(true);
    orientation = input<StepperOrientation>('horizontal');
    loading = input<boolean>(false);
    nextLabel = input<string>('Continue');
    prevLabel = input<string>('Back');
    completeLabel = input<string>('Complete');
    showFooter = input<boolean>(true);

    stepChange = output<{ current: number; next: number }>();
    complete = output<void>();

    protected isLastStep = computed(() => this.activeIndex() === this.steps().length - 1);

    protected isCurrentStepValid = computed(() => {
        const currentStep = this.steps()[this.activeIndex()];
        return currentStep ? currentStep.valid() : true;
    });

    protected isStepDisabled(index: number): boolean {
        if (this.loading()) return true;
        if (index === this.activeIndex()) return false;

        if (this.linear()) {
            // In linear mode, can only jump to previously completed steps or next immediate step if current is valid
            if (index < this.activeIndex()) return false;
            if (index === this.activeIndex() + 1) return !this.isCurrentStepValid();
            return true;
        }
        return false;
    }

    protected goToStep(nextIndex: number): void {
        if (nextIndex === this.activeIndex() || this.isStepDisabled(nextIndex)) return;

        const currentIndex = this.activeIndex();
        this.activeIndex.set(nextIndex);
        this.stepChange.emit({ current: currentIndex, next: nextIndex });
    }

    protected next(): void {
        if (!this.isCurrentStepValid() || this.isLastStep()) return;
        this.goToStep(this.activeIndex() + 1);
    }

    protected prev(): void {
        if (this.activeIndex() === 0) return;
        this.goToStep(this.activeIndex() - 1);
    }

    protected finish(): void {
        if (!this.isCurrentStepValid()) return;
        this.complete.emit();
    }

    protected headerContainerClasses(): string {
        const base = 'border-b md:border-b-0 border-[var(--border-secondary)] bg-[var(--bg-secondary)] p-[var(--spacing-xl)]';
        if (this.orientation() === 'vertical') {
            return `${base} md:border-r md:w-80 shrink-0`;
        }
        return base;
    }

    protected headerListClasses(): string {
        if (this.orientation() === 'vertical') {
            return 'flex flex-col gap-[var(--spacing-xl)]';
        }
        return 'flex flex-col sm:flex-row items-center justify-between gap-[var(--spacing-lg)] overflow-x-auto';
    }

    protected stepCircleClasses(index: number): string {
        const active = index === this.activeIndex();
        const completed = index < this.activeIndex();
        const base = 'h-8 w-8 rounded-full flex items-center justify-center shrink-0 border transition-all';

        if (completed) {
            return `${base} bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]`;
        }
        if (active) {
            return `${base} bg-[var(--bg-primary)] text-[var(--accent-primary)] border-[var(--accent-primary)] ring-4 ring-[var(--accent-focus)]`;
        }
        return `${base} bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-primary)]`;
    }

    protected stepTitleClasses(index: number): string {
        const active = index === this.activeIndex();
        const completed = index < this.activeIndex();
        const base = 'text-[length:var(--font-size-sm)] font-[var(--font-weight-medium)] leading-tight';

        if (completed || active) {
            return `${base} text-[var(--text-primary)] font-[var(--font-weight-semibold)]`;
        }
        return `${base} text-[var(--text-secondary)]`;
    }

    protected connectorClasses(index: number): string {
        const completed = index < this.activeIndex();
        const base = 'hidden sm:block flex-1 h-[2px] rounded transition-colors mx-[var(--spacing-xs)]';

        if (this.orientation() === 'vertical') {
            return 'hidden'; // Vertical connector lines omitted in favor of simple spacing
        }

        return completed ? `${base} bg-[var(--accent-primary)]` : `${base} bg-[var(--border-secondary)]`;
    }
}