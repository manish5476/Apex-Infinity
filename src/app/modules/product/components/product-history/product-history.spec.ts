import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductHistory } from './product-history';

describe('ProductHistory', () => {
  let component: ProductHistory;
  let fixture: ComponentFixture<ProductHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
