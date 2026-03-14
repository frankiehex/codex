import { supabaseAdmin } from "../services/supabase.js"

export const tools = {
  async add_investment(input: Record<string, unknown>) {
    return supabaseAdmin.from("positions").insert(input).select("*").single()
  },
  async add_structured_product(input: Record<string, unknown>) {
    return supabaseAdmin.from("structured_products").insert(input).select("*").single()
  },
  async add_underlying(input: Record<string, unknown>) {
    return supabaseAdmin.from("underlyings").insert(input).select("*").single()
  },
  async add_transaction(input: Record<string, unknown>) {
    return supabaseAdmin.from("transactions").insert(input).select("*").single()
  },
  async update_position_status(input: { position_id: string; status: string; notes?: string }) {
    return supabaseAdmin.from("positions").update({ status: input.status, notes: input.notes }).eq("id", input.position_id).select("*").single()
  },
  async get_portfolio_summary(input: { portfolio_id: string }) {
    const [{ data: positions }, { data: txns }] = await Promise.all([
      supabaseAdmin.from("positions").select("status,currency,notional").eq("portfolio_id", input.portfolio_id),
      supabaseAdmin.from("transactions").select("txn_type,amount,currency").eq("portfolio_id", input.portfolio_id)
    ])

    return {
      data: {
        total_positions: positions?.length ?? 0,
        running_positions: positions?.filter((p) => p.status === "running").length ?? 0,
        total_notional_by_currency: (positions ?? []).reduce<Record<string, number>>((acc, row) => {
          acc[row.currency] = (acc[row.currency] ?? 0) + Number(row.notional)
          return acc
        }, {}),
        coupon_income_by_currency: (txns ?? []).filter((t) => t.txn_type === "coupon").reduce<Record<string, number>>((acc, row) => {
          acc[row.currency] = (acc[row.currency] ?? 0) + Number(row.amount)
          return acc
        }, {})
      }
    }
  },
  async get_position_list(input: { portfolio_id: string; status?: string }) {
    let query = supabaseAdmin.from("positions").select("*").eq("portfolio_id", input.portfolio_id)
    if (input.status) query = query.eq("status", input.status)
    return query
  },
  async get_fcn_risk_report(input: { portfolio_id: string }) {
    return { data: { portfolio_id: input.portfolio_id, status: "todo", message: "Risk engine TODO" } }
  },
  async get_cashflow_report(input: { portfolio_id: string; date_from: string; date_to: string }) {
    return supabaseAdmin.from("transactions").select("*").eq("portfolio_id", input.portfolio_id).gte("occurred_at", input.date_from).lte("occurred_at", input.date_to)
  },
  async get_upcoming_events(input: { portfolio_id: string; days_ahead: number }) {
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() + input.days_ahead)
    return supabaseAdmin.from("positions").select("id,product_name,maturity_at").eq("portfolio_id", input.portfolio_id).lte("maturity_at", limitDate.toISOString().slice(0, 10))
  },
  async generate_daily_report(input: { portfolio_id: string; report_date: string }) {
    return { data: { portfolio_id: input.portfolio_id, report_date: input.report_date, status: "generated" } }
  },
  async generate_monthly_report(input: { portfolio_id: string; year: number; month: number }) {
    return { data: { portfolio_id: input.portfolio_id, year: input.year, month: input.month, status: "generated" } }
  }
}
