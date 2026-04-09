import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserPermissionDialogComponent } from './user-permission-dialog.component';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { UserManagementService } from '../user-management.service';
import { AppMessageService } from '../../../core/services/message.service';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

describe('UserPermissionDialogComponent', () => {
  let component: UserPermissionDialogComponent;
  let fixture: ComponentFixture<UserPermissionDialogComponent>;

  const dynamicDialogRefSpy = jasmine.createSpyObj('DynamicDialogRef', ['close']);
  const dynamicDialogConfigMock = {
    data: {
      user: {
        _id: 'user123',
        name: 'Test User',
        permissionOverrides: { granted: [], revoked: [] }
      }
    }
  };
  const userServiceSpy = jasmine.createSpyObj('UserManagementService', ['getAllAvailablePermissions', 'updatePermissionOverrides']);
  const appMessageServiceSpy = jasmine.createSpyObj('AppMessageService', ['showSuccess', 'handleHttpError']);

  beforeEach(async () => {
    userServiceSpy.getAllAvailablePermissions.and.returnValue(of({ data: { permissions: [] } }));

    await TestBed.configureTestingModule({
      imports: [UserPermissionDialogComponent, FormsModule],
      providers: [
        MessageService,
        { provide: DynamicDialogRef, useValue: dynamicDialogRefSpy },
        { provide: DynamicDialogConfig, useValue: dynamicDialogConfigMock },
        { provide: UserManagementService, useValue: userServiceSpy },
        { provide: AppMessageService, useValue: appMessageServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserPermissionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch permissions on init', () => {
    expect(userServiceSpy.getAllAvailablePermissions).toHaveBeenCalled();
  });
});
