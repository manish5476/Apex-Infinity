import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UniversalFilter } from './universal-filter';

describe('UniversalFilter', () => {
  let component: UniversalFilter;
  let fixture: ComponentFixture<UniversalFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UniversalFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UniversalFilter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
