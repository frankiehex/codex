import { NextRequest, NextResponse } from "next/server"

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  return NextResponse.json({
    success: true,
    portfolio_id: id,
    status: "todo",
    message: "FCN risk engine integration is marked as TODO in MVP."
  })
}
