import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SIP } from '../../core/models/sip.model';
import { PortfolioService } from '../../core/services/portfolio.service';
import { Portfolio } from './portfolio';

describe('Portfolio', () => {
  let component: Portfolio;
  let fixture: ComponentFixture<Portfolio>;
  let removePortfolio: ReturnType<typeof vi.fn>;
  let loadPortfolios: ReturnType<typeof vi.fn>;
  const portfolio: SIP = {
    id: 42,
    schemeCode: '12345',
    fundName: 'Example Equity Fund',
    monthlyAmount: 5000,
    startDate: new Date('2026-01-01'),
    category: 'Equity',
    expectedReturns: 8,
  };

  beforeEach(async () => {
    removePortfolio = vi.fn();
    loadPortfolios = vi.fn();
    await TestBed.configureTestingModule({
      imports: [Portfolio],
      providers: [
        {
          provide: PortfolioService,
          useValue: {
            portfoliosSignal: signal([portfolio]),
            loadPortfolios,
            removePortfolio,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Portfolio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders existing SIP details and keeps deletion available', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(loadPortfolios).toHaveBeenCalledOnce();
    expect(element.textContent).toContain('Example Equity Fund');
    expect(element.textContent).toContain('5000');

    (element.querySelector('.delete-button') as HTMLButtonElement).click();
    expect(removePortfolio).toHaveBeenCalledWith(42);
  });
});
