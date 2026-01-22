import { Component, Input, HostListener, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

// PrimeNG
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ImageModule } from 'primeng/image';
import { RippleModule } from 'primeng/ripple';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-image-cell-renderer',
  standalone: true,
  imports: [
    CommonModule, 
    AvatarModule, FormsModule,
    TooltipModule, 
    DialogModule, 
    ButtonModule, 
    SkeletonModule,
    ImageModule,
    RippleModule,
    SliderModule
  ],
  templateUrl: './image-cell-renderer.component.html',
  styleUrls: ['./image-cell-renderer.component.scss']
})
export class ImageCellRendererComponent implements ICellRendererAngularComp, OnDestroy {
  public params!: ICellRendererParams;
  public imageUrls: string[] = [];
  public currentImageIndex = 0;
  public displayDialog = false;
  public zoomLevel = 1;
  public loading = true;
  public isDragging = false;
  public dragStartX = 0;
  public dragStartY = 0;
  public translateX = 0;
  public translateY = 0;
  
  // Zoom limits
  public minZoom = 0.1;
  public maxZoom = 5;
  
  @ViewChild('imageContainer') imageContainer!: ElementRef;
  @ViewChild('previewImage') previewImage!: ElementRef;

  @Input() zoomStep = 0.2;
  @Input() avatarSize: 'normal' | 'large' | 'xlarge' = 'normal';
  @Input() showGallery = false;
  @Input() enableWheelZoom = true;
  @Input() enablePinchZoom = true;

