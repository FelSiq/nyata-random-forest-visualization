import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ForestAnalysisComponent } from './forest-analysis.component';

describe('ForestAnalysisComponent', () => {
  let component: ForestAnalysisComponent;
  let fixture: ComponentFixture<ForestAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ForestAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ForestAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
