import { Component, Input, computed, ElementRef, ViewChild, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-video-hero',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './video-hero.component.html',
  styleUrls: ['./video-hero.component.scss']
})
export class VideoHeroComponent implements AfterViewInit {
  @Input() config: any = {};
  
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  
  // Track if video has actually started playing to fade it in
  isPlaying = signal(false);

  // Layout Computation
  heightClass = computed(() => {
    switch (this.config.height) {
      case 'medium': return 'h-medium';
      case 'large': return 'h-large';
      case 'full_screen': return 'h-fullscreen';
      default: return 'h-large'; // Default to large/hero
    }
  });

  // Valid Button Filter
  get validButtons() {
    return this.config.ctaButtons?.filter((b: any) => b.text && b.url) || [];
  }

  ngAfterViewInit() {
    if (this.videoPlayer?.nativeElement) {
      const video = this.videoPlayer.nativeElement;
      
      video.muted = true; // Required for auto-play
      
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Video started playing successfully
            this.isPlaying.set(true);
          })
          .catch(error => {
            console.warn('Auto-play prevented:', error);
            // Fallback: isPlaying stays false, Poster image remains visible
          });
      }
    }
  }

  getLink(url: string): any[] {
    // Simple internal link handler
    if (!url) return [];
    return [url];
  }
}

// import { Component, Input, computed, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-video-hero',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './video-hero.component.html',
//   styleUrls: ['./video-hero.component.scss']
// })
// export class VideoHeroComponent implements AfterViewInit {
//   @Input() config: any = {};
//   @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

//   // Height Logic
//   heightClass = computed(() => {
//     switch (this.config.height) {
//       case 'medium': return 'h-[60vh] min-h-[500px]';
//       case 'large': return 'h-[80vh] min-h-[600px]';
//       case 'full_screen': return 'h-screen';
//       default: return 'h-[80vh] min-h-[600px]';
//     }
//   });

//   // Ensure video plays (some browsers require interaction)
//   ngAfterViewInit() {
//     if (this.videoPlayer?.nativeElement) {
//       this.videoPlayer.nativeElement.muted = true; // Auto-play requires mute
//       this.videoPlayer.nativeElement.play().catch(err => {
//         console.warn('Video autoplay blocked:', err);
//       });
//     }
//   }

//   // Filter valid buttons
//   get validButtons() {
//     return this.config.ctaButtons?.filter((b: any) => b.text && b.url) || [];
//   }
// }