import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstagramFeedConfig } from '@core/models/storefront.model';

@Component({
  selector: 'app-instagram-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instagram-feed.html',
  styles: [`
    :host { display: block; width: 100%; }
  `]
})
export class InstagramFeedComponent {
  @Input() config: InstagramFeedConfig = {};
  
  // Placeholder images for the feed
  mockPosts = [
    'assets/images/placeholder.jpg',
    'assets/images/placeholder.jpg',
    'assets/images/placeholder.jpg',
    'assets/images/placeholder.jpg',
    'assets/images/placeholder.jpg',
    'assets/images/placeholder.jpg'
  ];
}
