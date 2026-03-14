import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "../../../lib/supabase"

const schema = z.object({
  structured_product_id: z.string().uuid(),
  ticker: z.string(),
  name: z.string().optional(),
  market: z.string().optional(),
  initial_price: z.number().optional(),
  strike_price: z.number().optional(),
  ko_price: z.number().optional()
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabaseAdmin.from("underlyings").insert(parsed.data).select("*").single()
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, underlying: data })
}
