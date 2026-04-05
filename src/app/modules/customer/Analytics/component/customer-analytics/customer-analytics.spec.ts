import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerAnalytics } from './customer-analytics';

describe('CustomerAnalytics', () => {
  let component: CustomerAnalytics;
  let fixture: ComponentFixture<CustomerAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerAnalytics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerAnalytics);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
