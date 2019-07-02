import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataLoaderPannelComponent } from './data-loader-pannel.component';

describe('DataLoaderPannelComponent', () => {
  let component: DataLoaderPannelComponent;
  let fixture: ComponentFixture<DataLoaderPannelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DataLoaderPannelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataLoaderPannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
