import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticalAnalysisComponent } from './statistical-analysis.component';

describe('StatisticalAnalysisComponent', () => {
  let component: StatisticalAnalysisComponent;
  let fixture: ComponentFixture<StatisticalAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StatisticalAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatisticalAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
