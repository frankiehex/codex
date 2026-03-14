import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "../../../../../lib/supabase"

const schema = z.object({
  status: z.string(),
  notes: z.string().optional()
})

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const parsed = schema.safeParse(await req.json())

  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from("positions")
    .update({ status: parsed.data.status, notes: parsed.data.notes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single()

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, position: data })
}
