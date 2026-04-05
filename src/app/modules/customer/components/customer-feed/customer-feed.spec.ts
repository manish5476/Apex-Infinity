import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerFeed } from './customer-feed';

describe('CustomerFeed', () => {
  let component: CustomerFeed;
  let fixture: ComponentFixture<CustomerFeed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerFeed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerFeed);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
