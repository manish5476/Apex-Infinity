import {
  Component, OnInit, signal, computed,
  ChangeDetectorRef, inject, ChangeDetectionStrategy, OnDestroy
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';

import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { MasterListService } from '../../core/services/master-list.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-admin-dashboard-ui',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, CurrencyPipe, DatePipe, DecimalPipe,
    TagModule, TooltipModule, ProgressSpinnerModule,
    SelectModule, DatePicker,
    AgShareGrid
  ],
  template: `
<div class="dash-root">

  <header class="classic-header">
    <div class="header-titles">
      <div class="icon-brand"><i class="pi pi-objects-column"></i></div>
      <div>
        <h1>Executive Dashboard</h1>
        <p class="text-muted fw-500">
          @if (dashboard()?.period) {
            {{ dashboard()!.period.start | date:'mediumDate' }} – {{ dashboard()!.period.end | date:'mediumDate' }}
            <span class="pill outline ms-2">{{ dashboard()!.period.days }} Days</span>
          } @else {
            &mdash;
          }
        </p>
      </div>
    </div>

    <div class="header-actions">
      <div class="control-wrapper">
        <p-select
          appendTo="body"
          [options]="masterList.branches()"
          optionLabel="name"
          optionValue="_id"
          [(ngModel)]="selectedBranch"
          (onChange)="onFilterChange()"
          styleClass="soft-select"
          placeholder="All Branches">
        </p-select>
      </div>

      <div class="control-wrapper">
        <p-datepicker
          [(ngModel)]="dateRange"
          selectionMode="range"
          [showIcon]="true"
          (onSelect)="onFilterChange()"
          placeholder="Select Period"
          styleClass="soft-datepicker">
        </p-datepicker>
      </div>

      @if (dashboard()?.financial?.performance?.executionTime) {
        <span class="pill outline text-muted" pTooltip="Query Execution Time" tooltipPosition="bottom">
          <i class="pi pi-bolt"></i> {{ dashboard()!.financial.performance.executionTime }}
        </span>
      }

      <button class="btn-pill primary icon-only" (click)="loadDashboard()" [disabled]="loading()" pTooltip="Sync Data">
        <i class="pi pi-refresh" [class.pi-spin]="loading()"></i>
      </button>
    </div>
  </header>

  @if (loading()) {
    <div class="loader-overlay">
      <div class="loader-card">
        <p-progressSpinner styleClass="w-8 h-8" strokeWidth="3"></p-progressSpinner>
        <span class="loader-label">Synchronizing Intelligence…</span>
      </div>
    </div>
  }

  @if (!loading() && dashboard()) {
    <div class="dash-body">

      @if ((dashboard()!.alerts.lowStockCount ?? 0) > 0) {
        <div class="alert-banner warning-kit">
          <div class="alert-content">
            <div class="alert-icon"><i class="pi pi-exclamation-triangle"></i></div>
            <div class="alert-text">
              <h3>Inventory Warning</h3>
              <p><strong>{{ dashboard()!.alerts.lowStockCount }} items</strong> below reorder level. Action required to prevent stockouts.</p>
            </div>
          </div>
          <div class="ribbon-items">
            @for (item of dashboard()!.alerts.itemsToReorder.slice(0, 2); track item) {
              <span class="pill outline">{{ item }}</span>
            }
            @if (dashboard()!.alerts.itemsToReorder.length > 2) {
              <span class="pill outline">+{{ dashboard()!.alerts.itemsToReorder.length - 2 }} more</span>
            }
          </div>
        </div>
      }

      <section class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Gross Revenue</span>
            <div class="kpi-icon primary-kit"><i class="pi pi-wallet"></i></div>
          </div>
          <strong class="kpi-value">{{ dashboard()!.financial.totalRevenue.value | currency:'INR':'symbol':'1.0-0' }}</strong>
          <div class="kpi-bottom">
            <span class="pill success-kit"><i class="pi pi-arrow-up-right"></i> {{ dashboard()!.financial.totalRevenue.growth }}%</span>
            <span class="text-muted text-xs">{{ dashboard()!.financial.totalRevenue.count }} transactions</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Net Profit</span>
            <div class="kpi-icon" [ngClass]="dashboard()!.financial.netProfit.status === 'profitable' ? 'success-kit' : 'error-kit'">
              <i class="pi pi-chart-line"></i>
            </div>
          </div>
          <strong class="kpi-value" [ngClass]="dashboard()!.financial.netProfit.status === 'profitable' ? 'text-success' : 'text-error'">
            {{ dashboard()!.financial.netProfit.value | currency:'INR':'symbol':'1.0-0' }}
          </strong>
          <div class="kpi-bottom">
            <div class="progress-track w-100">
              <div class="progress-fill" [ngClass]="dashboard()!.financial.netProfit.status === 'profitable' ? 'bg-success' : 'bg-error'" [style.width.%]="Math.min(Math.max(dashboard()!.financial.netProfit.margin, 0), 100)"></div>
            </div>
            <span class="text-muted text-xs ms-2">{{ dashboard()!.financial.netProfit.margin | number:'1.1-1' }}%</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Inventory Valuation</span>
            <div class="kpi-icon info-kit"><i class="pi pi-box"></i></div>
          </div>
          <strong class="kpi-value">{{ dashboard()!.inventory.summary.valuation | currency:'INR':'symbol':'1.0-0' }}</strong>
          <div class="kpi-bottom">
            <span class="text-muted text-xs">{{ dashboard()!.inventory.inventoryValuation.totalItems }} items across {{ dashboard()!.inventory.inventoryValuation.productCount }} SKUs</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">System Health</span>
            <div class="kpi-icon purple-kit"><i class="pi pi-heart-fill"></i></div>
          </div>
          <div class="health-wrap">
            <svg viewBox="0 0 36 36" class="health-ring">
              <path class="ring-track" d="M18 2.0845 a15.9155 15.9155 0 0 1 0 31.831 a15.9155 15.9155 0 0 1 0-31.831"/>
              <path class="ring-arc"
                [attr.stroke-dasharray]="(dashboard()!.inventory.healthScore || 0) + ' 100'"
                [ngClass]="getHealthClass(dashboard()!.inventory.healthScore)"
                d="M18 2.0845 a15.9155 15.9155 0 0 1 0 31.831 a15.9155 15.9155 0 0 1 0-31.831"/>
            </svg>
            <span class="health-value">{{ dashboard()!.inventory.healthScore || 0 }}%</span>
          </div>
        </div>
      </section>

      <div class="bento-layout">

        <div class="bento-main">

          <section class="soft-panel">
            <div class="panel-head">
              <h2><i class="pi pi-sparkles text-primary me-2"></i> AI Business Insights</h2>
              <span class="pill outline">{{ dashboard()!.insights.count }} New</span>
            </div>
            
            <div class="insights-grid">
              @for (insight of dashboard()!.insights.insights; track insight.title) {
                <div class="insight-card"
                  [ngClass]="{
                    'success-border': insight.type === 'positive',
                    'warning-border': insight.type === 'warning',
                    'info-border': insight.type === 'info',
                    'error-border': insight.priority === 'high' && insight.type !== 'positive'
                  }">
                  <div class="insight-icon"
                    [ngClass]="{
                      'text-success': insight.type === 'positive',
                      'text-warning': insight.type === 'warning',
                      'text-info': insight.type === 'info',
                      'text-error': insight.priority === 'high' && insight.type !== 'positive'
                    }">
                    <i class="pi"
                      [class.pi-check-circle]="insight.type === 'positive'"
                      [class.pi-exclamation-triangle]="insight.type === 'warning'"
                      [class.pi-info-circle]="insight.type === 'info'"
                      [class.pi-bell]="insight.priority === 'high' && insight.type !== 'positive'">
                    </i>
                  </div>
                  <div class="insight-content">
                    <div class="insight-top">
                      <span class="insight-title">{{ insight.title }}</span>
                      <span class="pill small" [ngClass]="insight.priority === 'high' ? 'error-kit' : 'outline'">
                        {{ insight.priority }}
                      </span>
                    </div>
                    <p class="insight-msg">{{ insight.message }}</p>
                  </div>
                </div>
              }
            </div>
          </section>

          @if (dashboard()!.topCategories?.length) {
            <section class="soft-panel">
              <div class="panel-head">
                <h2>Category Performance</h2>
              </div>
              <div class="category-list">
                @for (cat of dashboard()!.topCategories; track cat.name) {
                  <div class="category-row">
                    <div class="cat-info">
                      <span class="cat-name">{{ cat.name }}</span>
                      <span class="text-muted text-xs font-mono">{{ cat.margin | number:'1.1-1' }}% margin</span>
                    </div>
                    <div class="cat-metrics">
                      <div class="metric-line">
                        <span class="metric-lbl">Revenue</span>
                        <div class="progress-track flex-1"><div class="progress-fill bg-primary" style="width:100%"></div></div>
                        <span class="metric-val">{{ cat.revenue | currency:'INR':'symbol':'1.0-0' }}</span>
                      </div>
                      <div class="metric-line">
                        <span class="metric-lbl">Profit</span>
                        <div class="progress-track flex-1">
                          <div class="progress-fill bg-success" [style.width.%]="Math.max((cat.profit / cat.revenue) * 100, 0)"></div>
                        </div>
                        <span class="metric-val text-success">{{ cat.profit | currency:'INR':'symbol':'1.0-0' }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <section class="soft-panel">
            <div class="panel-head">
              <h2>Stock Urgency Monitor</h2>
              <span class="pill error-kit">{{ dashboard()!.inventory.lowStockAlerts.length }} Critical</span>
            </div>
            <div class="grid-host">
              <app-ag-share-grid
                [columns]="alertColumns"
                [data]="dashboard()!.inventory.lowStockAlerts"
                class="premium-grid">
              </app-ag-share-grid>
            </div>
          </section>

        </div>

        <div class="bento-side">

          <section class="soft-panel">
            <div class="panel-head">
              <h2>Operations</h2>
            </div>
            <div class="stats-list">
              <div class="stat-row">
                <span class="text-muted fw-500">Avg Order Value</span>
                <strong class="font-mono">{{ dashboard()!.operations.orderEfficiency.averageOrderValue | currency:'INR':'symbol':'1.0-0' }}</strong>
              </div>
              <div class="stat-row">
                <span class="text-muted fw-500">Discount Rate</span>
                <strong class="font-mono">{{ dashboard()!.operations.discountMetrics.discountRate }}%</strong>
              </div>
              <div class="stat-row">
                <span class="text-muted fw-500">Cancellation Rate</span>
                <strong class="font-mono text-error">{{ dashboard()!.operations.orderEfficiency.cancellationRate }}%</strong>
              </div>
              <div class="stat-row">
                <span class="text-muted fw-500">Active Customers</span>
                <strong class="font-mono">{{ dashboard()!.financial.customers.active }}</strong>
              </div>
              <div class="stat-row">
                <span class="text-muted fw-500">New Customers</span>
                <span class="pill success-kit small">+{{ dashboard()!.financial.customers.new }}</span>
              </div>
            </div>
          </section>

          @if (dashboard()!.leaders.topProducts?.length) {
            <section class="soft-panel">
              <div class="panel-head">
                <h2>Top Products</h2>
              </div>
              <div class="leader-list">
                @for (prod of dashboard()!.leaders.topProducts; track prod._id; let i = $index) {
                  <div class="leader-row">
                    <div class="rank-circle">{{ i + 1 }}</div>
                    <div class="leader-info flex-1">
                      <span class="leader-name text-truncate" [title]="prod.name">{{ prod.name }}</span>
                      <span class="text-muted text-xs">{{ prod.soldQty }} sold</span>
                    </div>
                    <strong class="font-mono text-success">{{ prod.revenue | currency:'INR':'symbol':'1.0-0' }}</strong>
                  </div>
                }
              </div>
            </section>
          }

          @if (dashboard()!.leaders.topCustomers?.length) {
            <section class="soft-panel">
              <div class="panel-head">
                <h2>Top Customers</h2>
              </div>
              <div class="leader-list">
                @for (cust of dashboard()!.leaders.topCustomers; track cust._id) {
                  <div class="leader-row">
                    <div class="avatar" [style.background-color]="getAvatarColor(cust._id)">
                      {{ getInitials(cust.name) }}
                    </div>
                    <div class="leader-info flex-1">
                      <span class="leader-name">{{ cust.name }}</span>
                      <span class="text-muted text-xs">{{ cust.transactions }} orders</span>
                    </div>
                    <strong class="font-mono">{{ cust.totalSpent | currency:'INR':'symbol':'1.0-0' }}</strong>
                  </div>
                }
              </div>
            </section>
          }

          @if (dashboard()!.operations.topStaff?.length) {
            <section class="soft-panel">
              <div class="panel-head">
                <h2>Top Staff</h2>
              </div>
              <div class="leader-list">
                @for (staff of dashboard()!.operations.topStaff; track staff._id) {
                  <div class="leader-row">
                    <div class="avatar bg-primary text-white">
                      {{ getInitials(staff.name) }}
                    </div>
                    <div class="leader-info flex-1">
                      <span class="leader-name">{{ staff.name }}</span>
                      <span class="text-muted text-xs">{{ staff.count }} orders</span>
                    </div>
                    <strong class="font-mono text-primary">{{ staff.revenue | currency:'INR':'symbol':'1.0-0' }}</strong>
                  </div>
                }
              </div>
            </section>
          }

        </div>
      </div>
    </div>
  }
</div>
  `,
  styles: [`
    /* ==========================================================================
       "SOFT BENTO" THEME - Built on Canonical Tokens
       ========================================================================== */
    :root {
      --bg-app: #f4f7fb;
      --bg-surface: #ffffff;
      
      --text-main: #0f172a;
      --text-muted: #64748b;
      --text-light: #94a3b8;
      
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --success: #10b981;
      --warning: #f59e0b;
      --error: #ef4444;
      --info: #3b82f6;
      --purple: #a855f7;
      
      --border-soft: #e2e8f0;
      
      --radius-xl: 24px;
      --radius-lg: 16px;
      --radius-md: 12px;
      --radius-sm: 8px;
      --radius-pill: 9999px;
      
      --shadow-float: 0 10px 40px -10px rgba(15, 23, 42, 0.08);
      --shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      --shadow-inner: 0 2px 4px rgba(15, 23, 42, 0.02);
    }

    /* Core Layout */
    .dash-root { background-color: var(--bg-app); min-height: 100vh; font-family: 'Inter', system-ui, sans-serif; color: var(--text-main); }
    .dash-body { padding: 0 32px 40px 32px; display: flex; flex-direction: column; gap: 24px; max-width: 1600px; margin: 0 auto; }
    
    /* Utilities */
    .text-muted { color: var(--text-muted); }
    .text-main { color: var(--text-main); }
    .text-success { color: var(--success); }
    .text-error { color: var(--error); }
    .text-info { color: var(--info); }
    .text-warning { color: var(--warning); }
    .text-xs { font-size: 0.75rem; }
    .fw-500 { font-weight: 500; }
    .fw-600 { font-weight: 600; }
    .font-mono { font-family: ui-monospace, 'Fira Code', monospace; }
    .text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; max-width: 100%; }
    .w-100 { width: 100%; }
    .flex-1 { flex: 1; min-width: 0; }
    .ms-2 { margin-left: 8px; }
    .me-2 { margin-right: 8px; }

    /* Semantic Kits */
    .primary-kit { background: #e0e7ff; color: var(--primary); }
    .success-kit { background: #dcfce7; color: var(--success); border: 1px solid #bbf7d0; }
    .warning-kit { background: #fef3c7; color: var(--warning); border: 1px solid #fde68a; }
    .error-kit { background: #fef2f2; color: var(--error); border: 1px solid #fecaca; }
    .info-kit { background: #e0f2fe; color: var(--info); }
    .purple-kit { background: #f3e8ff; color: var(--purple); }
    
    .bg-primary { background: var(--primary); color: white; }
    .bg-success { background: var(--success); color: white; }
    .bg-error { background: var(--error); color: white; }

    /* Header */
    .classic-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 24px 32px; background: var(--bg-app); flex-wrap: wrap; gap: 16px;
    }
    .header-titles { display: flex; align-items: center; gap: 16px; }
    .icon-brand { width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--bg-surface); box-shadow: var(--shadow-float); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--primary); }
    .header-titles h1 { margin: 0 0 4px 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; }
    .header-titles p { margin: 0; font-size: 0.85rem; display: flex; align-items: center; }
    
    .header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .control-wrapper { box-shadow: var(--shadow-inner); border-radius: var(--radius-sm); }
    
    /* Buttons / Pills */
    .btn-pill, .pill {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      border-radius: var(--radius-pill); font-size: 0.85rem; font-weight: 600;
      white-space: nowrap;
    }
    .btn-pill { padding: 10px 20px; cursor: pointer; text-decoration: none; transition: all 0.2s; border: none; }
    .btn-pill.primary { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
    .btn-pill.primary:hover:not([disabled]) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4); }
    .btn-pill.icon-only { width: 40px; height: 40px; padding: 0; border-radius: 50%; }
    .btn-pill[disabled] { opacity: 0.6; cursor: not-allowed; }
    
    .pill { padding: 4px 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .pill.outline { background: var(--bg-surface); border: 1px solid var(--border-soft); color: var(--text-main); }
    .pill.small { padding: 2px 8px; font-size: 0.7rem; }

    /* Alerts */
    .alert-banner { border-radius: var(--radius-xl); padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; box-shadow: var(--shadow-card); }
    .alert-content { display: flex; align-items: center; gap: 16px; }
    .alert-icon { font-size: 1.8rem; }
    .alert-text h3 { margin: 0 0 4px 0; font-size: 1.05rem; }
    .alert-text p { margin: 0; font-size: 0.9rem; }
    .ribbon-items { display: flex; gap: 8px; flex-wrap: wrap; }

    /* KPI Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
    .kpi-card {
      background: var(--bg-surface); border-radius: var(--radius-xl); padding: 24px;
      display: flex; flex-direction: column; gap: 16px; box-shadow: var(--shadow-card);
      border: 1px solid var(--border-soft); transition: transform 0.2s;
    }
    .kpi-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-float); }
    .kpi-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .kpi-label { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-icon { width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .kpi-value { font-size: 2rem; font-weight: 800; color: var(--text-main); line-height: 1; font-family: var(--font-mono, monospace); letter-spacing: -0.02em; }
    .kpi-bottom { display: flex; align-items: center; }

    /* Progress Tracks */
    .progress-track { height: 6px; background: var(--bg-app); border-radius: var(--radius-pill); overflow: hidden; }
    .progress-fill { height: 100%; border-radius: var(--radius-pill); transition: width 0.8s cubic-bezier(0.2, 0.9, 0.2, 1); }

    /* Health Ring */
    .health-wrap { position: relative; width: 64px; height: 64px; align-self: flex-end; margin-top: -40px; }
    .health-ring { width: 100%; height: 100%; }
    .ring-track { fill: none; stroke: var(--bg-app); stroke-width: 3; }
    .ring-arc { fill: none; stroke-width: 3; stroke-linecap: round; transform: rotate(-90deg); transform-origin: 18px 18px; transition: stroke-dasharray 1s ease; }
    .health-good { stroke: var(--success); }
    .health-warn { stroke: var(--warning); }
    .health-bad { stroke: var(--error); }
    .health-value { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 0.85rem; font-weight: 800; color: var(--text-main); }

    /* Bento Layout */
    .bento-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; align-items: start; }
    @media (max-width: 1024px) { .bento-layout { grid-template-columns: 1fr; } }
    .bento-main, .bento-side { display: flex; flex-direction: column; gap: 24px; }

    /* Panels */
    .soft-panel { background: var(--bg-surface); border-radius: var(--radius-xl); padding: 24px; border: 1px solid var(--border-soft); box-shadow: var(--shadow-card); }
    .panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .panel-head h2 { font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; }

    /* Insights Grid */
    .insights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .insight-card { display: flex; gap: 16px; padding: 16px; border-radius: var(--radius-lg); background: var(--bg-app); border-left: 4px solid transparent; }
    .success-border { border-left-color: var(--success); }
    .warning-border { border-left-color: var(--warning); }
    .info-border { border-left-color: var(--info); }
    .error-border { border-left-color: var(--error); }
    .insight-icon { font-size: 1.25rem; margin-top: 2px; }
    .insight-content { flex: 1; }
    .insight-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .insight-title { font-weight: 700; font-size: 0.95rem; }
    .insight-msg { margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; }

    /* Categories List */
    .category-list { display: flex; flex-direction: column; gap: 20px; }
    .category-row { display: flex; gap: 24px; align-items: center; }
    @media (max-width: 600px) { .category-row { flex-direction: column; align-items: flex-start; gap: 12px; } }
    .cat-info { width: 180px; flex-shrink: 0; display: flex; flex-direction: column; gap: 4px; }
    .cat-name { font-weight: 700; font-size: 0.95rem; }
    .cat-metrics { flex: 1; display: flex; flex-direction: column; gap: 10px; width: 100%; }
    .metric-line { display: flex; align-items: center; gap: 12px; }
    .metric-lbl { width: 60px; font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
    .metric-val { width: 80px; text-align: right; font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700; }

    /* Side Panel Lists */
    .stats-list, .leader-list { display: flex; flex-direction: column; gap: 12px; }
    .stat-row, .leader-row { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-app); border-radius: var(--radius-md); }
    .leader-row { justify-content: flex-start; gap: 16px; }
    .rank-circle { width: 28px; height: 28px; border-radius: 50%; background: var(--bg-surface); border: 1px solid var(--border-soft); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; color: var(--primary); }
    .avatar { width: 40px; height: 40px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 0.9rem; }
    .leader-info { display: flex; flex-direction: column; gap: 2px; }
    .leader-name { font-weight: 600; font-size: 0.9rem; }

    /* AG Grid Host */
    .grid-host { height: 350px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-soft); }

    /* PrimeNG Overrides for Soft UI */
    ::ng-deep .soft-select .p-select,
    ::ng-deep .soft-datepicker .p-datepicker-input {
      border: 1px solid var(--border-soft) !important;
      border-radius: var(--radius-sm) !important;
      background: var(--bg-surface) !important;
      font-family: 'Inter', sans-serif !important;
      font-size: 0.9rem !important;
      box-shadow: none !important;
    }
    ::ng-deep .soft-select .p-select:hover,
    ::ng-deep .soft-datepicker .p-datepicker-input:hover { border-color: var(--text-light) !important; }
    ::ng-deep .soft-select .p-select.p-focus,
    ::ng-deep .soft-datepicker .p-datepicker-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.2) !important; }
    ::ng-deep .soft-select { min-width: 180px; }

    /* Loader */
    .loader-overlay { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 400px; }
    .loader-card { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 40px; background: var(--bg-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-card); }
    .loader-label { font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); font-size: 0.8rem; }
  `]
})
export class AdminDashboardUiComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  
  dashboard = signal<any>(null);
  loading = signal(true);
  Math = Math; // Template access

  masterList = inject(MasterListService);

  selectedBranch = '';
  dateRange: Date[] | null = null;
  alertColumns: any[] = [];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.setupColumns();
    this.loadDashboard();
  }

  setupColumns(): void {
    this.alertColumns = [
      {
        field: 'name',
        headerName: 'Product Name',
        flex: 2,
        cellStyle: { 'font-weight': '600', 'font-size': '0.85rem' }
      },
      {
        field: 'sku',
        headerName: 'SKU',
        flex: 1,
        cellStyle: { 'font-family': 'ui-monospace, monospace', 'font-size': '0.75rem', 'color': 'var(--text-muted)' }
      },
      {
        field: 'currentStock',
        headerName: 'Stock',
        flex: 1,
        cellStyle: (p: any) => ({
          'color': p.value === 0 ? 'var(--error)' : 'var(--warning)',
          'font-weight': '700',
          'font-family': 'ui-monospace, monospace'
        })
      },
      {
        field: 'urgency',
        headerName: 'Urgency',
        flex: 1,
        cellRenderer: (p: any) => {
          const bg = p.value === 'critical' ? '#fef2f2' : '#fffbeb';
          const color = p.value === 'critical' ? '#ef4444' : '#f59e0b';
          const border = p.value === 'critical' ? '#fecaca' : '#fde68a';
          return `<span style="
            font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
            padding: 4px 10px; border-radius: 9999px; display: inline-block; line-height: 1;
            background: ${bg}; color: ${color}; border: 1px solid ${border};
          ">${p.value}</span>`;
        }
      }
    ];
    this.cdr.detectChanges();
  }

  loadDashboard(): void {
    this.loading.set(true);

    let start: string | undefined;
    let end: string | undefined;

    if (this.dateRange?.length === 2) {
      start = this.dateRange[0]?.toISOString();
      end = this.dateRange[1]?.toISOString();
    }

    this.analyticsService.getDashboardOverview(start, end, this.selectedBranch).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { this.dashboard.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onFilterChange(): void { this.loadDashboard(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* Utility Methods for Template */
  customerName(order: any): string {
    const customer = order?.customerId;
    if (!customer) return 'Guest Customer';
    return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email || customer.phone || 'Customer';
  }

  getInitials(name: string): string {
    if (!name || name === 'Guest Customer') return 'G';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarColor(id: string): string {
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1'];
    if (!id) return colors[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  getHealthClass(score: number): string {
    if (score >= 70) return 'health-good';
    if (score >= 40) return 'health-warn';
    return 'health-bad';
  }
}



// import {
//   Component, OnInit, signal, computed,
//   ChangeDetectorRef, inject, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
// import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { TagModule } from 'primeng/tag';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { SelectModule } from 'primeng/select';
// import { DatePicker } from 'primeng/datepicker';

// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { MasterListService } from '../../core/services/master-list.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
// import { Subject } from "rxjs";
// import { takeUntil } from "rxjs/operators";

// @Component({
//   selector: 'app-admin-dashboard-ui',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   imports: [
//     CommonModule, FormsModule,
//     TagModule, TooltipModule, ProgressSpinnerModule,
//     SelectModule, DatePicker,
//     AgShareGrid
//   ],
//   template: `
// <div class="dash-root">

//   <!-- ═══════════════════════════════════════════════
//        HEADER BAR
//   ═══════════════════════════════════════════════════ -->
//   <header class="dash-header">
//     <div class="header-brand">
//       <span class="brand-dot"></span>
//       <div>
//         <h1 class="brand-title">Executive Dashboard</h1>
//         <p class="brand-period">
//           @if (dashboard()?.period) {
//             {{ dashboard()!.period.start | date:'d MMM' }} – {{ dashboard()!.period.end | date:'d MMM yyyy' }}
//             <span class="period-chip">{{ dashboard()!.period.days }}d</span>
//           } @else {
//             &mdash;
//           }
//         </p>
//       </div>
//     </div>

//     <div class="header-controls">

//       <div class="ctrl-group">
//         <label class="ctrl-label">Branch</label>
//         <p-select
//           appendTo="body"
//           [options]="masterList.branches()"
//           optionLabel="name"
//           optionValue="_id"
//           [(ngModel)]="selectedBranch"
//           (onChange)="onFilterChange()"
//           styleClass="dash-select"
//           placeholder="All branches">
//         </p-select>
//       </div>

//       <div class="ctrl-divider"></div>

//       <div class="ctrl-group">
//         <label class="ctrl-label">Period</label>
//         <p-datepicker
//           [(ngModel)]="dateRange"
//           selectionMode="range"
//           [showIcon]="true"
//           (onSelect)="onFilterChange()"
//           placeholder="Start – End"
//           styleClass="dash-datepicker">
//         </p-datepicker>
//       </div>

//       <div class="ctrl-divider"></div>

//       @if (dashboard()?.financial?.performance?.executionTime) {
//         <span class="exec-pill">
//           <i class="pi pi-bolt"></i>
//           {{ dashboard()!.financial.performance.executionTime }}
//         </span>
//       }

//       <button
//         class="icon-btn"
//         (click)="loadDashboard()"
//         [disabled]="loading()"
//         pTooltip="Refresh data"
//         tooltipPosition="bottom">
//         <i class="pi pi-refresh" [class.spin]="loading()"></i>
//       </button>

//     </div>
//   </header>

//   <!-- ═══════════════════════════════════════════════
//        LOADING STATE
//   ═══════════════════════════════════════════════════ -->
//   @if (loading()) {
//     <div class="loader-overlay">
//       <div class="loader-card">
//         <p-progressSpinner styleClass="w-8 h-8" strokeWidth="3"></p-progressSpinner>
//         <span class="loader-label">Synchronising data…</span>
//       </div>
//     </div>
//   }

//   <!-- ═══════════════════════════════════════════════
//        MAIN CONTENT
//   ═══════════════════════════════════════════════════ -->
//   @if (!loading() && dashboard()) {
//     <div class="dash-body">

//       <!-- ─── KPI STRIP ─── -->
//       <section class="kpi-strip" aria-label="Key performance indicators">

//         <!-- Gross Revenue -->
//         <article class="kpi-card kpi-card--revenue">
//           <div class="kpi-header">
//             <span class="kpi-label">Gross Revenue</span>
//             @if (dashboard()!.financial.totalRevenue.growth != null) {
//               <span class="badge badge--up">
//                 <i class="pi pi-arrow-up-right"></i>
//                 {{ dashboard()!.financial.totalRevenue.growth }}%
//               </span>
//             }
//           </div>
//           <p class="kpi-amount">₹{{ dashboard()!.financial.totalRevenue.value | number }}</p>
//           <p class="kpi-meta">{{ dashboard()!.financial.totalRevenue.count }} transaction(s)</p>
//           <div class="kpi-bar">
//             <div class="kpi-bar-fill" style="width:100%"></div>
//           </div>
//         </article>

//         <!-- Net Profit -->
//         <article class="kpi-card kpi-card--profit">
//           <div class="kpi-header">
//             <span class="kpi-label">Net Profit</span>
//             <span class="badge"
//               [class.badge--success]="dashboard()!.financial.netProfit.status === 'profitable'"
//               [class.badge--error]="dashboard()!.financial.netProfit.status !== 'profitable'">
//               {{ dashboard()!.financial.netProfit.status }}
//             </span>
//           </div>
//           <p class="kpi-amount kpi-amount--success">₹{{ dashboard()!.financial.netProfit.value | number }}</p>
//           <p class="kpi-meta">Margin: {{ dashboard()!.financial.netProfit.margin }}%</p>
//           <div class="kpi-bar">
//             <div class="kpi-bar-fill kpi-bar-fill--success"
//               [style.width.%]="dashboard()!.financial.netProfit.margin"></div>
//           </div>
//         </article>

//         <!-- Inventory Value -->
//         <article class="kpi-card kpi-card--inventory">
//           <div class="kpi-header">
//             <span class="kpi-label">Inventory Value</span>
//             <i class="pi pi-box kpi-icon"></i>
//           </div>
//           <p class="kpi-amount">₹{{ dashboard()!.inventory.summary.valuation | number:'1.0-0' }}</p>
//           <p class="kpi-meta">
//             {{ dashboard()!.inventory.inventoryValuation.totalItems }} items
//             · {{ dashboard()!.inventory.inventoryValuation.productCount }} SKUs
//           </p>
//           <div class="kpi-bar">
//             <div class="kpi-bar-fill kpi-bar-fill--info"
//               [style.width.%]="dashboard()!.inventory.healthScore"></div>
//           </div>
//         </article>

//         <!-- Outstanding -->
//         <article class="kpi-card kpi-card--debt">
//           <div class="kpi-header">
//             <span class="kpi-label">Outstanding Debt</span>
//             <i class="pi pi-exclamation-circle kpi-icon kpi-icon--error"></i>
//           </div>
//           <p class="kpi-amount kpi-amount--error">₹{{ dashboard()!.financial.outstanding.receivables | number }}</p>
//           <p class="kpi-meta">{{ dashboard()!.alerts.highRiskDebtCount }} high-risk account(s)</p>
//           <div class="kpi-bar">
//             <div class="kpi-bar-fill kpi-bar-fill--error" style="width:100%"></div>
//           </div>
//         </article>

//         <!-- Health Score Card -->
//         @if (dashboard()!.inventory.healthScore != null) {
//           <article class="kpi-card kpi-card--health">
//             <div class="kpi-header">
//               <span class="kpi-label">System Health</span>
//             </div>
//             <div class="health-wrap">
//               <svg viewBox="0 0 36 36" class="health-ring" aria-label="Health score ring">
//                 <path class="ring-track"
//                   d="M18 2.0845 a15.9155 15.9155 0 0 1 0 31.831 a15.9155 15.9155 0 0 1 0-31.831"/>
//                 <path class="ring-arc"
//                   [attr.stroke-dasharray]="dashboard()!.inventory.healthScore + ' 100'"
//                   [class.ring-arc--good]="dashboard()!.inventory.healthScore >= 70"
//                   [class.ring-arc--warn]="dashboard()!.inventory.healthScore >= 40 && dashboard()!.inventory.healthScore < 70"
//                   [class.ring-arc--bad]="dashboard()!.inventory.healthScore < 40"
//                   d="M18 2.0845 a15.9155 15.9155 0 0 1 0 31.831 a15.9155 15.9155 0 0 1 0-31.831"/>
//               </svg>
//               <span class="health-value">{{ dashboard()!.inventory.healthScore }}%</span>
//             </div>
//             <p class="kpi-meta">{{ dashboard()!.inventory.summary.criticalAlerts }} critical alerts</p>
//           </article>
//         }

//       </section>

//       <!-- ─── ALERTS RIBBON ─── -->
//       @if ((dashboard()!.alerts.lowStockCount ?? 0) > 0) {
//         <div class="alert-ribbon">
//           <i class="pi pi-exclamation-triangle"></i>
//           <strong>{{ dashboard()!.alerts.lowStockCount }} items</strong> below reorder level —
//           action required to prevent stockouts.
//           <span class="ribbon-items">
//             @for (item of dashboard()!.alerts.itemsToReorder.slice(0, 3); track item) {
//               <span class="ribbon-chip">{{ item }}</span>
//             }
//             @if (dashboard()!.alerts.itemsToReorder.length > 3) {
//               <span class="ribbon-chip ribbon-chip--more">
//                 +{{ dashboard()!.alerts.itemsToReorder.length - 3 }} more
//               </span>
//             }
//           </span>
//         </div>
//       }

//       <!-- ─── BODY GRID ─── -->
//       <div class="body-grid">

//         <!-- ══ MAIN COLUMN ══ -->
//         <div class="col-main">

//           <!-- AI Insights -->
//           <section class="panel">
//             <div class="panel-head">
//               <div class="panel-head-left">
//                 <span class="panel-icon"><i class="pi pi-sparkles"></i></span>
//                 <h2 class="panel-title">AI Business Insights</h2>
//               </div>
//               <span class="panel-chip">{{ dashboard()!.insights.count }} insights</span>
//             </div>

//             <div class="insights-list">
//               @for (insight of dashboard()!.insights.insights; track insight.title) {
//                 <div class="insight-item"
//                   [class.insight-item--positive]="insight.type === 'positive'"
//                   [class.insight-item--warning]="insight.type === 'warning'"
//                   [class.insight-item--info]="insight.type === 'info'">
//                   <span class="insight-icon">
//                     <i class="pi"
//                       [class.pi-check-circle]="insight.type === 'positive'"
//                       [class.pi-exclamation-triangle]="insight.type === 'warning'"
//                       [class.pi-info-circle]="insight.type === 'info'">
//                     </i>
//                   </span>
//                   <div class="insight-content">
//                     <div class="insight-top">
//                       <span class="insight-title">{{ insight.title }}</span>
//                       <span class="insight-priority"
//                         [class.insight-priority--high]="insight.priority === 'high'"
//                         [class.insight-priority--medium]="insight.priority === 'medium'">
//                         {{ insight.priority }}
//                       </span>
//                     </div>
//                     <p class="insight-msg">{{ insight.message }}</p>
//                   </div>
//                 </div>
//               }
//             </div>
//           </section>

//           <!-- Stock Urgency Monitor -->
//           <section class="panel">
//             <div class="panel-head">
//               <div class="panel-head-left">
//                 <span class="panel-icon panel-icon--error"><i class="pi pi-warehouse"></i></span>
//                 <h2 class="panel-title">Stock Urgency Monitor</h2>
//               </div>
//               <span class="panel-chip panel-chip--error">
//                 {{ dashboard()!.inventory.lowStockAlerts.length }} Critical
//               </span>
//             </div>
//             <div class="grid-host">
//               <app-ag-share-grid
//                 [columns]="alertColumns"
//                 [data]="dashboard()!.inventory.lowStockAlerts"
//                 class="compact-grid">
//               </app-ag-share-grid>
//             </div>
//           </section>

//           <!-- Top Categories -->
//           @if (dashboard()!.topCategories?.length) {
//             <section class="panel">
//               <div class="panel-head">
//                 <div class="panel-head-left">
//                   <span class="panel-icon"><i class="pi pi-chart-bar"></i></span>
//                   <h2 class="panel-title">Category Performance</h2>
//                 </div>
//               </div>
//               <div class="category-list">
//                 @for (cat of dashboard()!.topCategories; track cat.name) {
//                   <div class="category-row">
//                     <div class="category-info">
//                       <span class="category-name">{{ cat.name }}</span>
//                       <span class="category-margin">{{ cat.margin | number:'1.1-1' }}% margin</span>
//                     </div>
//                     <div class="category-bars">
//                       <div class="category-bar-wrap">
//                         <span class="bar-label">Revenue</span>
//                         <div class="bar-track">
//                           <div class="bar-fill bar-fill--accent" style="width:100%"></div>
//                         </div>
//                         <span class="bar-value">₹{{ cat.revenue | number:'1.0-0' }}</span>
//                       </div>
//                       <div class="category-bar-wrap">
//                         <span class="bar-label">Profit</span>
//                         <div class="bar-track">
//                           <div class="bar-fill bar-fill--success"
//                             [style.width.%]="(cat.profit / cat.revenue) * 100"></div>
//                         </div>
//                         <span class="bar-value">₹{{ cat.profit | number:'1.0-0' }}</span>
//                       </div>
//                     </div>
//                   </div>
//                 }
//               </div>
//             </section>
//           }

//         </div>

//         <!-- ══ SIDE COLUMN ══ -->
//         <aside class="col-side">

//           <!-- Operations -->
//           <section class="panel">
//             <h3 class="side-panel-title">
//               <i class="pi pi-cog"></i> Operations
//             </h3>
//             <ul class="stat-list" aria-label="Operational efficiency stats">
//               <li class="stat-row">
//                 <span class="stat-label">Avg Order Value</span>
//                 <span class="stat-value mono">₹{{ dashboard()!.operations.orderEfficiency.averageOrderValue | number:'1.0-0' }}</span>
//               </li>
//               <li class="stat-row">
//                 <span class="stat-label">Discount Rate</span>
//                 <span class="stat-value mono">{{ dashboard()!.operations.discountMetrics.discountRate }}%</span>
//               </li>
//               <li class="stat-row">
//                 <span class="stat-label">Cancellation Rate</span>
//                 <span class="stat-value mono">{{ dashboard()!.operations.orderEfficiency.cancellationRate }}%</span>
//               </li>
//               <li class="stat-row">
//                 <span class="stat-label">Active Customers</span>
//                 <span class="stat-value mono">{{ dashboard()!.financial.customers.active }}</span>
//               </li>
//               <li class="stat-row">
//                 <span class="stat-label">New Customers</span>
//                 <span class="stat-value mono stat-value--success">+{{ dashboard()!.financial.customers.new }}</span>
//               </li>
//               <li class="stat-row">
//                 <span class="stat-label">SKUs Sold</span>
//                 <span class="stat-value mono">{{ dashboard()!.financial.products.unique }}</span>
//               </li>
//             </ul>
//           </section>

//           <!-- Top Products -->
//           @if (dashboard()!.leaders.topProducts?.length) {
//             <section class="panel">
//               <h3 class="side-panel-title">
//                 <i class="pi pi-star"></i> Top Products
//               </h3>
//               <div class="leaders-list">
//                 @for (prod of dashboard()!.leaders.topProducts; track prod._id; let i = $index) {
//                   <div class="leader-row">
//                     <span class="leader-rank">#{{ i + 1 }}</span>
//                     <div class="leader-info">
//                       <p class="leader-name">{{ prod.name }}</p>
//                       <p class="leader-sub">{{ prod.soldQty }} sold · {{ prod.profit | number:'1.0-0' }} profit</p>
//                     </div>
//                     <span class="leader-revenue">₹{{ prod.revenue | number:'1.0-0' }}</span>
//                   </div>
//                 }
//               </div>
//             </section>
//           }

//           <!-- Top Customers -->
//           @if (dashboard()!.leaders.topCustomers?.length) {
//             <section class="panel">
//               <h3 class="side-panel-title">
//                 <i class="pi pi-users"></i> Top Customers
//               </h3>
//               <div class="leaders-list">
//                 @for (cust of dashboard()!.leaders.topCustomers; track cust._id; let i = $index) {
//                   <div class="leader-row">
//                     <span class="leader-avatar">{{ cust.name.charAt(0).toUpperCase() }}</span>
//                     <div class="leader-info">
//                       <p class="leader-name">{{ cust.name }}</p>
//                       <p class="leader-sub">{{ cust.transactions }} transaction(s)</p>
//                     </div>
//                     <span class="leader-revenue">₹{{ cust.totalSpent | number:'1.0-0' }}</span>
//                   </div>
//                 }
//               </div>
//             </section>
//           }

//           <!-- Customer Segments -->
//           @if (dashboard()!.customers?.segmentation?.length) {
//             <section class="panel">
//               <h3 class="side-panel-title">
//                 <i class="pi pi-chart-pie"></i> Segments
//               </h3>
//               <div class="seg-list">
//                 @for (seg of dashboard()!.customers.segmentation; track seg._id) {
//                   <div class="seg-row">
//                     <div class="seg-left">
//                       <span class="seg-dot"></span>
//                       <span class="seg-name">{{ seg._id }}</span>
//                     </div>
//                     <span class="seg-count">{{ seg.count }}</span>
//                   </div>
//                 }
//               </div>
//             </section>
//           }

//           <!-- Top Staff -->
//           @if (dashboard()!.operations.topStaff?.length) {
//             <section class="panel">
//               <h3 class="side-panel-title">
//                 <i class="pi pi-id-card"></i> Top Staff
//               </h3>
//               <div class="staff-list">
//                 @for (staff of dashboard()!.operations.topStaff; track staff._id) {
//                   <div class="staff-row">
//                     <span class="staff-avatar">{{ staff.name.charAt(0).toUpperCase() }}</span>
//                     <div class="staff-info">
//                       <p class="staff-name">{{ staff.name }}</p>
//                       <p class="staff-sub">{{ staff.count }} order(s)</p>
//                     </div>
//                     <span class="staff-rev">₹{{ staff.revenue | number:'1.0-0' }}</span>
//                   </div>
//                 }
//               </div>
//             </section>
//           }

//         </aside>
//       </div>

//     </div>
//   }

// </div>
//   `,
//   styles: [`
// /* ═══════════════════════════════════════════════════════════════════
//    EXECUTIVE DASHBOARD — REFINED EDITORIAL DARK SYSTEM
//    100% token-driven. Zero hardcoded color values.
//    Responsive: 1400 → 1024 → 768 → 480px breakpoints.
//    All color, spacing, typography from canonical token mapping.
//    ═══════════════════════════════════════════════════════════════════ */

// :host { display: block; width: 100%; }

// /* ─── Root ─── */
// .dash-root {
//   min-height: 100%;
//   background: var(--bg-secondary);
//   font-family: var(--font-body);
//   color: var(--text-primary);
//   display: flex;
//   flex-direction: column;
// }

// /* ═══════════════════════════════════════════════════════
//    HEADER
//    ═══════════════════════════════════════════════════════ */
// .dash-header {
//   position: sticky;
//   top: 0;
//   z-index: 10;
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   gap: var(--spacing-xl);
//   padding: var(--spacing-md) var(--spacing-2xl);
//   background: var(--bg-primary);
//   border-bottom: var(--ui-border-width) solid var(--border-primary);
//   box-shadow: var(--elevation-1);
//   flex-wrap: wrap;
// }

// /* Brand */
// .header-brand {
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-lg);
//   flex-shrink: 0;
// }

// .brand-dot {
//   width: 10px;
//   height: 10px;
//   border-radius: 50%;
//   background: var(--accent-primary);
//   box-shadow: 0 0 0 3px var(--accent-focus);
//   flex-shrink: 0;
// }

// .brand-title {
//   font-family: var(--font-heading);
//   font-size: var(--font-size-lg);
//   font-weight: var(--font-weight-bold);
//   color: var(--text-primary);
//   letter-spacing: -0.02em;
//   margin: 0;
//   line-height: 1;
// }

// .brand-period {
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   margin: var(--spacing-xs) 0 0;
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-sm);
// }

// .period-chip {
//   background: var(--bg-ternary);
//   border: var(--ui-border-width) solid var(--border-secondary);
//   color: var(--text-tertiary);
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   padding: 1px var(--spacing-sm);
//   border-radius: var(--ui-border-radius-pill);
//   font-family: var(--font-mono);
// }

// /* Controls */
// .header-controls {
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-md);
//   flex-wrap: wrap;
// }

// .ctrl-group {
//   display: flex;
//   flex-direction: column;
//   gap: 2px;
// }

// .ctrl-label {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.06em;
//   color: var(--text-tertiary);
//   line-height: 1;
// }

// .ctrl-divider {
//   width: var(--ui-border-width);
//   height: 28px;
//   background: var(--border-primary);
//   flex-shrink: 0;
// }

// .exec-pill {
//   display: inline-flex;
//   align-items: center;
//   gap: var(--spacing-xs);
//   font-family: var(--font-mono);
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   background: var(--bg-secondary);
//   border: var(--ui-border-width) solid var(--border-primary);
//   padding: var(--spacing-xs) var(--spacing-md);
//   border-radius: var(--ui-border-radius-sm);
//   white-space: nowrap;

//   i { color: var(--accent-primary); }
// }

// .icon-btn {
//   width: 32px;
//   height: 32px;
//   border: var(--ui-border-width) solid var(--border-primary);
//   background: var(--bg-secondary);
//   color: var(--text-secondary);
//   border-radius: var(--ui-border-radius-sm);
//   cursor: pointer;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-size: var(--font-size-base);
//   transition: var(--transition-fast);
//   flex-shrink: 0;

//   &:hover:not(:disabled) {
//     background: var(--component-bg-hover);
//     color: var(--accent-primary);
//     border-color: var(--accent-primary);
//   }

//   &:disabled { opacity: 0.45; cursor: not-allowed; }
// }

// .spin { animation: spin 0.7s linear infinite; }

// @keyframes spin { to { transform: rotate(360deg); } }

// /* ═══════════════════════════════════════════════════════
//    LOADING
//    ═══════════════════════════════════════════════════════ */
// .loader-overlay {
//   flex: 1;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   padding: var(--spacing-5xl);
// }

// .loader-card {
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   gap: var(--spacing-lg);
//   padding: var(--spacing-3xl) var(--spacing-4xl);
//   background: var(--bg-primary);
//   border: var(--ui-border-width) solid var(--border-primary);
//   border-radius: var(--ui-border-radius-lg);
//   box-shadow: var(--elevation-2);
// }

// .loader-label {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.1em;
//   color: var(--text-tertiary);
// }

// /* ═══════════════════════════════════════════════════════
//    BODY LAYOUT
//    ═══════════════════════════════════════════════════════ */
// .dash-body {
//   padding: var(--spacing-xl) var(--spacing-2xl);
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-xl);
//   flex: 1;

//   @media (max-width: 768px) {
//     padding: var(--spacing-lg) var(--spacing-lg);
//     gap: var(--spacing-lg);
//   }
// }

// /* ═══════════════════════════════════════════════════════
//    KPI STRIP
//    ═══════════════════════════════════════════════════════ */
// .kpi-strip {
//   display: grid;
//   grid-template-columns: repeat(5, 1fr);
//   gap: var(--spacing-lg);

//   @media (max-width: 1400px) { grid-template-columns: repeat(3, 1fr); }
//   @media (max-width: 900px)  { grid-template-columns: repeat(2, 1fr); }
//   @media (max-width: 480px)  { grid-template-columns: 1fr; }
// }

// .kpi-card {
//   background: var(--bg-primary);
//   border: var(--ui-border-width) solid var(--border-primary);
//   border-radius: var(--ui-border-radius);
//   padding: var(--spacing-lg);
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-sm);
//   transition: var(--transition-base);
//   position: relative;
//   overflow: hidden;

//   &::before {
//     content: '';
//     position: absolute;
//     top: 0; left: 0; right: 0;
//     height: 2px;
//     border-radius: var(--ui-border-radius) var(--ui-border-radius) 0 0;
//     background: var(--border-secondary);
//     transition: var(--transition-base);
//   }

//   &:hover {
//     transform: translateY(-2px);
//     box-shadow: var(--elevation-2);
//     border-color: var(--border-secondary);
//   }

//   &--revenue::before { background: var(--accent-primary); }
//   &--profit::before  { background: var(--color-success); }
//   &--debt::before    { background: var(--color-error); }
//   &--health::before  { background: var(--color-info); }
// }

// .kpi-header {
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   gap: var(--spacing-sm);
// }

// .kpi-label {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.07em;
//   color: var(--text-tertiary);
// }

// .kpi-icon {
//   font-size: var(--font-size-base);
//   color: var(--text-tertiary);
//   opacity: 0.6;

//   &--error { color: var(--color-error); opacity: 1; }
// }

// .kpi-amount {
//   font-family: var(--font-heading);
//   font-size: var(--font-size-3xl);
//   font-weight: var(--font-weight-bold);
//   color: var(--text-primary);
//   letter-spacing: -0.03em;
//   line-height: var(--line-height-tight);
//   margin: 0;

//   &--success { color: var(--color-success); }
//   &--error   { color: var(--color-error); }
// }

// .kpi-meta {
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   margin: 0;
// }

// .kpi-bar {
//   height: 3px;
//   background: var(--bg-ternary);
//   border-radius: var(--ui-border-radius-pill);
//   overflow: hidden;
//   margin-top: var(--spacing-xs);
// }

// .kpi-bar-fill {
//   height: 100%;
//   border-radius: var(--ui-border-radius-pill);
//   background: var(--accent-primary);
//   transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);

//   &--success { background: var(--color-success); }
//   &--error   { background: var(--color-error); }
//   &--info    { background: var(--color-info); }
// }

// /* Badges */
// .badge {
//   display: inline-flex;
//   align-items: center;
//   gap: 2px;
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: capitalize;
//   padding: 1px var(--spacing-sm);
//   border-radius: var(--ui-border-radius-pill);
//   background: var(--bg-ternary);
//   color: var(--text-tertiary);
//   border: var(--ui-border-width) solid var(--border-secondary);
//   white-space: nowrap;

//   &--up {
//     background: var(--color-success-bg);
//     color: var(--color-success);
//     border-color: var(--color-success-border);
//   }
//   &--success {
//     background: var(--color-success-bg);
//     color: var(--color-success);
//     border-color: var(--color-success-border);
//   }
//   &--error {
//     background: var(--color-error-bg);
//     color: var(--color-error);
//     border-color: var(--color-error-border);
//   }
// }

// /* ─── Health Ring ─── */
// .health-wrap {
//   position: relative;
//   width: 56px;
//   height: 56px;
//   margin: var(--spacing-sm) 0;
// }

// .health-ring {
//   width: 100%;
//   height: 100%;

//   .ring-track {
//     fill: none;
//     stroke: var(--bg-ternary);
//     stroke-width: 3;
//   }

//   .ring-arc {
//     fill: none;
//     stroke-width: 2.5;
//     stroke-linecap: round;
//     transform: rotate(-90deg);
//     transform-origin: 18px 18px;
//     animation: arc-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;

//     &--good { stroke: var(--color-success); }
//     &--warn { stroke: var(--color-warning); }
//     &--bad  { stroke: var(--color-error); }
//   }
// }

// @keyframes arc-in {
//   from { stroke-dasharray: 0 100; }
// }

// .health-value {
//   position: absolute;
//   inset: 0;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-family: var(--font-mono);
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   color: var(--text-primary);
// }

// /* ═══════════════════════════════════════════════════════
//    ALERT RIBBON
//    ═══════════════════════════════════════════════════════ */
// .alert-ribbon {
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-md);
//   padding: var(--spacing-md) var(--spacing-lg);
//   background: var(--color-warning-bg);
//   border: var(--ui-border-width) solid var(--color-warning-border);
//   border-radius: var(--ui-border-radius);
//   font-size: var(--font-size-sm);
//   color: var(--color-warning);
//   flex-wrap: wrap;

