import { computed, Injectable, signal } from "@angular/core";
import { SIP } from "../models/sip.model";
@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

    private portfolios = signal<SIP[]>([
        {
            id: 1,
            schemeCode: '123456',
            fundName: 'ABC Equity Fund',
            monthlyAmount: 5000,
            startDate: new Date('2022-01-01'),
            category: 'Equity',
            expectedReturns: 12
        },
        {
            id: 2,
            schemeCode: '654321',
            fundName: 'XYZ Debt Fund',
            monthlyAmount: 3000,
            startDate: new Date('2021-06-15'),
            category: 'Debt',
            expectedReturns: 8
        }
    ]);

    readonly portfoliosSignal = this.portfolios.asReadonly();

    public addPortfolio(portfolio: SIP): void {
        this.portfolios.update(prev => [...prev, portfolio]);
    }

    public removePortfolio(portfolioId: number): void {
        this.portfolios.update(prev => prev.filter(p => p.id !== portfolioId));
    }

    public monthlyInvestmentTotal = computed(() => {
        return this.portfolios().reduce((total, portfolio) => total + portfolio.monthlyAmount, 0);
    });

    public totalInvestment = computed(() => {
        return this.portfolios().reduce((total, portfolio) => {
            const start = new Date(portfolio.startDate);
            const today = new Date();

            var months =
                (today.getFullYear() - start.getFullYear()) * 12 +
                (today.getMonth() - start.getMonth());
            if(today.getDate() < start.getDate()) {
                months--;
            }
            return total + (portfolio.monthlyAmount * months);
        }, 0);
    });

    public currentValue = computed(() => {
        return this.portfolios().reduce((total, portfolio) => {
            const start = new Date(portfolio.startDate);
            const today = new Date();

            var months =
                (today.getFullYear() - start.getFullYear()) * 12 +
                (today.getMonth() - start.getMonth());
            if(today.getDate() < start.getDate()) {
                months--;
            }
            const investedAmount = portfolio.monthlyAmount * months;
            const currentValue = investedAmount * (1 + portfolio.expectedReturns / 100);
            return total + currentValue;
        }, 0);
    });

    public profitLoss = computed(() => {
        return this.currentValue() - this.totalInvestment();
    });

    public profitLossPercentage = computed(() => {
        const totalInvestment = this.totalInvestment();
        if (totalInvestment === 0) {
            return 0;
        }
        return (this.profitLoss() / totalInvestment) * 100;
    });
}
