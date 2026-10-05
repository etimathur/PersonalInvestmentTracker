import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PortfolioService } from '../../core/services/portfolio.service';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let loadPortfolios: ReturnType<typeof vi.fn>;
  let loadCurrentValue: ReturnType<typeof vi.fn>;
  let getPortfolioPerformance: ReturnType<typeof vi.fn>;
  let getFundPerformance: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loadPortfolios = vi.fn();
    loadCurrentValue = vi.fn();
    getPortfolioPerformance = vi.fn(() => of([
      { date: '2026-10', value: 94908.21 },
      { date: '2026-08', value: 0 },
      { date: '2026-09', value: 49389.84 },
    ]));
    getFundPerformance = vi.fn(() => of([
      { fundName: 'HDFC Flexi Cap Fund - Growth Plan', totalInvested: 25000, currentValue: 23806.81, returns: -1193.19 },
      { fundName: 'Helios Mid Cap Fund - Direct Plan - Growth Option', totalInvested: 25000, currentValue: 23843.49, returns: -1156.51 },
      { fundName: 'ICICI Prudential Large & Mid Cap Fund - Growth', totalInvested: 25000, currentValue: 23328.85, returns: -1671.15 },
      { fundName: 'Old Bridge Focused Fund - Direct Growth', totalInvested: 25000, currentValue: 23929.06, returns: -1070.94 },
    ]));

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
            portfoliosSignal: signal([]),
            loadPortfolios,
            loadCurrentValue,
            getPortfolioPerformance,
            getFundPerformance,
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

  it('loads portfolio summary and performance data when the dashboard opens', () => {
    expect(loadPortfolios).toHaveBeenCalledOnce();
    expect(loadCurrentValue).toHaveBeenCalledOnce();
    expect(getPortfolioPerformance).toHaveBeenCalledOnce();
    expect(getFundPerformance).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelectorAll('svg').length).toBeGreaterThan(1);
    expect(fixture.nativeElement.textContent).toContain('Portfolio value history');
    expect(fixture.nativeElement.textContent).toContain('Fund performance');
    expect(component.portfolioHistory().map((point) => point.date)).toEqual([
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
    expect(component.portfolioHistoryChart().dots).toHaveLength(3);
    expect(Number.isFinite(component.portfolioHistoryChart().dots[0].y)).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('2026-08: ₹0');
    expect(fixture.nativeElement.textContent).toContain('HDFC Flexi Cap Fund - Growth Plan');
    expect(fixture.nativeElement.textContent).toContain('invested ₹25,000');
    expect(fixture.nativeElement.textContent).toContain('returns -₹1,193');
    expect(component.fundPerformanceChart().rows).toHaveLength(4);
    expect(fixture.nativeElement.textContent).toContain('Invested');
    expect(fixture.nativeElement.textContent).toContain('Current value');
  });

  it('keeps a single zero-valued history point finite and visible', () => {
    component.portfolioHistory.set([{ date: '2026-08', value: 0 }]);
    fixture.detectChanges();

    const chart = component.portfolioHistoryChart();
    expect(chart.dots).toHaveLength(1);
    expect(Number.isFinite(chart.dots[0].x)).toBe(true);
    expect(Number.isFinite(chart.dots[0].y)).toBe(true);
    expect(chart.path).toMatch(/^M /);
    expect(chart.yTicks.at(-1)?.value).toBe(0);
  });

  async function recreateDashboard(): Promise<void> {
    fixture.destroy();
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('distinguishes positive fund returns', async () => {
    getFundPerformance.mockReturnValue(of([
      { fundName: 'Example Growth Fund', totalInvested: 5000, currentValue: 6000, returns: 1000 },
    ]));
    await recreateDashboard();

    expect(fixture.nativeElement.querySelector('.fund-return.positive')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('+₹1,000');
    expect(component.fundPerformanceChart().rows[0].currentX).toBeGreaterThan(
      component.fundPerformanceChart().rows[0].investedX,
    );
  });

  it('shows empty states when both chart requests return no data', async () => {
    getPortfolioPerformance.mockReturnValue(of([]));
    getFundPerformance.mockReturnValue(of([]));
    await recreateDashboard();

    expect(fixture.nativeElement.textContent).toContain('No portfolio history available yet.');
    expect(fixture.nativeElement.textContent).toContain('No fund performance data available yet.');
  });

  it('shows the portfolio error without hiding successful fund data', async () => {
    getPortfolioPerformance.mockReturnValue(
      throwError(() => new Error('Portfolio history request failed')),
    );
    await recreateDashboard();

    expect(fixture.nativeElement.textContent).toContain('Portfolio history is unavailable right now.');
    expect(component.portfolioHistoryError()).toBeTruthy();
    expect(component.fundPerformanceError()).toBeNull();
    expect(component.fundPerformance()).toHaveLength(4);
  });

  it('shows the fund error without hiding successful portfolio history', async () => {
    getFundPerformance.mockReturnValue(
      throwError(() => new Error('Fund performance request failed')),
    );
    await recreateDashboard();

    expect(fixture.nativeElement.textContent).toContain('Fund comparison is unavailable right now.');
    expect(component.fundPerformanceError()).toBeTruthy();
    expect(component.portfolioHistoryError()).toBeNull();
    expect(component.portfolioHistory()).toHaveLength(3);
  });

  it('keeps charts inside horizontally scrollable wrappers at a narrow viewport', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 });
    window.dispatchEvent(new Event('resize'));

    const wrappers = fixture.nativeElement.querySelectorAll('.chart-wrapper');
    const charts = fixture.nativeElement.querySelectorAll('.chart-wrapper svg');

    expect(wrappers).toHaveLength(2);
    expect(charts).toHaveLength(2);
    expect(getComputedStyle(wrappers[0]).overflowX).toBe('auto');
    expect(component.portfolioHistoryChart().width).toBe(320);
    expect(component.fundPerformanceChart().width).toBe(320);
  });
});
