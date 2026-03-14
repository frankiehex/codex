import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.VERCEL_CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 })
  }

  const baseUrl = new URL(req.url).origin
  const res = await fetch(`${baseUrl}/api/reports/daily`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ portfolio_id: process.env.DEFAULT_PORTFOLIO_ID })
  })

  const json = await res.json()
  return NextResponse.json({ success: true, cron: "ok", report: json })
}
