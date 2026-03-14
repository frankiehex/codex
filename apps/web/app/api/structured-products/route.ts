import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "../../../lib/supabase"

const schema = z.object({
  position_id: z.string().uuid(),
  structure_type: z.string().default("fcn"),
  coupon_pa: z.number().optional(),
  strike_pct: z.number().optional(),
  ko_barrier_pct: z.number().optional(),
  observation_freq: z.string().optional(),
  tenor_months: z.number().int().optional(),
  memory_coupon: z.boolean().optional(),
  denomination: z.number().optional(),
  settlement_currency: z.string().optional()
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

  const payload = { ...parsed.data, memory_coupon: parsed.data.memory_coupon ?? false }
  const { data, error } = await supabaseAdmin.from("structured_products").insert(payload).select("*").single()
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, structured_product: data })
}
