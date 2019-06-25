import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DtComponent } from './dt.component';

describe('DtComponent', () => {
  let component: DtComponent;
  let fixture: ComponentFixture<DtComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DtComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