//   i {
//     font-size: var(--font-size-md);
//     flex-shrink: 0;
//   }

//   strong { color: var(--color-warning-dark); }
// }

// .ribbon-items {
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-xs);
//   flex-wrap: wrap;
//   margin-left: auto;
// }

// .ribbon-chip {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-medium);
//   padding: 1px var(--spacing-sm);
//   border-radius: var(--ui-border-radius-pill);
//   background: var(--color-warning-bg);
//   border: var(--ui-border-width) solid var(--color-warning-border);
//   color: var(--color-warning-dark);
//   white-space: nowrap;

//   &--more {
//     background: var(--bg-ternary);
//     border-color: var(--border-secondary);
//     color: var(--text-tertiary);
//   }
// }

// /* ═══════════════════════════════════════════════════════
//    BODY GRID
//    ═══════════════════════════════════════════════════════ */
// .body-grid {
//   display: grid;
//   grid-template-columns: 1fr 280px;
//   gap: var(--spacing-xl);
//   align-items: start;

//   @media (max-width: 1100px) { grid-template-columns: 1fr; }
// }

// .col-main,
// .col-side {
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-lg);
// }

// /* ═══════════════════════════════════════════════════════
//    PANEL BASE
//    ═══════════════════════════════════════════════════════ */
// .panel {
//   background: var(--bg-primary);
//   border: var(--ui-border-width) solid var(--border-primary);
//   border-radius: var(--ui-border-radius);
//   padding: var(--spacing-lg);
//   box-shadow: var(--shadow-sm);
// }

