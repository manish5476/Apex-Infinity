import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { finalize, Subject } from 'rxjs';

import { UserManagementService, User } from '../user-management.service';
import { AppMessageService } from '../../../core/services/message.service';
import { takeUntil } from "rxjs/operators";

interface PermissionItem {
  tag: string;
  group: string;
  description: string;
  state: 'grant' | 'revoke' | 'none';
}

@Component({
  selector: 'app-user-permission-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectButtonModule, TooltipModule],
  templateUrl: './user-permission-dialog.component.html',
  styleUrl: './user-permission-dialog.component.scss'
})
export class UserPermissionDialogComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private userService = inject(UserManagementService);
  private messageService = inject(AppMessageService);

  // Data from config
  user: User = this.config.data.user;

  // State
  allPermissions = signal<PermissionItem[]>([]);
  searchQuery = signal('');
  isLoading = signal(true);
  isSaving = signal(false);

  // Computed grouped permissions for the UI
  groupedPermissions = computed(() => {
    const search = this.searchQuery().toLowerCase();
    const filtered = this.allPermissions().filter(p => 
      p.tag.toLowerCase().includes(search) || 
      p.description.toLowerCase().includes(search) ||
      p.group.toLowerCase().includes(search)
    );

    const groups: { [key: string]: PermissionItem[] } = {};
    filtered.forEach(p => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    });

    return Object.keys(groups).sort().map(key => ({
      name: key,
      items: groups[key]
    }));
  });

  // Count granted/revoked for summary pills
  grantedCount = computed(() => this.allPermissions().filter(p => p.state === 'grant').length);
  revokedCount = computed(() => this.allPermissions().filter(p => p.state === 'revoke').length);

  // Options for the 3-state selector
  stateOptions = [
    { label: 'None', value: 'none', icon: 'pi pi-minus-circle' },
    { label: 'Grant', value: 'grant', icon: 'pi pi-plus-circle' },
    { label: 'Revoke', value: 'revoke', icon: 'pi pi-ban' }
  ];

  ngOnInit(): void {
    this.fetchPermissions();
  }

  fetchPermissions() {
    this.isLoading.set(true);
    this.userService.getAllAvailablePermissions().pipe(
      finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => {
        const available = res.data.permissions;
        const granted = new Set(this.user.permissionOverrides?.granted || []);
        const revoked = new Set(this.user.permissionOverrides?.revoked || []);

        const mapped: PermissionItem[] = available.map((p: any) => ({
          ...p,
          state: granted.has(p.tag) ? 'grant' : (revoked.has(p.tag) ? 'revoke' : 'none')
        }));

        this.allPermissions.set(mapped);
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  save() {
    this.isSaving.set(true);
    
    const grant = this.allPermissions().filter(p => p.state === 'grant').map(p => p.tag);
    const revoke = this.allPermissions().filter(p => p.state === 'revoke').map(p => p.tag);

    this.userService.updatePermissionOverrides(this.user._id, { grant, revoke }).pipe(
      finalize(() => this.isSaving.set(false)), takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess(`Permission overrides updated for ${this.user.name}.`);
        this.ref.close(true);
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  close() {
    this.ref.close();
  }

  onSearch(event: any) {
    this.searchQuery.set(event.target.value);
  }

  resetAll() {
    const reset = this.allPermissions().map(p => ({ ...p, state: 'none' as const }));
    this.allPermissions.set(reset);
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
