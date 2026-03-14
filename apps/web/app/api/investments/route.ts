import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "../../../lib/supabase"

const schema = z.object({
  portfolio_id: z.string().uuid(),
  product_type: z.string(),
  product_name: z.string(),
  currency: z.string(),
  notional: z.number(),
  issuer: z.string().optional(),
  opened_at: z.string().optional(),
  maturity_at: z.string().optional(),
  notes: z.string().optional()
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabaseAdmin.from("positions").insert(parsed.data).select("*").single()
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, position: data })
}
