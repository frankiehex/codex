import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateMonthlyReport } from "../../../../lib/report"

const schema = z.object({
  portfolio_id: z.string().uuid().optional(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12)
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

  const portfolioId = parsed.data.portfolio_id ?? process.env.DEFAULT_PORTFOLIO_ID!
  const report = await generateMonthlyReport(portfolioId, parsed.data.year, parsed.data.month)

  return NextResponse.json({ success: true, report })
}
