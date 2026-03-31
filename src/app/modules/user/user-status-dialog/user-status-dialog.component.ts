import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { UserManagementService, User } from '../user-management.service';
import { AppMessageService } from '../../../core/services/message.service';

@Component({
  selector: 'app-user-status-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleButtonModule, ToggleSwitchModule, TextareaModule, ButtonModule],
  templateUrl: './user-status-dialog.component.html',
  styleUrl: './user-status-dialog.component.scss'
})
export class UserStatusDialogComponent implements OnInit {
  private ref = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);
  private userService = inject(UserManagementService);
  private messageService = inject(AppMessageService);

  user: User = this.config.data.user;
  isActive = signal(false);
  isLoginBlocked = signal(false);
  blockReason = '';
  isProcessing = signal(false);

  ngOnInit() {
    this.isActive.set(this.user.isActive);
    this.isLoginBlocked.set(this.user.isLoginBlocked);
  }

  onStatusChange(event: any) {
    const activate = event.checked;
    this.isProcessing.set(true);

    const action$ = activate
      ? this.userService.activateUser(this.user._id)
      : this.userService.deactivateUser(this.user._id);

    action$.pipe(finalize(() => this.isProcessing.set(false))).subscribe({
      next: () => {
        this.isActive.set(activate);
        this.messageService.showSuccess(`User has been ${activate ? 'activated' : 'deactivated'}.`);
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
        setTimeout(() => this.isActive.set(!activate), 100);
      }
    });
  }

  onBlockChange(event: any) {
    const block = event.checked;
    this.isProcessing.set(true);

    this.userService.toggleUserBlock({
      userId: this.user._id,
      blockStatus: block,
      reason: this.blockReason
    }).pipe(finalize(() => this.isProcessing.set(false))).subscribe({
      next: () => {
        this.isLoginBlocked.set(block);
        this.messageService.showSuccess(`Login access ${block ? 'blocked' : 'unblocked'} successfully.`);
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
        setTimeout(() => this.isLoginBlocked.set(!block), 100);
      }
    });
  }

  close() {
    this.ref.close({ isActive: this.isActive(), isLoginBlocked: this.isLoginBlocked() });
  }
}
