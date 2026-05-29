import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-text-video-mask',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="video-mask-section flex items-center justify-center overflow-hidden min-h-[60vh] relative"
             [ngStyle]="{'background-color': config.canvasBgColor || '#000000'}">
      
      <video [src]="config.videoUrl" 
             autoplay muted loop playsinline
             class="absolute inset-0 w-full h-full object-cover opacity-90">
      </video>

      <div class="mask-container absolute inset-0 bg-black flex items-center justify-center">
        <h2 class="mask-text text-center px-4"
            [ngStyle]="{
              'font-family': config.maskFont || 'var(--font-heading)',
              'font-size': config.textSize === 'display-lg' ? '18vw' : config.textSize === 'display-sm' ? '10vw' : '14vw'
            }">
          {{ config.maskText }}
        </h2>
      </div>
    </section>
  `,
  styles: [`
    .video-mask-section {
      width: 100%;
    }
    .mask-container {
      background-color: inherit; 
      mix-blend-mode: multiply; 
    }
    .mask-text {
      color: #ffffff; 
      font-weight: 900;
      line-height: 0.85;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      margin: 0;
      -webkit-text-stroke: 1px rgba(255, 255, 255, 0.2); 
    }
  `]
})
export class TextVideoMaskComponent {
  @Input() config: any = {};
}
