import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';
import { MutualFundApiService } from './core/services/mutual-fund-api.service';
import { PortfolioService } from './core/services/portfolio.service';

describe('App routing and shell', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;
  let loadPortfolios: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loadPortfolios = vi.fn();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        {
          provide: PortfolioService,
          useValue: {
            portfoliosSignal: signal([]),
            totalInvestment: signal(1200),
            currentValue: signal(1320),
            profitLoss: signal(120),
            profitLossPercentage: signal(10),
            loadPortfolios,
            loadCurrentValue: vi.fn(),
            addPortfolio: vi.fn(),
            removePortfolio: vi.fn(),
            getPortfolioPerformance: vi.fn(() => of([])),
            getFundPerformance: vi.fn(() => of([])),
          },
        },
        {
          provide: MutualFundApiService,
          useValue: {
            getSearchedMutualFunds: vi.fn(() =>
              of({ results: [], total: 0, page: 1, page_size: 10 }),
            ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    router = TestBed.inject(Router);
  });

  async function navigateTo(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('renders the summary-only dashboard at the root with working shell navigation', async () => {
    await navigateTo('/');

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-dashboard')).toBeTruthy();
    expect(element.querySelectorAll('.summary-item')).toHaveLength(4);
    expect(loadPortfolios).toHaveBeenCalledOnce();
    expect(element.querySelector('.skip-link')?.getAttribute('href')).toBe('#main-content');
    expect(element.querySelector('main')?.getAttribute('tabindex')).toBe('-1');
    expect(element.querySelector('app-portfolio')).toBeNull();
    expect(element.querySelector('app-add-portfolio')).toBeNull();
    expect(
      element.querySelector('.primary-nav a[href="/"]')?.getAttribute('aria-current'),
    ).toBe('page');
    expect(element.querySelector('a[href="/portfolio"]')).toBeTruthy();
    expect(element.querySelector('a[href="/add-portfolio"]')).toBeTruthy();
  });

  it('renders each feature route and marks its navigation link active', async () => {
    await navigateTo('/portfolio');
    let element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-portfolio')).toBeTruthy();
    expect(element.querySelector('a[href="/portfolio"]')?.getAttribute('aria-current')).toBe('page');

    await navigateTo('/add-portfolio');
    element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-add-portfolio')).toBeTruthy();
    expect(element.querySelector('form')).toBeTruthy();
    expect(element.querySelector('a[href="/add-portfolio"]')?.getAttribute('aria-current')).toBe('page');
  });

  it('redirects unsupported URLs to the dashboard', async () => {
    await navigateTo('/not-a-supported-screen');

    expect(router.url).toBe('/');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-dashboard')).toBeTruthy();
  });

  it('keeps navigation and screen content available at a narrow viewport', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 });
    window.dispatchEvent(new Event('resize'));
    await navigateTo('/');

    const element = fixture.nativeElement as HTMLElement;
    expect(window.innerWidth).toBe(360);
    expect(element.querySelectorAll('.primary-nav a')).toHaveLength(3);
    expect(element.querySelectorAll('.summary-item')).toHaveLength(4);

    await navigateTo('/add-portfolio');
    expect(element.querySelector('#fund-search')).toBeTruthy();
    expect(element.querySelector('#amount')).toBeTruthy();
  });
});
