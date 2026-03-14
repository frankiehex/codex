export type CurrencyTotals = Record<string, number>

export type PortfolioSummary = {
  total_positions: number
  running_positions: number
  total_notional_by_currency: CurrencyTotals
  coupon_income_by_currency: CurrencyTotals
}

export type DailyReport = {
  report_date: string
  summary: PortfolioSummary
  positions: Array<Record<string, unknown>>
  narrative: string
}
