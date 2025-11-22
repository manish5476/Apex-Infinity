import { Directive, HostListener, Input, Renderer2, Inject, DOCUMENT } from '@angular/core';

@Directive({
  selector: '[appImageViewer]',
  standalone: true
})
export class ImageViewerDirective {
  @Input('appImageViewer') imageSrc: string | undefined;

  private overlay: HTMLElement | null = null;
  private unlistenEsc: (() => void) | null = null;

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  @HostListener('click')
  onClick() {
    if (!this.imageSrc || this.overlay) return;
    this.openViewer(this.imageSrc);
  }

  private openViewer(url: string) {
    // 1. Lock Body Scroll
    this.renderer.setStyle(this.document.body, 'overflow', 'hidden');

    // 2. Create Overlay
    this.overlay = this.renderer.createElement('div');
    const style = this.overlay!.style;
    
    style.position = 'fixed';
    style.top = '0';
    style.left = '0';
    style.width = '100vw';
    style.height = '100vh';
    style.zIndex = '10000';
    style.display = 'flex';
    style.alignItems = 'center';
    style.justifyContent = 'center';
    style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    style.backdropFilter = 'blur(5px)';
    style.opacity = '0';
    // Faster transition (0.2s)
    style.transition = 'opacity 0.2s ease-out'; 
    style.cursor = 'zoom-out';

    // 3. Create Image
    const img = this.renderer.createElement('img');
    img.src = url;
    img.style.maxWidth = '90vw';
    img.style.maxHeight = '90vh';
    img.style.objectFit = 'contain';
    img.style.transform = 'scale(0.95)';
    img.style.transition = 'transform 0.2s ease-out';
    
    // Prevent clicking image from triggering close
    this.renderer.listen(img, 'click', (e) => e.stopPropagation());

    // 4. Close Button (X)
    const closeBtn = this.renderer.createElement('div');
    closeBtn.innerHTML = '&times;';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '20px',
      right: '30px',
      color: '#fff',
      fontSize: '40px',
      fontWeight: '300',
      cursor: 'pointer',
      userSelect: 'none',
      zIndex: '10001'
    });

    // 5. Append
    this.renderer.appendChild(this.overlay, img);
    this.renderer.appendChild(this.overlay, closeBtn);
    this.renderer.appendChild(this.document.body, this.overlay);

    // 6. Listeners
    this.renderer.listen(this.overlay, 'click', () => this.closeViewer(img));
    this.renderer.listen(closeBtn, 'click', (e) => {
      e.stopPropagation();
      this.closeViewer(img);
    });
    this.unlistenEsc = this.renderer.listen(this.document, 'keydown.escape', () => {
      this.closeViewer(img);
    });

    // 7. Animate In
    requestAnimationFrame(() => {
      if (this.overlay) {
        style.opacity = '1';
        img.style.transform = 'scale(1)';
      }
    });
  }

  private closeViewer(imgElement: HTMLElement) {
    if (!this.overlay) return;

    // --- INSTANT RESPONSE FIXES ---

    // 1. Unlock scroll immediately (don't wait for animation)
    this.renderer.setStyle(this.document.body, 'overflow', '');

    // 2. Make overlay "transparent" to clicks immediately
    // This lets you click buttons behind the overlay while it is fading out
    this.renderer.setStyle(this.overlay, 'pointer-events', 'none');

    // 3. Start Fade Out Animation
    this.renderer.setStyle(this.overlay, 'opacity', '0');
    this.renderer.setStyle(imgElement, 'transform', 'scale(0.95)');

    // 4. Remove ESC Listener
    if (this.unlistenEsc) {
      this.unlistenEsc();
      this.unlistenEsc = null;
    }

    // 5. Remove from DOM after 200ms
    setTimeout(() => {
      if (this.overlay) {
        this.renderer.removeChild(this.document.body, this.overlay);
        this.overlay = null;
      }
    }, 200);
  }
}

// import { Directive, HostListener, Input, Renderer2, Inject, DOCUMENT } from '@angular/core';

// @Directive({
//   selector: '[appImageViewer]',
//   standalone: true
// })
// export class ImageViewerDirective {
//   @Input('appImageViewer') imageSrc: string | undefined;

