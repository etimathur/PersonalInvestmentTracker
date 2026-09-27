import { Component, Input, Signal } from '@angular/core';
import { PortfolioService } from '../../core/services/portfolio.service';
import { SIP } from '../../core/models/sip.model';

@Component({
  imports: [],
  selector: 'app-portfolio',
  styleUrl: './portfolio.scss',
  templateUrl: './portfolio.html',
})
export class Portfolio {
  public portfolios: Signal<SIP[]>;

  constructor(private portfolioService: PortfolioService) {
    this.portfolios = this.portfolioService.portfoliosSignal;
  }

  ngOnInit() { }

  public removePortfolio(portfolioId: number): void {
    this.portfolioService.removePortfolio(portfolioId);
  }
}