// .panel-head {
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   margin-bottom: var(--spacing-lg);
//   padding-bottom: var(--spacing-md);
//   border-bottom: var(--ui-border-width) solid var(--border-primary);
// }

// .panel-head-left {
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-md);
// }

// .panel-icon {
//   width: 28px;
//   height: 28px;
//   border-radius: var(--ui-border-radius-sm);
//   background: var(--accent-focus);
//   color: var(--accent-primary);
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-size: var(--font-size-sm);
//   flex-shrink: 0;

//   &--error {
//     background: var(--color-error-bg);
//     color: var(--color-error);
//   }
// }

// .panel-title {
//   font-family: var(--font-body);
//   font-size: var(--font-size-md);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-primary);
//   margin: 0;
// }

// .panel-chip {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   padding: 2px var(--spacing-md);
//   border-radius: var(--ui-border-radius-pill);
//   background: var(--bg-ternary);
//   color: var(--text-tertiary);
//   border: var(--ui-border-width) solid var(--border-secondary);

//   &--error {
//     background: var(--color-error-bg);
//     color: var(--color-error);
//     border-color: var(--color-error-border);
//   }
// }

// .side-panel-title {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.08em;
//   color: var(--text-tertiary);
//   margin: 0 0 var(--spacing-lg);
//   padding-bottom: var(--spacing-md);
//   border-bottom: var(--ui-border-width) solid var(--border-primary);
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-sm);

