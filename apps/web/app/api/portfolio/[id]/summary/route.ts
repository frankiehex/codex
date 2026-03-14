import { NextRequest, NextResponse } from "next/server"
import { getPortfolioSummary } from "../../../../../lib/summary"

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const summary = await getPortfolioSummary(id)

  return NextResponse.json({ success: true, summary })
}
