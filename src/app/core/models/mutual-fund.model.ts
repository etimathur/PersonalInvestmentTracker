export interface MutualFund {
  scheme_code: number;
  scheme_name: string;
  fund_house: string;
  plan_type: string;
  option_type: string;
  isin: string | null;
  isin_reinvest: string | null;
  category: string;
  sub_category: string;
}

export interface MutualFundSearchResponse {
  results: MutualFund[];
  total: number;
  page: number;
  page_size: number;
}