  constructor(private cdRef: ChangeDetectorRef) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.processImageData(params.value);
  }

  private processImageData(value: any): void {
    if (Array.isArray(value) && value.length > 0) {
      this.imageUrls = value.map(url => this.ensureValidUrl(url));
    } else if (typeof value === 'string' && value.trim()) {
      this.imageUrls = [this.ensureValidUrl(value)];
    } else {
      this.imageUrls = [this.getFallbackImage()];
    }
  }

  private ensureValidUrl(url: string): string {
    if (!url) return this.getFallbackImage();
    
    try {
      new URL(url);
      return url;
    } catch {
      return this.getFallbackImage();
    }
  }

  private getFallbackImage(): string {
    return 'https://images.unsplash.com/photo-1755930523772-79e4443c9e4a?w=600&auto=format&fit=crop&q=80';
  }

  refresh(params: ICellRendererParams): boolean {
    this.processImageData(params.value);
    this.cdRef.detectChanges();
    return true;
  }

  onImageClick(): void {
    if (this.imageUrls.length > 0) {
      this.resetZoom();
      this.resetPosition();
      this.displayDialog = true;
      this.loading = true;
    }
  }

  navigateImage(direction: 'prev' | 'next'): void {
    if (!this.showGallery || this.imageUrls.length <= 1) return;
    
    this.currentImageIndex = direction === 'next' 
      ? (this.currentImageIndex + 1) % this.imageUrls.length
      : (this.currentImageIndex - 1 + this.imageUrls.length) % this.imageUrls.length;
    
    this.resetZoom();
    this.resetPosition();
    this.loading = true;
  }

  zoomIn(): void {
    this.setZoom(this.zoomLevel + this.zoomStep);
  }

  zoomOut(): void {
    this.setZoom(this.zoomLevel - this.zoomStep);
  }

  setZoom(level: number): void {
    const newZoom = Math.max(this.minZoom, Math.min(level, this.maxZoom));
    
    // Calculate new translate to keep mouse position centered
    if (this.imageContainer && this.previewImage) {
      const container = this.imageContainer.nativeElement;
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Adjust translate to zoom around center
      const zoomRatio = newZoom / this.zoomLevel;
      this.translateX = centerX - (centerX - this.translateX) * zoomRatio;
      this.translateY = centerY - (centerY - this.translateY) * zoomRatio;
    }
    
    this.zoomLevel = newZoom;
  }

  resetZoom(): void {
    this.zoomLevel = 1;
    this.resetPosition();
  }

  resetPosition(): void {
    this.translateX = 0;
    this.translateY = 0;
  }

  onImageLoad(): void {
    this.loading = false;
  }

  // Mouse wheel zoom
  onWheel(event: WheelEvent): void {
    if (!this.enableWheelZoom || !this.displayDialog) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const delta = event.deltaY > 0 ? -this.zoomStep : this.zoomStep;
    const rect = this.imageContainer?.nativeElement?.getBoundingClientRect();
    
    if (rect) {
      // Get mouse position relative to image container
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      // Store old zoom and position
      const oldZoom = this.zoomLevel;
      
      // Calculate new zoom
      const newZoom = Math.max(this.minZoom, Math.min(this.zoomLevel + delta, this.maxZoom));
      
      if (oldZoom !== newZoom) {
        // Adjust translate to zoom around mouse position
        const zoomRatio = newZoom / oldZoom;
        this.translateX = mouseX - (mouseX - this.translateX) * zoomRatio;
        this.translateY = mouseY - (mouseY - this.translateY) * zoomRatio;
        
        this.zoomLevel = newZoom;
        this.cdRef.detectChanges();
      }
    }
  }

  // Mouse drag for panning
  onMouseDown(event: MouseEvent): void {
    if (this.zoomLevel <= 1) return;
    
    this.isDragging = true;
    this.dragStartX = event.clientX - this.translateX;
    this.dragStartY = event.clientY - this.translateY;
    
    // Prevent text selection
    event.preventDefault();
    
    // Change cursor
    if (this.imageContainer) {
      this.imageContainer.nativeElement.style.cursor = 'grabbing';
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    
    this.translateX = event.clientX - this.dragStartX;
    this.translateY = event.clientY - this.dragStartY;
    this.cdRef.detectChanges();
  }

  onMouseUp(): void {
    this.isDragging = false;
    
    // Reset cursor
    if (this.imageContainer) {
      this.imageContainer.nativeElement.style.cursor = this.zoomLevel > 1 ? 'grab' : 'default';
    }
  }

  // Double click to zoom in/out
  onDoubleClick(event: MouseEvent): void {
    event.preventDefault();
    
    if (this.zoomLevel > 1) {
      this.resetZoom();
    } else {
      // Zoom to 2x at click position
      const rect = this.imageContainer?.nativeElement?.getBoundingClientRect();
      if (rect) {
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        const oldZoom = this.zoomLevel;
        const newZoom = 2;
        const zoomRatio = newZoom / oldZoom;
        
        this.translateX = mouseX - (mouseX - this.translateX) * zoomRatio;
        this.translateY = mouseY - (mouseY - this.translateY) * zoomRatio;
        this.zoomLevel = newZoom;
      }
    }
  }

  // Touch support with pinch zoom
  private touchDistance = 0;
  private initialZoom = 1;

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1 && this.zoomLevel > 1) {
      // Single touch for panning
      this.isDragging = true;
      this.dragStartX = event.touches[0].clientX - this.translateX;
      this.dragStartY = event.touches[0].clientY - this.translateY;
    } else if (event.touches.length === 2 && this.enablePinchZoom) {
      // Two touches for pinch zoom
      event.preventDefault();
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.touchDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      this.initialZoom = this.zoomLevel;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1 && this.isDragging) {
      // Panning
      this.translateX = event.touches[0].clientX - this.dragStartX;
      this.translateY = event.touches[0].clientY - this.dragStartY;
      this.cdRef.detectChanges();
    } else if (event.touches.length === 2 && this.enablePinchZoom) {
      // Pinch zoom
      event.preventDefault();
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (this.touchDistance > 0) {
        const scale = currentDistance / this.touchDistance;
        const newZoom = Math.max(this.minZoom, Math.min(this.initialZoom * scale, this.maxZoom));
        
        // Calculate center point between touches
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        const rect = this.imageContainer?.nativeElement?.getBoundingClientRect();
        
        if (rect) {
          const containerX = centerX - rect.left;
          const containerY = centerY - rect.top;
          
          const zoomRatio = newZoom / this.zoomLevel;
          this.translateX = containerX - (containerX - this.translateX) * zoomRatio;
          this.translateY = containerY - (containerY - this.translateY) * zoomRatio;
          
          this.zoomLevel = newZoom;
          this.cdRef.detectChanges();
        }
      }
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (event.touches.length === 0) {
      this.isDragging = false;
      this.touchDistance = 0;
    }
  }

  // Keyboard shortcuts
  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (!this.displayDialog) return;

    switch (event.key) {
      case 'Escape':
        this.displayDialog = false;
        break;
      case '+':
      case '=':
        if (event.ctrlKey) {
          event.preventDefault();
          this.zoomIn();
        }
        break;
      case '-':
        if (event.ctrlKey) {
          event.preventDefault();
          this.zoomOut();
        }
        break;
      case '0':
        if (event.ctrlKey) {
          event.preventDefault();
          this.resetZoom();
        }
        break;
      case 'ArrowLeft':
        if (this.showGallery) {
          event.preventDefault();
          this.navigateImage('prev');
        }
        break;
      case 'ArrowRight':
        if (this.showGallery) {
          event.preventDefault();
          this.navigateImage('next');
        }
        break;
      case 'r':
      case 'R':
        if (event.ctrlKey) {
          event.preventDefault();
          this.resetZoom();
          this.resetPosition();
        }
        break;
      case ' ':
        // Space to reset view
        event.preventDefault();
        this.resetZoom();
        this.resetPosition();
        break;
    }
  }

  // onZoomSliderChange(value: any): void {
  //   const zoomValue = value / 100;
  //   this.setZoom(zoomValue);
  // }
