import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InstanceBarComponent } from './instance-bar.component';

describe('InstanceBarComponent', () => {
  let component: InstanceBarComponent;
  let fixture: ComponentFixture<InstanceBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InstanceBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InstanceBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
