// testimonial-slider.component.ts
import { Component, Input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TestimonialItem {
  name: string;
  role?: string;
  avatar?: string;
  rating: number;
  text: string;
}

export interface TestimonialConfig {
  title?: string;
  items?: TestimonialItem[];
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
}

const PADDING: Record<string, string> = { none: '0', sm: '3rem', md: '5rem', lg: '8rem', xl: '11rem' };

const MOCK: TestimonialItem[] = [
  { name: 'Priya Sharma', role: 'Product Designer', rating: 5, text: 'Absolutely incredible quality. The packaging alone tells you these products are made with care. Will be a customer for life.', avatar: 'https://i.pravatar.cc/80?img=47' },
  { name: 'Rahul Mehta', role: 'Tech Entrepreneur', rating: 5, text: 'Fast shipping, honest descriptions, and the product exceeded expectations. This is what e-commerce should feel like.', avatar: 'https://i.pravatar.cc/80?img=11' },
  { name: 'Ananya Patel', role: 'Content Creator', rating: 5, text: 'I was skeptical at first but the reviews don\'t lie. Three purchases in and every single one has been flawless.', avatar: 'https://i.pravatar.cc/80?img=5' },
  { name: 'Vikram Singh', role: 'Marketing Director', rating: 5, text: 'Customer support responded within minutes and solved my issue immediately. That kind of service is impossible to find elsewhere.', avatar: 'https://i.pravatar.cc/80?img=33' }
];

@Component({
  selector: 'app-testimonial-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonial-slider.component.html',
  styleUrls: ['./testimonial-slider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestimonialSliderComponent {
  @Input() set config(v: TestimonialConfig) { this._config.set(v ?? {}); }
  private _config = signal<TestimonialConfig>({});

  readonly cfg = computed(() => ({
    title: this._config().title ?? 'What our customers say',
    paddingTop: this._config().paddingTop ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    backgroundColor: this._config().backgroundColor ?? ''
  }));

  readonly items = computed(() => {
    const src = this._config().items;
    return (Array.isArray(src) && src.length > 0) ? src : MOCK;
  });

  readonly sectionStyle = computed(() => ({
    'padding-top': PADDING[this.cfg().paddingTop] ?? '8rem',
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '8rem',
    'background-color': this.cfg().backgroundColor || ''
  }));

  stars(n: number): number[] { return Array.from({ length: Math.max(0, Math.min(5, n)) }); }
}
