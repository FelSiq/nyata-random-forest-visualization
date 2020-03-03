import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DtModelComponent } from './dt-model.component';

describe('DtModelComponent', () => {
  let component: DtModelComponent;
  let fixture: ComponentFixture<DtModelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DtModelComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DtModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
