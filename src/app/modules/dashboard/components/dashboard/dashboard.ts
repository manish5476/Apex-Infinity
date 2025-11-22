import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Transaction {
  id: string;
  customer: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  date: string;
}

interface Product {
  name: string;
  stock: number;
  price: number;
  sales: number;
  trend: 'up' | 'down';
}

interface Activity {
  msg: string;
  time: string;
  type: 'info' | 'warning' | 'success';
}
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
 sidebarOpen = signal(false);
  
  // Mock Data Signals
  transactions = signal<Transaction[]>([
    { id: 'TRX-9821', customer: 'Orbit Tech', amount: 1200.50, status: 'Completed', date: 'Oct 24, 2023' },
    { id: 'TRX-9822', customer: 'Flux Design', amount: 850.00, status: 'Pending', date: 'Oct 24, 2023' },
    { id: 'TRX-9823', customer: 'Nebula Inc', amount: 3200.00, status: 'Failed', date: 'Oct 23, 2023' },
    { id: 'TRX-9824', customer: 'John Doe', amount: 150.00, status: 'Completed', date: 'Oct 23, 2023' },
    { id: 'TRX-9825', customer: 'Starlight Co', amount: 900.00, status: 'Completed', date: 'Oct 22, 2023' },
  ]);

  products = signal<Product[]>([
    { name: 'Apex Pro Monitor', price: 450, stock: 12, sales: 842, trend: 'up' },
    { name: 'ErgoChair Supreme', price: 850, stock: 5, sales: 320, trend: 'up' },
    { name: 'Mech Keyboard X1', price: 120, stock: 45, sales: 1200, trend: 'down' },
    { name: 'Wireless Hub', price: 60, stock: 8, sales: 540, trend: 'up' },
  ]);

  activities = signal<Activity[]>([
    { msg: 'New order received from Orbit Tech', time: '2 mins ago', type: 'success' },
    { msg: 'Low stock alert: ErgoChair Supreme', time: '1 hour ago', type: 'warning' },
    { msg: 'Monthly report generated successfully', time: '3 hours ago', type: 'info' },
    { msg: 'Payment failed for Invoice #4421', time: '5 hours ago', type: 'warning' },
  ]);

  chartData = signal([
    { label: 'Jan', value: 40, amount: 12000 },
    { label: 'Feb', value: 65, amount: 18500 },
    { label: 'Mar', value: 55, amount: 15000 },
    { label: 'Apr', value: 80, amount: 22000 },
    { label: 'May', value: 95, amount: 28000 },
    { label: 'Jun', value: 70, amount: 19000 },
    { label: 'Jul', value: 85, amount: 24500 },
    { label: 'Aug', value: 60, amount: 17000 },
    { label: 'Sep', value: 75, amount: 21000 },
    { label: 'Oct', value: 90, amount: 26000 },
    { label: 'Nov', value: 50, amount: 14000 },
    { label: 'Dec', value: 100, amount: 32000 },
  ]);

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Completed': return 'bg-green-500/10 text-green-400';
      case 'Pending': return 'bg-yellow-500/10 text-yellow-400';
      case 'Failed': return 'bg-red-500/10 text-red-400';
      default: return 'bg-slate-700 text-slate-300';
    }
  }
}
