import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-asymmetric-canvas',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="asymmetric-canvas-section w-full relative overflow-hidden flex items-center justify-center"
             [ngStyle]="{
               'background-color': config.design?.customBackground || 'var(--bg-primary)',
               'min-height': config.canvasHeight === 'xl' ? '120vh' : config.canvasHeight === 'lg' ? '100vh' : '80vh'
             }">
      
      <div class="canvas-container w-full max-w-[1400px] h-full absolute inset-0 mx-auto">
        
        @for (layer of config.layers; track layer) {
          
          @if (layer.elementType === 'media_frame') {
            <div class="canvas-layer absolute w-[70vw] md:w-[45vw] lg:w-[35vw] shadow-2xl rounded-xl overflow-hidden transition-transform duration-700 hover:scale-[1.02]"
                 [ngStyle]="getAlignmentStyle(layer)">
              <img [src]="layer.image" class="w-full h-auto object-cover" alt="Canvas Layer" />
            </div>
          }

          @if (layer.elementType === 'text_card') {
            <div class="canvas-layer absolute w-[85vw] md:w-[50vw] lg:w-[40vw] bg-white/90 backdrop-blur-md p-8 md:p-12 shadow-xl border border-white/50 rounded-2xl"
                 [ngStyle]="getAlignmentStyle(layer)">
              
              <h2 class="text-4xl md:text-6xl font-black mb-6 leading-none text-primary-900"
                  [ngStyle]="{'font-family': config.typography?.headingFont || 'var(--font-heading)'}">
                {{ layer.title }}
              </h2>
              
              <p class="text-lg md:text-xl text-surface-700 leading-relaxed"
                 [ngStyle]="{'font-family': config.typography?.bodyFont || 'var(--font-body)'}">
                {{ layer.body }}
              </p>
            </div>
          }
        }

      </div>
    </section>
  `,
  styles: [`
    .asymmetric-canvas-section {
      position: relative;
      width: 100%;
    }
    .canvas-layer {
      transition: top 0.4s ease, left 0.4s ease, right 0.4s ease, bottom 0.4s ease, transform 0.4s ease;
    }
  `]
})
export class AsymmetricCanvasComponent {
  @Input() config: any = {};

  getAlignmentStyle(layer: any) {
    const style: any = {
      'z-index': layer.layerDepth || 1
    };

    if (layer.horizontalAlignment === 'left') {
      style['left'] = '5%';
    } else if (layer.horizontalAlignment === 'right') {
      style['right'] = '5%';
    } else {
      style['left'] = '50%';
      style['transform'] = 'translateX(-50%)'; 
    }

    if (layer.verticalAlignment === 'top') {
      style['top'] = '10%';
    } else if (layer.verticalAlignment === 'bottom') {
      style['bottom'] = '10%';
    } else {
      style['top'] = '50%';
      style['transform'] = (style['transform'] || '') + ' translateY(-50%)';
    }

    return style;
  }
}
