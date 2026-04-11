import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDashboard } from './create-dashboard';

describe('CreateDashboard', () => {
  let component: CreateDashboard;
  let fixture: ComponentFixture<CreateDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
