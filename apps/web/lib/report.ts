import { supabaseAdmin } from "./supabase"
import { getPortfolioSummary } from "./summary"

export async function generateDailyReport(portfolioId: string, reportDate?: string) {
  const [summary, { data: positions }] = await Promise.all([
    getPortfolioSummary(portfolioId),
    supabaseAdmin.from("positions").select("id,product_name,status,currency,notional,maturity_at").eq("portfolio_id", portfolioId)
  ])

  return {
    report_date: reportDate ?? new Date().toISOString().slice(0, 10),
    summary,
    positions: positions ?? [],
    narrative: "Daily report generated successfully."
  }
}

export async function generateMonthlyReport(portfolioId: string, year: number, month: number) {
  const from = new Date(Date.UTC(year, month - 1, 1)).toISOString()
  const to = new Date(Date.UTC(year, month, 1)).toISOString()

  const { data: txns } = await supabaseAdmin
    .from("transactions")
    .select("txn_type,amount,currency,occurred_at")
    .eq("portfolio_id", portfolioId)
    .gte("occurred_at", from)
    .lt("occurred_at", to)

  return {
    year,
    month,
    transaction_count: txns?.length ?? 0,
    cashflow_by_currency: (txns ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.currency] = (acc[row.currency] ?? 0) + Number(row.amount)
      return acc
    }, {})
  }
}
