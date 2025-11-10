import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmiForm } from './emi-form';

describe('EmiForm', () => {
  let component: EmiForm;
  let fixture: ComponentFixture<EmiForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmiForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmiForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