//   i { color: var(--accent-primary); font-size: var(--font-size-sm); }
// }

// /* ═══════════════════════════════════════════════════════
//    AI INSIGHTS
//    ═══════════════════════════════════════════════════════ */
// .insights-list {
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-md);
// }

// .insight-item {
//   display: flex;
//   gap: var(--spacing-md);
//   padding: var(--spacing-md) var(--spacing-lg);
//   border-radius: var(--ui-border-radius-sm);
//   background: var(--bg-secondary);
//   border-left: 3px solid var(--border-secondary);
//   transition: var(--transition-fast);

//   &:hover { background: var(--component-bg-hover); }

//   &--positive {
//     background: var(--color-success-bg);
//     border-left-color: var(--color-success);
//     .insight-icon i { color: var(--color-success); }
//   }
//   &--warning {
//     background: var(--color-warning-bg);
//     border-left-color: var(--color-warning);
//     .insight-icon i { color: var(--color-warning); }
//   }
//   &--info {
//     background: var(--color-info-bg);
//     border-left-color: var(--color-info);
//     .insight-icon i { color: var(--color-info); }
//   }
// }

// .insight-icon {
//   font-size: var(--font-size-md);
//   flex-shrink: 0;
//   margin-top: 1px;
//   i { color: var(--text-tertiary); }
// }

