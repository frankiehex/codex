import { NextRequest, NextResponse } from "next/server"
import { getUpcomingEvents } from "../../../../../lib/summary"

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const daysAhead = Number(req.nextUrl.searchParams.get("days_ahead") ?? "14")

  const events = await getUpcomingEvents(id, daysAhead)
  return NextResponse.json({ success: true, events })
}
