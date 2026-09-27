import { Component, Signal } from '@angular/core';
import { PortfolioService } from '../../core/services/portfolio.service';
import { Portfolio } from '../portfolio/portfolio';
import { CommonModule } from '@angular/common';
import { AddPortfolio } from '../add-portfolio/add-portfolio';
import { SIP } from '../../core/models/sip.model';

@Component({
  imports: [Portfolio, CommonModule, AddPortfolio],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {

  public portfolios: Signal<SIP[]>;
  public totalInvestment: Signal<number>;
  public currentValue: Signal<number>;
  public profitLoss: Signal<number>;
  public profitLossPercentage: Signal<number>;

  constructor(private portfolioService: PortfolioService) {
    this.portfolios = this.portfolioService.portfoliosSignal;
    this.totalInvestment = this.portfolioService.totalInvestment;
    this.currentValue = this.portfolioService.currentValue;
    this.profitLoss = this.portfolioService.profitLoss;
    this.profitLossPercentage = this.portfolioService.profitLossPercentage;
    console.log('Portfolios:', this.portfolios);
  }

  ngOnInit() {
    
  }

}
