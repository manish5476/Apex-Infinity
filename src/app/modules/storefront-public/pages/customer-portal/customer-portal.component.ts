import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit,
  inject, signal, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, catchError, of, takeUntil } from 'rxjs';
import { CustomerPortalService } from '@core/services/customer-portal.service';

type PortalMode =
  | 'login' | 'register' | 'forgot-password' | 'reset-password'
  | 'dashboard' | 'orders' | 'order-detail' | 'returns' | 'return-detail' | 'return-form'
  | 'profile' | 'change-password';

@Component({
  selector: 'app-customer-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="portal-wrap">

  <!-- ══ AUTH SCREENS ═══════════════════════════════════════════ -->
  <ng-container *ngIf="isAuthMode()">
    <div class="portal-auth-card">
      <div class="portal-brand">
        <div class="portal-logo-ring">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <h1 class="portal-brand-name">My Account</h1>
        <p class="portal-brand-sub">Manage your orders, invoices &amp; returns</p>
      </div>

      <!-- Error / Success -->
      <div class="portal-alert portal-alert--error" *ngIf="error()">{{ error() }}</div>
      <div class="portal-alert portal-alert--success" *ngIf="success()">{{ success() }}</div>

      <!-- Login -->
      <ng-container *ngIf="mode() === 'login'">
        <form class="portal-form" (ngSubmit)="submitLogin()">
          <div class="pf-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="loginForm.email" name="email" placeholder="your@email.com" required autocomplete="email"/>
          </div>
          <div class="pf-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="loginForm.password" name="password" placeholder="••••••••" required autocomplete="current-password"/>
          </div>
          <button class="portal-btn portal-btn--primary" type="submit" [disabled]="submitting()">
            {{ submitting() ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>
        <div class="portal-auth-links">
          <a (click)="goTo('forgot-password')">Forgot password?</a>
          <span class="sep">·</span>
          <a (click)="goTo('register')">Create account</a>
        </div>
        <div style="margin-top: 1.25rem; font-size: 0.75rem; color: #888; text-align: center;">
          Store staff or merchant? <a [routerLink]="['/auth/login']" style="color: #6366f1; text-decoration: underline;">Apex Infinity Staff Sign In</a>
        </div>
      </ng-container>

      <!-- Register -->
      <ng-container *ngIf="mode() === 'register'">
        <form class="portal-form" (ngSubmit)="submitRegister()">
          <div class="pf-row">
            <div class="pf-group">
              <label>First Name</label>
              <input type="text" [(ngModel)]="registerForm.firstName" name="firstName" placeholder="Rahul"/>
            </div>
            <div class="pf-group">
              <label>Last Name</label>
              <input type="text" [(ngModel)]="registerForm.lastName" name="lastName" placeholder="Sharma"/>
            </div>
          </div>
          <div class="pf-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="registerForm.email" name="email" placeholder="your@email.com" required autocomplete="email"/>
          </div>
          <div class="pf-group">
            <label>Phone</label>
            <input type="tel" [(ngModel)]="registerForm.phone" name="phone" placeholder="+91 9876543210" required autocomplete="tel"/>
          </div>
          <div class="pf-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="registerForm.password" name="password" placeholder="Min 8 characters" required autocomplete="new-password"/>
          </div>
          <button class="portal-btn portal-btn--primary" type="submit" [disabled]="submitting()">
            {{ submitting() ? 'Creating…' : 'Create Account' }}
          </button>
        </form>
        <div class="portal-auth-links">
          Already have an account? <a (click)="goTo('login')">Sign in</a>
        </div>
      </ng-container>

      <!-- Forgot Password -->
      <ng-container *ngIf="mode() === 'forgot-password'">
        <form class="portal-form" (ngSubmit)="submitForgot()">
          <div class="pf-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="forgotForm.email" name="email" placeholder="your@email.com" required/>
          </div>
          <button class="portal-btn portal-btn--primary" type="submit" [disabled]="submitting()">
            {{ submitting() ? 'Sending…' : 'Send Reset Link' }}
          </button>
        </form>
        <div class="portal-auth-links">
          <a (click)="goTo('login')">Back to sign in</a>
        </div>
      </ng-container>

      <!-- Reset Password -->
      <ng-container *ngIf="mode() === 'reset-password'">
        <form class="portal-form" (ngSubmit)="submitReset()">
          <div class="pf-group">
            <label>New Password</label>
            <input type="password" [(ngModel)]="resetForm.password" name="password" placeholder="Min 8 characters" required/>
          </div>
          <div class="pf-group">
            <label>Confirm Password</label>
            <input type="password" [(ngModel)]="resetForm.confirm" name="confirm" placeholder="Repeat password" required/>
          </div>
          <button class="portal-btn portal-btn--primary" type="submit" [disabled]="submitting()">
            {{ submitting() ? 'Resetting…' : 'Reset Password' }}
          </button>
        </form>
      </ng-container>
    </div>
  </ng-container>

  <!-- ══ AUTHENTICATED PORTAL ══════════════════════════════════ -->
  <ng-container *ngIf="!isAuthMode()">
    <div class="portal-layout">

      <!-- Sidebar -->
      <aside class="portal-sidebar">
        <div class="portal-user-chip" *ngIf="profile()?.customer as cust">
          <div class="puc-avatar">{{ initials(cust) }}</div>
          <div class="puc-info">
            <div class="puc-name">{{ cust.name }}</div>
            <div class="puc-email">{{ cust.portalAccess?.email }}</div>
          </div>
        </div>

        <nav class="portal-nav">
          <a class="pnav-item" [class.active]="mode()==='dashboard'" (click)="goTo('dashboard')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Dashboard
          </a>
          <a class="pnav-item" [class.active]="mode()==='orders'||mode()==='order-detail'" (click)="goTo('orders')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            My Orders
          </a>
          <a class="pnav-item" [class.active]="mode()==='returns'||mode()==='return-detail'||mode()==='return-form'" (click)="goTo('returns')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
            Returns
          </a>
          <a class="pnav-item" [class.active]="mode()==='profile'" (click)="goTo('profile')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Profile
          </a>
        </nav>

        <button class="portal-btn portal-btn--ghost portal-logout" (click)="logout()">Sign Out</button>
      </aside>

      <!-- Main Content -->
      <main class="portal-main">

        <!-- Alert bar -->
        <div class="portal-alert portal-alert--error" *ngIf="error()">{{ error() }}</div>
        <div class="portal-alert portal-alert--success" *ngIf="success()">{{ success() }}</div>

        <!-- ─── DASHBOARD ──────────────────────────────────── -->
        <ng-container *ngIf="mode() === 'dashboard'">
          <h2 class="portal-page-title">Dashboard</h2>

          <div class="portal-stats-row" *ngIf="profile() as p">
            <div class="pstat">
              <div class="pstat-value">{{ p.stats?.totalOrders ?? 0 }}</div>
              <div class="pstat-label">Orders</div>
            </div>
            <div class="pstat">
              <div class="pstat-value">₹{{ (p.stats?.totalSpent ?? 0) | number:'1.0-0' }}</div>
              <div class="pstat-label">Total Spent</div>
            </div>
            <div class="pstat">
              <div class="pstat-value">{{ pendingReturns() }}</div>
              <div class="pstat-label">Pending Returns</div>
            </div>
          </div>

          <div class="portal-recent-orders" *ngIf="orders().length">
            <h3 class="portal-section-title">Recent Orders</h3>
            <div class="portal-order-card" *ngFor="let order of orders().slice(0,3)" (click)="viewOrder(order)">
              <div class="poc-left">
                <div class="poc-num">{{ order.invoiceId?.invoiceNumber || order.meta?.orderNumber || '—' }}</div>
                <div class="poc-date">{{ order.createdAt | date:'dd MMM yyyy' }}</div>
              </div>
              <div class="poc-right">
                <div class="poc-amount">₹{{ order.totalAmount | number:'1.2-2' }}</div>
                <span class="poc-badge" [class]="'badge-' + order.paymentStatus">{{ order.paymentStatus }}</span>
              </div>
            </div>
            <button class="portal-btn portal-btn--ghost" (click)="goTo('orders')">View all orders →</button>
          </div>

          <div class="portal-empty" *ngIf="!orders().length && !loading()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg>
            <p>No orders yet. Start shopping!</p>
          </div>
        </ng-container>

        <!-- ─── ORDERS LIST ────────────────────────────────── -->
        <ng-container *ngIf="mode() === 'orders'">
          <h2 class="portal-page-title">My Orders</h2>
          <div class="portal-loading" *ngIf="loading()">Loading orders…</div>
          <div class="portal-order-card" *ngFor="let order of orders()" (click)="viewOrder(order)">
            <div class="poc-left">
              <div class="poc-num">{{ order.invoiceId?.invoiceNumber || order.meta?.orderNumber || order._id }}</div>
              <div class="poc-items">{{ order.items?.length ?? 0 }} item(s)</div>
              <div class="poc-date">{{ order.createdAt | date:'dd MMM yyyy, hh:mm a' }}</div>
            </div>
            <div class="poc-right">
              <div class="poc-amount">₹{{ order.totalAmount | number:'1.2-2' }}</div>
              <span class="poc-badge" [class]="'badge-' + order.paymentStatus">{{ order.paymentStatus }}</span>
              <span class="poc-badge poc-badge--secondary" [class]="'badge-' + order.status">{{ order.status }}</span>
            </div>
          </div>
          <div class="portal-empty" *ngIf="!orders().length && !loading()">
            <p>No orders found.</p>
          </div>
        </ng-container>

        <!-- ─── ORDER DETAIL ──────────────────────────────── -->
        <ng-container *ngIf="mode() === 'order-detail' && currentOrder()">
          <div class="portal-back-bar">
            <button class="portal-btn portal-btn--ghost" (click)="goTo('orders')">← Back to Orders</button>
          </div>
          <h2 class="portal-page-title">
            Order — {{ currentOrder()!.invoiceId?.invoiceNumber || currentOrder()!.meta?.orderNumber }}
          </h2>
          <div class="portal-order-meta">
            <div><strong>Date:</strong> {{ currentOrder()!.createdAt | date:'dd MMM yyyy' }}</div>
            <div><strong>Status:</strong> <span class="poc-badge" [class]="'badge-' + currentOrder()!.status">{{ currentOrder()!.status }}</span></div>
            <div><strong>Payment:</strong> <span class="poc-badge" [class]="'badge-' + currentOrder()!.paymentStatus">{{ currentOrder()!.paymentStatus }}</span></div>
          </div>

          <!-- Items table -->
          <div class="portal-items-table">
            <div class="pit-header">
              <span>Product</span><span>Qty</span><span>Price</span><span>Total</span>
            </div>
            <div class="pit-row" *ngFor="let item of currentOrder()!.items">
              <span class="pit-name">{{ item.name }}</span>
              <span>{{ item.qty ?? item.quantity }}</span>
              <span>₹{{ item.rate ?? item.unitPrice | number:'1.2-2' }}</span>
              <span>₹{{ item.lineTotal | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="portal-order-totals">
            <div class="pot-row"><span>Subtotal</span><span>₹{{ currentOrder()!.subTotal | number:'1.2-2' }}</span></div>
            <div class="pot-row" *ngIf="currentOrder()!.discountTotal"><span>Discount</span><span>- ₹{{ currentOrder()!.discountTotal | number:'1.2-2' }}</span></div>
            <div class="pot-row pot-row--total"><span>Total</span><span>₹{{ currentOrder()!.totalAmount | number:'1.2-2' }}</span></div>
          </div>

          <div class="portal-action-bar">
            <a class="portal-btn portal-btn--primary"
               [href]="portalSvc.getInvoicePdfUrl(orgSlug(), currentOrder()!.invoiceId?._id || currentOrder()!.invoiceId)"
               target="_blank" download>
              ↓ Download Invoice
            </a>
            <button class="portal-btn portal-btn--ghost"
                    *ngIf="canReturn(currentOrder()!)"
                    (click)="startReturn(currentOrder()!)">
              ↩ Request Return
            </button>
          </div>
        </ng-container>

        <!-- ─── RETURNS LIST ──────────────────────────────── -->
        <ng-container *ngIf="mode() === 'returns'">
          <h2 class="portal-page-title">My Returns</h2>
          <div class="portal-loading" *ngIf="loading()">Loading returns…</div>
          <div class="portal-return-card" *ngFor="let ret of returns()" (click)="viewReturn(ret)">
            <div class="prc-left">
              <div class="prc-num">{{ ret.returnNumber }}</div>
              <div class="prc-date">{{ ret.createdAt | date:'dd MMM yyyy' }}</div>
              <div class="prc-reason">{{ ret.reason | slice:0:60 }}{{ ret.reason?.length > 60 ? '…' : '' }}</div>
            </div>
            <div class="prc-right">
              <span class="poc-badge" [class]="'badge-' + ret.status">{{ ret.status }}</span>
              <div class="prc-amount">₹{{ ret.totalRefundAmount | number:'1.2-2' }}</div>
            </div>
          </div>
          <div class="portal-empty" *ngIf="!returns().length && !loading()">
            <p>No returns found.</p>
          </div>
        </ng-container>

        <!-- ─── RETURN DETAIL ──────────────────────────────── -->
        <ng-container *ngIf="mode() === 'return-detail' && currentReturn()">
          <div class="portal-back-bar">
            <button class="portal-btn portal-btn--ghost" (click)="goTo('returns')">← Back to Returns</button>
          </div>
          <h2 class="portal-page-title">Return — {{ currentReturn()!.returnNumber }}</h2>

          <div class="portal-return-status-card" [class]="'rsc-' + currentReturn()!.status">
            <div class="rsc-icon">
              <ng-container [ngSwitch]="currentReturn()!.status">
                <span *ngSwitchCase="'pending'">⏳</span>
                <span *ngSwitchCase="'approved'">✅</span>
                <span *ngSwitchCase="'rejected'">❌</span>
              </ng-container>
            </div>
            <div class="rsc-info">
              <div class="rsc-status">{{ currentReturn()!.status | titlecase }}</div>
              <div class="rsc-reason" *ngIf="currentReturn()!.status === 'rejected'">
                Reason: {{ currentReturn()!.rejectionReason }}
              </div>
              <div class="rsc-refund" *ngIf="currentReturn()!.status === 'approved'">
                Refund: ₹{{ currentReturn()!.totalRefundAmount | number:'1.2-2' }}
                via {{ currentReturn()!.refundMethod || 'TBD' }}
              </div>
            </div>
          </div>

          <div class="portal-items-table">
            <div class="pit-header"><span>Product</span><span>Qty</span><span>Refund</span></div>
            <div class="pit-row" *ngFor="let item of currentReturn()!.items">
              <span class="pit-name">{{ item.name }}</span>
              <span>{{ item.quantity }}</span>
              <span>₹{{ item.refundAmount | number:'1.2-2' }}</span>
            </div>
          </div>
        </ng-container>

        <!-- ─── RETURN FORM ──────────────────────────────── -->
        <ng-container *ngIf="mode() === 'return-form'">
          <div class="portal-back-bar">
            <button class="portal-btn portal-btn--ghost" (click)="goTo('orders')">← Back</button>
          </div>
          <h2 class="portal-page-title">Request a Return</h2>

          <div class="portal-return-form-info" *ngIf="returnTargetOrder()">
            <strong>Order:</strong> {{ returnTargetOrder()!.invoiceId?.invoiceNumber || returnTargetOrder()!.meta?.orderNumber }}
          </div>

          <form class="portal-form" (ngSubmit)="submitReturn()">
            <div class="pf-group">
              <label>Return Reason *</label>
              <select [(ngModel)]="returnForm.reason" name="reason" required>
                <option value="">Select a reason…</option>
                <option value="Defective / Damaged product">Defective / Damaged product</option>
                <option value="Wrong item delivered">Wrong item delivered</option>
                <option value="Item not as described">Item not as described</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Quality not satisfactory">Quality not satisfactory</option>
                <option value="Missing parts / accessories">Missing parts / accessories</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="pf-group" *ngIf="returnTargetOrder()?.items">
              <label>Select Items to Return *</label>
              <div class="pf-item-checkboxes">
                <label class="pf-item-check" *ngFor="let item of returnTargetOrder()!.items; let i = index">
                  <input type="checkbox" [(ngModel)]="returnItemsSelected[i]" [name]="'item_' + i"/>
                  {{ item.name }} (Qty: {{ item.qty ?? item.quantity }}) — ₹{{ item.rate ?? item.unitPrice | number:'1.2-2' }}
                </label>
              </div>
            </div>
            <div class="pf-group">
              <label>Additional Notes</label>
              <textarea [(ngModel)]="returnForm.notes" name="notes" rows="3" placeholder="Describe the issue in detail…"></textarea>
            </div>
            <div class="pf-group">
              <label>Photo Evidence (URLs, comma-separated)</label>
              <input type="text" [(ngModel)]="returnForm.evidenceImagesRaw" name="evidence" placeholder="https://...image1.jpg, https://...image2.jpg"/>
              <small class="pf-hint">Upload product condition photos to strengthen your return claim</small>
            </div>
            <button class="portal-btn portal-btn--primary" type="submit" [disabled]="submitting()">
              {{ submitting() ? 'Submitting…' : 'Submit Return Request' }}
            </button>
          </form>
        </ng-container>

        <!-- ─── PROFILE ──────────────────────────────────── -->
        <ng-container *ngIf="mode() === 'profile'">
          <h2 class="portal-page-title">My Profile</h2>

          <form class="portal-form portal-form--profile" (ngSubmit)="saveProfile()">
            <div class="pf-group">
              <label>Full Name</label>
              <input type="text" [(ngModel)]="profileForm.name" name="name" placeholder="Your full name"/>
            </div>
            <div class="pf-group">
              <label>Phone</label>
              <input type="tel" [(ngModel)]="profileForm.phone" name="phone" placeholder="+91 9876543210"/>
            </div>
            <button class="portal-btn portal-btn--primary" type="submit" [disabled]="submitting()">
              {{ submitting() ? 'Saving…' : 'Save Changes' }}
            </button>
          </form>

          <div class="portal-divider"></div>
          <h3 class="portal-section-title">Change Password</h3>
          <form class="portal-form" (ngSubmit)="submitChangePassword()">
            <div class="pf-group">
              <label>Current Password</label>
              <input type="password" [(ngModel)]="pwForm.current" name="current" required/>
            </div>
            <div class="pf-group">
              <label>New Password</label>
              <input type="password" [(ngModel)]="pwForm.newPw" name="newPw" required placeholder="Min 8 characters"/>
            </div>
            <div class="pf-group">
              <label>Confirm New Password</label>
              <input type="password" [(ngModel)]="pwForm.confirm" name="confirm" required/>
            </div>
            <button class="portal-btn portal-btn--secondary" type="submit" [disabled]="submitting()">
              {{ submitting() ? 'Updating…' : 'Update Password' }}
            </button>
          </form>
        </ng-container>

      </main>
    </div>
  </ng-container>

</div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #f7f8fa; font-family: 'Inter', sans-serif; }

    /* ── Wrapper ─────────────────────────── */
    .portal-wrap { min-height: 100vh; }

    /* ── Auth Card ───────────────────────── */
    .portal-auth-card {
      max-width: 420px; margin: 60px auto; padding: 40px;
      background: #fff; border-radius: 16px;
      box-shadow: 0 4px 32px rgba(0,0,0,.08);
    }
    .portal-brand { text-align: center; margin-bottom: 32px; }
    .portal-logo-ring {
      width: 64px; height: 64px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px; color: #fff;
    }
    .portal-logo-ring svg { width: 28px; height: 28px; }
    .portal-brand-name { font-size: 1.5rem; font-weight: 700; margin: 0 0 4px; color: #1a1a2e; }
    .portal-brand-sub { font-size: .85rem; color: #6b7280; margin: 0; }

    .portal-auth-links {
      text-align: center; margin-top: 20px; font-size: .85rem; color: #6b7280;
    }
    .portal-auth-links a { color: #6366f1; cursor: pointer; font-weight: 500; }
    .portal-auth-links a:hover { text-decoration: underline; }
    .portal-auth-links .sep { margin: 0 8px; }

    /* ── Alerts ──────────────────────────── */
    .portal-alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: .875rem; }
    .portal-alert--error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .portal-alert--success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

    /* ── Forms ───────────────────────────── */
    .portal-form { display: flex; flex-direction: column; gap: 16px; }
    .pf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .pf-group { display: flex; flex-direction: column; gap: 6px; }
    .pf-group label { font-size: .8rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: .04em; }
    .pf-group input, .pf-group textarea, .pf-group select {
      padding: 10px 14px; border: 1.5px solid #e5e7eb; border-radius: 8px;
      font-size: .9rem; color: #1f2937; outline: none; transition: border-color .2s;
      background: #fff;
    }
    .pf-group input:focus, .pf-group textarea:focus, .pf-group select:focus { border-color: #6366f1; }
    .pf-hint { font-size: .75rem; color: #9ca3af; }
    .pf-item-checkboxes { display: flex; flex-direction: column; gap: 10px; }
    .pf-item-check { display: flex; align-items: center; gap: 10px; font-size: .875rem; cursor: pointer; }

    /* ── Buttons ─────────────────────────── */
    .portal-btn {
      padding: 10px 20px; border: none; border-radius: 8px;
      font-size: .9rem; font-weight: 600; cursor: pointer; transition: all .2s;
      text-align: center; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    }
    .portal-btn:disabled { opacity: .6; cursor: not-allowed; }
    .portal-btn--primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }
    .portal-btn--primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,.3); }
    .portal-btn--secondary { background: #e0e7ff; color: #4338ca; }
    .portal-btn--secondary:hover:not(:disabled) { background: #c7d2fe; }
    .portal-btn--ghost { background: transparent; color: #6366f1; border: 1px solid #e0e7ff; }
    .portal-btn--ghost:hover:not(:disabled) { background: #f5f3ff; }

    /* ── Portal Layout ───────────────────── */
    .portal-layout { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; }

    /* ── Sidebar ─────────────────────────── */
    .portal-sidebar {
      background: #1a1a2e; color: #fff; padding: 32px 0;
      display: flex; flex-direction: column; gap: 0;
    }
    .portal-user-chip { padding: 0 24px 28px; border-bottom: 1px solid rgba(255,255,255,.08); margin-bottom: 16px; display: flex; gap: 12px; align-items: center; }
    .puc-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: .9rem; flex-shrink: 0;
    }
    .puc-name { font-weight: 600; font-size: .9rem; }
    .puc-email { font-size: .75rem; color: #9ca3af; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }

    .portal-nav { display: flex; flex-direction: column; flex: 1; }
    .pnav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 24px; color: #9ca3af; cursor: pointer;
      font-size: .875rem; font-weight: 500; transition: all .15s;
      border-left: 3px solid transparent;
    }
    .pnav-item:hover { color: #fff; background: rgba(255,255,255,.06); }
    .pnav-item.active { color: #fff; background: rgba(99,102,241,.2); border-left-color: #6366f1; }
    .pnav-item svg { width: 16px; height: 16px; flex-shrink: 0; }

    .portal-logout { margin: 16px 24px; }

    /* ── Main Area ───────────────────────── */
    .portal-main { padding: 40px; background: #f7f8fa; overflow-y: auto; }
    .portal-page-title { font-size: 1.6rem; font-weight: 700; color: #1a1a2e; margin: 0 0 28px; }
    .portal-section-title { font-size: 1rem; font-weight: 600; color: #374151; margin: 0 0 16px; }
    .portal-loading { color: #6b7280; font-size: .9rem; }
    .portal-back-bar { margin-bottom: 24px; }
    .portal-divider { border: none; border-top: 1px solid #e5e7eb; margin: 32px 0; }

    /* ── Stats ───────────────────────────── */
    .portal-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
    .pstat {
      background: #fff; border-radius: 12px; padding: 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,.06); text-align: center;
    }
    .pstat-value { font-size: 2rem; font-weight: 700; color: #6366f1; }
    .pstat-label { font-size: .8rem; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; margin-top: 4px; }

    /* ── Order Cards ─────────────────────── */
    .portal-order-card {
      background: #fff; border-radius: 10px; padding: 16px 20px;
      margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;
      box-shadow: 0 1px 4px rgba(0,0,0,.05); cursor: pointer; transition: box-shadow .2s;
    }
    .portal-order-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
    .poc-num { font-weight: 600; color: #1f2937; font-size: .9rem; }
    .poc-date { font-size: .75rem; color: #9ca3af; margin-top: 2px; }
    .poc-items { font-size: .75rem; color: #6b7280; }
    .poc-amount { font-weight: 700; font-size: 1.05rem; color: #1f2937; text-align: right; }
    .poc-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }

    /* ── Return Cards ────────────────────── */
    .portal-return-card {
      background: #fff; border-radius: 10px; padding: 16px 20px;
      margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start;
      box-shadow: 0 1px 4px rgba(0,0,0,.05); cursor: pointer; transition: box-shadow .2s;
    }
    .portal-return-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
    .prc-num { font-weight: 600; font-size: .9rem; color: #1f2937; }
    .prc-date { font-size: .75rem; color: #9ca3af; margin: 2px 0; }
    .prc-reason { font-size: .8rem; color: #6b7280; }
    .prc-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
    .prc-amount { font-weight: 600; font-size: .9rem; }

    /* ── Badges ──────────────────────────── */
    .poc-badge {
      display: inline-block; padding: 2px 10px; border-radius: 20px;
      font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em;
    }
    .badge-paid, .badge-approved { background: #d1fae5; color: #065f46; }
    .badge-unpaid, .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-partial { background: #dbeafe; color: #1e40af; }
    .badge-failed, .badge-rejected, .badge-cancelled { background: #fee2e2; color: #991b1b; }
    .badge-active { background: #e0e7ff; color: #3730a3; }

    /* ── Items Table ─────────────────────── */
    .portal-items-table { background: #fff; border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
    .pit-header {
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
      padding: 12px 20px; background: #f9fafb;
      font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #6b7280;
    }
    .pit-row {
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
      padding: 14px 20px; border-top: 1px solid #f3f4f6; font-size: .875rem;
    }
    .pit-name { font-weight: 500; color: #1f2937; }

    /* ── Totals ──────────────────────────── */
    .portal-order-totals { background: #fff; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
    .pot-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: .875rem; color: #374151; }
    .pot-row--total { font-weight: 700; font-size: 1rem; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 6px; }

    /* ── Action Bar ──────────────────────── */
    .portal-action-bar { display: flex; gap: 12px; flex-wrap: wrap; }

    /* ── Return Status Card ──────────────── */
    .portal-return-status-card {
      display: flex; align-items: center; gap: 16px;
      border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;
    }
    .rsc-pending { background: #fef3c7; }
    .rsc-approved { background: #d1fae5; }
    .rsc-rejected { background: #fee2e2; }
    .rsc-icon { font-size: 2rem; }
    .rsc-status { font-weight: 700; font-size: 1rem; }
    .rsc-reason, .rsc-refund { font-size: .875rem; margin-top: 4px; }

    /* ── Return form info ────────────────── */
    .portal-return-form-info { background: #e0e7ff; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: .875rem; color: #3730a3; }

    /* ── Order meta ──────────────────────── */
    .portal-order-meta { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 24px; font-size: .875rem; }

    /* ── Profile form ────────────────────── */
    .portal-form--profile { max-width: 480px; }

    /* ── Empty state ─────────────────────── */
    .portal-empty { text-align: center; padding: 60px 0; color: #9ca3af; }
    .portal-empty svg { width: 64px; height: 64px; stroke: #d1d5db; margin: 0 auto 16px; display: block; }
    .portal-empty p { font-size: .9rem; }

    /* ── Recent orders section ───────────── */
    .portal-recent-orders { margin-top: 8px; }
    .portal-recent-orders .portal-btn { margin-top: 8px; }

    /* ── Responsive ──────────────────────── */
    @media (max-width: 768px) {
      .portal-layout { grid-template-columns: 1fr; }
      .portal-sidebar { flex-direction: row; padding: 0; overflow-x: auto; }
      .portal-user-chip { display: none; }
      .portal-nav { flex-direction: row; }
      .pnav-item { padding: 12px 16px; border-left: none; border-bottom: 3px solid transparent; }
      .pnav-item.active { border-bottom-color: #6366f1; border-left-color: transparent; }
      .portal-logout { display: none; }
      .portal-main { padding: 20px; }
      .portal-stats-row { grid-template-columns: 1fr 1fr; }
      .pit-header, .pit-row { grid-template-columns: 2fr 1fr 1fr; }
      .pit-header span:last-child, .pit-row span:last-child { display: none; }
    }
  `]
})
export class CustomerPortalComponent implements OnInit, OnDestroy {
  readonly portalSvc = inject(CustomerPortalService);
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly cdr     = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly mode       = signal<PortalMode>('login');
  readonly orgSlug    = signal('');
  readonly loading    = signal(false);
  readonly submitting = signal(false);
  readonly error      = signal<string | null>(null);
  readonly success    = signal<string | null>(null);

  readonly profile      = signal<any>(null);
  readonly orders       = signal<any[]>([]);
  readonly returns      = signal<any[]>([]);
  readonly currentOrder = signal<any>(null);
  readonly currentReturn = signal<any>(null);
  readonly returnTargetOrder = signal<any>(null);

  // Forms
  loginForm    = { email: '', password: '' };
  registerForm = { firstName: '', lastName: '', email: '', phone: '', password: '' };
  forgotForm   = { email: '' };
  resetForm    = { password: '', confirm: '' };
  profileForm  = { name: '', phone: '' };
  pwForm       = { current: '', newPw: '', confirm: '' };
  returnForm   = { reason: '', notes: '', evidenceImagesRaw: '' };
  returnItemsSelected: boolean[] = [];

  private resetToken = '';

  ngOnInit(): void {
    this.route.parent?.paramMap.pipe(takeUntil(this.destroy$)).subscribe(p => {
      this.orgSlug.set(p.get('orgSlug') ?? '');
    });
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      const m = (data['mode'] as PortalMode) ?? 'login';
      this.setMode(m);
    });
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(qp => {
      const t = qp.get('token');
      if (t) this.resetToken = t;
    });
  }

  isAuthMode(): boolean {
    return ['login', 'register', 'forgot-password', 'reset-password'].includes(this.mode());
  }

  goTo(m: PortalMode): void {
    this.router.navigate(['/store', this.orgSlug(), 'portal', m]);
  }

  private setMode(m: PortalMode): void {
    this.mode.set(m);
    this.error.set(null);
    this.success.set(null);
    if (m === 'dashboard' || m === 'orders') this.loadOrders();
    if (m === 'returns') this.loadReturns();
    if (m === 'dashboard' || m === 'profile') this.loadProfile();
    this.cdr.markForCheck();
  }

  // ── Auth ──────────────────────────────────────────────────────────────

  submitLogin(): void {
    this.submitting.set(true); this.error.set(null);
    this.portalSvc.login(this.orgSlug(), this.loginForm.email, this.loginForm.password).pipe(
      catchError(err => { this.error.set(err?.error?.message ?? 'Login failed'); return of(null); }),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.submitting.set(false);
      if (!res) return;
      this.router.navigate(['/store', this.orgSlug(), 'portal', 'dashboard']);
    });
  }

  submitRegister(): void {
    this.submitting.set(true); this.error.set(null);
    this.portalSvc.register(this.orgSlug(), this.registerForm).pipe(
      catchError(err => { this.error.set(err?.error?.message ?? 'Registration failed'); return of(null); }),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.submitting.set(false);
      if (!res) return;
      this.success.set('Account created! Welcome.');
      this.router.navigate(['/store', this.orgSlug(), 'portal', 'dashboard']);
    });
  }

  submitForgot(): void {
    this.submitting.set(true); this.error.set(null);
    this.portalSvc.forgotPassword(this.orgSlug(), this.forgotForm.email).pipe(
      catchError(err => { this.error.set(err?.error?.message ?? 'Failed'); return of(null); }),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.submitting.set(false);
      if (res) this.success.set('If an account exists, a reset link was sent.');
    });
  }

  submitReset(): void {
    if (this.resetForm.password !== this.resetForm.confirm) {
      this.error.set('Passwords do not match'); return;
    }
    this.submitting.set(true);
    this.portalSvc.resetPassword(this.orgSlug(), this.resetToken, this.resetForm.password).pipe(
      catchError(err => { this.error.set(err?.error?.message ?? 'Reset failed'); return of(null); }),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.submitting.set(false);
      if (!res) return;
      this.success.set('Password reset! Please sign in.');
      setTimeout(() => this.router.navigate(['/store', this.orgSlug(), 'portal', 'login']), 1500);
    });
  }

  logout(): void {
    this.portalSvc.logout(this.orgSlug()).pipe(takeUntil(this.destroy$))
      .subscribe(() => this.router.navigate(['/store', this.orgSlug(), 'portal', 'login']));
  }

  // ── Data loaders ──────────────────────────────────────────────────────

  loadProfile(): void {
    this.portalSvc.getMe(this.orgSlug()).pipe(
      catchError(() => of(null)), takeUntil(this.destroy$)
    ).subscribe(res => {
      if (!res?.data) return;
      this.profile.set(res.data);
      this.profileForm.name  = res.data.customer?.name  ?? '';
      this.profileForm.phone = res.data.customer?.phone ?? '';
      this.cdr.markForCheck();
    });
  }

  loadOrders(): void {
    this.loading.set(true);
    this.portalSvc.listOrders(this.orgSlug()).pipe(
      catchError(() => of(null)), takeUntil(this.destroy$)
    ).subscribe(res => {
      this.loading.set(false);
      this.orders.set(res?.orders ?? []);
      this.cdr.markForCheck();
    });
  }

  loadReturns(): void {
    this.loading.set(true);
    this.portalSvc.listReturns(this.orgSlug()).pipe(
      catchError(() => of(null)), takeUntil(this.destroy$)
    ).subscribe(res => {
      this.loading.set(false);
      this.returns.set(res?.returns ?? []);
      this.cdr.markForCheck();
    });
  }

  // ── Order interactions ────────────────────────────────────────────────

  viewOrder(order: any): void {
    this.loading.set(true);
    const saleId = order._id;
    this.portalSvc.getOrder(this.orgSlug(), saleId).pipe(
      catchError(() => of(null)), takeUntil(this.destroy$)
    ).subscribe(res => {
      this.loading.set(false);
      this.currentOrder.set(res?.data?.order ?? order);
      this.mode.set('order-detail');
      this.cdr.markForCheck();
    });
  }

  canReturn(order: any): boolean {
    return ['active', 'delivered'].includes(order.status) && order.paymentStatus === 'paid';
  }

  startReturn(order: any): void {
    this.returnTargetOrder.set(order);
    this.returnForm = { reason: '', notes: '', evidenceImagesRaw: '' };
    this.returnItemsSelected = (order.items ?? []).map(() => false);
    this.mode.set('return-form');
  }

  submitReturn(): void {
    if (!this.returnForm.reason) { this.error.set('Please select a return reason'); return; }
    const order = this.returnTargetOrder();
    if (!order) { this.error.set('No order selected for return'); return; }

    const selectedItems = (order.items ?? []).filter((_: any, i: number) => this.returnItemsSelected[i]);
    if (!selectedItems.length) { this.error.set('Please select at least one item to return'); return; }

    const items = selectedItems.map((item: any) => ({
      productId:    item.productId,
      name:         item.name,
      quantity:     item.qty ?? item.quantity ?? 1,
      unitPrice:    item.rate ?? item.unitPrice ?? 0,
      refundAmount: (item.qty ?? item.quantity ?? 1) * (item.rate ?? item.unitPrice ?? 0)
    }));

    const evidenceImages = this.returnForm.evidenceImagesRaw
      .split(',').map(s => s.trim()).filter(Boolean);

    const invoiceId = order.invoiceId?._id ?? order.invoiceId;

    this.submitting.set(true); this.error.set(null);
    this.portalSvc.submitReturn(this.orgSlug(), {
      invoiceId,
      items,
      reason: this.returnForm.reason,
      notes:  this.returnForm.notes,
      evidenceImages
    }).pipe(
      catchError(err => { this.error.set(err?.error?.message ?? 'Return submission failed'); return of(null); }),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.submitting.set(false);
      if (!res) return;
      this.success.set('Return request submitted! We will review and update you shortly.');
      this.router.navigate(['/store', this.orgSlug(), 'portal', 'returns']);
    });
  }

  // ── Return interactions ────────────────────────────────────────────────

  viewReturn(ret: any): void {
    this.currentReturn.set(ret);
    this.mode.set('return-detail');
  }

  pendingReturns(): number {
    return this.returns().filter(r => r.status === 'pending').length;
  }

  // ── Profile ───────────────────────────────────────────────────────────

  saveProfile(): void {
    this.submitting.set(true); this.error.set(null);
    this.portalSvc.updateMe(this.orgSlug(), this.profileForm).pipe(
      catchError(err => { this.error.set(err?.error?.message ?? 'Save failed'); return of(null); }),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.submitting.set(false);
      if (res) this.success.set('Profile updated.');
    });
  }

  submitChangePassword(): void {
    if (this.pwForm.newPw !== this.pwForm.confirm) { this.error.set('Passwords do not match'); return; }
    this.submitting.set(true); this.error.set(null);
    this.portalSvc.changePassword(this.orgSlug(), this.pwForm.current, this.pwForm.newPw).pipe(
      catchError(err => { this.error.set(err?.error?.message ?? 'Update failed'); return of(null); }),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.submitting.set(false);
      if (res) { this.success.set('Password changed.'); this.pwForm = { current: '', newPw: '', confirm: '' }; }
    });
  }

  initials(cust: any): string {
    const n = (cust?.name ?? '').split(' ');
    return (n[0]?.[0] ?? '') + (n[1]?.[0] ?? '');
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
