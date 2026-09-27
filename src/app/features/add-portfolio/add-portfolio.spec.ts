import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddPortfolio } from './add-portfolio';

describe('AddPortfolio', () => {
  let component: AddPortfolio;
  let fixture: ComponentFixture<AddPortfolio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPortfolio],
    }).compileComponents();

    fixture = TestBed.createComponent(AddPortfolio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
