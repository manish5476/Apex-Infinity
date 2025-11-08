import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeAccess } from './employee-access';

describe('EmployeeAccess', () => {
  let component: EmployeeAccess;
  let fixture: ComponentFixture<EmployeeAccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeAccess]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeAccess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
