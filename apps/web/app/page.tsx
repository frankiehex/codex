export const dynamic = "force-dynamic"

import { getPortfolioSummary, getUpcomingEvents } from "../lib/summary"

async function getDashboardData() {
  const portfolioId = process.env.DEFAULT_PORTFOLIO_ID ?? "11111111-1111-1111-1111-111111111111"
  const summary = await getPortfolioSummary(portfolioId)
  const events = await getUpcomingEvents(portfolioId, 14)

  return { summary, events }
}

export default async function HomePage() {
  const { summary, events } = await getDashboardData()

  return (
    <main style={{ padding: 24 }}>
      <h1>Franklin Investment OS</h1>
      <h2>Portfolio Summary</h2>
      <p>Total Positions: {summary.total_positions}</p>
      <p>Running Positions: {summary.running_positions}</p>
      <p>Total Notional by Currency</p>
      <pre>{JSON.stringify(summary.total_notional_by_currency, null, 2)}</pre>
      <p>Coupon Income by Currency</p>
      <pre>{JSON.stringify(summary.coupon_income_by_currency, null, 2)}</pre>

      <h2>Upcoming Events (14 days)</h2>
      <pre>{JSON.stringify(events, null, 2)}</pre>

      <h2>Daily Report Preview</h2>
      <p>Use POST /api/reports/daily to generate JSON report.</p>
    </main>
  )
}
