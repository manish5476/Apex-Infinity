import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoctTransfer } from './stoct-transfer';

describe('StoctTransfer', () => {
  let component: StoctTransfer;
  let fixture: ComponentFixture<StoctTransfer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoctTransfer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoctTransfer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
