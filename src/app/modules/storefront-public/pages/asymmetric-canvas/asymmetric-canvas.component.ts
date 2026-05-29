import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { headingStyle, bodyStyle, sectionPaddingStyles } from '../../dynamic-page/section-config.utils';

const BORDER_RADIUS_MAP: Record<string, string> = {
  none: '0px',
  sm:   '0.375rem',
  md:   '0.75rem',
  lg:   '1.25rem',
  xl:   '1.75rem',
  '2xl':'2.5rem',
  full: '9999px',
};

// Canvas height: the canvas div gets this as an explicit CSS height.
// Layers use top/left percentages which need a height reference.
const CANVAS_HEIGHT_MAP: Record<string, string> = {
  sm:   '60vh',
  md:   '80vh',
  lg:   '100vh',
  xl:   '130vh',
  auto: 'auto',
};

@Component({
  selector: 'app-asymmetric-canvas',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="ac-section" [ngStyle]="getSectionStyle()">

      <!--
        Canvas wrapper: has an explicit height so that absolutely positioned
        layers can use top/left percentages and aspect-ratios correctly.
        On mobile we switch to a stacked column flow instead.
      -->
      <div class="ac-canvas" [ngStyle]="getCanvasStyle()">

        @for (layer of config.layers; track $index; let i = $index) {

          <!-- ═══ MEDIA FRAME ═══════════════════════════════════════════ -->
          @if (layer.elementType === 'media_frame') {
            <div class="ac-layer ac-layer--media"
                 [attr.data-index]="i"
                 [ngStyle]="getLayerStyle(layer, i)">

              <!--
                The image pipeline (same architecture as stacked cards):
                  1. ac-media-clip    — position absolute inset-0, overflow hidden → clean clipping
                  2. ac-media-xform   — position absolute inset: -25% → oversized canvas, transform applied here
                  3. img              — position absolute inset-0, fills xform canvas
              -->
              <div class="ac-media-clip"
                   [ngStyle]="{'background-color': layer.imageBgColor || 'transparent'}">

                <div class="ac-media-xform" [ngStyle]="getImageXformStyle(layer)">
                  <img class="ac-media-img"
                       [src]="layer.image"
                       [alt]="layer.title || ''"
                       [ngStyle]="{'object-fit': layer.imageFit || 'cover'}"
                       loading="lazy" />
                </div>

                <!-- Colour overlay above image -->
                @if ((layer.overlayOpacity ?? 0) > 0) {
                  <div class="ac-overlay" [ngStyle]="getOverlayStyle(layer)"></div>
                }

                <!-- Caption area at bottom of image -->
                @if (layer.title || layer.body) {
                  <div class="ac-caption" [ngStyle]="getCaptionContainerStyle(layer)">
                    @if (layer.title) {
                      <h3 class="ac-caption-h" [ngStyle]="getHeadingStyle()">{{ layer.title }}</h3>
                    }
                    @if (layer.body) {
                      <p class="ac-caption-p" [ngStyle]="getBodyStyle()">{{ layer.body }}</p>
                    }
                  </div>
                }

              </div>
            </div>
          }

          <!-- ═══ TEXT CARD ═══════════════════════════════════════════ -->
          @if (layer.elementType === 'text_card') {
            <div class="ac-layer ac-layer--text"
                 [attr.data-index]="i"
                 [ngStyle]="getLayerStyle(layer, i)">

              <div class="ac-text-card" [ngStyle]="getTextCardStyle(layer)">
                @if (layer.title) {
                  <h3 class="ac-text-h" [ngStyle]="getHeadingStyle()">{{ layer.title }}</h3>
                }
                @if (layer.body) {
                  <p class="ac-text-p" [ngStyle]="getBodyStyle()">{{ layer.body }}</p>
                }
              </div>

            </div>
          }

        }
      </div>
    </section>
  `,
  styles: [`
    /* ─── Section shell ──────────────────────────────────────────────────── */
    .ac-section {
      position: relative;
      width: 100%;
      overflow: hidden;
    }

    /* ─── Canvas ─────────────────────────────────────────────────────────── */
    .ac-canvas {
      position: relative;
      width: 100%;
      /*
        Explicit height (set via inline style) is CRITICAL.
        Without it, position:absolute children use top/left %
        relative to a 0px tall parent, so everything collapses to y=0.
      */
    }

    /* ─── Every layer is absolute inside the canvas ──────────────────────── */
    .ac-layer {
      position: absolute;
      /*
        Do NOT add overflow:hidden here — the media layer needs its
        inner clip div to handle that. Text layers must not clip.
      */
    }

    /* ─── Media frame outer wrapper ──────────────────────────────────────── */
    .ac-layer--media {
      /* overflow hidden lives on ac-media-clip, not here */
    }

    /*
      ac-media-clip: fills the entire layer box and clips.
      Must be position:absolute inset-0 (NOT position:relative width/height:100%)
      because the layer height is driven by CSS aspect-ratio, and a
      position:relative child with height:100% collapses when parent
      height comes from aspect-ratio on a position:absolute element.
    */
    .ac-media-clip {
      position: absolute;
      inset: 0;
      overflow: hidden;
      border-radius: inherit; /* inherits from layer */
    }

    /*
      ac-media-xform: the rotation+scale canvas.
      Sized to 150% × 150% of the clip box (inset: -25% each side)
      so that rotation/scale transforms never clip at the edges.
      Transform is applied here via inline style.
    */
    .ac-media-xform {
      position: absolute;
      inset: -25%;
      will-change: transform;
      transform-origin: center center;
      transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    }

    /* img fills the oversized xform canvas */
    .ac-media-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      object-position: center center;
    }

    /* Colour overlay — sits ABOVE image, BELOW caption */
    .ac-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 2;
    }

    /* Caption gradient bar at bottom */
    .ac-caption {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 3;
      padding: 2rem 2rem 1.5rem;
    }

    .ac-caption-h { margin: 0 0 0.4rem; }
    .ac-caption-p { margin: 0; opacity: 0.9; }

    /* ─── Text card ──────────────────────────────────────────────────────── */
    .ac-layer--text {
      display: flex;
      align-items: stretch;
    }

    .ac-text-card {
      width: 100%;
      padding: 2.5rem 3rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.75rem;
    }

    .ac-text-h { margin: 0; line-height: 1.18; }
    .ac-text-p { margin: 0; line-height: 1.75; opacity: 0.88; }

    /* ─── Hover: subtle zoom on image, no transform override glitch ─────── */
    .ac-layer--media:hover .ac-media-xform {
      /*
        We can't just set transform here because it would override the
        inline rotation+scale. Instead we use scale() inside a CSS var trick.
        Since we can't read the inline value from CSS, we use a wrapper approach:
        the hover zoom is handled in JS via getImageXformStyle() which adds
        a tiny hover class toggled via :hover on the layer. But pure CSS
        hover zoom needs a separate element — so we zoom the clip instead.
      */
      filter: brightness(1.04);
    }

    /* ─── Mobile: vertical stack, no absolute positioning ───────────────── */
    @media (max-width: 767px) {
      .ac-canvas {
        display: flex !important;
        flex-direction: column !important;
        height: auto !important;
        min-height: unset !important;
        gap: 1rem;
        padding: 0 !important;
      }

      .ac-layer {
        position: relative !important;
        inset: auto !important;
        width: 100% !important;
        transform: none !important;
        border-radius: 0.75rem;
        overflow: hidden;
      }

      .ac-layer--media {
        aspect-ratio: 4 / 3;
      }

      /* On mobile, reset image transforms so they don't cause weirdness */
      .ac-media-xform {
        transform: none !important;
      }
    }
  `]
})
export class AsymmetricCanvasComponent {
  @Input() config: any = {};

  getSectionStyle() {
    return {
      'background-color': this.config.design?.customBackground || 'var(--bg-primary)',
      ...sectionPaddingStyles(this.config),
    };
  }

  getCanvasStyle() {
    const key = this.config.canvasHeight ?? 'md';
    const h = CANVAS_HEIGHT_MAP[key] ?? CANVAS_HEIGHT_MAP['md'];
    // We set height (not min-height) so that top/left % on children resolves correctly.
    // When auto, we let mobile stacking drive height instead.
    return {
      'height': h !== 'auto' ? h : undefined,
      'min-height': h === 'auto' ? '60vh' : undefined,
    };
  }

  /**
   * Builds the complete inline style for a layer.
   *
   * Key decisions:
   * - width comes from widthPercent (% of canvas)
   * - height comes from CSS aspect-ratio (browser resolves from width)
   * - position uses top/left/right/bottom with translate for centering
   * - offsetX/Y are clamped to prevent going wildly out of bounds
   */
  getLayerStyle(layer: any, index: number): Record<string, string | number> {
    const widthPct  = Math.max(5, Math.min(layer.widthPercent ?? 40, 100));
    const offsetX   = layer.offsetX ?? 0;
    const offsetY   = layer.offsetY ?? 0;
    const depth     = layer.layerDepth ?? (index + 1);
    const radius    = BORDER_RADIUS_MAP[layer.borderRadius ?? 'lg'] ?? '1.25rem';
    const ar        = layer.aspectRatio && layer.aspectRatio !== 'auto'
                        ? layer.aspectRatio
                        : null;

    const style: Record<string, string | number> = {
      'width':         `${widthPct}%`,
      'z-index':       depth,
      'border-radius': radius,
    };

    if (ar) {
      style['aspect-ratio'] = ar;
    } else {
      style['min-height'] = '240px';
    }

    const hAlign = layer.horizontalAlignment ?? 'left';
    const vAlign = layer.verticalAlignment   ?? 'center';

    // ── Horizontal positioning ────────────────────────────────────────
    // We use the edge (left/right) and add the offsetX nudge.
    // For center: left:50% and we add translateX(-50%) in the transform.
    if (hAlign === 'left') {
      // Start from 0, let offsetX push it inward (positive) or further left (negative)
      // We don't add a 5% margin here — use offsetX for that control.
      style['left'] = offsetX >= 0
        ? `${offsetX}%`
        : `calc(${offsetX}%)`;
    } else if (hAlign === 'right') {
      style['right'] = offsetX >= 0
        ? `${offsetX}%`
        : `calc(${Math.abs(offsetX)}%)`;
    } else {
      // center
      style['left'] = offsetX !== 0
        ? `calc(50% + ${offsetX}%)`
        : '50%';
    }

    // ── Vertical positioning ──────────────────────────────────────────
    if (vAlign === 'top') {
      style['top'] = offsetY >= 0
        ? `${offsetY}%`
        : `calc(${offsetY}%)`;
    } else if (vAlign === 'bottom') {
      style['bottom'] = offsetY >= 0
        ? `${offsetY}%`
        : `calc(${Math.abs(offsetY)}%)`;
    } else {
      // center
      style['top'] = offsetY !== 0
        ? `calc(50% + ${offsetY}%)`
        : '50%';
    }

    // ── CSS translate: center alignment needs -50% on each centred axis ──
    const tx = hAlign === 'center' ? '-50%' : '0%';
    const ty = vAlign === 'center' ? '-50%' : '0%';
    if (tx !== '0%' || ty !== '0%') {
      style['transform'] = `translate(${tx}, ${ty})`;
    }

    return style;
  }

  /**
   * The rotation + scale transform for the oversized image canvas.
   * Because ac-media-xform is already 150% of the clip box (inset: -25%),
   * applying scale(0.75) still fills at 150% × 0.75 = 112.5% — no gaps.
   * Rotation at any angle is similarly safe — the oversized canvas absorbs it.
   */
  getImageXformStyle(layer: any): Record<string, string> {
    const rotation = layer.imageRotation ?? 0;
    const scale    = layer.imageScale    ?? 1;
    return {
      'transform': `rotate(${rotation}deg) scale(${scale})`,
    };
  }

  getOverlayStyle(layer: any): Record<string, string | number> {
    const color   = layer.overlayColor   || '#000000';
    const opacity = Math.max(0, Math.min((layer.overlayOpacity ?? 0) / 100, 1));
    return {
      'background-color': color,
      'opacity':          opacity,
    };
  }

  getCaptionContainerStyle(layer: any): Record<string, string> {
    const textColor = layer.textColor || '#ffffff';
    return {
      'color':      textColor,
      'background': 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 60%, transparent 100%)',
    };
  }

  getTextCardStyle(layer: any): Record<string, string> {
    const glass  = layer.glassEffect ?? false;
    const bg     = layer.bgColor
                    ? layer.bgColor
                    : glass
                      ? 'rgba(255,255,255,0.1)'
                      : 'var(--bg-secondary, #fff)';
    const tc     = layer.textColor   || 'var(--text-primary)';
    const radius = BORDER_RADIUS_MAP[layer.borderRadius ?? 'lg'] ?? '1.25rem';

    const base: Record<string, string> = {
      'background':    bg,
      'color':         tc,
      'border-radius': radius,
    };

    if (glass) {
      return {
        ...base,
        'backdrop-filter':         'blur(20px) saturate(180%)',
        '-webkit-backdrop-filter': 'blur(20px) saturate(180%)',
        'border':                  '1px solid rgba(255,255,255,0.25)',
        'box-shadow':              '0 8px 32px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.15)',
      };
    }

    return {
      ...base,
      'border':     '1px solid var(--border-primary, rgba(0,0,0,0.08))',
      'box-shadow': '0 16px 48px -12px rgba(0,0,0,0.18), 0 4px 16px -4px rgba(0,0,0,0.1)',
    };
  }

  getHeadingStyle() {
    return headingStyle(this.config, {});
  }

  getBodyStyle() {
    return bodyStyle(this.config, {});
  }
}
