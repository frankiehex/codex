import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "../../../../../lib/supabase"

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const status = req.nextUrl.searchParams.get("status")

  let query = supabaseAdmin
    .from("positions")
    .select("id,product_name,product_type,currency,notional,issuer,status,opened_at,maturity_at")
    .eq("portfolio_id", id)
    .order("opened_at", { ascending: false })

  if (status) query = query.eq("status", status)

  const { data, error } = await query
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, positions: data ?? [] })
}
