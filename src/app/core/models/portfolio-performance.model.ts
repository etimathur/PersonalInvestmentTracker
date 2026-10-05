export interface PortfolioPerformancePoint {
  date: string;
  value: number;
}

export interface FundPerformanceResult {
  fundName: string;
  totalInvested: number;
  currentValue: number;
  returns: number;
}
