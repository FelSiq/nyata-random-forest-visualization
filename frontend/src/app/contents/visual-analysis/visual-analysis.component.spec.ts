import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualAnalysisComponent } from './visual-analysis.component';

describe('VisualAnalysisComponent', () => {
  let component: VisualAnalysisComponent;
  let fixture: ComponentFixture<VisualAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VisualAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
