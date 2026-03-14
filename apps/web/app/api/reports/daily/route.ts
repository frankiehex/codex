import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateDailyReport } from "../../../../lib/report"

const schema = z.object({
  portfolio_id: z.string().uuid().optional(),
  report_date: z.string().optional()
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })

  const portfolioId = parsed.data.portfolio_id ?? process.env.DEFAULT_PORTFOLIO_ID!
  const report = await generateDailyReport(portfolioId, parsed.data.report_date)

  return NextResponse.json({ success: true, report })
}
