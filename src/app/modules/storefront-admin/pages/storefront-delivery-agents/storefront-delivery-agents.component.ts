import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
import { catchError, of } from 'rxjs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';
import { AuthService } from '../../../auth/services/auth-service';
import { AppMessageService } from '@core/services/message.service';

@Component({
  selector: 'app-storefront-delivery-agents',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, TagModule, TooltipModule, DrawerModule],
  templateUrl: './storefront-delivery-agents.component.html',
  styleUrls: ['./storefront-delivery-agents.component.scss']
})
export class StorefrontDeliveryAgentsComponent implements OnInit {
  private readonly adminService = inject(StorefrontAdminService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(AppMessageService);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly agents = signal<any[]>([]);
  readonly drawerVisible = signal(false);
  readonly selectedAgent = signal<any | null>(null);
  formAgent = {
    name: '',
    phone: '',
    email: '',
    password: '',
    vehicleType: 'van',
    vehicleRegistrationNumber: '',
    alternatePhone: '',
    isActive: true
  };

  readonly cols = [
    { field: 'name', header: 'Name' },
    { field: 'phone', header: 'Phone' },
    { field: 'vehicleType', header: 'Vehicle' },
    { field: 'vehicleRegistrationNumber', header: 'Reg. Number' },
    { field: 'isActive', header: 'Status' }
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getDeliveryAgents({ limit: 100 }).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Unable to load agents.');
        return of({ data: [] });
      })
    ).subscribe((res: any) => {
      this.agents.set(res?.data ?? []);
      this.loading.set(false);
    });
  }

  openNew(): void {
    this.selectedAgent.set(null);
    this.formAgent = {
      name: '',
      phone: '',
      email: '',
      password: '',
      vehicleType: 'van',
      vehicleRegistrationNumber: '',
      alternatePhone: '',
      isActive: true
    };
    this.drawerVisible.set(true);
  }

  openEdit(agent: any): void {
    this.selectedAgent.set(agent);
    this.formAgent = {
      name: agent.name,
      phone: agent.phone,
      email: agent.email || '',
      password: '', // blank intentionally for edit
      vehicleType: agent.vehicleType || 'van',
      vehicleRegistrationNumber: agent.vehicleRegistrationNumber || '',
      alternatePhone: agent.alternatePhone || '',
      isActive: agent.isActive !== false // default true
    };
    this.drawerVisible.set(true);
  }

  closeDrawer(): void {
    this.drawerVisible.set(false);
    this.selectedAgent.set(null);
  }

  saveAgent(): void {
    if (!this.formAgent.name || !this.formAgent.phone || !this.formAgent.email) {
      this.error.set('Name, Phone, and Email are required.');
      return;
    }

    if (!this.selectedAgent() && !this.formAgent.password) {
      this.error.set('Password is required for new agents.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const payload = { ...this.formAgent };
    if (!payload.password) {
      delete (payload as any).password;
    }

    const obs$ = this.selectedAgent()
      ? this.adminService.updateDeliveryAgent(this.selectedAgent()._id, payload)
      : this.adminService.createDeliveryAgent(payload);

    obs$.subscribe({
      next: () => {
        this.closeDrawer();
        this.load();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to save agent.');
      }
    });
  }

  deleteAgent(agent: any, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete agent ${agent.name}?`)) {
      this.loading.set(true);
      this.adminService.deleteDeliveryAgent(agent._id).subscribe({
        next: () => {
          this.load();
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? 'Failed to delete agent.');
        }
      });
    }
  }

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  shareLoginLink(agent: any, event: Event): void {
    event.stopPropagation();
    const orgSlug = this.authService.getOrganizationSlug();
    if (!orgSlug) {
      this.error.set('Could not determine your organization ID. Link generation failed.');
      return;
    }
    const origin = window.location.origin;
    const loginLink = `${origin}/store/${orgSlug}/delivery/login`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(loginLink).then(() => {
      this.messageService.showSuccess(`Login link copied to clipboard. You can now send it to ${agent.name}.`);
    }).catch(err => {
      console.error('Failed to copy to clipboard', err);
      this.messageService.showError('Failed to copy link to clipboard.');
    });
  }

  sendInvite(agent: any, event: Event): void {
    event.stopPropagation();
    if (!agent.email) {
      this.messageService.showError('This agent does not have an email address configured.');
      return;
    }
    
    this.loading.set(true);
    this.adminService.sendDeliveryAgentInvite(agent._id).subscribe({
      next: () => {
        this.loading.set(false);
        this.messageService.showSuccess(`Invite email sent to ${agent.name}.`);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to send invite.');
        this.messageService.showError('Failed to send invite.');
      }
    });
  }
}
