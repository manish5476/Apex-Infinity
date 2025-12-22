import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerOverview } from './customer-overview';

describe('CustomerOverview', () => {
  let component: CustomerOverview;
  let fixture: ComponentFixture<CustomerOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
