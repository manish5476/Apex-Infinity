import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentHeirachy } from './department-heirachy';

describe('DepartmentHeirachy', () => {
  let component: DepartmentHeirachy;
  let fixture: ComponentFixture<DepartmentHeirachy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentHeirachy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepartmentHeirachy);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