onZoomSliderChange(value: any): void {
  this.setZoom(value / 100);
}

  getZoomPercentage(): number {
    return Math.round(this.zoomLevel * 100);
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  getAvatarSize(): string {
    switch (this.avatarSize) {
      case 'large': return '50px';
      case 'xlarge': return '60px';
      default: return '40px';
    }
  }
}

// import { Component, Input, HostListener, OnDestroy, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ICellRendererAngularComp } from 'ag-grid-angular';
// import { ICellRendererParams } from 'ag-grid-community';

// // PrimeNG
// import { AvatarModule } from 'primeng/avatar';
// import { TooltipModule } from 'primeng/tooltip';
// import { DialogModule } from 'primeng/dialog';
// import { ButtonModule } from 'primeng/button';
// import { SkeletonModule } from 'primeng/skeleton';
// import { ImageModule } from 'primeng/image';
// import { RippleModule } from 'primeng/ripple';

// @Component({
//   selector: 'app-image-cell-renderer',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     AvatarModule, 
//     TooltipModule, 
//     DialogModule, 
//     ButtonModule, 
//     SkeletonModule,
//     ImageModule,
//     RippleModule
//   ],
//   templateUrl: './image-cell-renderer.component.html',
//   styleUrls: ['./image-cell-renderer.component.scss']
// })
// export class ImageCellRendererComponent implements ICellRendererAngularComp, OnDestroy {
//   public params!: ICellRendererParams;
//   public imageUrls: string[] = [];
//   public currentImageIndex = 0;
//   public displayDialog = false;
//   public zoomLevel = 1;
//   public loading = true;
//   public isDragging = false;
//   public dragStartX = 0;
//   public dragStartY = 0;
//   public translateX = 0;
//   public translateY = 0;
//   private keyboardListener: any;

//   @Input() zoomStep = 0.2;
//   @Input() avatarSize: 'normal' | 'large' | 'xlarge' = 'normal';
//   @Input() showGallery = false;

