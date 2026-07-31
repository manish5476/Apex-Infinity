import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-floating-split-layout',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <style>
      .split-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 1440px;
        height: 100%;
        background-color: var(--bg-primary);
        border-radius: 2rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
      }
      .split-left, .split-right {
        width: 100%;
        display: flex;
        flex-direction: column;
      }
      .split-right {
        overflow-y: auto;
      }
      .split-left {
        position: relative;
        background-color: #111827;
        justify-content: space-between;
        overflow: hidden;
      }
      
      /* Mobile hide for image pane */
      @media (max-width: 767px) {
        .split-left { display: none !important; }
      }

      /* Desktop side-by-side layout */
      @media (min-width: 768px) {
        .split-container {
          flex-direction: row;
          border-radius: 2.5rem;
        }
        .split-container.is-reversed {
          flex-direction: row-reverse;
        }
        .split-left {
          width: 45%;
          height: 100%;
        }
        .split-right {
          width: 55%;
          height: 100%;
        }
      }
    </style>
    <div class="h-screen w-full bg-[var(--bg-secondary)] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      
      <div class="split-container" [class.is-reversed]="reverse()">
        
        <!-- LEFT PANE: Image & Branding Showcase -->
        <div class="split-left p-8 lg:p-12">
          
          <img 
            [src]="imageSrc()" 
            [alt]="imageAlt()" 
            class="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-luminosity transition-transform duration-[20s] ease-out hover:scale-110" 
          />
          
          <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none"></div>

          <ng-content select="[brand-overlay]"></ng-content>
        </div>

        <!-- RIGHT PANE: Forms / Wizards -->
        <div class="split-right p-6 sm:p-8 lg:p-12 xl:p-14 justify-center items-center">
          <div class="w-full max-w-md xl:max-w-lg mx-auto flex flex-col justify-center">
            <ng-content></ng-content>
          </div>
        </div>
        
      </div>
    </div>
  `
})
export class FloatingSplitLayoutComponent {
  imageSrc = input.required<string>();
  imageAlt = input<string>('Background showcase');
  reverse = input<boolean>(false);
}