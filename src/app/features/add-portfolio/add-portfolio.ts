import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Subject,
  catchError,
  finalize,
  filter,
  map,
  of,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import { MutualFund, MutualFundSearchResponse } from '../../core/models/mutual-fund.model';
import { PortfolioService } from '../../core/services/portfolio.service';
import { MutualFundApiService } from '../../core/services/mutual-fund-api.service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-add-portfolio',
  styleUrl: './add-portfolio.scss',
  templateUrl: './add-portfolio.html',
})
export class AddPortfolio implements OnInit, OnDestroy {
  public portFolioForm;
  public fundSearchControl = new FormControl('', { nonNullable: true });
  public fundOptions: MutualFund[] = [];
  public selectedFund: MutualFund | null = null;
  public activeFundIndex = -1;
  public isLoading = false;
  public searchError = '';
  public hasSearched = false;

  private readonly destroy$ = new Subject<void>();
  private searchRequestId = 0;
  private lastSearchTerm: string | null = null;

  constructor(
    private FormBuilder: FormBuilder,
    private portfolioService: PortfolioService,
    private mutualFundApiService: MutualFundApiService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    this.portFolioForm = this.FormBuilder.group({
      schemeCode: [''],
      fundName: [''],
      monthlyAmount: ['', Validators.required],
      startDate: ['', Validators.required],
      category: ['Equity', Validators.required],
      expectedReturns: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.fundSearchControl.valueChanges
      .pipe(
        map((term) => term.trim()),
        filter((term) => {
          if (term === this.lastSearchTerm) {
            return false;
          }
          this.lastSearchTerm = term;
          return true;
        }),
        tap(() => {
          this.selectedFund = null;
          this.fundOptions = [];
          this.activeFundIndex = -1;
          this.searchError = '';
          this.hasSearched = false;
          this.portFolioForm.patchValue({ schemeCode: '', fundName: '' });
          this.changeDetectorRef.markForCheck();
        }),
        switchMap((term) => {
          const requestId = ++this.searchRequestId;
          if (!term) {
            this.isLoading = false;
            this.changeDetectorRef.markForCheck();
            return of<MutualFundSearchResponse>({
              results: [],
              total: 0,
              page: 1,
              page_size: 10,
            });
          }

          this.isLoading = true;
          this.changeDetectorRef.markForCheck();
          return timer(300).pipe(
            tap(() => {
              this.hasSearched = true;
              this.changeDetectorRef.markForCheck();
            }),
            switchMap(() => this.mutualFundApiService.getSearchedMutualFunds(term)),
            catchError(() => {
              if (requestId === this.searchRequestId) {
                this.searchError = 'Unable to search mutual funds. Please try again.';
                this.changeDetectorRef.markForCheck();
              }
              return of<MutualFundSearchResponse>({
                results: [],
                total: 0,
                page: 1,
                page_size: 10,
              });
            }),
            finalize(() => {
              if (requestId === this.searchRequestId) {
                this.isLoading = false;
                this.changeDetectorRef.markForCheck();
              }
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        this.fundOptions = response.results;
        this.activeFundIndex = -1;
        this.changeDetectorRef.markForCheck();
      });
  }

  get activeFundOptionId(): string | null {
    const activeFund = this.fundOptions[this.activeFundIndex];
    return activeFund ? `fund-option-${activeFund.scheme_code}` : null;
  }

  onFundSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' && this.fundOptions.length > 0) {
      event.preventDefault();
      this.activeFundIndex = (this.activeFundIndex + 1) % this.fundOptions.length;
      this.changeDetectorRef.markForCheck();
    } else if (event.key === 'ArrowUp' && this.fundOptions.length > 0) {
      event.preventDefault();
      this.activeFundIndex =
        this.activeFundIndex <= 0 ? this.fundOptions.length - 1 : this.activeFundIndex - 1;
      this.changeDetectorRef.markForCheck();
    } else if (
      event.key === 'Enter' &&
      this.activeFundIndex >= 0 &&
      this.activeFundIndex < this.fundOptions.length
    ) {
      event.preventDefault();
      this.selectFund(this.fundOptions[this.activeFundIndex]);
    } else if (
      event.key === 'Escape' &&
      (this.fundOptions.length > 0 || this.isLoading || this.hasSearched)
    ) {
      event.preventDefault();
      this.fundSearchControl.setValue('');
    }
  }

  selectFund(fund: MutualFund): void {
    this.selectedFund = fund;
    this.lastSearchTerm = fund.scheme_name.trim();
    this.fundSearchControl.setValue(fund.scheme_name, { emitEvent: false });
    this.portFolioForm.patchValue({
      schemeCode: String(fund.scheme_code),
      fundName: fund.scheme_name,
    });
    this.fundOptions = [];
    this.activeFundIndex = -1;
    this.searchError = '';
    this.hasSearched = false;
    this.changeDetectorRef.markForCheck();
  }

  onSubmit(): void {
    if (this.portFolioForm.invalid || !this.selectedFund) {
      this.portFolioForm.markAllAsTouched();
      return;
    }

    const categoryValue = (this.portFolioForm.value.category as
      | 'Equity'
      | 'Debt'
      | 'Hybrid'
      | 'Gold'
      | 'International'
      | '') || 'Equity';

    this.portfolioService.addPortfolio({
      id: Date.now(), // Simple unique ID based on timestamp
      schemeCode: String(this.selectedFund.scheme_code),
      fundName: this.selectedFund.scheme_name,
      monthlyAmount: parseFloat(this.portFolioForm.value.monthlyAmount || '0'),
      startDate: new Date(this.portFolioForm.value.startDate || new Date()),
      category: categoryValue,
      expectedReturns: parseFloat(this.portFolioForm.value.expectedReturns || '0')
    });
    this.portFolioForm.reset();
    this.fundSearchControl.reset('');
    this.selectedFund = null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