//   constructor(private cdRef: ChangeDetectorRef) {}

//   agInit(params: ICellRendererParams): void {
//     this.params = params;
//     this.processImageData(params.value);
//   }

//   private processImageData(value: any): void {
//     if (Array.isArray(value) && value.length > 0) {
//       this.imageUrls = value.map(url => this.ensureValidUrl(url));
//     } else if (typeof value === 'string' && value.trim()) {
//       this.imageUrls = [this.ensureValidUrl(value)];
//     } else {
//       this.imageUrls = [this.getFallbackImage()];
//     }
//   }

//   private ensureValidUrl(url: string): string {
//     if (!url) return this.getFallbackImage();
    
//     // Check if URL is valid
//     try {
//       new URL(url);
//       return url;
//     } catch {
//       // If it's a relative path or invalid URL, return fallback
//       return this.getFallbackImage();
//     }
//   }

//   private getFallbackImage(): string {
//     return 'https://images.unsplash.com/photo-1755930523772-79e4443c9e4a?w=400&auto=format&fit=crop&q=60';
//   }

//   refresh(params: ICellRendererParams): boolean {
//     this.processImageData(params.value);
//     this.cdRef.detectChanges();
//     return true;
//   }

//   onImageClick(): void {
//     if (this.imageUrls.length > 0) {
//       this.resetZoom();
//       this.resetPosition();
//       this.displayDialog = true;
//       this.loading = true;
//     }
//   }

//   navigateImage(direction: 'prev' | 'next'): void {
//     if (!this.showGallery || this.imageUrls.length <= 1) return;
    
//     this.currentImageIndex = direction === 'next' 
//       ? (this.currentImageIndex + 1) % this.imageUrls.length
//       : (this.currentImageIndex - 1 + this.imageUrls.length) % this.imageUrls.length;
    
//     this.resetZoom();
//     this.resetPosition();
//     this.loading = true;
//   }

//   zoomIn(): void {
//     this.zoomLevel = Math.min(this.zoomLevel + this.zoomStep, 3);
//   }

//   zoomOut(): void {
//     this.zoomLevel = Math.max(this.zoomLevel - this.zoomStep, 0.3);
//   }

//   resetZoom(): void {
//     this.zoomLevel = 1;
//   }

//   resetPosition(): void {
//     this.translateX = 0;
//     this.translateY = 0;
//   }

//   onImageLoad(): void {
//     this.loading = false;
//   }

//   // Mouse drag for panning
//   onMouseDown(event: MouseEvent): void {
//     if (this.zoomLevel <= 1) return;
    
//     this.isDragging = true;
//     this.dragStartX = event.clientX - this.translateX;
//     this.dragStartY = event.clientY - this.translateY;
//     event.preventDefault();
//   }

//   onMouseMove(event: MouseEvent): void {
//     if (!this.isDragging) return;
    
//     this.translateX = event.clientX - this.dragStartX;
//     this.translateY = event.clientY - this.dragStartY;
//   }

//   onMouseUp(): void {
//     this.isDragging = false;
//   }

//   // Touch support for mobile
//   onTouchStart(event: TouchEvent): void {
//     if (this.zoomLevel <= 1 || event.touches.length !== 1) return;
    
//     this.isDragging = true;
//     this.dragStartX = event.touches[0].clientX - this.translateX;
//     this.dragStartY = event.touches[0].clientY - this.translateY;
//   }

//   onTouchMove(event: TouchEvent): void {
//     if (!this.isDragging || event.touches.length !== 1) return;
    
//     this.translateX = event.touches[0].clientX - this.dragStartX;
//     this.translateY = event.touches[0].clientY - this.dragStartY;
//   }

//   onTouchEnd(): void {
//     this.isDragging = false;
//   }

//   // Keyboard shortcuts
//   @HostListener('document:keydown', ['$event'])
//   handleKeyboard(event: KeyboardEvent): void {
//     if (!this.displayDialog) return;