// .insight-content { flex: 1; min-width: 0; }

// .insight-top {
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   gap: var(--spacing-md);
//   margin-bottom: var(--spacing-xs);
// }

// .insight-title {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-primary);
// }

// .insight-priority {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.05em;
//   color: var(--text-tertiary);
//   background: var(--bg-ternary);
//   border: var(--ui-border-width) solid var(--border-secondary);
//   padding: 1px var(--spacing-sm);
//   border-radius: var(--ui-border-radius-pill);
//   flex-shrink: 0;

//   &--high   { background: var(--color-error-bg); color: var(--color-error); border-color: var(--color-error-border); }
//   &--medium { background: var(--color-warning-bg); color: var(--color-warning); border-color: var(--color-warning-border); }
// }

// .insight-msg {
//   font-size: var(--font-size-sm);
//   color: var(--text-secondary);
//   margin: 0;
//   line-height: var(--line-height-relaxed);
// }

// /* ═══════════════════════════════════════════════════════
//    AG-GRID HOST
//    ═══════════════════════════════════════════════════════ */
// .grid-host {
//   height: 300px;
//   border-radius: var(--ui-border-radius-sm);
//   overflow: hidden;
//   border: var(--ui-border-width) solid var(--border-primary);
// }

// /* ═══════════════════════════════════════════════════════
//    CATEGORY PERFORMANCE
//    ═══════════════════════════════════════════════════════ */
// .category-list { display: flex; flex-direction: column; gap: var(--spacing-lg); }

