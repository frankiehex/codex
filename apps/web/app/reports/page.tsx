export default function ReportsPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Reports</h1>
      <p>Daily report view: use /api/reports/daily</p>
      <p>Monthly report view: use /api/reports/monthly</p>
      <p>Cashflow summary: use /api/portfolio/:id/cashflow</p>
    </main>
  )
}