//     switch (event.key) {
//       case 'Escape':
//         this.displayDialog = false;
//         break;
//       case '+':
//       case '=':
//         if (event.ctrlKey) this.zoomIn();
//         break;
//       case '-':
//         if (event.ctrlKey) this.zoomOut();
//         break;
//       case '0':
//         if (event.ctrlKey) this.resetZoom();
//         break;
//       case 'ArrowLeft':
//         if (this.showGallery) this.navigateImage('prev');
//         break;
//       case 'ArrowRight':
//         if (this.showGallery) this.navigateImage('next');
//         break;
//       case 'r':
//       case 'R':
//         if (event.ctrlKey) {
//           this.resetZoom();
//           this.resetPosition();
//         }
//         break;
//     }
//   }

//   ngOnDestroy(): void {
//     // Cleanup if needed
//   }

//   getAvatarSize(): string {
//     switch (this.avatarSize) {
//       case 'large': return '50px';
//       case 'xlarge': return '60px';
//       default: return '40px';
//     }
//   }
// }

// // import { Component, Input, HostListener } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ICellRendererAngularComp } from 'ag-grid-angular';
// // import { ICellRendererParams } from 'ag-grid-community';

// // // PrimeNG
// // import { AvatarModule } from 'primeng/avatar';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { DialogModule } from 'primeng/dialog';
// // import { ButtonModule } from 'primeng/button';
// // import { SkeletonModule } from 'primeng/skeleton';

// // @Component({
// //   selector: 'app-image-cell-renderer',
// //   standalone: true,
// //   imports: [CommonModule, AvatarModule, TooltipModule, DialogModule, ButtonModule, SkeletonModule],
// //   templateUrl: './image-cell-renderer.component.html',
// //   styleUrls: ['./image-cell-renderer.component.css']
// // })
// // export class ImageCellRendererComponent implements ICellRendererAngularComp {
// //   public params!: ICellRendererParams;
// //   public imageUrl: string | null = null;
// //   public displayDialog = false;
// //   public zoomLevel = 1;
// //   public loading = true;

// //   @Input() zoomStep = 0.2; // configurable zoom step

// //   agInit(params: ICellRendererParams): void {
// //     this.params = params;

// //     if (Array.isArray(params.value)) {
// //       this.imageUrl = params.value[0]; // show first image for now
// //     } else {
// //       this.imageUrl =
// //         params.value || 'https://images.unsplash.com/photo-1755930523772-79e4443c9e4a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDIwfGJvOGpRS1RhRTBZfHxlbnwwfHx8fHw%3D';
// //     }
// //   }

// //   refresh(params: ICellRendererParams): boolean {
// //     this.agInit(params);
// //     return true;
// //   }

// //   onImageClick(): void {
// //     if (this.imageUrl) {
// //       this.resetZoom();
// //       this.displayDialog = true;
// //     }
// //   }

// //   zoomIn(): void {
// //     this.zoomLevel += this.zoomStep;
// //   }

// //   zoomOut(): void {
// //     if (this.zoomLevel > 0.3) {
// //       this.zoomLevel -= this.zoomStep;
// //     }
// //   }

// //   resetZoom(): void {
// //     this.zoomLevel = 1;
// //   }

// //   onImageLoad(): void {
// //     this.loading = false;
// //   }

// //   // ✅ Keyboard support
// //   @HostListener('document:keydown', ['$event'])
// //   handleKeyboard(event: KeyboardEvent): void {
// //     if (!this.displayDialog) return;

// //     switch (event.key) {
// //       case 'Escape':
// //         this.displayDialog = false;
// //         break;
// //       case '+':
// //         this.zoomIn();
// //         break;
// //       case '-':
// //         this.zoomOut();
// //         break;
// //       case '0':
// //         this.resetZoom();
// //         break;
// //     }
// //   }
// // }