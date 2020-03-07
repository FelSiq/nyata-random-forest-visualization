import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HierClusVisualComponent } from './hier-clus-visual.component';

describe('HierClusVisualComponent', () => {
  let component: HierClusVisualComponent;
  let fixture: ComponentFixture<HierClusVisualComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HierClusVisualComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HierClusVisualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
