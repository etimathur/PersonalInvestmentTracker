import { Component, OnInit, Signal } from '@angular/core';
import { PortfolioService } from '../../core/services/portfolio.service';
import { CommonModule } from '@angular/common';

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

  constructor(private portfolioService: PortfolioService) {
    this.totalInvestment = this.portfolioService.totalInvestment;
    this.currentValue = this.portfolioService.currentValue;
    this.profitLoss = this.portfolioService.profitLoss;
    this.profitLossPercentage = this.portfolioService.profitLossPercentage;
  }

  ngOnInit(): void {
    this.portfolioService.loadPortfolios();
  }
}
