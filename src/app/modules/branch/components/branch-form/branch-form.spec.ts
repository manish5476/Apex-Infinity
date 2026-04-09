import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BranchFormComponent } from './branch-form';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { LoadingService } from '../../../../core/services/loading.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { BranchService } from '../../services/branch-service';
import { MessageService } from 'primeng/api';

describe('BranchFormComponent', () => {
  let component: BranchFormComponent;
  let fixture: ComponentFixture<BranchFormComponent>;

  const branchServiceSpy = jasmine.createSpyObj('BranchService', ['getBranchById', 'createBranch', 'updateBranch']);
  const appMessageServiceSpy = jasmine.createSpyObj('AppMessageService', ['showWarn', 'showInfo', 'showSuccess', 'handleHttpError']);
  const loadingServiceSpy = jasmine.createSpyObj('LoadingService', ['show', 'hide']);
  const masterListSpy = jasmine.createSpyObj('MasterListService', ['users', 'refresh']);
  
  beforeEach(async () => {
    masterListSpy.users.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [BranchFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        FormBuilder,
        MessageService,
        { provide: BranchService, useValue: branchServiceSpy },
        { provide: AppMessageService, useValue: appMessageServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
        { provide: MasterListService, useValue: masterListSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BranchFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form', () => {
    expect(component.branchForm).toBeDefined();
    expect(component.branchForm.get('name')).toBeTruthy();
    expect(component.branchForm.get('address')).toBeTruthy();
  });

  it('should invalidate form if required fields missing', () => {
    expect(component.branchForm.valid).toBeFalsy();
  });
});
