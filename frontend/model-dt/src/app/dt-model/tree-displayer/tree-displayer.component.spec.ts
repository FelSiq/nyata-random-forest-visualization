import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeDisplayerComponent } from './tree-displayer.component';

describe('TreeDisplayerComponent', () => {
  let component: TreeDisplayerComponent;
  let fixture: ComponentFixture<TreeDisplayerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TreeDisplayerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeDisplayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
