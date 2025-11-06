import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mainscreensidebar } from './mainscreensidebar';

describe('Mainscreensidebar', () => {
  let component: Mainscreensidebar;
  let fixture: ComponentFixture<Mainscreensidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mainscreensidebar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mainscreensidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
