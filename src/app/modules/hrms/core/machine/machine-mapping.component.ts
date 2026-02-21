import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';



@Component({
  selector: 'app-machine-mapping',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-fullscreen-wrapper fade-in">
      <header class="dashboard-header glass-header">
        <div class="header-left">
          <button class="icon-btn back-btn" type="button" (click)="goBack()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
          <div>
            <h1 class="page-title">Device User Mapping</h1>
            <p class="page-subtitle">Link HRMS employees to their hardware Device IDs.</p>
          </div>
        </div>
        <div class="header-right">
          <button class="icon-btn" (click)="loadData()" title="Refresh" [class.spinning]="isLoading()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
        </div>
      </header>

      <main class="dashboard-content">
        <div class="grid-card filter-card card-anim-1 mb-4">
          <div class="se-filter-bar" style="border:none; padding:0;">
            <div class="se-filter-field" style="flex:1; max-width: 400px;">
              <label>Target Machine</label>
              <div class="select-wrapper">
                <select [(ngModel)]="selectedMachineId" class="se-input w-full">
                  <option [ngValue]="null">-- Select Machine --</option>
                  @for (m of machines(); track m._id) {
                    <option [value]="m._id">{{ m.name }} ({{ m.serialNumber }})</option>
                  }
                </select>
              </div>
            </div>
            <div class="se-filter-actions" style="margin-left: auto;">
              <button class="btn btn-primary" (click)="bulkMap()" [disabled]="!selectedMachineId || selectedUsers().length === 0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Sync Selected ({{ selectedUsers().length }})
              </button>
            </div>
          </div>
        </div>

        <div class="grid-card table-card card-anim-2">
          <div class="table-container" [class.loading-opacity]="isLoading()">
            <table class="se-table">
              <thead>
                <tr>
                  <th style="width: 40px;"><input type="checkbox" (change)="toggleAll($event)"></th>
                  <th>Employee Info</th>
                  <th>Department</th>
                  <th>Hardware Device ID</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                @if (unmappedUsers().length === 0 && !isLoading()) {
                  <tr><td colspan="5" class="empty-state">All employees are fully mapped!</td></tr>
                }
                @for (user of unmappedUsers(); track user._id) {
                  <tr>
                    <td>
                      <input type="checkbox" [checked]="user._selected" (change)="toggleUser(user)">
                    </td>
                    <td>
                      <div class="primary-text">{{ user.name }}</div>
                      <div class="secondary-text">{{ user.employeeId || user.email }}</div>
                    </td>
                    <td><span class="badge badge-neutral">{{ user.department?.name || 'N/A' }}</span></td>
                    <td>
                      <input type="text" [(ngModel)]="user._machineUserId" class="se-input" placeholder="e.g. 101" style="max-width: 150px; height: 32px;" [disabled]="!selectedMachineId">
                    </td>
                    <td style="text-align: right;">
                      <button class="btn btn-outline btn-sm" (click)="singleMap(user)" [disabled]="!selectedMachineId || !user._machineUserId">
                        Link User
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    /* Using Standard Variables & Structure */
    :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); }
    .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); border-bottom: 1px solid var(--border-primary); }
    .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
    .icon-btn { background: var(--component-bg); border: 1px solid var(--border-primary); color: var(--text-secondary); width: 38px; height: 38px; border-radius: var(--ui-border-radius); display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .page-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
    .page-subtitle { font-size: 0.75rem; color: var(--text-secondary); margin: 0; }
    
    .dashboard-content { flex: 1; padding: var(--spacing-xl); overflow-y: auto; background: var(--bg-primary); }
    .grid-card { background: var(--component-bg); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); }
    .table-card { padding: 0; overflow: hidden; }
    .mb-4 { margin-bottom: 1rem; }
    
    .se-filter-bar { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--spacing-lg); }
    .se-filter-field { display: flex; flex-direction: column; gap: 4px; }
    .se-filter-field label { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); }
    .se-input { background: var(--bg-primary); border: 1px solid var(--border-secondary); padding: 0.4rem 0.6rem; border-radius: 4px; font-size: 0.875rem; color: var(--text-primary); outline: none; }
    .w-full { width: 100%; }
    .select-wrapper { position: relative; } select.se-input { appearance: none; padding-right: 2rem; cursor: pointer; }
    
    .btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; border-radius: 4px; cursor: pointer; border: 1px solid transparent; }
    .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
    .btn-primary { background: var(--color-primary); color: white; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-outline { background: var(--bg-primary); border-color: var(--border-secondary); color: var(--text-primary); }
    .btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .se-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; }
    .se-table th { padding: 12px 16px; background: var(--component-surface-raised); color: var(--text-secondary); font-weight: 600; text-transform: uppercase; font-size: 0.7rem; border-bottom: 1px solid var(--border-primary); }
    .se-table td { padding: 12px 16px; border-bottom: 1px solid var(--border-secondary); vertical-align: middle; }
    .primary-text { font-weight: 600; color: var(--text-primary); }
    .secondary-text { font-size: 0.75rem; color: var(--text-tertiary); }
    .badge-neutral { background: var(--bg-secondary); padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; border: 1px solid var(--border-secondary); }
    .empty-state { text-align: center; padding: 3rem !important; color: var(--text-tertiary); font-style: italic; }
    .loading-opacity { opacity: 0.5; pointer-events: none; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .card-anim-1 { animation: popIn 0.3s ease-out both; }
    .card-anim-2 { animation: popIn 0.3s ease-out 0.1s both; }
  `]
})
export class MachineMappingComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);

  isLoading = signal(false);
  machines = signal<any[]>([]);
  selectedMachineId: string | null = null;
  unmappedUsers = signal<any[]>([]);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    // Fetch machines for dropdown
    this.hrmsService.getMachines().subscribe(res => {
      this.machines.set(res.data?.machines || res.data || []);
    });

    // Fetch unmapped users
    this.hrmsService.getUnmappedUsers().pipe(finalize(() => this.isLoading.set(false))).subscribe(res => {
      const users = res.data?.users || res.data || [];
      // Attach local state properties to the objects
      const formatted = users.map((u: any) => ({ ...u, _selected: false, _machineUserId: '' }));
      this.unmappedUsers.set(formatted);
    });
  }

  // --- Checkbox Logic ---
  toggleAll(event: any) {
    const checked = event.target.checked;
    this.unmappedUsers.update(users => users.map(u => ({ ...u, _selected: checked })));
  }

  toggleUser(user: any) {
    user._selected = !user._selected;
    this.unmappedUsers.update(users => [...users]); // trigger reactivity
  }

  selectedUsers() {
    return this.unmappedUsers().filter(u => u._selected && u._machineUserId);
  }

  // --- API Calls ---
  singleMap(user: any) {
    this.isLoading.set(true);
    this.hrmsService.mapUserToMachine({ userId: user._id, machineUserId: user._machineUserId }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Mapped', `${user.name} linked successfully.`);
        // Remove mapped user from list
        this.unmappedUsers.update(users => users.filter(u => u._id !== user._id));
      },
      error: (err) => this.messageService.showError('Error', err.message || 'Mapping failed.')
    });
  }

  bulkMap() {
    const selected = this.selectedUsers();
    if (!selected.length) return;

    const mappings = selected.map(u => ({ userId: u._id, machineUserId: u._machineUserId }));
    
    this.isLoading.set(true);
    this.hrmsService.bulkMapUsers(mappings, this.selectedMachineId!).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Bulk Mapped', `${mappings.length} users synced.`);
        // Remove mapped users from list
        const mappedIds = mappings.map(m => m.userId);
        this.unmappedUsers.update(users => users.filter(u => !mappedIds.includes(u._id)));
      },
      error: (err) => this.messageService.showError('Error', err.message || 'Bulk map failed.')
    });
  }

  goBack() { this.router.navigate(['/hrms/attendance/machines']); }
}