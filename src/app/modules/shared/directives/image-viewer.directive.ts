import { Directive, HostListener, Input, Renderer2, Inject, DOCUMENT } from '@angular/core';

@Directive({
  selector: '[appImageViewer]',
  standalone: true
})

export class ImageViewerDirective {
  @Input('appImageViewer') imageSrc: string | undefined;

  private overlay: HTMLElement | null = null;
  private unlistenEsc: (() => void) | null = null;
  private lastFocusedElement: HTMLElement | null = null;

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  @HostListener('click')
  onClick() {
    if (!this.imageSrc || this.overlay) return;
    this.lastFocusedElement = this.document.activeElement as HTMLElement; // Save focus
    this.openViewer(this.imageSrc);
  }

  private openViewer(url: string) {
    // 1. Lock Body Scroll
    this.renderer.setStyle(this.document.body, 'overflow', 'hidden');

    // 2. Create Overlay Container
    this.overlay = this.renderer.createElement('div');
    this.applyStyles(this.overlay!, {
      position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
      zIndex: '10000', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(5px)',
      opacity: '0', transition: 'opacity 0.2s ease-out', cursor: 'zoom-out'
    });
    
    // A11y attributes
    this.renderer.setAttribute(this.overlay, 'role', 'dialog');
    this.renderer.setAttribute(this.overlay, 'aria-modal', 'true');
    this.renderer.setAttribute(this.overlay, 'aria-label', 'Image Viewer');

    // 3. Create Loader (Spinner)
    const spinner = this.renderer.createElement('div');
    this.applyStyles(spinner, {
      width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff', borderRadius: '50%', position: 'absolute'
    });
    // Use Web Animations API for spin (no external CSS needed)
    spinner.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
      duration: 1000, iterations: Infinity
    });

    // 4. Create Image
    const img = this.renderer.createElement('img');
    img.style.opacity = '0'; // Hide until loaded
    
    this.applyStyles(img, {
      maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain',
      transform: 'scale(0.95)', transition: 'transform 0.2s ease-out, opacity 0.3s',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: '4px'
    });

    // Prevent clicking image from closing
    this.renderer.listen(img, 'click', (e) => e.stopPropagation());

    // --- Image Events ---
    // On Load: Hide spinner, show image
    img.onload = () => {
      if (!this.overlay) return;
      this.renderer.removeChild(this.overlay, spinner);
      img.style.opacity = '1';
      img.style.transform = 'scale(1)';
    };

    // On Error: Show text instead
    img.onerror = () => {
      if (!this.overlay) return;
      this.renderer.removeChild(this.overlay, spinner);
      const errorMsg = this.renderer.createElement('div');
      errorMsg.innerText = '⚠️ Image failed to load';
      this.applyStyles(errorMsg, { color: '#ef4444', fontSize: '1.2rem', fontFamily: 'sans-serif' });
      this.renderer.appendChild(this.overlay, errorMsg);
      this.renderer.removeChild(this.overlay, img);
    };

    img.src = url;

    // 5. Create Controls Container (Top Right)
    const controls = this.renderer.createElement('div');
    this.applyStyles(controls, {
      position: 'absolute', top: '20px', right: '30px', display: 'flex', gap: '20px', zIndex: '10001'
    });

    // Download Button
    const downloadBtn = this.createButton('pi pi-download', 'Download'); // Assuming PrimeIcons, or use text
    downloadBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    this.renderer.listen(downloadBtn, 'click', (e) => {
      e.stopPropagation();
      this.downloadImage(url);
    });

    // Close Button
    const closeBtn = this.createButton('&times;', 'Close');
    this.applyStyles(closeBtn, { fontSize: '32px', lineHeight: '24px' });
    this.renderer.listen(closeBtn, 'click', (e) => {
      e.stopPropagation();
      this.closeViewer(img);
    });

    // 6. Append Elements
    this.renderer.appendChild(this.overlay, spinner);
    this.renderer.appendChild(this.overlay, img);
    this.renderer.appendChild(controls, downloadBtn);
    this.renderer.appendChild(controls, closeBtn);
    this.renderer.appendChild(this.overlay, controls);
    this.renderer.appendChild(this.document.body, this.overlay);

    // Focus Close button for Accessibility
    closeBtn.focus();

    // 7. Listeners
    this.renderer.listen(this.overlay, 'click', () => this.closeViewer(img));
    this.unlistenEsc = this.renderer.listen(this.document, 'keydown.escape', () => this.closeViewer(img));

    // 8. Animate In
    requestAnimationFrame(() => {
      if (this.overlay) this.overlay!.style.opacity = '1';
    });
  }

  private closeViewer(imgElement: HTMLElement) {
    if (!this.overlay) return;

    this.renderer.setStyle(this.document.body, 'overflow', '');
    this.renderer.setStyle(this.overlay, 'pointer-events', 'none');
    this.renderer.setStyle(this.overlay, 'opacity', '0');
    
    // Scale down image if it exists (might not exist if error occurred)
    if (imgElement && imgElement.style) {
        this.renderer.setStyle(imgElement, 'transform', 'scale(0.9)');
    }

    if (this.unlistenEsc) {
      this.unlistenEsc();
      this.unlistenEsc = null;
    }

    // Return focus to the element that opened the viewer
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
    }

    setTimeout(() => {
      if (this.overlay) {
        this.renderer.removeChild(this.document.body, this.overlay);
        this.overlay = null;
      }
    }, 200);
  }

  // --- Helpers ---

  private createButton(content: string, ariaLabel: string): HTMLElement {
    const btn = this.renderer.createElement('button');
    btn.innerHTML = content;
    this.applyStyles(btn, {
      background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer',
      padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform 0.2s', opacity: '0.8'
    });
    this.renderer.setAttribute(btn, 'aria-label', ariaLabel);
    
    // Hover effects via JS listeners since we are inline
    btn.onmouseover = () => { btn.style.transform = 'scale(1.1)'; btn.style.opacity = '1'; };
    btn.onmouseout = () => { btn.style.transform = 'scale(1)'; btn.style.opacity = '0.8'; };
    
    return btn;
  }

  private downloadImage(url: string) {
    const a = this.document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop() || 'image';
    this.document.body.appendChild(a);
    a.click();
    this.document.body.removeChild(a);
  }

  private applyStyles(element: HTMLElement, styles: Record<string, string>) {
    Object.keys(styles).forEach(key => {
      this.renderer.setStyle(element, key, styles[key]);
    });
  }
}