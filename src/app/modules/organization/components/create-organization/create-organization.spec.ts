import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateOrganization } from './create-organization';

describe('CreateOrganization', () => {
  let component: CreateOrganization;
  let fixture: ComponentFixture<CreateOrganization>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateOrganization]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateOrganization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
