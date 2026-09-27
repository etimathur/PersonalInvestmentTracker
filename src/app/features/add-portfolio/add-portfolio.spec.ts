import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { MutualFund } from '../../core/models/mutual-fund.model';
import { AddPortfolio } from './add-portfolio';
import { MutualFundApiService } from '../../core/services/mutual-fund-api.service';
import { PortfolioService } from '../../core/services/portfolio.service';

describe('AddPortfolio', () => {
  const fund: MutualFund = {
    scheme_code: 12345,
    scheme_name: 'Verified Equity Fund',
    fund_house: 'Example Mutual Fund',
    plan_type: 'Unknown',
    option_type: 'Growth',
    isin: null,
    isin_reinvest: null,
    category: 'Equity Scheme',
    sub_category: 'Multi Cap Fund',
  };
  let component: AddPortfolio;
  let fixture: ComponentFixture<AddPortfolio>;
  let api: { getSearchedMutualFunds: ReturnType<typeof vi.fn> };
  let portfolio: { addPortfolio: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.useFakeTimers();
    api = {
      getSearchedMutualFunds: vi.fn(() =>
        of({ results: [fund], total: 1, page: 1, page_size: 10 }),
      ),
    };
    portfolio = { addPortfolio: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [AddPortfolio],
      providers: [
        { provide: MutualFundApiService, useValue: api },
        { provide: PortfolioService, useValue: portfolio },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddPortfolio);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  afterEach(() => vi.useRealTimers());

  it('searches after debounce with a normalized term and explicit paging', () => {
    component.fundSearchControl.setValue('  equity  ');
    vi.advanceTimersByTime(299);
    expect(api.getSearchedMutualFunds).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(api.getSearchedMutualFunds).toHaveBeenCalledWith('equity', 1, 10);
    expect(component.fundOptions).toEqual([fund]);
  });

  it('deduplicates repeated normalized terms', () => {
    component.fundSearchControl.setValue('equity');
    vi.advanceTimersByTime(300);
    api.getSearchedMutualFunds.mockClear();
    component.fundSearchControl.setValue('equity');
    vi.advanceTimersByTime(300);

    expect(api.getSearchedMutualFunds).not.toHaveBeenCalled();
  });

  it('keeps the latest request result when searches overlap', () => {
    const requests = new Map<
      string,
      Subject<{
        results: MutualFund[];
        total: number;
        page: number;
        page_size: number;
      }>
    >();
    api.getSearchedMutualFunds.mockImplementation((term: string) => {
      const request = new Subject<{
        results: MutualFund[];
        total: number;
        page: number;
        page_size: number;
      }>();
      requests.set(term, request);
      return request.asObservable();
    });

    component.fundSearchControl.setValue('old');
    vi.advanceTimersByTime(300);
    component.fundSearchControl.setValue('new');
    vi.advanceTimersByTime(300);
    requests.get('old')!.next({
      results: [{ ...fund, scheme_code: 1, scheme_name: 'Old' }],
      total: 1,
      page: 1,
      page_size: 10,
    });
    requests.get('old')!.complete();
    requests.get('new')!.next({
      results: [fund],
      total: 1,
      page: 1,
      page_size: 10,
    });
    requests.get('new')!.complete();

    expect(component.fundOptions).toEqual([fund]);
  });

  it('does not show or allow selecting an old result during the new term debounce', () => {
    const oldRequest = new Subject<{
      results: MutualFund[];
      total: number;
      page: number;
      page_size: number;
    }>();
    api.getSearchedMutualFunds.mockReturnValue(oldRequest);

    component.fundSearchControl.setValue('old');
    vi.advanceTimersByTime(300);
    component.fundSearchControl.setValue('new');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#fund-search') as HTMLInputElement;
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(
      (fixture.nativeElement.querySelector('#fund-options') as HTMLUListElement).hidden,
    ).toBe(true);

    oldRequest.next({
      results: [{ ...fund, scheme_code: 1, scheme_name: 'Old result' }],
      total: 1,
      page: 1,
      page_size: 10,
    });

    expect(component.fundOptions).toEqual([]);
    expect(component.activeFundOptionId).toBeNull();
    expect(component.selectedFund).toBeNull();
    fixture.detectChanges();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(
      (fixture.nativeElement.querySelector('#fund-options') as HTMLUListElement).hidden,
    ).toBe(true);
  });

  it('searches again when returning to a previous term within the debounce window', () => {
    component.fundSearchControl.setValue('equity');
    vi.advanceTimersByTime(300);
    component.fundSearchControl.setValue('debt');
    vi.advanceTimersByTime(100);
    component.fundSearchControl.setValue('equity');
    vi.advanceTimersByTime(300);

    expect(api.getSearchedMutualFunds.mock.calls.map(([term]) => term)).toEqual([
      'equity',
      'equity',
    ]);
    expect(component.fundOptions).toEqual([fund]);
  });

  it('invalidates a selection when the input returns to the earlier query term', () => {
    component.fundSearchControl.setValue('verified');
    vi.advanceTimersByTime(300);
    component.selectFund(fund);
    api.getSearchedMutualFunds.mockClear();

    component.fundSearchControl.setValue('verified');
    expect(component.selectedFund).toBeNull();
    vi.advanceTimersByTime(300);

    expect(api.getSearchedMutualFunds).toHaveBeenCalledWith('verified', 1, 10);
  });

  it('supports listbox keyboard navigation, selection, and Escape dismissal', () => {
    const secondFund = { ...fund, scheme_code: 67890, scheme_name: 'Second Verified Fund' };
    api.getSearchedMutualFunds.mockReturnValue(
      of({ results: [fund, secondFund], total: 2, page: 1, page_size: 10 }),
    );
    component.fundSearchControl.setValue('keyboard');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#fund-search') as HTMLInputElement;

    expect(component.fundOptions).toHaveLength(2);
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-haspopup')).toBe('listbox');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelectorAll('[role="option"]')).toHaveLength(2);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe('fund-option-12345');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe('fund-option-67890');
    expect(
      fixture.nativeElement.querySelector('#fund-option-67890').getAttribute('aria-selected'),
    ).toBe('true');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe('fund-option-12345');

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(enterEvent);
    fixture.detectChanges();
    expect(enterEvent.defaultPrevented).toBe(true);
    expect(component.selectedFund).toBe(fund);
    expect(input.getAttribute('aria-expanded')).toBe('false');

    api.getSearchedMutualFunds.mockReturnValue(
      of({ results: [fund], total: 1, page: 1, page_size: 10 }),
    );
    component.fundSearchControl.setValue('escape');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(escapeEvent);
    fixture.detectChanges();
    expect(escapeEvent.defaultPrevented).toBe(true);
    expect(component.fundOptions).toEqual([]);
    expect(component.fundSearchControl.value).toBe('');
    expect(portfolio.addPortfolio).not.toHaveBeenCalled();
  });

  it('renders an empty state after an empty response settles', () => {
    api.getSearchedMutualFunds.mockReturnValueOnce(
      of({ results: [], total: 0, page: 1, page_size: 10 }),
    );
    component.fundSearchControl.setValue('missing');
    vi.advanceTimersByTime(300);
    expect(component.hasSearched).toBe(true);
    expect(component.fundOptions).toEqual([]);
    expect(component.isLoading).toBe(false);

  });

  it('renders an error state after a failed request settles', () => {
    api.getSearchedMutualFunds.mockReturnValueOnce(throwError(() => new Error('offline')));
    component.fundSearchControl.setValue('retry');
    vi.advanceTimersByTime(300);
    expect(component.searchError).toContain('Unable to search');
    expect(component.isLoading).toBe(false);
  });

  it('requires a selected result and maps its verified identity on submission', () => {
    component.portFolioForm.setValue({
      schemeCode: '',
      fundName: '',
      monthlyAmount: '5000',
      startDate: '2026-01-01',
      category: 'Debt',
      expectedReturns: '8',
    });
    component.onSubmit();
    expect(portfolio.addPortfolio).not.toHaveBeenCalled();

    component.selectFund(fund);
    component.onSubmit();

    expect(portfolio.addPortfolio).toHaveBeenCalledWith(
      expect.objectContaining({
        schemeCode: '12345',
        fundName: 'Verified Equity Fund',
        category: 'Debt',
      }),
    );
  });
});