// .category-row {
//   display: flex;
//   gap: var(--spacing-xl);
//   align-items: flex-start;

//   @media (max-width: 600px) { flex-direction: column; gap: var(--spacing-md); }
// }

// .category-info { width: 160px; flex-shrink: 0; }

// .category-name {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-primary);
//   display: block;
// }

// .category-margin {
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   font-family: var(--font-mono);
// }

// .category-bars { flex: 1; display: flex; flex-direction: column; gap: var(--spacing-sm); }

// .category-bar-wrap { display: flex; align-items: center; gap: var(--spacing-md); }

// .bar-label {
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   width: 46px;
//   flex-shrink: 0;
//   text-align: right;
// }

// .bar-track {
//   flex: 1;
//   height: 6px;
//   background: var(--bg-ternary);
//   border-radius: var(--ui-border-radius-pill);
//   overflow: hidden;
// }

// .bar-fill {
//   height: 100%;
//   border-radius: var(--ui-border-radius-pill);
//   transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);

//   &--accent   { background: var(--accent-primary); }
//   &--success  { background: var(--color-success); }
// }

// .bar-value {
//   font-family: var(--font-mono);
//   font-size: var(--font-size-xs);
//   color: var(--text-secondary);
//   width: 80px;
//   flex-shrink: 0;
//   text-align: right;
// }

