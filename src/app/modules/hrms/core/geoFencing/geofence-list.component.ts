import { ChangeDetectorRef, Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { AppMessageService } from '../../../../core/services/message.service';
import { AgShareGrid } from '../../../shared/components/ag-shared-grid';
import { HRMSService } from '../../hrms.service';


@Component({
  selector: 'app-geofence-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AgShareGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="list-page-container fade-in">
      <div class="themed-card list-content-area">

        <div class="se-filter-bar">
          <div class="se-filter-field">
            <label>Search</label>
            <input type="text" [(ngModel)]="filter.search" (keydown.enter)="applyFilters()" (blur)="applyFilters()" placeholder="Name or Code..." class="se-input w-full" />
          </div>

          <div class="se-filter-field">
            <label>Fence Type</label>
            <div class="select-wrapper w-full">
              <select [(ngModel)]="filter.type" (change)="applyFilters()" class="se-input w-full">
                <option [ngValue]="null">All Types</option>
                <option value="circle">Circular Fence</option>
                <option value="polygon">Polygon</option>
                <option value="building">Building</option>
              </select>
            </div>
          </div>

          <div class="se-filter-field">
            <label>Status</label>
            <div class="select-wrapper w-full">
              <select [(ngModel)]="filter.isActive" (change)="applyFilters()" class="se-input w-full">
                <option [ngValue]="null">All Statuses</option>
                <option [ngValue]="true">Active</option>
                <option [ngValue]="false">Inactive</option>
              </select>
            </div>
          </div>

          <div class="se-filter-actions">
            <button class="btn btn-outline" (click)="resetFilters()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              Reset
            </button>
          </div>

          <div class="se-filter-right">
            <button class="btn btn-primary" (click)="createNew()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              Create Geofence
            </button>
          </div>
        </div>

        <div class="list-grid-wrapper">
          <app-ag-share-grid 
            [columns]="column" 
            [data]="data" 
            [showActions]="true" 
            selectionMode="single"
            (gridEvent)="eventFromGrid($event)">
          </app-ag-share-grid>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background-color: var(--bg-secondary); font-family: var(--font-body); color: var(--text-primary); }
    .list-page-container { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; height: calc(100vh - 80px); display: flex; flex-direction: column; }
    .themed-card { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .list-content-area { padding: var(--spacing-xl); gap: var(--spacing-xl); }
    .se-filter-bar { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--spacing-lg); padding-bottom: var(--spacing-lg); border-bottom: 1px solid var(--border-primary); }
    .se-filter-field { display: flex; flex-direction: column; gap: var(--spacing-xs); min-width: 180px; }
    .se-filter-field label { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
    .se-filter-actions { display: flex; align-items: flex-end; margin-bottom: 2px; }
    .se-filter-right { margin-left: auto; display: flex; align-items: flex-end; margin-bottom: 2px; }
    .w-full { width: 100%; }
    .se-input { width: 100%; background: var(--bg-primary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius); padding: var(--spacing-md) var(--spacing-lg); font-size: var(--font-size-sm); color: var(--text-primary); outline: none; box-sizing: border-box; height: 38px; }
    .se-input:focus { border-color: var(--color-primary); }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0 var(--spacing-xl); height: 38px; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); border-radius: var(--ui-border-radius); cursor: pointer; border: 1px solid transparent; }
    .btn-outline { background: var(--bg-primary); border-color: var(--border-secondary); color: var(--text-primary); }
    .btn-primary { background: var(--color-primary); color: #ffffff; }
    .list-grid-wrapper { flex: 1; height: 100%; min-height: 0; }
    .select-wrapper { position: relative; } select.se-input { appearance: none; padding-right: 2.5rem; cursor: pointer; }
    .select-wrapper::after { content: ""; position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); width: 10px; height: 6px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; pointer-events: none; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } .fade-in { animation: fadeIn 0.3s ease-out; }
  `]
})
export class GeofenceListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);

  data: any[] = [];
  column: any[] = [];
  filter = { search: '', type: null, isActive: null };
  isLoading = false;

  ngOnInit() {
    this.setupColumns();
    this.getData();
  }

  getData() {
    this.isLoading = true;
    this.hrmsService.getGeoFences(this.filter).subscribe({
      next: (res: any) => {
        this.data = res.data?.geofences || res.data || [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => this.isLoading = false
    });
  }

  applyFilters() { this.getData(); }
  resetFilters() { this.filter = { search: '', type: null, isActive: null }; this.getData(); }
  createNew() { this.router.navigate(['/hrms/attendance/geofences/new']); }

  eventFromGrid(event: any) {
    const id = event?.row?._id;
    if (event.type === 'editStart') this.router.navigate(['/hrms/attendance/geofences/edit', id]);
    else if (event.type === 'cellClicked') this.router.navigate(['/hrms/attendance/geofences/details', id]);
    else if (event.type === 'delete') this.deleteFence(id, event.row.name);
  }

  deleteFence(id: string, name: string) {
    if(confirm(`Delete Geofence ${name}?`)) {
      this.hrmsService.deleteGeoFence(id).subscribe({
        next: () => { this.messageService.showSuccess( 'Geofence removed'); this.getData(); },
        error: (err) => this.messageService.handleHttpError(err)
      });
    }
  }

  setupColumns() {
    this.column = [
      {
        field: 'name', headerName: 'Geofence Name', width: 250, pinned: 'left',
        cellRenderer: (p: any) => {
          return `
            <div style="display:flex; flex-direction:column; justify-content:center; height:100%; gap:2px;">
              <span style="font-weight:600; color:var(--text-primary); font-size:13px;">${p.value}</span>
              <span style="font-size:10px; color:var(--text-secondary); font-family:monospace; background:var(--bg-secondary); padding:2px 6px; border-radius:4px; width:max-content;">${p.data.code}</span>
            </div>`;
        }
      },
      {
        headerName: 'Type & Radius', width: 180,
        cellRenderer: (p: any) => {
          const type = p.data?.type || 'circle';
          const radius = p.data?.radius ? `${p.data.radius}m` : '-';
          return `
            <div style="display:flex; align-items:center; gap:8px; height:100%;">
              <span style="text-transform:capitalize; font-weight:500; font-size:12px;">${type}</span>
              <span style="color:var(--color-primary); font-size:11px; background:color-mix(in srgb, var(--color-primary) 10%, transparent); padding:2px 8px; border-radius:99px;">${radius}</span>
            </div>`;
        }
      },
      {
        headerName: 'Applicability', width: 180,
        cellRenderer: (p: any) => {
          if (p.data?.applicableToAll) return `<span style="color:var(--text-secondary); font-size:12px;">All Employees</span>`;
          const depts = p.data?.applicableDepartments?.length || 0;
          return `<span style="color:var(--text-secondary); font-size:12px;">Restricted (${depts} Depts)</span>`;
        }
      },
      {
        headerName: 'Status', field: 'isActive', width: 120,
        cellRenderer: (p: any) => {
          const s = p.value;
          const bg = s ? '#ecfdf5' : '#fef2f2';
          const color = s ? '#15803d' : '#b91c1c';
          return `<span style="background:${bg}; color:${color}; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:bold; text-transform:uppercase;">${s ? 'Active' : 'Inactive'}</span>`;
        }
      }
    ];
  }
}