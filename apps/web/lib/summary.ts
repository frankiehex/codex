import { supabaseAdmin } from "./supabase"

export async function getPortfolioSummary(portfolioId: string) {
  const [{ data: positions }, { data: txns }] = await Promise.all([
    supabaseAdmin.from("positions").select("id,currency,notional,status").eq("portfolio_id", portfolioId),
    supabaseAdmin.from("transactions").select("txn_type,amount,currency").eq("portfolio_id", portfolioId)
  ])

  const totalNotionalByCurrency = (positions ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.currency] = (acc[row.currency] ?? 0) + Number(row.notional)
    return acc
  }, {})

  const couponIncomeByCurrency = (txns ?? []).filter((t) => t.txn_type === "coupon").reduce<Record<string, number>>((acc, row) => {
    acc[row.currency] = (acc[row.currency] ?? 0) + Number(row.amount)
    return acc
  }, {})

  return {
    total_positions: positions?.length ?? 0,
    running_positions: positions?.filter((p) => p.status === "running").length ?? 0,
    total_notional_by_currency: totalNotionalByCurrency,
    coupon_income_by_currency: couponIncomeByCurrency
  }
}

export async function getUpcomingEvents(portfolioId: string, daysAhead: number) {
  const toDate = new Date()
  toDate.setDate(toDate.getDate() + daysAhead)

  const { data } = await supabaseAdmin
    .from("positions")
    .select("id,product_name,maturity_at,status")
    .eq("portfolio_id", portfolioId)
    .eq("status", "running")
    .lte("maturity_at", toDate.toISOString().slice(0, 10))
    .order("maturity_at", { ascending: true })

  return data ?? []
}
