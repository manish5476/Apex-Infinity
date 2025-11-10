import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmiList } from './emi-list';

describe('EmiList', () => {
  let component: EmiList;
  let fixture: ComponentFixture<EmiList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmiList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmiList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
