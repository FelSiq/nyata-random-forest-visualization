import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IterableDisplayerComponent } from './iterable-displayer.component';

describe('IterableDisplayerComponent', () => {
  let component: IterableDisplayerComponent;
  let fixture: ComponentFixture<IterableDisplayerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IterableDisplayerComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IterableDisplayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
