import { computed, Injectable, signal } from "@angular/core";
import { SIP } from "../models/sip.model";
import { HttpClient } from "@angular/common/http";
@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

    constructor(private http: HttpClient) { }

    private portfolios = signal<SIP[]>([
    ]);

    readonly portfoliosSignal = this.portfolios.asReadonly();
    private readonly apiUrl = 'http://localhost:5143/api/Sips';

    public loadPortfolios(): void {
        this.http.get<SIP[]>(this.apiUrl).subscribe({
            next: data => this.portfolios.set(data)
        });
    }
    public addPortfolio(portfolio: SIP): void {
        const { id, ...sipWithoutId } = portfolio;

        this.http.post<SIP>(this.apiUrl, sipWithoutId).subscribe({
            next: data => {
                this.portfolios.update(prev => [...prev, data]);
            }
        });
    }

    public removePortfolio(portfolioId: number): void {
        this.http.delete(this.apiUrl + "/" + portfolioId).subscribe({
            next: () => {
                this.portfolios.update(prev => prev.filter(p => p.id !== portfolioId));
            }
        });
    }

    public updatePortfolio(portfolio: SIP): void {
        this.http.put<SIP>(this.apiUrl + "/" + portfolio.id, portfolio).subscribe({
            next: data => {
                this.portfolios.update(prev => prev.map(p => p.id === data.id ? data : p));
            }
        });
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