// /* ═══════════════════════════════════════════════════════
//    STAT LIST
//    ═══════════════════════════════════════════════════════ */
// .stat-list {
//   list-style: none;
//   margin: 0;
//   padding: 0;
//   display: flex;
//   flex-direction: column;
// }

// .stat-row {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   padding: var(--spacing-sm) 0;
//   border-bottom: var(--ui-border-width) solid var(--border-primary);

//   &:last-child { border-bottom: none; }
// }

// .stat-label {
//   font-size: var(--font-size-sm);
//   color: var(--text-secondary);
// }

// .stat-value {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-primary);

//   &.mono { font-family: var(--font-mono); }
//   &--success { color: var(--color-success); }
//   &--error   { color: var(--color-error); }
// }

// /* ═══════════════════════════════════════════════════════
//    LEADERS LIST (products, customers)
//    ═══════════════════════════════════════════════════════ */
// .leaders-list { display: flex; flex-direction: column; }

// .leader-row {
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-md);
//   padding: var(--spacing-sm) 0;
//   border-bottom: var(--ui-border-width) solid var(--border-primary);

//   &:last-child { border-bottom: none; }
// }

// .leader-rank {
//   font-family: var(--font-mono);
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   color: var(--accent-primary);
//   width: 20px;
//   flex-shrink: 0;
// }

