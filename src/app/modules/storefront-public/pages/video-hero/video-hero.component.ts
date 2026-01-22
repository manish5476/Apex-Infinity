import { Component, Input, computed, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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

  // Height Logic
  heightClass = computed(() => {
    switch (this.config.height) {
      case 'medium': return 'h-[60vh] min-h-[500px]';
      case 'large': return 'h-[80vh] min-h-[600px]';
      case 'full_screen': return 'h-screen';
      default: return 'h-[80vh] min-h-[600px]';
    }
  });

  // Ensure video plays (some browsers require interaction)
  ngAfterViewInit() {
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.muted = true; // Auto-play requires mute
      this.videoPlayer.nativeElement.play().catch(err => {
        console.warn('Video autoplay blocked:', err);
      });
    }
  }

  // Filter valid buttons
  get validButtons() {
    return this.config.ctaButtons?.filter((b: any) => b.text && b.url) || [];
  }
}