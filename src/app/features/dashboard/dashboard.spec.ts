import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PortfolioService } from '../../core/services/portfolio.service';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let loadPortfolios: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loadPortfolios = vi.fn();
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        {
          provide: PortfolioService,
          useValue: {
            totalInvestment: signal(1200),
            currentValue: signal(1320),
            profitLoss: signal(120),
            profitLossPercentage: signal(10),
            loadPortfolios,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads portfolio data for the summary when the dashboard opens', () => {
    expect(loadPortfolios).toHaveBeenCalledOnce();
  });
});
