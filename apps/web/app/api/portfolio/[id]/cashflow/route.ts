import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "../../../../../lib/supabase"

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const dateFrom = req.nextUrl.searchParams.get("date_from")
  const dateTo = req.nextUrl.searchParams.get("date_to")

  let query = supabaseAdmin
    .from("transactions")
    .select("txn_type,amount,currency,occurred_at")
    .eq("portfolio_id", id)
    .order("occurred_at", { ascending: true })

  if (dateFrom) query = query.gte("occurred_at", dateFrom)
  if (dateTo) query = query.lte("occurred_at", dateTo)

  const { data, error } = await query
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  const totals = (data ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.currency] = (acc[row.currency] ?? 0) + Number(row.amount)
    return acc
  }, {})

  return NextResponse.json({ success: true, cashflow_by_currency: totals, transactions: data ?? [] })
}