// .leader-avatar {
//   width: 28px;
//   height: 28px;
//   border-radius: 50%;
//   background: var(--accent-focus);
//   color: var(--accent-primary);
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   flex-shrink: 0;
// }

// .leader-info { flex: 1; min-width: 0; }

// .leader-name {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-primary);
//   margin: 0;
//   white-space: nowrap;
//   overflow: hidden;
//   text-overflow: ellipsis;
// }

// .leader-sub {
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   margin: 0;
// }

// .leader-revenue {
//   font-family: var(--font-mono);
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-semibold);
//   color: var(--color-success);
//   flex-shrink: 0;
// }

// /* ═══════════════════════════════════════════════════════
//    CUSTOMER SEGMENTS
//    ═══════════════════════════════════════════════════════ */
// .seg-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }

// .seg-row {
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   padding: var(--spacing-md) var(--spacing-lg);
//   background: var(--bg-secondary);
//   border: var(--ui-border-width) solid var(--border-primary);
//   border-radius: var(--ui-border-radius-sm);
//   transition: var(--transition-fast);

//   &:hover { border-color: var(--border-secondary); background: var(--component-bg-hover); }
// }

// .seg-left { display: flex; align-items: center; gap: var(--spacing-md); }

// .seg-dot {
//   width: 6px;
//   height: 6px;
//   border-radius: 50%;
//   background: var(--accent-primary);
//   flex-shrink: 0;
// }

// .seg-name {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-medium);
//   color: var(--text-primary);
// }

// .seg-count {
//   font-family: var(--font-mono);
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   background: var(--accent-primary);
//   color: #fff;
//   padding: 1px var(--spacing-md);
//   border-radius: var(--ui-border-radius-pill);
// }

// /* ═══════════════════════════════════════════════════════
//    STAFF LIST
//    ═══════════════════════════════════════════════════════ */
// .staff-list { display: flex; flex-direction: column; }

// .staff-row {
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-md);
//   padding: var(--spacing-sm) 0;
//   border-bottom: var(--ui-border-width) solid var(--border-primary);

//   &:last-child { border-bottom: none; }
// }

// .staff-avatar {
//   width: 30px;
//   height: 30px;
//   border-radius: 50%;
//   background: var(--accent-focus);
//   color: var(--accent-primary);
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-bold);
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   flex-shrink: 0;
// }

// .staff-info { flex: 1; min-width: 0; }

// .staff-name {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-primary);
//   margin: 0;
//   white-space: nowrap;
//   overflow: hidden;
//   text-overflow: ellipsis;
// }

// .staff-sub {
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   margin: 0;
// }

// .staff-rev {
//   font-family: var(--font-mono);
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-semibold);
//   color: var(--color-success);
//   flex-shrink: 0;
// }

// /* ═══════════════════════════════════════════════════════
//    PRIMENG OVERRIDES — token-driven
//    ═══════════════════════════════════════════════════════ */
// ::ng-deep .dash-select {
//   .p-select {
//     border: var(--ui-border-width) solid var(--border-primary) !important;
//     border-radius: var(--ui-border-radius-sm) !important;
//     background: var(--bg-secondary) !important;
//     box-shadow: none !important;
//     min-width: 140px;

//     &:hover   { border-color: var(--border-secondary) !important; }
//     &.p-focus { border-color: var(--accent-primary) !important; box-shadow: 0 0 0 2px var(--accent-focus) !important; }
//   }

//   .p-select-label {
//     font-size: var(--font-size-sm) !important;
//     font-weight: var(--font-weight-medium) !important;
//     color: var(--text-primary) !important;
//     padding: var(--spacing-sm) var(--spacing-md) !important;
//     font-family: var(--font-body) !important;
//   }
// }

// ::ng-deep .dash-datepicker {
//   .p-datepicker-input {
//     border: var(--ui-border-width) solid var(--border-primary) !important;
//     border-radius: var(--ui-border-radius-sm) !important;
//     background: var(--bg-secondary) !important;
//     font-size: var(--font-size-sm) !important;
//     font-family: var(--font-body) !important;
//     color: var(--text-primary) !important;
//     padding: var(--spacing-sm) var(--spacing-md) !important;
//     width: 190px;

//     &:focus {
//       border-color: var(--accent-primary) !important;
//       box-shadow: 0 0 0 2px var(--accent-focus) !important;
//       outline: none !important;
//     }
//   }
// }

// /* ═══════════════════════════════════════════════════════
//    SCROLLBAR — themed
//    ═══════════════════════════════════════════════════════ */
// * {
//   scrollbar-width: thin;
//   scrollbar-color: var(--scroll-thumb) var(--scroll-track);
// }

// ::-webkit-scrollbar { width: 5px; height: 5px; }
// ::-webkit-scrollbar-track { background: var(--scroll-track); }
// ::-webkit-scrollbar-thumb {
//   background: var(--scroll-thumb);
//   border-radius: var(--ui-border-radius-pill);
// }
//   `]
// })
// export class AdminDashboardUiComponent implements OnInit, OnDestroy {
//     private readonly destroy$ = new Subject<void>();
//   dashboard = signal<any>(null);
//   loading = signal(true);

//   masterList = inject(MasterListService);

//   selectedBranch = '';
//   dateRange: Date[] | null = null;
//   alertColumns: any[] = [];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) { }

//   ngOnInit(): void {
//     this.setupColumns();
//     this.loadDashboard();
//   }

//   setupColumns(): void {
//     this.alertColumns = [
//       {
//         field: 'name',
//         headerName: 'Item',
//         flex: 2,
//         cellStyle: { 'font-weight': 'var(--font-weight-semibold)', 'font-size': 'var(--font-size-sm)' }
//       },
//       {
//         field: 'sku',
//         headerName: 'SKU',
//         flex: 1,
//         cellStyle: { 'font-family': 'var(--font-mono)', 'font-size': 'var(--font-size-xs)', 'color': 'var(--text-tertiary)' }
//       },
//       {
//         field: 'currentStock',
//         headerName: 'Stock',
//         flex: 1,
//         cellStyle: (p: any) => ({
//           'color': p.value === 0 ? 'var(--color-error)' : 'var(--color-warning)',
//           'font-weight': 'var(--font-weight-bold)',
//           'font-family': 'var(--font-mono)',
//           'font-size': 'var(--font-size-sm)'
//         })
//       },
//       {
//         field: 'reorderLevel',
//         headerName: 'Reorder',
//         flex: 1,
//         cellStyle: { 'color': 'var(--text-tertiary)', 'font-size': 'var(--font-size-sm)' }
//       },
//       {
//         field: 'urgency',
//         headerName: 'Urgency',
//         flex: 1,
//         cellRenderer: (p: any) =>
//           `<span style="
//             display:inline-flex; align-items:center;
//             font-size:var(--font-size-xs); font-weight:var(--font-weight-bold);
//             text-transform:uppercase; letter-spacing:0.05em;
//             padding:1px 6px; border-radius:9999px;
//             background:var(--color-error-bg); color:var(--color-error);
//             border:1px solid var(--color-error-border);
//           ">${p.value}</span>`
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//   loadDashboard(): void {
//     this.loading.set(true);

//     let start: string | undefined;
//     let end: string | undefined;

//     if (this.dateRange?.length === 2) {
//       start = this.dateRange[0]?.toISOString();
//       end = this.dateRange[1]?.toISOString();
//     }

//     this.analyticsService.getDashboardOverview(start, end, this.selectedBranch).pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res) => { this.dashboard.set(res.data); this.loading.set(false); },
//       error: () => this.loading.set(false)
//     });
//   }

//   onFilterChange(): void { this.loadDashboard(); }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//     }
// }