//   private overlay: HTMLElement | null = null;
//   private unlistenEsc: (() => void) | null = null;

//   constructor(
//     private renderer: Renderer2,
//     @Inject(DOCUMENT) private document: Document
//   ) {}

//   @HostListener('click')
//   onClick() {
//     if (!this.imageSrc || this.overlay) return; // Prevent opening multiple
//     this.openViewer(this.imageSrc);
//   }

//   private openViewer(url: string) {
//     // 1. Lock Body Scroll
//     this.renderer.setStyle(this.document.body, 'overflow', 'hidden');

//     // 2. Create Overlay Container
//     this.overlay = this.renderer.createElement('div');
//     const style = this.overlay!.style;
    
//     // Layout & Position
//     style.position = 'fixed';
//     style.top = '0';
//     style.left = '0';
//     style.width = '100vw';
//     style.height = '100vh';
//     style.zIndex = '10000'; // Extremely high z-index
//     style.display = 'flex';
//     style.alignItems = 'center';
//     style.justifyContent = 'center';
    
//     // Visuals
//     style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
//     style.backdropFilter = 'blur(5px)'; // Modern blur effect
//     style.opacity = '0';
//     style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
//     style.cursor = 'zoom-out';

//     // 3. Create Image
//     const img = this.renderer.createElement('img');
//     img.src = url;
//     img.style.maxWidth = '90vw';
//     img.style.maxHeight = '90vh';
//     img.style.objectFit = 'contain';
//     img.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)';
//     img.style.transform = 'scale(0.95)';
//     img.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
//     img.style.borderRadius = '4px';

//     // Prevent clicks on the image from closing the overlay immediately
//     this.renderer.listen(img, 'click', (e) => e.stopPropagation());

//     // 4. Create Close Button (Visual Aid)
//     const closeBtn = this.renderer.createElement('div');
//     closeBtn.innerHTML = '&times;'; // HTML entity for 'X'
//     // Close Button Styles
//     Object.assign(closeBtn.style, {
//       position: 'absolute',
//       top: '20px',
//       right: '30px',
//       color: '#fff',
//       fontSize: '40px',
//       fontWeight: '300',
//       cursor: 'pointer',
//       userSelect: 'none',
//       textShadow: '0 2px 10px rgba(0,0,0,0.5)'
//     });

//     // 5. Assemble DOM
//     this.renderer.appendChild(this.overlay, img);
//     this.renderer.appendChild(this.overlay, closeBtn);
//     this.renderer.appendChild(this.document.body, this.overlay);

//     // 6. Add Event Listeners
    
//     // A. Click Overlay to Close
//     this.renderer.listen(this.overlay, 'click', () => this.closeViewer(img));
    
//     // B. Click X Button to Close
//     this.renderer.listen(closeBtn, 'click', (e) => {
//       e.stopPropagation(); 
//       this.closeViewer(img);
//     });

//     // C. ESC Key to Close
//     this.unlistenEsc = this.renderer.listen(this.document, 'keydown.escape', () => {
//       this.closeViewer(img);
//     });

//     // 7. Trigger Animation
//     requestAnimationFrame(() => {
//       if (this.overlay) {
//         style.opacity = '1';
//         img.style.transform = 'scale(1)';
//       }
//     });
//   }

//   private closeViewer(imgElement: HTMLElement) {
//     if (!this.overlay) return;

//     // 1. Start Closing Animation
//     this.renderer.setStyle(this.overlay, 'opacity', '0');
//     this.renderer.setStyle(imgElement, 'transform', 'scale(0.95)');

//     // 2. Remove ESC Listener immediately
//     if (this.unlistenEsc) {
//       this.unlistenEsc();
//       this.unlistenEsc = null;
//     }

//     // 3. Wait for animation to finish, then remove from DOM
//     setTimeout(() => {
//       if (this.overlay) {
//         this.renderer.removeChild(this.document.body, this.overlay);
//         this.overlay = null;
//         // 4. Restore Body Scroll
//         this.renderer.setStyle(this.document.body, 'overflow', '');
//       }
//     }, 300);
//   }
// }