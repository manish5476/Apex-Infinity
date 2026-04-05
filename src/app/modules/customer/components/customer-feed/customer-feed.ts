import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../services/customer-service';

@Component({
  selector: 'app-customer-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-feed.html',
  styleUrls: ['./customer-feed.scss']
})
export class CustomerFeedComponent implements OnInit {
  @Input() customerId!: string;
  feedItems: any[] = [];
  loading = false;

  constructor(private customerService: CustomerService) { }

  ngOnInit(): void {
    if (this.customerId) {
      this.loadFeed();
    }
  }

  loadFeed() {
    this.loading = true;
    this.customerService.getCustomerFeed(this.customerId).subscribe({
      next: (res) => {
        this.feedItems = res.data.feed;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // Helper for dynamic Icon Backgrounds based on activity type
  getIconBg(type: string): string {
    switch (type) {
      case 'payment': return 'bg-success/10 text-success';
      case 'invoice': return 'bg-info/10 text-info';
      case 'note': return 'bg-warning/10 text-warning';
      default: return 'bg-base-200 text-base-content';
    }
  }

  // Helper for Status Badge colors
  getStatusClass(status: string): string {
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'issued') return 'badge-success';
    if (s === 'pending') return 'badge-warning';
    if (s === 'cancelled') return 'badge-error';
    return 'badge-ghost';
  }
}