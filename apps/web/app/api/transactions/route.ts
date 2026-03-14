import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "../../../lib/supabase"

const schema = z.object({
  portfolio_id: z.string().uuid(),
  position_id: z.string().uuid().optional(),
  txn_type: z.string(),
  amount: z.number(),
  currency: z.string(),
  fee: z.number().optional(),
  fx_rate: z.number().optional(),
  occurred_at: z.string().optional(),
  notes: z.string().optional()
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

  const payload = { ...parsed.data, fee: parsed.data.fee ?? 0 }
  const { data, error } = await supabaseAdmin.from("transactions").insert(payload).select("*").single()
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, transaction: data })
}
