import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseReturn } from './purchase-return';

describe('PurchaseReturn', () => {
  let component: PurchaseReturn;
  let fixture: ComponentFixture<PurchaseReturn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseReturn]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseReturn);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
