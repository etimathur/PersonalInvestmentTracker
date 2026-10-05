import { CommonModule } from '@angular/common';
import { Component, computed, HostListener, OnInit, Signal, signal } from '@angular/core';
import {
  FundPerformanceResult,
  PortfolioPerformancePoint,
} from '../../core/models/portfolio-performance.model';
import { PortfolioService } from '../../core/services/portfolio.service';

interface PortfolioHistoryChart {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number; };
  path: string;
  dots: Array<{ x: number; y: number; value: number; date: string; }>;
  labels: Array<{ x: number; text: string; anchor: 'start' | 'middle' | 'end'; }>;
  yTicks: Array<{ value: number; y: number; label: string; }>;
}

interface FundPerformanceChart {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number; };
  rows: Array<{
    fundName: string;
    investedX: number;
    currentX: number;
    investedLabelX: number;
    currentLabelX: number;
    investedLabelAnchor: 'start' | 'end';
    currentLabelAnchor: 'start' | 'end';
    y: number;
    investedValue: number;
    currentValue: number;
    returnValue: number;
    returnLabel: string;
    investedLabel: string;
    currentLabel: string;
  }>;
  axisTicks: Array<{ x: number; y: number; label: string; }>;
}

@Component({
  imports: [CommonModule],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  public totalInvestment: Signal<number>;
  public currentValue: Signal<number>;
  public profitLoss: Signal<number>;
  public profitLossPercentage: Signal<number>;
  public portfolios: Signal<any[]>;
  public portfolioHistory = signal<PortfolioPerformancePoint[]>([]);
  public fundPerformance = signal<FundPerformanceResult[]>([]);
  public portfolioHistoryLoading = signal(false);
  public fundPerformanceLoading = signal(false);
  public portfolioHistoryError = signal<string | null>(null);
  public fundPerformanceError = signal<string | null>(null);
  private viewportWidth = signal(typeof window === 'undefined' ? 1024 : window.innerWidth);

  public portfolioHistoryChart = computed(() =>
    this.buildPortfolioHistoryChart(this.portfolioHistory(), this.viewportWidth()),
  );
  public fundPerformanceChart = computed(() =>
    this.buildFundPerformanceChart(this.fundPerformance(), this.viewportWidth()),
  );

  constructor(private portfolioService: PortfolioService) {
    this.totalInvestment = this.portfolioService.totalInvestment;
    this.currentValue = this.portfolioService.currentValue;
    this.profitLoss = this.portfolioService.profitLoss;
    this.profitLossPercentage = this.portfolioService.profitLossPercentage;
    this.portfolios = this.portfolioService.portfoliosSignal;
  }

  ngOnInit(): void {
    this.portfolioService.loadPortfolios();
    this.portfolioService.loadCurrentValue();
    this.loadPortfolioHistory();
    this.loadFundPerformance();
  }

  @HostListener('window:resize')
  onViewportResize(): void {
    this.viewportWidth.set(window.innerWidth);
  }

  public formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  }

  public formatSignedCurrency(value: number): string {
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${this.formatCurrency(Math.abs(value))}`;
  }

  public formatMonthLabel(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(`${value}-01T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  public formatFundName(value: string): string {
    if (value.length <= 14) {
      return value;
    }

    return `${value.slice(0, 13)}…`;
  }

  private loadPortfolioHistory(): void {
    this.portfolioHistoryLoading.set(true);
    this.portfolioHistoryError.set(null);

    this.portfolioService.getPortfolioPerformance().subscribe({
      next: (history) => {
        this.portfolioHistory.set(
          Array.isArray(history)
            ? [...history].sort((a, b) => a.date.localeCompare(b.date))
            : [],
        );
        this.portfolioHistoryLoading.set(false);
      },
      error: () => {
        this.portfolioHistory.set([]);
        this.portfolioHistoryError.set('Portfolio history is unavailable right now.');
        this.portfolioHistoryLoading.set(false);
      },
    });
  }

  private loadFundPerformance(): void {
    this.fundPerformanceLoading.set(true);
    this.fundPerformanceError.set(null);

    this.portfolioService.getFundPerformance().subscribe({
      next: (funds) => {
        this.fundPerformance.set(Array.isArray(funds) ? funds : []);
        this.fundPerformanceLoading.set(false);
      },
      error: () => {
        this.fundPerformance.set([]);
        this.fundPerformanceError.set('Fund comparison is unavailable right now.');
        this.fundPerformanceLoading.set(false);
      },
    });
  }

  private buildPortfolioHistoryChart(
    points: PortfolioPerformancePoint[],
    viewportWidth: number,
  ): PortfolioHistoryChart {
    const width = viewportWidth <= 600 ? 320 : 760;
    const height = 240;
    const padding = { top: 20, right: 16, bottom: 36, left: 64 };

    if (!points.length) {
      return {
        width,
        height,
        padding,
        path: '',
        dots: [],
        labels: [],
        yTicks: [],
      };
    }

    const values = points.map((point) => Number(point?.value ?? 0));
    const minimumValue = Math.min(...values, 0);
    const maximumValue = Math.max(...values, 0);
    const valueSpan = Math.max(maximumValue - minimumValue, 1);
    const paddedMin = minimumValue < 0 ? minimumValue - valueSpan * 0.15 : 0;
    const paddedMax = maximumValue + valueSpan * 0.15;
    const safeRange = Math.max(paddedMax - paddedMin, 1);
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const step = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth / 2;

    const toY = (value: number): number => {
      const ratio = (value - paddedMin) / safeRange;
      return height - padding.bottom - ratio * plotHeight;
    };

    const dots = points.map((point, index) => {
      const x = padding.left + index * step;
      const value = Number(point?.value ?? 0);
      return {
        x,
        y: toY(value),
        value,
        date: point.date,
      };
    });

    const yTicks = [paddedMax, (paddedMax + paddedMin) / 2, paddedMin].map((value) => ({
      value,
      y: toY(value),
      label: this.formatCurrency(value),
    }));

    const labelEvery = Math.max(1, Math.ceil(points.length / 5));
    const labels = points
      .map((point, index) => ({
        index,
        label: this.formatMonthLabel(point.date),
      }))
      .filter(({ index }) => index % labelEvery === 0 || index === points.length - 1)
      .map(({ index, label }) => ({
        x: index === points.length - 1 ? width - padding.right : padding.left + index * step,
        text: label,
        anchor:
          points.length === 1 || (index !== 0 && index !== points.length - 1)
            ? 'middle' as const
            : index === 0
              ? 'start' as const
              : 'end' as const,
      }));

    const path = dots
      .map((dot, index) => `${index === 0 ? 'M' : 'L'} ${dot.x.toFixed(2)} ${dot.y.toFixed(2)}`)
      .join(' ');

    return {
      width,
      height,
      padding,
      path,
      dots,
      labels,
      yTicks,
    };
  }

  private buildFundPerformanceChart(
    results: FundPerformanceResult[],
    viewportWidth: number,
  ): FundPerformanceChart {
    const isNarrow = viewportWidth <= 600;
    const width = isNarrow ? 320 : 760;
    const height = Math.max(240, results.length * 72 + 80);
    const padding = isNarrow
      ? { top: 30, right: 64, bottom: 34, left: 100 }
      : { top: 30, right: 115, bottom: 34, left: 150 };

    if (!results.length) {
      return {
        width,
        height,
        padding,
        rows: [],
        axisTicks: [],
      };
    }

    const values = results.flatMap((result) => [
      Number(result?.totalInvested ?? 0),
      Number(result?.currentValue ?? 0),
    ]);
    const minimumValue = Math.min(...values);
    const maximumValue = Math.max(...values);
    const valueSpan = Math.max(maximumValue - minimumValue, Math.abs(maximumValue) * 0.05, 1);
    const paddedMin = minimumValue - valueSpan * 0.15;
    const paddedMax = maximumValue + valueSpan * 0.15;
    const safeRange = Math.max(paddedMax - paddedMin, 1);
    const plotWidth = width - padding.left - padding.right;

    const toX = (value: number): number => {
      const ratio = (value - paddedMin) / safeRange;
      return padding.left + ratio * plotWidth;
    };

    const rows = results.map((result, index) => {
      const investedValue = Number(result.totalInvested ?? 0);
      const currentValue = Number(result.currentValue ?? 0);
      const returnValue = Number(result.returns ?? 0);
      const y = padding.top + index * 62 + 18;
      const investedX = toX(investedValue);
      const currentX = toX(currentValue);
      const investedBeforeCurrent = investedX <= currentX;

      return {
        fundName: result.fundName,
        investedX,
        currentX,
        investedLabelX: investedX + (investedBeforeCurrent ? -6 : 6),
        currentLabelX: currentX + (investedBeforeCurrent ? 6 : -6),
        investedLabelAnchor: investedBeforeCurrent ? 'end' as const : 'start' as const,
        currentLabelAnchor: investedBeforeCurrent ? 'start' as const : 'end' as const,
        y,
        investedValue,
        currentValue,
        returnValue,
        returnLabel: this.formatSignedCurrency(returnValue),
        investedLabel: this.formatCurrency(investedValue),
        currentLabel: this.formatCurrency(currentValue),
      };
    });

    const axisTicks = [paddedMin, (paddedMin + paddedMax) / 2, paddedMax].map((value) => ({
      x: toX(value),
      y: height - padding.bottom,
      label: this.formatCurrency(value),
    }));

    return {
      width,
      height,
      padding,
      rows,
      axisTicks,
    };
  }
}
