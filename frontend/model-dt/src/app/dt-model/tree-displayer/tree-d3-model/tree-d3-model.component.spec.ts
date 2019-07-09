import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeD3ModelComponent } from './tree-d3-model.component';

describe('TreeD3ModelComponent', () => {
  let component: TreeD3ModelComponent;
  let fixture: ComponentFixture<TreeD3ModelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TreeD3ModelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeD3ModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
