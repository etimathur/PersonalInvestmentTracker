interface SIP {
    id: number;
    schemeCode: string;
    fundName: string;
    monthlyAmount: number;
    startDate: Date;
    category: "Equity" | "Debt" | "Hybrid" | "Gold" | "International";
    expectedReturns: number;
}